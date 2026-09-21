"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, UploadCloud, Copy } from "lucide-react";

export function LiveRecordingClient({ meetingId, title, joinCode }: { meetingId: string; title: string; joinCode: string }) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError("Couldn't access your microphone. You can upload a recording afterwards instead.");
    }
  }

  async function stopAndUpload() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setRecording(false);
    const blob: Blob = await new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })),
        { once: true },
      );
      recorder.stop();
    });
    await upload(blob, "recording.webm");
  }

  async function upload(file: File | Blob, filename: string) {
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file, filename);
      const res = await fetch(`/api/meetings/${meetingId}/upload`, { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      router.push(`/meetings/${meetingId}`);
      router.refresh();
    } finally {
      setProcessing(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await upload(file, file.name);
  }

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <p className="mb-1 text-xs uppercase tracking-wide text-[var(--muted)]">Live meeting</p>
      <h1 className="mb-1 text-2xl font-semibold">{title}</h1>
      <button
        onClick={() => navigator.clipboard.writeText(joinCode)}
        className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <Copy size={12} /> Join code: {joinCode}
      </button>

      <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full ${recording ? "animate-pulse bg-red-500/10" : "bg-brand/10"}`}
        >
          {recording ? <Square size={28} className="text-red-500" /> : <Mic size={28} className="text-brand" />}
        </div>
        <div className="font-mono text-lg tabular-nums">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </div>
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={processing}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            Start recording
          </button>
        ) : (
          <button
            onClick={stopAndUpload}
            disabled={processing}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {processing ? "Processing…" : "Stop & process"}
          </button>
        )}
      </div>

      <div className="text-sm text-[var(--muted)]">
        Recording from the browser mic not working?{" "}
        <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 text-brand hover:underline">
          <UploadCloud size={14} /> Upload a file instead
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
