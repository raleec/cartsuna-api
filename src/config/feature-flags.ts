import { env } from "./env.js";

export const featureFlags = {
  recommendations: env.FEATURE_RECOMMENDATIONS_ENABLED,
  bluetooth: env.FEATURE_BLUETOOTH_ENABLED,
  adminPortal: env.FEATURE_ADMIN_PORTAL_ENABLED,
};
