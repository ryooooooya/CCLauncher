import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const choices = {
  scope: ["production", "prototype"],
  framework: ["nextjs", "none"],
  auth: ["none", "supabase", "authjs"],
  database: ["none", "supabase", "postgres"],
};
export const featureKeys = [
  "uploads",
  "billing",
  "admin",
  "pii",
  "webhooks",
  "externalApi",
];
export function defaults() {
  return {
    schemaVersion: 1,
    profile: "webapp",
    scope: "production",
    framework: "nextjs",
    auth: "none",
    database: "none",
    features: Object.fromEntries(featureKeys.map((key) => [key, false])),
  };
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function validateConfig(value) {
  if (!object(value)) throw new Error("Config must be an object.");
  for (const key of Object.keys(value)) {
    if (
      ![
        "schemaVersion",
        "profile",
        "scope",
        "framework",
        "auth",
        "database",
        "features",
      ].includes(key)
    )
      throw new Error(`Unknown config field: ${key}`);
  }
  if (value.schemaVersion !== 1 || value.profile !== "webapp")
    throw new Error("Unsupported config schemaVersion or profile.");
  for (const [key, allowed] of Object.entries(choices)) {
    if (key === "scope" && value[key] === undefined) continue;
    if (!allowed.includes(value[key]))
      throw new Error(`Invalid ${key}; expected ${allowed.join(", ")}.`);
  }
  if (!object(value.features))
    throw new Error("Config features must be an object.");
  for (const key of Object.keys(value.features))
    if (!featureKeys.includes(key)) throw new Error(`Unknown feature: ${key}`);
  for (const key of featureKeys) {
    if (key === "externalApi" && value.features[key] === undefined) continue;
    if (typeof value.features[key] !== "boolean")
      throw new Error(`Feature ${key} must be boolean.`);
  }
  return {
    ...defaults(),
    ...value,
    features: { ...defaults().features, ...value.features },
  };
}
export function readJson(path) {
  if (statSync(path).size > 65536)
    throw new Error(`JSON file exceeds 64 KiB: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse JSON: ${path}`, { cause: error });
  }
}
export function readConfig(dir) {
  return validateConfig(readJson(resolve(dir, ".cclauncher.json")));
}
