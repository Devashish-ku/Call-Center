# Call Center Management System

This is a [Next.js](https://nextjs.org) call center management application with employee dashboards, call logging, and contact management features.

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual values:
   - `TURSO_CONNECTION_URL`: Your Turso database connection URL
   - `TURSO_AUTH_TOKEN`: Your Turso authentication token

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

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

## Features

- Employee dashboard with call controls
- Admin dashboard for user management
- Call logging and history
- Contact management with Excel import
- Real-time call events
- Data sharing between employees

## Security Notes

- Never commit `.env` files with actual credentials
- Use `.env.example` as a template for required environment variables
- Uploaded files are stored in `/uploads` directory (excluded from git)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
