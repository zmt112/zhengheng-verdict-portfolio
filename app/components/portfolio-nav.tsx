import Link from "next/link";

export function PortfolioNav({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`portfolio-nav ${compact ? "portfolio-nav-compact" : ""}`}>
      <Link className="portfolio-brand" href="/" aria-label="证衡案例首页">
        <span aria-hidden="true">证</span>
        <strong>证衡</strong>
        <small>PRODUCT CASE</small>
      </Link>
      <nav aria-label="作品集导航">
        <Link href="/journey">完整链路</Link>
        <Link href="/workbench">工作台</Link>
        <Link href="/verdict">用户裁决书</Link>
        <Link href="/evaluation">验证档案</Link>
      </nav>
    </header>
  );
}
