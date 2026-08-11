"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CaseAudit, CaseDecision, CaseEvidence, CaseOverview, CaseRules, type CaseData } from "@/app/workbench/case-components";
import { getLocalCase } from "@/lib/case-store";

export type RuntimeView = "overview" | "evidence" | "rules" | "audit" | "decision";

export function RuntimeCaseLoader({ view }: { view: RuntimeView }) {
  const params = useSearchParams();
  const caseId = params.get("caseId") ?? "";
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    getLocalCase<CaseData>(caseId).then((item) => {
      if (item) { setCaseData(item); setState("ready"); }
      else setState("missing");
    }).catch(() => setState("missing"));
  }, [caseId]);

  if (state === "loading") return <div className="ops-runtime-state"><span className="ops-spinner" /><strong>正在读取本地案件…</strong></div>;
  if (!caseData || state === "missing") return <div className="ops-runtime-state"><strong>未找到该本地案件</strong><p>案件可能来自另一台设备，或浏览器网站数据已被清除。</p><Link href="/workbench">返回案件队列</Link></div>;

  if (view === "evidence") return <CaseEvidence caseData={caseData} />;
  if (view === "rules") return <CaseRules caseData={caseData} />;
  if (view === "audit") return <CaseAudit caseData={caseData} />;
  if (view === "decision") return <CaseDecision caseData={caseData} />;
  return <CaseOverview caseData={caseData} />;
}

