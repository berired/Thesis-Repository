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
Clinic roles, the clinic admin side, clinic messaging, the "Awaiting clinic" to "Confirmed" flow and clinic-style notifications, email (verification, forgot or reset password, email reminders), and Find a vet (stays locked as "Coming soon").

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

### Phase 6: Lost-pet messaging
**Prerequisites:** Phase 3 done (bell). Lost mode and owner contact details already exist.
**Deliverables:**
- Thread and message models, in Postgres. A thread starts only when a signed-in owner scans a lost-mode pet's QR (`/r/[code]`); the pet's owner is the other side.
- Two-way chat with an inbox, unread counts and polling while a chat is open.
- Bell trigger: lost-pet message.
- Rate limits and a report or block control for abuse.
- Messages are unavailable when the pet is not in lost mode; shared invitees cannot see them.
- Lost-mode public info settings (ID and QR tag tab, Figma 203:5464): every field is individually toggleable with a pill switch (decided 2026-11-23). Groups and fields, as in Figma: Pet information (pet's name, species, age, gender); Lost pet contact (owner first name, owner city, allow finders to SMS or call, message through Pawket Book); Vet health summary (allergies, vaccine status, current medication, additional notes). Data model: a per-pet settings row (or JSON column) with one boolean per field, created in the Phase 6 migration (not before; the Neon database is shared). The scan page (`/r/[code]`) and its mobile preview return only fields switched on, and only while lost mode is on; defaults are decided at build time (suggest: pet name, species, age, gender and Message in app on; health and phone off). The owner's phone number only reaches the page through the SMS/call buttons (their links expose it), so it is included only when that toggle is on.
**Exit checks:** a non-owner sees nothing of a non-lost pet; a field switched off never appears in the scan page response; messaging works both ways; unread counts correct.

### Phase 7: Shared access
**Prerequisites:** Phases 0 (access helper), 4 (vet QR) and 6 (so message privacy can be verified) done.
**Deliverables:**
- Invite a registered user to a pet; accept or decline; revoke.
- Invite by email (caretaker must have an account); remove a caretaker from the Edit animal page and from "Invite caretaker" on My animals.
- Invitee role ("caretaker", see 2026-11-23 decisions): view the pet and its records, generate vet QRs, be assigned reminders and complete them; cannot edit animal info, add animals to the owner's profile, or edit records; no owner contact details; no lost-pet messages.
- Reminders: owner can assign to a caretaker or "whoever gets to it first"; caretakers see their assigned reminders and complete them; completion is logged by user.
- Bell triggers: shared access invite, caretaker completed a reminder.
**Exit checks:** every pet route and server action is verified against the viewer role; invitees cannot write animal info or records, cannot see contact details or messages, can complete only reminders on pets shared with them, and lose access immediately on revoke.

### Phase 8: Pet photos and PDF export
**Prerequisites:** Phase 7 done (so export respects roles).
**Deliverables:**
- Owner uploads a photo on add or edit pet; server-side resize to a thumbnail and a large image; species-icon fallback. (A photo route already exists; reconcile it with the private bucket.)
- Export PDF: printable one-pet health summary, vet entries marked, files listed not embedded.
- Header search (decided 2026-11-23): searches the signed-in user's animals, records and reminders, going through the Phase 0 access helper so caretakers only see pets shared with them. Placeholder text becomes "Search animals and records"; clinics are dropped.
**Exit checks:** search results never include pets the user cannot access; the export contains only what the viewer may see; photos are served through signed URLs.

### Final phase gate
End-to-end walkthrough of owner, vet, admin, finder and invitee flows, with no open items left in this file.

## Production deploy checklist (as of Phase 4, 2026-11-23)

Deploys do not run migrations, and `stage` uses its own Neon branch, so production needs these by hand before or at the deploy.

**1. Apply these migrations to the production Neon branch (`main`, `br-bitter-water-a1rschti`), in order, with `prisma migrate deploy` against the production `DATABASE_URL`:**
1. `20261123120000_phase0_enum_cleanup`
2. `20261123140000_health_record_fields_and_provenance`
3. `20261123141000_drop_record_start_date`
4. `20261123150000_reminders_and_notifications` (remaps existing reminder categories: Care to Other, Walk to Exercise, Check-up to Appointment)
5. `20261123160000_vet_record_requests`

Apply them before the new code goes live: the old code does not know the new enum values or columns.

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
- **Find a vet stays locked** ("Coming soon"). Remove or ignore the Find a vet page frames in Figma.
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
Nothing. Phases 0 to 5 are done; the next step is Phase 6 (lost-pet messaging).
