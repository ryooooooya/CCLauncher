import { expect, test } from "@playwright/test";

test("browser signs in with a managed session cookie and signs out", async ({
  page,
}) => {
  const email = process.env.SECURITY_OWNER_EMAIL;
  const password = process.env.SECURITY_OWNER_PASSWORD;
  if (!email || !password)
    throw new Error("Run fixture setup before browser tests");
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Signed in");
  expect((await page.request.get("/api/session")).status()).toBe(200);
  await page.reload();
  expect((await page.request.get("/api/documents")).status()).toBe(200);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Signed out");
  expect((await page.request.get("/api/session")).status()).toBe(401);
});
