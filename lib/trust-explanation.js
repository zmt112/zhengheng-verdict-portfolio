import { proofTemplate } from "./cases.js";
import { evaluateCase } from "./verdict-engine.js";

const factLabels = Object.fromEntries(proofTemplate.factDefinitions.map((fact) => [fact.id, fact.label]));

function publicFactText(fact) {
  const label = factLabels[fact.id] ?? fact.id;
  if (fact.id === "F_GEOFENCE") return fact.status === "CONTRADICTED" ? "平台记录未显示车辆进入指定上车范围" : "平台记录显示车辆进入指定上车范围";
  if (fact.id === "F_DWELL") return fact.status === "SUPPORTED" ? "车辆在指定范围内达到规则要求的等待时长" : "现有记录不能证明达到规则要求的等待时长";
  if (fact.id === "F_CONTACT") return fact.status === "SUPPORTED" ? "取消前存在平台联系记录（未使用通话内容）" : "取消前的必要联系尚未得到证明";
  if (fact.id === "F_CANCEL_TIME") return fact.status === "SUPPORTED" ? "取消发生在规则等待时间之后" : "取消时间未满足规则要求";
  return `${label}：${fact.status === "SUPPORTED" ? "已由平台记录支持" : "尚未得到充分支持"}`;
}

function decisiveFacts(caseData, result) {
  if (!result.outcome) return [];
  const matched = result.outcomeChecks.find((item) => item.matched);
  return (matched?.checks ?? []).map((check) => {
    const fact = caseData.facts.find((item) => item.id === check.factId);
    return {
      factId: check.factId,
      label: factLabels[check.factId] ?? check.factId,
      summary: publicFactText(fact ?? { id: check.factId, status: "UNKNOWN" }),
      evidenceCount: check.evidenceIds.length,
    };
  });
}

export function generateRoleExplanation(caseData, role) {
  const result = evaluateCase(caseData, proofTemplate);
  const isPassenger = role === "PASSENGER";

  if (result.gate !== "AUTO_DECIDABLE" || !result.outcome) {
    return {
      role,
      gate: result.gate,
      statusLabel: result.gateLabel,
      headline: "现有证据不足以作出确定责任结论",
      summary: isPassenger
        ? "我们不会因为司机单方面陈述就维持收费。案件需要补充证据或进入人工复核。"
        : "我们不会因为乘客单方面陈述就认定你未履约。案件需要补充证据或进入人工复核。",
      facts: [],
      care: "你的陈述已被记录，但陈述本身不会替代可验证证据。",
      appeal: result.gate === "EVIDENCE_CONFLICT"
        ? "平台记录之间存在冲突，无需重复提交相同材料；案件将由人工核对原始数据。"
        : "可补充关键时间段的位置记录、订单内联系记录或其他能够证明到达与等待的材料。",
      privacy: "对外解释不会展示另一方完整轨迹、精确位置或通话内容。",
    };
  }

  const driverFulfilled = result.outcome.id === "DRIVER_FULFILLED";
  if (isPassenger) {
    return {
      role,
      gate: result.gate,
      statusLabel: "处理结果已生成",
      headline: driverFulfilled ? "本次取消费处理维持" : "本次取消费不向你收取",
      summary: driverFulfilled
        ? "平台记录支持司机已进入指定范围、完成等待和必要联系，因此不支持“司机未到达”的主张。"
        : "连续平台记录不支持司机进入指定上车范围，因此本次不认定司机完成到达义务。",
      facts: decisiveFacts(caseData, result),
      care: "没有见到车辆可能仍是真实体验。入口指引、定位偏差等问题会与责任判断分别处理。",
      appeal: driverFulfilled
        ? "若你能提供司机在关键等待时段位于其他位置的材料，可以申请再次复核。"
        : "若收费状态未及时更新，可凭本案件编号联系客服核查，不需要重复证明相同事实。",
      privacy: "仅展示决定性证据摘要，不披露司机完整轨迹和双方通话内容。",
    };
  }

  return {
    role,
    gate: result.gate,
    statusLabel: "处理结果已生成",
    headline: driverFulfilled ? "本次到达与等待义务已获支持" : "现有证据不支持你已完成到达义务",
    summary: driverFulfilled
      ? "连续平台记录支持你按规则到达、等待并联系乘客。"
      : "关键时间段的连续记录显示车辆未进入指定范围，联系行为不能替代到达义务。",
    facts: decisiveFacts(caseData, result),
    care: driverFulfilled ? "乘客的入口体验问题会单独治理，不影响本次履约认定。" : "这不是依据乘客单方面陈述作出的结论，而是依据连续平台记录。",
    appeal: driverFulfilled
      ? "如后续处置与本结果不一致，可使用案件编号申请核查。"
      : "若定位记录存在设备异常，可提交同一时间段的原始定位或平台故障凭证申请复核。",
    privacy: "仅展示判责所需的平台事实，不向另一方披露你的完整行动轨迹。",
  };
}

