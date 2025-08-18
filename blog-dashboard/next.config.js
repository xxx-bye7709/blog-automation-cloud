/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ビルド時のESLintを無効化
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型チェックエラーも無視（必要な場合のみ）
    // ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
