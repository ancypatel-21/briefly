import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireUserAndTeam } from "@/lib/api";

/** All action items across the team's meetings — powers the Tasks dashboard. */
export async function GET(req: Request) {
  try {
    const { team } = await requireUserAndTeam();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const ownerUserId = searchParams.get("ownerUserId");

    const actionItems = await prisma.actionItem.findMany({
      where: {
        meeting: { teamId: team.id },
        ...(status ? { status: status as never } : {}),
        ...(ownerUserId ? { ownerUserId } : {}),
      },
      include: {
        meeting: { select: { id: true, title: true } },
        owner: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json({ actionItems });
  } catch (error) {
    return handleApiError(error);
  }
}
