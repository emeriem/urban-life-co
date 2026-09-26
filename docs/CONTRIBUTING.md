# Contributing to Urban Life Co.

## Branch policy

- `main` is the stable production branch. Do not develop directly on `main`.
- `develop` is the integration and QA branch.
- Use a short-lived branch for each change, for example `fix/admin-auth` or `feature/event-cms`.
- Open a pull request into `develop` after the change is implemented and tested.
- Only merge `develop` into `main` after full regression QA and production readiness review.

## Change workflow

1. Start from the latest `develop`.
2. Create a feature/fix branch.
3. Implement the smallest coherent change.
4. Run the local build and relevant tests.
5. Test the affected user flow end-to-end, including error and empty states.
6. Check desktop and mobile behaviour for UI changes.
7. Open a PR into `develop` with a concise summary and QA notes.
8. After integration, run regression QA before promoting to `main`.

## Security rules

Never commit:

- OAuth client secrets
- API keys
- Admin credentials or passwords
- Access tokens, refresh tokens, session tokens, cookies, or private keys
- Production database credentials
- AppDeploy secrets

These values must live in the appropriate secret/environment configuration. Documentation should describe **what secret is required, where it is configured, what it is used for, and how to obtain/rotate it** without recording the secret value itself.

## Pull request expectations

A PR should state:

- What changed
- Why it changed
- Which user flows were tested
- Any migrations or environment configuration required
- Known limitations or follow-up work

## Production rule

No change is considered complete merely because it compiles. A change is complete when its intended behaviour works, relevant regression paths have been checked, and the correct branch has been merged.