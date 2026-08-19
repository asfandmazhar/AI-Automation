<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# Hello World — Frontend + Backend (Production-Structured)

A full-stack "Hello World" demo built with a layered, production-style
architecture on both sides.

## Structure

```
project/
├── backend/                    # Express + MongoDB (Mongoose) API
│   └── src/
│       ├── app.js              # Express app config (middleware, routes)
│       ├── server.js           # Process bootstrap (DB connect, listen, signals)
│       ├── config/              # env.js (validated env vars), db.js (Mongo connection)
│       ├── constants/           # httpStatus.js
│       ├── controllers/         # Thin HTTP layer — greeting.controller.js
│       ├── services/            # Business logic — greeting.service.js
│       ├── models/              # Mongoose schemas — greeting.model.js
│       ├── routes/              # index.js (aggregator) + greeting.routes.js
│       ├── middlewares/         # requestLogger, notFound, errorHandler
│       └── utils/               # ApiError, ApiResponse, asyncHandler, logger
│
└── frontend/                   # Next.js + Tailwind CSS
    ├── app/                     # Routes: layout.tsx, page.tsx
    ├── components/
    │   ├── ui/                  # Generic, reusable — Loader.tsx, ErrorMessage.tsx
    │   └── features/            # Feature components — GreetingCard.tsx
    ├── hooks/                   # useGreeting.ts (data + toast orchestration)
    ├── services/                # greeting.service.ts (API calls only)
    ├── lib/                     # axios.ts (shared HTTP client + interceptors)
    ├── types/                   # greeting.types.ts (shared TS contracts)
    ├── constants/                # api.ts (endpoint paths)
    └── config/                   # env.ts (validated env access)
```

### Design principles applied
- **Layered backend**: routes → controllers (HTTP only) → services (business
  logic) → models (data). Controllers never touch Mongoose directly.
- **Centralized error handling**: `ApiError` + `errorHandler` middleware give
  every error response the same JSON shape; `asyncHandler` removes
  repetitive try/catch from controllers.
- **Consistent response envelope**: `ApiResponse` on the backend matches the
  `ApiResponse<T>` TypeScript type on the frontend.
- **Layered frontend**: services (API calls) → hooks (state/side effects) →
  components (presentation only). Pages compose components; nothing fetches
  data directly from a page or a UI component.
- **Non-blocking DB connection**: the backend starts and serves traffic even
  if MongoDB is unreachable, degrading gracefully to a default greeting.

## Backend setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev              # http://localhost:5000
npm run lint             # eslint src
```
- `GET /api/v1/hello` → `{ success, statusCode, message, data: { message, source } }`
- `GET /health` → liveness check
- MongoDB is optional for this demo — if unreachable, the API logs a
  warning and falls back to a default greeting instead of failing.

## Frontend setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev              # http://localhost:3000
npm run build             # production build + type-check
```

The homepage renders `<GreetingCard />`, which uses the `useGreeting` hook
to call `greeting.service.ts` (Axios), showing a React Hot Toast on
success/failure and the message + Next.js icon on screen.

## Run both together
Start the backend first, then the frontend, then open
`http://localhost:3000`.
>>>>>>> 5a52393aedc916c52e97c8730ce2bb90d8ec9ed8
