const QUALITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };

function unique(values) {
  return [...new Set(values)];
}

function findFact(caseData, factId) {
  return caseData.facts.find((fact) => fact.id === factId);
}

function usableEvidence(caseData, fact, minimumQuality) {
  const threshold = QUALITY_RANK[minimumQuality] ?? QUALITY_RANK.MEDIUM;
  return fact.evidenceIds
    .map((id) => caseData.evidence.find((item) => item.id === id))
    .filter(Boolean)
    .filter((item) => (QUALITY_RANK[item.quality] ?? 0) >= threshold);
}

function evaluateRequirement(caseData, requirement) {
  const fact = findFact(caseData, requirement.factId);
  if (!fact) {
    return {
      ...requirement,
      met: false,
      reason: "案件缺少该事实命题",
      evidenceIds: [],
    };
  }

  const evidence = usableEvidence(
    caseData,
    fact,
    requirement.minQuality ?? "MEDIUM",
  );
  const statusMatches = fact.status === requirement.status;
  const evidenceIsSufficient = evidence.length > 0;

  return {
    ...requirement,
    actualStatus: fact.status,
    met: statusMatches && evidenceIsSufficient,
    reason: !statusMatches
      ? "事实状态为 " + fact.status
      : !evidenceIsSufficient
        ? "缺少达到 " + requirement.minQuality + " 质量要求的证据"
        : "满足",
    evidenceIds: evidence.map((item) => item.id),
  };
}

function buildDocument(caseData, template, outcome, checks) {
  const factLines = checks.map((check) => {
    const fact = findFact(caseData, check.factId);
    return {
      factId: check.factId,
      statement: fact?.note ?? "未提供事实说明",
      citations: check.evidenceIds,
    };
  });

  return {
    title: "可验证裁决书",
    facts: factLines,
    rule: {
      id: template.id,
      name: template.name,
      version: template.version,
    },
    conclusion: outcome.conclusion,
    action: outcome.action,
  };
}

export function evaluateCase(caseData, template) {
  const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
  const danglingReferences = unique(
    caseData.facts
      .flatMap((fact) => fact.evidenceIds)
      .filter((id) => !evidenceIds.has(id)),
  );
  const conflictedFacts = caseData.facts.filter(
    (fact) => fact.status === "CONFLICTED",
  );
  const outcomeChecks = template.outcomes.map((outcome) => {
    const checks = outcome.requirements.map((requirement) =>
      evaluateRequirement(caseData, requirement),
    );
    return {
      outcome,
      checks,
      matched: checks.every((check) => check.met),
    };
  });

  if (danglingReferences.length > 0) {
    return {
      gate: "INSUFFICIENT",
      gateLabel: "证据不足",
      outcome: null,
      document: null,
      reasons: ["证据账本缺失引用：" + danglingReferences.join("、")],
      outcomeChecks,
      coverage: calculateCoverage(caseData),
    };
  }

  if (conflictedFacts.length > 0) {
    return {
      gate: "EVIDENCE_CONFLICT",
      gateLabel: "证据冲突",
      outcome: null,
      document: null,
      reasons: conflictedFacts.map(
        (fact) => fact.id + " 存在尚未解决的高影响冲突",
      ),
      outcomeChecks,
      coverage: calculateCoverage(caseData),
    };
  }

  const matches = outcomeChecks.filter((item) => item.matched);
  if (matches.length === 1) {
    const selected = matches[0];
    return {
      gate: "AUTO_DECIDABLE",
      gateLabel: "可自动判责",
      outcome: selected.outcome,
      document: buildDocument(
        caseData,
        template,
        selected.outcome,
        selected.checks,
      ),
      reasons: ["所有必要事实均有达到质量要求的证据支持"],
      outcomeChecks,
      coverage: calculateCoverage(caseData),
    };
  }

  if (matches.length > 1) {
    return {
      gate: "EVIDENCE_CONFLICT",
      gateLabel: "规则结论冲突",
      outcome: null,
      document: null,
      reasons: ["同一案件同时满足互斥结论，必须人工复核规则或数据"],
      outcomeChecks,
      coverage: calculateCoverage(caseData),
    };
  }

  const missing = unique(
    outcomeChecks
      .flatMap((item) => item.checks)
      .filter((check) => !check.met)
      .map((check) => check.factId + "：" + check.reason),
  );

  return {
    gate: "INSUFFICIENT",
    gateLabel: "证据不足",
    outcome: null,
    document: null,
    reasons: missing,
    outcomeChecks,
    coverage: calculateCoverage(caseData),
  };
}

export function calculateCoverage(caseData) {
  const known = caseData.facts.filter(
    (fact) =>
      fact.status === "SUPPORTED" || fact.status === "CONTRADICTED",
  ).length;
  return Math.round((known / Math.max(caseData.facts.length, 1)) * 100);
}

export function assertDecisionIsTraceable(result) {
  if (result.gate !== "AUTO_DECIDABLE") return true;
  if (!result.document || !result.outcome) return false;
  return result.document.facts.every(
    (fact) => Array.isArray(fact.citations) && fact.citations.length > 0,
  );
}
