# Backend plan: decisions so far

Written 2026-11-19, updated 2026-11-23 after cross-referencing the updated Figma file. No open questions. Where the dated "Decided" sections at the bottom disagree with an older line, the later date wins, and the phases below already reflect them.

## Vet input through a one-time QR (no clinic accounts)

There are no partnered clinics yet, so there are no clinic or vet accounts. Vets add records through an owner-generated QR.

- The owner generates a "record request" QR for a pet. For each additional record, the owner generates a new QR.
- The vet scans it and lands on a public page with no login, which has a form to add a health record.
- An unused QR expires after 24 hours. The owner can revoke an unused QR.
- The first real page load burns the token and starts a cookie-bound vet session of about 45 minutes. The vet can read the allowed records and submit within it. Link-preview bots must not burn the token.
- When generating the QR, the owner picks which sections the vet can read (vaccinations, vet visits, lab results, allergies).
- Record types the vet can add: all six (Vaccination, Check-up or vet visit, Lab result, Medication/prescription, Weight, Other), decided 2026-11-23.
- The vet enters Vet Name and Clinic Name (free text, unverified).
- Files: PDF/JPG/PNG, 10 MB each, max 5 per record. Check the type on the server, and cap uploads per session.
- Records go straight onto the pet, with a vet-submitted badge and submitted-by details.

### Owner and admin control
- Owners cannot edit vet records except the visit date, and cannot delete or hide them.
- Owners can fully edit and delete their own manually added records.
- An admin can void or delete a wrong or abusive vet record. It stays in the audit trail as voided. Owners report problems to the admin.

## Storage

- One new private bucket (for example `pet-files`) with prefixes `documents/`, `vet-uploads/` and `photos/`, served by short-lived signed URLs.
- Pet photos: owner uploads on add or edit pet, 5 MB, JPG/PNG/WebP, resized on the server to a thumbnail and a large image. Falls back to the species icon.
- Export PDF: a printable health summary for one pet, with vet entries marked. Attached files are listed, not embedded.

## Dropped for now
Clinic roles, the clinic admin side, clinic messaging, the "Awaiting clinic" to "Confirmed" flow and clinic-style notifications, email (verification, forgot or reset password, email reminders), and Find a vet (locked as "Coming soon" until Phase 10).

## Build phases

### Phase gate rule (applies to every phase)
Do not start phase N+1 until phase N meets all of these:
1. **Prerequisites** of the next phase are satisfied (listed under each phase).
2. **Every deliverable** of the phase is built, and its exit checks pass.
3. **No open items:** no open design question, no TODO or half-built piece, no known bug. Anything found goes into this phase or is explicitly moved to a named later phase in this file.
4. Schema changes are migrated and applied on Neon, type-check/build/lint pass, and the work is committed to a feature branch based on `stage`. No PR unless asked.
5. This file is updated (phase marked done, any new decision recorded).

Before writing code in any phase, read the relevant guide in `node_modules/next/dist/docs/` (this Next.js version has breaking changes, see `AGENTS.md`).

### Phase 0: Foundations (DONE 2026-11-23)
**Prerequisites:** none.
**Deliverables:**
- Pull the latest `stage`. Create the backend branch from `stage` (the current branch is `frontend-updates`).
- Commit this plan file.
- Audit what exists: current bucket and what it holds (`QrCode.imageKey`, `Pet.photoKey`, the `/api/pets/[id]/photo` route), the existing records, documents, reminders and appointments pages, and what is real versus placeholder.
- One shared pet-access helper (`getPetAccess(userId, petId)` returning `owner`, `viewer` or none). All pet queries and server actions go through it, so shared access (Phase 7) needs no rewrite.
- Schema cleanup migration: replace `AppointmentStatus` with `UPCOMING / DONE / CANCELLED` and make the clinic name optional free text; align `RecordType` with the vet types plus the owner types (vaccination, vet visit or check-up, lab result, medication, weight, other) and map or migrate existing rows; align the species list with Figma (Dog, Cat, Bird, Poultry, Reptile, Fish, Rabbit, Other).
**Exit checks:** helper is used by every existing owner query; migration applied; existing pages still work.

**Done notes (2026-11-23):**
- Helper: `app/lib/pet-access.ts` (`getPetAccess`, `accessiblePets`, `ownedPets`). Used by `getOwnedPet`, the server actions in `(owner)/actions.ts` and `edit/actions.ts`, the photo route, and the dashboard, My animals and owner layout queries. `/r/[code]` and `claim-pet.ts` are the public scan and claim paths and are deliberately not owner-gated.
- Migration `20261123120000_phase0_enum_cleanup`: `RecordType` is now `VACCINATION / VET_VISIT / LAB_RESULT / MEDICATION / WEIGHT / OTHER`; `AppointmentStatus` is `UPCOMING / DONE / CANCELLED`; `appointment.clinicName` is optional. Species already matched Figma, no change. Applied to the Neon `stage` branch only. **Not yet applied to production `main`.**
- Audit findings carried forward: the one bucket is `qr-codes` (env `STORAGE_BUCKET_QR`) holding `qr/` and `pet-photos/`; Phase 1 creates `pet-files` and Phase 8 reconciles `pet-photos/` with the `photos/` prefix. `PetDocument` is schema only (nothing creates documents) and its `DocumentType` enum overlaps the new `RecordType`; Phase 2 decides whether to keep it. The sidebar Appointments link and the greyed Health records, Reminders, Messages and Find a vet items are placeholders (Phase 3 removes the Appointments link). The add-record form sets `clinic` but never `vetName` (Phase 2/4).
- A past-dated `UPCOMING` appointment shows as Done on the pet's Appointments tab, and the "Waiting for clinic" panel is removed. Phase 3 adds a proper mark-done control.
- Smoke test (browser, local dev against the stage DB): sign-up, register a pet by QR, all six record types, weight record updates pet weight, appointment without a clinic, cancel appointment, reminder create and complete, edit pet, lost-mode scan page (shows last vaccine), archive, restore, delete (cascade, QR freed), another user's pet returns 404. Type-check, lint and build pass.

### Phase 1: Private storage and uploads (DONE 2026-11-23)
**Prerequisites:** Phase 0 done.
**Deliverables:**
- Private `pet-files` bucket with `documents/`, `vet-uploads/`, `photos/` prefixes; CORS set for presigned uploads.
- Server helpers: presigned upload (type check, size limit, key naming), short-lived signed download URLs, delete.
- Limits: PDF/JPG/PNG 10 MB, max 5 files per record; photos JPG/PNG/WebP 5 MB.
**Exit checks:** an owner can upload and open a file; wrong type or oversize is rejected on the server; another user cannot read it; no public URL works.

**Done notes (2026-11-23):**
- Bucket `pet-files` (private) was created on the Neon `main` branch. `STORAGE_BUCKET_FILES=pet-files` is set locally and on Vercel (production and preview, plain); redeploy to pick it up. The storage credential is shared, so stage reaches it too even though the stage branch does not list it.
- CORS on `pet-files` allows only `https://pawketbook.vercel.app`, `https://pawketbook-stage.vercel.app` and `http://localhost:3000` (GET, PUT, HEAD). Uploads from other branches' preview URLs are blocked by CORS; add that origin if a preview needs to upload.
- Code: `app/lib/storage.ts` (presign upload/download, head, delete), `app/lib/pet-files.ts` (type and size rules, server-made keys `documents|vet-uploads|photos/<petId>/<uuid>.<ext>`, post-upload verification that deletes a file that breaks the rules), routes under `/api/pets/[id]/documents` (`upload-url`, confirm `POST`, `GET` and `DELETE` on `[docId]`). Deleting a pet also deletes its stored files.
- Upload flow for Phase 2 and 4: presign, browser PUT, confirm. The confirm step checks the real stored type and size. The `vet-upload` kind is defined in the rules but has no route yet (Phase 4 adds the public, session-bound one). Photos still go through the server actions into `qr-codes/pet-photos/` until Phase 8.
- Exit checks run live with two test users: owner upload and open; wrong type, SVG, empty and oversize rejected; signed size or type mismatch rejected by the bucket (403); forged, foreign, `..` and wrong-prefix keys rejected; sixth file on a record rejected; another user gets 404 on read, presign, confirm and delete; signed-out gets 401; unsigned bucket URL and listing return 403; owner delete and pet delete both remove the objects.

