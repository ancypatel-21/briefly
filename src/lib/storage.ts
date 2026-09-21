import path from "node:path";

// Statically-scoped on purpose (no env var in the path) so bundlers can trace
// file access correctly instead of pulling in the whole project.
export const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

export function uploadPathFor(filename: string) {
  return path.join(UPLOAD_DIR, filename);
}
