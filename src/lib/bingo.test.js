import test from "node:test";
import assert from "node:assert/strict";
import { createCard, createDrawPool, drawNumber, getLetter, hasBingo } from "./bingo.js";

test("creates a 5x5 card with a free center and no repeated numbers", () => {
  const card = createCard();
  assert.equal(card.length, 5);
  assert.ok(card.every((row) => row.length === 5));
  assert.equal(card[2][2], "★");
  const numbers = card.flat().filter((value) => value !== "★");
  assert.equal(new Set(numbers).size, 24);
  for (let column = 0; column < 5; column += 1) {
    const values = card.map((row) => row[column]).filter((value) => value !== "★");
    assert.ok(values.every((value) => value >= column * 15 + 1 && value <= column * 15 + 15));
  }
});

test("maps the 75-ball ranges to B I N G O", () => {
  assert.equal(getLetter(1), "B");
  assert.equal(getLetter(16), "I");
  assert.equal(getLetter(31), "N");
  assert.equal(getLetter(46), "G");
  assert.equal(getLetter(61), "O");
  assert.equal(getLetter(75), "O");
});

test("draws without repeating and stops when the pool is empty", () => {
  const pool = createDrawPool();
  const results = Array.from({ length: 75 }, () => drawNumber(pool));
  assert.equal(new Set(results).size, 75);
  assert.equal(drawNumber(pool), null);
});

test("validates a completed row and a full card", () => {
  const card = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, "★", 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65]
  ];
  assert.equal(hasBingo(card, [1,16,31,46,61], "line"), true);
  assert.equal(hasBingo(card, [], "full"), false);
  assert.equal(hasBingo(card, card.flat().filter((n) => n !== "★"), "full"), true);
});
