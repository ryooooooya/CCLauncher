import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const marker = "# Generated local CCLauncher fixtures";
for (const path of [".env.local", ".env.test"]) {
  if (existsSync(path) && !readFileSync(path, "utf8").startsWith(marker))
    throw new Error(`Refusing to overwrite ${path}`);
}
const status = JSON.parse(
  execFileSync("pnpm", ["exec", "supabase", "status", "-o", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const url = new URL(status.API_URL);
if (
  url.protocol !== "http:" ||
  !["127.0.0.1", "localhost"].includes(url.hostname)
)
  throw new Error("Fixture provisioning is restricted to local Supabase.");
if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY)
  throw new Error("Local Supabase credentials are unavailable.");
const admin = createClient(url.origin, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const env = ["SECURITY_BASE_URL=http://127.0.0.1:3000"];
for (const role of ["OWNER", "OTHER", "ADMIN"]) {
  const email = `fixture-${role.toLowerCase()}-${randomUUID()}@example.invalid`;
  const password = `fixture-${randomUUID()}-Aa1!`;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`Could not provision ${role} fixture.`);
  env.push(
    `SECURITY_${role}_EMAIL=${email}`,
    `SECURITY_${role}_PASSWORD=${password}`,
  );
}
writeFileSync(
  ".env.local",
  `${marker}\nAPP_ORIGIN=http://127.0.0.1:3000\nSUPABASE_URL=${url.origin}\nSUPABASE_ANON_KEY=${status.ANON_KEY}\n`,
  { mode: 0o600 },
);
writeFileSync(".env.test", `${marker}\n${env.join("\n")}\n`, { mode: 0o600 });
console.log("Created synthetic local actors; credentials were not logged.");
