import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% of transactions for performance monitoring (stays within free tier)
  tracesSampleRate: 0.1,

  // Disable session replays to save quota
  replaysSessionSampleRate: 0,
  // Capture replays only on errors (1% to stay within limits)
  replaysOnErrorSampleRate: 0.01,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Scrub PII from error payloads
  beforeSend(event) {
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },
})
