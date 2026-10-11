// Mock module for Cloudflare Workers production build to stub out node-only CLI packages
export default {};
export const getPlatformProxy = async () => ({ env: {} });
