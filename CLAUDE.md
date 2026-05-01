# Karaoke Remote Claude Instructions

Shared coding-agent guidance lives in [AGENTS.md](AGENTS.md). Follow it for Karaoke Remote architecture, implementation patterns, environment setup, testing, and repository-specific conventions.

## Claude Code rules

- Do not commit changes unless the user explicitly asks for a commit.
- Never commit `.env`, API keys, credentials, tokens, or generated secrets.
- Keep `.env.example` safe and non-secret.
- Use `APP_PUBLIC_ORIGIN` for QR/join URLs; for phone testing, use the host computer LAN IP instead of `localhost`.
- Prefer the project-standard commands listed in `AGENTS.md` for setup, dev servers, stopping servers, builds, and verification.
- For UI changes, use Playwright/browser smoke tests before reporting completion when possible.
