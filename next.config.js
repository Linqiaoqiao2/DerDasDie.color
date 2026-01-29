/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure better-sqlite3 works in server-side
  serverComponentsExternalPackages: ['better-sqlite3'],
}

module.exports = nextConfig

