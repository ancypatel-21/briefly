import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handleApiError, requireUserAndTeam } from "@/lib/api";

const schema = z.object({
  description: z.string().min(1).max(500).optional(),
  ownerName: z.string().max(100).nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
});

async function loadOwned(id: string, teamId: string) {
  const item = await prisma.actionItem.findFirst({
    where: { id, meeting: { teamId } },
  });
  if (!item) throw new ApiError(404, "Action item not found");
  return item;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    await loadOwned(id, team.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { dueDate, ...rest } = parsed.data;

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: {
        ...rest,
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    return NextResponse.json({ actionItem });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireUserAndTeam();
    const { id } = await params;
    await loadOwned(id, team.id);
    await prisma.actionItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
