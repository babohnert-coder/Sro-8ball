import assert from "node:assert/strict";
import test from "node:test";
import { chooseResponseIndex, RECENT_LIMIT } from "../src/rng.js";
import { RESPONSES } from "../src/responses.js";

function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

test("the final response pool contains 183 unique responses", () => {
  assert.equal(RESPONSES.length, 183);
  assert.equal(new Set(RESPONSES).size, 183);
});

test("a response never appears inside the configured repeat window", () => {
  const random = seededRandom(8_012_026);
  let recent = [];

  for (let draw = 0; draw < 20_000; draw += 1) {
    const selection = chooseResponseIndex(RESPONSES.length, recent, random);
    assert.equal(recent.includes(selection.index), false, `repeat on draw ${draw}`);
    recent = selection.recent;
    assert.equal(recent.length <= RECENT_LIMIT, true);
  }
});

test("a response becomes eligible after the configured repeat window", () => {
  let recent = [];

  for (let draw = 0; draw < RECENT_LIMIT + 2; draw += 1) {
    const selection = chooseResponseIndex(RESPONSES.length, recent, () => 0);
    recent = selection.recent;

    if (draw < RECENT_LIMIT + 1) {
      assert.equal(selection.index, draw);
    } else {
      assert.equal(selection.index, 0);
    }
  }
});

test("stale or malformed history cannot poison selection", () => {
  const selection = chooseResponseIndex(30, [-1, 3, 3, 999, "4", 7], () => 0);
  assert.equal(selection.index, 0);
  assert.deepEqual(selection.recent, [3, 7, 0]);
});

test("the pool contains no runtime routing placeholders", () => {
  for (const response of RESPONSES) {
    assert.equal(response.includes("@{user}"), false);
  }
});
