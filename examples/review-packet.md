# Review Packet field example

Source: reconstructed from `EVIDENCE.md` Live run 5.

This is not the verbatim packet from the run and is not meant to be copied directly into a reviewer handoff. It is a contract-field example using facts recorded in the evidence log. A real reviewer handoff must follow `udflow/skills/universal-dev-flow/references/review-packet.md`, including the full shared reviewer contract.

## Task

Implement four user-requested enhancements into udflow's own contract files:

- `--deep` + UI drives live browser evidence through Claude in Chrome.
- `--report full` splits cost into Input / Output / Cache-write / Cache-read.
- `ui-ux-pro-max` is required at planning for design-system scope.
- `--report full` embeds final changed-UI screenshots.

## Acceptance criteria (user-approved, numbered; gatekeeper checks each)

1. Browser-evidence rules are documented without creating a hard dependency when the capability is unavailable.
2. Cost-table columns are reflected in the final report contract.
3. UI design-system work consults `ui-ux-pro-max` when available and discloses fallback when absent.
4. Screenshot guidance protects sensitive artifacts and does not encourage unsafe public disclosure.
5. Hooks and machine-token literals remain unchanged.
6. Structure validation and hook tests pass.

## In scope

- udflow contract/reference documentation.
- Final-report contract text.
- Validation guard for the cost-table columns.
- Version and CHANGELOG updates for the release.

## Out of scope

- Hook behavior changes.
- New agents or reviewer roster changes.
- Runtime browser implementation in this repo, because the repo has no web UI.
- Changes to verdict literals, severity literals, sentinels, or issue-template fields.

## Assumptions

- The repo is Markdown / Node JS.
- Browser runtime behavior must be disclosed as a gap when it cannot be exercised locally.
- Evidence screenshots may contain secrets or PII and must be treated as sensitive.

## Implementation summary

Updated udflow's reference documentation and final-report contract to describe live browser evidence, screenshot handling, UI design-system reviewer selection, and cost-table component columns. Added a validator guard so future contract drift in the cost table fails CI. Hooks and machine tokens remained unchanged.

## Changed files

| Path | Purpose |
|---|---|
| `udflow/skills/universal-dev-flow/references/final-report.md` | Cost columns and screenshot evidence contract. |
| `udflow/skills/universal-dev-flow/references/browser-evidence.md` | Browser-driving and screenshot sensitivity guidance. |
| `.github/scripts/validate-structure.mjs` | Guard for the new cost-table columns. |
| `CHANGELOG.md` and plugin manifests | Version and release notes. |

## Changed diff (filtered)

Illustrative placeholder: the original filtered diff cannot be reconstructed from `EVIDENCE.md`.

- Trimmed: this public example omits the original diff; it keeps the file list and verification facts from the evidence log.
- Regenerate (full Live run 5 commit scope):

  ```bash
  git show --stat --patch f8bef45 -- \
    .claude-plugin/marketplace.json \
    .github/scripts/validate-structure.mjs \
    CHANGELOG.md \
    README.md \
    README.zh-TW.md \
    package.json \
    test/hooks.test.mjs \
    udflow/.claude-plugin/plugin.json \
    udflow/agents/gatekeeper.agent.md \
    udflow/agents/test-reviewer.agent.md \
    udflow/agents/ui-ux-reviewer.agent.md \
    udflow/skills/universal-dev-flow/SKILL.md \
    udflow/skills/universal-dev-flow/references/browser-evidence.md \
    udflow/skills/universal-dev-flow/references/deep-mode.md \
    udflow/skills/universal-dev-flow/references/external-capabilities.md \
    udflow/skills/universal-dev-flow/references/final-report.md \
    udflow/skills/universal-dev-flow/references/verification-gate.md
  ```

## Verification evidence

| Command / check | Type | Required? | Ran? | Exit status | Summary |
|---|---|---:|---:|---|---|
| `node .github/scripts/validate-structure.mjs` | structural validation | yes | yes | 0 | Passed, including the new cost-table guard. |
| `node --test` | test | yes | yes | 0 | 127 pass / 0 fail / 4 pre-existing Windows-symlink skips. |
| Hooks byte comparison | contract check | yes | yes | 0 | Hooks unchanged. |
| GitHub CI | CI | yes | yes | 0 | macOS / Ubuntu / Windows green. |
| Browser driving / screenshot capture | runtime UI evidence | no | no | n/a | Not exercisable in this repo because it has no web UI. |

## Known risks

- Authenticated browser evidence can expose sensitive session data.
- Public PRs or issues can leak screenshots if final reports embed sensitive states.
- "Required" optional capabilities can be misread as hard dependencies unless fallback wording is explicit.

## Reviewer scope

| Reviewer | Question |
|---|---|
| `spec-reviewer` | Do the contract docs satisfy the six acceptance criteria without changing forbidden literals? |
| `test-reviewer` | Are the validation guard and verification evidence strong enough for spec/docs contract changes? |
| `architecture-reviewer` | Are reference-file placement and boundary wording coherent? |
| `security-reviewer` | Does browser/screenshot evidence disclose authenticated-session and data-leak risk? |
| `ui-ux-reviewer` | Does UI evidence wording preserve usability and accessibility expectations without overclaiming? |
| `operability-reviewer` | Are artifacts, screenshots, runtime gaps, and public-reporting risks diagnosable? |
| `code-reviewer` | In the repair round, is the validator JavaScript local, maintainable, and scoped? |

## Context exclusions

Do not review unrelated historical benchmark methodology, unrelated hook internals, or issue-template wording unless the diff touches those surfaces. Deferred browser-runtime execution is not a missing requirement for this repo.

## External-capability notes

- Claude in Chrome / browser runtime: required for downstream UI projects, but unavailable in this repo; the final verdict must disclose the runtime gap.
- `ui-ux-pro-max`: optional external capability; the contract must require consultation when available and disclose fallback when unavailable.
- Codex / other MCP capabilities: not required for this run.

## Design contract (`design.md`)

none

## Shared reviewer contract

Real reviewer handoffs must paste the full shared reviewer contract verbatim from `udflow/skills/universal-dev-flow/references/review-packet.md`. This public example names the field and the source but does not duplicate the full contract text to avoid creating a second source of truth.

## fork_context

`fork_context=false`

Reason: the packet includes the requirement, scope, verification evidence, known risks, and exclusions needed for review. Historical requirement evolution is not needed.
