"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiBadge, TutorAvatar } from "@/components/brand/TutorAvatar";
import { ReportButton } from "@/components/content/ReportButton";
import { SpecialKeys } from "@/components/lesson/Activities";
import { Button, ButtonLink } from "@/components/ui/Button";
import { IconMic, IconMicOff, IconPlay, IconSend } from "@/components/ui/icons";
import { Badge, Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";
import { ACHIEVEMENT_NAMES } from "@/lib/achievement-names";
import type { SessionSummary } from "@/lib/ai/schemas";
import type { PublicTurn } from "@/lib/services/tutor";

type RoomState = "idle" | "listening" | "transcribing" | "thinking" | "speaking";
type Capability = { status: "available" | "experimental" | "unavailable"; reason: string };

export interface SpeakingRoomProps {
  sessionId: string;
  language: { code: string; name: string };
  tutor: { id: string; name: string; avatarKey: string };
  initialTurns: PublicTurn[];
  endsAt: string;
  ended: boolean;
  initialSummary: SessionSummary | null;
  speed: number;
  translationAssist: boolean;
  stt: Capability;
  tts: Capability;
  voiceConsent: boolean;
}

const STATE_LABEL: Record<RoomState, string> = {
  idle: "Your turn",
  listening: "Listening…",
  transcribing: "Writing down what you said…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

const SILENCE_MS = 1500;

/** Wall-clock helper (kept outside the component: only ever called from event handlers). */
const now = () => Date.now();
const MAX_RECORDING_MS = 30_000;

export function SpeakingRoom(props: SpeakingRoomProps) {
  const [turns, setTurns] = useState(props.initialTurns);
  const [state, setState] = useState<RoomState>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [muted, setMuted] = useState(props.tts.status === "unavailable");
  const [online, setOnline] = useState(true);
  const [remaining, setRemaining] = useState(() => new Date(props.endsAt).getTime() - Date.now());
  const [summary, setSummary] = useState<SessionSummary | null>(props.initialSummary);
  const [ended, setEnded] = useState(props.ended);
  const [endResult, setEndResult] = useState<{ xpEarned: number; newAchievements: string[] } | null>(null);
  const [showTranslations, setShowTranslations] = useState(props.translationAssist);
  const [consent, setConsent] = useState(props.voiceConsent);
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());
  const [lastInputMode, setLastInputMode] = useState<"voice" | "text">("text");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startedAtRef = useRef(0);

  // Connection status + countdown.
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const t = window.setInterval(() => setRemaining(new Date(props.endsAt).getTime() - Date.now()), 1000);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.clearInterval(t);
    };
  }, [props.endsAt]);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Release the microphone when leaving the room.
  useEffect(() => () => stopStream(), []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState((s) => (s === "speaking" ? "idle" : s));
  }, []);

  async function speak(turn: PublicTurn) {
    if (muted || props.tts.status === "unavailable") return;
    setState("speaking");
    try {
      const res = await fetch("/api/speech/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: turn.text, language: props.language.code, speed: props.speed }),
      });
      if (!res.ok)
        throw new ApiError(
          ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Voice unavailable",
          res.status,
          "tts",
        );
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) audioRef.current = null;
        setState("idle");
      };
      await audio.play();
    } catch (err) {
      setNotice(
        err instanceof ApiError
          ? `${err.message} Replies will stay as text.`
          : "Couldn't play the tutor's voice.",
      );
      setMuted(true);
      setState("idle");
    }
  }

  async function send(messageText: string, inputMode: "voice" | "text") {
    const trimmed = messageText.trim();
    if (!trimmed || state === "thinking") return;
    stopAudio();
    setError(null);
    setState("thinking");
    try {
      const r = await api<{ learner: PublicTurn; tutor: PublicTurn }>(
        `/api/tutor/sessions/${props.sessionId}/turns`,
        {
          body: { text: trimmed, inputMode, sttProvider: inputMode === "voice" ? "server" : undefined },
        },
      );
      setTurns((t) => [...t, r.learner, r.tutor]);
      setText("");
      setState("idle");
      void speak(r.tutor);
    } catch (err) {
      // Keep the learner's words in the box so nothing is lost.
      setText(trimmed);
      setState("idle");
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the tutor. Check your connection and send again.",
      );
      if (err instanceof ApiError && (err.code === "session_time_up" || err.code === "session_ended"))
        setRemaining(0);
    }
  }

  async function grantConsent() {
    try {
      await api("/api/profile", { method: "PATCH", body: { voiceProcessingConsent: true } });
      setConsent(true);
      void startRecording();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your choice.");
    }
  }

  async function startRecording() {
    setError(null);
    stopAudio(); // barge-in: talking over the tutor stops its audio
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser can't record audio. Type your reply instead.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Microphone access is blocked. Allow it in your browser's site settings, or type your reply."
          : name === "NotFoundError"
            ? "We couldn't find a microphone. Plug one in or type your reply."
            : "The microphone couldn't start. Type your reply instead.",
      );
      return;
    }
    streamRef.current = stream;
    const mime =
      ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ??
      "";
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      stopStream();
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
      const seconds = (now() - startedAtRef.current) / 1000;
      void transcribe(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), seconds);
    };
    recorderRef.current = recorder;
    startedAtRef.current = now();
    recorder.start(250);
    setState("listening");
    stopTimerRef.current = window.setTimeout(() => stopRecording(), MAX_RECORDING_MS);
    watchSilence(stream);
  }

  /** Simple energy-based voice activity detection: stop after a pause once speech has started. */
  function watchSilence(stream: MediaStream) {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let heardSpeech = false;
      let lastLoud = now();
      const tick = () => {
        if (recorderRef.current?.state !== "recording") {
          void ctx.close();
          return;
        }
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += ((v - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / data.length);
        if (rms > 0.04) {
          heardSpeech = true;
          lastLoud = now();
        } else if (heardSpeech && now() - lastLoud > SILENCE_MS) {
          stopRecording();
          void ctx.close();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      /* VAD unavailable: learner taps again to stop */
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function transcribe(blob: Blob, seconds: number) {
    if (blob.size < 1200) {
      setState("idle");
      setNotice("That was very short — try again, or type your reply.");
      return;
    }
    setState("transcribing");
    const form = new FormData();
    form.append("audio", blob, "speech.webm");
    form.append("language", props.language.code);
    form.append("seconds", String(Math.round(seconds)));
    try {
      const r = await api<{ text: string; status: string }>("/api/speech/transcribe", { body: form });
      setLastInputMode("voice");
      if (r.status === "available") {
        setState("idle");
        void send(r.text, "voice");
      } else {
        // Experimental transcription: the learner confirms or fixes it before sending.
        setText(r.text);
        setState("idle");
        setNotice("Check the transcription below, fix anything that's wrong, then send.");
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } catch (err) {
      setState("idle");
      setError(err instanceof ApiError ? err.message : "Transcription failed. Type your reply instead.");
    }
  }

  async function end() {
    stopAudio();
    stopRecording();
    setState("thinking");
    try {
      const r = await api<{ summary: SessionSummary | null; xpEarned: number; newAchievements: string[] }>(
        `/api/tutor/sessions/${props.sessionId}/end`,
        { method: "POST" },
      );
      setSummary(r.summary);
      setEndResult(r);
      setEnded(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't end the session. Try again.");
    } finally {
      setState("idle");
    }
  }

  async function savePhrase(term: string, meaning: string) {
    try {
      await api("/api/vocabulary/custom", { body: { language: props.language.code, term, meaning } });
      setSavedTerms((s) => new Set(s).add(term));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that phrase.");
    }
  }

  const timeUp = remaining <= 0;
  const mm = Math.max(0, Math.floor(remaining / 60000));
  const ss = Math.max(0, Math.floor((remaining % 60000) / 1000));
  const micAvailable = props.stt.status !== "unavailable";
  const busy = state === "thinking" || state === "transcribing";

  if (ended) {
    return (
      <SessionSummaryView
        summary={summary}
        language={props.language}
        xpEarned={endResult?.xpEarned}
        achievements={endResult?.newAchievements ?? []}
        onSave={savePhrase}
        saved={savedTerms}
        sessionId={props.sessionId}
      />
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <TutorAvatar avatarKey={props.tutor.avatarKey} name={props.tutor.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            {props.tutor.name} <AiBadge />
          </p>
          <p className="text-xs text-muted">
            {props.language.name} ·{" "}
            <span aria-live="off">{timeUp ? "Time's up" : `${mm}:${String(ss).padStart(2, "0")} left`}</span>
            {!online ? <span className="ml-2 font-semibold text-danger">Offline</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMuted((m) => !m);
            stopAudio();
          }}
          disabled={props.tts.status === "unavailable"}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          aria-pressed={!muted}
          title={props.tts.status === "unavailable" ? props.tts.reason : undefined}
        >
          {props.tts.status === "unavailable" ? "Voice off" : muted ? "Tutor voice: off" : "Tutor voice: on"}
        </button>
        <Button size="sm" variant="secondary" onClick={end} disabled={busy}>
          End
        </Button>
      </div>

      {/* Transcript */}
      <ol
        ref={listRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto py-4"
        aria-label="Conversation"
        aria-live="polite"
      >
        {turns.map((t) => (
          <li
            key={t.id}
            className={`flex flex-col gap-1 ${t.role === "learner" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${t.role === "learner" ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm bg-surface-2"}`}
            >
              <p className="lang-text text-lg" lang={t.role === "tutor" ? props.language.code : undefined}>
                {t.text}
              </p>
              {t.role === "tutor" && t.translation && showTranslations ? (
                <p className="mt-1 text-sm text-muted">{t.translation}</p>
              ) : null}
              {t.role === "learner" && t.inputMode === "voice" ? (
                <p className="mt-1 text-[0.7rem] opacity-70">spoken</p>
              ) : null}
            </div>
            {t.role === "tutor" ? (
              <div className="flex max-w-[85%] flex-col gap-2 pl-1">
                {t.corrections.length ? (
                  <details className="rounded-xl border border-border bg-surface px-3 py-2 text-sm" open>
                    <summary className="cursor-pointer font-semibold">
                      {t.corrections.length} correction{t.corrections.length > 1 ? "s" : ""}
                    </summary>
                    <ul className="mt-2 flex flex-col gap-2">
                      {t.corrections.map((c, i) => (
                        <li key={i}>
                          <span className="lang-text line-through opacity-70">{c.original}</span> →{" "}
                          <strong className="lang-text">{c.corrected}</strong>
                          <span className="block text-muted">{c.explanation}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                {t.newVocabulary.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {t.newVocabulary.map((v) => (
                      <li key={v.term}>
                        <button
                          type="button"
                          onClick={() => savePhrase(v.term, v.meaning)}
                          disabled={savedTerms.has(v.term)}
                          className="rounded-full border border-border bg-surface px-3 py-1 text-sm hover:border-primary disabled:opacity-60"
                          title="Save to your notebook (marked unverified)"
                        >
                          <span className="lang-text font-semibold">{v.term}</span> · {v.meaning}{" "}
                          {savedTerms.has(v.term) ? "✓" : "+"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {t.uncertainty ? <p className="text-xs text-warning">Tutor note: {t.uncertainty}</p> : null}
                <div className="flex items-center gap-3 text-xs">
                  {props.tts.status !== "unavailable" ? (
                    <button
                      type="button"
                      onClick={() => speak(t)}
                      className="inline-flex items-center gap-1 underline"
                      aria-label="Play this reply"
                    >
                      <span className="h-3.5 w-3.5">
                        <IconPlay />
                      </span>
                      Replay
                    </button>
                  ) : null}
                  <ReportButton entityType="tutor_reply" entityId={t.id} language={props.language.code} />
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Status + composer */}
      <div className="flex flex-col gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            role="status"
            aria-live="assertive"
            className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider"
          >
            <span
              className={`relative inline-block h-3 w-3 rounded-full ${
                state === "listening"
                  ? "os-pulse bg-spark text-spark"
                  : state === "speaking"
                    ? "os-pulse bg-accent text-accent"
                    : busy
                      ? "bg-indigo animate-pulse"
                      : "bg-primary"
              }`}
              aria-hidden
            />
            {STATE_LABEL[state]}
          </p>
          <div className="flex items-center gap-3 text-xs">
            {props.translationAssist ? (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showTranslations}
                  onChange={(e) => setShowTranslations(e.target.checked)}
                  className="accent-[var(--color-primary)]"
                />
                Translations
              </label>
            ) : null}
            {props.stt.status === "experimental" ? (
              <Badge tone="warning">Voice input: experimental</Badge>
            ) : null}
          </div>
        </div>

        {error ? (
          <Notice tone="danger">
            {error}
            {!online ? " You're offline — we'll keep your message here." : null}
          </Notice>
        ) : null}
        {notice ? (
          <p className="text-sm text-muted" role="status">
            {notice}{" "}
            <button type="button" className="underline" onClick={() => setNotice(null)}>
              Dismiss
            </button>
          </p>
        ) : null}

        {timeUp ? (
          <Notice tone="info" title="Time's up for this session">
            End the session to see your summary and corrections.
          </Notice>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text, lastInputMode);
              setLastInputMode("text");
            }}
          >
            {micAvailable ? (
              consent ? (
                <button
                  type="button"
                  onClick={() => (state === "listening" ? stopRecording() : startRecording())}
                  disabled={busy || !online}
                  aria-label={state === "listening" ? "Stop recording" : "Speak"}
                  aria-pressed={state === "listening"}
                  className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full ${state === "listening" ? "bg-spark text-ink" : "bg-ink text-sand"} disabled:opacity-50`}
                >
                  <span className="h-6 w-6">{state === "listening" ? <IconMicOff /> : <IconMic />}</span>
                </button>
              ) : null
            ) : null}
            <div className="flex flex-1 flex-col gap-2">
              <label htmlFor="message" className="sr-only">
                Your message
              </label>
              <textarea
                id="message"
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(text, lastInputMode);
                    setLastInputMode("text");
                  }
                }}
                rows={1}
                maxLength={1000}
                disabled={state === "listening" || state === "transcribing"}
                placeholder={micAvailable ? "Tap the mic or type…" : "Type your reply…"}
                className="lang-text max-h-32 min-h-14 w-full resize-none rounded-2xl border-2 border-border bg-surface px-4 py-3.5 text-lg focus:border-primary"
                lang={props.language.code}
              />
            </div>
            <button
              type="submit"
              disabled={!text.trim() || busy || !online}
              aria-label="Send"
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-on-primary disabled:opacity-50"
            >
              <span className="h-6 w-6">
                <IconSend />
              </span>
            </button>
          </form>
        )}
        {!timeUp ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SpecialKeys language={props.language.code} onInsert={(s) => setText((t) => t + s)} />
            {micAvailable && !consent ? (
              <div className="flex flex-col gap-2 rounded-xl bg-surface-2 p-3 text-sm sm:max-w-md">
                <p>
                  To use your voice, your recording is sent to our speech provider to turn it into text. We
                  don&apos;t keep the audio.
                </p>
                <Button size="sm" variant="secondary" className="self-start" onClick={grantConsent}>
                  Allow and use my microphone
                </Button>
              </div>
            ) : null}
            {!micAvailable ? <p className="text-xs text-muted">Voice input: {props.stt.reason}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SessionSummaryView({
  summary,
  language,
  xpEarned,
  achievements,
  onSave,
  saved,
  sessionId,
}: {
  summary: SessionSummary | null;
  language: { code: string; name: string };
  xpEarned?: number;
  achievements: string[];
  onSave: (term: string, meaning: string) => void;
  saved: Set<string>;
  sessionId: string;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">Session complete</p>
      <h1 className="text-4xl font-extrabold">How it went</h1>
      {xpEarned !== undefined ? <p className="text-lg">+{xpEarned} XP</p> : null}
      {achievements.length ? (
        <Notice tone="success" title="New achievement">
          {achievements.map((a) => ACHIEVEMENT_NAMES[a] ?? a).join(", ")}
        </Notice>
      ) : null}
      {summary ? (
        <>
          <p className="text-lg">{summary.summary}</p>
          {summary.usefulExpressions.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Useful expressions</h2>
              <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
                {summary.usefulExpressions.map((e) => (
                  <li key={e.term} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span>
                      <span className="lang-text font-semibold" lang={language.code}>
                        {e.term}
                      </span>{" "}
                      — {e.meaning}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saved.has(e.term)}
                      onClick={() => onSave(e.term, e.meaning)}
                    >
                      {saved.has(e.term) ? "Saved" : "Save"}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {summary.keyCorrections.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Important corrections</h2>
              <ul className="flex flex-col gap-2">
                {summary.keyCorrections.map((c, i) => (
                  <li key={i} className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                    <span className="lang-text line-through opacity-70">{c.original}</span> →{" "}
                    <strong className="lang-text">{c.corrected}</strong>
                    <span className="block text-muted">{c.explanation}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {summary.grammarInsights.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Grammar insights</h2>
              <ul className="list-disc pl-5">
                {summary.grammarInsights.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-xl font-bold">Pronunciation</h2>
            <p className="text-sm text-muted">
              Not assessed. Your tutor works from text, so it can&apos;t judge pronunciation or tone reliably
              for {language.name} yet. We&apos;ll only add pronunciation scores once they&apos;re validated
              with native speakers.
            </p>
          </section>
          {summary.reviewPhrases.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Practise next time</h2>
              <p className="lang-text">{summary.reviewPhrases.join(" · ")}</p>
            </section>
          ) : null}
          <Notice tone="info" title="Next step">
            {summary.nextStep}
          </Notice>
          {summary.caveats ? <p className="text-xs text-muted">{summary.caveats}</p> : null}
        </>
      ) : (
        <Notice tone="info">
          No summary for this session — it was too short or the tutor couldn&apos;t generate one. Your
          transcript is saved.
        </Notice>
      )}
      <p className="text-xs text-muted">
        AI feedback is learning guidance, not a final authority. Saved phrases are marked unverified in your
        notebook.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/speak">New conversation</ButtonLink>
        <ButtonLink href={`/speak/history/${sessionId}`} variant="secondary">
          View transcript
        </ButtonLink>
        <ButtonLink href="/review" variant="ghost">
          Review words
        </ButtonLink>
      </div>
    </div>
  );
}
