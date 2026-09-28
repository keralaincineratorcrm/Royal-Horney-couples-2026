import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeSupabaseUrl(val?: string): string {
  if (!val) return '';
  const cleaned = val.trim().replace(/^["']|["']$/g, '');
  if (!cleaned || cleaned.includes('your-project')) return '';
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  if (cleaned.endsWith('.supabase.co')) {
    return `https://${cleaned}`;
  }
  return '';
}

function isValidSupabaseAnonKey(val?: string): boolean {
  if (!val) return false;
  const cleaned = val.trim().replace(/^["']|["']$/g, '');
  if (cleaned.length < 25) return false;
  if (cleaned.includes('your-anon')) return false;
  if (cleaned.startsWith('sb_secret_')) return false;
  return true;
}

export default defineConfig(({ mode }) => {
  let fileEnv: Record<string, string> = {};
  for (const envFile of ['.env', '.env.local']) {
    if (fs.existsSync(envFile)) {
      try {
        const parsed = dotenv.parse(fs.readFileSync(envFile));
        fileEnv = { ...fileEnv, ...parsed };
      } catch {
        // ignore parse error
      }
    }
  }

  const loaded = loadEnv(mode, process.cwd(), '');

  const candidateUrls = [
    fileEnv.VITE_SUPABASE_URL,
    fileEnv.SUPABASE_URL,
    loaded.VITE_SUPABASE_URL,
    loaded.SUPABASE_URL,
    loaded.NEXT_PUBLIC_SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ];
  const supabaseUrl = candidateUrls.map(normalizeSupabaseUrl).find((u) => Boolean(u)) || '';

  const candidateKeys = [
    fileEnv.VITE_SUPABASE_ANON_KEY,
    fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY,
    fileEnv.SUPABASE_ANON_KEY,
    loaded.VITE_SUPABASE_ANON_KEY,
    loaded.VITE_SUPABASE_PUBLISHABLE_KEY,
    loaded.SUPABASE_ANON_KEY,
    loaded.SUPABASE_PUBLISHABLE_KEY,
    loaded.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ];
  const supabaseAnonKey = (candidateKeys.find(isValidSupabaseAnonKey) || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
