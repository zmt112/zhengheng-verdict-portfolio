import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = isGithubPages && repositoryName ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath,
  assetPrefix: basePath || undefined,
  allowedDevOrigins: ["127.0.0.1"],
  trailingSlash: isGithubPages,
  images: { unoptimized: true },
};

export default nextConfig;
