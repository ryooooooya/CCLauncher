import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionCookieOptions } from "./session-cookies";

export async function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase configuration is required");
  const cookieOptions = sessionCookieOptions(
    process.env.APP_ORIGIN,
    process.env.CCLAUNCHER_LOCAL_HTTP,
  );
  const jar = await cookies();
  return createServerClient(url, key, {
    cookieOptions,
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
