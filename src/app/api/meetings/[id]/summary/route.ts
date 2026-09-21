import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({
  overview: z.string().min(1).optional(),
  keyDecisions: z.array(z.string()).optional(),
  openQuestions: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

/** Allows a human to edit the (stub-generated) summary — marks it as HUMAN authored. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const summary = await prisma.meetingSummary.update({
      where: { meetingId: id },
      data: { ...parsed.data, generatedBy: "HUMAN" },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    return handleApiError(error);
  }
}
