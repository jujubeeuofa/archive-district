/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Default server-action body limit is 1MB. Item/submission photos are
    // now downscaled client-side before they're embedded (see
    // src/components/PhotoUpload.tsx), so a full set of them should stay
    // well under this — this is just a safety margin, not the fix. Kept
    // below Vercel's hard 4.5MB request-body cap for serverless functions,
    // which isn't configurable and would 413 regardless of this setting.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;