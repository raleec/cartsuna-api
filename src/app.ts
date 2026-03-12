import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";

import authPlugin from "./plugins/auth.js";
import errorHandlerPlugin from "./plugins/error-handler.js";

import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import customersRoutes from "./routes/customers.js";
import merchantsRoutes from "./routes/merchants.js";
import merchantStorefrontRoutes from "./routes/merchantStorefront.js";
import merchantInvitesRoutes from "./routes/merchantInvites.js";
import itemsRoutes from "./routes/items.js";
import itemAvailabilityRoutes from "./routes/itemAvailability.js";
import inventoryRoutes from "./routes/inventory.js";
import ordersRoutes from "./routes/orders.js";
import requestsRoutes from "./routes/requests.js";
import eventsRoutes from "./routes/events.js";
import reviewsRoutes from "./routes/reviews.js";
import favoritesRoutes from "./routes/favorites.js";
import punchcardsRoutes from "./routes/punchcards.js";
import bidsRoutes from "./routes/bids.js";
import searchRoutes from "./routes/search.js";
import profileRoutes from "./routes/profile.js";
import recommendationsRoutes from "./routes/recommendations.js";
import bluetoothRoutes from "./routes/bluetooth.js";
import adminTierConfigRoutes from "./routes/admin/tierConfig.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(rateLimit, { global: false });
  await app.register(authPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(customersRoutes, { prefix: "/customers" });
  await app.register(merchantsRoutes, { prefix: "/merchants" });
  await app.register(merchantStorefrontRoutes, { prefix: "/merchants" });
  await app.register(merchantInvitesRoutes, { prefix: "/merchants" });
  await app.register(itemsRoutes, { prefix: "/items" });
  await app.register(itemAvailabilityRoutes, { prefix: "/items" });
  await app.register(inventoryRoutes, { prefix: "/inventory" });
  await app.register(ordersRoutes, { prefix: "/orders" });
  await app.register(requestsRoutes, { prefix: "/requests" });
  await app.register(eventsRoutes, { prefix: "/events" });
  await app.register(reviewsRoutes, { prefix: "/reviews" });
  await app.register(favoritesRoutes, { prefix: "/favorites" });
  await app.register(punchcardsRoutes, { prefix: "/punchcards" });
  await app.register(bidsRoutes, { prefix: "/bids" });
  await app.register(searchRoutes);
  await app.register(profileRoutes);
  await app.register(recommendationsRoutes);
  await app.register(bluetoothRoutes);
  await app.register(adminTierConfigRoutes, { prefix: "/admin" });

  return app;
}
