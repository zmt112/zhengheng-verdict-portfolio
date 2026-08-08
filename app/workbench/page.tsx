"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { demoCases, proofTemplate } from "@/lib/cases";
import { evaluateCase } from "@/lib/verdict-engine";

const gateMeta = {
  AUTO_DECIDABLE: { label: "可自动判责", tone: "success" },
  INSUFFICIENT: { label: "证据不足", tone: "neutral" },
  EVIDENCE_CONFLICT: { label: "证据冲突", tone: "warning" },
};

const queueMeta: Record<string, { owner: string; sla: string; updated: string; completeness: number }> = {
  "CASE-001": { owner: "待领取", sla: "1 小时 42 分", updated: "2 分钟前", completeness: 100 },
  "CASE-002": { owner: "待领取", sla: "48 分钟", updated: "7 分钟前", completeness: 56 },
  "CASE-003": { owner: "专家复核组", sla: "26 分钟", updated: "11 分钟前", completeness: 82 },
  "CASE-004": { owner: "待领取", sla: "2 小时 15 分", updated: "18 分钟前", completeness: 100 },
};

export default function CaseQueuePage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const rows = useMemo(() => demoCases.map((caseData) => {
    const result = evaluateCase(caseData, proofTemplate);
    return { caseData, result, meta: queueMeta[caseData.id], gate: gateMeta[result.gate as keyof typeof gateMeta] };
  }), []);

  const visibleRows = rows.filter(({ caseData, result }) => {
    const matchesQuery = `${caseData.id}${caseData.title}${caseData.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "ALL" || result.gate === filter);
  });

  function toggleCase(caseId: string) {
    setSelected((current) => current.includes(caseId) ? current.filter((id) => id !== caseId) : [...current, caseId]);
  }

  return (
    <div className="ops-page ops-queue-page">
      <div className="ops-page-heading">
        <div><p>案件运营 / 我的工作台</p><h1>案件队列</h1><span>按证据充分度和 SLA 安排研判优先级</span></div>
        <div className="ops-page-actions"><button onClick={() => setNotice("当前筛选视图已生成演示导出任务")} type="button">导出视图</button><button className="primary" onClick={() => setNotice("演示站不写入真实案件，已保留创建入口")} type="button">＋ 新建演示案件</button></div>
      </div>

      {notice && <div className="ops-action-notice" role="status"><span>✓</span>{notice}<button aria-label="关闭提示" onClick={() => setNotice("")} type="button">×</button></div>}

      <section className="ops-kpi-grid" aria-label="队列概况">
        <article><span className="blue">待</span><div><small>待处理</small><strong>4</strong><p>今日新进入 3</p></div></article>
        <article><span className="green">自</span><div><small>可自动判责</small><strong>2</strong><p>证据链已闭合</p></div></article>
        <article><span className="amber">审</span><div><small>需人工复核</small><strong>2</strong><p>缺失或冲突</p></div></article>
        <article><span className="ink">时</span><div><small>平均处理时长</small><strong>6m</strong><p>演示口径 · 非业务指标</p></div></article>
      </section>

      <section className="ops-queue-card">
        <header className="ops-queue-toolbar">
          <div className="ops-view-tabs"><button className="active" type="button">全部案件 <b>4</b></button><button type="button">我的案件 <b>0</b></button><button type="button">即将超时 <b>1</b></button></div>
          <div className="ops-filters">
            <label className="ops-search"><span>⌕</span><input aria-label="搜索案件" placeholder="搜索案件 ID 或关键词" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <select aria-label="判责状态" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="ALL">全部状态</option><option value="AUTO_DECIDABLE">可自动判责</option><option value="INSUFFICIENT">证据不足</option><option value="EVIDENCE_CONFLICT">证据冲突</option>
            </select>
            <button type="button">更多筛选</button>
          </div>
        </header>

        {selected.length > 0 && <div className="ops-bulk-bar" role="status"><strong>已选择 {selected.length} 个案件</strong><button type="button">批量领取</button><button type="button">分配处理人</button><button type="button" onClick={() => setSelected([])}>取消选择</button></div>}

        <div className="ops-table-wrap">
          <table className="ops-case-table">
            <thead><tr><th><span className="sr-only">选择</span></th><th>案件</th><th>门控状态</th><th>争议场景</th><th>证据完整度</th><th>当前处理人</th><th>SLA 剩余</th><th>最近更新</th><th><span className="sr-only">操作</span></th></tr></thead>
            <tbody>
              {visibleRows.map(({ caseData, gate, meta }) => (
                <tr key={caseData.id} data-testid={`queue-${caseData.id}`}>
                  <td><input aria-label={`选择 ${caseData.id}`} type="checkbox" checked={selected.includes(caseData.id)} onChange={() => toggleCase(caseData.id)} /></td>
                  <td data-label="案件"><Link className="ops-case-link" href={`/workbench/cases/${caseData.id}`}><strong>{caseData.id}</strong><span>{caseData.title.replace(/^.*?·\s*/, "")}</span></Link></td>
                  <td data-label="门控状态"><span className={`ops-status ${gate.tone}`}><i />{gate.label}</span></td>
                  <td data-label="争议场景"><span className="ops-cell-main">取消费争议</span><small>司机到达与等待</small></td>
                  <td data-label="证据完整度"><div className="ops-progress"><span><i style={{ width: `${meta.completeness}%` }} /></span><b>{meta.completeness}%</b></div></td>
                  <td data-label="当前处理人"><span className="ops-owner"><i>{meta.owner === "待领取" ? "—" : "专"}</i>{meta.owner}</span></td>
                  <td data-label="SLA 剩余"><strong className={meta.sla === "26 分钟" ? "ops-sla urgent" : "ops-sla"}>{meta.sla}</strong></td>
                  <td data-label="最近更新"><span className="ops-muted-cell">{meta.updated}</span></td>
                  <td><Link className="ops-row-action" aria-label={`打开 ${caseData.id}`} href={`/workbench/cases/${caseData.id}`}>→</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && <div className="ops-empty"><strong>没有匹配案件</strong><p>调整搜索词或筛选条件后重试。</p></div>}
        </div>
        <footer className="ops-pagination"><span>共 {visibleRows.length} 条</span><div><button disabled type="button">‹</button><button className="active" type="button">1</button><button disabled type="button">›</button></div></footer>
      </section>
      <p className="ops-demo-note">本页面使用合成数据，指标仅用于展示信息架构，不代表真实业务效果。</p>
    </div>
  );
}
