# Knowledge base for care tips

Short owner-facing summaries of medicines and vaccines, used by the care-tips pipeline (Phase 11 in `documentation/backend-plan.md`). The pipeline retrieves from these files and writes tips only from what they say.

## Rules
- Write in your own words from the cited source. Do not paste source text.
- Say only what the source says. No dose amounts, no diagnosis, no prognosis, no "your pet will...".
- Every entry needs `source`, `source_url`, `source_version` and `retrieved` in the frontmatter.
- `reviewed: false` until a veterinarian has checked the entry. When one does, set `reviewed: true` and add `reviewed_by` and `reviewed_on`. The app shows a "not reviewed by a veterinarian" note either way.
- Sections used: how to give it, watch for, do not use if, storage. Keep each entry short.

## Sources used
- FDA-approved veterinary labels from DailyMed (https://dailymed.nlm.nih.gov), the official label text, for the medicines.
- WSAVA 2024 Guidelines for the Vaccination of Dogs and Cats (executive summary) for the vaccines.
- Republic Act No. 9482 (Anti-Rabies Act of 2007), Sec. 5, for the Philippine rabies rules.

## Known gaps
- The vaccine entries rest on the WSAVA executive summary only. They do not describe what a vaccine reaction looks like; add a source (for example a manufacturer or AAHA owner sheet) before adding that.
- US labels. A product sold in the Philippines under another brand matches by drug name or alias, not by label.
