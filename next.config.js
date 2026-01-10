/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev araçlarını tamamen kapat
  devIndicators: false,
  
  // Turbopack config
  turbopack: {},
  
  // React Strict Mode'u kapat
  reactStrictMode: false,
  
  // TypeScript hatalarını göz ardı et
  typescript: {
    ignoreBuildErrors: true,
  }
}

module.exports = nextConfig