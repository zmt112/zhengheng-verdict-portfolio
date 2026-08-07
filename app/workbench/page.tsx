"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { demoCases, proofTemplate } from "@/lib/cases";
import { evaluateCase } from "@/lib/verdict-engine";

const statusMeta = {
  SUPPORTED: { label: "已证明", tone: "success" },
  CONTRADICTED: { label: "已反驳", tone: "danger" },
  UNKNOWN: { label: "待补充", tone: "muted" },
  CONFLICTED: { label: "有冲突", tone: "warning" },
};

const gateMeta = {
  AUTO_DECIDABLE: { label: "可自动判责", tone: "success" },
  INSUFFICIENT: { label: "证据不足", tone: "muted" },
  EVIDENCE_CONFLICT: { label: "证据冲突", tone: "warning" },
};

const tabs = [
  { id: "overview", label: "研判概览" },
  { id: "evidence", label: "全部证据" },
  { id: "rules", label: "规则校验" },
  { id: "audit", label: "操作记录" },
];

function getCaseResult(caseData: (typeof demoCases)[number]) {
  return evaluateCase(caseData, proofTemplate);
}

function formatCaseStatus(caseData: (typeof demoCases)[number]) {
  const result = getCaseResult(caseData);
  return gateMeta[result.gate as keyof typeof gateMeta] ?? gateMeta.INSUFFICIENT;
}

