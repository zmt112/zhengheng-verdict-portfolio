"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { CaseData } from "@/app/workbench/case-components";
import { listLocalCases } from "@/lib/case-store";
import { demoCases, proofTemplate } from "@/lib/cases";
import { timelineDemoCases } from "@/lib/timeline-demo-cases";
import { evaluateCase } from "@/lib/verdict-engine";

type Gate = "AUTO_DECIDABLE" | "INSUFFICIENT" | "EVIDENCE_CONFLICT";
type Tone = "success" | "warning" | "neutral";
type ReportDay = "TODAY" | "YESTERDAY" | "EARLIER";

type QueueRow = {
  id: string;
  title: string;
  description: string;
  gate: Gate;
  gateLabel: string;
  gateTone: Tone;
  scene: string;
  sceneHint: string;
  completeness: number;
  owner: string;
  sla: string;
  urgent: boolean;
  reportTime: string;
  reportDay: ReportDay;
  finalLabel: string;
  finalTone: Tone;
  href: string;
  isLocal?: boolean;
};

const gateMeta: Record<Gate, { label: string; tone: Tone }> = {
  AUTO_DECIDABLE: { label: "证据闭合", tone: "success" },
  INSUFFICIENT: { label: "证据不足", tone: "neutral" },
  EVIDENCE_CONFLICT: { label: "证据冲突", tone: "warning" },
};

const standardMeta: Record<string, { owner: string; sla: string; reportTime: string; reportDay: ReportDay }> = {
  "CASE-001": { owner: "运营一组", sla: "1 小时 42 分", reportTime: "今天 14:38", reportDay: "TODAY" },
  "CASE-002": { owner: "待领取", sla: "48 分钟", reportTime: "今天 13:52", reportDay: "TODAY" },
  "CASE-003": { owner: "专家复核组", sla: "26 分钟", reportTime: "昨天 20:16", reportDay: "YESTERDAY" },
  "CASE-004": { owner: "待领取", sla: "2 小时 15 分", reportTime: "8月10日 09:41", reportDay: "EARLIER" },
};

function finalState(gate: Gate) {
  if (gate === "AUTO_DECIDABLE") return { label: "待人工确认", tone: "neutral" as Tone };
  if (gate === "EVIDENCE_CONFLICT") return { label: "暂不判责", tone: "warning" as Tone };
  return { label: "等待补证", tone: "neutral" as Tone };
}

