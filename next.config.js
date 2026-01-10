/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // dev'de kapalı
  register: true,
  skipWaiting: true
});

const nextConfig = {
  // Dev araçlarını tamamen kapat
  devIndicators: false,

  // Turbopack config
  turbopack: {},

  // React Strict Mode kapalı
  reactStrictMode: false,

  // TypeScript hatalarını göz ardı et
  typescript: {
    ignoreBuildErrors: true,
  },

  // Gereksiz source map üretme (performans)
  productionBrowserSourceMaps: false,
};

module.exports = withPWA(nextConfig);
