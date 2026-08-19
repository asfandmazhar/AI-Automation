# AI-Powered SEO Automation Platform

A full-stack SEO automation platform that leverages artificial intelligence to streamline keyword research, content generation, competitor analysis, and backlink monitoring. Integrates with Google Search Console and Google Analytics for unified website performance tracking.

## Features

- **AI Content Generation** - Generate SEO-optimized content using OpenAI
- **Keyword Research** - AI-enhanced keyword discovery and analysis powered by DataForSEO and OpenAI
- **Competitor Analysis** - AI-driven competitor insights and strategy recommendations
- **Backlink Analysis** - Monitor and analyze backlink profiles with AI intelligence
- **On-Page SEO Analysis** - Per-page SEO auditing and recommendations
- **Off-Page SEO Analysis** - External SEO factor tracking and optimization
- **Google Search Console Integration** - Connect and pull GSC data directly
- **Google Analytics Integration** - Unified GA reporting within the platform
- **Website Management** - Add, configure, and manage multiple websites
- **User Management** - Admin panel with role-based access control
- **API Key Management** - Manage third-party API keys with usage tracking
- **Activity Logs** - Track user and system activity
- **Notifications** - In-app notification system
- **Appearance Settings** - Customizable UI with dark/light theme support
- **Security Settings** - Account security and password management

## Tech Stack

### Frontend

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (icons)
- **next-themes** (dark mode)
- **react-hot-toast** (notifications)
- **Axios** (HTTP client)
- **Jose** (JWT handling)

### Backend

- **Express.js**
- **MongoDB** with Mongoose
- **OpenAI SDK**
- **Google Auth Library** (OAuth 2.0 for GSC/GA)
- **Stripe** (payments)
- **Cloudinary** (image storage)
- **Sharp** (image processing)
- **Multer** (file uploads)
- **bcrypt** (password hashing)
- **jsonwebtoken** (authentication)

## Project Structure

```
AI-Automation-main/
├── frontend/
│   └── app/
│       ├── auth/                  # Authentication page
│       ├── dashboard/
│       │   ├── page.tsx           # Main dashboard
│       │   └── settings/          # User settings
│       ├── ai-system/
│       │   ├── overview/          # AI system overview
│       │   ├── on-page-seo/       # On-page SEO analysis
│       │   │   └── [slug]/        # Per-page analysis
│       │   └── off-page-seo/      # Off-page SEO analysis
│       │       └── [slug]/        # Per-page analysis
│       └── admin/
│           ├── page.tsx           # Admin dashboard
│           ├── users/             # User management
│           ├── websites/          # Website management
│           ├── add-api-keys/      # API key management
│           ├── logs/              # Activity logs
│           └── settings/          # Admin settings
├── backend/
│   ├── server.js                  # Entry point
│   └── routes/
│       ├── auth.routes.js         # Authentication
│       ├── website.routes.js      # Websites + GSC/GA integration
│       ├── keyword.routes.js      # Keyword research
│       ├── content.routes.js      # AI content generation
│       ├── competitor.routes.js   # Competitor analysis
│       ├── backlinks.routes.js    # Backlink analysis
│       ├── apikey.routes.js       # API key management
│       ├── role.routes.js         # Role management
│       ├── service.routes.js      # Service management
│       ├── notification.routes.js # Notifications
│       ├── appearance.routes.js   # Appearance settings
│       ├── security.routes.js     # Security settings
│       └── log.routes.js          # Activity logs
└── README.md
```

## Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

```env
MONGO_URL=
PORT=
SECRET_ACCESS_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_GA_REDIRECT_URI=
```

## Installation

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Cloudinary account
- OpenAI API key
- Google Cloud project with OAuth credentials

### Backend

```bash
cd backend
npm install
```

Create the `.env` file with the variables listed above, then start the server:

```bash
npm start
```

The backend runs on `http://localhost:8000` by default.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default.

## Google Cloud Setup

To enable Google Search Console and Google Analytics integrations:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Search Console API** and **Google Analytics Data API**
4. Configure the **OAuth consent screen** (add your app name, scopes for Search Console and Analytics)
5. Create **OAuth 2.0 Client ID** credentials (Web application type)
6. Add authorized redirect URIs matching your `GOOGLE_REDIRECT_URI` and `GOOGLE_GA_REDIRECT_URI` environment variables
7. Copy the Client ID and Client Secret into your `.env` file
