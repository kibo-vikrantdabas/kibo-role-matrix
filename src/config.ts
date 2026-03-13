/**
 * Configuration Module
 * Provides centralized setup for Kibo Commerce SDK configuration and custom middleware.
 * This module initializes the Configuration object with environment variables or defaults,
 * and exports the shared middleware instance used across the application.
 *
 * Environment Variables:
 * - TENANT_ID: Kibo tenant identifier 
 * - SITE_ID: Kibo site identifier (default: "*****")
 * - MASTER_CATALOG: Master catalog ID (default: "*")
 * - CATALOG: Catalog ID (default: "*")
 * - CLIENT_ID: OAuth client ID (default: "*******")
 * - SHARED_SECRET: OAuth shared secret (default: "*********")
 * - PCI_HOST: PCI Host (default: "pmts.mozu.com")
 * - AUTH_HOST: Auth Host (default: "home.mozu.com")
 * - API_ENV: API environment (default: "sandbox")
 *
 * @module config
 * @exports configuration - The global Configuration instance
 * @exports userCustomMiddleware - The shared UserMiddleware instance
 */

import "dotenv/config";
import { Configuration } from "@kibocommerce/rest-sdk";
import { UserMiddleware } from "./user/role/userMiddleware";

/**
 * Create a custom middleware instance for request/response logging and direct HTTP fetches.
 * This is shared across all API clients in the application.
 */
const userCustomMiddleware = new UserMiddleware();

/**
 * Global Kibo Commerce SDK configuration instance.
 * Configured with environment variables or sensible defaults.
 * Includes the custom middleware for request/response interception and logging.
 *
 * @type {Configuration}
 */
export const configuration = new Configuration({
  tenantId: process.env.KIBO_TENANT || process.env.TENANT_ID || "<< to do>>",
  siteId: process.env.KIBO_SITE || process.env.SITE_ID || "**<<to do>>",
  masterCatalog:
    process.env.KIBO_MASTER_CATALOG || process.env.MASTER_CATALOG || "***<<to do>>",
  catalog: process.env.KIBO_CATALOG || process.env.CATALOG || "**<<to do>>",
  clientId:
    process.env.KIBO_CLIENT_ID ||
    process.env.CLIENT_ID ||
    "***<<to do>>",
  sharedSecret:
    process.env.KIBO_SHARED_SECRET ||
    process.env.SHARED_SECRET ||
    "***<<to do>>",
  pciHost:
    process.env.KIBO_PCI_HOST ||
    process.env.PCI_HOST ||
    "pmts.euw1.kibocommerce.com",
  authHost:
    process.env.KIBO_AUTH_HOST ||
    process.env.AUTH_HOST ||
    "home.euw1.kibocommerce.com",
  apiEnv: process.env.KIBO_API_ENV || process.env.API_ENV || "sandbox",
  middleware: [userCustomMiddleware],
});

/** Export the shared middleware instance for use in other modules. */
export { userCustomMiddleware };
