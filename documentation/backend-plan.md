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

### Phase 0: Foundations
**Prerequisites:** none.
**Deliverables:**
- Pull the latest `stage`. Create the backend branch from `stage` (the current branch is `frontend-updates`).
- Commit this plan file.
- Audit what exists: current bucket and what it holds (`QrCode.imageKey`, `Pet.photoKey`, the `/api/pets/[id]/photo` route), the existing records, documents, reminders and appointments pages, and what is real versus placeholder.
- One shared pet-access helper (`getPetAccess(userId, petId)` returning `owner`, `viewer` or none). All pet queries and server actions go through it, so shared access (Phase 7) needs no rewrite.
- Schema cleanup migration: replace `AppointmentStatus` with `UPCOMING / DONE / CANCELLED` and make the clinic name optional free text; align `RecordType` with the vet types plus the owner types (vaccination, vet visit or check-up, lab result, medication, weight, other) and map or migrate existing rows; align the species list with Figma (Dog, Cat, Bird, Poultry, Reptile, Fish, Rabbit, Other).
**Exit checks:** helper is used by every existing owner query; migration applied; existing pages still work.

### Phase 1: Private storage and uploads
**Prerequisites:** Phase 0 done.
**Deliverables:**
- Private `pet-files` bucket with `documents/`, `vet-uploads/`, `photos/` prefixes; CORS set for presigned uploads.
- Server helpers: presigned upload (type check, size limit, key naming), short-lived signed download URLs, delete.
- Limits: PDF/JPG/PNG 10 MB, max 5 files per record; photos JPG/PNG/WebP 5 MB.
**Exit checks:** an owner can upload and open a file; wrong type or oversize is rejected on the server; another user cannot read it; no public URL works.

### Phase 2: Owner records and documents
**Prerequisites:** Phase 1 done.
**Deliverables:**
- Owner create, edit and delete for their own records, with attached files.
- Schema: provenance fields on `HealthRecord` (source `OWNER` or `VET`, submitted vet name and clinic, voided state and who and when). Built now, used by Phases 4 and 5.
- Owner record list and detail views, with the vet-submitted badge ready. Includes the all-pets Health records page (filters by animal, type, year; search).
- Vet-submitted records are read-only for owners except the visit date, and cannot be deleted. Owner-created records are fully editable and deletable.
- Edit animal page (owner only) with an allergies field, photo slot, and the existing archive and delete. Add allergies to the registration form too.
**Exit checks:** owners fully manage their own records and files; vet-submitted records cannot be deleted or edited beyond the visit date; ownership enforced through the Phase 0 helper.

### Phase 3: Appointments, reminders and notifications
**Prerequisites:** Phase 2 done.
**Deliverables:**
- Owner-only appointment calendar (Upcoming / Done / Cancelled), on the pet's Appointments tab and the dashboard Vet visits card. No sidebar link and no all-pets Appointments page (decided 2026-11-23). No clinic confirmation states anywhere in the UI.
- Reminders (already in the schema), extended: types (medication, vaccine, feeding, grooming, exercise, habitat, appointment, other), repeats and end date, due computation, completion with a history (who, when), optional "also add to health records", and an assignee field (owner for now; caretakers become assignable in Phase 7). In-app only, no email option.
- Medication dose reminders (decided 2026-11-23): the medication record form has "Remind me at each dose" (dose times, until the end date) and "Also notify <caretaker>". Saving with it on creates repeating reminders linked to the record. Notifying a caretaker only works once Phase 7 exists, so that option is hidden until then.
- All-pets Reminders page (filters by animal and type, Upcoming / Overdue / Done) and the pet Reminders tab.
- `Notification` model, the bell, and the Notifications page (All / Unread, mark read, mark all as read). Trigger helper that later phases call. No notification settings page: the "Notification settings" link in Figma is removed (decided 2026-11-23); revisit only if email returns.
- Bell triggers live in this phase: reminders due.
**Exit checks:** a due reminder appears in the bell and on the dashboard; completing a repeating reminder schedules the next one and logs who completed it; read state persists.

### Phase 4: Vet QR flow
**Prerequisites:** Phases 1, 2 and 3 done (uploads, record provenance fields, bell).
**Deliverables:**
- Record-request token model: hashed token, pet, allowed sections, 24 h expiry, burned-at, revoked-at, created by.
- Owner UI: a "Generate vet QR" button on the pet page (next to "Add record", and on the pet's Health records tab), available to owners and caretakers. It opens a dialog to choose the readable sections, then shows the one-time QR and link with a 24 hour countdown. Also list active and used QRs and revoke unused ones.
- Abuse protection (decided 2026-11-23): tokens are long and random (at least 128 bits, stored hashed); per-IP rate limits on the public routes (page load, upload, submit); at most 5 active (unused, unexpired) QRs per pet; one submission per QR. No CAPTCHA.
- One-time use means one burned token and one record per QR: the first real load burns the token and starts the ~45 minute session, the vet submits one record inside it, and the QR is then spent. A further record needs a new QR.
- Public no-login page: burns the token on the first real load (not on bots or link previews), starts a cookie-bound session of about 45 minutes.
- Vet form: reuse the add-record form built in Phase 2 (same component, fields and attachment uploader) in a public, no-login layout. Differences: Vet Name and Clinic Name are required, the animal is fixed to the QR's pet, and all six record types are offered (vaccination, check-up or vet visit, lab result, medication, weight, other; decided 2026-11-23). Plus a read-only view of the allowed sections. Server-side checks and per-session upload cap. Build the Phase 2 form as a shared component so Phase 4 does not fork it.
- Bell trigger: vet record submitted.
**Exit checks:** expired, revoked, burned and unknown tokens are rejected; a bot request does not burn the token; the session cannot see sections the owner did not allow; the submitted record shows with the badge; the owner can edit only its visit date and cannot delete it.

### Phase 5: Admin void and audit
**Prerequisites:** Phase 4 done.
**Deliverables:**
- Admin can void or delete a vet record; it stays in the audit trail as voided (who, when, why).
- Owner can report a vet record; the admin sees reports.
- Voided records are hidden from normal owner views and visible in the admin audit view.
**Exit checks:** only admins can void; the audit entry is permanent and readable.

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
Nothing. Next step is step 1 of the build order (private bucket and presigned uploads).
