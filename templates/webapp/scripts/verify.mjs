import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
function hasTests(dir, extension) {
  return readdirSync(dir, { withFileTypes: true }).some((item) =>
    item.isDirectory()
      ? hasTests(resolve(dir, item.name), extension)
      : item.isFile() && extension.test(item.name),
  );
}
try {
  const mode = process.argv[2];
  if (!["all", "security"].includes(mode))
    throw new Error("Expected all or security.");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const config = JSON.parse(readFileSync(".cclauncher.json", "utf8"));
  const commands =
    mode === "all"
      ? ["lint", "typecheck", "test", "build", "test:security", "test:e2e"]
      : ["test:security"];
  for (const command of commands) {
    if (
      typeof pkg.scripts?.[command] !== "string" ||
      !pkg.scripts[command].trim()
    )
      throw new Error(`Missing package script: ${command}`);
    if (/scripts\/(verify|security-check)\.(sh|mjs)/.test(pkg.scripts[command]))
      throw new Error(`Recursive verification script: ${command}`);
  }
  if (
    !hasTests(resolve(root, "tests/security"), /\.(test|spec)\.[cm]?[jt]sx?$/)
  )
    throw new Error("No executable application security tests found.");
  if (
    config.database === "supabase" &&
    !hasTests(resolve(root, "supabase/tests"), /\.sql$/)
  )
    throw new Error("No Supabase SQL security tests found.");
  function run(args) {
    const result = spawnSync("pnpm", args, { stdio: "inherit", cwd: root });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(`Verification failed: pnpm ${args.join(" ")}`);
  }
  for (const command of commands) run(["run", command]);
  if (config.database === "supabase") run(["exec", "supabase", "test", "db"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
