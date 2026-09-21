// Plain JSON-shaped types matching what the API routes return (dates as ISO
// strings) — used on both the server-rendered initial prop and client-side
// refetches so the two line up exactly.

export type MeetingStatus = "SCHEDULED" | "LIVE" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ActionItemStatus = "PENDING" | "IN_PROGRESS" | "DONE";
export type GeneratedBy = "STUB" | "LLM" | "HUMAN";

export type Participant = {
  id: string;
  name: string;
  email: string | null;
  role: "HOST" | "PARTICIPANT";
  userId: string | null;
  joinedAt: string | null;
};

export type Speaker = {
  id: string;
  label: string;
  displayName: string | null;
  color: string;
};

export type TranscriptSegment = {
  id: string;
  speakerId: string;
  startMs: number;
  endMs: number;
  text: string;
  order: number;
  isHighlight: boolean;
  speaker: Speaker;
};

export type MeetingSummary = {
  id: string;
  overview: string;
  keyDecisions: string[];
  openQuestions: string[];
  nextSteps: string[];
  generatedBy: GeneratedBy;
  generatedAt: string;
};

export type ActionItem = {
  id: string;
  meetingId: string;
  description: string;
  ownerName: string | null;
  ownerUserId: string | null;
  owner: { id: string; name: string } | null;
  dueDate: string | null;
  status: ActionItemStatus;
  generatedBy: GeneratedBy;
  createdAt: string;
  meeting?: { id: string; title: string };
};

export type MeetingDetail = {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  joinCode: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  startedAt: string | null;
  endedAt: string | null;
  recordingUrl: string | null;
  recordingMimeType: string | null;
  recordingDurationSec: number | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  participants: Participant[];
  speakers: Speaker[];
  segments: TranscriptSegment[];
  summary: MeetingSummary | null;
  actionItems: ActionItem[];
};
