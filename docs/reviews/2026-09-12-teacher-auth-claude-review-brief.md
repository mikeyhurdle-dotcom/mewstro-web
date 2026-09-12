# Claude review brief: MEW-1 teacher authentication remediation

Please independently review the exact commit at the head of `codex/mewstro-teacher-auth-fix` against base `caf2a1a3a8ebc41a696ec49f72f6e087c9da2c7b`. Record the reviewed commit SHA before beginning and request re-review if the patch changes materially afterward.

## Security objective

Remove every acceptance and issuance path for the unsigned `mewstro_teacher_session` password cookie. Teacher access must require a server-verified Supabase user plus an exact, active `mewstro_studios.teacher_email` entitlement. The `mewstro_teacher_studio` cookie may select only among the verified user's current entitlements. Teacher data queries use a service-role client, so any bypass at this boundary is high impact.

## Review focus

- Trace `/teacher` on `studio.mewstro.com`, other hosts and direct Server Action/Route Handler requests. Look for any path that reaches the service-role client without a fresh identity and studio check.
- Attempt bypasses with only the legacy cookie, password environment variables, missing/invalid Supabase cookies, a Supabase error carrying stale user data, unauthorised authenticated users, wildcard-bearing emails, and a foreign/stale studio selector.
- Confirm login UI and server actions can no longer issue password sessions, while magic-link request and callback flows still work.
- Confirm selector issuance and every selector read revalidate studio ownership, including multi-studio teachers and inactive/no-studio identities.
- Check protected actions and billing/materials/repertoire paths for cross-studio identifiers or page-only checks. Pay particular attention to `src/lib/teacher-auth.ts`, `src/lib/supabase.ts`, `src/lib/teacher-queries.ts`, `src/app/teacher/**/actions.ts`, `src/app/api/billing/portal/route.ts`, `src/app/teacher/auth/callback/route.ts`, and `src/middleware.ts`.
- Confirm POST logout signs out of Supabase and clears selector plus inert pre-fix legacy state.
- Review test quality, not just pass/fail: forged legacy cookie rejection, verified access, unauthorised identity, cross-studio selector rejection, protected action fail-closed behaviour and logout.

## Boundaries and release hold

No schema/data change, merge or deployment is included. Do not send teacher emails during review. Production remains vulnerable until a reviewed commit is deployed, obsolete Vercel password variables are removed, and the release is verified. Historical exposure/log review is separate; there is currently no evidence that unauthorised access actually occurred.
