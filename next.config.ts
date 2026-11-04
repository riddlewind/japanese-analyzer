import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // 把首屏 CSS 内联进 HTML，省掉 <link rel="stylesheet"> 的渲染阻塞往返（仅生产构建生效）。
    inlineCss: true,
  },
  env: {
    // Client-safe envs only. Do NOT expose secrets here.
    API_URL: process.env.API_URL,
  },
  // /legal 在请求时读取声明文件，需确保这些文件被一起打包进部署产物（如 Vercel 函数）。
  // THIRD-PARTY-NOTICES.md 内含字体 OFL-1.1 正文，属于随分发必须提供的声明，不能漏。
  outputFileTracingIncludes: {
    '/legal': [
      './LICENSE',
      './NOTICE',
      './LICENSING.md',
      './THIRD-PARTY-NOTICES.md',
      './LICENSES/**',
    ],
  },
};

export default nextConfig;
