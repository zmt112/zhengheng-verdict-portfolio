import assert from "node:assert/strict";
import test from "node:test";

import { demoCases } from "../lib/cases.js";
import { applyCounterfactual, extractCandidateFacts, generateRoleExplanation } from "../lib/trust-explanation.js";

test("同一结论为司机和乘客生成不同但一致的解释", () => {
  const passenger = generateRoleExplanation(demoCases[0], "PASSENGER");
  const driver = generateRoleExplanation(demoCases[0], "DRIVER");
  assert.equal(passenger.gate, driver.gate);
  assert.notEqual(passenger.headline, driver.headline);
  assert.ok(passenger.facts.length > 0);
  assert.match(passenger.privacy, /不披露|不展示/);
});

test("证据不足时双方解释都不得伪造责任结论", () => {
  for (const role of ["PASSENGER", "DRIVER"]) {
    const explanation = generateRoleExplanation(demoCases[1], role);
    assert.equal(explanation.gate, "INSUFFICIENT");
    assert.match(explanation.headline, /不足/);
    assert.equal(explanation.facts.length, 0);
  }
});

test("删除或降质决定性轨迹会使原结论正确退化", () => {
  assert.equal(applyCounterfactual(demoCases[0], "REMOVE_TRACE").result.gate, "INSUFFICIENT");
  assert.equal(applyCounterfactual(demoCases[0], "DEGRADE_TRACE").result.gate, "INSUFFICIENT");
  assert.equal(applyCounterfactual(demoCases[0], "ADD_CONFLICT").result.gate, "EVIDENCE_CONFLICT");
});

test("候选事实整理不把双方陈述直接标为已证实", () => {
  const result = extractCandidateFacts("我到了上车点，等了六分钟，也打过电话。", "我在门口没看到司机。");
  assert.ok(result.candidates.length >= 4);
  assert.ok(result.candidates.every((item) => item.status === "UNVERIFIED"));
  assert.equal(result.mode, "LOCAL_DETERMINISTIC_FALLBACK");
});
