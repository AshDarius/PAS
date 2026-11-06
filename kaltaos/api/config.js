function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN || "https://ashdarius.github.io";
  const origin = req.headers.origin;
  if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return res.status(503).json({ error: "Push service is not configured yet." });

  return res.status(200).json({ publicKey });
}
