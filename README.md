# CBSai Public Website

The public marketing site for CBSai, deployed at `www.cbsai.co`. The product application intentionally remains on the separate `cbsai.co` domain.

## Local development

```bash
npm install
npm run dev
npm run build
```

The site is a Vite static site with multiple HTML routes. The lead endpoint lives in `api/leads.ts` and is deployed by Vercel as a serverless function.

## Lead delivery

The demo and newsletter forms submit to `/api/leads`. They never show a success message unless at least one real delivery destination returns successfully. Configure these variables in the Vercel project settings:

- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to deliver lead notifications to the fixed recipient `marketing@cbsai.co` (verify the sender domain with Resend first); and
- optionally `LEAD_WEBHOOK_URL` to send a secondary lead record to a first-party CRM/workflow webhook.

See `.env.example` for the variable names. Keep the values in Vercel environment settings and never commit secrets.

## Public routes

- `/` — marketing homepage
- `/platform.html` — platform and connected domains
- `/industries.html` — operating fit and adoption path
- `/security.html` — security and governance approach
- `/resources.html` — evaluation resources
- `/privacy.html` — public website privacy policy
- `/terms.html` — website terms of use
- `/applicant-privacy.html` — applicant privacy information
