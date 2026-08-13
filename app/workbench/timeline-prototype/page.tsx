"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { timelineDemoCases, type Actor, type EvidenceType, type FactStatus, type TimelineDemoCase, type TimelineEvent } from "@/lib/timeline-demo-cases";

const actorMeta = {
  PASSENGER: { label: "乘客行为", className: "passenger", badge: "乘" },
  PLATFORM: { label: "平台事件", className: "platform", badge: "台" },
  DRIVER: { label: "司机行为", className: "driver", badge: "司" },
};

const factStatusMeta: Record<FactStatus, { label: string; tone: string }> = {
  SUPPORTED: { label: "已支持", tone: "supported" },
  CONFLICTED: { label: "证据冲突", tone: "conflicted" },
  UNKNOWN: { label: "待查明", tone: "unknown" },
  EXPERIENCE: { label: "体验事实", tone: "experience" },
};

function EvidencePreview({ event }: { event: TimelineEvent }) {
  const type = event.evidence[0]?.type;
  if (type === "GPS" && event.conflict) return <div className="timeline-conflict-preview"><header><span>同一时刻 · 两路平台数据</span><strong>空间位置无法同时成立</strong></header><div><article><small>司机手机定位 SDK</small><strong>距锚点 42m</strong><p>精度 9m · 连续采样</p><em>支持进入围栏</em></article><i>≠</i><article><small>车辆遥测终端</small><strong>距锚点 318m</strong><p>精度 7m · 设备在线</p><em>不支持进入围栏</em></article></div><footer>系统未发现可以排除任一路的故障证据，因此保持冲突状态。</footer></div>;
  if (type === "GPS") return <div className="timeline-map-preview"><div className="timeline-map-grid" /><span className="timeline-geofence" /><svg aria-hidden="true" viewBox="0 0 560 220"><path d="M28 186 C 116 170, 132 120, 204 136 S 310 92, 370 118 S 462 88, 522 48" /></svg><i className="timeline-map-start">起</i><i className="timeline-map-end">车</i><div className="timeline-map-stats"><span><b>11</b> 轨迹点</span><span><b>9m</b> 平均精度</span><span><b>28m</b> 距锚点</span></div></div>;
  if (type === "AUDIO") return <div className="timeline-audio-preview"><div className="timeline-audio-player"><button aria-label="播放合成录音" type="button">▶</button><div><span>00:08 / 00:28</span><i><b /></i></div><strong>1×</strong></div><div className="timeline-waveform" aria-label="录音波形示意">{Array.from({ length: 44 }, (_, index) => <i key={index} style={{ height: `${12 + ((index * 17) % 36)}px` }} />)}</div><div className="timeline-transcript"><p><b className="driver">司</b><span>我已经到平台定位点，在东侧停车区。</span></p><p><b className="passenger">乘</b><span>我在入口 B，没有看到你。</span></p><p><b className="driver">司</b><span>你的位置和平台上车点不是一个入口。</span></p></div></div>;
  if (type === "IM") return <div className="timeline-im-preview"><p className="system">平台隐私号会话 · 已脱敏</p><div className="passenger"><span>我在入口这里，看不到你</span><small>已送达</small></div><div className="driver"><span>我在平台显示的指定停车区</span><small>已送达</small></div></div>;
  if (type === "IMAGE") return <div className="timeline-image-preview"><div className="timeline-shot-map"><span>20:05</span><i>车</i><b>上车点</b><small>客户端位置截图</small></div><dl><div><dt>完整性</dt><dd>通过</dd></div><div><dt>形成时间</dt><dd>{event.occurredAt}</dd></div><div><dt>提交时间</dt><dd>{event.submittedAt ?? "同日上传"}</dd></div></dl></div>;
  return <pre className="timeline-json-preview">{JSON.stringify({ eventId: event.id.toUpperCase(), occurredAt: event.occurredAt, submittedAt: event.submittedAt, source: event.actor, status: event.conflict ? "CONFLICTED" : "VERIFIED", evidenceCount: event.evidence.length }, null, 2)}</pre>;
}

function Lifecycle({ caseData, phaseId, onChange }: { caseData: TimelineDemoCase; phaseId: string; onChange: (id: string) => void }) {
  return <section className="case-lifecycle" aria-labelledby="lifecycle-title"><header><div><span>案件生命周期</span><h2 id="lifecycle-title">从行程事实到申诉处理</h2></div><p>长时间空窗使用断轴表达；点击阶段切换下方分析片段。</p></header><div className="case-lifecycle-flow">{caseData.phases.map((phase, index) => <div className="case-lifecycle-unit" key={phase.id}>{index > 0 && <div className={`case-time-gap ${phase.gapBefore?.includes("跨夜") ? "long" : ""}`}><i /><span>{"//"} {phase.gapBefore} {"//"}</span><i /></div>}<button aria-pressed={phaseId === phase.id} className={`${phase.state} ${phaseId === phase.id ? "active" : ""}`} onClick={() => onChange(phase.id)} type="button"><i>{index + 1}</i><div><small>{phase.date} · {phase.time}</small><strong>{phase.label}</strong><span>{phase.summary}</span></div><em>{caseData.events.filter((event) => event.phaseId === phase.id).length} 事件</em></button></div>)}</div></section>;
}

