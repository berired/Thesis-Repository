// Email is switched on by setting RESEND_API_KEY. Until then, no email is sent
// and the flows that depend on it (email verification, password reset) are off.
export const emailEnabled = !!process.env.RESEND_API_KEY;

// Sends transactional email through Resend's HTTP API.
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Pawket Book <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[email] Resend rejected the message:", await res.text());
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function actionEmail({
  heading,
  body,
  buttonLabel,
  url,
}: {
  heading: string;
  body: string;
  buttonLabel: string;
  url: string;
}) {
  const safeUrl = escapeHtml(url);
  return {
    text: `${heading}\n\n${body}\n\n${buttonLabel}: ${url}\n`,
    html: `<div style="font-family:Poppins,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#20252b">
<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(heading)}</h1>
<p style="font-size:15px;line-height:1.5;color:#5b6470">${escapeHtml(body)}</p>
<p><a href="${safeUrl}" style="display:inline-block;background:#356ac3;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:12px">${escapeHtml(buttonLabel)}</a></p>
<p style="font-size:12px;color:#5b6470">If the button doesn't work, paste this link into your browser:<br>${safeUrl}</p>
</div>`,
  };
}
