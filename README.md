# byAudarya

A fully custom personal website + private publishing studio for **Audarya Gupta**, replacing the current Wix site at [www.byaudarya.com](https://www.byaudarya.com).

Editorial black-and-white design (light + dark), an AI-assisted writing studio, an approval-gated newsletter system (including a weekly Friday news recap), private contact + birthday/promo emails, and a Google-Calendar-synced appointment booker — all on infrastructure independent from any other project.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma** + **SQLite** (single-file DB on a Fly volume)
- **NextAuth** with **Google / Google Workspace** sign-in (admin locked to one email)
- **OpenAI (GPT-4o)** — writing assistant, translation, weekly recap curation
- **Nodemailer** over **Gmail / Google Workspace SMTP**
- **Google Calendar API** (+ optional **Zoom**) for appointments
- Deploys to **Fly.io** via Docker

All time-sensitive logic uses **IST (Asia/Kolkata)**.

## Features

### Public site
Home · About · My Writings (topic filter + language toggle) · article pages · Contact (with appointment booker) · Newsletter (+ archive) · Reading/Now · Privacy · Unsubscribe.
Global search, view counts, share buttons, RSS (`/feed.xml`), SEO/OpenGraph, and subtle easter eggs.

### Studio (`/admin`, Google sign-in, one authorized email)
- **Writings** — TipTap rich editor, cover image + credit, topics, featured, SEO, per-article translation (manual or AI, Hindi by default), AI assist (improve/shorten/expand/continue/title/excerpt), draft → publish.
- **Newsletters** — generate the **Friday Recap** (Top-10 intl + US finance/business/tech), or create general/promo/birthday emails. Edit every field, live preview, **send a test to yourself**, then **Approve → Send**. Nothing is ever sent to real recipients unless status is `approved` (enforced server-side).
- **Subscribers** — list, export CSV, remove.
- **Private contacts** — CSV bulk import (email, firstName, lastName, birthday) for birthday/promo emails, kept separate from newsletter subscribers.
- **Appointments** — accept (auto-creates Google Calendar event + Meet/Zoom link, emails the requester) or reject (polite decline). History view.
- **Now page** + **Settings** — edit the About bio, image slots, hero/intro text, etc.

### Automation (cron-protected)
- `POST /api/cron/weekly-recap` — Friday morning: builds the recap as a **pending-approval draft** and emails you to review. Never auto-sends.
- `POST /api/cron/daily-digest` — daily summary of pending appointments / unread messages / upcoming meetings.

Both require `Authorization: Bearer $CRON_SECRET` (or `?secret=`).

## Local setup

```bash
cp .env.example .env      # fill values (see below)
npm install               # runs prisma generate
npm run db:push           # create the SQLite schema
npm run db:seed           # optional: topics, settings, a welcome post
npm run dev               # http://localhost:3000
```

Checks: `npm run lint` · `npm run typecheck` · `npm run build`.

## Environment variables

See `.env.example`. Summary:

| Group | Vars |
| --- | --- |
| Core | `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `TZ` |
| Auth | `ADMIN_EMAIL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| AI | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| Calendar | `GOOGLE_CALENDAR_ID`, `GOOGLE_REFRESH_TOKEN` |
| Zoom (optional) | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` |
| News (optional) | `NEWS_API_KEY` |
| Cron | `CRON_SECRET` |

The app degrades gracefully: missing OpenAI/SMTP/Calendar/Zoom keys disable only those features (with a clear message) rather than crashing.

### Google setup notes
1. Create an OAuth client (Web) in Google Cloud; add redirect `https://YOURDOMAIN/api/auth/callback/google` (and the localhost equivalent).
2. Set `ADMIN_EMAIL` to your Workspace address — only that account can reach `/admin`.
3. For Calendar, authorize the `calendar.events` scope for the admin account and put the resulting refresh token in `GOOGLE_REFRESH_TOKEN`.
4. For SMTP, use a Google **App Password** (or Workspace SMTP relay) in `SMTP_PASS`.

## The logo

Your original handwritten "by AUDARYA" logo is **never modified**. Drop the file(s) at:

- `public/logo.png` (light backgrounds)
- `public/logo-dark.png` (optional, for dark mode)

`src/components/Logo.tsx` shows a typographic fallback until those files exist.

## Deploy to Fly.io

```bash
fly launch --no-deploy            # or: fly apps create byaudarya
fly volumes create byaudarya_data --size 1 --region sin
fly secrets set NEXTAUTH_SECRET=... GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
  ADMIN_EMAIL=... OPENAI_API_KEY=... SMTP_USER=... SMTP_PASS=... EMAIL_FROM=... \
  GOOGLE_REFRESH_TOKEN=... CRON_SECRET=...   # + any optional keys
fly deploy
```

The DB schema is applied on boot (`prisma db push`) against the mounted volume at `/data`.

### Scheduling the cron jobs
Point any scheduler (Fly Machines cron, GitHub Actions, cron-job.org, etc.) at:
- `https://YOURDOMAIN/api/cron/weekly-recap` — Fridays ~08:00 IST
- `https://YOURDOMAIN/api/cron/daily-digest` — daily ~08:00 IST

with header `Authorization: Bearer $CRON_SECRET`.

## Domain migration
When ready to move `byaudarya.com` off Wix, point DNS to Fly (`fly certs add www.byaudarya.com`) and update `NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL`.

## Security
- Admin is gated by middleware **and** per-request checks; only `ADMIN_EMAIL` passes.
- All stored article/newsletter HTML is sanitized (DOMPurify); all user-supplied text in emails is escaped.
- Newsletter sends are blocked server-side unless explicitly approved.
- No secrets are committed — everything lives in env vars / Fly secrets.
