import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({
  description: z.string().min(1).max(500),
  ownerName: z.string().max(100).optional(),
  ownerUserId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        meetingId: id,
        description: parsed.data.description,
        ownerName: parsed.data.ownerName,
        ownerUserId: parsed.data.ownerUserId,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        generatedBy: "HUMAN",
      },
    });

    return NextResponse.json({ actionItem }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
