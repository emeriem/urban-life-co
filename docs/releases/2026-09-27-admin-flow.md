# 2026-09-27 — Admin Flow Hardening

## Production change

The Urban Life Co. PWA admin flow was hardened in AppDeploy.

### Behaviour

- `/admin` remains a private entry point with no administrator email displayed publicly.
- An authenticated but unauthorised account receives a generic wrong-account denial.
- Authentication failure returns the visitor to the neutral administrator sign-in state.
- `Try another account` signs the current identity out and returns to the private admin start.
- `Sign out` now returns to the private admin sign-in screen rather than the public homepage.
- The user can repeat the authentication flow with another account without refreshing the browser.
- Admin authorization remains server-side through the AppDeploy administrator allowlist.

## Brand asset

The official Urban Life Co. logo is referenced by the application through the AppDeploy resource path `public/resources/urban-life-logo.png`. The binary asset value is not stored in source-control documentation.

## QA coverage

The test suite includes public discovery, CMS operations, contact/media persistence, Google Photos protection/retry, and admin logout/account switching.

## Security

No OAuth secrets, API keys, tokens, passwords, or other secret values are stored in GitHub. Secret names, purposes and configuration guidance live in `docs/SECURITY.md`.

## Source of truth

This change belongs on `develop` first. Production promotion should occur only after the complete regression suite passes and the corresponding implementation is synchronized with this repository.
