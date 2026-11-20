# Self-Contained Product Catalog & Admin Dashboard

A lightweight, 100% self-contained Next.js (App Router) product catalog with a built-in password-protected admin dashboard, local SQLite storage, local filesystem image uploads with built-in geometric CSS/SVG placeholders, and direct SMTP inquiry delivery via Nodemailer — zero external cloud databases, zero third-party image CDNs, zero paid APIs.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Database:** Local SQLite (`better-sqlite3`) stored in `./data/catalog.db` with automatic schema creation and one-time 4-item placeholder seed data
- **File Uploads & Placeholders:** Local filesystem storage saving validated images (JPG, PNG, WebP, GIF, AVIF up to 5 MB) to `./public/uploads`, paired with bespoke geometric CSS/SVG placeholders whenever no photo is uploaded
- **Authentication:** Single-admin login (`/login`) verifying `ADMIN_PASSWORD` in constant time and issuing a signed HTTP-only JWT cookie via `jose`
- **Email:** Nodemailer configured via standard `SMTP_*` environment variables, delivering product inquiries to `ADMIN_EMAIL` with `replyTo` set to the customer's email address

## Quick Start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Set at least `ADMIN_PASSWORD`, `SESSION_SECRET`, `ADMIN_EMAIL`, and your `SMTP_*` values in `.env.local`.

3. **Start the development server**

   ```bash
   npm run dev
   ```

   On first request, `./data/catalog.db` is created automatically and seeded with 4 sample products using built-in geometric SVG placeholders.

4. **Production build**

   ```bash
   npm run build
   npm start
   ```

## Routes

- `/` — Public storefront with category filter tabs, instant search, availability filter, and Product Detail + Inquiry modal
- `/products/[slug]` — Permanent shareable product page with full description, specifications, and **Inquire About Product** form
- `/login` — Single-admin password sign-in screen
- `/admin` — Protected admin dashboard to add/edit products, upload/remove local images, toggle availability, and delete products
- `/uploads/[filename]` — Streams runtime-uploaded files from `./public/uploads` reliably in both `next dev` and `next start`
