import { DurableObject } from "cloudflare:workers";
import { chooseResponseIndex, RECENT_LIMIT } from "./rng.js";
import { RESPONSES } from "./responses.js";

const HISTORY_KEY = "recentResponseIndexes";

function secureRandom() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] / 2 ** 32;
}

export class RngMachine extends DurableObject {
  draw() {
    const recent = this.ctx.storage.kv.get(HISTORY_KEY) ?? [];
    const selection = chooseResponseIndex(
      RESPONSES.length,
      recent,
      secureRandom,
      RECENT_LIMIT,
    );

    this.ctx.storage.kv.put(HISTORY_KEY, selection.recent);

    return {
      answer: RESPONSES[selection.index],
      responseIndex: selection.index,
      recentCount: selection.recent.length,
    };
  }
}

function plainText(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return plainText("Method not allowed", 405);
    }

    if (url.pathname === "/health") {
      return Response.json(
        {
          ok: true,
          responses: RESPONSES.length,
          repeatWindow: RECENT_LIMIT,
          routing: false,
        },
        {
          headers: {
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          },
        },
      );
    }

    const rng = env.RNG.getByName("sro-global-pool");
    const result = await rng.draw();
    return plainText(result.answer);
  },
};
