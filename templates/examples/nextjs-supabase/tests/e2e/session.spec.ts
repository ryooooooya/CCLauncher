import { expect, test } from "@playwright/test";

test("browser signs in with a managed session cookie and signs out", async ({
  page,
  context,
}) => {
  const email = process.env.SECURITY_OWNER_EMAIL;
  const password = process.env.SECURITY_OWNER_PASSWORD;
  if (!email || !password)
    throw new Error("Run fixture setup before browser tests");
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const loginResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/session" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Signed in");
  const secure =
    new URL(process.env.SECURITY_BASE_URL || "http://127.0.0.1:3000")
      .protocol === "https:";
  for (const header of (await (await loginResponse).allHeaders())[
    "set-cookie"
  ]?.split("\n") || []) {
    expect(header).toMatch(/httponly/i);
    if (secure) expect(header).toMatch(/secure/i);
  }
  async function assertCookieAttributes() {
    const cookies = (await context.cookies()).filter((cookie) =>
      cookie.name.startsWith("sb-"),
    );
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie.httpOnly).toBe(true);
      expect(cookie.secure).toBe(secure);
      expect(cookie.sameSite).toBe("Lax");
      expect(cookie.path).toBe("/");
    }
    expect(await page.evaluate(() => document.cookie)).not.toContain("sb-");
    return cookies;
  }
  const stored = await assertCookieAttributes();
  // Expire SDK storage metadata to request a real provider refresh with its valid token.
  // This verifies refresh cookie handling, not cryptographic access-token expiry.
  const encoded = [...stored]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cookie) => cookie.value)
    .join("");
  expect(encoded.startsWith("base64-")).toBe(true);
  const session = JSON.parse(
    Buffer.from(encoded.slice(7), "base64url").toString(),
  );
  session.expires_at = 1;
  const refreshedStorage = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  await context.clearCookies();
  await context.addCookies([
    {
      ...stored[0],
      name: stored[0].name.replace(/\.\d+$/, ""),
      value: refreshedStorage,
    },
  ]);
  const refresh = await page.request.get("/api/session");
  expect(refresh.status()).toBe(200);
  expect(
    refresh
      .headersArray()
      .some((header) => header.name.toLowerCase() === "set-cookie"),
  ).toBe(true);
  await assertCookieAttributes();
  await page.reload();
  expect((await page.request.get("/api/documents")).status()).toBe(200);
  const signedOut = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/session" &&
      response.request().method() === "DELETE",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  expect((await signedOut).status()).toBe(200);
  await expect(page.getByRole("status")).toHaveText("Signed out");
  expect((await page.request.get("/api/session")).status()).toBe(401);
  expect(
    (await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-"))
      .length,
  ).toBe(0);
});
