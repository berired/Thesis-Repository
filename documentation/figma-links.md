# Pawket Book: Figma links

File: **Pawket Book (Final Pages)**, key `42BmxWxt8Hq6HaNtjPikX9`. Indexed 2026-11-23 from the file's page "UI Pages" and re-checked against the live canvas on 2026-11-24 (54 top-level nodes: 52 frames listed below, plus the Tagalog note and one loose image, both under "Not screens"). No frames were added or removed since the first index; only the statuses changed.

Every link opens straight to that frame. The pattern is `https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=<id with the colon written as a hyphen>`, so node `9:1425` is `node-id=9-1425`.

"Built" means a page exists in the app for it. See `remaining-work.md` for what still differs from a frame and `backend-plan.md` for the decisions behind each one.

## Pages in the file

| Page | Node | Link |
|---|---|---|
| UI Pages (every screen below) | 9:178 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-178) |
| Style Guide | 19:31 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=19-31) |
| Components (only the filter chip states) | 190:4549 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=190-4549) |

A text note on the canvas (`47:2459`) says, in Tagalog, not to mind the landing and sign-up pages for now.

## Owner app

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| Owner dashboard | 9:880 | `/dashboard` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-880) |
| Dashboard, no animals yet | 9:1280 | `/dashboard` (empty state) | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-1280) |
| Notifications | 9:1425 | `/notifications` | Built (clinic items and settings card left out) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-1425) |
| My Animals | 39:42 | `/pets` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-42) |
| Add Animal (earlier version) | 39:402 | `/pets/new` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-402) |
| Add Animal (newer version) | 190:2333 | `/pets/new` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=190-2333) |
| Animal profile: overview | 39:683 | `/pets/[id]` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-683) |
| Animal profile: health records | 39:1262 | `/pets/[id]/records` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-1262) |
| Animal profile: reminders | 185:1009 | `/pets/[id]/reminders` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=185-1009) |
| QR code and identification (ID and QR tag tab) | 203:5464 | `/pets/[id]/tag` | Built (Phase 6; the per-field controls are pill switches per the plan, not Figma's checkboxes) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=203-5464) |
| Edit animal profile | 39:1024 | `/pets/[id]/edit` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-1024) |
| Archive or delete confirmation | 39:2287 | dialog on the pet page | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-2287) |

## Health records

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| Health records list (all animals) | 131:355 | `/records` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=131-355) |
| Add health record, with attachment | 131:1018 | `/records/new`, `/pets/[id]/records/new` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=131-1018) |
| Edit health record | 131:1283 | `/pets/[id]/records/[recordId]/edit` | Built (no delete or copy-on-edit for vet records) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=131-1283) |
| Upload attachment | 131:1628 | the attachments panel inside the record form | Built as a panel, not a separate dialog | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=131-1628) |

## Reminders

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| Reminders overview | 142:1867 | `/reminders` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=142-1867) |
| Reminders overview (variant 2) | 142:2743 | `/reminders` | Built (same page) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=142-2743) |
| Reminders overview (variant 3) | 145:3920 | `/reminders` | Built (same page) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=145-3920) |
| Create reminder | 142:2203 | `/reminders/new` | Built (no Email or Phone) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=142-2203) |

## Public QR and vet

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| QR Scan Page (mobile, finder) | 203:4866 | `/r/[code]` | Built (Phase 6, the member card; the pet photo is always shown, owner city is optional) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=203-4866) |
| Find a Vet | 190:3963 | sidebar item, locked | Not built on purpose | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=190-3963) |
| Filters Dropdown (Find a Vet) | 190:4427 | none | Not built on purpose | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=190-4427) |

There are no frames for the vet QR dialog, the vet's public page and form, the admin void and audit screens, the report-a-record form, the record history and notes sections, the Messages inbox and chat, or the admin reported-conversations page. They were built in the existing style (see `backend-plan.md`, Phases 4 to 6).

## Authentication

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| Sign-In | 203:7605 | `/sign-in` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=203-7605) |
| Sign-Up | 203:6584 | `/sign-up` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=203-6584) |
| Sign-Up (second version) | 210:7779 | `/sign-up` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=210-7779) |
| Forgot Password | 9:692 | none | Not built on purpose (email is off) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-692) |
| New Password | 9:746 | none | Not built on purpose (email is off) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-746) |
| Verify email / account created | 9:814 | none | Not built on purpose (email is off) | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=9-814) |

## Landing and footer pages

| Screen | Node | App route | Status | Link |
|---|---|---|---|---|
| Landing Page - Final | 75:2460 | `/` | Built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=75-2460) |
| Features | 173:5055 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=173-5055) |
| Privacy Policy | 163:42 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=163-42) |
| Terms of Use | 163:282 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=163-282) |
| Contact Us | 167:586 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=167-586) |
| FAQs, Getting Started (open) | 168:1069 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-1069) |
| FAQs, Getting Started (closed) | 168:1361 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-1361) |
| FAQs, Animals and Caretakers (open) | 168:2804 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-2804) |
| FAQs, Animals and Caretakers (closed) | 168:2613 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-2613) |
| FAQs, Animals and Caretakers (open, second) | 168:3573 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-3573) |
| FAQs, Animals and Caretakers (closed, second) | 168:3286 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-3286) |
| FAQs, Account and privacy (open) | 168:4147 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-4147) |
| FAQs, Account and privacy (closed) | 168:3863 | none | Not built | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=168-3863) |
| Background (footer pages backdrop) | 171:4433 | none | Backdrop, not a screen | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=171-4433) |

## Not screens

| Item | Node | Notes |
|---|---|---|
| Text note (Tagalog): don't mind the landing and sign-up pages for now | 47:2459 | Instruction text on the canvas |
| image 19 | 131:1626 | A loose image beside the Add Record label, not a screen |

## Section labels on the canvas

These are thin banner frames that only label a group of screens. They are not screens.

| Label | Node | Link |
|---|---|---|
| LANDING PAGE | 39:2432 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-2432) |
| FOOTER PAGES | 162:37 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=162-37) |
| AUTHENTICATION | 39:2441 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-2441) |
| My Animals | 39:2451 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-2451) |
| Owner Dashboard | 39:2446 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=39-2446) |
| Add Record | 117:34 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=117-34) |
| Add Reminders | 142:1857 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=142-1857) |
| QR Code | 142:1862 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=142-1862) |
| Find a Vet | 190:2618 | [open](https://www.figma.com/design/42BmxWxt8Hq6HaNtjPikX9/Pawket-Book--Final-Pages-?node-id=190-2618) |

## Checking a frame from Claude

Use the Figma tools with the file key above and the node id written with a colon (for example `9:1425`): `get_screenshot` for a picture, `get_metadata` for the layer tree, `get_design_context` before building from a frame. Asking `get_metadata` for the whole UI Pages page returns a very large result, so ask for a single frame instead.
