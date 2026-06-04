/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'morcast.caster.fm',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'morcast.caster.fm',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
