import { body, json, safely, sameOrigin } from "../../../lib/http";
import { documentBody } from "../../../lib/input";
import { identity } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export function GET() {
  return safely(async () => {
    const { db, userId } = await identity();
    if (!userId) return json({ error: "Unauthorized" }, 401);
    const { data, error } = await db
      .from("documents")
      .select("id, body")
      .eq("owner_id", userId)
      .order("id")
      .limit(100);
    return error ? json({ error: "Read failed" }, 503) : json(data);
  });
}
export function POST(request: Request) {
  return safely(async () => {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const { db, userId } = await identity();
    if (!userId) return json({ error: "Unauthorized" }, 401);
    const text = documentBody(await body(request));
    if (text === null) return json({ error: "Invalid input" }, 400);
    const { data, error } = await db
      .from("documents")
      .insert({ owner_id: userId, body: text })
      .select("id, body")
      .single();
    return error ? json({ error: "Create failed" }, 503) : json(data, 201);
  });
}
