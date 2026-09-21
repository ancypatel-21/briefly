import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    const existing = await prisma.integration.findFirst({ where: { id, teamId: team.id } });
    if (!existing) throw new ApiError(404, "Integration not found");

    const integration = await prisma.integration.update({
      where: { id },
      data: { status: "DISCONNECTED" },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    return handleApiError(error);
  }
}
