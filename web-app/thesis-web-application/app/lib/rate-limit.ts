import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";

/** A stable, non-reversible id for the caller's IP, so raw addresses are never stored. */
export function clientKeyFrom(h: Headers) {
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}

export async function clientKey() {
  return clientKeyFrom(await headers());
}

/**
 * Fixed-window counter kept in Postgres (serverless instances share no memory).
 * Returns true while the caller is within `limit` hits per `windowSeconds`.
 */
export async function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  const id = `${bucket}:${key}`;
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit ("key", "count", "resetAt")
    VALUES (${id}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN rate_limit."resetAt" < now() THEN 1 ELSE rate_limit."count" + 1 END,
      "resetAt" = CASE WHEN rate_limit."resetAt" < now() THEN ${resetAt} ELSE rate_limit."resetAt" END
    RETURNING "count"`;

  // Tidy up old windows now and then so the table stays small.
  if (Math.random() < 0.02) {
    await prisma.rateLimit
      .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 3_600_000) } } })
      .catch(() => {});
  }
  return Number(rows[0]?.count ?? 1) <= limit;
}
