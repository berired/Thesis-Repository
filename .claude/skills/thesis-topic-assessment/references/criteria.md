# The five-criteria rubric

This rubric synthesizes four thesis-advising sources that largely agree with each
other, using different vocabulary for the same underlying checks:

- Enago, ["Choose a Great Thesis Topic: 4 Easy Steps"](https://www.enago.com/thesis-editing/blog/choose-great-thesis-topic-4-easy-steps)
- Maastricht University Library, ["Choosing a thesis topic"](https://library.maastrichtuniversity.nl/study/thesis-supportall/choose-thesis-topic/)
- ThesisAI, ["How to Choose a Thesis Topic"](https://www.thesisai.io/cs/blog/how-to-choose-a-thesis-topic/) (the FINER framework)
- Brandeis University Writing Program, ["Features of a Successful Thesis"](https://www.brandeis.edu/writing-program/resources/faculty/handouts/features-successful-thesis.html)

Each dimension below names what "good" looks like, the failure patterns to watch
for, and what a useful fix sounds like. This skill is scoped to computer science
theses specifically, so the Novel and Feasible sections each include a CS-specific
subsection on weighing related literature *and* related technical work (existing
systems, libraries, datasets) found via web search — for CS, "has anyone built
this already" is as load-bearing a question as "has anyone written about this
already."

## 1. Specific & arguable

**A note on the sources first, because they genuinely disagree here.** Brandeis's
handout is about essay thesis *statements* — the claim you argue once you already
know your conclusion — and says a thesis should "make a claim, not a question or
description." Enago is about choosing a *topic*, at the point where research
hasn't started yet, and says a great topic is "somewhat broad, very precise, and
somewhat open-ended" — i.e. a question, not a claim. This skill is scored at the
topic-selection stage, before the research exists to support a claim, so Enago's
framing governs the *form* (a precise, open-ended research question, not a claim
you can't back yet): don't penalize a topic for being phrased as a question. Take
from Brandeis instead the *quality bar* that still applies to a question: it
should be specific enough to be arguable once answered, not so obviously
true/false that answering it proves nothing, and free of undefined terms.

**What good looks like:** The topic is a precise, bounded research question — not
a yes/no question, not a bare description of a subject. Ambiguous or undefined
terms should be pinned down.

**Failure patterns:**
- Stated as a yes/no question ("Does social media affect mental health?") instead
  of a specific, open-ended one.
- Stated as a topic area rather than a question ("Social media and mental health
  among teenagers").
- So obviously true (or false) that answering it would prove nothing.
- Key terms left undefined (what counts as "social media use"? which population?).

**Fixing it:** Convert a bare description into a precise open-ended question;
replace yes/no phrasing with "how" or "to what extent"; define the ambiguous terms
using specifics already in play (a named population, timeframe, platform, or
measure).

## 2. Novel / fills a gap

**What good looks like:** The topic offers "a fresh take on an old topic" and fills
a genuine research gap while still building on established scholarship (Enago).
ThesisAI's framework asks whether the topic "extends or challenges existing work
rather than repeats it," and recommends actively hunting for gaps rather than just
picking a subject: reading "future research" sections of recent papers, looking for
contradictions between studies, and checking for context gaps — an established
finding that hasn't been tested in the user's specific population, region, or
setting.

**Failure patterns:**
- The exact question has already been thoroughly answered (Enago: "the perspective
  hasn't already been thoroughly explored" is a required check, not optional).
- Chasing a trendy subject without verifying an academic gap still exists there
  (ThesisAI's "critical mistake": chasing trends without verifying the gap is real).
- No stated angle that's different from existing work — it's unclear what this
  thesis would add.

**Fixing it:** Point to a specific unexplored angle — a population, context, method,
or contradiction the existing literature leaves open — rather than telling the user
to "be more original." If no gap is evident from the topic as given, name the
concrete step: skim 3–5 recent papers' "future work" sections, or look for a
population/setting where a known finding hasn't been re-tested.

**For a CS thesis, "novel" covers working systems, not just papers.** A quick web
search (arXiv, ACM/IEEE digital libraries, and plain search) can turn up an
existing open-source project, product, or GitHub repo that already does close to
what the topic proposes, even when no paper covers it — a thesis committee will
find it if the student doesn't. If a close match exists, the topic isn't
automatically dead, but it needs a stated angle that's different from what's
already out there: a different technique, a performance or scalability
comparison, an application to a new domain/dataset, or an extension the existing
work doesn't attempt. Rate it accordingly, not just narratively: a close match
*with* a stated distinguishing angle is Adequate or Strong; a close match with no
distinguishing angle found is Weak, not a soft "worth checking" — say plainly that
the current framing needs one.

**Calibrate to degree level.** A PhD dissertation needs a genuine, defensible
contribution to the field. A master's thesis needs a real angle but can be a
solid extension or application of existing work. An undergrad capstone can
legitimately be "implement and evaluate an existing technique in a new setting" —
don't hold it to research-contribution novelty it was never meant to clear.

## 3. Feasible

**What good looks like:** ThesisAI's FINER framework puts this first for good
reason: "Can I collect this data with the time, budget, and access I actually
have?" Maastricht agrees, urging topics that build on existing literature "rather
than exploring completely unfamiliar territory," so the researcher isn't starting
from zero on method or domain knowledge. This is the dimension most often assumed
rather than checked.

**Failure patterns:**
- Assuming data access will materialize after the project is approved, rather than
  confirming it up front (ThesisAI names this explicitly as a critical mistake).
- Requiring data, populations, or methods that aren't realistically obtainable in
  the program's timeframe or budget.
- No stated data source or method at all — feasibility literally cannot be
  assessed from what's given.

**Fixing it:** Ask directly: where would the data or evidence for this actually
come from, and is that access already confirmed (not hoped for)? If the scope
requires resources the user doesn't have, suggest a narrower version answerable
with data/time/access they do have.

**For a CS thesis, existing technical work is a direct feasibility input, not just
a novelty check.** What a web search for related works turns up should change the
feasibility rating directly:
- An available public dataset, a maintained library/framework/API the student can
  build on, or a working baseline to compare against all make a topic *more*
  feasible — less has to be built or collected from scratch.
- Needing to build core infrastructure that doesn't exist yet (a dataset that has
  to be collected/labeled, a system with no comparable open-source starting
  point, specialized compute like GPU clusters the student won't have access to)
  makes a topic *less* feasible, even if it's conceptually great — say this
  plainly rather than letting an interesting idea pass on hope.
- Check this against what the program actually expects the deliverable to be
  (a working implementation vs. a study/evaluation) — a topic that requires
  building a full system from nothing is a different feasibility bar than one that
  evaluates or extends something that already exists.
- **Finding a dataset isn't the same as being allowed to use it.** Check what the
  license or terms of use actually permit (many datasets bar redistribution or
  commercial/derivative use), whether the data involves human subjects and would
  need IRB/ethics-board approval, and whether scraped data would violate a site's
  terms of service. A dataset that exists but can't legally or ethically be used
  the way the topic needs it is not a feasibility win — flag it as a gap to
  resolve, not a box already checked.
- **Not every CS thesis is data-driven.** For a theoretical or algorithmic topic
  (complexity analysis, a proof, a new algorithm without an empirical evaluation),
  feasibility is about whether the problem is tractable to analyze or prove within
  the available time — not about datasets or compute. Don't force a dataset-shaped
  feasibility question onto a proof-based thesis; ask instead whether related
  results exist to build the proof technique on, which the literature search in
  step 2 should already surface.

**Program requirement: no travel the team can't afford or manage.** This
program's students can't travel far, so a topic whose data collection or
deployment depends on reaching a distant site, running an in-person field study,
or installing hardware somewhere the team can't get to is a real feasibility
problem — rate it accordingly, don't wave it through because the idea is
otherwise strong. Prefer, and actively look for, topics answerable through:
- remote or online data collection (surveys, scraping, an API, a public dataset
  found in step 2's search);
- participants or sites already local/reachable to the team, rather than a
  population that requires travel to reach;
- a system that can be built and evaluated on infrastructure the team already
  has (a laptop, a university lab, a cloud free tier) rather than hardware that
  has to be deployed on-site somewhere distant.

When a topic's natural methodology implies travel (an in-person user study at a
remote facility, hardware deployed in a location the team can't reach
repeatedly), say so explicitly and suggest the lower-cost alternative — a remote
version of the same study, a simulation, a public dataset standing in for
original data collection — rather than treating travel cost as a minor detail to
mention in passing.

**Calibrate to degree level, same as Novelty above.** A PhD dissertation can
justify a longer runway to build infrastructure that doesn't exist yet; a
capstone with a fixed one-semester timeline generally can't, so the same "would
need to build a dataset from scratch" fact should weigh more heavily against a
capstone than against a dissertation.

## 4. Relevant & fits your program/advisor (incl. UN SDG alignment)

**What good looks like:** The topic should be "meaningful and relevant" to the
field (Enago), fit the researcher's career trajectory — publishability for academic
paths, marketability for industry ones (Maastricht) — and, per ThesisAI's
pressure-test, be something "your advisor would recognize... as fitting their
expertise." Enago adds that an advisor has to actually be willing to supervise the
work — relevance isn't just abstract, it has to connect to a real available
supervisor.

**Failure patterns:**
- No apparent connection to the program's field, current advisor's expertise, or
  department's focus areas.
- The topic serves neither an academic trajectory (no publication angle) nor an
  industry one (no marketable skill or output) — relevance to the student's actual
  goals is unclear.
- Never checked against an advisor's willingness or expertise at all.

**Fixing it:** Name what specifically makes this relevant (a course, a professor's
known research area, an industry skill), or flag it as an open question to raise
with an advisor directly if that connection isn't yet established. Note for the
verdict: an unconfirmed advisor connection (Missing) is a question to resolve
alongside starting research, not proof the topic itself is broken — it only
weighs down the overall verdict if you can point to an actual mismatch (Weak),
e.g. no faculty in the department works anywhere near this area.

**Program requirement: the topic must map to at least one UN Sustainable
Development Goal.** This is a hard requirement for this program, not an optional
nice-to-have, so check it explicitly every time rather than folding it silently
into the general relevance judgment. The 17 SDGs, for reference (don't spend a
web search looking these up):

1. No Poverty
2. Zero Hunger
3. Good Health and Well-being
4. Quality Education
5. Gender Equality
6. Clean Water and Sanitation
7. Affordable and Clean Energy
8. Decent Work and Economic Growth
9. Industry, Innovation and Infrastructure
10. Reduced Inequalities
11. Sustainable Cities and Communities
12. Responsible Consumption and Production
13. Climate Action
14. Life Below Water
15. Life on Land
16. Peace, Justice and Strong Institutions
17. Partnerships for the Goals

Most CS topics connect to at least one with a little thought — an efficiency
improvement can serve SDG 9 (infrastructure) or SDG 7/13 (energy/climate) if it
reduces compute or power draw, an accessibility or ed-tech tool serves SDG 4 or
10, a health-data or diagnostic system serves SDG 3, and so on. Name the specific
goal(s) and the actual mechanism connecting the topic to it — "this could relate
to SDG 9 somehow" is not a real mapping; "this reduces model inference cost,
which cuts energy use per query, connecting to SDG 7 and SDG 13" is. If, after
genuinely trying, no plausible connection exists, that's a real Weak finding on
this dimension, not something to paper over — say so and suggest a reframing
that would create a real connection rather than bolting on an unconvincing one.

## 5. Sustains your interest

**What good looks like:** Maastricht is blunt about this: "your (quality of) life
will be much better if the hours spent on your project are spent enjoyably," and
research quality genuinely improves with real engagement. ThesisAI frames it as a
FINER criterion in its own right — "will your motivation sustain through months of
research?" — because a thesis is a long project, not a single sprint.

**Failure patterns:**
- The topic reads as chosen purely for expedience (easiest data, shortest path)
  with no sign of genuine curiosity behind it.
- The user's own description suggests ambivalence or that this was someone else's
  suggestion, not theirs.

**Fixing it:** This is the one dimension the assessor can't fix on the user's
behalf — ask directly what part of the subject actually interests them, and
consider whether a nearby reframing of the topic could better center that. Don't
*invent* disinterest without evidence — that's a different error from honestly
rating the dimension. When the topic or conversation gives no signal either way,
the honest rating is **Missing** (genuinely unassessed), not an assumed Adequate;
say plainly that this one needs to be asked rather than guessed. As with Relevant
above, that routine Missing is an open question for the verdict, not a strike
against the topic — it only weighs the verdict down if there's actual evidence of
disinterest (Weak).

## The "field vs. topic" trap

Both ThesisAI and Enago separately flag the single most common failure: choosing a
field ("climate change," "AI in education") instead of a topic. A field fails
dimension 1 (not specific/arguable) and usually dimension 3 (not feasible — far too
much ground to cover) at once. When a submitted "topic" is really a field, say so
plainly and push for a one-sentence research question before scoring the rest, per
Step 1 of the workflow in SKILL.md — scoring a field against the other four
criteria produces noise, not signal.
