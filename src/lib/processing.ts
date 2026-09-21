import { prisma } from "@/lib/db";
import { colorForIndex, hashSeed, mulberry32 } from "@/lib/utils";

/**
 * STUB meeting-intelligence pipeline.
 *
 * Real speech-to-text + speaker diarization, summarization, and action-item
 * extraction all require either an LLM/ASR API or a local model — that's the
 * "LLM part" being deferred for now. This module generates deterministic,
 * clearly-labeled placeholder output so the rest of the product (transcript
 * viewer, timeline, summaries, action items) can be built and used end to
 * end today.
 *
 * To wire in the real thing later: replace the body of `runMeetingPipeline`
 * with calls to your ASR/diarization service and LLM, keeping the same
 * writes to Speaker / TranscriptSegment / MeetingSummary / ActionItem, and
 * set `generatedBy: "LLM"` instead of `"STUB"`.
 */

const OPENING_LINES = [
  "Alright, thanks everyone for joining — let's get started.",
  "Okay, I think we're all here, let's dive in.",
  "Let's kick things off with a quick round of updates.",
];

const STATUS_LINES = [
  "Since last time, I've made good progress on my part — most of it is wrapped up.",
  "I ran into a blocker mid-week but got past it by yesterday.",
  "That workstream is roughly on track, though we're a little behind on the timeline.",
  "I paired with the team on this and we're close to done.",
  "Nothing major to report — steady progress, no surprises.",
];

const DISCUSSION_LINES = [
  "I think we need to weigh the tradeoffs here a bit more before committing.",
  "That's a fair point — what would it take to validate that assumption?",
  "Let's make sure we're not over-engineering this for a problem we don't have yet.",
  "I want to flag a risk: this could slip if the dependency isn't ready in time.",
  "Can we get alignment from the other team before we lock this in?",
];

const DECISION_LINES = [
  "Let's go with that approach — I'll consider this decided unless anyone objects.",
  "Agreed, we'll move forward with option two and revisit if new information comes up.",
  "Okay, decision made: we're prioritizing this for the current cycle.",
  "We'll lock in that plan and communicate it to the wider team.",
];

const QUESTION_LINES = [
  "Open question for the group — do we have a clear owner for this yet?",
  "Still unresolved: what's our fallback if the timeline doesn't hold?",
  "We should double check whether this affects any of our existing commitments.",
  "Not sure yet who's responsible for the follow-up here — worth clarifying.",
];

const CLOSING_LINES = [
  "Great, I think we covered everything — thanks all.",
  "Let's wrap here and follow up async on anything outstanding.",
  "Sounds good, same time next week. Thanks everyone.",
];

const TASK_VERBS = [
  "Draft a proposal for",
  "Follow up with the team on",
  "Put together a doc summarizing",
  "Schedule a follow-up on",
  "Investigate the open question around",
  "Share an update on",
];

const TASK_TOPICS = [
  "the rollout plan",
  "the current blockers",
  "next quarter's priorities",
  "the outstanding risk we flagged",
  "the decision from today's discussion",
  "the dependency timeline",
];

type StubSpeaker = {
  label: string;
  displayName: string | null;
  color: string;
};

type StubSegment = {
  speakerIndex: number;
  startMs: number;
  endMs: number;
  text: string;
  isHighlight: boolean;
  tag: "decision" | "question" | "status" | "discussion" | "misc";
};

