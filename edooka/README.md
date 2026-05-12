## Edooka

Professional skill-assessment and certificate web application for `edooka.in`.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
copy .env.example .env.local
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Commands

```bash
npm run db:generate
npm run db:migrate
npm run seed
```

## Current Scaffold

- Next.js App Router structure for public, flow, and admin routes
- Drizzle schema for users/programs/questions/attempts/purchases/certificates/delivery queue
- Global layout with Edooka navigation and footer
- Business-rule-aligned route stubs and API stubs
- Beginner-friendly comments on all created components and route files

## Notes

- Do not commit `.env.local`
- Keep service keys server-only
- Implement webhook idempotency before enabling production payments
