# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a vulnerability

If you discover a security issue in Glow, please report it responsibly:

**Email:** hello@chaitanyaprabuddha.com

Please include:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment (e.g. XSS, data exposure)
- Your contact information (optional)

We aim to acknowledge reports within 72 hours and will work with you on a fix before public disclosure when appropriate.

## Scope

In scope:

- Cross-site scripting (XSS) via log rendering
- Content Security Policy bypasses
- ReDoS or denial-of-service via crafted log input
- Unsafe handling of shared URL state
- PWA / service worker issues that expose user data

Out of scope:

- Social engineering
- Issues in third-party hosting infrastructure
- Log content shared voluntarily via URL by users

## Security model

Glow processes all log content client-side. User text must never be rendered as raw HTML. Security headers (CSP, HSTS, X-Frame-Options, etc.) are configured for production deployments. See `vercel.json` and `next.config.mjs`.
