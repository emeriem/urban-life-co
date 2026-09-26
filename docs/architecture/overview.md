# Urban Life Co. architecture

## Public layer
React/Vite PWA presenting Urban Life Co. and its experience ecosystem: Urban Hikers, Urban Fitness and Urban Connect. Public content is sourced from the AppDeploy backend content API.

## CMS layer
A private Super Admin route provides management for events, experiences, Journal stories, announcements, messages, media and site content.

## Authorization
Authentication and authorization are separate. The backend enforces the Super Admin allowlist; the public site does not expose the administrator identity.

## Media
Direct uploads use AppDeploy storage. Google Photos uses the Photos Picker flow. The Google access token is kept in the active browser session and is not stored by the Urban Life backend.

## PWA/cache
The service worker uses network-first behavior for same-origin GET requests and clears prior cache versions on activation so deployments propagate reliably.
