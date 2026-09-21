import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireUserAndTeam } from "@/lib/api";

export async function GET() {
  try {
    const { team } = await requireUserAndTeam();

    const [totalMeetings, completedMeetings, upcomingMeetings, openActionItems, doneActionItems, recentMeetings] =
      await Promise.all([
        prisma.meeting.count({ where: { teamId: team.id } }),
        prisma.meeting.count({ where: { teamId: team.id, status: "COMPLETED" } }),
        prisma.meeting.findMany({
          where: { teamId: team.id, status: "SCHEDULED", scheduledStart: { gte: new Date() } },
          orderBy: { scheduledStart: "asc" },
          take: 5,
        }),
        prisma.actionItem.count({ where: { meeting: { teamId: team.id }, status: { not: "DONE" } } }),
        prisma.actionItem.count({ where: { meeting: { teamId: team.id }, status: "DONE" } }),
        prisma.meeting.findMany({
          where: { teamId: team.id, status: "COMPLETED" },
          orderBy: { endedAt: "desc" },
          take: 5,
          include: { summary: true },
        }),
      ]);

    const overdueActionItems = await prisma.actionItem.count({
      where: {
        meeting: { teamId: team.id },
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      totalMeetings,
      completedMeetings,
      upcomingMeetings,
      openActionItems,
      doneActionItems,
      overdueActionItems,
      recentMeetings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
