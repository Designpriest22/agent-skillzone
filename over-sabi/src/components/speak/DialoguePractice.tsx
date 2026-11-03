"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconMic, IconPlay } from "@/components/ui/icons";

export interface PracticeDialogue {
  id: string;
  setting: string;
  lines: { speaker: string; text: string; translation: string }[];
  prompt: string;
  modelReply: string;
  explanation: string;
}

/**
 * Speaking practice that needs no AI or speech service: read the exchange, record
 * yourself saying the reply, play it back and compare with the model answer.
 * Recordings stay in this browser and are never uploaded.
 */
export function DialoguePractice({
  dialogues,
  language,
}: {
  dialogues: PracticeDialogue[];
  language: string;
}) {
  return (
    <ol className="flex flex-col gap-6">
      {dialogues.map((d) => (
        <li key={d.id}>
          <DialogueCard d={d} language={language} />
        </li>
      ))}
    </ol>
  );
}

function DialogueCard({ d, language }: { d: PracticeDialogue; language: string }) {
  const [revealed, setRevealed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  async function toggle() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
        });
        setRecording(false);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
      window.setTimeout(() => rec.state === "recording" && rec.stop(), 20_000);
    } catch {
      setError("Microphone unavailable. You can still read the reply aloud and reveal the answer.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <p className="text-sm italic text-muted">{d.setting}</p>
      {d.lines.map((l, i) => (
        <div key={i} className="max-w-[85%] rounded-2xl bg-surface-2 px-4 py-3">
          <p className="text-xs font-semibold text-muted">{l.speaker}</p>
          <p className="lang-text text-xl font-semibold" lang={language}>
            {l.text}
          </p>
          <p className="text-sm text-muted">{l.translation}</p>
        </div>
      ))}
      <p className="font-semibold">{d.prompt}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={recording ? "accent" : "secondary"}
          onClick={toggle}
          aria-pressed={recording}
        >
          <span className="h-5 w-5">
            <IconMic />
          </span>
          {recording ? "Stop" : url ? "Record again" : "Record your reply"}
        </Button>
        {url ? (
          <Button type="button" variant="ghost" onClick={() => new Audio(url).play()}>
            <span className="h-5 w-5">
              <IconPlay />
            </span>
            Play yourself back
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={() => setRevealed(true)} disabled={revealed}>
          Show the model reply
        </Button>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {revealed ? (
        <div className="rounded-2xl border-l-4 border-primary bg-bg px-4 py-3">
          <p className="lang-text text-xl font-bold" lang={language}>
            {d.modelReply}
          </p>
          <p className="text-sm text-muted">{d.explanation}</p>
        </div>
      ) : null}
    </div>
  );
}
