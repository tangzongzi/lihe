import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '礼盒报价计算器 - 智能利润分析',
    template: '%s - 礼盒报价计算器',
  },
  description:
    '专业的礼盒报价计算工具，支持产品库管理、自动填充供货价、精确计算利润和最大优惠空间。帮助商家快速制定合理的报价策略，提升经营效率。',
  keywords: [
    '礼盒报价计算器',
    '利润计算',
    '报价工具',
    '电商报价',
    '产品管理',
    '成本计算',
    '优惠分析',
    '店铺管理',
  ],
  authors: [{ name: '礼盒报价计算器' }],
  generator: '礼盒报价计算器',
  openGraph: {
    title: '礼盒报价计算器 - 智能利润分析工具',
    description:
      '专业的礼盒报价计算工具，支持产品库管理、自动填充供货价、精确计算利润和最大优惠空间。',
    siteName: '礼盒报价计算器',
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '礼盒报价计算器 - 智能利润分析工具',
    description:
      '专业的礼盒报价计算工具，支持产品库管理、自动填充供货价、精确计算利润和最大优惠空间。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
