import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleApiError, requireUserAndTeam } from "@/lib/api";
import { PROVIDER_DESCRIPTIONS, PROVIDER_LABELS } from "@/lib/integrations";
import { IntegrationProvider } from "@/generated/prisma/enums";

/** Returns one row per known provider, connected or not, for the team's settings page. */
export async function GET() {
  try {
    const { team } = await requireUserAndTeam();
    const existing = await prisma.integration.findMany({
      where: { teamId: team.id },
      include: { connectedBy: { select: { id: true, name: true } } },
    });
    const byProvider = new Map(existing.map((i) => [i.provider, i]));

    const providers = Object.values(IntegrationProvider).map((provider) => {
      const row = byProvider.get(provider);
      return {
        provider,
        label: PROVIDER_LABELS[provider],
        description: PROVIDER_DESCRIPTIONS[provider],
        id: row?.id ?? null,
        status: row?.status ?? "DISCONNECTED",
        externalAccountLabel: row?.externalAccountLabel ?? null,
        connectedBy: row?.connectedBy ?? null,
        connectedAt: row?.connectedAt ?? null,
      };
    });

    return NextResponse.json({ providers });
  } catch (error) {
    return handleApiError(error);
  }
}

const connectSchema = z.object({
  provider: z.enum(Object.values(IntegrationProvider) as [string, ...string[]]),
  externalAccountLabel: z.string().min(1).max(120),
});

/**
 * "Connects" an integration. No real OAuth flow happens here — this is the
 * stubbed framework described in the product spec. It just records that the
 * team wants this provider on, with whatever label they typed in (e.g. a
 * fake workspace/site name) standing in for a real connected account.
 */
export async function POST(req: Request) {
  try {
    const { user, team } = await requireUserAndTeam();
    const body = await req.json().catch(() => null);
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const provider = parsed.data.provider as IntegrationProvider;

    const integration = await prisma.integration.upsert({
      where: { teamId_provider: { teamId: team.id, provider } },
      create: {
        teamId: team.id,
        provider,
        status: "CONNECTED",
        externalAccountLabel: parsed.data.externalAccountLabel,
        connectedById: user.id,
        connectedAt: new Date(),
      },
      update: {
        status: "CONNECTED",
        externalAccountLabel: parsed.data.externalAccountLabel,
        connectedById: user.id,
        connectedAt: new Date(),
      },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    return handleApiError(error);
  }
}