export const counterfactualOptions = [
  { id: "ORIGINAL", label: "原始证据", description: "保持案件快照不变" },
  { id: "REMOVE_TRACE", label: "删除连续轨迹", description: "模拟关键证据缺失" },
  { id: "DEGRADE_TRACE", label: "降低轨迹质量", description: "模拟定位质量不达标" },
  { id: "ADD_CONFLICT", label: "加入位置冲突", description: "模拟事件与轨迹矛盾" },
];

export function applyCounterfactual(caseData, mutationId) {
  const mutated = structuredClone(caseData);
  if (mutationId === "REMOVE_TRACE") {
    mutated.evidence = mutated.evidence.filter((item) => item.id !== "E-TRAJECTORY" && item.id !== "E01" && item.id !== "E31");
  }
  if (mutationId === "DEGRADE_TRACE") {
    for (const evidence of mutated.evidence) {
      if (evidence.id === "E-TRAJECTORY" || evidence.id === "E01" || evidence.id === "E31") evidence.quality = "LOW";
    }
  }
  if (mutationId === "ADD_CONFLICT") {
    const fact = mutated.facts.find((item) => item.id === "F_GEOFENCE");
    if (fact) fact.status = "CONFLICTED";
    mutated.evidence.push({ id: "E-SIM-CONFLICT", time: "反事实", title: "模拟冲突定位", summary: "新增一条与原轨迹矛盾的位置记录。", source: "反事实实验室", quality: "HIGH" });
  }
  return { caseData: mutated, result: evaluateCase(mutated, proofTemplate), mutationId };
}

export function extractCandidateFacts(driverText, passengerText) {
  const candidates = [];
  const add = (factId, source, quote, signal) => {
    if (!candidates.some((item) => item.factId === factId && item.source === source && item.signal === signal)) {
      candidates.push({ id: `C-${candidates.length + 1}`, factId, label: factLabels[factId], source, quote, signal, status: "UNVERIFIED" });
    }
  };
  if (/到达|到了|上车点/.test(driverText)) add("F_GEOFENCE", "DRIVER", driverText, "声称已到达");
  if (/等了|等待|分钟/.test(driverText)) add("F_DWELL", "DRIVER", driverText, "声称完成等待");
  if (/电话|联系|打过/.test(driverText)) add("F_CONTACT", "DRIVER", driverText, "声称已联系");
  if (/没看到|未看到|没到|不在/.test(passengerText)) add("F_GEOFENCE", "PASSENGER", passengerText, "质疑司机到达");
  if (/入口|门口|位置|定位/.test(passengerText)) add("F_GEOFENCE", "PASSENGER", passengerText, "可能存在位置理解差异");
  return {
    mode: "LOCAL_DETERMINISTIC_FALLBACK",
    candidates,
    warning: "候选事实仅用于组织调查方向，必须由平台证据验证后才能进入责任计算。",
  };
}

