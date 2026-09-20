---
name: thesis-topic-assessment
description: Assesses whether a proposed computer science thesis, dissertation, or capstone topic is strong — searching the web for related literature and related technical work (existing papers, systems, libraries, datasets), then scoring the topic against five criteria (specific & arguable, novel, feasible, relevant, sustains interest), naming exactly what it lacks, and giving concrete fixes for each gap. Use this whenever someone proposes a topic or research question and asks for feedback, whenever they paste a topic and ask "is this good", "what's wrong with this", "help me narrow this down", "has this already been done", or "am I ready to start", and proactively whenever a new candidate topic is added to documentation/topics/ — even if they don't explicitly ask for an evaluation, since catching a weak topic early saves months of wasted research.
---

# Thesis Topic Assessment

A weak thesis topic doesn't usually fail loudly — it fails slowly, months in, when the
data isn't there, the question turns out to already be answered, or the scope is too
big to finish. This skill catches that early by scoring a candidate topic against five
criteria drawn from thesis-advising guidance (see `references/criteria.md` for the
full rubric, the reasoning behind each one, and its sources), and turning every
weakness into a specific next step rather than a vague "make it better."

Read `references/criteria.md` before scoring — it has the full explanation of what
"good" looks like on each dimension, common failure patterns to watch for, and the
gap-closing moves to suggest. This file covers the workflow and output shape.

## Workflow

**1. Pin down the topic as one sentence, and get the degree level.**
Ask the user for their topic if they haven't given one yet, and ask (or infer from
context, e.g. `documentation/`) what level this is for — undergrad capstone,
master's thesis, or PhD dissertation — since that changes how strictly Novelty and
Feasibility get judged below. Then try to compress the topic into a single,
specific, answerable research question — not a field name and not a yes/no
question. It doesn't need to be an arguable *claim* yet (that's the eventual
contribution, which comes after research, not before); see
`references/criteria.md` on dimension 1 for why. If the topic *can't* compress into
one sentence without losing something essential, that's itself the first finding:
it's still a territory, not a topic.

