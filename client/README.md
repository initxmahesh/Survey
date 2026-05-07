# SurveyBuilder

Create surveys, publish/unpublish them, share a public link, and view analytics.

## Features

- **Dashboard**: list surveys + status (draft/active/inactive) and quick actions
- **Inline editor**: edit schema, publish/unpublish, copy public link
- **Public form**: end users can answer via a share link (`/s/:slug`)
- **Analytics**: response insights (protected route)

## Tech

- React, TypeScript, Vite
- Tailwind CSS
- React Router
- Axios for API requests

## Prerequisites

- Node.js 18+ (recommended)
- The backend API running (see `survey-app/server`)

## Environment variables

Create `survey-app/client/.env` if you want to override the API URL:

```bash
VITE_API_URL=http://.....
```

If `VITE_API_URL` is not set:
- **Dev**: defaults to `http://....`
- **Prod**: defaults to `/api` (works with the Vercel setup in `survey-app/vercel.json`)

## Local development

From the monorepo root (`survey-app/`):

```bash
npm install
npm run dev
```

Or run the client only:

```bash
cd client
npm install
npm run dev
```

The app will be available at `http:....`.

## Scripts

From `survey-app/client/`:

- `npm run dev`: start Vite dev server
- `npm run build`: typecheck + production build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

## Route protection & share links

- **Admin routes** (require login):
  - `/builder/:id`
  - `/analytics/:id`
- **Public route** (share this link with end users):
  - `/s/:slug`

Only **active** surveys are accessible from the public route. Draft/inactive surveys show a friendly “You can’t view this form” message.

## Deployment (Vercel)

This repo is configured to deploy the client + API together on Vercel:

- Client: built from `survey-app/client`
- API: served from `/api/*` via `survey-app/api/[...path].ts`

In Vercel, set the backend environment variables (for Production):

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL` (optional; used for CORS)

After deploy, the frontend should call the API at `/api`.
