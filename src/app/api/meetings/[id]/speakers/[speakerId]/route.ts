import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({ displayName: z.string().min(1).max(100) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; speakerId: string }> },
) {
  try {
    const { team } = await requireUserAndTeam();
    const { id, speakerId } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const speaker = await prisma.speaker.update({
      where: { id: speakerId, meetingId: id },
      data: { displayName: parsed.data.displayName },
    });

    return NextResponse.json({ speaker });
  } catch (error) {
    return handleApiError(error);
  }
}
