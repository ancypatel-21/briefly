"use client";

import { useRef, useState } from "react";
import { Mic, Square, UploadCloud } from "lucide-react";

async function uploadFile(meetingId: string, file: File | Blob, filename: string) {
  const formData = new FormData();
  formData.append("file", file, filename);
  const res = await fetch(`/api/meetings/${meetingId}/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed");
  }
}

export function UploadRecordingCard({
  meetingId,
  onUploaded,
  isLive,
}: {
  meetingId: string;
  onUploaded: () => void | Promise<void>;
  isLive: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await uploadFile(meetingId, file, file.name);
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
      setError("Couldn't access your microphone. Check browser permissions, or upload a file instead.");
    }
  }

  async function stopRecording() {
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

    setUploading(true);
    try {
      await uploadFile(meetingId, blob, "recording.webm");
      await onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="mb-1 text-sm font-semibold">Add a recording</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        Upload an audio/video file, or record live from your microphone. We&apos;ll transcribe it, identify speakers,
        and generate a summary.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:hover:bg-white/5"
        >
          <UploadCloud size={16} /> Upload file
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileChange} />

        {isLive && !recording && (
          <button
            onClick={startRecording}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            <Mic size={16} /> Record from microphone
          </button>
        )}
        {recording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Square size={14} /> Stop ({Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")})
          </button>
        )}
        {uploading && <span className="text-sm text-[var(--muted)]">Uploading &amp; processing…</span>}
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}
