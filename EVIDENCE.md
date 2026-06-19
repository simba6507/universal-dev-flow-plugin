# Evidence log

This file is the **single source of truth** for udflow's empirical track record and for deciding when the
**"experimental"** label can be dropped. The README's status banner summarizes it; the numbers below are
authoritative.

It is a manual log on purpose: udflow ships **no telemetry** and does not report usage anywhere (good for
privacy, but it means runs only "count" if they are written down here). Anyone can add an entry via pull
request.

## What counts (strict)

A data point counts toward graduation **only if it has a verifiable ground truth and is recorded here.**

- **Type A — blind bug-catch.** A *known* historical bug is presented to udflow's reviewer(s) **blind**
  (pre-fix code only; no fix, issue, or repo access), and an independent judge scores the findings against
  the known defect. Unit = one bug.
- **Type B — verified live task.** A real udflow run on actual work where the outcome was **verified**
  (e.g. its `READY` verdict held up, or escaped defects were later found and recorded). Unit = one task.

**Does NOT count toward the rates:** testimonials, "I used it and liked it", stars, install counts. These are
adoption signals — log them under [Adoption](#adoption-not-counted-toward-graduation), separate from the rates.

This applies equally to the maintainer's runs and to contributors' runs — the gate is *verifiable ground
truth*, not *who ran it*.

## Graduation criteria

Drop the **"experimental"** label when this file documents **all** of:

1. **Breadth** — ≥ 3 distinct external repositories, across ≥ 2 languages.
2. **Volume** — ≥ 20 qualifying data points (Type A bugs and/or Type B tasks).
3. **Anti-bias + measured** — aggregate catch-rate and false-positive-rate are computed, and **≥ half of the
   bug data points are bugs that were NOT previously surfaced by a prior review** (so the sample isn't
   skewed toward "already known to be catchable").

## Running tally

| Metric | Now | Target |
|---|---|---|
| External repos | **1** (Plan_PJ) | ≥ 3 |
| Languages | **1** (C#/.NET) | ≥ 2 |
| Qualifying data points | **8** | ≥ 20 |
| Not-previously-review-found bugs | **5 / 8** | ≥ half |
| Catch rate | 6 hit + 1 partial / 8 | (reported, not a pass/fail) |
| False-positive rate | **0** of ~46 findings | (reported) |

**Status: not yet graduated** — 1/3 repos, 1/2 languages, 8/20 points.

## Entries

### Run 1 — 2026-06-19 · Plan_PJ (C#/.NET) · retroactive blind bug-catch

Method: pre-fix code of 8 real fixed bugs, extracted to packets outside the repo (the repo's own
`docs/gstack-review-report.md` documents some of them, so reviewers were barred from reading the repo).
Round 1 = single reviewer; Round 2 = full panel (hit if any panelist catches it). Independent judge scored
each against the known defect. **Result: 6 hit / 1 partial / 1 miss · 0 false positives** (~46 findings;
~40 extra plausible-but-unverified).

| Bug | Defect | Reviewer(s) | Review-found before? | Verdict | FP |
|---|---|---|---|---|---|
| B3 | `HttpResponseMessage` never disposed (resource leak) | code | yes (infra review) | **hit** | 0 |
| B4 | unbounded text written to a `nvarchar(4000)` column | code | yes | **hit** | 0 |
| B5 | raw escaped JSON dumped into a search index | code | no | **hit** | 0 |
| B6 | flat iteration cap (20) violates per-role spec | spec | yes (gstack C-2) | **hit** | 0 |
| N1 | UI count never refreshes during a background job | code + operability + ui-ux | no | **hit** | 0 |
| N3 | form validator is a no-op (model has no attributes) | security + code + spec | no | **hit** | 0 |
| B1 | missing cascade-delete of a child table (orphans) | code → code+arch+test | no | **partial → miss** | 0 |
| B2 | file stats count binary/empty/oversized files | code → code+test+spec | no | **miss → miss** | 0 |

Key finding: caught all 6 **concrete, code-visible** defects (resource/persistence/data-quality/spec/UI/validation),
0 false positives. Missed the 2 **omission-vs-intent** defects (a missing delete; stats that should exclude
binaries) — and a full 3-reviewer panel did **not** help, which says the lever is feeding reviewers the
intent/spec/plan, not adding reviewers. Limits: single repo/language; bugs from `fix` commits (3/8 previously
review-found); no concurrency/integration bugs tested; reviewers got no plan/requirements context, which
**understates** a full udflow run.

## Adding an entry

Append a new `### Run N — date · repo (language) · type` section with a table like Run 1's, then update the
**Running tally**. For Type A, state how ground truth was established and how leakage was prevented. For
Type B, state how the outcome was verified. Contributors: open a PR adding your section.

## Adoption (not counted toward graduation)

Testimonials, stars, install counts, and "it worked for me" reports go here. They show interest, not a
measured catch/false-positive rate, so they do not move the graduation tally.

_(none recorded yet)_
