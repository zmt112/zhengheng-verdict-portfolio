import Link from "next/link";

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="ops-nav-icon" aria-hidden="true">{children}</span>;
}

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="ops-app">
      <aside className="ops-sidebar">
        <Link className="ops-brand" href="/" aria-label="返回证衡案例首页">
          <span>证</span><div><strong>证衡</strong><small>判责运营平台</small></div>
        </Link>
        <nav aria-label="工作台主导航">
          <p>工作空间</p>
          <Link className="active" href="/workbench"><NavIcon>▦</NavIcon>案件队列<em>4</em></Link>
          <span><NavIcon>◇</NavIcon>证据中心</span>
          <span><NavIcon>⌘</NavIcon>规则模板</span>
          <p>运营治理</p>
          <span><NavIcon>↗</NavIcon>质量分析</span>
          <span><NavIcon>◎</NavIcon>体验问题</span>
          <span><NavIcon>≡</NavIcon>审计日志</span>
        </nav>
        <div className="ops-sidebar-foot">
          <span>DEMO</span>
          <div><strong>作品集演示</strong><small>安全运营角色</small></div>
        </div>
      </aside>
      <section className="ops-main">
        <header className="ops-topbar">
          <div className="ops-mobile-brand"><span>证</span><strong>证衡</strong></div>
          <div className="ops-product-path"><span>安全产品</span><i>/</i><strong>纠纷判责</strong></div>
          <div className="ops-top-actions">
            <button type="button" aria-label="全局搜索">⌕ <span>搜索案件</span><kbd>⌘ K</kbd></button>
            <button type="button" aria-label="通知">○</button>
            <Link href="/">作品集首页 ↗</Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
