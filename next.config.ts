import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // firebase-admin es un paquete de Node: nunca debe entrar al bundle del cliente.
  serverExternalPackages: ['firebase-admin'],
  typescript: {
    // Un error de tipos rompe el build. Es intencional.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
