"use client";
import { useRef, useState } from "react";
import { SpecialKeys } from "@/components/lesson/Activities";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/client/api";

export function ContributionForm({ languages }: { languages: { code: string; name: string }[] }) {
  const [kind, setKind] = useState("new_vocabulary");
  const [language, setLanguage] = useState(languages[0]?.code ?? "yo");
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function toggleRecord() {
    if (recording) return recRef.current?.stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudio(new Blob(chunks, { type: rec.mimeType }));
        setRecording(false);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      setTimeout(() => rec.state === "recording" && rec.stop(), 15_000);
    } catch {
      setStatus({ tone: "danger", text: "Microphone unavailable. Check your browser permissions." });
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      language,
      kind,
      text,
      translation: fd.get("translation") ?? "",
      dialect: fd.get("dialect") ?? "",
      notes: fd.get("notes") ?? "",
      speakerConsent: fd.get("consent") === "on",
    };
    const body = new FormData();
    body.append("payload", JSON.stringify(payload));
    if (audio) body.append("audio", audio, "pronunciation.webm");
    setPending(true);
    setStatus(null);
    try {
      await api("/api/contributions", { body });
      setStatus({
        tone: "success",
        text: "Thank you! Your contribution is in the review queue. A native-speaker reviewer will check it before it appears in any lesson.",
      });
      formRef.current?.reset();
      setText("");
      setAudio(null);
    } catch (err) {
      setStatus({ tone: "danger", text: err instanceof ApiError ? err.message : "Couldn't submit." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select id="language" label="Language" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </Select>
        <Select
          id="kind"
          label="What are you sharing?"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="new_vocabulary">A new word or phrase</option>
          <option value="correction">A correction</option>
          <option value="dialect_variant">How it&apos;s said where I&apos;m from</option>
          <option value="cultural_note">A cultural note</option>
          <option value="pronunciation">A pronunciation recording</option>
        </Select>
      </div>
      <Field
        id="text"
        label={kind === "cultural_note" ? "Title" : "Word or phrase (with tone marks if you can)"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        className="lang-text"
      />
      <SpecialKeys language={language} onInsert={(s) => setText((t) => t + s)} />
      {kind !== "cultural_note" ? (
        <Field id="translation" name="translation" label="Meaning in English" maxLength={300} />
      ) : null}
      <Field
        id="dialect"
        name="dialect"
        label="Dialect or region (optional)"
        maxLength={120}
        hint="e.g. Ọ̀yọ́, Owerri, Kano"
      />
      <TextArea
        id="notes"
        name="notes"
        label={kind === "cultural_note" ? "The note" : "Context, usage or what needs correcting"}
        maxLength={2000}
      />
      {kind === "pronunciation" ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-2 p-4">
          <Button
            type="button"
            variant={recording ? "accent" : "secondary"}
            onClick={toggleRecord}
            className="self-start"
          >
            {recording ? "Stop recording" : audio ? "Record again" : "Record pronunciation"}
          </Button>
          {audio ? <audio controls src={URL.createObjectURL(audio)} className="w-full" /> : null}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consent" className="mt-1 accent-[var(--color-primary)]" />I am the
            speaker in this recording and I agree to Over Sabi using it in lessons under a CC BY-SA 4.0
            licence. I can ask for it to be removed at any time.
          </label>
        </div>
      ) : null}
      {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Submit for review"}
      </Button>
    </form>
  );
}
