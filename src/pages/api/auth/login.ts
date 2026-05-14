import type { APIRoute } from "astro";
import { setSessionCookie, verifyAdminPassword } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const username = (body.username ?? "").trim();
  const password = body.password ?? "";

  if (!username || !password) {
    return new Response(
      JSON.stringify({ error: "Username and password are required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  let ok = false;
  try {
    ok = await verifyAdminPassword(username, password);
  } catch (err) {
    console.error("auth/login config error", err);
    return new Response(
      JSON.stringify({ error: "Auth is not configured on the server" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  if (!ok) {
    // Same response for unknown user and bad password — don't leak which is which.
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  setSessionCookie(cookies);
  return new Response(JSON.stringify({ username }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
