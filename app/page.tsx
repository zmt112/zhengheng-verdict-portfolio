import Link from "next/link";

import { PortfolioNav } from "@/app/components/portfolio-nav";

const decisions = [
  {
    index: "01",
    title: "先判断能否判，再判断谁有责",
    copy: "把 UNKNOWN 与 CONFLICTED 设为系统的一等状态。证据不足时安全拒判，不用模型置信度掩盖信息缺口。",
  },
  {
    index: "02",
    title: "真实性不等于证明力",
    copy: "截图即使真实，也可能只证明过去某一时刻。系统将媒体审核、时间对齐和事实证明拆为三个步骤。",
  },
  {
    index: "03",
    title: "判责与体验问题并行输出",
    copy: "规则可支持司机履约，同时识别乘客在另一入口的真实困境，将责任处置和上车点治理分流。",
  },
];

export default function PortfolioHome() {
  return (
    <main className="portfolio-shell">
      <PortfolioNav />

      <section className="portfolio-hero">
        <div className="hero-kicker">
          <span>个人产品作品 · 2026</span>
          <i />
          <span>演示数据，不连接生产处置</span>
        </div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-eyebrow">AI × 风控平台 × 服务体验</p>
            <h1>
              让判责结论，
              <br />
              <em>经得起追问。</em>
            </h1>
            <p className="hero-lead">
              证衡不是替客服写一段“更像答案”的话，而是把一次司乘纠纷拆成可验证事实：证据从哪来、能证明什么、还缺什么，以及为何得到这一结论。
            </p>
            <div className="hero-actions">
              <Link className="portfolio-button primary" href="/journey">
                回放完整业务链路 <span>→</span>
              </Link>
              <Link className="portfolio-button ghost" href="/workbench">
                进入可操作 Demo
              </Link>
            </div>
          </div>

          <aside className="hero-proof" aria-label="案例核心结论">
            <div className="proof-topline">
              <span>CASE–005</span>
              <span className="live-pill">可自动判责</span>
            </div>
            <p className="proof-question">“截图里司机明明没到，为什么还收取消费？”</p>
            <div className="proof-timeline" aria-label="关键时间线">
              <span style={{ left: "4%" }}>14:29<br /><b>真实截图</b></span>
              <span style={{ left: "42%" }}>14:31<br /><b>进入围栏</b></span>
              <span style={{ left: "83%" }}>14:37<br /><b>等待后取消</b></span>
              <i />
            </div>
            <div className="proof-answer">
              <small>系统判断</small>
              <strong>截图真实，但发生在司机到达前 81 秒。</strong>
              <p>司机履约成立；“入口歧义”另建体验治理任务。</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="portfolio-metrics" aria-label="项目范围">
        <div><strong>1</strong><span>条可回放端到端链路</span></div>
        <div><strong>4</strong><span>类证据充分度状态</span></div>
        <div><strong>4</strong><span>组金标案件 Harness</span></div>
        <div><strong>3</strong><span>重自动化质量闸门</span></div>
      </section>

      <section className="portfolio-section problem-section">
        <div className="section-label">01 / PROBLEM</div>
        <div className="section-heading">
          <h2>问题不在于信息少，<br />而在于信息没有形成证明。</h2>
          <p>
            订单事件、GPS、通话元数据、用户截图分散在不同系统。传统工作台让处置员自己拼接时间线；大模型若直接总结，又容易把主张、证据与推断混在一起。
          </p>
        </div>
        <div className="problem-flow" aria-label="当前问题到产品目标">
          <div><small>INPUT</small><strong>多源、异构、互相矛盾</strong><span>轨迹 · 事件 · 截图 · 录音</span></div>
          <b aria-hidden="true">→</b>
          <div><small>RISK</small><strong>“看起来合理”的错误结论</strong><span>缺证据仍强判 · 引用错时刻</span></div>
          <b aria-hidden="true">→</b>
          <div className="highlight"><small>TARGET</small><strong>可验证、可拒判、可申诉</strong><span>事实门控 · 逐条引用 · 版本留痕</span></div>
        </div>
      </section>

      <section className="portfolio-section decisions-section">
        <div className="section-label">02 / PRODUCT DECISIONS</div>
        <div className="section-heading compact">
          <h2>三项关键产品判断</h2>
          <p>项目价值来自机制设计，不来自更花哨的模型名称。</p>
        </div>
        <div className="decision-grid">
          {decisions.map((item) => (
            <article key={item.index}>
              <span>{item.index}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portfolio-section role-section">
        <div className="section-label">03 / MY ROLE & BOUNDARY</div>
        <div className="role-card">
          <div>
            <p className="role-intro">我在这个项目中负责</p>
            <h2>从问题定义，到可运行验证。</h2>
          </div>
          <ul>
            <li><strong>产品定义</strong><span>界定智能审核与案件级判责的边界</span></li>
            <li><strong>交互设计</strong><span>内部工作台、外部裁决书与补证路径</span></li>
            <li><strong>规则建模</strong><span>事实状态、证明模板、充分度门控</span></li>
            <li><strong>原型实现</strong><span>React 前端、确定性引擎、自动化 Harness</span></li>
          </ul>
          <p className="role-boundary">
            <b>边界说明</b>：所有人物、轨迹、订单与录音均为合成数据；规则是演示版本。本项目验证产品机制与工程闭环，不宣称真实业务效果。
          </p>
        </div>
      </section>

      <section className="portfolio-next">
        <p>下一步：用一个真实截图为何不能直接判责，检验整套链路。</p>
        <Link href="/journey">查看 CASE–005 完整回放 <span>↗</span></Link>
      </section>
    </main>
  );
}
