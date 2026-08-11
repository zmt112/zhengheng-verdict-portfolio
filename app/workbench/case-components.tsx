"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { proofTemplate } from "@/lib/cases";
import { getLocalFile, updateLocalCaseWorkflow } from "@/lib/case-store";
import { applyCounterfactual, counterfactualOptions } from "@/lib/trust-explanation";
import { evaluateCase } from "@/lib/verdict-engine";

export type CaseData = {
  id: string;
  title: string;
  description: string;
  scenario: string;
  claims: { driver: string; passenger: string };
  facts: Array<{ id: string; status: string; evidenceIds: string[]; note: string }>;
  evidence: Array<{ id: string; time: string; title: string; summary: string; source: string; quality: string; fileId?: string }>;
  storage?: "LOCAL";
  createdAt?: number;
  updatedAt?: number;
  owner?: string;
  workflowStatus?: string;
  files?: Array<{ id: string; evidenceId: string; name: string; type: string; size: number; sha256: string; role: string }>;
  audit?: Array<{ at: number; title: string; detail: string; actor: string }>;
};

const factLabels = new Map(proofTemplate.factDefinitions.map((fact) => [fact.id, fact.label]));

const gateMeta = {
  AUTO_DECIDABLE: { label: "可自动判责", tone: "success", hint: "证据链满足规则模板的全部必要条件" },
  INSUFFICIENT: { label: "证据不足", tone: "neutral", hint: "缺少必要事实或达到质量要求的证据" },
  EVIDENCE_CONFLICT: { label: "证据冲突", tone: "warning", hint: "高影响事实存在矛盾，需人工复核" },
};

const factMeta: Record<string, { label: string; tone: string }> = {
  SUPPORTED: { label: "已支持", tone: "success" },
  CONTRADICTED: { label: "不支持", tone: "danger" },
  CONFLICTED: { label: "有冲突", tone: "warning" },
  UNKNOWN: { label: "待查明", tone: "neutral" },
};

const qualityLabel: Record<string, string> = { HIGH: "高可信", MEDIUM: "中可信", LOW: "低可信" };

type ViewKey = "overview" | "evidence" | "rules" | "audit" | "counterfactual" | "decision";

function caseHref(caseData: CaseData, view: ViewKey) {
  if (caseData.storage === "LOCAL") {
    const path = view === "overview" ? "/workbench/local" : `/workbench/local/${view}`;
    return `${path}?caseId=${encodeURIComponent(caseData.id)}`;
  }
  const base = `/workbench/cases/${caseData.id}`;
  return view === "overview" ? base : `${base}/${view}`;
}

