# Task writing guide

udflow reviews against the task intent you provide. A vague task can still be implemented, but it gives `spec-reviewer`, `test-reviewer`, and `gatekeeper` too little to verify. A good task states the behavior, the acceptance criteria, the must-not-change boundary, and the expected evidence.

After a real run, contribute evidence by opening a [Verified udflow run issue](https://github.com/kktu6507/universal-dev-flow-plugin/issues/new?template=verified-run.yml) and pasting the `### Live run` block exactly as udflow printed it.

## Bad / better / best

Bad:

```text
Fix login bug.
```

Better:

```text
Fix login so expired access tokens are refreshed automatically.
```

Best:

```text
Fix login so that:
- expired access tokens are refreshed once before retrying the failed request
- concurrent API calls do not trigger duplicate refresh requests
- failed refresh logs the user out
- existing auth tests remain green
- no change is made to unrelated route guards
```

The best version gives udflow a contract. Reviewers can check behavior, edge cases, regression risk, and scope discipline.

## Template

```text
/udflow:run <change request>

Requirement:
- <what must change>

Acceptance criteria:
- <observable result 1>
- <observable result 2>
- <edge/failure case>

Must not change:
- <routes, APIs, data shape, copy, UI layout, or behavior that must remain stable>

Verification expected:
- <commands, tests, browser checks, migration checks, or manual evidence>

Risk areas:
- auth / data / contract / UI / performance / rollback
```

## Examples by task type

Auth / security:

```text
/udflow:run Fix the password reset flow so expired reset tokens are rejected, valid tokens can be used once, reused tokens fail, and no user enumeration is introduced.
```

API contract:

```text
/udflow:run Add the new `statusReason` field to the order API response without breaking existing clients. Keep old fields unchanged, update tests, and document the response contract.
```

UI / UX:

```text
/udflow:run Update the checkout error state so failed payment, expired session, and network timeout show distinct messages. Confirm in browser and preserve existing layout on mobile.
```

Data migration:

```text
/udflow:run Add a migration for the new invoice status column. It must be backward compatible, have a rollback path, and preserve existing invoice query behavior.
```

Documentation / workflow:

```text
/udflow:run Rework the README introduction so a new visitor understands the product in 30 seconds. Keep install commands unchanged, preserve all hook names, and verify multilingual README parity plus text integrity.
```

## What reviewers need

- `spec-reviewer` needs the intended behavior and must-not-change scope.
- `test-reviewer` needs expected verification and edge cases.
- Conditional reviewers need risk signals such as security, data integrity, UI, migration, operability, or architecture impact.
- `gatekeeper` needs concrete acceptance criteria so it can withhold `READY` when evidence is missing.

## Keep technical contracts literal

Do not localize or rename identifiers, API fields, database objects, config keys, protocol values, verdict literals, or sentinels just to make a task read naturally. Human prose can be localized; technical contracts should stay exact.
