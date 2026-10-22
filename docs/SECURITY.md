# Security and Secret Management

This document intentionally contains **no secret values**.

## Required secret categories

| Secret / credential | Purpose | Store in | Never commit |
|---|---|---|---|
| Google OAuth Client ID | Identifies the Urban Life web application for Google OAuth / Photos Picker | AppDeploy/environment configuration and Google Cloud OAuth client settings | Client secret, tokens, or credentials |
| Google OAuth Client Secret (if the selected OAuth flow requires one) | Server-side OAuth exchange where applicable | AppDeploy secret/environment configuration | Yes |
| Google Photos OAuth access/refresh tokens | Authorised Google Photos access for the Super Admin workflow | Runtime/session storage appropriate to the implemented flow | Yes |
| AppDeploy secrets | Runtime API/database/integration credentials | AppDeploy secret manager | Yes |
| Database/storage credentials | Server-side data access | AppDeploy secret/environment configuration | Yes |
| Admin credentials | Administrative identity/authentication | Identity provider / AppDeploy auth configuration | Yes |

## Super Admin

The application must enforce administrator authorization server-side. The public website must not expose the administrator's email address or any credential.

The current Super Admin identity is configured outside source control. Do not put the email allowlist or any credential into client-side source files when the platform supports server-side configuration.

## Google Photos

The public website must never directly access the Super Admin's Google Photos account. Google Photos Picker is initiated from the authenticated admin CMS. Tokens must be scoped to the required functionality and must not be persisted in Git.

## Configuration documentation

When a new environment variable or secret is introduced:

1. Add its **name**, purpose, required/optional status, and configuration location to this document or the relevant integration documentation.
2. Do not add its value.
3. Add a safe placeholder to `.env.example` if local development needs it.
4. Update deployment documentation.
5. Record rotation/revocation steps when applicable.

## Incident response

If a secret is accidentally committed:

1. Treat it as compromised immediately.
2. Revoke/rotate it at the issuing provider.
3. Remove the secret from the repository history using the appropriate repository tooling if required.
4. Update the deployment environment with the replacement.
5. Review access logs where available.

Deleting a secret from the latest file alone does **not** make a previously committed secret safe.