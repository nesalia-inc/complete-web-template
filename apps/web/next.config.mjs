/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  headers: async () => [
    { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] },
  ],
}

export default nextConfig
