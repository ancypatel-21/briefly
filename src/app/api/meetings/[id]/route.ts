import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

async function loadMeetingOrThrow(id: string, teamId: string) {
  const meeting = await prisma.meeting.findFirst({ where: { id, teamId } });
  if (!meeting) throw new ApiError(404, "Meeting not found");
  return meeting;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({
      where: { id, teamId: team.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: true,
        speakers: true,
        summary: true,
        actionItems: { include: { owner: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        segments: { orderBy: { order: "asc" }, include: { speaker: true } },
      },
    });
    if (!meeting) throw new ApiError(404, "Meeting not found");
    return NextResponse.json({ meeting });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
  status: z.enum(["SCHEDULED", "LIVE", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    await loadMeetingOrThrow(id, team.id);

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { scheduledStart, scheduledEnd, ...rest } = parsed.data;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledStart !== undefined ? { scheduledStart: scheduledStart ? new Date(scheduledStart) : null } : {}),
        ...(scheduledEnd !== undefined ? { scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null } : {}),
      },
    });

    return NextResponse.json({ meeting });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    await loadMeetingOrThrow(id, team.id);
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
