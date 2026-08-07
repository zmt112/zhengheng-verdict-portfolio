import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "证衡 · 司乘纠纷判责产品案例",
    template: "%s · 证衡",
  },
  description:
    "一个从真实业务问题出发的个人产品作品：先判断证据是否足够，再生成可追溯、可申诉的司乘纠纷裁决。",
  keywords: ["AI 产品", "平台产品", "风控产品", "产品经理作品集", "纠纷判责"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
