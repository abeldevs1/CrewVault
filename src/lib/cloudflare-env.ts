import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "./db";
import type { R2Bucket } from "./storage";

export interface CloudflareBindings {
  DB: D1Database;
  STORAGE?: R2Bucket;
  ASSETS?: any;
}

let localProxyPromise: Promise<CloudflareBindings> | null = null;

/**
 * Resolves Cloudflare bindings in both production (Workers runtime)
 * and local development (Wrangler / Miniflare persistence).
 */
export async function getCloudflareBindings(): Promise<CloudflareBindings> {
  // 1. Try standard Cloudflare Workers context (production or OpenNext-instrumented runtime)
  try {
    const ctx = await getCloudflareContext({ async: true });
    if (ctx?.env && (ctx.env as any).DB) {
      return ctx.env as unknown as CloudflareBindings;
    }
  } catch {
    // Falls through to development proxy fallback
  }

  // 2. Return cached global binding if present
  if ((globalThis as any).__CF_BINDINGS__?.DB) {
    return (globalThis as any).__CF_BINDINGS__;
  }

  // 3. Fallback for local development, test runners, and seed scripts using persistent Wrangler state
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    if (!localProxyPromise) {
      localProxyPromise = (async () => {
        try {
          const path = await import("path");
          const cwd = process.cwd();
          process.env.XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME || path.join(cwd, ".config");
          process.env.WRANGLER_LOG_PATH = process.env.WRANGLER_LOG_PATH || path.join(cwd, ".wrangler/logs");

          const modName = "wrangler";
          const wranglerMod = await import(/* webpackIgnore: true */ modName);
          const proxy = await wranglerMod.getPlatformProxy({
            configPath: "wrangler.jsonc",
            persist: { path: ".wrangler/state/v3" },
          });

          const bindings: CloudflareBindings = {
            DB: proxy.env.DB as D1Database,
            STORAGE: proxy.env.STORAGE as R2Bucket,
            ASSETS: proxy.env.ASSETS,
          };

          (globalThis as any).__CF_BINDINGS__ = bindings;
          return bindings;
        } catch {
          return null as any;
        }
      })();
    }

    const bindings = await localProxyPromise;
    if (bindings?.DB) {
      return bindings;
    }
  }

  throw new Error("Cloudflare D1 Database binding 'DB' not found in environment.");
}
