# Pawket Book: what's left to build

Last updated 2026-11-24, after Phase 5 and the tracked-edits change (branch `stage` at `798b8ed`). Before starting new work, pull the latest from `stage`.

The backend is planned phase by phase in `backend-plan.md`, which is the source of truth for decisions and records what each finished phase did. This file tracks the frontend and loose ends. Where the two disagree, `backend-plan.md` wins.

**Where the plan stands:** Phases 0 to 6 are done (foundations, private storage and uploads, owner records, reminders and notifications, vet QR flow, admin void and audit, lost-pet messaging with the per-field scan page settings, shared access for caretakers, pet photos, the PDF export and the header search), plus the time zone fix and the tracked-edits change (record history, add-only notes, locked files). Only the final gate (the end-to-end walkthrough) remains. Production still needs the migrations (now ten, through `20261124081237_pet_photo_thumbnails`), plus running `scripts/migrate-pet-photos.mjs` after the deploy and settings in the "Production deploy checklist" in `backend-plan.md`.

## 1. Figma status

Links to every frame, with its route and status, are in `figma-links.md`.

File: `42BmxWxt8Hq6HaNtjPikX9` (Pawket Book, Final Pages). It has three pages: Style Guide (`19:31`), UI Pages (`9:178`) and Components (`190:4549`, only the filter chips). Re-checked 2026-11-23.

Built since the last review of this file:

