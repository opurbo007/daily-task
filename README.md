# 🔥 TaskMaster — Daily Productivity Hub

A modern, production-ready day-to-day task management system built with Next.js 15, TypeScript, Prisma, PostgreSQL, and Telegram integration.

---

## ✨ Features

- **Task Management** — Create, edit, delete tasks with priorities, statuses, tags, and estimated time
- **Drag & Drop** — Reorder tasks with drag-and-drop (@dnd-kit)
- **Daily Dashboard** — Today's tasks, overdue, upcoming, and completed views
- **Focus Mode** — Top 5 high-priority tasks with guided completion flow
- **Analytics** — Charts for daily completion, priority distribution, status breakdown
- **Telegram Alerts** — Daily reminders, overdue alerts, task-due notifications, weekly reports
- **Weekly Reports** — Auto-generated and sent to Telegram every Sunday
- **Streak Counter** — Motivational daily streak tracking
- **Dark/Light Mode** — Smooth theme switching
- **Keyboard Shortcuts** — Power user navigation
- **Quick Add** — Instant task creation without leaving the dashboard
- **Browser Notifications** — Real-time in-app notification system

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local or cloud like Neon, Supabase, Railway)
- npm or pnpm

### 1. Clone and Install

```bash
git clone <your-repo>
cd taskmaster
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
DATABASE_URL=postgresql://user:pass@localhost:5432/taskmaster
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
TELEGRAM_BOT_TOKEN=<your bot token from @BotFather>
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=<any random string>
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:**
- Email: `demo@taskmaster.app`
- Password: `demo1234`

---

## 📁 Project Structure

```
taskmaster/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Login page
│   │   │   └── register/      # Register page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Dashboard layout with sidebar
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── tasks/         # Task list + create + [id] detail
│   │   │   ├── focus/         # Focus Mode (top 5 tasks)
│   │   │   ├── analytics/     # Charts & insights
│   │   │   ├── reports/       # Weekly reports
│   │   │   └── settings/      # User settings + Telegram setup
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth routes + register
│   │   │   ├── tasks/         # CRUD + reorder
│   │   │   ├── tags/          # Tag management
│   │   │   ├── notifications/ # In-app notifications
│   │   │   ├── telegram/      # Telegram connect
│   │   │   ├── settings/      # User settings update
│   │   │   └── cron/          # Cron job trigger endpoint
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx    # Collapsible navigation
│   │   │   └── Header.tsx     # Search, notifications, theme
│   │   ├── dashboard/
│   │   │   ├── StatsOverview  # 4 stat cards
│   │   │   ├── ProgressCard   # Daily completion bar
│   │   │   ├── StreakCard      # Streak counter
│   │   │   └── TaskSection    # Task list sections
│   │   ├── tasks/
│   │   │   ├── TasksClient    # Tasks page with filters + DnD
│   │   │   ├── TaskCard       # Sortable task item
│   │   │   ├── TaskForm       # Create/edit form
│   │   │   ├── QuickAdd       # Inline quick-add
│   │   │   └── FocusModeClient # Focus mode UI
│   │   ├── analytics/
│   │   │   └── AnalyticsClient # Recharts dashboards
│   │   └── shared/
│   │       ├── ThemeProvider
│   │       └── SettingsClient
│   ├── services/
│   │   ├── telegram.ts        # Telegram Bot API service
│   │   └── cron.ts            # Background job functions
│   ├── hooks/
│   │   ├── useTasks.ts        # Task CRUD hook
│   │   ├── useNotifications   # Notification polling
│   │   └── useKeyboardShortcuts
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── auth.ts            # NextAuth config
│   │   └── utils.ts           # Helpers + constants
│   └── types/
│       └── index.ts           # TypeScript interfaces
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🤖 Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot: `/newbot`
3. Copy your bot token to `TELEGRAM_BOT_TOKEN` in `.env`
4. Start your bot by messaging it at least once
5. Get your Chat ID from [@userinfobot](https://t.me/userinfobot)
6. In the app: **Settings → Telegram Integration → Enter Chat ID → Test & Save**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Task |
| `Ctrl+K` | Go to Tasks (search) |
| `Ctrl+F` | Focus Mode |
| `Ctrl+D` | Dashboard |

---

## 🗄️ Database Commands

```bash
npm run db:generate     # Generate Prisma client after schema changes
npm run db:migrate      # Create + run migrations (development)
npm run db:migrate:prod # Apply migrations (production)
npm run db:push         # Push schema without migrations (quick dev)
npm run db:studio       # Open Prisma Studio (GUI)
npm run db:seed         # Seed demo data
```

---

## 🌐 Deploying to Production

### Option A: Vercel + Neon PostgreSQL (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Create free PostgreSQL at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
4. Set all environment variables in Vercel
5. Deploy!

```bash
# After deployment, run migrations
npx prisma migrate deploy
```

### Option B: Railway (Full stack)

1. Create project on [Railway](https://railway.app)
2. Add PostgreSQL plugin
3. Deploy from GitHub
4. Set environment variables
5. Add build command: `npm run db:migrate:prod && npm run build`

### Option C: VPS (Ubuntu)

```bash
# Install dependencies
apt install nodejs npm postgresql nginx

# Clone and setup
git clone <repo> /var/www/taskmaster
cd /var/www/taskmaster
npm install
npm run build

# Setup PostgreSQL
createdb taskmaster
DATABASE_URL=postgresql://... npm run db:migrate:prod

# Run with PM2
npm install -g pm2
pm2 start npm --name taskmaster -- start
pm2 startup
pm2 save
```

### Cron Jobs for VPS

Since Vercel has serverless functions (no persistent cron), on a VPS use the included cron service:

```bash
# The app auto-starts crons via node-cron when running
# Or trigger via HTTP endpoint with your CRON_SECRET:
curl -X POST https://yourdomain.com/api/cron \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"job": "daily-reminder"}'
```

For Vercel, use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) or [cron-job.org](https://cron-job.org).

---

## 🔐 Security Notes

- Change `NEXTAUTH_SECRET` to a strong random value in production
- Set `CRON_SECRET` to secure the cron API endpoint
- Enable HTTPS in production (Vercel handles this automatically)
- Telegram Bot token should never be exposed to clients

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next@15` | Framework with App Router |
| `next-auth@v5` | Authentication (email + Google) |
| `prisma` | Database ORM |
| `@dnd-kit/*` | Drag and drop |
| `recharts` | Analytics charts |
| `node-cron` | Background scheduling |
| `shadcn/ui` | Component library |
| `next-themes` | Dark/light mode |
| `zod` | Schema validation |
| `zustand` | State management |
| `date-fns` | Date utilities |

---

## 🧪 Adding Shadcn UI Components

```bash
npx shadcn@latest init
npx shadcn@latest add button input label select switch toast
npx shadcn@latest add dialog dropdown-menu avatar badge
npx shadcn@latest add progress tooltip separator scroll-area
```

---

Made with ❤️ for productivity nerds.
# daily-task
