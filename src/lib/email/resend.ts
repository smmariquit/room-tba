import { RESEND_API_KEY, RESEND_FROM_EMAIL } from "astro:env/server";

export function isResendConfigured(): boolean {
  return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);
}

export type SendEmailInput = {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
};

/**
 * Send an email via the Resend REST API (no SDK dependency).
 * Throws on non-2xx so callers can log per-recipient failures.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!isResendConfigured()) {
    throw new Error(
      "Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL).",
    );
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: input.to,
      ...(input.cc?.length ? { cc: input.cc } : {}),
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${detail.slice(0, 300)}`);
  }
}
