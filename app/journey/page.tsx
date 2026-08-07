"use client";

import Link from "next/link";
import { useState } from "react";

import { PortfolioNav } from "@/app/components/portfolio-nav";

const stages = [
  {
    id: "trip",
    index: "01",
    time: "14:18—14:37",
    label: "行程发生",
    title: "司机与乘客停在了两个入口",
    description: "司机进入平台 60 米围栏并等待 388 秒；乘客位于距锚点 129 米的入口 B。双方都在陈述自己看到的事实。",
    source: "订单服务 · 定位 SDK · 通信服务",
  },
  {
    id: "ticket",
    index: "02",
    time: "14:42",
    label: "纠纷提交",
    title: "乘客上传截图与平台通话录音",
    description: "附件先取得上传凭证，登记来源、哈希和时间。上传接口只返回待审核，不同步等待 OCR、ASR 或判责。",
    source: "乘客端 · 对象存储 · 工单服务",
  },
  {
    id: "audit",
    index: "03",
    time: "14:42:44",
    label: "媒体审核",
    title: "截图真实，不代表主张成立",
    description: "审核层确认截图未见明显篡改并提取 14:29、距上车点约 190 米；音频用于理解入口分歧，但不替代 GPS 证明车辆位置。",
    source: "智能审核 · OCR · ASR",
  },
  {
    id: "snapshot",
    index: "04",
    time: "14:43",
    label: "证据编排",
    title: "按时间与事实，而不是按文件排列",
    description: "系统冻结不可变案件快照，把每项材料映射到可证明的事实和时刻，并显式标记冲突、未知与来源质量。",
    source: "案件快照 · Evidence Agent",
  },
  {
    id: "decision",
    index: "05",
    time: "14:43:02",
    label: "门控与裁决",
    title: "责任结论与体验问题分流",
    description: "四项必要事实均获支持，规则引擎才允许输出司机已履约；同时创建入口歧义治理任务，不抹掉乘客的真实困境。",
    source: "证明模板 2026.07-demo · 确定性规则",
  },
];

const eventRows = [
  ["14:29:45", "乘客截图", "司机距锚点 187m", "用户附件"],
  ["14:31:06", "进入围栏", "距锚点 44m / 精度 9m", "定位 SDK"],
  ["14:31:12", "点击到达", "距锚点 28m", "订单服务"],
  ["14:32:10", "电话接通", "28 秒 / 内容不直接判责", "通信服务"],
  ["14:37:34", "司机取消", "进入围栏后 388 秒", "订单服务"],
];

export default function JourneyPage() {
  const [active, setActive] = useState(0);
  const stage = stages[active];

  return (
    <main className="portfolio-shell journey-shell">
      <PortfolioNav compact />
      <section className="subpage-hero">
        <div>
          <p className="hero-eyebrow">END-TO-END JOURNEY · CASE–005</p>
          <h1>一张真实截图，<br />为何不能直接判责？</h1>
        </div>
        <div className="subpage-summary">
          <span>合成案件</span>
          <p>点击下方五个阶段，查看数据如何从一次行程进入案件快照，并成为可引用的事实。</p>
        </div>
      </section>

      <section className="journey-stepper" aria-label="案件处理阶段">
        {stages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === active ? "active" : ""}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
          >
            <small>{item.index}</small>
            <strong>{item.label}</strong>
            <span>{item.time}</span>
          </button>
        ))}
      </section>

      <section className="journey-stage" aria-live="polite">
        <div className="stage-copy">
          <span className="stage-index">{stage.index}</span>
          <p className="stage-label">{stage.label} · {stage.time}</p>
          <h2>{stage.title}</h2>
          <p>{stage.description}</p>
          <small>数据来源：{stage.source}</small>
        </div>

        <div className={`stage-visual stage-${stage.id}`}>
          {stage.id === "trip" && (
            <div className="map-demo" aria-label="行程位置关系示意图">
              <div className="map-grid" />
              <div className="geofence"><span>平台上车点<br /><b>60m 围栏</b></span></div>
              <div className="map-pin driver">车<small>距锚点 28m</small></div>
              <div className="map-pin passenger">人<small>入口 B · 129m</small></div>
              <svg viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
                <path d="M25 260 C 130 200, 180 250, 285 160 S 410 72, 455 125" />
              </svg>
              <div className="map-legend"><span><i className="driver-dot" />司机</span><span><i className="passenger-dot" />乘客</span></div>
            </div>
          )}
          {stage.id === "ticket" && (
            <div className="upload-demo">
              <div className="phone-frame">
                <div className="phone-head">提交费用争议</div>
                <p>司机一直没到我这里，却收了取消费。</p>
                <div className="attachment-row"><span>IMG</span><b>地图截图.png</b><small>2.4 MB · 已上传</small></div>
                <div className="attachment-row"><span>AUD</span><b>平台通话.wav</b><small>16 秒 · 已上传</small></div>
                <button type="button">提交工单</button>
              </div>
              <div className="api-receipt"><small>POST /attachments</small><strong>202 ACCEPTED</strong><code>PENDING_AUDIT</code><span>sha256 已登记</span></div>
            </div>
          )}
          {stage.id === "audit" && (
            <div className="audit-demo">
              <div className="fake-shot">
                <span>14:29</span><div className="mini-route" /><b>距上车点约 190 米</b>
              </div>
              <div className="audit-findings">
                <span className="pass">完整性通过</span>
                <h3>LOW manipulation risk</h3>
                <dl><div><dt>OCR 时间</dt><dd>14:29</dd></div><div><dt>关联时刻</dt><dd>到达前 81 秒</dd></div><div><dt>证明力</dt><dd>不能证明取消时状态</dd></div></dl>
              </div>
            </div>
          )}
          {stage.id === "snapshot" && (
            <div className="snapshot-demo">
              <div className="snapshot-head"><span>SNAP–005–V1</span><b>已冻结</b></div>
              {eventRows.map((row) => (
                <div className="event-row" key={row[0]}>
                  <time>{row[0]}</time><strong>{row[1]}</strong><span>{row[2]}</span><small>{row[3]}</small>
                </div>
              ))}
            </div>
          )}
          {stage.id === "decision" && (
            <div className="decision-demo">
              <div className="decision-gate"><small>SUFFICIENCY GATE</small><strong>4 / 4 必要事实已证明</strong><span>AUTO_DECIDABLE</span></div>
              <div className="split-result">
                <div><small>责任处置</small><strong>司机已完成履约</strong><p>维持演示取消费结论</p></div>
                <div><small>体验治理</small><strong>上车点入口歧义</strong><p>进入点位治理任务</p></div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="journey-contract">
        <div>
          <span>关键设计</span>
          <h2>接口也必须体现产品边界。</h2>
          <p>上传、解析、快照、评估四步异步解耦；相同快照与规则版本重复运行，结果必须一致。</p>
        </div>
        <ol>
          <li><code>POST /dispute-tickets</code><span>创建工单</span></li>
          <li><code>POST /attachments</code><span>登记附件与哈希</span></li>
          <li><code>POST /case-snapshots</code><span>冻结证据版本</span></li>
          <li><code>POST /evaluations</code><span>运行事实门控</span></li>
        </ol>
      </section>

      <section className="portfolio-next">
        <p>链路已经冻结。现在站在处置员视角操作案件。</p>
        <Link href="/workbench">进入判责工作台 <span>↗</span></Link>
      </section>
    </main>
  );
}
