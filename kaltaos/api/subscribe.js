import { getRedis } from "../lib/redis.js";
import crypto from "node:crypto";

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || "https://ashdarius.github.io";
  const origin = req.headers.origin;
  if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const allowed = process.env.ALLOWED_ORIGIN || "https://ashdarius.github.io";
  if (req.headers.origin && req.headers.origin !== allowed) {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  try {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "A valid push subscription is required." });
    }
    if (!subscription.endpoint.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid subscription endpoint." });
    }

    const id = crypto.createHash("sha256").update(subscription.endpoint).digest("hex");
    await getRedis().hset("kalta:push:subscriptions", { [id]: JSON.stringify(subscription) });

    return res.status(200).json({ ok: true, message: "This device is registered for KALTA notifications." });
  } catch (error) {
    console.error("Subscription error:", error);
    return res.status(500).json({ error: error.message || "Could not save subscription." });
  }
}
