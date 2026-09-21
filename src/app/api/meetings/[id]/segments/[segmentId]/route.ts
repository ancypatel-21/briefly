import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({ isHighlight: z.boolean() });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; segmentId: string }> },
) {
  try {
    const { team } = await requireUserAndTeam();
    const { id, segmentId } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const segment = await prisma.transcriptSegment.update({
      where: { id: segmentId, meetingId: id },
      data: { isHighlight: parsed.data.isHighlight },
    });

    return NextResponse.json({ segment });
  } catch (error) {
    return handleApiError(error);
  }
}
