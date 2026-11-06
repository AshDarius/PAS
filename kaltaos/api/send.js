import { getRedis } from "../lib/redis.js";
import webpush from "web-push";
import crypto from "node:crypto";

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || "https://ashdarius.github.io";
  const origin = req.headers.origin;
  if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function authorized(req) {
  const expected = process.env.SEND_API_TOKEN || "";
  const supplied = (req.headers.authorization || "").replace(/^Bearer\\s+/i, "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const allowed = process.env.ALLOWED_ORIGIN || "https://ashdarius.github.io";
  if (req.headers.origin && req.headers.origin !== allowed) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  if (!authorized(req)) return res.status(401).json({ error: "Missing or invalid send token." });

  const title = String(req.body?.title || "KALTA").trim().slice(0, 100);
  const body = String(req.body?.body || "").trim().slice(0, 500);
  if (!body) return res.status(400).json({ error: "Enter a message to send." });

  try {
    const redis = getRedis();
    const subscriptions = await redis.hgetall("kalta:push:subscriptions") || {};
    const entries = Object.entries(subscriptions);
    if (!entries.length) {
      return res.status(200).json({ ok: true, sent: 0, failed: 0, message: "No devices are registered yet." });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:ash@ashdarius.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    let sent = 0;
    let failed = 0;
    const stale = [];

    await Promise.all(entries.map(async ([id, raw]) => {
      try {
        const subscription = typeof raw === "string" ? JSON.parse(raw) : raw;
        await webpush.sendNotification(subscription, JSON.stringify({
          title,
          body,
          url: "https://ashdarius.github.io/PAS/kaltaos/"
        }));
        sent += 1;
      } catch (error) {
        failed += 1;
        if (error.statusCode === 404 || error.statusCode === 410) stale.push(id);
        console.error("Push delivery failed:", error.statusCode || error.message);
      }
    }));

    if (stale.length) {
      await Promise.all(stale.map((id) => redis.hdel("kalta:push:subscriptions", id)));
    }

    return res.status(200).json({
      ok: true,
      sent,
      failed,
      removedExpired: stale.length,
      message: sent ? "Notification sent." : "No registered devices could be reached."
    });
  } catch (error) {
    console.error("Send error:", error);
    return res.status(500).json({ error: error.message || "Could not send notification." });
  }
}
