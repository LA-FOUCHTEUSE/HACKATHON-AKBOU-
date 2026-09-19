import { test } from "node:test";
import assert from "node:assert/strict";
import { getTier, getTierProgress } from "./tiers";

test("tier boundaries", () => {
  const cases: Array<[number, string]> = [
    [0, "tier.newcomer"],
    [299, "tier.newcomer"],
    [300, "tier.contributor"],
    [799, "tier.contributor"],
    [800, "tier.committed"],
    [1799, "tier.committed"],
    [1800, "tier.champion"],
    [3999, "tier.champion"],
    [4000, "tier.legend"],
    [10000, "tier.legend"],
  ];
  for (const [points, key] of cases) {
    assert.equal(getTier(points).key, key, `points=${points}`);
  }
});

test("tier progress", () => {
  const p = getTierProgress(680);
  assert.equal(p.current.key, "tier.contributor");
  assert.equal(p.next?.key, "tier.committed");
  assert.equal(p.pointsToNext, 120);
  assert.equal(p.percent, 76);

  const top = getTierProgress(4250);
  assert.equal(top.next, null);
  assert.equal(top.percent, 100);
});
