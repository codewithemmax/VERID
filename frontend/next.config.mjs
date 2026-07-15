/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The mock marketplace uses plain <img> tags pointed at a remote placeholder
  // host, so no next/image remote-pattern config is required. Kept minimal on
  // purpose — this is the demo host, not a production storefront.
};

export default nextConfig;
