# ABWA-Douglas Chapter Financial Tracker

Financial approval and tracking system for the ABWA Douglas Chapter. Manage chapter finances with bank statement imports, transaction approval workflows, and expense tracking.

## Features

- **Dashboard** - Financial overview with balance tracking and expense charts
- **Bank CSV Import** - Import transactions directly from bank statements
- **Transaction Approval** - Approval workflow for pending transactions
- **Manual Entries** - Submit reimbursements, expenses, and income
- **Search & Export** - Search transactions and export to CSV

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Recharts (charts)
- Lucide React (icons)

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy (no environment variables needed)

Or use the CLI:

```bash
npm i -g vercel
vercel
```

## Project Structure

```
src/
├── app/
│   ├── globals.css    # Tailwind imports
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main app page
├── components/
│   ├── Dashboard.tsx
│   ├── RequestForm.tsx
│   ├── Sidebar.tsx
│   └── TransactionHistory.tsx
└── types/
    └── index.ts       # TypeScript types
```
