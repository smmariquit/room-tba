import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = getSession(cookies);
  return new Response(
    JSON.stringify({ admin: session !== null, username: session?.username ?? null }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
};
