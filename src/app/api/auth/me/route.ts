import { NextResponse } from "next/server";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const team = await getCurrentTeam(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor },
    team: team ? { id: team.id, name: team.name, slug: team.slug } : null,
  });
}
