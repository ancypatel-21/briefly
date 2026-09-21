import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";
import { runMeetingPipeline } from "@/lib/processing";
import { UPLOAD_DIR, uploadPathFor } from "@/lib/storage";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["audio/", "video/"];
const MAX_BYTES = 500 * 1024 * 1024; // 500MB

function extensionFor(mime: string) {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
  };
  return map[mime] ?? "bin";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;

    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");
    if (meeting.status === "PROCESSING" || meeting.status === "COMPLETED") {
      throw new ApiError(409, "This meeting has already been recorded and processed");
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Missing file field");
    }
    if (!ALLOWED_TYPES.some((prefix) => file.type.startsWith(prefix))) {
      throw new ApiError(400, "Only audio or video files are accepted");
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(400, "File is too large (max 500MB)");
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = extensionFor(file.type);
    const filename = `${id}-${Date.now()}.${ext}`;
    const filePath = uploadPathFor(filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    await prisma.meeting.update({
      where: { id },
      data: {
        recordingUrl: filename,
        recordingMimeType: file.type,
        status: "PROCESSING",
        endedAt: meeting.endedAt ?? new Date(),
        startedAt: meeting.startedAt ?? new Date(),
      },
    });

    await runMeetingPipeline(id);

    const updated = await prisma.meeting.findUniqueOrThrow({ where: { id } });
    return NextResponse.json({ meeting: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
