import assert from "node:assert/strict";
import test from "node:test";

import { buildCaseFromInputs, parseOrderJson, parseTrajectoryCsv, sampleOrder, sampleTrajectoryCsv } from "../lib/case-ingestion.js";
import { proofTemplate } from "../lib/cases.js";
import { evaluateCase } from "../lib/verdict-engine.js";

function buildSample(overrides = {}) {
  const order = structuredClone(sampleOrder);
  Object.assign(order.trip, overrides.trip ?? {});
  if (overrides.contactAttempts) order.contactAttempts = overrides.contactAttempts;
  const trajectory = overrides.trajectory ?? parseTrajectoryCsv(sampleTrajectoryCsv);
  return buildCaseFromInputs({ order, trajectory, createdAt: 1784366400000 });
}

test("完整上传包可解析为可自动判责案件", () => {
  const caseData = buildSample();
  const result = evaluateCase(caseData, proofTemplate);
  assert.equal(caseData.storage, "LOCAL");
  assert.equal(result.gate, "AUTO_DECIDABLE");
  assert.equal(result.outcome.id, "DRIVER_FULFILLED");
  assert.equal(result.coverage, 100);
});

test("轨迹中断时禁止自动判责", () => {
  const trajectory = parseTrajectoryCsv(sampleTrajectoryCsv);
  trajectory[4].timestampMs += 180_000;
  const caseData = buildSample({ trajectory });
  const result = evaluateCase(caseData, proofTemplate);
  assert.equal(result.gate, "INSUFFICIENT");
  assert.equal(result.outcome, null);
});

test("可选图片和录音只登记为辅助证据，不改变必要事实", () => {
  const baseline = buildSample();
  const withAttachments = buildCaseFromInputs({
    order: structuredClone(sampleOrder),
    trajectory: parseTrajectoryCsv(sampleTrajectoryCsv),
    createdAt: 1784366400000,
    files: [
      { id: "FILE-1", evidenceId: "E-UPLOAD-1", name: "chat.png", type: "image/png", size: 100, sha256: "a".repeat(64), role: "ATTACHMENT" },
      { id: "FILE-2", evidenceId: "E-UPLOAD-2", name: "call.wav", type: "audio/wav", size: 200, sha256: "b".repeat(64), role: "ATTACHMENT" },
    ],
  });
  assert.deepEqual(withAttachments.facts, baseline.facts);
  assert.equal(withAttachments.evidence.length, baseline.evidence.length + 2);
  assert.equal(evaluateCase(withAttachments, proofTemplate).gate, "AUTO_DECIDABLE");
});

test("订单 JSON 缺失必填时间时给出明确错误", () => {
  const invalid = structuredClone(sampleOrder);
  delete invalid.trip.cancelAt;
  assert.throws(() => parseOrderJson(JSON.stringify(invalid)), /trip\.cancelAt/);
});

test("轨迹 CSV 缺列时拒绝解析", () => {
  assert.throws(() => parseTrajectoryCsv("timestamp,distance_m\n2026-07-18T14:31:42+08:00,20\n2026-07-18T14:32:42+08:00,20"), /accuracy_m/);
});
