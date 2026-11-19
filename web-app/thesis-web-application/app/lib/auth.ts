import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  user: {
    additionalFields: {
      // Comma-separated list from the sign-up form, e.g. "Dogs,Cats".
      animalTypes: { type: "string", required: false, input: true },
      // Contact number from the sign-up form; the form enforces it, so Google sign-ups still work.
      phone: { type: "string", required: false, input: true },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://*.trycloudflare.com",
  ],
  plugins: [admin(), nextCookies()],
});
