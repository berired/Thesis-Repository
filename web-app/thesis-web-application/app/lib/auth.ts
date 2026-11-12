import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "./prisma";
import { actionEmail, emailEnabled, sendEmail } from "./email";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Without email there is no way to confirm an address, so sign-up signs in directly.
    requireEmailVerification: emailEnabled,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited, so response time doesn't reveal whether the email exists.
      void sendEmail({
        to: user.email,
        subject: "Reset your Pawket Book password",
        ...actionEmail({
          heading: "Reset your password",
          body: "We got a request to reset your Pawket Book password. This link works for one hour. If it wasn't you, ignore this email.",
          buttonLabel: "Choose a new password",
          url,
        }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: emailEnabled,
    sendOnSignIn: emailEnabled,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Confirm your Pawket Book account",
        ...actionEmail({
          heading: "Welcome to the pack!",
          body: "Confirm your email to finish setting up your account.",
          buttonLabel: "Confirm my email",
          url,
        }),
      });
    },
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
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://*.trycloudflare.com",
  ],
  plugins: [admin(), nextCookies()],
});
