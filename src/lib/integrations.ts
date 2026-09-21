import { prisma } from "@/lib/db";
import type { IntegrationProvider } from "@/generated/prisma/enums";

/**
 * STUB integrations layer.
 *
 * This wires up the full framework — connection state, a per-team settings
 * UI, and the trigger points where Briefly would push data out (follow-up
 * tasks, meeting recaps) — without making any real outbound API calls yet.
 * Swap the bodies of `pushFollowupTask` / `pushMeetingRecap` for real
 * provider SDK calls (Google Calendar, Slack, Notion, Jira, Linear) later;
 * everything else (DB models, routes, UI) is already in place.
 */

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  GOOGLE_CALENDAR: "Google Calendar",
  SLACK: "Slack",
  NOTION: "Notion",
  JIRA: "Jira",
  LINEAR: "Linear",
};

export const PROVIDER_DESCRIPTIONS: Record<IntegrationProvider, string> = {
  GOOGLE_CALENDAR: "Pull scheduled meetings in automatically and keep times in sync.",
  SLACK: "Post meeting recaps to a channel as soon as a meeting is processed.",
  NOTION: "Save structured meeting summaries into a Notion database.",
  JIRA: "Turn action items into Jira issues with owners and due dates.",
  LINEAR: "Turn action items into Linear issues with owners and due dates.",
};

function fakeExternalId(provider: IntegrationProvider) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  switch (provider) {
    case "JIRA":
      return `PROJ-${rand}`;
    case "LINEAR":
      return `ENG-${rand}`;
    case "SLACK":
      return `#meeting-recaps`;
    case "NOTION":
      return `Meeting Notes / ${rand}`;
    case "GOOGLE_CALENDAR":
      return `event-${rand}`;
  }
}

/** Simulates pushing one action item out as a follow-up task. */
export async function pushFollowupTask(params: {
  integrationId: string;
  provider: IntegrationProvider;
  meetingId: string;
  actionItemDescription: string;
}) {
  const targetLabel = fakeExternalId(params.provider);
  return prisma.integrationActivity.create({
    data: {
      integrationId: params.integrationId,
      meetingId: params.meetingId,
      action: "create_followup_task",
      targetLabel,
      detail: `(stub) Would create a ${PROVIDER_LABELS[params.provider]} task "${params.actionItemDescription}"`,
    },
  });
}

/** Simulates sharing a meeting recap (summary) out to a provider. */
export async function pushMeetingRecap(params: {
  integrationId: string;
  provider: IntegrationProvider;
  meetingId: string;
  meetingTitle: string;
}) {
  const targetLabel = fakeExternalId(params.provider);
  return prisma.integrationActivity.create({
    data: {
      integrationId: params.integrationId,
      meetingId: params.meetingId,
      action: "sync_recap",
      targetLabel,
      detail: `(stub) Would post a recap of "${params.meetingTitle}" to ${PROVIDER_LABELS[params.provider]}`,
    },
  });
}