function TimelineBoard({ caseData, phaseId, filter, selected, onSelect }: { caseData: TimelineDemoCase; phaseId: string; filter: "ALL" | EvidenceType; selected: TimelineEvent | null; onSelect: (event: TimelineEvent) => void }) {
  const phase = caseData.phases.find((item) => item.id === phaseId) ?? caseData.phases[0];
  const events = caseData.events.filter((event) => event.phaseId === phase.id && (filter === "ALL" || event.evidence.some((item) => item.type === filter)));
  return <section className="timeline-analyzer"><header><div><span>当前事件片段分析器</span><h2>{phase.label}</h2><p>{phase.date} · {phase.time} · {phase.summary}</p></div><em>{phase.rangeLabel}</em></header><section className="timeline-board" aria-label={`${caseData.id} ${phase.label}三方证据时间轴`}><header><div>{phase.ticks.map((tick) => <span key={tick}>{tick}</span>)}</div><small>{phase.rangeLabel}</small></header><div className="timeline-scale" aria-hidden="true">{Array.from({ length: 21 }, (_, index) => <i className={index % 4 === 0 ? "major" : ""} key={index} style={{ left: `${(index / 20) * 100}%` }} />)}</div>{(["PASSENGER", "PLATFORM", "DRIVER"] as Actor[]).map((actor) => { const meta = actorMeta[actor]; const actorEvents = events.filter((event) => event.actor === actor); return <div className={`timeline-lane ${meta.className}`} key={actor}><div className="timeline-lane-label"><b>{meta.badge}</b><div><strong>{meta.label}</strong><small>{actor === "PLATFORM" ? "第一方记录" : "行为与主张"}</small></div></div><div className="timeline-lane-track">{actorEvents.length === 0 && <span className="timeline-empty-lane">当前片段无相关事件</span>}{actorEvents.map((event) => <button aria-label={`${event.time} ${event.title}，${event.evidence.length}项证据`} className={`timeline-event-folder ${event.conflict ? "conflicted" : ""} ${selected?.id === event.id ? "selected" : ""}`} key={event.id} onClick={() => onSelect(event)} style={{ left: `${event.position}%` }} type="button"><span className="timeline-event-time">{event.time}</span><i className="timeline-node" /><span className="timeline-folder"><b>{event.icon}</b><em>{event.evidence.length}</em></span><span className="timeline-event-tooltip"><strong>{event.title}</strong><small>{event.evidence.map((item) => item.name).join(" · ")}</small></span></button>)}</div></div>; })}<footer><span><i className="passenger" />乘客行为</span><span><i className="platform" />平台记录</span><span><i className="driver" />司机行为</span><p>悬停查看证据名称 · 点击打开证据包</p></footer></section></section>;
}

function FactMatrix({ caseData }: { caseData: TimelineDemoCase }) {
  return <section className={`fact-matrix ${caseData.status === "CONFLICT" ? "conflicted" : ""}`} aria-labelledby="fact-matrix-title"><header><div><span>必要事实矩阵</span><h2 id="fact-matrix-title">系统为什么能判，或为什么必须停下来</h2></div><small>事实状态由证据质量和一致性决定，不使用模型自报置信度。</small></header><div className={`fact-decision-banner ${caseData.status === "CONFLICT" ? "conflicted" : "supported"}`}><i>{caseData.status === "CONFLICT" ? "!" : "✓"}</i><div><span>{caseData.statusLabel}</span><h3>{caseData.decision.title}</h3><p>{caseData.decision.summary}</p><strong>{caseData.decision.action}</strong></div></div><div className="fact-matrix-table"><table><caption className="sr-only">必要事实评估结果</caption><thead><tr><th scope="col">必要事实</th><th scope="col">状态</th><th scope="col">关键证据</th><th scope="col">系统解释</th><th scope="col">对结论影响</th></tr></thead><tbody>{caseData.facts.map((fact) => { const meta = factStatusMeta[fact.status]; return <tr key={fact.id}><th scope="row"><small>{fact.id}</small><strong>{fact.label}</strong></th><td><span className={`fact-status ${meta.tone}`}>{meta.label}</span></td><td>{fact.evidence}</td><td>{fact.interpretation}</td><td><em>{fact.impact}</em></td></tr>; })}</tbody></table></div></section>;
}

