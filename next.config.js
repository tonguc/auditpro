/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auditpro-offline.html',
        permanent: false,
      },
    ]
  },
}
module.exports = nextConfig
