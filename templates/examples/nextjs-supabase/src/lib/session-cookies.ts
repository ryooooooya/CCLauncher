export function sessionCookieOptions(
  appOrigin: string | undefined,
  localHttp: string | undefined,
) {
  if (localHttp !== undefined && !["true", "false"].includes(localHttp))
    throw new Error("CCLAUNCHER_LOCAL_HTTP must be true or false");
  const origin = new URL(appOrigin || "");
  const localException =
    localHttp === "true" &&
    origin.protocol === "http:" &&
    ["127.0.0.1", "localhost"].includes(origin.hostname);
  if (
    origin.origin !== appOrigin ||
    (origin.protocol !== "https:" && !localException)
  )
    throw new Error(
      "APP_ORIGIN requires HTTPS. Local HTTP requires explicit CCLAUNCHER_LOCAL_HTTP=true and a loopback origin.",
    );
  return {
    httpOnly: true,
    secure: !localException,
    sameSite: "lax" as const,
    path: "/",
  };
}
