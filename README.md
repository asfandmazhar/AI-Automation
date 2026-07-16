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
