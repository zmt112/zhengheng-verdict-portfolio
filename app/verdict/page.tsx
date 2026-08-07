import Link from "next/link";

import { PortfolioNav } from "@/app/components/portfolio-nav";

export default function VerdictPage() {
  return (
    <main className="portfolio-shell">
      <PortfolioNav compact />
      <section className="subpage-hero narrow">
        <div>
          <p className="hero-eyebrow">PASSENGER-FACING EXPLANATION</p>
          <h1>用户不需要看懂后台，<br />也应该知道为什么。</h1>
        </div>
        <p className="subpage-summary plain">外部裁决书只展示决定性证据摘要，隐藏另一方精确位置、完整轨迹与通话内容，同时提供针对性申诉路径。</p>
      </section>

      <section className="verdict-layout">
        <article className="user-verdict">
          <div className="user-verdict-head"><span>取消费争议处理结果</span><small>CASE–005 · 演示</small></div>
          <div className="verdict-status"><i>✓</i><div><small>本次处理结果</small><h2>司机已完成平台规定的到达与等待</h2></div></div>
          <p className="verdict-explain">你提交的截图是真实材料，但截图时间为 14:29，早于司机 14:31 进入平台指定上车范围，因此不能证明取消发生时司机仍未到达。</p>
          <div className="verdict-evidence">
            <h3>我们依据了什么</h3>
            <div><time>14:31</time><p><strong>车辆进入指定范围</strong><span>平台定位记录连续且质量正常</span></p></div>
            <div><time>14:32</time><p><strong>双方完成平台联系</strong><span>仅使用接通与时长，不使用通话内容判责</span></p></div>
            <div><time>14:37</time><p><strong>达到等待时长后取消</strong><span>进入范围后等待 388 秒</span></p></div>
          </div>
          <div className="verdict-care"><strong>你的体验问题没有被忽略</strong><p>系统发现你与司机可能位于不同入口，已将该上车点提交至体验治理队列。</p></div>
          <div className="appeal-box"><div><h3>仍有异议？</h3><p>如果你能提供 <b>14:31—14:37</b> 期间司机位置异常的材料，可申请再次复核。</p></div><button type="button">查看申诉说明</button></div>
        </article>

        <aside className="verdict-principles">
          <span>EXPLANATION PRINCIPLES</span>
          <h2>“令人信服”不是展示越多越好。</h2>
          <ul>
            <li><b>对齐争议</b><p>先回答用户真正质疑的时间点。</p></li>
            <li><b>逐条可查</b><p>每个结论都对应来源和规则。</p></li>
            <li><b>保护隐私</b><p>不暴露另一方完整轨迹和话术。</p></li>
            <li><b>可行动</b><p>告诉用户什么新证据可能改变结果。</p></li>
          </ul>
        </aside>
      </section>

      <section className="portfolio-next">
        <p>这份结论能否稳定复现？查看项目如何用 Harness 约束自己。</p>
        <Link href="/evaluation">查看验证档案 <span>↗</span></Link>
      </section>
    </main>
  );
}
