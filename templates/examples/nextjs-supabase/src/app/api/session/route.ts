import { body, json, safely, sameOrigin } from "../../../lib/http";
import { client, identity } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export function GET() {
  return safely(async () => {
    const { userId } = await identity();
    return userId ? json({ id: userId }) : json({ error: "Unauthorized" }, 401);
  });
}
export function POST(request: Request) {
  return safely(async () => {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const value = await body(request);
    if (value === null || typeof value !== "object")
      return json({ error: "Invalid input" }, 400);
    const input = value as Record<string, unknown>;
    if (
      typeof input.email !== "string" ||
      input.email.length > 254 ||
      typeof input.password !== "string" ||
      input.password.length > 1024
    )
      return json({ error: "Invalid input" }, 400);
    const db = await client();
    const { error } = await db.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error) console.error("Authentication failed:", error.code || "unknown");
    return error
      ? json({ error: "Invalid credentials" }, 401)
      : json({ signedIn: true });
  });
}
export function DELETE(request: Request) {
  return safely(async () => {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const db = await client();
    const { error } = await db.auth.signOut();
    return error
      ? json({ error: "Sign out failed" }, 503)
      : json({ signedOut: true });
  });
}
