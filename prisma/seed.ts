import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { runMeetingPipeline } from "../src/lib/processing";
import { generateJoinCode, slugify } from "../src/lib/utils";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@briefly.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo data already seeded (demo@briefly.app exists). Skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: { name: "Ada Lovelace", email, passwordHash },
  });

  const team = await prisma.team.create({
    data: { name: "Acme Inc", slug: slugify("Acme Inc") },
  });

  await prisma.teamMember.create({ data: { teamId: team.id, userId: user.id, role: "OWNER" } });

  const teammates = ["Grace Hopper", "Alan Turing", "Margaret Hamilton"];

  // A completed meeting with a full transcript/summary/action items (via the stub pipeline)
  const completed = await prisma.meeting.create({
    data: {
      teamId: team.id,
      createdById: user.id,
      title: "Q3 Roadmap Sync",
      description: "Reviewing progress on the Q3 roadmap and unblocking open items.",
      status: "SCHEDULED",
      joinCode: generateJoinCode(),
      scheduledStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      participants: {
        create: [
          { name: user.name, email: user.email, userId: user.id, role: "HOST", joinedAt: new Date() },
          ...teammates.map((name) => ({ name, joinedAt: new Date() })),
        ],
      },
    },
  });
  await prisma.meeting.update({ where: { id: completed.id }, data: { recordingUrl: "seed-demo", recordingMimeType: "audio/webm" } });
  await runMeetingPipeline(completed.id);

  // An upcoming scheduled meeting
  await prisma.meeting.create({
    data: {
      teamId: team.id,
      createdById: user.id,
      title: "Design Review: Onboarding Flow",
      status: "SCHEDULED",
      joinCode: generateJoinCode(),
      scheduledStart: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      participants: {
        create: [{ name: user.name, email: user.email, userId: user.id, role: "HOST" }],
      },
    },
  });

  console.log("Seeded demo workspace.");
  console.log("  Email:    demo@briefly.app");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
