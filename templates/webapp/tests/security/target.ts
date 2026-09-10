import { type APIRequestContext, expect, request } from "@playwright/test";

// Adapt this small contract to your application's actual endpoints. Never mock auth.
export const baseURL = process.env.SECURITY_BASE_URL || "http://127.0.0.1:3000";
const url = new URL(baseURL);
if (
  url.origin !== baseURL ||
  url.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(url.hostname)
)
  throw new Error("Security fixture requires a local test application origin.");
export const paths = { session: "/api/session", documents: "/api/documents" };
export type Actor = "owner" | "other" | "admin";
export async function guest() {
  return request.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL } });
}
export async function actor(name: Actor): Promise<APIRequestContext> {
  const prefix = `SECURITY_${name.toUpperCase()}`;
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password)
    throw new Error(`Missing synthetic credentials: ${prefix}`);
  const context = await guest();
  try {
    const login = await context.post(paths.session, {
      data: { email, password },
    });
    expect(login.status(), `${name} must successfully authenticate`).toBe(200);
    const session = await context.get(paths.session);
    expect(session.status()).toBe(200);
    expect(typeof (await session.json()).id).toBe("string");
    return context;
  } catch (error) {
    await context.dispose();
    throw error;
  }
}
export async function createDocument(owner: APIRequestContext) {
  const body = `private fixture ${crypto.randomUUID()}`;
  const response = await owner.post(paths.documents, { data: { body } });
  expect(response.status(), "Owner create must succeed before deny cases").toBe(
    201,
  );
  const doc = (await response.json()) as { id: string; body: string };
  expect(doc.body).toBe(body);
  expect(typeof doc.id).toBe("string");
  return doc;
}