### Phase 2: Owner records and documents (DONE 2026-11-23)
**Prerequisites:** Phase 1 done.
**Deliverables:**
- Owner create, edit and delete for their own records, with attached files.
- Schema: provenance fields on `HealthRecord` (source `OWNER` or `VET`, submitted vet name and clinic, voided state and who and when). Built now, used by Phases 4 and 5.
- Owner record list and detail views, with the vet-submitted badge ready. Includes the all-pets Health records page (filters by animal, type, year; search).
- Vet-submitted records are read-only for owners except the visit date, and cannot be deleted. Owner-created records are fully editable and deletable.
- Edit animal page (owner only) with an allergies field, photo slot, and the existing archive and delete. Add allergies to the registration form too.
**Exit checks:** owners fully manage their own records and files; vet-submitted records cannot be deleted or edited beyond the visit date; ownership enforced through the Phase 0 helper.

**Design decisions (2026-11-23, after checking Figma nodes 131:355, 131:1018, 131:1283, 131:1628, 39:1024):**
- **Type-specific fields as nullable columns** on `HealthRecord` (not a JSON blob, so they can be filtered and feed Phase 3 reminders): `dose`, `batchNumber`, `startDate`, `endDate`, `nextDueDate`. Per type: Vaccination = title (vaccine name), `recordDate` (date given), clinic, `batchNumber`, `nextDueDate`; Medication = title (medication name), `dose`, clinic (Figma's "Prescribed by"), `startDate`, `endDate`; Weight = `weightKg`; Check-up, Lab result and Other = title, date, clinic, notes. The provenance migration and these columns ship together in one Phase 2 migration.
- **Clinic and vet fields are free text**, not dropdowns (no partner clinics yet). `vetName` stays reserved for vet-submitted records (Phase 4); owner-created records only use `clinic`.
- **Keep `PetDocument`** as the file table. A file's `DocumentType` defaults from its record's type (Vaccination, Vet visit and Lab result map across; the rest become Other).
- **One shared record form** (fields per type, attachments panel) used for add and edit now and reused unchanged by the Phase 4 vet form.
- **Attachment flow:** files are chosen in the form and uploaded on Save, after the record exists, so no orphan files pile up if someone abandons the form. Each file shows progress and a clear rejection (for example "Can't attach video files"); if some fail, the owner lands on the edit page with the failures shown. A separate "Add attachments" dialog (Figma 131:1628) attaches files to an existing record, with a "Take a photo" camera option and the 5-file cap. Individual files can be removed on owner-made records only.
- **Edit record on vet-submitted records:** ignore Figma's copy-on-edit box and "Delete record" button (already decided); show a read-only view with the visit date editable.
- **Health records page:** animal chips (All animals plus one per animal), type chips (Vaccines, Medication, Check-ups, Lab, Weight, plus Other), year filter, search, Animal column, Add record button, record count line. Export PDF stays disabled until Phase 8.
- **Build order:** (1) migration, (2) shared form with create, edit and delete actions and the provenance guards, (3) attachments uploader and dialog, (4) all-pets Health records page and record detail, (5) Edit animal and allergies on registration, (6) smoke test with two users, then mark done.

**Done notes (2026-11-23):**
- Migrations `20261123140000_health_record_fields_and_provenance` and `20261123141000_drop_record_start_date` (applied to Neon `stage` only, **not yet to production**): `dose`, `batchNumber`, `endDate`, `nextDueDate`, `RecordSource` (`OWNER` / `VET`), `voidedAt`, `voidedById`, `voidReason`, `updatedAt` on `HealthRecord`. A medication's start date is `recordDate`, so the planned `startDate` column was dropped.
- Code: `app/lib/records.ts` (shared parsing and rules, weight sync), `app/lib/file-rules.ts` (shared by server and browser), `app/(owner)/records/actions.ts` (create, update, delete), `app/components/record-form.tsx` (the shared form with the attachments panel; Phase 4 reuses it), `record-date-form.tsx` (vet records: date only), `app/lib/upload-client.ts`, pages `/records`, `/records/new`, `/pets/[id]/records/new`, `/pets/[id]/records/[recordId]` and `.../edit`. The sidebar Health records link is live. Every record query hides voided records.
- Attachments: no separate dialog was built. The form's attachments panel handles drag and drop, browse, "Take a photo", per-file progress and rejection, the 5-file cap, and removing saved files; the same form covers existing records via Edit. Figma's standalone "Add attachments" modal (131:1628) is therefore not a separate screen.
- Vet-record rules enforced on the server: owners can change only `recordDate` (any other submitted field is ignored), cannot delete the record, cannot attach files to it or remove its files, and voided records are invisible to owners.
- Edit animal (allergies, photo, archive, delete) and allergies on registration already existed and were left as they are.
- Smoke test (browser, two users, live bucket): add vaccination with batch, next due date and two files; rejected text file; rejected sixth file; medication with dose and end date; two weight records (pet weight follows the newest and falls back after the newest is deleted); edit with a changed field, a removed file and added files; delete removed all the record's files from the bucket; vet-submitted record shows the badge, edits date only (injected title, clinic, type, notes and vet name were ignored), file delete returned 403 and attach returned 404; voided record hidden from lists and 404 on detail; another user got 404 on every record page and API; all-animals page filters (animal, type, year) and search (title, clinic) work. Type-check, lint and build pass.
- Not exercised live: the server-side refusal in `deleteRecord` for vet records. There is no UI path to it; it is a direct code check. Phase 4 should add a test when the first real vet record exists.

### Phase 3: Appointments, reminders and notifications (DONE 2026-11-23)
**Prerequisites:** Phase 2 done.
**Deliverables:**
- Owner-only appointment calendar (Upcoming / Done / Cancelled), on the pet's Appointments tab and the dashboard Vet visits card. No sidebar link and no all-pets Appointments page (decided 2026-11-23). No clinic confirmation states anywhere in the UI.
- Reminders (already in the schema), extended: types (medication, vaccine, feeding, grooming, exercise, habitat, appointment, other), repeats and end date, due computation, completion with a history (who, when), optional "also add to health records", and an assignee field (owner for now; caretakers become assignable in Phase 7). In-app only, no email option.
- Medication dose reminders (decided 2026-11-23): the medication record form has "Remind me at each dose" (dose times, until the end date) and "Also notify <caretaker>". Saving with it on creates repeating reminders linked to the record. Notifying a caretaker only works once Phase 7 exists, so that option is hidden until then.
- All-pets Reminders page (filters by animal and type, Upcoming / Overdue / Done) and the pet Reminders tab.
- `Notification` model, the bell, and the Notifications page (All / Unread, mark read, mark all as read). Trigger helper that later phases call. No notification settings page: the "Notification settings" link in Figma is removed (decided 2026-11-23); revisit only if email returns.
- Bell triggers live in this phase: reminders due.
**Exit checks:** a due reminder appears in the bell and on the dashboard; completing a repeating reminder schedules the next one and logs who completed it; read state persists.

**Design decisions (2026-11-23, after checking Figma nodes 142:1867, 142:2203, 9:1425, 185:1009):**
- **Appointments share the Reminders list.** Upcoming appointments show as calendar-tile cards in the Reminders views, read from `Appointment` (not copied). No Appointments sidebar item; the pet's Appointments tab and the dashboard card stay.
- **Repeat is an interval and a unit** (every N days, weeks, months or years) plus an optional end date. No "3x a week" pattern.
- **Form:** types, animal, title, start date and time, repeat, ends, and Place for the Appointment type only. Email, Phone and the Email notify option are dropped. "Remind me 1 day before" is kept. Live preview card with the next few dates. Assignee is the creator for now (Phase 7 adds caretakers and "whoever gets to it first").
- **Completion log** table (who, when, which due date). Feeds the "x of y done this week" panel and the Done tab.
- **Notifications** carry a `type`; tabs are All, Unread, Appointments and Reminders. Triggers this phase: reminder due, reminder overdue, reminder coming up (1 day before, if chosen) and appointment coming up. Created lazily when a signed-in user loads a page (no scheduler), de-duplicated per reminder and due date. The clinic-confirmation and clinic-message examples in Figma stay unbuilt.
- **Needs-attention banner** shows the oldest overdue reminder.

**Done notes (2026-11-23):**
- Migration `20261123150000_reminders_and_notifications` (applied to Neon `stage` only, **not yet to production**): `ReminderCategory` is now Medication, Vaccine, Feeding, Grooming, Exercise, Habitat, Appointment, Other (old Care becomes Other, Walk becomes Exercise, Check-up becomes Appointment); `Reminder` gained `repeatEvery`, `endsAt`, `remindDayBefore`, `place`, `addToRecords`, `assigneeId` (existing rows get the pet's owner) and `recordId` (dose reminders, cascade on record delete); new `ReminderCompletion` (who, when, which due date) and `Notification` (type, title, body, href, `dedupeKey`, `readAt`, unique per user and event) tables.
- Reminders: shared rules in `app/lib/reminders.ts` (form parsing, `completeReminderIn`, dose reminders); actions in `app/(owner)/reminders/actions.ts` (`createReminder`, `completeReminder`, `deleteReminder`). Completing logs a `ReminderCompletion`, rolls a repeating reminder to its next date (skipping missed ones, stopping after the end date) and optionally writes a health record. Pages: `/reminders` (Upcoming / Overdue / Done / All, animal and type filters, overdue banner, "x of y done this week", appointments as calendar tiles), `/reminders/new` (live preview), and the pet Reminders tab. The sidebar Reminders item links to `/reminders`; the Appointments sidebar item is removed.
- Dose reminders: the medication record form has "Remind me at each dose" with up to 6 times; saving needs an end date and creates one daily reminder per time linked to the record. Editing rewrites them; turning the option off or deleting the record removes them.
- Appointments: the pet tab now has Upcoming / Done / Cancelled with counts, a "Mark as done" control for past-dated visits, and cancel.
- Notifications: `app/lib/notifications.ts` (`notify()` for later phases, `syncDueNotifications`, `unreadCount`), the bell with an unread badge, and `/notifications` (All, Unread, Appointments, Reminders, Mark all as read; each row opens through `/notifications/[id]`, which marks it read). Types created this phase: reminder due, overdue, coming up (1 day before, if chosen) and appointment within 24 hours. There is no scheduler, so they are created when a signed-in user loads a page with the bell or the Notifications page, de-duplicated per reminder and due date. Assignee is the creator for now.
- Smoke test (browser, local dev against the stage DB, two users, test data deleted afterwards): due, overdue, coming-up and appointment notifications appear; opening one marks it read and goes to the pet; mark all as read persists; a weekly-every-2 reminder rolled forward 14 days and logged who completed it; a repeating "every 3 months" appointment reminder rolled to 23 Feb 2027 and wrote a Check-up record with its place; Done tab lists completions; dose reminders created from a medication record, prefilled on edit, removed when switched off; past-dated appointment marked done and listed under Done; another user gets 404 on the pet's reminders, appointments and new-reminder pages, and cannot open or mark read the first user's notification. Type-check, lint and build pass.
- Time zones fixed afterwards (see below). Known limits: not exercised live: the `deleteReminder` and `completeReminder` ownership checks for a second user (they use the same `ownedPets` filter as the other actions). "Whoever gets to it first" and the "Only mine" filter wait for Phase 7.

**Time zone fix (2026-11-23, after Phase 3):** the whole app now uses one time zone, `Asia/Manila`, set as `APP_TIME_ZONE` in `app/lib/time.ts` (change it there if the app ever serves another region). Form dates and times are parsed as Manila time, "today" and day boundaries, repeat stepping (months and years clamp to the month end, so 31 Jan + 1 month = 28 Feb) and every displayed date and time use it, so a UTC server (Vercel) and a Manila browser agree. Record, birth and end dates are date-only values stored as UTC midnight and are read back as UTC. Checked with unit cases under UTC and Los Angeles server clocks, and live with the dev server forced to UTC. Known limit: a monthly reminder that starts on the 29th to 31st drifts to the clamped day after a short month (31 Jan, 28 Feb, 28 Mar), because only the current due date is stored.

### Phase 4: Vet QR flow (DONE 2026-11-23)
**Prerequisites:** Phases 1, 2 and 3 done (uploads, record provenance fields, bell).
**Deliverables:**
- Record-request token model: hashed token, pet, allowed sections, 24 h expiry, burned-at, revoked-at, created by.
- Owner UI: a "Generate vet QR" button on the pet page (next to "Add record", and on the pet's Health records tab), available to owners and caretakers. It opens a dialog to choose the readable sections, then shows the one-time QR and link with a 24 hour countdown. Also list active and used QRs and revoke unused ones.
- Abuse protection (decided 2026-11-23): tokens are long and random (at least 128 bits, stored hashed); per-IP rate limits on the public routes (page load, upload, submit); at most 5 active (unused, unexpired) QRs per pet; one submission per QR. No CAPTCHA.
- One-time use means one burned token and one record per QR: the first real load burns the token and starts the ~45 minute session, the vet submits one record inside it, and the QR is then spent. A further record needs a new QR.
- Public no-login page: burns the token on the first real load (not on bots or link previews), starts a cookie-bound session of about 45 minutes.
- Vet form: reuse the add-record form built in Phase 2 (same component, per-type fields and attachment uploader) in a public, no-login layout. Differences: Vet Name and Clinic Name are required, the animal is fixed to the QR's pet, and all six record types are offered (vaccination, check-up or vet visit, lab result, medication, weight, other; decided 2026-11-23). Plus a read-only view of the allowed sections. Server-side checks and per-session upload cap. Build the Phase 2 form as a shared component so Phase 4 does not fork it.
- Bell trigger: vet record submitted.
**Exit checks:** expired, revoked, burned and unknown tokens are rejected; a bot request does not burn the token; the session cannot see sections the owner did not allow; the submitted record shows with the badge; the owner can edit only its visit date and cannot delete it.

**Design decisions (2026-11-23).** The Figma file has no vet-side screens (checked all three pages), so these were built in the existing look (the forest frame and cream card of the QR scan page, the owner dialog style, the Phase 2 form):
- **Readable sections** reuse the ID-and-QR page's "Vet health summary" wording: Allergies, Vaccine status, Current medication, Additional notes. Basic info (name, species, age, sex) is always shown; owner contact details never. Allergies and Vaccine status are ticked by default.
- **Opening the link changes nothing.** The first visit shows a Start step that reveals no pet data; only tapping Start burns the link and starts the session. Link previews and bots therefore cannot spend it.
- **Record first, files after.** Submitting the form creates the record and spends the QR in one transaction; the vet's files then upload through the live session and attach only to that record.
- **Where things live:** "Generate vet QR" is on the pet overview and Health records tab; the recent-QR list (with Cancel) sits under the records list.

**Done notes (2026-11-23):**
- Migration `20261123160000_vet_record_requests` (applied to Neon `stage` only, **not yet to production**): `RecordRequest` (token hash, sections, expiry, burned, session hash and expiry, used, record, revoked, upload count) and `RateLimit` (fixed-window counters in Postgres, since serverless has no shared memory).
- Tokens are 256-bit random values; only the SHA-256 hash is stored, so a link can't be shown again after the owner closes the dialog. Session secret is an httpOnly cookie (hash stored), valid 45 minutes. Code: `app/lib/vet-access.ts`, `app/lib/rate-limit.ts`, public page and actions under `app/v/[token]/`, upload routes under `app/api/vet/[token]/` (presign and confirm, same three-step flow as owner uploads, `vet-uploads/` prefix, server-side type, size and file-count checks).
- The shared `RecordForm` gained a `vet` prop (Your name and Clinic name required, animal fixed, all six types, no dose reminders, submits through the QR session). Not forked.
- Limits: at most 5 active QRs per pet, 10 upload hand-outs per session, per-IP windows of 60 page loads a minute, 10 Start taps per 10 minutes, 20 submits and 60 uploads an hour. The bell shows "<vet> added a record for <pet>".
- Smoke test (browser, local dev against the stage DB, owner, second owner and a no-login vet browser, test data and bucket file deleted afterwards): three bot-style requests left the QR unburned and showed no pet data; Start burned it and began a 45 minute session; the vet saw only the two allowed sections (a "notes" value on the pet never appeared); submitting with a PNG created a Vet-submitted record with the vet's name and clinic, attached the file under `vet-uploads/`, spent the QR and notified the owner; replaying the link without the cookie said already used; the upload API returned 403 without the session and 429 after 10 hand-outs; an expired, a cancelled and an unknown link each showed their own message; the sixth active QR was refused with a clear message; owner could open the vet's file through a signed URL and sees only "Edit visit date"; another owner got 404 on the pet; the page limiter blocked requests past 60 a minute.
- Known limits: the owner-side `deleteRecord` refusal for vet records still has no UI path and was not exercised live. A revoke during a live session is covered by the state check order but was not exercised live. A presigned upload that is never confirmed can leave an orphan object in `vet-uploads/` (the cap bounds it; a sweep is not built). Caretakers can generate vet QRs once Phase 7 exists.

**Fix after Phase 4 (2026-11-24): the vet QR now points at the site the owner is using.** The QR used the fixed `APP_URL` setting, so wherever that setting was wrong (a stale tunnel address in the local `.env`, a preview deployment, localhost) the QR looked fine but opened a dead address. `vetUrl` now takes the address from the request (`requestOrigin` in `app/lib/vet-access.ts`: the `Origin` header, which Next already checks against the host for server actions, then the forwarded host, then `APP_URL` as a last resort). The dialog warns when that address is localhost or a private network address, since a vet's phone can't open it, and the QR quiet zone is a little wider. The flow itself is unchanged and was re-tested end to end: scan, Start, one record, QR spent, replay refused, and the rendered QR decodes to exactly its link. The pet tag QR codes still use `APP_URL` on purpose, because they are printed and need one stable address. Checked 2026-11-24: Vercel Deployment Protection (login, password and trusted IPs) is off for the whole project, and the stage site opens for a signed-out visitor, so a vet can scan a QR made on stage without a Vercel account.

### Phase 5: Admin void and audit (DONE 2026-11-24)
**Prerequisites:** Phase 4 done.
**Deliverables:**
- Admin can void or delete a vet record; it stays in the audit trail as voided (who, when, why).
- Owner can report a vet record; the admin sees reports.
- Voided records are hidden from normal owner views and visible in the admin audit view.
**Exit checks:** only admins can void; the audit entry is permanent and readable.

**Done notes (2026-11-24):**
- Migration `20261124065856_admin_void_and_audit` (applied to Neon `stage` only, **not yet to production**): `RecordReport` (reporter, reason, `OPEN` / `RESOLVED` / `DISMISSED`) and `AuditEntry`, an add-only log that holds plain copies (admin, pet, owner email, record title, type, date, vet, clinic, reason) with no foreign keys, so an entry survives the record, pet or admin being deleted. The void state itself (`voidedAt`, `voidedById`, `voidReason`) was already on `HealthRecord` from Phase 2.
- Only vet-submitted records can be voided; owners delete their own. Voiding is permanent (no restore), requires a reason of at least 5 characters, resolves the record's open reports, and writes the audit entry in the same transaction. Dismissing a report also writes an audit entry. Two admins acting at once cannot both succeed.
- Owner side: "Report a problem with this record" on a vet record's page (one open report per owner per record, at most 10 open at once). Voided records are hidden everywhere owners look, and their files are now also refused by the owner file route.
- Admin side: `/admin/records` with Reports, Vet records and Audit trail tabs, and `/admin/records/[id]` (details, files through the admin-only `/api/admin/documents/[docId]`, report list, dismiss and void). "Vet records" is in the admin nav. Admin role is enforced by `requireAdmin` on every page and action and by a 403 on the file route.
- Smoke test (browser, local dev against the stage DB, owner and admin test users, test data deleted afterwards): owner reported a vet record (too-short reason refused); owner was redirected away from `/admin`; admin saw the report; a 3-character void reason was refused; void succeeded, the report became resolved and the audit tab showed who, when and why; the owner then got 404 on the record and no longer saw it in the list. Type-check, lint and build pass.
- Known limits: the owner is not notified when a report is resolved. Voiding the only vet weight record leaves the pet's weight at the voided value, because there is no earlier weight to fall back to. A voided record's files stay in the bucket.

### Change after Phase 5: tracked edits and locked files (2026-11-24, built directly on `stage`)
Reverses part of the Phase 2 rules. Decided with the developer:
- **Owner-made records stay fully editable, but every saved change is tracked.** A `RecordEdit` row records who, when and each field's old and new value. The record page shows "Edited on mm/dd/yyyy, h:mm AM" (app time zone) and a History section. Adding a file to an existing record is also logged.
- **Vet-submitted records stay locked** except the visit date (now also logged), and the owner can add notes.
- **Notes can be added to any saved record** (`RecordNote`, add-only, each with who and when; never edited or removed). This is separate from the record's own notes field, which owners can still edit on their own records.
- **Saved files are locked on every record.** No file can be removed or replaced (the delete route now always returns 403, the remove button is gone); new files can still be added to an owner-made record. Files are only deleted along with their record or animal.
- Migration `20261124071149_record_edit_history_and_notes` (applied to Neon `stage` only, **not yet to production**).
- Known limits: deleting an owner-made record still removes it, its history and its files; the admin record page does not show history or notes; dose-reminder time changes are not written to the history.

### Phase 6: Lost-pet messaging (DONE 2026-11-24)
**Prerequisites:** Phase 3 done (bell). Lost mode and owner contact details already exist.
**Deliverables:**
- Thread and message models, in Postgres. A thread starts only when a signed-in owner scans a lost-mode pet's QR (`/r/[code]`); the pet's owner is the other side.
- Two-way chat with an inbox, unread counts and polling while a chat is open.
- Bell trigger: lost-pet message.
- Rate limits and a report or block control for abuse.
- Messages are unavailable when the pet is not in lost mode; shared invitees cannot see them.
- Lost-mode public info settings (ID and QR tag tab, Figma 203:5464): every field is individually toggleable with a pill switch (decided 2026-11-23). Groups and fields, as in Figma: Pet information (pet's name, species, age, gender); Lost pet contact (owner first name, owner city, allow finders to SMS or call, message through Pawket Book); Vet health summary (allergies, vaccine status, current medication, additional notes). Data model: a per-pet settings row (or JSON column) with one boolean per field, created in the Phase 6 migration (not before; the Neon database is shared). The scan page (`/r/[code]`) and its mobile preview return only fields switched on, and only while lost mode is on; defaults are decided at build time (suggest: pet name, species, age, gender and Message in app on; health and phone off). The owner's phone number only reaches the page through the SMS/call buttons (their links expose it), so it is included only when that toggle is on.
**Exit checks:** a non-owner sees nothing of a non-lost pet; a field switched off never appears in the scan page response; messaging works both ways; unread counts correct.

**Done notes (2026-11-24):**
- Migration `20261124073352_lost_pet_messaging_and_public_settings` (applied to Neon `stage` only, **not yet to production**): `PetPublicSettings` (one boolean per switch plus a short public note; a pet with no row uses the defaults), `MessageThread` (one per pet and finder, with each side's last-read time and a block flag), `Message`, `ThreadReport`, and `User.city`.
- **Defaults** (a pet that never saved its settings): pet name, species, age, gender, owner first name and "Message in app" on; city, SMS/call, allergies, vaccine status, medication and notes off. The pet photo is not a switch: it is always shown on a lost pet's scan page so a finder can recognise it.
- **Scan page** (`/r/[code]`, rebuilt as the Figma member card): while the pet is **not** in lost mode a stranger sees only "registered, nothing to show", with no pet data at all. In lost mode one function, `applySettings` (`app/lib/scan-view.ts`), decides every field, and the owner's live preview on the new ID and QR tag tab uses the same function, so the preview cannot differ from the page. The owner's number only appears inside the `sms:` and `tel:` links, and only when "Allow finders to SMS or call me" is on and a number exists. "Your city" comes from the new City field on My details; the address and the account-level show-phone and show-address switches are no longer used (columns kept).
- **ID and QR tag tab** (`/pets/[id]/tag`): QR with download, lost-mode switch, the pill switches grouped as in Figma, a note box, and the preview. Saving goes through the owner check.
- **Messaging:** a thread starts only from the scan page, by a signed-in non-owner, while the pet is lost, not archived and "Message in app" is on (5 new threads per user per hour). Inbox at `/messages` (the Messages sidebar item is live with an unread badge), chat at `/messages/[threadId]` polling `/api/messages/[threadId]` every 4 seconds while the tab is visible (30 messages per 10 minutes, 1000 characters). The bell gets one "New message about <pet>" per burst of unread messages (the dedupe key follows the reader's last-read time). Names shown are only what each side allows: the owner sees the finder's first name, the finder sees the owner's first name only if that switch is on.
- **Unavailable means closed, not deleted:** when the pet is not lost, is archived or has messaging switched off, the thread returns 404 to both sides and drops out of the inbox and the unread count; switching lost mode back on resumes it. The owner side is always `pet.ownerId`, so people a pet is later shared with (Phase 7) never see threads.
- **Abuse controls:** either side can block (the blocker can unblock; nobody can send while blocked) and report (the thread is blocked and an admin reads the transcript at `/admin/messages`, then marks it resolved or dismisses it; banning is on the existing Users page).
- Smoke test (browser, local dev against the stage DB; owner, finder, bystander and admin test users, all deleted afterwards): the non-lost scan page showed nothing; the lost-mode scan showed only the default fields; a switched-off allergy never appeared in the page; the owner's number was absent from the page until SMS/call was switched on, then appeared only in the `sms:` and `tel:` links; the finder started a thread, the owner saw unread 1 in the sidebar and inbox and one bell notification, replied, the finder's open chat received it by polling and the owner's unread cleared; a third user got 404 on the thread page and API and saw an empty inbox; turning lost mode off made the thread 404 for both sides and it returned when switched back on; a too-short report was refused, a valid one blocked the thread (the owner saw no send form and no unblock) and the admin saw the transcript. Type-check, lint and build pass.
- Known limits: conversation reports have no unblock or audit entry for the admin (resolve and dismiss only, not written to `AuditEntry`). Message history is kept while the pet is not lost but is unreachable. The server-side refusal to send in a blocked thread was not exercised live (the UI hides the form). A finder who is not signed in can only text or call, or sign in to message.

### Phase 7: Shared access (DONE 2026-11-24)
**Prerequisites:** Phases 0 (access helper), 4 (vet QR) and 6 (so message privacy can be verified) done.
**Deliverables:**
- Invite a registered user to a pet; accept or decline; revoke.
- Invite by email (caretaker must have an account); remove a caretaker from the Edit animal page and from "Invite caretaker" on My animals.
- Invitee role ("caretaker", see 2026-11-23 decisions): view the pet and its records, generate vet QRs, be assigned reminders and complete them; cannot edit animal info, add animals to the owner's profile, or edit records; no owner contact details; no lost-pet messages.
- Reminders: owner can assign to a caretaker or "whoever gets to it first"; caretakers see their assigned reminders and complete them; completion is logged by user.
- Bell triggers: shared access invite, caretaker completed a reminder.
**Exit checks:** every pet route and server action is verified against the viewer role; invitees cannot write animal info or records, cannot see contact details or messages, can complete only reminders on pets shared with them, and lose access immediately on revoke.

**Done notes (2026-11-24):**
- Migration `20261124075412_caretaker_shares` (applied to Neon `stage` only, **not yet to production**): `PetShare` (pet, caretaker, who invited, `PENDING` / `ACCEPTED` / `DECLINED`, unique per pet and person). Only an `ACCEPTED` row gives access, as the `viewer` role in `app/lib/pet-access.ts`; removing a caretaker deletes the row, so access ends on their next request.
- **One access helper.** `getPetAccess` returns `owner`, `viewer` or null; `accessiblePets` includes accepted shares; `ownedPets` stays owner-only; the new `visibleReminders` gives an owner every reminder on their animals and a caretaker only the ones assigned to them or open to "whoever gets to it first". `getAccessiblePet` (any role) and `getOwnedPet` (owner only, 404 for a caretaker) are the two page loaders; `getViewableRecord` and `getOwnedRecord` do the same for records.
- **Caretaker role, as built:** can see the animal, its health records (read only, with history and notes), appointments (read only), the reminders given to them, and generate vet QR codes (and cancel their own). Cannot edit the animal, archive, delete, toggle lost mode, change the scan page settings, add or edit records or notes, report a record, add reminders or appointments, delete reminders, or see the ID and QR tag tab, the owner's contact details or lost-pet messages. Every owner-only page returns 404 and every owner-only action refuses.
- **Invitations:** the owner invites by email from the Edit animal page (the Caretakers card lists everyone with their status and a Remove button) or from "Invite caretaker" on My animals (pick the animal). The person needs an account; up to 10 caretakers per animal, 10 invitations per hour. The invitee gets a bell notification and a banner on My animals with Accept and Decline. Declined invitations can be sent again. A caretaker can leave from the animal's page ("Stop helping with ..."). Shared animals show "Shared by <owner>" on My animals and the animal's page.
- **Ending access** (remove or leave): their share is deleted, reminders assigned to them go back to the owner, and any vet QR they made that is not yet used is cancelled.
- **Reminders:** the new-reminder form has "Who does it": me, a caretaker, or whoever gets to it first (shown only when the animal has caretakers). Medication dose reminders have the same choice ("Who gives the doses"), which replaces the plan's "Also notify <caretaker>" option. Cards show "You", the caretaker's name or "Anyone". A caretaker can complete only their own or open reminders; completing logs who did it and puts "<name> completed <reminder>" in the owner's bell.
- **Scan page and messaging:** an owner or caretaker who scans the animal's tag is sent to the animal instead of seeing the finder view, and neither can start a lost-pet thread.
- Smoke test (browser, local dev against the stage DB; owner, caretaker and stranger test users, all deleted afterwards): unknown and own email refused, duplicate invitation refused, invitation shown and the animal still 404 until accepted; as an accepted caretaker the overview showed only Stop helping and Generate vet QR, the tab bar had no ID and QR tag, edit, tag, new record, new reminder, new appointment and edit record all returned 404, the record page had no Edit or note box, the reminders tab showed only the assigned and the open reminder (the owner's own task was hidden) with no delete, completing one logged the caretaker and notified the owner, and a vet QR was generated and listed with Cancel; the stranger got 404 on every page and API; removing the caretaker deleted the share, handed their reminder back to the owner, cancelled their QR and gave them 404 at once; a declined invitation gave no access and could be re-sent. Type-check, lint and build pass. The smoke test found one real bug (a constant exported from a server-actions file), now fixed.
- Known limits: the owner is not told when an invitation is accepted or declined (it shows on the Edit page). A caretaker's appointment notifications are the same ones the owner gets. A reminder with "also add to health records" still writes the record when a caretaker completes it, because the owner chose that setting. Direct calls to the owner-only server actions were checked in code (every one filters by the owner or by `visibleReminders`) but only the pages and buttons were exercised live for a caretaker.

### Phase 8: Pet photos, PDF export and search (DONE 2026-11-24)
**Prerequisites:** Phase 7 done (so export respects roles).
**Deliverables:**
- Owner uploads a photo on add or edit pet; server-side resize to a thumbnail and a large image; species-icon fallback. (A photo route already exists; reconcile it with the private bucket.)
- Export PDF: printable one-pet health summary, vet entries marked, files listed not embedded.
- Header search (decided 2026-11-23): searches the signed-in user's animals, records and reminders, going through the Phase 0 access helper so caretakers only see pets shared with them. Placeholder text becomes "Search animals and records"; clinics are dropped.
**Exit checks:** search results never include pets the user cannot access; the export contains only what the viewer may see; photos are served through signed URLs.

**Done notes (2026-11-24):**
- Migration `20261124081237_pet_photo_thumbnails` (applied to Neon `stage` only, **not yet to production**): `Pet.photoThumbKey`. New dependencies: `sharp` (resizing) and `pdf-lib` (PDF).
- **Photos** (`app/lib/pet-photo.ts`): the owner uploads on add or edit animal (still up to 5 MB, JPG/PNG/WebP, sent through the form). The server checks the real format from the bytes, turns the picture upright, strips camera and location metadata, and stores two WebP copies in the private `pet-files` bucket under `photos/<petId>/`: a large one (up to 1200 px) and a 256 px square thumbnail. Replacing or removing a photo deletes the old files, and deleting an animal now deletes its photos too (before, it left them behind). The edit page has a "Remove photo" button; with no photo the species icon shows. Avatars use the thumbnail, the big banner, the scan page and the scan preview use the large copy. A bad or unreadable photo is refused before a tag is claimed.
- **Served only through signed URLs:** `/api/pets/[id]/photo` (owner and caretakers; `?size=thumb` for the small copy) redirects to a 5 minute signed URL; the scan page signs its own. There is no public URL.
- **Older photos** (`pet-photos/<id>.<ext>` in the original `qr-codes` bucket, full size with metadata) keep working until replaced, and `scripts/migrate-pet-photos.mjs` moves them into the new format (optionally for one pet: `node scripts/migrate-pet-photos.mjs <petId>`; against production with `DATABASE_URL=<production url>`). It is safe to run twice and only deletes the old photo after the new copies and the row are saved. **It has not been run on the real photo on stage, or on production**; run it after the deploy (production had its photo count left unchecked because the read was not permitted from here).
- **Export PDF** (`app/lib/pet-pdf.ts`, `GET /api/pets/[id]/export`, 20 per hour per user): the animal's details, allergies, vaccinations, current medication, then every record newest first. Vet-submitted records carry a "VET-SUBMITTED" mark, edited records an "Edited on" line, added notes appear, and attached files are listed by name and size, not embedded. It is the same for the owner and a caretaker, leaves out voided records, and never includes the owner's contact details, lost-pet messages or reminders. Characters the PDF font can't draw (such as emoji or Japanese) print as "?" instead of failing. The buttons on Health records (per animal, or the only animal) and on the animal's records tab are live.
- **Search:** the header box now submits to `/search` (placeholder "Search animals and records"; clinics are no longer a headline). It looks through the signed-in user's animals (name, breed, species, colour, microchip), records (title, clinic, vet, notes) and reminders (title, place), up to 20 of each, starting from `accessiblePets` and `visibleReminders`, so a caretaker finds only what they could already open and only the reminders given to them. Voided records and archived animals are not searched.
- Smoke test (browser and curl, local dev against the stage DB, owner, caretaker and stranger test users; the test pet's bucket files and all rows deleted afterwards): a text file renamed `.png` was refused; a 3000x2000 JPEG with EXIF rotation and camera metadata became an upright 800x1200 WebP plus a 256x256 thumbnail, both without metadata; the route gave 200 to the owner, 404 to a stranger and 401 signed out; replacing and removing the photo each deleted the old bucket file (the old signed URL turned 404); the PDF was 200 for the owner and caretaker, 404 for a stranger and 401 signed out, showed the vet mark, the attached file name, the added note and the edit line, left out a voided record and any reminder, and paged correctly with 40 extra records (7 pages); emoji and Japanese text did not crash it; search found the owner's animal, records (by title and by vet name) and reminders, found only the caretaker's own reminder and none of the owner's, found nothing for a stranger, hid a voided record, and the header box worked end to end; a legacy photo still displayed, was moved by the script (large and thumbnail created, old object deleted, route served the new one) and a second run did nothing. Type-check, lint and build pass.
- Known limits: the migration script has not been run against the real stage photo or production yet. Photos still upload through the form (5 MB limit), not a presigned upload. Search is a plain "contains" match, with no ranking or typo tolerance. A reminder's search result opens the animal's reminders tab rather than the single reminder.

### Phase 9: NFC tags (DONE 2026-11-24)
**Prerequisites:** Phase 8 done. Requested by the developer after Phase 8.
**Decisions (2026-11-24):**
- **The tag holds our link.** A tag stores `https://<app>/r/<code>`, the same code and link the QR carries. A tap with any phone's normal NFC reader (iPhone or Android, no app) opens the scan page exactly like scanning the QR: the owner and caretakers land on the animal and its records, a finder sees the lost-mode page, an unclaimed tag opens registration. Nothing about the scan page changed.
- **Admin prepares, owner taps to claim.** NFC tags share the QR code list and its statuses (unused, claimed, revoked); there is no separate tag table. The admin writes a code onto a physical tag, and the owner taps it to register an animal, the same as scanning a QR. An owner can also write their own animal's link onto an extra tag.
- **The web app reads and writes tags with Web NFC**, which only exists in Chrome on Android over HTTPS and needs a tap on a button each time. Other browsers show a message that points to the QR code or the phone's own NFC reader. (iPhone browsers can't read tags in a page, but an iPhone can still open a tag that holds our link.)
**Deliverables (built):**
- Migration `20261124083444_nfc_tags` (applied to Neon `stage` only, **not yet to production**): `QrCode.nfcWrittenAt` and `QrCode.nfcSerial` (the chip's serial number).
- `app/lib/nfc.ts` (read a tag, write a tag, plain-language errors), `app/lib/code.ts` (code format and extracting a code from a link, shared with the server) and `app/components/nfc-buttons.tsx` (`Tap an NFC tag`, `Write to an NFC tag`).
- **Scan a tag** page (`/scan`, the header's QR icon now goes there): camera QR, NFC tap or typed code, then it opens `/r/<code>`. Add animal's scan step also has the NFC button.
- **Registration check:** when the code came from a tap, the chip's serial is sent with the form. If the admin recorded a chip for that code, the tapped chip must match it (otherwise "This isn't the NFC tag that was set up for that code"); if none was recorded, the first tapped chip is remembered. Typed or camera-scanned codes are not checked.
- **Admin** (QR codes page): each code has "Write to NFC tag", which writes the link, records the chip serial and the time, and has an optional "lock for good" tick (only where the browser supports locking; it can never be undone).
- **Owner** (ID and QR tag tab): "Write to an NFC tag" puts the animal's link on an extra tag.
**Exit checks:** a tag holding our link opens the same page as the QR; the app reads a code off a tapped tag; a tapped tag that doesn't match the one set up for its code is refused; an unsupported browser gets a clear message instead of an error.

**Done notes (2026-11-24):**
- Smoke test (browser, local dev against the stage DB, owner and admin test users, test codes and pets deleted afterwards). **There was no NFC hardware, so the tag itself was simulated:** a stand-in `NDEFReader` was installed in the page and behaved like Chrome's (a `reading` event with the chip serial and URL records, and `write()` keeping what it was given). That exercises all of our code (parsing, validation, the server checks and the screens) but not the phone's NFC radio or Chrome's permission prompt. Results: without NFC support the buttons said so clearly; tapping a registered animal's tag on `/scan` opened the animal's page; a tag holding a foreign link and a blank tag were each refused with a clear message; registering with the right code but the wrong chip was refused and created nothing, the right chip registered the animal, and a code with no chip on record kept the first tapped chip; the owner's write put exactly `{recordType: url, data: <app>/r/<code>}` on the tag; the admin write put the same link, saved the chip and the time, and the lock tick said the browser couldn't lock it. Type-check, lint and build pass.
- **Needs a real-phone test before relying on it:** write a tag and read it back with an Android phone in Chrome over HTTPS (the stage or production site), then tap the same tag with an iPhone and an Android phone's normal reader and confirm it opens the scan page.
- Limits: the chip serial check only catches the wrong physical tag at registration; it does not stop someone copying a tag's link, which is also true of the QR code (a copied tag opens the same page). Unlocked tags can be overwritten by anyone with a phone, so lock admin tags where the browser allows it. Web NFC cannot read or write on iPhone or desktop browsers. Tags with a different layout (not a URL or text record) are ignored.

### Phase 10: Find a vet with OpenStreetMap (PLANNED, not started; decided 2026-11-24)
**Prerequisites:** Phase 9 done. Nothing for the developer to set up: OpenStreetMap needs no account, key or billing.
**Goal:** a **Find a vet** page that shows vet clinics near where the owner is right now, in a list and on a map, from the Figma frames 190:3963 (page) and 190:4427 (Filters). It replaces the earlier decision that Find a vet stays locked until clinics exist. It only finds and shows clinics; it does not connect to appointments, records or messages, and no clinic accounts are involved.

**Why OpenStreetMap, and what it costs us.** Free, no keys, no card. Google Places was planned first (see "Option kept for later") but needs a billing account and quota caps to stay free. A real query on 2026-11-24 (5 km around Quezon City's centre) found **39 clinics, all named and all vet-only**, but only **3 had opening hours, about 3 a phone number, none a website, and only 2 had any animal tag (neither names an animal)**; OpenStreetMap has **no ratings**. So the list and map work well, while "Open now", phone, website and animal-type filters will apply to few clinics.

**Decisions (2026-11-24):**
- **Data:** the public Overpass API, asking for `amenity=veterinary` (nodes, ways and relations) around a point. Vet clinics only, by definition of the query. One or two public mirrors, listed in an optional `OVERPASS_URLS` environment variable (default: the main public server). Overpass is shared and free, so we follow its etiquette: one query at a time, a timeout, and a plain "busy, try again" message on 429 or 504.
- **Where the owner is:** the browser's current location, asked for when the page opens or on "Use my location" (HTTPS and permission needed). If denied, the owner types an area and the app finds its centre with **Nominatim** (search on submit only, never as-you-type, at most one request a second, one at a time); distances then work from that centre. Nothing about the owner is stored.
- **Privacy of the position:** the owner's exact position stays on our server only for the request (to work out distances). What goes to Overpass, and what the cache is keyed by, is a **rounded grid cell** (about 1 km) with a margin added to the radius. The tile server for the map also sees the owner's IP, as any map does.
- **Requests identify the app generically** (`PawketBook/1.0`); no personal contact details go in a User-Agent unless the developer chooses to add one in `OSM_CONTACT`.
- **Cache:** results per grid cell and radius are kept in Postgres for 24 hours (a small table; OpenStreetMap's licence allows it), so most searches make no outside call. Search is limited per user with the existing rate limiter.
- **Map:** Leaflet with the standard OpenStreetMap tiles, numbered markers matching the list rows, fit-to-results and a marker for the owner. The visible credit "© OpenStreetMap contributors" is required and always shown. The public tile server is for light use; if traffic grows, move to a tile provider (some free tiers need a key).
- **Rating is dropped** (no data): the Rating section of the Filters frame is removed. Sort is **Nearest** (default) and **Name A to Z**.
- **Open now / Open 24 hours** use the clinic's `opening_hours` tag (parsed with the free `opening_hours` library) where it exists: "Open, closes 8:00 PM", "Closed, opens 10:00 AM", "Open 24 hours". Clinics with no hours show "Hours not listed". The "Open now" chip keeps only clinics known to be open and says how many clinics list no hours.
- **Animal type and Home visits are keyword guesses**, as chosen earlier, from the clinic's name and its `animal` and `veterinary:speciality` tags. Dogs and Cats keep every clinic unless its name or tags show only other animals (aquatic, exotic, avian, poultry, livestock, equine); Birds, Poultry, Reptiles and Fish keep only clinics whose name or tags suggest them ("exotic" counts for birds and reptiles); Home visits looks for words like "mobile" and "home service". Tags on a row are labelled "possible match".
- **Search box** filters the clinics already loaded by name; the location field does the area search.
- **Directions:** each clinic has "Get directions" (a plain Google Maps link, no API or key, which opens the Maps app on a phone) and "View on OpenStreetMap". No route line is drawn.
- **Phone and website** show only when the tag exists (`tel:` and a link).
- A small "Missing a clinic? Add it on OpenStreetMap" link, since the data is community-made.

**Deliverables (steps):**
1. **Server.** `/api/vets/search` (signed in only): takes the position or an area, radius and filters; rounds the position to a grid cell; reads the cache or makes one Overpass call; normalises each clinic (name, address from `addr:*` tags, position, phone, website, hours status, animal tags, distance); applies the filters and sort; returns at most about 100 nearest. Area search goes through a separate `/api/vets/geocode` that calls Nominatim once. A provider interface keeps the source swappable. Errors return friendly messages, never raw upstream output.
2. **Cache table** `VetSearchCache` (key, result, fetched time) in a new migration, applied to stage first.
3. **Page `/vets`.** Search box, location field ("Current location" or the typed area), "Open now" chip, the Filters panel (animal type, availability, distance slider 0 to 20 km), sort, count line and the list from the Figma frames. Filters live in the URL. The sidebar item and the dashboard "Find a vet" button are unlocked.
4. **Map.** Leaflet map synced with the list (click a marker or row to select), attribution, and on a phone a list/map toggle.
5. **Clinic details.** Address, hours or "Hours not listed", phone, website, directions links.
6. **Docs and deploy.** Update this file, the Figma index and the deploy checklist (the migration, optional `OVERPASS_URLS` and `OSM_CONTACT`).

**Exit checks:** only `amenity=veterinary` places are returned; an uncached search makes one Overpass call and a cached one makes none; the exact coordinates are never stored or sent to Overpass (only the rounded cell); signed-out users get nothing; denied location falls back to the typed area (with at most one Nominatim request a second); each filter changes the results as described above; clinics without hours say so and are not shown as open; the attribution is visible on the map; the list and the map agree.

**Testing:** build against a saved real Overpass response (the Quezon City sample from 2026-11-24 can be the fixture), plus one live run against the public servers at the end.

**Known limits to accept:** coverage depends on volunteers (39 clinics within 5 km of Quezon City's centre, with few details); most clinics will say "Hours not listed" and have no phone or website; animal filters are guesses; no ratings; the public Overpass and tile servers are shared and may be slow or busy at times.

**Option kept for later: Google Places.** The provider is isolated, so Google can replace OpenStreetMap if richer data (ratings, hours, phone) is wanted. It needs a Google Cloud billing account with a card, Maps JavaScript API and Places API (New), a server key and a browser key, and hard daily quota caps below Google's free monthly allowance (the tier with ratings and hours is the smallest, about 1,000 requests a month at the time of checking) to stay free. Google's terms also forbid storing place details and require Google attribution. Decide before switching.

### Final phase gate
End-to-end walkthrough of owner, vet, admin, finder and invitee flows (including tapping an NFC tag on a real Android and iPhone), with no open items left in this file.

## Production deploy checklist (as of 2026-11-24)

Deploys do not run migrations, and `stage` uses its own Neon branch, so production needs these by hand before or at the deploy.

**1. Apply these migrations to the production Neon branch (`main`, `br-bitter-water-a1rschti`), in order, with `prisma migrate deploy` against the production `DATABASE_URL`:**
1. `20261123120000_phase0_enum_cleanup`
2. `20261123140000_health_record_fields_and_provenance`
3. `20261123141000_drop_record_start_date`
4. `20261123150000_reminders_and_notifications` (remaps existing reminder categories: Care to Other, Walk to Exercise, Check-up to Appointment)
5. `20261123160000_vet_record_requests`
6. `20261124065856_admin_void_and_audit`
7. `20261124071149_record_edit_history_and_notes`
8. `20261124073352_lost_pet_messaging_and_public_settings`
9. `20261124075412_caretaker_shares`
10. `20261124081237_pet_photo_thumbnails`
11. `20261124083444_nfc_tags`

Apply them before the new code goes live: the old code does not know the new enum values or columns.

**1b. After the deploy, move the old pet photos:** run `DATABASE_URL=<production url> node scripts/migrate-pet-photos.mjs` once (it needs the same storage variables as the app). Photos not yet moved keep working, so this is not urgent.

**2. Vercel environment variables (production):**
- `APP_URL` must be the public address (`https://pawketbook.vercel.app` in production, `https://pawketbook-stage.vercel.app` on stage). Vet QR links and pet tag QR codes are built from it; the local `.env` value was a stale tunnel address.
- `STORAGE_BUCKET_FILES=pet-files` (set during Phase 1; redeploy picks it up). `STORAGE_BUCKET_QR`, the `AWS_*` storage credentials and the auth settings already exist.
- There is no time zone variable: `Asia/Manila` is a constant in `app/lib/time.ts`.

**3. Storage:** the `pet-files` bucket's CORS must list the production and stage origins (already: `https://pawketbook.vercel.app`, `https://pawketbook-stage.vercel.app`, `http://localhost:3000`).

**4. After the deploy, check:** sign in and open Reminders and Notifications; generate a vet QR and confirm the link starts with the production address; open it in a private window and confirm Start works; add a record with a file and confirm it appears with the Vet-submitted badge.

## Decided 2026-11-19 (second session, former open questions)

- **Appointments:** owner-only calendar. The owner adds entries (date, vet/clinic name as free text, reason) with statuses Upcoming / Done / Cancelled. No clinic confirmation step.
- **Reminders:** in-app only (notifications bell and dashboard). No email, so Resend does not need to go live for reminders.
- **Messaging:** redefined as a lost-pet message. When a pet is in lost mode, a signed-in owner who scans its QR gets a "message owner" option. Anonymous finders cannot message; they use the contact details shown in lost mode. Messages go to the pet owner's in-app inbox and the bell. Lost mode is the one exception to "a claimed QR shows nothing public to non-owners".
- **Find a vet:** keep locked ("Coming soon") until clinics exist.
- **Shared access:** build it. An owner invites another registered user to a pet. Every owner query needs permission checks beyond `ownerId`, so design roles (view / edit) before building.
- **Notifications bell triggers:** reminders due, vet record submitted, lost-pet message, shared access invite.
- **Thesis defense:** a working vet side (QR form) is required and is built fully. If time runs short, cut other features first.

## Decided 2026-11-19 (third round)
- **Messaging is a full two-way in-app messaging feature**, not one-way. Messages and threads are stored in Postgres. Live delivery: start with polling, optionally add Ably or Pusher later as a "new message" ping (Vercel serverless cannot hold WebSockets).
- **Shared access role:** invitees can view the pet and its records and generate vet QRs, but cannot edit anything.

## Decided 2026-11-19 (fourth round)
- **Messaging scope:** lost-pet only. A thread exists only when a signed-in owner scans a lost-mode pet's QR. No general owner-to-owner messaging, so no user search is needed.
- **Shared invitees:** cannot see the owner's contact details and cannot read or send lost-pet messages. Messages stay with the pet's owner.

## Decided 2026-11-23 (Figma cross-reference, updated file `42BmxWxt8Hq6HaNtjPikX9`)
- **Vet-added records stay not editable.** The plan's rule holds: owners can edit only the visit date and cannot delete or hide them. The Figma "Edit record" screen (copy-on-edit, "Delete record" on a clinic record) must not apply to vet-submitted records. Owner-created records stay fully editable.
- **Caretakers (shared access role):** can view the pet and records, generate vet QRs, be assigned reminders and mark them done. Cannot edit animal info or add animals to the owner's profile. For records they are view-only plus generating vet QRs: no adding, editing or deleting records (confirmed 2026-11-23). Reminder completion stays allowed as decided above. Still no owner contact details and no lost-pet messages. Supersedes the "cannot edit anything" line above. Reminders therefore need an assignee field (owner, a caretaker, or "whoever gets to it first") and a completion history (who, when).
- **Email stays off.** Do not build Verify email, Forgot password, New password, or the Email toggle on reminders yet.
- **Lost-mode scan page shows health info, owner-controlled.** In the ID and QR tag tab the owner gets a pill toggle (switch) per field to choose what is public: for example vaccine status, allergies, current medication, notes, plus the contact options (text, call, in-app message). Needs a per-pet public-field settings model. The server must only return fields the owner switched on.
- **Find a vet stays locked** ("Coming soon") until Phase 10. Superseded 2026-11-24: Phase 10 builds it from the Figma frames using OpenStreetMap, with no clinic accounts.
- **Clinic-style items removed (confirmed).** No "Awaiting clinic" / "Confirmed" appointment badges (use Upcoming / Done / Cancelled), and no clinic notifications ("received your request", "Appointment confirmed", "New message from <clinic>"). Notifications show only the planned triggers (reminders due, vet record submitted, lost-pet message, shared access invite) plus caretaker activity such as "Marco completed Evening walk". "Health record added by <vet>" stays, as the vet-record-submitted trigger. Figma frames to edit: Notifications (9:1425) and the dashboard Vet visits card (9:880, and the other Owner dashboard frames).

### Follow-up decisions 2026-11-23 (already applied to the phases above)
- Caretakers: view records and generate vet QRs only; no adding, editing or deleting records.
- Vet QR: one record per QR; vets can submit all six record types.
- Lost-mode scan page: every field individually toggleable (per-pet settings, Phase 6).
- Medication dose reminders: built in Phase 3.
- Header search: animals, records and reminders only, built in Phase 8.
- No notification settings page. No Appointments sidebar link.
- Vet public routes: rate limits, strong hashed tokens, max 5 active QRs per pet, no CAPTCHA.
- Missing screens (vet QR UI, vet form, admin audit, caretaker invite) are built in the existing style without new Figma frames.
- Tests: deliberately deferred. No test work is planned for now; revisit before the defense if time allows.

### Design gaps to fold into phases
- Phase 2: add Weight and Other record types (Figma has Vaccine, Medication, Check-up, Lab, Weight, Other).
- Phase 3: richer reminders (types, repeats and end date, assignee, history, "also add to health records"), Notifications page with All/Unread and Mark all as read. Notification settings page not planned; decide later.
- Phase 7: invitation by email, remove caretaker, assignee on reminders.
- New frontend pages in Figma not yet built: My animals list, Edit animal, all-pets Health records and Reminders, Notifications, ID and QR tag tab, mobile QR scan page, Privacy, Terms, Contact, FAQs.
- No Figma screens yet for: vet QR generate/list/revoke, the public vet form, admin void and audit, caretaker invite flow. Decided 2026-11-23: build these directly in the existing style (existing components and the Figma style guide); they do not block their phases. Add Figma frames afterward if wanted.

## Still open
Nothing. Phases 0 to 9 are done. Phase 10 (Find a vet with OpenStreetMap) is planned and needs no setup from the developer. After it, the final phase gate (the end-to-end walkthrough, including NFC on a real phone), then the production deploy checklist.
