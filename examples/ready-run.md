# READY example

Source: extracted and abridged from `EVIDENCE.md` Live run 4.

Evidence tier: publicly verifiable maintainer run. This example is real Type-B evidence, but its long-term outcome was recorded as "to be confirmed" at the time of logging.

URL note: `EVIDENCE.md` records historical `simba6507` URLs from the time of the run; this example uses the current canonical `kktu6507` repository URL after transfer.

## Task

Implement four design-comparison improvements into udflow's own contract reference files:

- filtered-diff retrieval pointer
- content-type-specific noise filtering recipes
- cache-friendly context-ordering principle
- tagged cost-estimate-basis rule

The run also included the 0.22.0 version bump and CHANGELOG update. It was spec/docs-only: no code, hook, or machine-token change.

## Intent Given

Contract-level intent with six numbered acceptance criteria and exact before/after strings. A plan pre-review caught three design defects before implementation: byte drift between synced clauses, a CI-guarded fence line that must not be edited, and the correct reference-file home for each principle.

## Reviewers Selected

`spec`, `test`, and `architecture`, plus adversarial verification of blocker/major findings and `gatekeeper` at maximum effort.

Scoped out: `code`, `security`, `operability`, and `ui-ux`, because the change did not touch code, security surface, runtime operations, or UI.

## Verification

- `node --test` passed: 128 pass, 0 fail, 2 environment-conditional skips.
- `node .github/scripts/validate-structure.mjs` passed.
- `claude plugin validate .` and `claude plugin validate ./udflow` both passed.
- GitHub CI passed on macOS, Ubuntu, and Windows.

## Verdict

`READY` on the first iteration.

No blocker or major finding survived adversarial refutation.

## Caught

One real minor: the new cost-basis prose could be read as mismatching the unchanged full-report Total-row `Source` literal `observed + estimate`. The wording was reconciled.

## Outcome

Merged in PR #28 and auto-released as `v0.22.0`.

Evidence: https://github.com/kktu6507/universal-dev-flow-plugin/pull/28
