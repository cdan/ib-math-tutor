import { createClient } from '@supabase/supabase-js';

// WARNING: In production, ensure these env vars are set in Vercel!

// 1. Public Client (For Frontend use - limited permissions via RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// 2. Admin Client (For Backend API routes - Full Access)
// Only use this inside /src/app/api/... never in components!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
