# Pawket Book: what's left to build

Last updated 2026-11-13, on branch `frontend-updates`. Before starting new work, pull the latest from `stage`.

## 1. Figma pages not built yet (blocked by the Figma MCP rate limit)

The Figma Starter plan cut off tool calls after 5 of 11 requested screens. These 6 still need to be read and built.
File: `42BmxWxt8Hq6HaNtjPikX9` (Pawket Book, Final Pages). Re-send or retry once the limit resets.

| Node id | Status |
|---|---|
| 9:1425 | Not seen |
| 39:42 | Not seen |
| 39:402 | Not seen |
| 39:1024 | Not seen |
| 39:1515 | Not seen |
| 39:2042 | Not seen |

Built from screenshots only (no `get_design_context`, so spacing, colours and icons are approximated):

- 9:880 Home (`/dashboard`)
- 39:683 Pet overview (`/pets/[id]`)
- 39:1262 Health records tab (`/pets/[id]/records`)
- 39:1797 Appointments tab (`/pets/[id]/appointments`)
- 39:2287 Remove-animal dialog (on the overview page)

TODO: once Figma access is back, re-check these five against `get_design_context` and fix pixel differences.

## 2. Locked or placeholder items in the UI

These are greyed out with a "Coming soon" tooltip, or have no page behind them.

- Sidebar: My animals (no list page), Health records, Reminders, Find a vet, Appointments, Messages
- Pet page tabs: Reminders, ID and QR tag
- Pet banner: Edit, QR tag
- Home: Find a vet button; "View all" and "See all" links were left out
- Health records: Export PDF, file upload (the Files column counts linked documents, but nothing uploads them yet)
- Header: notifications bell does nothing; search box does nothing
- Footer links on the landing page (everything except Features)
- "Forgot password?" is locked while email is off

## 3. Data and features the designs imply but the database lacks

- Shared access ("Shared with Marco", "Marco will lose access too"): no sharing model
- Messages and the Messages badge: no model
- Clinics: appointments store a free-text clinic name. There is no clinic directory, no vet or clinic account, and nothing moves an appointment from "Awaiting clinic" to "Confirmed". The "We'll let you know when it's confirmed" text is a promise nothing keeps yet.
- Pet photos: no upload. Avatars use species icons.
- Document uploads: a second private storage bucket for pet documents was never created (only `qr-codes` exists)
- Edit pet: no page. Allergies has no field in the registration form either (it shows on the overview but can only be set in the database)
- Pet species icons: only Dog, Cat and Reptile have icons; other species show an initial

## 4. Email (waiting on Resend)

- Set `RESEND_API_KEY` (and `EMAIL_FROM`) in `.env` and restart. Email verification and password reset switch on by themselves.
- Then re-test: sign-up with confirmation email, the check-email page and resend button, forgot-password, reset-password.
- Verify a sending domain in Resend, or mail only goes to the account owner.
- Existing accounts created while email was off have `emailVerified: false`.

## 5. Known issues and decisions to revisit

- Dates use the server's local time zone. Fine on a dev machine, wrong if the server is deployed in a different zone from the users. Pick a zone (for example Asia/Manila) and use it everywhere.
- `POST /api/email-exists` tells anyone whether an email has an account (used by the sign-up form). Add rate limiting or accept the trade-off.
- Deleting a pet resets its QR tag to UNUSED so the tag can be registered again.
- Archived pets stay reachable by direct URL and show a restore banner.
- `scripts/make-admin.mjs` is deleted in the working tree but `package.json` still has the `make-admin` script. Restore the file or remove the script.
- `prisma/migrations/migration_lock.toml` shows as modified (likely line endings only). Check before committing.
- Server actions (add record, book appointment, add reminder, mark done, cancel appointment, archive, delete, restore) were type-checked and the pages were load-tested against real data, but the form submissions were not clicked through in a browser.
- Test data from this session is still in the Neon database (user `uitest+...@example.com` and its three pets). Delete it when done testing.

## 6. Not started at all

- Reminders page, Find a vet, Appointments (all pets), Messages, Health records (all pets)
- Admin side for clinics and vets
- Notifications
- Tests (none in the repo)
- Deployment setup
