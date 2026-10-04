import { resolve } from "node:path";
import { config } from "dotenv";

/**
 * Loads the repository's ignored local environment file for local API runs.
 *
 * Deployment environments provide their configuration through real environment
 * variables, which dotenv does not overwrite by default.
 */
if (process.env.NODE_ENV?.trim().toLowerCase() !== "production") {
  config({
    path: [
      resolve(process.cwd(), ".env.local"),
      resolve(process.cwd(), "../../.env.local"),
    ],
    quiet: true,
  });
}