export default function WorkbenchPage() {
  const [activeCaseId, setActiveCaseId] = useState(demoCases[0].id);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeEvidenceId, setActiveEvidenceId] = useState(
    demoCases[0].evidence[0].id,
  );
  const [notice, setNotice] = useState("");

  const currentCase =
    demoCases.find((caseData) => caseData.id === activeCaseId) ?? demoCases[0];
  const result = useMemo(
    () => evaluateCase(currentCase, proofTemplate),
    [currentCase],
  );
  const currentGate =
    gateMeta[result.gate as keyof typeof gateMeta] ?? gateMeta.INSUFFICIENT;
  const activeEvidence =
    currentCase.evidence.find((item) => item.id === activeEvidenceId) ??
    currentCase.evidence[0];

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const element = event.target as HTMLElement | null;
      if (
        element?.tagName === "INPUT" ||
        element?.tagName === "TEXTAREA" ||
        element?.isContentEditable
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key !== "j" && key !== "k") return;
      const currentIndex = demoCases.findIndex(
        (caseData) => caseData.id === activeCaseId,
      );
      const direction = key === "j" ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + demoCases.length) % demoCases.length;
      selectCase(demoCases[nextIndex].id);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeCaseId]);

  function selectCase(caseId: string) {
    const nextCase = demoCases.find((caseData) => caseData.id === caseId);
    setActiveCaseId(caseId);
    setActiveTab("overview");
    setNotice("");
    if (nextCase) setActiveEvidenceId(nextCase.evidence[0].id);
  }

  function moveCase(direction: number) {
    const currentIndex = demoCases.findIndex(
      (caseData) => caseData.id === activeCaseId,
    );
    const nextIndex =
      (currentIndex + direction + demoCases.length) % demoCases.length;
    selectCase(demoCases[nextIndex].id);
  }

  function openEvidence(evidenceId: string) {
    setActiveEvidenceId(evidenceId);
    setActiveTab("evidence");
  }

  function factLabel(factId: string) {
    return (
      proofTemplate.factDefinitions.find((fact) => fact.id === factId)?.label ??
      factId
    );
  }

  function showDemoNotice(message: string) {
    setNotice(message);
  }

  return (
    <main className="review-app">
      <header className="app-header">
        <Link className="app-brand" href="/" aria-label="返回证衡案例首页">
          <span className="brand-symbol" aria-hidden="true">
            证
          </span>
          <div>
            <strong>证衡</strong>
            <small>纠纷判责工作台</small>
          </div>
        </Link>
        <div className="header-context">
          <span>取消费争议</span>
          <i aria-hidden="true">/</i>
          <strong>司机到达与等待义务</strong>
        </div>
        <div className="header-actions">
          <span className="environment-badge">演示数据</span>
          <button
            className="icon-button"
            type="button"
            aria-label="上一案件"
            onClick={() => moveCase(-1)}
          >
            ↑
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="下一案件"
            onClick={() => moveCase(1)}
          >
            ↓
          </button>
        </div>
      </header>

      <div className="review-layout">
        <aside className="case-queue" aria-label="案件队列">
          <div className="queue-heading">
            <div>
              <h1>待研判</h1>
              <span>{demoCases.length} 个演示案件</span>
            </div>
            <span className="shortcut-hint" title="使用 J/K 切换案件">
              J / K
            </span>
          </div>

          <div className="queue-summary" aria-label="队列概况">
            <span>
              <i className="summary-dot success" />
              可自动 2
            </span>
            <span>
              <i className="summary-dot warning" />
              待人工 2
            </span>
          </div>

          <div className="case-list">
            {demoCases.map((caseData) => {
              const caseStatus = formatCaseStatus(caseData);
              const selected = caseData.id === currentCase.id;
              return (
                <button
                  className={"case-row " + (selected ? "selected" : "")}
                  key={caseData.id}
                  type="button"
                  aria-pressed={selected}
                  data-testid={"case-" + caseData.id}
                  onClick={() => selectCase(caseData.id)}
                >
                  <span className={"queue-status " + caseStatus.tone} />
                  <span className="case-row-copy">
                    <span>
                      <strong>{caseData.id}</strong>
                      <em className={"inline-status " + caseStatus.tone}>
                        {caseStatus.label}
                      </em>
                    </span>
                    <b>{caseData.title.replace(/^.*?·\s*/, "")}</b>
                    <small>{caseData.description}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="queue-footer">
            <span>证明模板</span>
            <strong>{proofTemplate.version}</strong>
          </div>
        </aside>

        <section className="case-workspace" aria-label="案件详情">
          <header className="case-header">
            <div className="case-breadcrumb">
              <span>取消费争议</span>
              <i>/</i>
              <span>{currentCase.id}</span>
            </div>
            <div className="case-title-row">
              <div>
                <h2>司机是否完成到达与等待义务</h2>
                <p>
                  依据平台证据确认事实是否满足当前生效的取消费证明模板。
                </p>
              </div>
              <span className={"gate-pill " + currentGate.tone}>
                <i />
                {currentGate.label}
              </span>
            </div>
            <div className="case-meta">
              <span>
                证据 <strong>{currentCase.evidence.length}</strong>
              </span>
              <span>
                事实覆盖 <strong>{result.coverage}%</strong>
              </span>
              <span>
                规则 <strong>{proofTemplate.version}</strong>
              </span>
            </div>
          </header>

          <section className="claims-panel" aria-labelledby="claims-title">
            <div className="section-heading">
              <h3 id="claims-title">双方主张</h3>
              <span>AI仅整理陈述，不参与责任计算</span>
            </div>
            <div className="claims">
              <article>
                <span className="party-mark driver">司</span>
                <div>
                  <strong>司机</strong>
                  <p>“{currentCase.claims.driver}”</p>
                </div>
              </article>
              <article>
                <span className="party-mark passenger">乘</span>
                <div>
                  <strong>乘客</strong>
                  <p>“{currentCase.claims.passenger}”</p>
                </div>
              </article>
            </div>
          </section>

          <div className="case-tabs" role="tablist" aria-label="案件信息">
            {tabs.map((tabItem) => (
              <button
                id={"tab-" + tabItem.id}
                key={tabItem.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tabItem.id}
                aria-controls={"panel-" + tabItem.id}
                onClick={() => setActiveTab(tabItem.id)}
              >
                {tabItem.label}
                {tabItem.id === "evidence" && (
                  <span>{currentCase.evidence.length}</span>
                )}
              </button>
            ))}
          </div>

          <div
            className="tab-content"
            role="tabpanel"
            id={"panel-" + activeTab}
            aria-labelledby={"tab-" + activeTab}
          >
            {activeTab === "overview" && (
              <OverviewPanel
                currentCase={currentCase}
                factLabel={factLabel}
                openEvidence={openEvidence}
              />
            )}

            {activeTab === "evidence" && (
              <EvidencePanel
                currentCase={currentCase}
                activeEvidence={activeEvidence}
                setActiveEvidenceId={setActiveEvidenceId}
              />
            )}

            {activeTab === "rules" && (
              <RulesPanel result={result} factLabel={factLabel} />
            )}

            {activeTab === "audit" && (
              <AuditPanel caseId={currentCase.id} gateLabel={result.gateLabel} />
            )}
          </div>
        </section>

        <aside className="decision-rail" aria-label="判责决定">
          <div className="decision-card">
            <div className="decision-card-header">
              <span>判责建议</span>
              <span className={"gate-pill compact " + currentGate.tone}>
                <i />
                {currentGate.label}
              </span>
            </div>

            {result.document ? (
              <>
                <div className="decision-result">
                  <span className="decision-check" aria-hidden="true">
                    ✓
                  </span>
                  <small>建议结论</small>
                  <h3>{result.outcome?.label}</h3>
                  <p>{result.document.conclusion}</p>
                </div>

                <div className="decision-basis">
                  <span>决定性事实</span>
                  <ul>
                    {result.document.facts.map((fact: {
                      factId: string;
                      statement: string;
                      citations: string[];
                    }) => (
                      <li key={fact.factId}>
                        <p>{fact.statement}</p>
                        <div>
                          {fact.citations.map((evidenceId: string) => (
                            <button
                              key={evidenceId}
                              type="button"
                              aria-label={"查看证据 " + evidenceId}
                              onClick={() => openEvidence(evidenceId)}
                            >
                              {evidenceId}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rule-reference">
                  <span>适用规则</span>
                  <strong>{result.document.rule.name}</strong>
                  <small>
                    {result.document.rule.id} · {result.document.rule.version}
                  </small>
                </div>

                <div className="decision-actions">
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() =>
                      showDemoNotice("演示模式：已记录“采纳建议”，未触发真实处置。")
                    }
                  >
                    采纳建议并结案
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() =>
                      showDemoNotice("演示模式：案件已标记为转人工复核。")
                    }
                  >
                    转人工复核
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="decision-result blocked">
                  <span className="decision-check" aria-hidden="true">
                    !
                  </span>
                  <small>自动判责已停止</small>
                  <h3>{result.gateLabel}</h3>
                  <p>当前材料不能支持确定性责任结论，应补充证据或转人工复核。</p>
                </div>
                <div className="missing-evidence">
                  <span>需要处理</span>
                  <ul>
                    {result.reasons.slice(0, 4).map((reason: string) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
                <div className="decision-actions">
                  <button
                    className="primary-action"
                    type="button"
                    onClick={() =>
                      showDemoNotice("演示模式：案件已标记为转人工复核。")
                    }
                  >
                    转人工复核
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => setActiveTab("evidence")}
                  >
                    查看全部证据
                  </button>
                </div>
              </>
            )}

            <p className="decision-footnote">
              当前为旁路演示，不会触发扣费、处罚或封禁。
            </p>
          </div>
          <div className="notice-region" aria-live="polite">
            {notice}
          </div>
        </aside>
      </div>
    </main>
  );
}

function OverviewPanel({
  currentCase,
  factLabel,
  openEvidence,
}: {
  currentCase: (typeof demoCases)[number];
  factLabel: (factId: string) => string;
  openEvidence: (evidenceId: string) => void;
}) {
  return (
    <div className="overview-panel">
      <div className="content-section">
        <div className="section-heading">
          <h3>事实核验</h3>
          <span>决定结论的最小事实集合</span>
        </div>
        <div className="fact-table">
          {currentCase.facts.map((fact) => {
            const status =
              statusMeta[fact.status as keyof typeof statusMeta] ??
              statusMeta.UNKNOWN;
            return (
              <article className="fact-item" key={fact.id}>
                <span className={"fact-status-icon " + status.tone}>
                  {fact.status === "SUPPORTED"
                    ? "✓"
                    : fact.status === "CONTRADICTED"
                      ? "×"
                      : fact.status === "CONFLICTED"
                        ? "!"
                        : "—"}
                </span>
                <div className="fact-main">
                  <div>
                    <strong>{factLabel(fact.id)}</strong>
                    <span className={"fact-status " + status.tone}>
                      {status.label}
                    </span>
                  </div>
                  <p>{fact.note}</p>
                </div>
                <div className="fact-evidence">
                  {fact.evidenceIds.length > 0 ? (
                    fact.evidenceIds.map((evidenceId) => (
                      <button
                        key={evidenceId}
                        type="button"
                        aria-label={"查看证据 " + evidenceId}
                        onClick={() => openEvidence(evidenceId)}
                      >
                        {evidenceId}
                      </button>
                    ))
                  ) : (
                    <span>无有效证据</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="content-section">
        <div className="section-heading">
          <h3>关键证据</h3>
          <button type="button" onClick={() => openEvidence(currentCase.evidence[0].id)}>
            查看全部
          </button>
        </div>
        <div className="key-evidence-grid">
          {currentCase.evidence.slice(0, 3).map((evidence) => (
            <button
              className="evidence-summary"
              key={evidence.id}
              type="button"
              onClick={() => openEvidence(evidence.id)}
            >
              <span>
                <strong>{evidence.id}</strong>
                <em className={"quality-badge " + evidence.quality.toLowerCase()}>
                  {evidence.quality}
                </em>
              </span>
              <b>{evidence.title}</b>
              <p>{evidence.summary}</p>
              <small>{evidence.source}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvidencePanel({
  currentCase,
  activeEvidence,
  setActiveEvidenceId,
}: {
  currentCase: (typeof demoCases)[number];
  activeEvidence: (typeof demoCases)[number]["evidence"][number];
  setActiveEvidenceId: (evidenceId: string) => void;
}) {
  return (
    <div className="evidence-panel">
      <div className="evidence-list" aria-label="证据列表">
        {currentCase.evidence.map((evidence) => (
          <button
            className={
              "evidence-row " +
              (activeEvidence.id === evidence.id ? "selected" : "")
            }
            key={evidence.id}
            type="button"
            aria-pressed={activeEvidence.id === evidence.id}
            onClick={() => setActiveEvidenceId(evidence.id)}
          >
            <span className="evidence-time">{evidence.time}</span>
            <span className="evidence-row-copy">
              <span>
                <strong>{evidence.title}</strong>
                <em className={"quality-badge " + evidence.quality.toLowerCase()}>
                  {evidence.quality}
                </em>
              </span>
              <small>{evidence.source}</small>
            </span>
          </button>
        ))}
      </div>
      <article className="evidence-inspector">
        <div className="inspector-header">
          <span>{activeEvidence.id}</span>
          <em className={"quality-badge " + activeEvidence.quality.toLowerCase()}>
            {activeEvidence.quality}
          </em>
        </div>
        <h3>{activeEvidence.title}</h3>
        <p>{activeEvidence.summary}</p>
        <dl>
          <div>
            <dt>采集时间</dt>
            <dd>{activeEvidence.time}</dd>
          </div>
          <div>
            <dt>证据来源</dt>
            <dd>{activeEvidence.source}</dd>
          </div>
          <div>
            <dt>质量等级</dt>
            <dd>{activeEvidence.quality}</dd>
          </div>
          <div>
            <dt>使用边界</dt>
            <dd>仅用于证明登记事实，不单独推导主观意图。</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}

function RulesPanel({
  result,
  factLabel,
}: {
  result: ReturnType<typeof evaluateCase>;
  factLabel: (factId: string) => string;
}) {
  return (
    <div className="rules-panel">
      <div className="rules-intro">
        <div>
          <span>当前证明模板</span>
          <h3>{proofTemplate.name}</h3>
          <p>
            {proofTemplate.id} · {proofTemplate.version}
          </p>
        </div>
        <p>逐项验证必要事实，不使用模型自报置信度。</p>
      </div>
      <div className="outcome-list">
        {result.outcomeChecks.map((outcomeCheck: {
          matched: boolean;
          outcome: { id: string; label: string };
          checks: Array<{
            factId: string;
            met: boolean;
            status: string;
            minQuality: string;
            reason: string;
          }>;
        }) => (
          <article
            className={"outcome-check " + (outcomeCheck.matched ? "matched" : "")}
            key={outcomeCheck.outcome.id}
          >
            <header>
              <div>
                <span>{outcomeCheck.outcome.id}</span>
                <h4>{outcomeCheck.outcome.label}</h4>
              </div>
              <strong>{outcomeCheck.matched ? "条件满足" : "条件未满足"}</strong>
            </header>
            <div>
              {outcomeCheck.checks.map((check: {
                factId: string;
                met: boolean;
                status: string;
                minQuality: string;
                reason: string;
              }) => (
                <div className="requirement-row" key={check.factId}>
                  <span className={check.met ? "pass" : "fail"}>
                    {check.met ? "✓" : "×"}
                  </span>
                  <div>
                    <strong>{factLabel(check.factId)}</strong>
                    <p>
                      要求 {check.status} · 最低质量 {check.minQuality}
                    </p>
                  </div>
                  <small>{check.reason}</small>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AuditPanel({
  caseId,
  gateLabel,
}: {
  caseId: string;
  gateLabel: string;
}) {
  const events = [
    ["刚刚", "证据充分度计算完成", "系统输出：" + gateLabel],
    ["1 分钟前", "证据质量校验完成", "全部引用已完成来源与质量检查"],
    ["2 分钟前", "案件进入旁路研判", caseId + " 使用演示证明模板"],
  ];
  return (
    <div className="audit-panel">
      <div className="section-heading">
        <h3>操作记录</h3>
        <span>记录分派、核验、决定及规则版本</span>
      </div>
      <div className="audit-list">
        {events.map(([time, title, detail]) => (
          <article key={title}>
            <span className="audit-marker" />
            <time>{time}</time>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
