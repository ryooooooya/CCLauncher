import { expect, test } from "@playwright/test";
import { actor, guest, paths } from "./target";

test("guest cannot read session or private collection", async () => {
  const context = await guest();
  try {
    expect((await context.get(paths.session)).status()).toBe(401);
    expect((await context.get(paths.documents)).status()).toBe(401);
  } finally {
    await context.dispose();
  }
});

test("logout clears the authenticated session", async () => {
  const context = await actor("owner");
  try {
    expect((await context.delete(paths.session)).status()).toBe(200);
    expect((await context.get(paths.session)).status()).toBe(401);
    expect((await context.get(paths.documents)).status()).toBe(401);
  } finally {
    await context.dispose();
  }
});

test("tampered session cookies do not establish identity", async ({
  playwright,
}) => {
  const context = await actor("owner");
  try {
    const state = await context.storageState();
    expect(state.cookies.length).toBeGreaterThan(0);
    for (const cookie of state.cookies) cookie.value = "invalid-session";
    const tampered = await playwright.request.newContext({
      baseURL: process.env.SECURITY_BASE_URL || "http://127.0.0.1:3000",
      storageState: state,
    });
    try {
      expect((await tampered.get(paths.session)).status()).toBe(401);
    } finally {
      await tampered.dispose();
    }
  } finally {
    await context.dispose();
  }
});
