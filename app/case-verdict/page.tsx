"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { CaseData } from "@/app/workbench/case-components";
import { getLocalCase } from "@/lib/case-store";
import { generateRoleExplanation } from "@/lib/trust-explanation";

function VerdictContent() {
  const params = useSearchParams();
  const caseId = params.get("caseId") ?? "";
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getLocalCase<CaseData>(caseId).then((item) => item ? setCaseData(item) : setMissing(true)).catch(() => setMissing(true));
  }, [caseId]);

  if (!caseData && !missing) return <main className="trust-verdict-shell"><div className="trust-verdict-state"><span className="ops-spinner" /><strong>正在生成隐私化解释…</strong></div></main>;
  if (!caseData) return <main className="trust-verdict-shell"><div className="trust-verdict-state"><strong>未找到案件</strong><p>请从同一浏览器的案件工作台重新打开裁决书。</p><Link href="/workbench">返回工作台</Link></div></main>;

  const explanation = generateRoleExplanation(caseData, role);
  return (
    <main className="trust-verdict-shell">
      <header className="trust-verdict-top"><Link href="/">证衡</Link><span>可验证裁决书</span><Link href={`/workbench/local/decision?caseId=${encodeURIComponent(caseData.id)}`}>返回内部工作台</Link></header>
      <section className="trust-verdict-hero">
        <div><p>CASE EXPLANATION · {caseData.id}</p><h1>同一个事实结论，<br />用当事人能理解的方式说明。</h1></div>
        <div className="trust-role-switch" role="group" aria-label="选择裁决书视角"><button aria-pressed={role === "PASSENGER"} className={role === "PASSENGER" ? "active" : ""} onClick={() => setRole("PASSENGER")} type="button">乘客视角</button><button aria-pressed={role === "DRIVER"} className={role === "DRIVER" ? "active" : ""} onClick={() => setRole("DRIVER")} type="button">司机视角</button></div>
      </section>
      <section className="trust-verdict-grid">
        <article className="trust-verdict-card">
          <header><span>{role === "PASSENGER" ? "乘客端处理结果" : "司机端处理结果"}</span><small>{explanation.statusLabel}</small></header>
          <div className={`trust-result ${explanation.gate === "AUTO_DECIDABLE" ? "decided" : "paused"}`}><i>{explanation.gate === "AUTO_DECIDABLE" ? "✓" : "—"}</i><div><small>本次结论</small><h2>{explanation.headline}</h2></div></div>
          <p className="trust-summary">{explanation.summary}</p>
          <section className="trust-facts"><h3>我们依据了什么</h3>{explanation.facts.length > 0 ? explanation.facts.map((fact: { factId: string; evidenceCount: number; label: string; summary: string }) => <div key={fact.factId}><span>{fact.evidenceCount}</span><p><strong>{fact.label}</strong><small>{fact.summary}</small></p></div>) : <div className="empty"><p><strong>暂不展示责任证据</strong><small>必要事实尚未闭合，避免给出误导性解释。</small></p></div>}</section>
          <section className="trust-care"><strong>你的感受没有被忽略</strong><p>{explanation.care}</p></section>
          <section className="trust-appeal"><div><h3>什么材料可能改变结果？</h3><p>{explanation.appeal}</p></div><button type="button">发起复核</button></section>
        </article>
        <aside className="trust-principles"><span>为什么两份裁决书不一样？</span><h2>结论一致，解释视角不同。</h2><ul><li><strong>对齐争议</strong><p>先回答该角色最关心的收费或履约问题。</p></li><li><strong>保护隐私</strong><p>{explanation.privacy}</p></li><li><strong>可被推翻</strong><p>明确指出什么新证据可能改变结果。</p></li><li><strong>拒绝话术裁决</strong><p>双方陈述只用于定位争议，不替代事实证据。</p></li></ul><Link href={`/workbench/local/counterfactual?caseId=${encodeURIComponent(caseData.id)}`}>验证证据变化是否改变结论 →</Link></aside>
      </section>
    </main>
  );
}

export default function CaseVerdictPage() { return <Suspense fallback={null}><VerdictContent /></Suspense>; }
