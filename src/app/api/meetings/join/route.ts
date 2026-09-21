import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({ joinCode: z.string().min(1) });

/** Joins a meeting by its short join code, adding the current user as a participant. */
export async function POST(req: Request) {
  try {
    const { user, team } = await requireUserAndTeam();
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: { joinCode: parsed.data.joinCode.trim().toLowerCase(), teamId: team.id },
    });
    if (!meeting) throw new ApiError(404, "No meeting found with that join code");

    await prisma.meetingParticipant.upsert({
      where: { meetingId_email: { meetingId: meeting.id, email: user.email } },
      create: { meetingId: meeting.id, userId: user.id, name: user.name, email: user.email, joinedAt: new Date() },
      update: { joinedAt: new Date() },
    });

    return NextResponse.json({ meetingId: meeting.id });
  } catch (error) {
    return handleApiError(error);
  }
}
