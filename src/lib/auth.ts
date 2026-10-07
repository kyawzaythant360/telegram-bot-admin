import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function isAuthenticated(): Promise<boolean> {
  // Everything after this runs only at request time (never while prerendering),
  // which also covers the clock reads in the session check and date ranges.
  await connection();
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every page data loader and server action.
 *  The proxy already redirects logged-out visitors; this is the real check. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/login");
}