function pick<T>(rng: () => number, arr: T[]) {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateStubTranscript(
  seedInput: string,
  participantNames: string[],
) {
  const rng = mulberry32(hashSeed(seedInput));

  const names =
    participantNames.length > 0
      ? participantNames
      : ["Speaker 1", "Speaker 2", "Speaker 3"];

  const speakers: StubSpeaker[] = names.map((name, i) => ({
    label: `Speaker ${i + 1}`,
    displayName: participantNames.length > 0 ? name : null,
    color: colorForIndex(i),
  }));

  const segments: StubSegment[] = [];
  let cursorMs = 0;

  function addLine(speakerIndex: number, text: string, tag: StubSegment["tag"]) {
    const durationMs = 4000 + Math.floor(rng() * 9000);
    segments.push({
      speakerIndex,
      startMs: cursorMs,
      endMs: cursorMs + durationMs,
      text,
      isHighlight: tag === "decision",
      tag,
    });
    cursorMs += durationMs + 300;
  }

  addLine(0, pick(rng, OPENING_LINES), "misc");

  // Status-update round
  speakers.forEach((_, i) => addLine(i, pick(rng, STATUS_LINES), "status"));

  // A couple of discussion / decision / question beats
  const beats: StubSegment["tag"][] = [
    "discussion",
    "discussion",
    "decision",
    "question",
    "discussion",
    "decision",
    "question",
  ];
  beats.forEach((tag, i) => {
    const speakerIndex = i % speakers.length;
    const bank =
      tag === "discussion"
        ? DISCUSSION_LINES
        : tag === "decision"
          ? DECISION_LINES
          : QUESTION_LINES;
    addLine(speakerIndex, pick(rng, bank), tag);
  });

  addLine(speakers.length > 1 ? 1 : 0, pick(rng, CLOSING_LINES), "misc");

  return { speakers, segments, durationMs: cursorMs };
}

export function generateStubActionItems(
  seedInput: string,
  participantNames: string[],
  meetingDate: Date,
) {
  const rng = mulberry32(hashSeed(seedInput + ":actions"));
  const count = 2 + Math.floor(rng() * 2); // 2-3 items
  const items: { description: string; ownerName: string | null; dueDate: Date }[] = [];

  for (let i = 0; i < count; i++) {
    const verb = pick(rng, TASK_VERBS);
    const topic = pick(rng, TASK_TOPICS);
    const owner =
      participantNames.length > 0
        ? participantNames[Math.floor(rng() * participantNames.length)]
        : null;
    const dueDate = new Date(meetingDate);
    dueDate.setDate(dueDate.getDate() + 3 + Math.floor(rng() * 7));
    items.push({ description: `${verb} ${topic}.`, ownerName: owner, dueDate });
  }

  return items;
}

/** Runs the full stub pipeline for a meeting that has a recording attached. */
export async function runMeetingPipeline(meetingId: string) {
  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: meetingId },
    include: { participants: true },
  });

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "PROCESSING" },
  });

  const participantNames = meeting.participants.map((p) => p.name);
  const { speakers, segments, durationMs } = generateStubTranscript(
    meetingId,
    participantNames,
  );

  const createdSpeakers = await Promise.all(
    speakers.map((s) =>
      prisma.speaker.create({
        data: {
          meetingId,
          label: s.label,
          displayName: s.displayName,
          color: s.color,
        },
      }),
    ),
  );

  await prisma.transcriptSegment.createMany({
    data: segments.map((seg, order) => ({
      meetingId,
      speakerId: createdSpeakers[seg.speakerIndex].id,
      startMs: seg.startMs,
      endMs: seg.endMs,
      text: seg.text,
      order,
      isHighlight: seg.isHighlight,
    })),
  });

  const decisions = segments.filter((s) => s.tag === "decision").map((s) => s.text);
  const questions = segments.filter((s) => s.tag === "question").map((s) => s.text);

  await prisma.meetingSummary.create({
    data: {
      meetingId,
      overview:
        "This is placeholder content generated by Briefly's stub pipeline (no LLM connected yet). " +
        "Once summarization is wired up, this section will contain a real AI-generated overview of the discussion.",
      keyDecisions: decisions.length > 0 ? decisions : ["No decisions detected in this placeholder transcript."],
      openQuestions: questions.length > 0 ? questions : ["No open questions detected in this placeholder transcript."],
      nextSteps: ["See Action Items below for the generated next steps."],
      generatedBy: "STUB",
    },
  });

  const stubActionItems = generateStubActionItems(
    meetingId,
    participantNames,
    meeting.startedAt ?? new Date(),
  );

  const ownerByName = new Map(
    meeting.participants.map((p) => [p.name, p.userId] as const),
  );

  await prisma.actionItem.createMany({
    data: stubActionItems.map((item) => ({
      meetingId,
      description: item.description,
      ownerName: item.ownerName,
      ownerUserId: item.ownerName ? (ownerByName.get(item.ownerName) ?? null) : null,
      dueDate: item.dueDate,
      generatedBy: "STUB",
    })),
  });

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      recordingDurationSec: Math.round(durationMs / 1000),
    },
  });
}
