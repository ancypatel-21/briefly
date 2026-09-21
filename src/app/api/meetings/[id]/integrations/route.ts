import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";
import { pushFollowupTask, pushMeetingRecap } from "@/lib/integrations";
import { IntegrationProvider } from "@/generated/prisma/enums";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({ where: { id, teamId: team.id } });
    if (!meeting) throw new ApiError(404, "Meeting not found");

    const activity = await prisma.integrationActivity.findMany({
      where: { meetingId: id },
      include: { integration: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    return handleApiError(error);
  }
}

const schema = z.object({
  provider: z.enum(Object.values(IntegrationProvider) as [string, ...string[]]),
  action: z.enum(["sync_recap", "create_followup_tasks"]),
});

/** Triggers a stubbed outbound integration action (recap share or follow-up task creation). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const provider = parsed.data.provider as IntegrationProvider;

    const integration = await prisma.integration.findFirst({
      where: { teamId: team.id, provider, status: "CONNECTED" },
    });
    if (!integration) throw new ApiError(409, `${provider} is not connected for this team`);

    if (parsed.data.action === "sync_recap") {
      const activity = await pushMeetingRecap({
        integrationId: integration.id,
        provider,
        meetingId: id,
        meetingTitle: meeting.title,
      });
      return NextResponse.json({ activity: [activity] }, { status: 201 });
    }

    const pendingItems = await prisma.actionItem.findMany({
      where: { meetingId: id, status: { not: "DONE" } },
      take: 10,
    });
    const activity = await Promise.all(
      pendingItems.map((item) =>
        pushFollowupTask({
          integrationId: integration.id,
          provider,
          meetingId: id,
          actionItemDescription: item.description,
        }),
      ),
    );

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
