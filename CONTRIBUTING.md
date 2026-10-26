# Contributing and Safe Change Workflow

## Golden rules

1. Protect the current live application; do not rewrite or redeploy casually.
2. Work in a feature branch and submit a pull request. Avoid direct commits to `main` for substantive work.
3. Inspect current code, tests, deployment status, and open PRs before making assumptions.
4. Keep changes focused, reversible, and covered by tests where possible.
5. Distinguish implemented behavior from behavior actually verified.
6. Never commit secrets, tokens, customer/member data, production exports, or credential-bearing screenshots.
7. Never deploy to a new host or create another AppDeploy app unless the project owner explicitly requests it.

## Before changing code

- Read [Start Here](docs/START-HERE.md) and [Current State](docs/platform/current-state.md).
- Check the latest branch/PR status and whether another contributor has changed the same files.
- Confirm the relevant behavior and acceptance criteria.
- Identify any affected AppDeploy resources, secrets, database collections, and external integrations.
- For destructive or schema changes, define migration and rollback first.

## Local checks

Use the project's existing scripts:

```bash
npm install
npm run check:types
npm run build
```

Run relevant tests using the repository's actual test runner if configured. Do not invent test commands. If a check cannot run, document why and what evidence remains missing. Record Node/npm versions for reproducibility.

## Security and data handling

- Keep runtime secrets in AppDeploy secret management or the approved secret manager.
- Document secret names and purpose, never secret values.
- Validate and authorize every backend operation server-side.
- Do not rely on hidden buttons or frontend checks as authorization.
- Before multi-tenant work, define tenant ownership for each collection, upload, file, API route, and export.
- Add negative tests proving one tenant cannot read, mutate, delete, or enumerate another tenant's data.
- Do not onboard external brands until tenant isolation is implemented and verified.

## Pull request checklist

- [ ] Problem and intended behavior are clear.
- [ ] Scope is focused; no unrelated formatting or generated churn.
- [ ] Tests added/updated for behavior changes.
- [ ] Type check and build results recorded.
- [ ] Auth, permissions, data migration, and error handling reviewed where applicable.
- [ ] Required static resources and AppDeploy bindings verified.
- [ ] Documentation/status ledger updated.
- [ ] Rollback plan included for risky changes.
- [ ] No secrets or private user data included.
- [ ] Production deployment is not implied by merge.

## Deployment gate

AppDeploy app ID: `urban-life-co-zk9nyq`.

Only deploy through the existing AppDeploy workflow after reviewing the exact commit/snapshot, required resources, secret bindings, build/runtime validation, and rollback path. Wait for a terminal deployment status, then inspect QA, logs, and critical browser journeys. Report what was actually verified. A “Ready” status alone is not proof of complete functionality or security.
