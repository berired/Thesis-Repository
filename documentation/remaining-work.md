# Pawket Book: what's left to build

Last updated 2026-11-23, on branch `frontend-updates`. Before starting new work, pull the latest from `stage`.

The backend is planned phase by phase in `backend-plan.md`, which is the source of truth for decisions. This file tracks the frontend and loose ends. Where the two disagree, `backend-plan.md` wins.

## 1. Figma status

File: `42BmxWxt8Hq6HaNtjPikX9` (Pawket Book, Final Pages), page "UI Pages" (`9:178`). Cross-referenced on 2026-11-23.

The 6 nodes that were unread before: 9:1425 (Notifications), 39:42 (My Animals), 39:402 (Add Animal) and 39:1024 (Edit animal profile) now exist and can be built. 39:1515 and 39:2042 no longer appear as top-level frames (likely replaced or deleted).

Built earlier from screenshots only (spacing, colours and icons approximated). Re-check these against `get_design_context`:

- 9:880 Home (`/dashboard`)
- 39:683 Pet overview (`/pets/[id]`)
- 39:1262 Health records tab (`/pets/[id]/records`)
- 39:1797 Appointments tab (`/pets/[id]/appointments`)
- 39:2287 Remove-animal dialog

Pages in Figma not built yet:

| Page | Node id |
|---|---|
| Notifications | 9:1425 |
| My animals list | 39:42 |
| Add animal (new design, 8 species, photo, allergies) | 39:402, 190:2333 |
| Edit animal profile (incl. archive or delete, caretakers) | 39:1024 |
| ID and QR tag tab (download, lost mode, public-info toggles, scan preview) | 203:5464 |
| Mobile QR scan page | 203:4866 |
| All-pets Health records list | 131:355 |
| Add health record with attachment | 131:1018 |
| Edit health record | 131:1283 |
| Upload attachment dialog | 131:1628 |
| Pet Reminders tab | 185:1009 |
| All-pets Reminders overview | 142:1867, 142:2743, 145:3920 |
| Create reminder | 142:2203 |
| Privacy Policy, Terms of Use, Contact Us, FAQs, Features | 163:42, 163:282, 167:586, 168:*, 173:5055 |
| Landing page (final) | 75:2460 |

Figma frames to edit to match the decisions:

- Notifications (9:1425): remove the clinic items ("received your request", "Appointment confirmed", "New message from <clinic>").
- Owner dashboard Vet visits card (9:880 and variants): replace "Awaiting clinic" and "Confirmed" with Upcoming / Done / Cancelled.
- Edit record (131:1283): for vet-submitted records, remove "Delete record" and the copy-on-edit text. Only the visit date is editable.
- Reminders create form (142:2203): remove the Email notify toggle.
- Find a vet (190:3963, 190:4427): leave locked, not built.
- Sidebar: remove "Appointments" from the frames that show it (131:1283, 131:1628). Decided: no Appointments sidebar link.
- Notifications (9:1425): remove the "Notification settings" link and the "Too many pings?" block.
- Header search placeholder: change to "Search animals and records".
- Medication record form (131:1018): hide "Also notify <caretaker>" until caretakers exist (Phase 7).
- ID and QR tag (203:5464): the public-info controls must be pill toggles (switches) per field.

Figma screens that do not exist yet: owner generate, list and revoke vet QR; the public vet form; admin void and audit; the caretaker invite flow beyond the "Invite someone" button. Decided: build these in the existing style without new frames.

## 2. Locked or placeholder items in the UI

Greyed out with a "Coming soon" tooltip, or with no page behind them.

- Sidebar: My animals (no list page), Health records, Reminders, Find a vet, Appointments, Messages
- Pet page tabs: Reminders, ID and QR tag
- Pet banner: Edit, QR tag
- Home: Find a vet button; "View all" and "See all" links were left out
- Health records: Export PDF, file upload (the Files column counts linked documents, but nothing uploads them yet)
- Header: notifications bell does nothing; search box does nothing
- Footer links on the landing page (everything except Features)

Stays locked on purpose: **Find a vet** ("Coming soon" until clinics exist).

## 3. Data and features the designs imply but the database lacks

- Caretakers (shared access): no sharing model. Role is view, generate vet QRs, be assigned and complete reminders; no editing animal info, adding animals, or editing records; no owner contact details or lost-pet messages. Phase 7.
- Reminders: need an assignee and a completion history (who, when), repeats and end date, more types, "also add to health records". Phase 3 and 7.
- Lost-mode public info: needs a per-pet setting for which fields (vaccines, allergies, medication, notes, contact options) are public, shown as pill toggles. The server must only return fields that are switched on.
- Messages: lost-pet messaging only (thread model needed). Phase 6.
- Notifications: no model. Triggers are reminders due, vet record submitted, lost-pet message, shared access invite, and caretaker activity.
- Record types: add Weight and Other to the vet types.
- Pet photos: no upload. Avatars use species icons.
- Document uploads: a second private storage bucket for pet documents was never created (only `qr-codes` exists). Phase 1.
- Edit pet: no page. Allergies has no field in the registration form either (it shows on the overview but can only be set in the database).
- Pet species icons: only Dog, Cat and Reptile have icons; other species show an initial. Figma now lists Dog, Cat, Bird, Poultry, Reptile, Fish, Rabbit, Other.

## 4. Dropped for now

- Clinics, clinic or vet accounts, a clinic directory, and clinic messaging.
- The "Awaiting clinic" to "Confirmed" appointment flow and all clinic-style notifications. Appointments are an owner-only calendar: Upcoming / Done / Cancelled.
- Email: Resend, email verification, forgot and reset password, and email reminders stay off. Reminders are in-app only. Do not build the Verify email, Forgot password or New password pages yet.
  - If email is revived later: set `RESEND_API_KEY` and `EMAIL_FROM`, verify a sending domain, and re-test the flows. Accounts created while email was off have `emailVerified: false`.

## 5. Known issues and decisions to revisit

- Dates use the server's local time zone. Fine on a dev machine, wrong if the server is deployed in a different zone from the users. Pick a zone (for example Asia/Manila) and use it everywhere.
- `POST /api/email-exists` tells anyone whether an email has an account (used by the sign-up form). Add rate limiting or accept the trade-off.
- Deleting a pet resets its QR tag to UNUSED so the tag can be registered again.
- Archived pets stay reachable by direct URL and show a restore banner.
- `scripts/make-admin.mjs` was deleted in the working tree but `package.json` still has the `make-admin` script. Restore the file or remove the script.
- `prisma/migrations/migration_lock.toml` showed as modified (likely line endings only). Check before committing.
- Server actions (add record, book appointment, add reminder, mark done, cancel appointment, archive, delete, restore) were type-checked and the pages were load-tested against real data, but the form submissions were not clicked through in a browser.
- Test data is still in the Neon database (user `uitest+...@example.com` and its three pets). Delete it when done testing.
- Neon is shared. Create a dev branch before schema work (see `backend-plan.md` Phase 0).

## 6. Not started at all

- Backend phases 0 to 8 (see `backend-plan.md`): foundations, private storage and uploads, owner records, appointments/reminders/notifications, vet QR flow, admin void and audit, lost-pet messaging, shared access, photos and PDF export.
- Admin side for voiding vet records (no Figma yet).
- Tests (none in the repo; deliberately deferred, see `backend-plan.md`).
- Final end-to-end walkthrough.
