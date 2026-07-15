/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "sidibishr-apartment.live" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