**2. Search the web for related literature and related technical work.**
Do this before scoring, not after — it's evidence, not decoration. If the topic is
still broad at this point (couldn't fully compress in step 1), search it anyway
but treat the results as a rough saturation check ("how crowded is this space")
rather than a precise gap search — precise gap-hunting only works once the topic
is specific. Run a few searches (WebSearch, opening promising hits with WebFetch)
covering both halves of prior art, since for a CS thesis they're different things
and both matter:

- **Literature** — papers, theses, and articles on this question or something
  close to it. Search a couple of different phrasings, not just the topic
  sentence verbatim, and favor the last 2–4 years unless the topic is explicitly
  historical.
- **Works** — existing systems, libraries, frameworks, datasets, open-source
  repos, or products that relate to what the thesis would need to build, use, or
  compare against. For a CS thesis this is often more decisive than the
  literature: an available dataset or library can make an ambitious idea
  feasible, and its absence can make a modest-sounding one infeasible.

Note what you found and, just as tellingly, what you didn't — but keep those two
outcomes distinct from a third one: not being *able* to search at all (no web
access in this environment, or searches erroring out). An empty result from a real
search is evidence; no search run is simply missing evidence, and must not be
written up as if it supports Novelty or Feasibility either way. Say plainly which
of the three happened. See `references/criteria.md` for how to weigh CS-specific
prior art, including the licensing/ethics angle a found dataset doesn't
automatically clear.

**3. Score each of the five criteria independently.**
For each dimension in `references/criteria.md`, give a rating of **Strong /
Adequate / Weak / Missing**, calibrated to the degree level from step 1 (a
capstone doesn't need PhD-level novelty):
- **Strong** — fully meets the bar, nothing to flag.
- **Adequate** — meets it, but with a minor caveat worth naming.
- **Weak** — attempts it, but has a real, specific problem.
- **Missing** — essentially absent, or genuinely unassessable from what's given
  (say which — those call for different fixes).

Back every rating with one or two sentences that engage with the *actual content*
of this topic — not a generic restatement of the criterion. "Feasible: Weak — no
public dataset or library covers this, and the topic doesn't say what would be
built from scratch to get one" is useful; "Feasible: Weak — consider feasibility"
is not. Ground the Novel and Feasible ratings in what step 2 turned up — if step 2
found a close match with no distinguishing angle, that's Novel: Weak, not a soft
"worth checking." Where you genuinely lack the information to score a dimension
(e.g., you don't know if an advisor is available, or there was no signal either
way on Interest), rate it **Missing** and say so — don't default to Adequate just
because nothing contradicted it.

Two of the five — Relevant/advisor-fit and Sustains-interest — depend on
information usually only the user has, so they land on Missing far more often
than the other three, and that Missing means "ask," not "this topic is flawed."
Keep that distinct in your own head for the next step: don't let a routine
Missing on those two read the same as a Missing on Specific & arguable, Novel, or
Feasible, which *are* assessable from the topic plus your research and mean the
topic itself has a real gap.

**4. Give an overall verdict.**
Base it primarily on **Specific & arguable, Novel, and Feasible** — the three
dimensions you can actually assess from the topic and step 2's research:
- **Ready to proceed** — none of those three rated Weak or Missing.
- **Promising, needs refinement** — exactly one of those three rated Weak, none
  rated Missing.
- **Not yet researchable** — any of those three rated Missing, or two or three
  rated Weak. Most commonly this is because the "topic" is really a field, or
  feasibility hasn't been checked at all.

Then adjust down (never up) for Relevant or Interest only when either is rated
**Weak** — an actual identified problem (clearly outside every advisor's
expertise, clear signs of disinterest), not a routine Missing. A routine Missing
on those two doesn't change the verdict; it becomes an open question in the gaps
below.

Don't rubber-stamp. A topic that sounds impressive but is actually a broad field
("the effects of social media on society") or an already-settled question deserves
a Weak/Missing rating even if it's articulate — see the Brandeis criteria on
arguability and the "choosing a field instead of a topic" failure mode in
`references/criteria.md`.

**5. For every Weak or Missing dimension, give a specific fix.**
Not "narrow your scope" — say what to narrow it *to*, using details already present
in the topic, the surrounding conversation, or what step 2 turned up (a dataset to
use, a library to build on, a gap a paper's "future work" section names). If a
dimension is Missing because the information is genuinely the user's to supply
(interest, advisor availability), the "fix" is the specific question to ask them —
not an invented assumption.

**6. Close with a revised one-sentence topic statement, when useful.**
If there were enough gaps to warrant a rewrite, propose one tightened sentence that
folds in the fixes, so the user has something concrete to react to rather than just
a list of problems. Skip this step if the topic was already Ready to proceed.

**7. If there's no one to reply to (proactive run on a new file), write the
assessment to disk.**
A run triggered by a new topic file under `documentation/topics/` has no live
conversation to answer into. In that case, save the assessment as a sibling file
next to the topic (e.g. `my-topic.md` → `my-topic.assessment.md`) rather than only
producing output that nothing captures, and say in your own reply that you did
this and where.

## Output format

Use this structure (adapt headers to plain conversation if the exchange is casual,
but keep the content and order):

```
## Topic as stated
[the one-sentence compression, or a note that it couldn't compress; degree level]

## Related literature & prior work
[2-5 relevant papers/theses and existing systems/libraries/datasets found, each
with a link and a one-line note on how close it is; if the search genuinely came
up empty, say so and note what that implies for novelty and feasibility; if the
search couldn't run at all, say that instead and don't draw either conclusion]

## Scorecard
- Specific & arguable: [Strong/Adequate/Weak/Missing] — [reasoning]
- Novel / fills a gap: [rating] — [reasoning]
- Feasible: [rating] — [reasoning]
- Relevant & fits your program/advisor: [rating] — [reasoning]
- Sustains your interest: [rating] — [reasoning]

## Verdict
[Ready to proceed / Promising, needs refinement / Not yet researchable] — [why, in
one or two sentences]

## Gaps and how to close them
[one entry per Weak/Missing dimension — the specific fix, not generic advice]

## Revised topic (if useful)
[a tightened one-sentence version incorporating the fixes]
```

Keep the tone like a thoughtful advisor, not a form-letter grader: engage with what
makes *this* topic interesting alongside what's missing, and be direct about
significant problems (e.g., "already extensively studied," "not answerable with
available data") rather than softening them into non-findings.
