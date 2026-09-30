# Raghav Texchems - Frontend

Modern React + TypeScript + Vite web application for Raghav Texchems, connected directly to Supabase.

## Features

- **Modern Web Application**: React 19, TypeScript, Vite.
- **Supabase Backend**: Real-time database for products, inquiries, and company settings.
- **Admin Dashboard**: Secure admin portal for managing products, categories, specs, inquiries, and company configurations.
- **Public Catalog**: Filterable chemical product catalog with technical specifications, TDS, and inquiry submission.

## Getting Started Locally

### 1. Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **pnpm**

### 2. Installation

Navigate into the `Frontend` directory and install dependencies:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root of the `Frontend` directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-public-key>
```

> **Note:** The `.env` file is excluded from git commits to protect your configuration.

### 4. Running the Development Server

Start the local Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port indicated in your terminal).

### 5. Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### 6. Linting

Run Oxlint to check code quality:

```bash
npm run lint
```
