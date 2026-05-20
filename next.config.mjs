/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Types will be validated once Supabase CLI generates the real DB types
    // Run: npx supabase gen types typescript --local > lib/database.types.ts
    ignoreBuildErrors: true,
  },
  // All pages use Supabase auth so they must be dynamic (no static prerender)
  experimental: {
    dynamicIO: false,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
