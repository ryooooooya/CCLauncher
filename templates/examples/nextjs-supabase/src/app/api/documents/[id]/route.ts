import { body, json, safely, sameOrigin } from "../../../../lib/http";
import { documentBody, validId } from "../../../../lib/input";
import { identity } from "../../../../lib/supabase";

type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
async function handle(request: Request, context: Context) {
  return safely(async () => {
    if (request.method !== "GET" && !sameOrigin(request))
      return json({ error: "Forbidden" }, 403);
    const { db, userId } = await identity();
    if (!userId) return json({ error: "Unauthorized" }, 401);
    const { id } = await context.params;
    if (!validId(id)) return json({ error: "Not found" }, 404);
    const text =
      request.method === "PATCH" ? documentBody(await body(request)) : null;
    if (request.method === "PATCH" && text === null)
      return json({ error: "Invalid input" }, 400);
    const query =
      request.method === "PATCH"
        ? db.from("documents").update({ body: text })
        : request.method === "DELETE"
          ? db.from("documents").delete()
          : db.from("documents").select("id, body");
    const { data, error } = await query
      .eq("id", id)
      .eq("owner_id", userId)
      .select("id, body")
      .maybeSingle();
    if (error) return json({ error: "Operation failed" }, 503);
    return data ? json(data) : json({ error: "Not found" }, 404);
  });
}
export const GET = handle;
export const PATCH = handle;
export const DELETE = handle;
