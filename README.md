# Daily Planner

A modern task management application built with Next.js, React, and SQLite. Organize your tasks with lists, labels, priorities, deadlines, and recurring schedules.

## Features

- **Task Management** - Create, edit, delete, and complete tasks
- **Lists & Labels** - Organize tasks into custom lists and apply labels
- **Priority Levels** - Mark tasks as high, medium, or low priority
- **Due Dates & Deadlines** - Schedule tasks and set deadlines with reminders
- **Recurring Tasks** - Support for daily, weekly, monthly, and yearly recurrence
- **Search & Filter** - Find tasks quickly with search and filter options
- **Multiple Views** - Today, Next 7 Days, Upcoming, and All tasks views
- **Dark Mode** - Automatic theme switching based on system preferences
- **Animated UI** - Smooth transitions powered by Framer Motion

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Drizzle ORM
- **Components**: Radix UI (shadcn/ui)
- **Animations**: Framer Motion
- **Runtime**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed on your system

### Installation

```bash
bun install
```

### Database Setup

```bash
# Generate database migrations
bun run db:generate

# Push schema to database
bun run db:push
```

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
bun run build
```

### Production

```bash
bun run start
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard route group
│   │   └── page.tsx       # Main task management page
│   ├── lib/db/            # Database configuration
│   │   ├── index.ts       # Database connection
│   │   └── schema.ts      # Drizzle schema definitions
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── animations/        # Framer Motion wrappers
│   ├── Sidebar.tsx        # Navigation sidebar
│   └── task-details/      # Task detail components
├── hooks/                 # Custom React hooks
├── test/                  # Test files
├── drizzle.config.ts      # Drizzle configuration
└── package.json           # Dependencies
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate database migrations |
| `bun run db:push` | Push schema to database |
| `bun test` | Run tests |

## Database Schema

- **lists** - Task categories/lists with color and emoji
- **labels** - Tags for filtering tasks
- **tasks** - Main task entity with scheduling, priorities, and recurrence
- **taskLabels** - Many-to-many relationship between tasks and labels
- **subtasks** - Hierarchical task breakdowns
- **attachments** - File attachments for tasks
- **taskChanges** - Audit log of task modifications

## License

MIT
