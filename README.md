# DCNI Pastor Registration Portal

A responsive, multi-step registration portal for the Discipleship Christian Network International Pastoral Forum. The form preserves the original membership renewal questions and expands them with personal, contact, church, ministry, DCNI membership, and declaration details.

## Technology

- Next.js App Router, React, TypeScript
- Tailwind CSS 4 with responsive custom styles
- React Hook Form and Zod validation
- jsPDF and Sharp for compact, printable A4 PDF documents
- Resend HTTP API for email delivery
- WhatsApp Cloud API for document delivery

## Install and run

Use a current supported Node.js release and npm:

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Then open http://localhost:3000. The form intentionally does not autosave; closing or refreshing the page clears in-progress answers.

## Logo

The supplied DCNI emblem is included. To replace it with a higher quality official asset, place the official logo here:

`public/images/dcni-logo.png`

The interface and generated PDF use `/images/dcni-logo.png`. If no logo is present, the portal falls back to DCNI initials and the PDF still generates.

## Environment variables

Copy `.env.example` to `.env.local` and configure the following server-only settings:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend transactional email API key |
| `EMAIL_FROM` | Verified sender address, e.g. `DCNI Registration <registrations@example.org>` |
| `REGISTRAR_EMAIL` | Destination inbox for registrations |
| `REGISTRAR_NAME` | Registrar name shown on the PDF |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |
| `WHATSAPP_RECIPIENT_NUMBERS` | Comma-separated registrar destination numbers in international format; each receives the registration PDF |
| `WHATSAPP_GRAPH_API_VERSION` | Graph API version (example: `v26.0`); update it when Meta retires a version |
| `DCNI_ORGANIZATION_NAME` | Organization name (default shown in the interface) |
| `DCNI_FORUM_NAME` | Forum name (default Pastoral Forum) |
| `DCNI_EMAIL` | Optional organization contact displayed on the PDF footer |
| `DCNI_PHONE` | Optional organization telephone displayed on the PDF footer |
| `DCNI_WEBSITE` | Optional organization website |
| `DCNI_ADDRESS` | Optional organization address |

Never prefix secrets with `NEXT_PUBLIC_`. `.env.local` is ignored by Git. Email requires a Resend account, an API key, a verified sending domain/address, and a configured sender. WhatsApp requires a Meta Business account, a WhatsApp Business phone number, a Cloud API access token with media/message permissions, the phone number ID, and a recipient number that the account is permitted to message. Check the current Meta messaging rules and template requirements for your account before production use.

When credentials are missing, PDF generation remains available and the result screen identifies delivery as “Not configured.” The application never reports those destinations as sent.

## PDF and submission flow

The review page creates a local A4 PDF preview. Submission sends the validated form to `app/api/submit/route.ts`; the route validates again, generates a fresh official PDF and registration ID, then sends the PDF attachment via Resend and uploads/sends it as a WhatsApp document via the Cloud API. Provider acceptance is reflected in the result; a provider API acceptance response does not independently prove final inbox or WhatsApp delivery. Failed and unconfigured channels are displayed individually. No submitted registration is stored in a database or written to local storage, cookies, or a registration history.

## Vercel deployment

1. Push this project to a Git provider and import it into Vercel.
2. Set all required environment variables under the production environment in Vercel.
3. Deploy and verify the email sender/domain and WhatsApp account configuration.
4. Submit a controlled sample registration and confirm the PDF layout and receipt at each configured destination.

The route uses a Node.js runtime because PDF generation and attachment delivery run server-side. Vercel function duration and request limits depend on the selected plan. The API rejects request bodies over 1.5 MB to keep signature uploads bounded.

## Security and privacy

- No registration database, permanent registration list, autosave, analytics payload, or registration information in URLs is implemented.
- The API validates fields server-side, limits request size, avoids logging registration data, and keeps provider credentials on the server.
- Submitted values and signatures are temporarily held in browser/server memory while generating and transmitting the PDF. Email/WhatsApp providers may process or retain messages under their own policies. Network infrastructure and hosting providers can also process request metadata; configure and review those services for your organization's privacy requirements.
- This is not a promise that transient data is never present in infrastructure buffers or provider systems. Do not enable request-body logging or add analytics that capture form values.

## Test the registration flow

1. Run `npm run dev` and start from the welcome page.
2. Complete the required personal, contact, and church fields; use conditional answers to reveal membership and ordination questions.
3. Complete the declaration, draw and save a signature, then review the sections.
4. Use **Preview Registration PDF** and check the printable pages.
5. Confirm the review checkbox and submit. With empty credentials, expect PDF download/view controls plus “Not configured” statuses and no claim of delivery.
6. After configuring providers, submit a controlled test and check that the receiving registrar gets the PDF attachment/document.

## Project structure

- `app/page.tsx` — welcome, multi-step form, review and success states
- `app/api/submit/route.ts` — server validation, PDF generation, email and WhatsApp delivery
- `lib/validation.ts` — shared Zod schema
- `lib/pdf.ts` — printable A4 registration PDF
- `public/images/dcni-logo.png` — supplied emblem
