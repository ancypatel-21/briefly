import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";
import { LiveRecordingClient } from "@/components/meeting/LiveRecordingClient";

export default async function LiveMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const team = await getCurrentTeam(user.id);
  if (!team) redirect("/login");

  const { id } = await params;
  const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
  if (!meeting) notFound();

  if (meeting.status !== "LIVE") {
    redirect(`/meetings/${id}`);
  }

  return <LiveRecordingClient meetingId={meeting.id} title={meeting.title} joinCode={meeting.joinCode} />;
}
