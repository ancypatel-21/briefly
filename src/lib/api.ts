import { NextResponse } from "next/server";
import { getCurrentTeam, getCurrentUser } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Loads the current user + their team, or throws a 401/404 ApiError. */
export async function requireUserAndTeam() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Not authenticated");
  const team = await getCurrentTeam(user.id);
  if (!team) throw new ApiError(404, "No team found for this user");
  return { user, team };
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
