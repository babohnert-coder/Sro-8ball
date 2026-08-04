import crypto from "node:crypto";
import { RESPONSES } from "./responses.js";
import { chooseResponseIndex, RECENT_LIMIT } from "./rng.js";

let recentResponseIndexes = [];

function secureRandom() {
  return crypto.randomInt(0, 2 ** 32) / 2 ** 32;
}

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  if (req.query?.health !== undefined) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      platform: "vercel",
      responses: RESPONSES.length,
      repeatWindow: RECENT_LIMIT,
      routing: false,
    });
  }

  const selection = chooseResponseIndex(
    RESPONSES.length,
    recentResponseIndexes,
    secureRandom,
  );

  recentResponseIndexes = selection.recent;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).send(RESPONSES[selection.index]);
}