export default function CaseQueuePage() {
  const [query, setQuery] = useState("");
  const [gateFilter, setGateFilter] = useState<"ALL" | Gate>("ALL");
  const [dayFilter, setDayFilter] = useState<"ALL" | ReportDay>("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");
  const [view, setView] = useState<"ALL" | "TODAY" | "ATTENTION">("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [localCases, setLocalCases] = useState<CaseData[]>([]);

  useEffect(() => {
    listLocalCases<CaseData>().then(setLocalCases).catch(() => setLocalCases([]));
  }, []);

  const rows = useMemo<QueueRow[]>(() => {
    const lifecycleRows: QueueRow[] = timelineDemoCases.map((item) => {
      const conflicted = item.status === "CONFLICT";
      return {
        id: item.id,
        title: item.title,
        description: item.statusHint,
        gate: conflicted ? "EVIDENCE_CONFLICT" : "AUTO_DECIDABLE",
        gateLabel: conflicted ? "证据冲突" : "证据闭合",
        gateTone: conflicted ? "warning" : "success",
        scene: "取消费争议",
        sceneHint: conflicted ? "双源定位矛盾" : "商场入口错位",
        completeness: conflicted ? 86 : 100,
        owner: conflicted ? "定位专家组" : "运营一组",
        sla: conflicted ? "18 分钟" : "1 小时 16 分",
        urgent: conflicted,
        reportTime: item.id === "CASE-005" ? "今天 14:42" : "今天 09:23",
        reportDay: "TODAY",
        finalLabel: conflicted ? "暂不判责" : "建议维持取消费",
        finalTone: conflicted ? "warning" : "success",
        href: `/workbench/cases/${item.id}/lifecycle`,
      };
    });

    const standardRows: QueueRow[] = [...localCases, ...(demoCases as CaseData[])].map((caseData) => {
      const result = evaluateCase(caseData, proofTemplate);
      const gate = result.gate as Gate;
      const gateInfo = gateMeta[gate];
      const fallback = { owner: caseData.owner ?? "待领取", sla: caseData.workflowStatus === "RESOLVED" ? "已结案" : "3 小时 59 分", reportTime: caseData.updatedAt ? `今天 ${new Date(caseData.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}` : "今天 刚刚", reportDay: "TODAY" as ReportDay };
      const meta = standardMeta[caseData.id] ?? fallback;
      const final = finalState(gate);
      return {
        id: caseData.id,
        title: caseData.title.replace(/^.*?·\s*/, ""),
        description: caseData.description,
        gate,
        gateLabel: gateInfo.label,
        gateTone: gateInfo.tone,
        scene: "取消费争议",
        sceneHint: caseData.storage === "LOCAL" ? "本地上传解析" : "司机到达与等待",
        completeness: result.coverage,
        owner: meta.owner,
        sla: meta.sla,
        urgent: meta.sla === "26 分钟" || meta.sla === "48 分钟",
        reportTime: meta.reportTime,
        reportDay: meta.reportDay,
        finalLabel: final.label,
        finalTone: final.tone,
        href: caseData.storage === "LOCAL" ? `/workbench/local?caseId=${encodeURIComponent(caseData.id)}` : `/workbench/cases/${caseData.id}`,
        isLocal: caseData.storage === "LOCAL",
      };
    });
    return [...lifecycleRows, ...standardRows];
  }, [localCases]);

  const attentionCount = rows.filter((row) => row.gate !== "AUTO_DECIDABLE").length;
  const todayCount = rows.filter((row) => row.reportDay === "TODAY").length;
  const ownerOptions = Array.from(new Set(rows.map((row) => row.owner)));
  const visibleRows = rows.filter((row) => {
    const keyword = `${row.id}${row.title}${row.description}${row.sceneHint}`.toLowerCase();
    const matchesView = view === "ALL" || (view === "TODAY" && row.reportDay === "TODAY") || (view === "ATTENTION" && row.gate !== "AUTO_DECIDABLE");
    return keyword.includes(query.toLowerCase()) && matchesView && (gateFilter === "ALL" || row.gate === gateFilter) && (dayFilter === "ALL" || row.reportDay === dayFilter) && (ownerFilter === "ALL" || row.owner === ownerFilter);
  });

  function toggleCase(caseId: string) {
    setSelected((current) => current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]);
  }

  function resetFilters() {
    setQuery("");
    setGateFilter("ALL");
    setDayFilter("ALL");
    setOwnerFilter("ALL");
    setView("ALL");
  }

  return (
    <div className="ops-page case-queue-v2">
      <div className="ops-page-heading case-queue-heading">
        <div><p>案件运营 / 我的工作台</p><h1>案件队列</h1><span>先筛选和分发案件，再进入单案生命周期完成证据研判</span></div>
        <div className="ops-page-actions"><button onClick={() => setNotice("当前筛选视图已生成演示导出任务")} type="button">导出视图</button><Link className="primary" href="/workbench/new">＋ 新建案件</Link></div>
      </div>

      {notice && <div className="ops-action-notice" role="status"><span>✓</span>{notice}<button aria-label="关闭提示" onClick={() => setNotice("")} type="button">×</button></div>}

      <section className="case-queue-kpis" aria-label="队列概况">
        <article><span>全部案件</span><strong>{rows.length}</strong><small>当前筛选范围</small></article>
        <article><span>今日申诉</span><strong>{todayCount}</strong><small>含当天与隔日申诉</small></article>
        <article><span>需关注</span><strong>{attentionCount}</strong><small>证据不足或冲突</small></article>
        <article><span>即将超时</span><strong>{rows.filter((row) => row.urgent).length}</strong><small>优先处理</small></article>
      </section>

      <section className="case-filter-panel" aria-labelledby="case-filter-title">
        <header><div><h2 id="case-filter-title">筛选案件</h2><p>支持组合条件，列表结果即时更新</p></div><button onClick={resetFilters} type="button">重置</button></header>
        <div className="case-filter-grid">
          <label className="case-filter-search"><span>案件 ID / 关键词</span><div><i>⌕</i><input aria-label="搜索案件" placeholder="例如 CASE-006、定位冲突" value={query} onChange={(event) => setQuery(event.target.value)} /></div></label>
          <label><span>申诉时间</span><select aria-label="申诉时间" value={dayFilter} onChange={(event) => setDayFilter(event.target.value as "ALL" | ReportDay)}><option value="ALL">全部时间</option><option value="TODAY">今天</option><option value="YESTERDAY">昨天</option><option value="EARLIER">更早</option></select></label>
          <label><span>AI 初判</span><select aria-label="判责状态" value={gateFilter} onChange={(event) => setGateFilter(event.target.value as "ALL" | Gate)}><option value="ALL">全部结果</option><option value="AUTO_DECIDABLE">证据闭合</option><option value="INSUFFICIENT">证据不足</option><option value="EVIDENCE_CONFLICT">证据冲突</option></select></label>
          <label><span>处理人</span><select aria-label="处理人" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="ALL">全部处理人</option>{ownerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}</select></label>
        </div>
      </section>

      <section className="ops-queue-card case-list-panel">
        <header className="case-list-header"><div className="ops-view-tabs"><button className={view === "ALL" ? "active" : ""} onClick={() => setView("ALL")} type="button">全部 <b>{rows.length}</b></button><button className={view === "TODAY" ? "active" : ""} onClick={() => setView("TODAY")} type="button">今日申诉 <b>{todayCount}</b></button><button className={view === "ATTENTION" ? "active" : ""} onClick={() => setView("ATTENTION")} type="button">需关注 <b>{attentionCount}</b></button></div><p>共 {visibleRows.length} 条案件</p></header>

        {selected.length > 0 && <div className="ops-bulk-bar" role="status"><strong>已选择 {selected.length} 个案件</strong><button type="button">批量领取</button><button type="button">分配处理人</button><button type="button" onClick={() => setSelected([])}>取消选择</button></div>}

        <div className="ops-table-wrap">
          <table className="ops-case-table case-list-table" aria-label="案件列表">
            <thead><tr><th><span className="sr-only">选择</span></th><th>案件</th><th>申诉时间</th><th>争议场景</th><th>AI 初判</th><th>最终结果</th><th>处理人</th><th>SLA 剩余</th><th>操作</th></tr></thead>
            <tbody>{visibleRows.map((row) => <tr key={row.id} data-testid={`queue-${row.id}`}>
              <td><input aria-label={`选择 ${row.id}`} type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleCase(row.id)} /></td>
              <td data-label="案件"><div className="case-list-identity"><strong>{row.id}{row.isLocal && <em>本地</em>}</strong><span>{row.title}</span><small>{row.description}</small></div></td>
              <td data-label="申诉时间"><span className="case-report-time">{row.reportTime}</span></td>
              <td data-label="争议场景"><span className="ops-cell-main">{row.scene}</span><small>{row.sceneHint}</small></td>
              <td data-label="AI 初判"><span className={`ops-status ${row.gateTone}`}><i />{row.gateLabel}</span><div className="case-completeness"><span><i style={{ width: `${row.completeness}%` }} /></span><small>{row.completeness}% 完整</small></div></td>
              <td data-label="最终结果"><span className={`case-final-state ${row.finalTone}`}>{row.finalLabel}</span></td>
              <td data-label="处理人"><span className="ops-owner"><i>{row.owner === "待领取" ? "—" : row.owner.slice(0, 1)}</i>{row.owner}</span></td>
              <td data-label="SLA 剩余"><strong className={row.urgent ? "ops-sla urgent" : "ops-sla"}>{row.sla}</strong></td>
              <td data-label="操作"><Link className="case-detail-link" aria-label={`查看 ${row.id} 详情`} href={row.href}>详情</Link></td>
            </tr>)}</tbody>
          </table>
          {visibleRows.length === 0 && <div className="ops-empty"><strong>没有匹配案件</strong><p>调整搜索词或筛选条件后重试。</p><button onClick={resetFilters} type="button">清空筛选</button></div>}
        </div>
        <footer className="ops-pagination"><span>第 1 页，共 {visibleRows.length} 条</span><div><button disabled type="button">‹</button><button className="active" type="button">1</button><button disabled type="button">›</button></div></footer>
      </section>
      <p className="ops-demo-note">所有预置案件均为合成数据；本地案件来自当前浏览器上传与解析。</p>
    </div>
  );
}
