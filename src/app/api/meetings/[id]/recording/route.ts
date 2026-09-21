import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";
import { uploadPathFor } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");
    if (!meeting.recordingUrl) throw new ApiError(404, "No recording for this meeting");

    const filePath = uploadPathFor(meeting.recordingUrl);

    const fileStat = await stat(filePath).catch(() => null);
    if (!fileStat) throw new ApiError(404, "Recording file missing on disk");

    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": meeting.recordingMimeType ?? "application/octet-stream",
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
