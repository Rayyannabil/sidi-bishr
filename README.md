# شقة سيدي بشر — Sidi Bishr Apartment

> بيت أصحاب، شاي، وذكريات ما تتنسيش.

A private, cozy Arabic-first social clubhouse for 3 members (أعضاء) and the guests (رواد) they invite. Warm, friendly, playful, tea-house cozy — a small private Facebook for friends running an apartment together.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS (RTL) |
| UI Components | shadcn/ui (Radix primitives) |
| Data Fetching | TanStack Query |
| Validation | Zod (at every boundary) |
| Backend | Next.js Route Handlers (API routes) |
| Database | MySQL 8 / MariaDB (utf8mb4, InnoDB) |
| ORM | Prisma 6 with migrations |
| Auth | NextAuth 4 (credentials provider, JWT sessions, bcrypt) |
| Notifications | Short-poll (30s) |

## Prerequisites

- Node.js 18+
- MySQL 8 or MariaDB 10+
- npm or yarn

## Quick Start

### 1. Database Setup

```bash
# Start MariaDB/MySQL
sudo systemctl start mariadb  # or mysqld

# Create database and user
sudo mysql -e "CREATE DATABASE sidi_bishr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'sidibishr'@'localhost' IDENTIFIED BY 'your_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON sidi_bishr.* TO 'sidibishr'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 2. Environment Variables

Copy `.env.example` to `.env` and update:

```bash
DATABASE_URL="mysql://sidibishr:your_password@localhost:3306/sidi_bishr"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Install & Run

```bash
npm install
npx prisma migrate dev    # Create tables
npm run db:seed            # Seed 3 members + sample data
npm run dev                # Start dev server → http://localhost:3000
```

### 4. Login

| Name | Email | Password | Role |
|------|-------|----------|------|
| Rayyan Nabil | rayyan@example.com | password123 | عضو (Member) |
| Youssef Eid | youssef@example.com | password123 | عضو (Member) |
| Steven Gerges | steven@example.com | password123 | عضو (Member) |
| أحمد الضيف | ahmed@example.com | password123 | رائد (Guest) |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database
npm run db:reset     # Reset DB + reseed
npm run db:generate  # Generate Prisma Client
npm run db:studio    # Prisma Studio GUI (http://localhost:5555)
```

## Features

### ✅ Built

1. **Accounts & Auth** — email+password signup/login, role defaults to رائد (Guest), password reset flow, protected routes
2. **Feed** — posts with comments + 7 Facebook-style reactions, pinned posts, permission-gated post box
3. **Comments & Reactions** — threaded replies, 7 reactions (أعجبني · أحببته · أهتم · هاها · واو · حزين · غاضب), one per person per item, re-picking swaps it
4. **Events** — title, date/time, location, cover image, description. Two types: regular hangout + annual «إفطار شقة سيدي بشر». Each event has its own memories album
5. **Memories** — gallery of photos grouped by event, with captions. Everyone views; members upload
6. **Announcements** — member notices, pin + chronological order
7. **Money & Bills** (members only) — recurring bills (gas, electricity, water, internet), 3-way equal split, repayments logged, balance dashboard
8. **Decisions** (members only) — propose, vote yes/no/abstain, configurable threshold (majority, 2/3, unanimous)
9. **Badges (أوسمة)** — member writes badge text and awards to a guest; shows on profile; awarding member can revoke
10. **Notifications** — in-app bell with unread count, notifications for: new post, comment, reply, reaction, event, badge, announcement, bill, decision. Mark-as-read + mark-all-read + notifications page
11. **Admin Panel** (لوحة الأعضاء) — manage users, toggle roles, grant/revoke posting, award badges
12. **Server-side permission enforcement** — all permission rules enforced on the server, not just UI

### 🔲 Remaining

- [ ] Tests (unit + integration)
- [ ] Real file upload (currently URL-based for images)
- [ ] WebSocket real-time notifications (currently short-poll 30s)
- [ ] Password reset email sending (currently returns token in dev mode)
- [ ] Account deletion UI flow
- [ ] Dark mode toggle

## Database Schema

16 models with soft-delete (`deleted_at`) and `created_at` on all content:

```
User → Post, Comment, Reaction, Event, Memory, Announcement,
       Bill, Settlement, Decision, Vote, BadgeAssignment, Notification
```

See `prisma/schema.prisma` for the full schema.

## Permission Rules (Server-Enforced)

| Action | Member (عضو) | Guest (رائد) |
|--------|:---:|:---:|
| View feed/memories/events/announcements | ✅ | ✅ |
| Post in feed | ✅ always | ✅ if granted `canPost` |
| Comment + react | ✅ | ✅ |
| Create events | ✅ | ❌ |
| Upload memories | ✅ | ❌ |
| Create announcements | ✅ | ❌ |
| Manage bills | ✅ | ❌ |
| Propose/vote on decisions | ✅ | ❌ |
| Award/revoke badges | ✅ | ❌ |
| Manage users (admin panel) | ✅ | ❌ |
| Grant/revoke posting | ✅ | ❌ |
| Delete any content | ✅ | own only |

## Project Structure

```
sidi-bishr/
├── prisma/
│   ├── schema.prisma      # Full database schema
│   ├── seed.ts             # Seed script (3 members + sample data)
│   └── migrations/         # Prisma migrations
├── public/
│   └── logo.png            # Brand logo
├── src/
│   ├── app/
│   │   ├── api/            # 30+ API route handlers
│   │   ├── admin/          # لوحة الأعضاء
│   │   ├── announcements/  # إعلانات مهمة
│   │   ├── bills/          # حسابات الشقة
│   │   ├── decisions/      # قرارات الأعضاء
│   │   ├── events/         # مناسبات الشقة
│   │   ├── feed/           # آخر أخبار الشقة
│   │   ├── login/          # نوّرت (auth)
│   │   ├── memories/       # ذكرياتنا
│   │   ├── notifications/  # الإشعارات
│   │   ├── profile/        # بروفايلي
│   │   ├── signup/         # Registration
│   │   ├── layout.tsx      # Root layout (RTL, Cairo font)
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── navbar.tsx      # Navigation with notification bell
│   │   ├── providers.tsx   # Session + QueryClient providers
│   │   └── landing-page.tsx
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config + helpers
│   │   ├── prisma.ts       # Prisma client singleton
│   │   ├── validations.ts  # Zod schemas
│   │   ├── notifications.ts # Notification helpers
│   │   └── utils.ts        # cn, formatEGP, formatArabicDate
│   └── types/
│       └── next-auth.d.ts   # NextAuth type augmentation
├── .env.example
├── .eslintrc.json
├── package.json
└── README.md
```

## License

Private project for شقة سيدي بشر community.