function CaseFrame({ caseData, view, children }: { caseData: CaseData; view: ViewKey; children: React.ReactNode }) {
  const [claimed, setClaimed] = useState(caseData.owner && caseData.owner !== "待领取");
  const result = evaluateCase(caseData, proofTemplate);
  const gate = gateMeta[result.gate as keyof typeof gateMeta];
  const views = [
    { key: "overview", label: "案件概览", href: caseHref(caseData, "overview") },
    { key: "evidence", label: `证据核验 ${caseData.evidence.length}`, href: caseHref(caseData, "evidence") },
    { key: "rules", label: "规则校验", href: caseHref(caseData, "rules") },
    { key: "audit", label: "审计记录", href: caseHref(caseData, "audit") },
    ...(caseData.storage === "LOCAL" ? [{ key: "counterfactual", label: "反事实验证", href: caseHref(caseData, "counterfactual") }] : []),
    { key: "decision", label: "裁决处理", href: caseHref(caseData, "decision") },
  ];

  async function claimCase() {
    setClaimed(true);
    if (caseData.storage === "LOCAL") {
      await updateLocalCaseWorkflow(caseData.id, { status: "CLAIMED", owner: "当前体验者", title: "案件已领取", detail: "案件由当前作品集体验者领取。" });
    }
  }

  return (
    <div className="ops-case-page">
      <div className="ops-open-tabs" aria-label="已打开案件">
        <Link href="/workbench">案件队列</Link>
        <span className="active"><i />{caseData.id}<b>×</b></span>
      </div>
      <header className="ops-case-header">
        <div className="ops-breadcrumb"><Link href="/workbench">案件队列</Link><span>/</span><strong>{caseData.id}</strong></div>
        <div className="ops-case-title-row">
          <div>
            <span className={`ops-status ${gate.tone}`}><i />{gate.label}</span>
            <h1>{caseData.id} · {caseData.title.replace(/^.*?·\s*/, "")}</h1>
            <p>{caseData.description}</p>
          </div>
          <div className="ops-case-actions">
            <button type="button">转交</button><button type="button">···</button>
            <button className="primary" disabled={Boolean(claimed)} onClick={claimCase} type="button">{claimed ? "已领取" : "领取案件"}</button>
          </div>
        </div>
        <dl className="ops-case-meta">
          <div><dt>争议场景</dt><dd>{caseData.scenario}</dd></div>
          <div><dt>当前处理人</dt><dd>{claimed ? "当前体验者" : caseData.owner ?? "待领取"}</dd></div>
          <div><dt>SLA 剩余</dt><dd>1 小时 42 分</dd></div>
          <div><dt>规则版本</dt><dd>{proofTemplate.version}</dd></div>
          <div><dt>证据完整度</dt><dd>{result.coverage}%</dd></div>
        </dl>
      </header>
      <nav className="ops-case-subnav" aria-label="案件处理步骤">
        {views.map((item) => <Link aria-current={view === item.key ? "page" : undefined} className={view === item.key ? "active" : ""} href={item.href} key={item.key}>{item.label}</Link>)}
      </nav>
      <div className="ops-case-content">{children}</div>
    </div>
  );
}

export function CaseOverview({ caseData }: { caseData: CaseData }) {
  const result = evaluateCase(caseData, proofTemplate);
  const gate = gateMeta[result.gate as keyof typeof gateMeta];
  return (
    <CaseFrame caseData={caseData} view="overview">
      <div className="ops-overview-grid">
        <section className="ops-panel ops-claims-panel" aria-labelledby="claims-title">
          <header><div><span>01</span><h2 id="claims-title">双方主张</h2></div><small>仅作为争议线索，不直接作为判责事实</small></header>
          <div className="ops-claim-grid">
            <article><span className="driver">司</span><div><strong>司机主张</strong><p>“{caseData.claims.driver}”</p></div></article>
            <article><span className="passenger">乘</span><div><strong>乘客主张</strong><p>“{caseData.claims.passenger}”</p></div></article>
          </div>
        </section>

        <section className="ops-panel ops-fact-panel" aria-labelledby="facts-title">
          <header><div><span>02</span><h2 id="facts-title">必要事实</h2></div><Link href={caseHref(caseData, "evidence")}>进入证据核验 →</Link></header>
          <div className="ops-fact-list">
            {caseData.facts.map((fact) => {
              const meta = factMeta[fact.status] ?? factMeta.UNKNOWN;
              return <article key={fact.id}><span className={`ops-fact-state ${meta.tone}`}>{meta.label}</span><div><strong>{factLabels.get(fact.id) ?? fact.id}</strong><p>{fact.note}</p></div><small>{fact.evidenceIds.length ? `${fact.evidenceIds.length} 项证据` : "暂无证据"}</small></article>;
            })}
          </div>
        </section>

        <aside className="ops-panel ops-route-panel" aria-labelledby="route-title">
          <header><div><span>03</span><h2 id="route-title">处理建议</h2></div></header>
          <div className={`ops-gate-hero ${gate.tone}`}><span>{result.gate === "AUTO_DECIDABLE" ? "✓" : result.gate === "EVIDENCE_CONFLICT" ? "!" : "—"}</span><strong>{gate.label}</strong><p>{gate.hint}</p></div>
          <dl><div><dt>事实覆盖</dt><dd>{result.coverage}%</dd></div><div><dt>引用证据</dt><dd>{caseData.evidence.length} 项</dd></div><div><dt>阻断原因</dt><dd>{result.gate === "AUTO_DECIDABLE" ? 0 : result.reasons.length} 项</dd></div></dl>
          <Link className="ops-primary-link" href={caseHref(caseData, "decision")}>查看裁决处理</Link>
          <p className="ops-safety-copy">系统只建议满足证据门槛的结论；缺证或冲突案件不会自动结案。</p>
        </aside>
      </div>
    </CaseFrame>
  );
}

