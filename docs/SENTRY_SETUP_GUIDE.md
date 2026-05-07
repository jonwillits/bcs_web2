# Sentry Error Tracking Setup Guide

This guide explains how to set up and use Sentry for error monitoring on the BCS E-Learning Platform. Sentry captures client-side and server-side errors, providing stack traces, breadcrumbs, and context to help debug issues in production.

---

## Table of Contents

1. [Why Sentry](#1-why-sentry)
2. [Create a Sentry Project](#2-create-a-sentry-project)
3. [Get Your Configuration Values](#3-get-your-configuration-values)
4. [Add Environment Variables to Vercel](#4-add-environment-variables-to-vercel)
5. [How the Code Is Structured](#5-how-the-code-is-structured)
6. [Content Security Policy](#6-content-security-policy)
7. [Verify It Works](#7-verify-it-works)
8. [Day-to-Day Usage](#8-day-to-day-usage)
9. [Alerts](#9-alerts)
10. [Free Tier Considerations](#10-free-tier-considerations)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Why Sentry

Vercel provides function logs, but they have significant limitations:

| Vercel Logs | Sentry |
|---|---|
| Last 1 hour only (free/Pro) | Persistent error history (30 days+) |
| Raw console output, no search | Full stack traces with source maps |
| No grouping — same error appears N times | Groups duplicate errors into one issue with a count |
| No context about browser, URL, or user role | Rich context: browser, OS, route, breadcrumbs |
| No alerting | Email/Slack alerts on new error types |

For a class of 150 students, the practical scenario is: a student hits a bug at 2 AM, you check the next morning — Vercel logs are already gone. With Sentry, the error is there with the full stack trace and the exact page they were on.

---

## 2. Create a Sentry Project

1. Go to [sentry.io/signup](https://sentry.io/signup/) and create an account (GitHub sign-in is easiest)
2. Choose the **Free / Developer** plan (5,000 errors/month)
3. Click **Create Project**
4. Select **Next.js** as the platform
5. Name the project (e.g., `bcs-etextbook`)
6. Click **Create Project**
7. Sentry will show a setup wizard — **skip it** (the code is already in the codebase)

---

## 3. Get Your Configuration Values

You need 4 values from Sentry:

| Value | Where to Find It |
|---|---|
| **DSN** | Settings > Projects > your project > Client Keys (DSN). Looks like `https://abc123@o456.ingest.us.sentry.io/789` |
| **Org slug** | Settings > Organization. The slug is in the URL: `sentry.io/organizations/{org-slug}/` |
| **Project slug** | Settings > Projects. The slug is listed next to your project name (e.g., `javascript-nextjs`) |
| **Auth token** | Settings > Account > API > Auth Tokens > Create New Token |

### Auth Token Permissions

When creating the auth token, set these permissions:

| Permission | Level | Why |
|---|---|---|
| Project | Read & Write | Source map uploads |
| Release | Read & Write | Create releases on deploy |
| Organization | Read | Find your project during build |

Leave everything else as "No Access."

---

## 4. Add Environment Variables to Vercel

Go to your Vercel project > Settings > Environment Variables. Add:

| Variable | Value | Sensitive? |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | Your DSN URL | No (public, exposed to browser) |
| `SENTRY_ORG` | Your org slug | No |
| `SENTRY_PROJECT` | Your project slug | No |
| `SENTRY_AUTH_TOKEN` | Your auth token | **Yes** (has write access) |

Set all 4 for the **Production** environment. Optionally add to Preview as well.

After adding the variables, **redeploy** — either push a commit or click Redeploy in the Vercel dashboard. The `NEXT_PUBLIC_` variable is baked in at build time, so a redeploy is required.

---

## 5. How the Code Is Structured

The Sentry integration is already fully configured in the codebase. Here is what each file does:

### `sentry.client.config.ts` — Browser-Side Initialization

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,            // 10% of page loads traced
  replaysSessionSampleRate: 0,       // No session replays
  replaysOnErrorSampleRate: 0.01,    // 1% error replays
  enabled: process.env.NODE_ENV === 'production',
  beforeSend(event) { /* scrubs email + IP from payloads */ },
})
```

Captures: unhandled exceptions, promise rejections, and fetch errors in the browser.

### `sentry.server.config.ts` — Server-Side Initialization

Same structure as the client config. Captures errors in API routes and server components.

### `sentry.edge.config.ts` — Edge Runtime Initialization

Same structure. Captures errors in middleware and edge API routes.

### `src/instrumentation.ts` — Next.js Instrumentation Hook

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('../sentry.server.config')
  if (process.env.NEXT_RUNTIME === 'edge') await import('../sentry.edge.config')
}
export const onRequestError = Sentry.captureRequestError
```

The `register()` function loads the correct Sentry config based on the runtime. `onRequestError` automatically captures any unhandled server errors.

### `src/app/global-error.tsx` — App Router Error Boundary

Catches unhandled React rendering errors, sends them to Sentry via `Sentry.captureException(error)`, and shows a recovery UI with a "Try again" button.

### `next.config.ts` — Build Integration

The Next.js config is wrapped with `withSentryConfig()` which:
- Uploads source maps to Sentry during build (for readable stack traces)
- Deletes source maps after upload (so they are not served to browsers)
- Uses `SENTRY_AUTH_TOKEN` for authenticated upload

### Privacy

All Sentry configs include a `beforeSend` hook that removes `user.email` and `user.ip_address` from error payloads before they are sent to Sentry. No PII is stored.

---

## 6. Content Security Policy

The platform's CSP headers (in `next.config.ts`) allow connections to Sentry's ingest endpoints:

```
connect-src ... https://*.ingest.sentry.io https://*.ingest.us.sentry.io
```

Both the global and US-region ingest domains are included. If Sentry changes their ingest domain or you switch to a different region (e.g., EU), you may need to update this.

---

## 7. Verify It Works

After deploying with the environment variables set:

1. Go to your deployed site
2. Open the browser DevTools console
3. Run: `setTimeout(() => { myUndefinedFunction(); }, 0)`
4. Wait ~10 seconds
5. Go to Sentry > **Issues** — you should see `ReferenceError: myUndefinedFunction is not defined`

**Why `setTimeout`?** Errors typed directly in the console are not captured by Sentry's `window.onerror` handler. Wrapping in `setTimeout` runs the error inside the event loop where Sentry can intercept it.

You can also verify the SDK is loaded by typing `window.__SENTRY__` in the console — it should return an object with version, DSN, and integration details.

After confirming, click **Resolve** on the test issue in Sentry.

---

## 8. Day-to-Day Usage

### Issues Page

This is where you will spend most of your time. Every unique error becomes an **issue**.

Each issue shows:
- **Error message** and full stack trace (with original TypeScript source via source maps)
- **Event count** — how many times it occurred
- **User count** — how many unique users were affected
- **Breadcrumbs** — the sequence of actions (page navigations, API calls, clicks) leading up to the error
- **Tags** — browser, OS, URL, environment

### Workflow

| Action | When |
|---|---|
| **Check after a deploy** | Look for new issues (orange "New" badge) |
| **When a student reports a bug** | Search Issues by error message or URL |
| **Weekly review** | Sort by frequency to catch recurring problems |

### Managing Issues

- **Resolve** — Mark a bug as fixed. If it recurs after a future deploy, Sentry automatically reopens it.
- **Ignore** — Dismiss known issues you will not fix (e.g., browser extension errors).
- **Assign** — Assign an issue to a team member for tracking.

---

## 9. Alerts

Set up alerts to be notified of new errors:

1. Go to **Alerts** in the left sidebar
2. Click **Create Alert Rule**
3. Choose: "When a new issue is created"
4. Action: Send email notification (or Slack, if connected)
5. Save

This notifies you when a **new type** of error appears — not for every occurrence of a known issue.

---

## 10. Free Tier Considerations

The Sentry Developer plan includes 5,000 errors per month. The configuration is tuned to stay well within this limit:

| Setting | Value | Why |
|---|---|---|
| `tracesSampleRate` | 0.1 (10%) | Only 10% of page loads create performance traces |
| `replaysSessionSampleRate` | 0 | Session replays disabled entirely |
| `replaysOnErrorSampleRate` | 0.01 (1%) | Only 1% of errors record a session replay |

For 150 users, this is more than sufficient. If you approach the limit, you can:
- Lower `tracesSampleRate` to `0.05` (5%)
- Add more specific `ignoreErrors` patterns for noisy but harmless errors

---

## 11. Troubleshooting

### No errors appearing in Sentry

1. Check that `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel and a redeploy has completed
2. Open browser console and check `window.__SENTRY__` — if undefined, the SDK did not load
3. Check the browser Network tab for requests to `ingest.us.sentry.io` — if blocked, check CSP headers
4. Sentry is disabled in development (`enabled: process.env.NODE_ENV === 'production'`) — test on the Vercel deployment, not localhost

### CSP blocking Sentry

If you see `Refused to connect to 'https://...ingest.us.sentry.io'` in the console, the Content Security Policy is blocking Sentry. Ensure `next.config.ts` includes both `https://*.ingest.sentry.io` and `https://*.ingest.us.sentry.io` in the `connect-src` directive.

### Source maps not working (minified stack traces)

Check the Vercel build logs for Sentry-related output. If source map upload fails:
- Verify `SENTRY_AUTH_TOKEN` is set and has Project (Read & Write) + Release (Read & Write) permissions
- Verify `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account

### "Something went wrong" page appears

This is the `global-error.tsx` error boundary. It means a React rendering error was caught. The error has already been sent to Sentry — check your Issues dashboard for details.
