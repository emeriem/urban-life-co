# Admin flows

## Entry
`#admin` is a private route with a neutral sign-in prompt. The administrator email is never displayed.

## Correct account
Authenticate -> backend admin allowlist -> full CMS access.

## Wrong account
Authenticate -> backend rejects account -> show `Wrong account. This account does not have administrator access.`

## Authentication failure
Show `Account not found. Please try again.` and reset to the initial admin sign-in step.

## Logout
CMS -> Sign out -> admin sign-in screen. This intentionally keeps the operator in the admin flow so another account can be tried without navigating through the public site.
