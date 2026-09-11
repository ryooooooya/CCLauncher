import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase configuration is required");
  const origin = new URL(process.env.APP_ORIGIN || "");
  if (
    origin.origin !== process.env.APP_ORIGIN ||
    (origin.protocol !== "https:" &&
      !(
        origin.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(origin.hostname)
      ))
  )
    throw new Error("APP_ORIGIN requires HTTPS except on local loopback");
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      secure: origin.protocol === "https:",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          jar.set(name, value, options);
      },
    },
  });
}
export async function identity() {
  const db = await client();
  const { data, error } = await db.auth.getClaims();
  return {
    db,
    userId:
      !error && typeof data?.claims.sub === "string" ? data.claims.sub : null,
  };
}