export function TimelineCaseDetail({ initialCaseId = timelineDemoCases[0].id, showScenarioSwitcher = true }: { initialCaseId?: string; showScenarioSwitcher?: boolean }) {
  const initialCase = timelineDemoCases.find((item) => item.id === initialCaseId) ?? timelineDemoCases[0];
  const [caseId, setCaseId] = useState(initialCase.id);
  const [phaseId, setPhaseId] = useState(initialCase.phases[0].id);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [filter, setFilter] = useState<"ALL" | EvidenceType>("ALL");
  const caseData = timelineDemoCases.find((item) => item.id === caseId) ?? timelineDemoCases[0];

  function switchCase(nextId: string) { const next = timelineDemoCases.find((item) => item.id === nextId) ?? timelineDemoCases[0]; setCaseId(next.id); setPhaseId(next.phases[0].id); setSelected(null); setFilter("ALL"); }
  function switchPhase(nextId: string) { setPhaseId(nextId); setSelected(null); }
  useEffect(() => { function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setSelected(null); } window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, []);

  return <div className="ops-page timeline-prototype-page"><div className="ops-page-heading timeline-page-heading"><div><p>案件队列 / {caseData.id} / 生命周期</p><h1>{showScenarioSwitcher ? "证据时间轴与事实门控" : caseData.title}</h1><span>生命周期负责导航，三方时间轴分析当前片段，事实矩阵决定是否允许输出结论</span></div><Link className="ops-text-link" href="/workbench">← 返回案件队列</Link></div>
    {showScenarioSwitcher && <section className="case-scenario-switcher" aria-label="选择演示案件">{timelineDemoCases.map((item) => <button aria-pressed={caseId === item.id} className={`${item.status.toLowerCase()} ${caseId === item.id ? "active" : ""}`} key={item.id} onClick={() => switchCase(item.id)} type="button"><i>{item.id === "CASE-005" ? "A" : "B"}</i><div><small>{item.id} · {item.tag}</small><strong>{item.title}</strong><span>{item.statusHint}</span></div><em>{item.status === "CONFLICT" ? "证据冲突" : "证据闭合"}</em></button>)}</section>}
    <section className={`timeline-case-summary ${caseData.status === "CONFLICT" ? "warning" : "success"}`}><div><strong>{caseData.id}</strong><span>{caseData.title}</span><em>合成案件</em></div><p><i />{caseData.statusLabel}</p></section>
    <Lifecycle caseData={caseData} phaseId={phaseId} onChange={switchPhase} />
    <section className="timeline-prototype-toolbar" aria-label="证据筛选工具栏"><div><strong>{caseData.phases.find((item) => item.id === phaseId)?.label}</strong><span>仅影响当前事件片段</span></div><div className="timeline-filter-group" role="group" aria-label="筛选证据类型">{(["ALL", "GPS", "AUDIO", "IM", "ORDER", "IMAGE"] as const).map((item) => <button aria-pressed={filter === item} className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)} type="button">{item === "ALL" ? "全部" : item}</button>)}</div></section>
    <TimelineBoard caseData={caseData} phaseId={phaseId} filter={filter} selected={selected} onSelect={setSelected} />
    <FactMatrix caseData={caseData} />
    {selected && <div className="timeline-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }} role="presentation"><aside aria-labelledby="timeline-drawer-title" aria-modal="true" className="timeline-evidence-drawer" role="dialog"><header><div><span>{actorMeta[selected.actor].label} · {selected.time}</span><h2 id="timeline-drawer-title">{selected.title}</h2></div><button aria-label="关闭证据详情" onClick={() => setSelected(null)} type="button">×</button></header><div className="timeline-drawer-body">{selected.submittedAt && selected.submittedAt !== selected.occurredAt && <section className="evidence-bitemporal"><strong>形成时间与提交时间不同</strong><dl><div><dt>证据形成</dt><dd>{selected.occurredAt}</dd></div><div><dt>用户提交</dt><dd>{selected.submittedAt}</dd></div></dl><p>证据回挂到形成时刻，同时在申诉阶段保留上传事件。</p></section>}<div className="timeline-evidence-files"><span>关联证据 · {selected.evidence.length}</span>{selected.evidence.map((item, index) => <button className={index === 0 ? "active" : ""} key={item.name} type="button"><i>{item.type === "AUDIO" ? "♫" : item.type === "GPS" ? "⌖" : item.type === "IM" ? "···" : item.type === "IMAGE" ? "▧" : "{}"}</i><div><strong>{item.name}</strong><small>{item.type} · 已完成解析</small></div><em>{item.quality === "MEDIUM" ? "中可信" : item.quality === "LOW" ? "低可信" : "高可信"}</em></button>)}</div><EvidencePreview event={selected} /><section className={`timeline-proof-scope ${selected.conflict ? "conflict" : ""}`}><span>机器解析摘要</span><p>{selected.summary}</p><div><strong>{selected.conflict ? "为什么不能直接判责" : "这份证据能证明"}</strong><p>{selected.fact}</p></div></section></div><footer><button type="button">查看原始数据</button><button className="primary" onClick={() => setSelected(null)} type="button">完成核验</button></footer></aside></div>}
  </div>;
}

export default function TimelinePrototypePage() {
  return <TimelineCaseDetail />;
}
