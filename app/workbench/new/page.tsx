"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { buildCaseFromInputs, parseOrderJson, parseTrajectoryCsv, sampleOrder, sampleTrajectoryCsv } from "@/lib/case-ingestion";
import { saveLocalCase, sha256, type LocalFileRecord } from "@/lib/case-store";
import { proofTemplate } from "@/lib/cases";
import { extractCandidateFacts } from "@/lib/trust-explanation";
import { evaluateCase } from "@/lib/verdict-engine";

type UploadState = { file: File; text: string } | null;

function formatSize(size: number) {
  return size < 1024 ? `${size} B` : `${Math.round(size / 1024)} KB`;
}

export default function NewCasePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orderUpload, setOrderUpload] = useState<UploadState>(null);
  const [traceUpload, setTraceUpload] = useState<UploadState>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [driverStatement, setDriverStatement] = useState("");
  const [passengerStatement, setPassengerStatement] = useState("");
  const [organized, setOrganized] = useState<ReturnType<typeof extractCandidateFacts> | null>(null);

  const parsed = useMemo(() => {
    if (!orderUpload || !traceUpload) return null;
    try {
      const order = parseOrderJson(orderUpload.text);
      if (driverStatement.trim() && passengerStatement.trim()) order.claims = { driver: driverStatement.trim(), passenger: passengerStatement.trim() };
      const trajectory = parseTrajectoryCsv(traceUpload.text);
      const preview = buildCaseFromInputs({ order, trajectory, createdAt: 1784366400000 });
      return { order, trajectory, preview, result: evaluateCase(preview, proofTemplate) };
    } catch {
      return null;
    }
  }, [driverStatement, orderUpload, passengerStatement, traceUpload]);

  async function readTextFile(file: File, kind: "ORDER" | "TRACE") {
    setError("");
    try {
      const text = await file.text();
      if (kind === "ORDER") {
        const order = parseOrderJson(text);
        setOrderUpload({ file, text });
        if (order.claims) {
          setDriverStatement(order.claims.driver);
          setPassengerStatement(order.claims.passenger);
        }
      } else {
        parseTrajectoryCsv(text);
        setTraceUpload({ file, text });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "文件解析失败");
    }
  }

  function loadSample() {
    const orderText = JSON.stringify(sampleOrder, null, 2);
    setOrderUpload({ file: new File([orderText], "order.json", { type: "application/json" }), text: orderText });
    setTraceUpload({ file: new File([sampleTrajectoryCsv], "trajectory.csv", { type: "text/csv" }), text: sampleTrajectoryCsv });
    setAttachments([]);
    setDriverStatement(sampleOrder.claims.driver);
    setPassengerStatement(sampleOrder.claims.passenger);
    setOrganized(extractCandidateFacts(sampleOrder.claims.driver, sampleOrder.claims.passenger));
    setError("");
  }

  function nextStep() {
    setError("");
    if (step === 1 && !orderUpload) return setError("请先上传并通过校验的订单 JSON");
    if (step === 2 && !traceUpload) return setError("请先上传并通过校验的轨迹 CSV");
    setStep((current) => Math.min(3, current + 1));
  }

  async function createCase() {
    if (!orderUpload || !traceUpload) return;
    setSaving(true);
    setError("");
    try {
      const createdAt = Date.now();
      const inputFiles = [
        { file: orderUpload.file, role: "ORDER" as const, evidenceId: "E-ORDER" },
        { file: traceUpload.file, role: "TRAJECTORY" as const, evidenceId: "E-TRAJECTORY" },
        ...attachments.map((file, index) => ({ file, role: "ATTACHMENT" as const, evidenceId: `E-UPLOAD-${index + 1}` })),
      ];
      const metadata = await Promise.all(inputFiles.map(async (item, index) => ({
        id: `FILE-${createdAt}-${index + 1}`,
        evidenceId: item.evidenceId,
        name: item.file.name,
        type: item.file.type || "application/octet-stream",
        size: item.file.size,
        sha256: await sha256(item.file),
        role: item.role,
      })));
      const order = parseOrderJson(orderUpload.text);
      if (driverStatement.trim() && passengerStatement.trim()) order.claims = { driver: driverStatement.trim(), passenger: passengerStatement.trim() };
      const caseData = buildCaseFromInputs({
        order,
        trajectory: parseTrajectoryCsv(traceUpload.text),
        files: metadata,
        createdAt,
      });
      const records: LocalFileRecord[] = metadata.map((item, index) => ({ ...item, caseId: caseData.id, blob: inputFiles[index].file }));
      await saveLocalCase(caseData, records);
      router.push(`/workbench/local?caseId=${encodeURIComponent(caseData.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "案件创建失败");
      setSaving(false);
    }
  }

  return (
    <div className="ops-page ops-intake-page">
      <div className="ops-page-heading">
        <div><p>案件运营 / 创建案件</p><h1>新建纠纷案件</h1><span>上传结构化证据，完成解析、判责与审计闭环</span></div>
        <Link className="ops-text-link" href="/workbench">返回案件队列</Link>
      </div>

      <ol className="ops-intake-steps" aria-label="案件创建步骤">
        {["订单信息", "轨迹与附件", "解析确认"].map((label, index) => <li className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} key={label}><span>{step > index + 1 ? "✓" : index + 1}</span><strong>{label}</strong></li>)}
      </ol>

      <section className="ops-intake-card">
        {step === 1 && <>
          <header><div><span>STEP 01</span><h2>上传订单事件</h2><p>JSON 用来提供订单时间、双方主张和联系记录。</p></div><button onClick={loadSample} type="button">一键载入完整样例</button></header>
          <section className="ops-assistant-box" aria-labelledby="assistant-title">
            <header><div><span>AI 接入 HARNESS</span><h3 id="assistant-title">先整理双方陈述，再验证事实</h3></div><em>当前：本地确定性回退器</em></header>
            <div className="ops-statement-grid"><label>司机陈述<textarea aria-label="司机陈述" onChange={(event) => { setDriverStatement(event.target.value); setOrganized(null); }} placeholder="例如：我已经到达，等待六分钟并打过电话。" value={driverStatement} /></label><label>乘客陈述<textarea aria-label="乘客陈述" onChange={(event) => { setPassengerStatement(event.target.value); setOrganized(null); }} placeholder="例如：我在商场门口没有看到司机。" value={passengerStatement} /></label></div>
            <button disabled={!driverStatement.trim() && !passengerStatement.trim()} onClick={() => setOrganized(extractCandidateFacts(driverStatement, passengerStatement))} type="button">整理候选事实</button>
            {organized && <div className="ops-candidate-results"><p>{organized.warning}</p>{organized.candidates.map((candidate) => <div key={candidate.id}><span>{candidate.source === "DRIVER" ? "司" : "乘"}</span><strong>{candidate.label}</strong><small>{candidate.signal}</small><em>待验证</em></div>)}</div>}
          </section>
          <label className={`ops-dropzone ${orderUpload ? "ready" : ""}`}>
            <input accept="application/json,.json" aria-label="上传订单 JSON" onChange={(event) => event.target.files?.[0] && readTextFile(event.target.files[0], "ORDER")} type="file" />
            <span>{orderUpload ? "✓" : "{}"}</span><strong>{orderUpload ? orderUpload.file.name : "选择 order.json"}</strong><p>{orderUpload ? `${formatSize(orderUpload.file.size)} · 格式校验通过` : "必需字段：orderId、trip.arrivalAt、trip.cancelAt"}</p>
          </label>
          <details className="ops-schema-help"><summary>查看 JSON 协议示例</summary><pre>{JSON.stringify(sampleOrder, null, 2)}</pre></details>
        </>}

        {step === 2 && <>
          <header><div><span>STEP 02</span><h2>上传轨迹与辅助证据</h2><p>CSV 用于计算范围、停留和连续性；图片和录音不直接参与自动判责。</p></div></header>
          <div className="ops-upload-grid">
            <label className={`ops-dropzone ${traceUpload ? "ready" : ""}`}><input accept="text/csv,.csv" aria-label="上传轨迹 CSV" onChange={(event) => event.target.files?.[0] && readTextFile(event.target.files[0], "TRACE")} type="file" /><span>{traceUpload ? "✓" : "⌁"}</span><strong>{traceUpload ? traceUpload.file.name : "选择 trajectory.csv"}</strong><p>{traceUpload ? `${formatSize(traceUpload.file.size)} · ${parseTrajectoryCsv(traceUpload.text).length} 个轨迹点` : "列：timestamp、distance_m、accuracy_m"}</p></label>
            <label className="ops-dropzone optional"><input accept="image/*,audio/*" aria-label="上传图片或录音附件" multiple onChange={(event) => setAttachments(Array.from(event.target.files ?? []))} type="file" /><span>＋</span><strong>添加截图或录音</strong><p>{attachments.length ? `已选择 ${attachments.length} 个辅助附件` : "可选 · 单次演示建议不超过 10 MB"}</p></label>
          </div>
          {attachments.length > 0 && <ul className="ops-file-list">{attachments.map((file) => <li key={`${file.name}-${file.size}`}><span>{file.type.startsWith("audio/") ? "音" : "图"}</span><strong>{file.name}</strong><small>{formatSize(file.size)}</small></li>)}</ul>}
          <details className="ops-schema-help"><summary>查看 CSV 协议示例</summary><pre>{sampleTrajectoryCsv}</pre></details>
        </>}

        {step === 3 && parsed && <>
          <header><div><span>STEP 03</span><h2>确认解析结果</h2><p>系统将在保存时重新计算文件哈希和规则结果。</p></div><span className={`ops-status ${parsed.result.gate === "AUTO_DECIDABLE" ? "success" : "neutral"}`}><i />{parsed.result.gateLabel}</span></header>
          <div className="ops-ingestion-summary">
            <article><small>订单</small><strong>{parsed.order.orderId}</strong><p>{parsed.order.title}</p></article>
            <article><small>轨迹质量</small><strong>{parsed.trajectory.length} 个点</strong><p>{parsed.preview.facts.find((fact: { id: string }) => fact.id === "F_TRACE_CONTINUITY")?.note}</p></article>
            <article><small>事实覆盖</small><strong>{parsed.result.coverage}%</strong><p>5 个必要事实已完成门控</p></article>
            <article><small>文件</small><strong>{2 + attachments.length} 个</strong><p>保存时登记 SHA-256</p></article>
          </div>
          <div className="ops-preview-facts">{parsed.preview.facts.map((fact: { id: string; status: string; note: string }) => <div key={fact.id}><span className={fact.status === "SUPPORTED" ? "pass" : fact.status === "CONTRADICTED" ? "fail" : "unknown"}>{fact.status}</span><strong>{proofTemplate.factDefinitions.find((item) => item.id === fact.id)?.label}</strong><p>{fact.note}</p></div>)}</div>
          <div className="ops-local-data-note"><strong>数据保存在哪里？</strong><p>案件与附件仅存放在当前浏览器 IndexedDB，不上传服务器。刷新后保留，清除浏览器网站数据后删除。</p></div>
        </>}

        {error && <div className="ops-form-error" role="alert">{error}</div>}
        <footer className="ops-intake-actions"><button disabled={step === 1 || saving} onClick={() => setStep((current) => current - 1)} type="button">上一步</button><span>第 {step} / 3 步</span>{step < 3 ? <button className="primary" onClick={nextStep} type="button">下一步</button> : <button className="primary" disabled={saving || !parsed} onClick={createCase} type="button">{saving ? "正在计算并保存…" : "创建案件并进入工作台"}</button>}</footer>
      </section>
    </div>
  );
}
