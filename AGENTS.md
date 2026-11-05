# Project architecture rules

- Store one shared logo image with per-page placement settings for mobile, tablet, and desktop (pages without their own settings fall back to the global ones); this keeps branding consistent while letting each page and screen size be adjusted independently.
- Keep user role assignment enforced by database policies and opt-in authenticated integration tests using a disposable player; this prevents client-side privilege escalation without touching real users' roles.