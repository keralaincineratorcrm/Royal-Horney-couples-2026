# Netlify Deployment Guide — Kerala Incinerator Sales CRM

This project is a **React + Vite + TypeScript** Single Page Application (SPA) powered by **Supabase Authentication** and **Supabase PostgreSQL Database**. It runs entirely as a static frontend on Netlify with Supabase as the online backend.

---

## 1. Netlify Build Settings

The repository includes `netlify.toml`, which automatically configures Netlify with the following settings:

* **Base directory:** *(leave empty)*
* **Build command:** `npm run build`
* **Publish directory:** `dist`

> **Important (Preventing `application/octet-stream` Blank Screen Error):**
> In **Netlify Dashboard → Site configuration → Build & deploy → Build settings**, make sure **Publish directory** is set to `dist` (not blank or `/`). If Netlify publishes the repository root instead of `dist`, it serves the uncompiled `/index.html` referencing `/src/main.tsx`, which Netlify serves with MIME type `application/octet-stream`.

---

## 2. Required Netlify Environment Variables

Before triggering a production deployment on Netlify, go to:
**Netlify Dashboard → Site configuration → Environment variables → Add a variable** and add the following two variables:

| Variable Name | Value Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project URL (e.g., `https://your-project-id.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public `anon` / `publishable` key (from **Supabase Dashboard → Project Settings → API**) |

### Security Notice
* **Never** add or expose your Supabase `service_role` or `sb_secret_` key in Netlify frontend environment variables.
* Only use the public `anon` / `publishable` key (`VITE_SUPABASE_ANON_KEY`).

---

## 3. Supabase Configuration Checklist

1. **Database Schema & Security Policies**:
   * In **Supabase Dashboard → SQL Editor**, ensure `supabase-schema.sql` and `supabase-security-hardening-migration.sql` have been executed.
2. **Site URL & Redirect URLs**:
   * In **Supabase Dashboard → Authentication → URL Configuration**:
     * Set **Site URL** to your Netlify production URL (e.g., `https://your-site-name.netlify.app`).
     * Add `https://your-site-name.netlify.app/**` under **Redirect URLs** (used for password reset links).
3. **Owner & Staff Accounts**:
   * **Owner (`role = 'owner'`)**: Has full access to all CRM modules, including **Settings** and **Team & Staff** management.
   * **Staff (`role = 'sales_executive'` / `'senior_sales_executive'`)**: Has access only to allowed operational CRM modules and cannot access Owner-only Settings or Team/Staff management.

---

## 4. Local Development & Verification

```bash
npm install
npm run lint
npm run build
npm run dev
```