| Page | Node id |
|---|---|
| Notifications (without the settings card and clinic items) | 9:1425 |
| My animals list | 39:42 |
| Add animal, Edit animal profile | 190:2333, 39:1024 |
| All-pets Health records list | 131:355 |
| Add and edit health record, with attachments (the form's attachments panel replaces the separate dialog) | 131:1018, 131:1283, 131:1628 |
| Pet Reminders tab | 185:1009 |
| All-pets Reminders overview, Create reminder | 142:1867, 142:2203 |
| ID and QR tag tab (the per-field switches are pill switches per the plan, not Figma's checkboxes) | 203:5464 |
| Mobile QR scan page (the public `/r/[code]` member card) | 203:4866 |

Not built yet:

| Page | Node id |
|---|---|
| Privacy Policy, Terms of Use, Contact Us, FAQs, Features | 163:42, 163:282, 167:586, 168:*, 173:5055 |
| Landing page (final) | 75:2460 |

Built earlier from screenshots only (spacing, colours and icons approximated). Not re-checked in later phases:

- 9:880 Home (`/dashboard`)
- 39:683 Pet overview (`/pets/[id]`)
- 39:1797 Appointments tab (`/pets/[id]/appointments`)
- 39:2287 Remove-animal dialog

Figma frames still to edit to match the decisions (the code already follows the decisions):

- Notifications (9:1425): remove the clinic items and the "Too many pings?" block.
- Owner dashboard Vet visits card (9:880 and variants): replace "Awaiting clinic" and "Confirmed" with Upcoming / Done / Cancelled.
- Edit record (131:1283): for vet-submitted records, remove "Delete record" and the copy-on-edit text. Also add the "Edited on" stamp, the History and Notes sections on the record page, and drop the remove button on saved files.
- Reminders create form (142:2203): remove Email and Phone, and the Email notify option.
- Sidebar: remove "Appointments" from the frames that show it. Decided: no Appointments sidebar link.
- Header search placeholder: change to "Search animals and records" (built that way).
- Medication record form (131:1018): the dose reminders now have a "Who gives the doses" choice (me, a caretaker, or whoever first) when the animal has caretakers.
- Find a vet (190:3963, 190:4427): leave locked.
- ID and QR tag (203:5464): the public-info controls must be pill toggles per field.

Figma screens that do not exist: owner generate, list and cancel vet QR; the public vet page and form (built in the existing style, see `backend-plan.md` Phase 4); the admin Vet records pages (reports, audit trail) and the owner's report form; the caretaker invite flow beyond the "Invite someone" button. Decided: build these in the existing style without new frames.

## 2. Locked or placeholder items in the UI

- Sidebar: Find a vet (locked). Health records, Reminders and Messages are live; there is no Appointments item.
- Pet banner: QR tag opens a dialog; Edit works.
- Home: Find a vet button (locked).
- Footer links on the landing page (everything except Features).

Stays locked on purpose: **Find a vet** ("Coming soon" until clinics exist).

## 3. Data and features the designs imply but the database lacks

- Pet species icons: only Dog, Cat and Reptile have icons; other species show an initial. Figma lists Dog, Cat, Bird, Poultry, Reptile, Fish, Rabbit, Other.

Done since the last version of this file: admin void and audit with owner reports (Phase 5); record edit history, add-only notes and locked files (2026-11-24); private `pet-files` bucket and uploads (Phase 1), record types and provenance, owner records with attachments and the Edit animal page with allergies (Phase 2), reminders with a completion log, the `Notification` model and bell (Phase 3), vet QR tokens, sessions and the vet form (Phase 4).

## 4. Dropped for now

- Clinics, clinic or vet accounts, a clinic directory, and clinic messaging.
- The "Awaiting clinic" to "Confirmed" appointment flow and all clinic-style notifications. Appointments are an owner-only calendar: Upcoming / Done / Cancelled.
- Email: Resend, email verification, forgot and reset password, and email reminders stay off. Reminders are in-app only. Do not build the Verify email, Forgot password or New password pages yet.
  - If email is revived later: set `RESEND_API_KEY` and `EMAIL_FROM`, verify a sending domain, and re-test the flows. Accounts created while email was off have `emailVerified: false`.
- A notification settings page. Revisit only if email returns.

## 5. Known issues and decisions to revisit

- The old pet photos have not been moved to the new format yet: run `scripts/migrate-pet-photos.mjs` on stage (it would move the one real photo there) and on production after the deploy. Search is a plain contains match, and Figma has no frames for the search results page or the PDF.

- The owner is not told when a caretaker invitation is accepted or declined, and there is no Figma frame for the invite flow, the invitations banner or the caretaker list (built in the existing style).

- Conversation reports have no unblock or audit entry for the admin (resolve and dismiss only). The old account-level show-phone and show-address columns and the free-text address are unused now and can be dropped later.

- `POST /api/email-exists` tells anyone whether an email has an account (used by the sign-up form). Add rate limiting (the Phase 4 limiter in `app/lib/rate-limit.ts` can be reused) or accept the trade-off.
- A monthly reminder that starts on the 29th to 31st drifts to the clamped day after a short month, because only the current due date is stored.
- Due notifications are created when a signed-in user loads a page (there is no scheduler), so a reminder that falls due while nobody is signed in notifies on the next visit.
- The owner-side `deleteRecord` refusal for vet records has no UI path and was never exercised live; a vet-QR cancel during a live session was not either.
- Owners are not told when their report on a vet record is resolved. The admin record page does not show edit history or notes. Deleting an owner-made record removes its history and files. Voiding the only vet weight record leaves the pet's weight at the voided value. Dose-reminder time changes are not written to a record's history.
- A vet upload that is presigned but never confirmed can leave an orphan object in `vet-uploads/`. There is no cleanup sweep.
- Deleting a pet resets its QR tag to UNUSED so the tag can be registered again.
- Archived pets stay reachable by direct URL and show a restore banner.
- `package.json` still has a `make-admin` script but `scripts/make-admin.mjs` does not exist. Restore the file or remove the script.
- Preview deployments on other branches cannot upload files (the bucket's CORS allows only production, stage and localhost).
- Test data: always delete what a smoke test creates (rule in the root `CLAUDE.md`). Stage currently holds only real data.
- Neon is shared. Local `.env` points at the `stage` branch; production is the `main` branch.

## 6. Not started at all

- The final phase gate in `backend-plan.md`: an end-to-end walkthrough of the owner, vet, admin, finder and caretaker flows.
- Tests (none in the repo; deliberately deferred, see `backend-plan.md`).
- Final end-to-end walkthrough.
