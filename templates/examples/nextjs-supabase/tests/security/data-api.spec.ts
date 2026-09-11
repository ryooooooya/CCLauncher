import { expect, request } from "@playwright/test";
import { test } from "../required-test";

// Real Auth JWTs and PostgREST requests; no service-role key or mocked authorization.
test("direct Data API limits ownership and writable columns for both users", async () => {
  const url = new URL(process.env.SUPABASE_URL || "");
  const key = process.env.SUPABASE_ANON_KEY;
  if (
    !key ||
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Use disposable local Supabase fixtures");
  const actors = [];
  const docs: { id: string; body: string }[] = [];
  try {
    for (const name of ["OWNER", "OTHER"]) {
      const auth = await request.newContext({
        baseURL: url.origin,
        extraHTTPHeaders: { apikey: key },
      });
      try {
        const response = await auth.post("/auth/v1/token?grant_type=password", {
          data: {
            email: process.env[`SECURITY_${name}_EMAIL`],
            password: process.env[`SECURITY_${name}_PASSWORD`],
          },
        });
        expect(response.status()).toBe(200);
        const session = await response.json();
        const client = await request.newContext({
          baseURL: url.origin,
          extraHTTPHeaders: {
            apikey: key,
            Authorization: `Bearer ${session.access_token}`,
            Prefer: "return=representation",
          },
        });
        actors.push({ client, id: session.user.id });
        const created = await client.post("/rest/v1/documents", {
          data: {
            owner_id: session.user.id,
            body: `direct ${crypto.randomUUID()}`,
          },
        });
        expect(created.status()).toBe(201);
        docs.push((await created.json())[0]);
      } finally {
        await auth.dispose();
      }
    }
    expect(actors[0].id).not.toBe(actors[1].id);
    for (const [index, { client, id }] of actors.entries()) {
      const own = docs[index];
      const other = docs[1 - index];
      const list = await client.get("/rest/v1/documents?select=id,body");
      expect(list.status()).toBe(200);
      const ids = (await list.json()).map((row: { id: string }) => row.id);
      expect(ids).toContain(own.id);
      expect(ids).not.toContain(other.id);
      for (const candidate of [other.id, crypto.randomUUID()]) {
        const insert = await client.post("/rest/v1/documents", {
          data: { id: candidate, owner_id: id, body: "probe" },
        });
        expect(insert.status()).toBe(403);
        expect((await insert.json()).code).toBe("42501");
        const update = await client.patch(
          `/rest/v1/documents?id=eq.${own.id}`,
          { data: { id: candidate } },
        );
        expect(update.status()).toBe(403);
        expect((await update.json()).code).toBe("42501");
      }
      const unchanged = await client.get(`/rest/v1/documents?id=eq.${own.id}`);
      expect((await unchanged.json())[0].body).toBe(own.body);
      const update = await client.patch(`/rest/v1/documents?id=eq.${own.id}`, {
        data: { body: "own update" },
      });
      expect(update.status()).toBe(200);
      expect((await update.json())[0].body).toBe("own update");
    }
    for (const [index, { client }] of actors.entries()) {
      const removed = await client.delete(
        `/rest/v1/documents?id=eq.${docs[index].id}`,
      );
      expect(removed.status()).toBe(200);
      expect((await removed.json())[0].id).toBe(docs[index].id);
    }
  } finally {
    for (const [index, { client }] of actors.entries()) {
      if (docs[index])
        await client.delete(`/rest/v1/documents?id=eq.${docs[index].id}`);
      await client.dispose();
    }
  }
});
