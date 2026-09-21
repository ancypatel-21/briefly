import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, requireUserAndTeam } from "@/lib/api";
import { generateJoinCode } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { team } = await requireUserAndTeam();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const meetings = await prisma.meeting.findMany({
      where: {
        teamId: team.id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        participants: true,
        _count: { select: { actionItems: true } },
      },
      orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  mode: z.enum(["scheduled", "instant"]),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  participants: z
    .array(z.object({ name: z.string().min(1), email: z.string().email().optional() }))
    .optional(),
});

export async function POST(req: Request) {
  try {
    const { user, team } = await requireUserAndTeam();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { title, description, mode, scheduledStart, scheduledEnd, participants } = parsed.data;

    let joinCode = generateJoinCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await prisma.meeting.findUnique({ where: { joinCode } });
      if (!clash) break;
      joinCode = generateJoinCode();
    }

    const meeting = await prisma.meeting.create({
      data: {
        teamId: team.id,
        createdById: user.id,
        title,
        description,
        joinCode,
        status: mode === "instant" ? "LIVE" : "SCHEDULED",
        scheduledStart: scheduledStart ? new Date(scheduledStart) : mode === "instant" ? new Date() : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        startedAt: mode === "instant" ? new Date() : null,
        participants: {
          create: [
            { name: user.name, email: user.email, userId: user.id, role: "HOST", joinedAt: mode === "instant" ? new Date() : null },
            ...(participants ?? []).map((p) => ({ name: p.name, email: p.email })),
          ],
        },
      },
      include: { participants: true },
    });

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