export function CaseEvidence({ caseData }: { caseData: CaseData }) {
  const [selectedId, setSelectedId] = useState(caseData.evidence[0]?.id ?? "");
  const selected = caseData.evidence.find((item) => item.id === selectedId) ?? caseData.evidence[0];
  const [filePreview, setFilePreview] = useState<{ fileId: string; url?: string; text?: string; type: string; name: string } | null>(null);

  useEffect(() => {
    let objectUrl = "";
    if (caseData.storage !== "LOCAL" || !selected?.fileId) return;
    getLocalFile(selected.fileId).then(async (file) => {
      if (!file) return;
      if (file.type.startsWith("text/") || file.type.includes("json") || file.name.endsWith(".csv")) {
        setFilePreview({ fileId: file.id, type: file.type, name: file.name, text: await file.blob.text() });
      } else {
        objectUrl = URL.createObjectURL(file.blob);
        setFilePreview({ fileId: file.id, type: file.type, name: file.name, url: objectUrl });
      }
    }).catch(() => setFilePreview(null));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [caseData.storage, selected?.fileId]);

  const activePreview = filePreview?.fileId === selected?.fileId ? filePreview : null;
  let evidencePreview: React.ReactNode;
  if (activePreview?.url && activePreview.type.startsWith("image/")) {
    evidencePreview = <div className="ops-upload-preview">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={`已上传证据 ${activePreview.name}`} src={activePreview.url} />
    </div>;
  } else if (activePreview?.url && activePreview.type.startsWith("audio/")) {
    evidencePreview = <div className="ops-upload-preview audio"><span>录音证据 · {activePreview.name}</span>
      {/* 上传录音不附带字幕轨道，仅在本地人工核验时播放。 */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={activePreview.url}>浏览器不支持音频播放。</audio>
    </div>;
  } else if (activePreview?.text && selected.id !== "E-TRAJECTORY") {
    evidencePreview = <pre className="ops-raw-preview">{activePreview.text.slice(0, 3000)}</pre>;
  } else {
    evidencePreview = <div className="ops-map-placeholder" role="img" aria-label={caseData.storage === "LOCAL" ? "上传轨迹解析预览" : "合成轨迹证据预览"}><span className="road road-a" /><span className="road road-b" /><i className="geofence" /><b className="pin start">起</b><b className="pin end">终</b><svg aria-hidden="true" viewBox="0 0 600 230"><path d="M70 174 C 170 154, 174 74, 274 92 S 430 180, 524 56" /></svg><small>{caseData.storage === "LOCAL" ? "依据上传 CSV 生成关系示意" : "合成空间关系示意 · 不对应真实地点"}</small></div>;
  }
  return (
    <CaseFrame caseData={caseData} view="evidence">
      <section className="ops-evidence-workspace" aria-label="证据核验工作区">
        <div className="ops-evidence-list">
          <header><div><h2>证据账本</h2><p>按事件时间排序 · 来源与解析结果分离</p></div><button type="button">＋ 补充证据</button></header>
          <div className="ops-evidence-filters"><button className="active" type="button">全部 {caseData.evidence.length}</button><button type="button">平台数据</button><button type="button">用户上传</button></div>
          {caseData.evidence.map((item) => <button aria-pressed={selected?.id === item.id} className={selected?.id === item.id ? "active" : ""} key={item.id} onClick={() => setSelectedId(item.id)} type="button"><span className="ops-evidence-icon">{item.title.includes("轨迹") ? "⌁" : item.title.includes("通话") ? "☎" : "◇"}</span><div><span>{item.time}</span><strong>{item.title}</strong><small>{item.source}</small></div><em className={item.quality.toLowerCase()}>{qualityLabel[item.quality]}</em></button>)}
        </div>
        <div className="ops-evidence-inspector">
          {selected && <><header><div><span>{selected.id}</span><h2>{selected.title}</h2></div><button type="button">查看原始数据 ↗</button></header>
          {evidencePreview}
          <dl className="ops-inspector-meta"><div><dt>采集时间</dt><dd>{selected.time}</dd></div><div><dt>数据来源</dt><dd>{selected.source}</dd></div><div><dt>可信等级</dt><dd>{qualityLabel[selected.quality]}</dd></div><div><dt>解析状态</dt><dd>已完成</dd></div></dl>
          <section><h3>机器解析摘要</h3><p>{selected.summary}</p></section>
          <section><h3>支持的事实命题</h3><div className="ops-evidence-tags">{caseData.facts.filter((fact) => fact.evidenceIds.includes(selected.id)).map((fact) => <span key={fact.id}>{factLabels.get(fact.id) ?? fact.id}</span>)}{!caseData.facts.some((fact) => fact.evidenceIds.includes(selected.id)) && <small>尚未关联事实</small>}</div></section></>}
        </div>
      </section>
    </CaseFrame>
  );
}

export function CaseRules({ caseData }: { caseData: CaseData }) {
  const result = evaluateCase(caseData, proofTemplate);
  return (
    <CaseFrame caseData={caseData} view="rules">
      <div className="ops-rule-layout">
        <section className="ops-panel ops-rule-panel">
          <header><div><span>规则</span><h2>{proofTemplate.name}</h2></div><em>版本 {proofTemplate.version}</em></header>
          <p className="ops-panel-intro">逐项验证必要事实，不使用模型自报置信度。只有一个结论完整匹配时，案件才可进入自动判责。</p>
          {result.outcomeChecks.map((check: { outcome: { id: string; label: string }; matched: boolean; checks: Array<{ factId: string; met: boolean; actualStatus?: string; reason: string; minQuality: string }> }) => <article className={`ops-outcome-card ${check.matched ? "matched" : ""}`} key={check.outcome.id}><header><div><span>{check.matched ? "✓" : "—"}</span><strong>{check.outcome.label}</strong></div><em>{check.matched ? "条件全部满足" : "条件未闭合"}</em></header><div>{check.checks.map((item) => <div className="ops-rule-row" key={item.factId}><span className={item.met ? "pass" : "fail"}>{item.met ? "通过" : "未通过"}</span><strong>{factLabels.get(item.factId) ?? item.factId}</strong><small>{item.met ? `证据质量 ≥ ${item.minQuality}` : item.reason}</small></div>)}</div></article>)}
        </section>
        <aside className="ops-panel ops-template-panel"><span>模板快照</span><h2>可复算规则，而非隐藏推理</h2><dl><div><dt>模板 ID</dt><dd>{proofTemplate.id}</dd></div><div><dt>适用场景</dt><dd>{proofTemplate.scenario}</dd></div><div><dt>事实定义</dt><dd>{proofTemplate.factDefinitions.length} 项</dd></div><div><dt>互斥结论</dt><dd>{proofTemplate.outcomes.length} 个</dd></div></dl><p>规则版本与案件快照绑定。后续模板升级不会改变历史裁决的复算结果。</p></aside>
      </div>
    </CaseFrame>
  );
}

export function CaseAudit({ caseData }: { caseData: CaseData }) {
  const auditItems = caseData.audit ?? [
    { at: Date.parse("2026-07-18T14:38:02+08:00"), title: "纠纷工单已创建", detail: "订单、轨迹、通话元数据完成关联，生成案件快照。", actor: "system.ingestion" },
    { at: Date.parse("2026-07-18T14:38:03+08:00"), title: "证据解析完成", detail: `写入 ${caseData.evidence.length} 项证据、${caseData.facts.length} 个必要事实命题。`, actor: "evidence.parser · v0.4-demo" },
    { at: Date.parse("2026-07-18T14:38:04+08:00"), title: "规则门控完成", detail: `使用模板 ${proofTemplate.id} / ${proofTemplate.version} 生成确定性结果。`, actor: "verdict.engine" },
  ];
  return (
    <CaseFrame caseData={caseData} view="audit">
      <section className="ops-panel ops-audit-panel">
        <header><div><span>留痕</span><h2>不可变审计记录</h2></div><button type="button">导出审计包</button></header>
        <p className="ops-panel-intro">记录数据接入、解析、门控与人工操作。{caseData.storage === "LOCAL" ? "本案件日志由真实上传和本地操作生成。" : "当前为合成演示事件。"}</p>
        <div className="ops-audit-timeline">
          {auditItems.map((item, index) => <article className={index === auditItems.length - 1 ? "current" : ""} key={`${item.at}-${item.title}`}><time>{new Date(item.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</time><i /><div><strong>{item.title}</strong><p>{item.detail}</p><span>{item.actor}</span></div></article>)}
        </div>
      </section>
    </CaseFrame>
  );
}

export function CaseCounterfactual({ caseData }: { caseData: CaseData }) {
  const [mutation, setMutation] = useState("ORIGINAL");
  const original = evaluateCase(caseData, proofTemplate);
  const experiment = applyCounterfactual(caseData, mutation);
  const gate = gateMeta[experiment.result.gate as keyof typeof gateMeta];
  return (
    <CaseFrame caseData={caseData} view="counterfactual">
      <div className="ops-counterfactual-layout">
        <section className="ops-panel ops-counterfactual-controls">
          <header><div><span>实验</span><h2>如果证据发生变化，结论还成立吗？</h2></div></header>
          <p className="ops-panel-intro">所有变异只作用于临时副本，不修改原案件。结论必须随决定性证据正确退化，才能证明系统没有记住预设答案。</p>
          <div className="ops-mutation-options" role="radiogroup" aria-label="选择证据变异">
            {counterfactualOptions.map((option) => <button aria-checked={mutation === option.id} className={mutation === option.id ? "active" : ""} key={option.id} onClick={() => setMutation(option.id)} role="radio" type="button"><span>{mutation === option.id ? "●" : "○"}</span><div><strong>{option.label}</strong><small>{option.description}</small></div></button>)}
          </div>
        </section>
        <section className="ops-panel ops-counterfactual-result">
          <header><div><span>结果</span><h2>门控变化</h2></div></header>
          <div className="ops-gate-compare"><article><small>原始案件</small><strong>{original.gateLabel}</strong><p>{original.outcome?.label ?? "不输出责任结论"}</p></article><i>→</i><article className={gate.tone}><small>变异后</small><strong>{gate.label}</strong><p>{experiment.result.outcome?.label ?? "停止自动判责"}</p></article></div>
          <div className="ops-reason-list"><h3>系统依据</h3>{experiment.result.reasons.slice(0, 4).map((reason: string) => <div key={reason}><span>{mutation === "ORIGINAL" ? "成立" : "变化"}</span><p>{reason}</p></div>)}</div>
          <div className={`ops-proof-verdict ${mutation === "ORIGINAL" ? "baseline" : experiment.result.gate === original.gate ? "warning" : "pass"}`}><strong>{mutation === "ORIGINAL" ? "这是基准结果" : experiment.result.gate === original.gate ? "结论未发生预期变化，需要检查规则" : "通过：结论随证据正确变化"}</strong><p>反事实实验不会写入业务审计日志，也不会触发真实处置。</p></div>
        </section>
      </div>
    </CaseFrame>
  );
}

export function CaseDecision({ caseData }: { caseData: CaseData }) {
  const result = evaluateCase(caseData, proofTemplate);
  const gate = gateMeta[result.gate as keyof typeof gateMeta];
  const [actionNotice, setActionNotice] = useState("");
  async function performAction(kind: "EVIDENCE" | "REVIEW" | "RESOLVE") {
    const action = kind === "EVIDENCE" ? { status: "NEED_EVIDENCE", title: "已退回补证", detail: "已生成补充证据任务。", notice: "已生成补证任务" } : kind === "REVIEW" ? { status: "MANUAL_REVIEW", title: "已转人工复核", detail: "案件进入人工复核队列。", notice: "已转入人工复核队列" } : { status: "RESOLVED", title: "裁决已结案", detail: result.outcome?.action ?? "已按建议结案。", notice: "裁决已保存并写入审计记录" };
    if (caseData.storage === "LOCAL") await updateLocalCaseWorkflow(caseData.id, action);
    setActionNotice(`${action.notice}${caseData.storage === "LOCAL" ? "" : "（演示）"}`);
  }
  return (
    <CaseFrame caseData={caseData} view="decision">
      <div className="ops-decision-layout">
        <section className="ops-panel ops-decision-panel">
          <header><div><span>结论</span><h2>裁决处理</h2></div><span className={`ops-status ${gate.tone}`}><i />{gate.label}</span></header>
          {result.outcome ? <><div className="ops-decision-result"><span>建议结论</span><h3>{result.outcome.label}</h3><p>{result.outcome.conclusion}</p></div><div className="ops-action-box"><span>建议处置</span><p>{result.outcome.action}</p></div><div className="ops-decision-actions"><button onClick={() => performAction("EVIDENCE")} type="button">退回补证</button><button onClick={() => performAction("REVIEW")} type="button">转专家复核</button><button className="primary" onClick={() => performAction("RESOLVE")} type="button">采纳建议并结案</button></div></> : <><div className={`ops-blocked-box ${gate.tone}`}><span>{result.gate === "EVIDENCE_CONFLICT" ? "!" : "—"}</span><div><h3>{gate.label}，自动处置已停止</h3><p>{gate.hint}</p></div></div><div className="ops-reason-list"><h3>需要处理的问题</h3>{result.reasons.slice(0, 5).map((reason: string) => <div key={reason}><span>待处理</span><p>{reason}</p></div>)}</div><div className="ops-decision-actions"><button onClick={() => performAction("EVIDENCE")} type="button">退回补证</button><button className="primary" onClick={() => performAction("REVIEW")} type="button">转人工复核</button></div></>}
          {actionNotice && <div className="ops-inline-notice" role="status"><span>✓</span>{actionNotice}</div>}
        </section>
        <aside className="ops-panel ops-decision-proof"><span>裁决依据</span><h2>{caseData.id} 证据快照</h2><dl><div><dt>事实覆盖</dt><dd>{result.coverage}%</dd></div><div><dt>证据条目</dt><dd>{caseData.evidence.length}</dd></div><div><dt>规则版本</dt><dd>{proofTemplate.version}</dd></div></dl><Link href={caseHref(caseData, "rules")}>查看规则校验 →</Link><Link href={caseHref(caseData, "audit")}>查看审计记录 →</Link>{caseData.storage === "LOCAL" && <><Link href={caseHref(caseData, "counterfactual")}>运行反事实验证 →</Link><Link href={`/case-verdict?caseId=${encodeURIComponent(caseData.id)}`}>生成双视角裁决书 ↗</Link></>}<p>{caseData.storage === "LOCAL" ? "操作会真实写入浏览器本地案件库和审计日志。" : "演示案件不会产生真实业务处置。"}</p></aside>
      </div>
    </CaseFrame>
  );
}
