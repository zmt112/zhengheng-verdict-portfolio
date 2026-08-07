import Link from "next/link";

import { PortfolioNav } from "@/app/components/portfolio-nav";

const cases = [
  ["CASE–001", "证据充分", "AUTO_DECIDABLE", "司机履约"],
  ["CASE–002", "关键轨迹缺失", "INSUFFICIENT", "安全拒判"],
  ["CASE–003", "事件与轨迹冲突", "EVIDENCE_CONFLICT", "转人工"],
  ["CASE–004", "完整轨迹反驳到达", "AUTO_DECIDABLE", "乘客主张成立"],
];

export default function EvaluationPage() {
  return (
    <main className="portfolio-shell evaluation-shell">
      <PortfolioNav compact />
      <section className="subpage-hero narrow">
        <div>
          <p className="hero-eyebrow">EVALUATION HARNESS · LOOP–6</p>
          <h1>不是让 Agent 自信，<br />而是让系统可被否证。</h1>
        </div>
        <p className="subpage-summary plain">核心目标被冻结为一句话：仅在证据充分且规则可追溯时输出自动判责结论。每次修改都必须依次通过领域金标、界面契约和构建闸门。</p>
      </section>

      <section className="harness-overview">
        <div className="harness-score">
          <span>LAST VERIFIED RUN</span>
          <strong>3 / 3</strong>
          <h2>质量闸门通过</h2>
          <p>领域用例 · UI 交互与可访问性 · 可部署构建</p>
          <small>结果：PROMOTE · 2026-07-22</small>
        </div>
        <div className="loop-diagram" aria-label="质量迭代循环">
          <div><span>01</span><strong>冻结目标</strong><small>不随 Demo 结果改答案</small></div>
          <i>→</i><div><span>02</span><strong>生成变异</strong><small>删轨迹 / 降质量 / 改时刻</small></div>
          <i>→</i><div><span>03</span><strong>运行 Harness</strong><small>领域 + 交互 + 可访问性</small></div>
          <i>→</i><div><span>04</span><strong>仅通过才推进</strong><small>失败则保留证据并修复</small></div>
        </div>
      </section>

      <section className="evaluation-section">
        <div className="section-label">GOLDEN CASES</div>
        <div className="section-heading compact"><h2>同一规则，覆盖四种证据状态</h2><p>结论不是从文案中读取，而由独立规则引擎根据事实状态与证据质量计算。</p></div>
        <div className="case-matrix">
          <div className="matrix-head"><span>用例</span><span>关键变化</span><span>预期门控</span><span>预期行为</span></div>
          {cases.map((row) => (
            <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><code>{row[2]}</code><b>{row[3]}</b></div>
          ))}
        </div>
      </section>

      <section className="evaluation-section mutation-section">
        <div className="section-label">COUNTERFACTUAL TESTS</div>
        <div className="section-heading compact"><h2>轻轻改动证据，结论就必须正确退化。</h2><p>反事实测试验证系统是否真正依赖证据，而不是记住预设答案。</p></div>
        <div className="mutation-grid">
          <article><span>REMOVE</span><h3>删除连续轨迹</h3><p>到达与停留变为 UNKNOWN</p><strong>自动判责 → 证据不足</strong></article>
          <article><span>DEGRADE</span><h3>降低定位质量</h3><p>关键事实不再满足最低质量</p><strong>自动判责 → 人工复核</strong></article>
          <article><span>SHIFT</span><h3>截图改为取消时刻</h3><p>用户附件与平台轨迹形成冲突</p><strong>自动判责 → 冲突门控</strong></article>
        </div>
      </section>

      <section className="limitations">
        <div><span>WHAT THIS PROVES</span><h2>已验证</h2><p>证据状态建模、确定性门控、逐条引用、交互契约和静态部署链路可以完整运行。</p></div>
        <div><span>WHAT IT DOESN’T</span><h2>尚未验证</h2><p>真实规则准确率、业务规模性能、模型解析精度与生产处置收益；这些需要脱敏 Schema 和业务金标案件。</p></div>
      </section>

      <section className="portfolio-next">
        <p>验证档案不是终点。你可以直接操作四类案件，检查门控是否符合预期。</p>
        <Link href="/workbench">打开工作台 Demo <span>↗</span></Link>
      </section>
    </main>
  );
}
