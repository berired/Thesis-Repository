This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment

Set these in `.env` locally and in the Vercel project settings. Never commit real values.

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string. Local work points at the `stage` branch; production uses `main`. |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Sign-in secret and the app address for auth callbacks. |
| `APP_URL` | Public address of this deployment. Pet tag and vet QR links are built from it. |
| `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Neon object storage (S3-compatible) credentials. |
| `STORAGE_BUCKET_QR` | Bucket for QR images and pet photos (`qr-codes`). |
| `STORAGE_BUCKET_FILES` | Private bucket for health-record files (`pet-files`). |

The app time zone is a constant (`Asia/Manila`) in `app/lib/time.ts`, not a variable. Migrations are applied by hand with `npx prisma migrate deploy`; deploys do not run them. See `documentation/backend-plan.md` for the phased plan and the production deploy checklist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
