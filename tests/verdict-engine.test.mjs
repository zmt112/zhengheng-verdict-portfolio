import assert from "node:assert/strict";
import test from "node:test";

import { demoCases, proofTemplate } from "../lib/cases.js";
import {
  assertDecisionIsTraceable,
  evaluateCase,
} from "../lib/verdict-engine.js";

function clone(value) {
  return structuredClone(value);
}

test("金标案件的门控状态与预期完全一致", () => {
  for (const caseData of demoCases) {
    const result = evaluateCase(caseData, proofTemplate);
    assert.equal(result.gate, caseData.expected.gate, caseData.id);
    assert.equal(
      result.outcome?.id ?? null,
      caseData.expected.outcomeId,
      caseData.id,
    );
  }
});

test("所有自动判责结果都具有逐事实证据引用", () => {
  for (const caseData of demoCases) {
    const result = evaluateCase(caseData, proofTemplate);
    assert.equal(assertDecisionIsTraceable(result), true, caseData.id);
  }
});

test("未知事实不得被当作反驳事实，也不得自动判责", () => {
  const incomplete = demoCases.find((item) => item.id === "CASE-002");
  const result = evaluateCase(incomplete, proofTemplate);
  assert.equal(result.gate, "INSUFFICIENT");
  assert.equal(result.outcome, null);
});

test("高影响证据冲突必须升级复核", () => {
  const conflicted = demoCases.find((item) => item.id === "CASE-003");
  const result = evaluateCase(conflicted, proofTemplate);
  assert.equal(result.gate, "EVIDENCE_CONFLICT");
  assert.equal(result.outcome, null);
});

test("删除决定性证据后，原自动判责案件必须降级", () => {
  const mutated = clone(demoCases.find((item) => item.id === "CASE-001"));
  mutated.evidence = mutated.evidence.filter((item) => item.id !== "E01");
  const result = evaluateCase(mutated, proofTemplate);
  assert.notEqual(result.gate, "AUTO_DECIDABLE");
  assert.equal(result.outcome, null);
});

test("降低决定性证据质量后，原自动判责案件必须降级", () => {
  const mutated = clone(demoCases.find((item) => item.id === "CASE-004"));
  mutated.evidence.find((item) => item.id === "E31").quality = "LOW";
  const result = evaluateCase(mutated, proofTemplate);
  assert.notEqual(result.gate, "AUTO_DECIDABLE");
});

test("相同输入重复运行一百次，输出必须完全一致", () => {
  const caseData = demoCases[0];
  const baseline = JSON.stringify(evaluateCase(caseData, proofTemplate));
  for (let index = 0; index < 100; index += 1) {
    assert.equal(
      JSON.stringify(evaluateCase(caseData, proofTemplate)),
      baseline,
    );
  }
});

test("裁决书只使用证明模板中登记的规则版本", () => {
  for (const caseData of demoCases) {
    const result = evaluateCase(caseData, proofTemplate);
    if (result.document) {
      assert.equal(result.document.rule.id, proofTemplate.id);
      assert.equal(result.document.rule.version, proofTemplate.version);
    }
  }
});

test("结果中禁止出现无业务依据的责任百分比", () => {
  for (const caseData of demoCases) {
    const serialized = JSON.stringify(evaluateCase(caseData, proofTemplate));
    assert.doesNotMatch(serialized, /责任.{0,4}\d+%/);
  }
});
