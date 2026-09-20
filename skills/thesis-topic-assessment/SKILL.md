---
name: thesis-topic-assessment
description: Assesses whether a proposed computer science thesis, dissertation, or capstone topic is strong — searching the web for related literature and related technical work (existing papers, systems, libraries, datasets), then scoring the topic against five criteria (specific & arguable, novel, feasible, relevant, sustains interest), naming exactly what it lacks, and giving concrete fixes for each gap. Use this whenever someone proposes a topic or research question and asks for feedback, whenever they paste a topic and ask "is this good", "what's wrong with this", "help me narrow this down", "is this already been done", or "am I ready to start", and proactively whenever a new candidate topic is added to documentation/topics/ — even if they don't explicitly ask for an evaluation, since catching a weak topic early saves months of wasted research.
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

**1. Pin down the topic as one sentence.**
Ask the user for their topic if they haven't given one yet. Then try to compress it
into a single, specific, defensible sentence — a claim or a precise research question,
not a field name or a yes/no question. If it *can't* compress into one sentence
without losing something essential, that's itself the first finding: the topic is
still a territory, not a topic.

**2. Search the web for related literature and related technical work.**
Do this before scoring, not after — it's evidence, not decoration. Run a few
searches (WebSearch, opening promising hits with WebFetch) covering both halves
of prior art, since for a CS thesis they're different things and both matter:

- **Literature** — papers, theses, and articles on this question or something
  close to it. Search a couple of different phrasings, not just the topic
  sentence verbatim, and favor the last 2–4 years unless the topic is explicitly
  historical.
- **Works** — existing systems, libraries, frameworks, datasets, open-source
  repos, or products that relate to what the thesis would need to build, use, or
  compare against. For a CS thesis this is often more decisive than the
  literature: an available dataset or library can make an ambitious idea
  feasible, and its absence can make a modest-sounding one infeasible.

Note what you found and, just as tellingly, what you didn't. Both directly feed
the scoring in the next step — an already-published near-identical system weakens
Novelty; a ready-to-use dataset or library strengthens Feasibility, and having to
build everything from scratch weakens it. See `references/criteria.md` for how to
weigh CS-specific prior art. If web access isn't available in this environment,
say so explicitly rather than silently scoring Novelty and Feasibility without it.

**3. Score each of the five criteria independently.**
For each dimension in `references/criteria.md`, give a rating of **Strong /
Adequate / Weak / Missing** with one or two sentences of reasoning that engages with
the *actual content* of this topic — not a generic restatement of the criterion.
"Feasible: Weak — no public dataset or library covers this, and the topic doesn't
say what would be built from scratch to get one" is useful; "Feasible: Weak —
consider feasibility" is not. Ground the Novel and Feasible ratings in what step 2
turned up. Where you don't have enough information to score a dimension (e.g., you
don't know if an advisor is available), say so explicitly rather than guessing, and
ask or assume out loud.

**4. Give an overall verdict.**
Based on the pattern of scores, land on one of:
- **Ready to proceed** — no Weak/Missing dimensions, or only minor Adequate gaps.
- **Promising, needs refinement** — the core idea is sound but one or two
  dimensions need work before committing.
- **Not yet researchable** — multiple Weak/Missing dimensions, most commonly
  because the "topic" is really a field, or feasibility hasn't been checked at all.

Don't rubber-stamp. A topic that sounds impressive but is actually a broad field
("the effects of social media on society") or an already-settled question deserves
a Weak/Missing rating even if it's articulate — see the Brandeis criteria on
arguability and the "choosing a field instead of a topic" failure mode in
`references/criteria.md`.

**5. For every Weak or Missing dimension, give a specific fix.**
Not "narrow your scope" — say what to narrow it *to*, using details already present
in the topic, the surrounding conversation, or what step 2 turned up (a dataset to
use, a library to build on, a gap a paper's "future work" section names). If the
fix requires information only the user has (e.g., whether their advisor works in
this area), phrase it as a question to resolve rather than an assumption.

**6. Close with a revised one-sentence topic statement, when useful.**
If there were enough gaps to warrant a rewrite, propose one tightened sentence that
folds in the fixes, so the user has something concrete to react to rather than just
a list of problems. Skip this step if the topic was already Ready to proceed.

## Output format

Use this structure (adapt headers to plain conversation if the exchange is casual,
but keep the content and order):

```
## Topic as stated
[the one-sentence compression, or a note that it couldn't compress]

## Related literature & prior work
[2-5 relevant papers/theses and existing systems/libraries/datasets found, each
with a link and a one-line note on how close it is — or, if the search came up
empty, say so and note what that implies about novelty and about how much would
need to be built from scratch]

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
