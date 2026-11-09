import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A note's photos travel with its text in one server action. lib/note-images.ts
  // keeps the largest possible save under this, and Vercel refuses anything past 4.5 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};
export default nextConfig;
