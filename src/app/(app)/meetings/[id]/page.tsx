import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { MeetingDetailClient } from "@/components/meeting/MeetingDetailClient";
import type { MeetingDetail } from "@/types/meeting";

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

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

  if (!meeting) notFound();

  const serialized: MeetingDetail = JSON.parse(JSON.stringify(meeting));

  return <MeetingDetailClient initialMeeting={serialized} currentUserId={user.id} />;
}
