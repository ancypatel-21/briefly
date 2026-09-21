import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

/** Marks a scheduled meeting as LIVE (host pressed "Start recording"). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");
    if (meeting.status !== "SCHEDULED") {
      throw new ApiError(409, `Cannot start a meeting that is ${meeting.status.toLowerCase()}`);
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { status: "LIVE", startedAt: new Date() },
    });
    return NextResponse.json({ meeting: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
