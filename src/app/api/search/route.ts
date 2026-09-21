import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, requireUserAndTeam } from "@/lib/api";

/**
 * Keyword search across meeting titles, summaries, and transcripts.
 *
 * This is plain SQL matching, not the natural-language / semantic search
 * described in the product spec — that needs an LLM/embeddings layer and is
 * part of the deferred "LLM part". This gives the knowledge base something
 * useful to search on today; swap the query below for a vector search later.
 */
export async function GET(req: Request) {
  try {
    const { team } = await requireUserAndTeam();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();

    if (!q) {
      return NextResponse.json({ query: q, meetings: [], segments: [] });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        teamId: team.id,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { summary: { overview: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { summary: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const segments = await prisma.transcriptSegment.findMany({
      where: {
        meeting: { teamId: team.id },
        text: { contains: q, mode: "insensitive" },
      },
      include: { meeting: { select: { id: true, title: true } }, speaker: true },
      take: 30,
    });

    return NextResponse.json({ query: q, meetings, segments });
  } catch (error) {
    return handleApiError(error);
  }
}
