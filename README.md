# 证衡｜可验证司乘纠纷判责产品案例

一个面向 AI 产品、平台产品与风控产品岗位的个人作品。项目从“司乘双方各执一词，如何给出令人信服的判责结果”出发，完成了从合成行程、纠纷提交、媒体审核、案件快照、证据编排到裁决解释的端到端闭环。

**在线体验：** [https://zmt112.github.io/zhengheng-verdict-portfolio/](https://zmt112.github.io/zhengheng-verdict-portfolio/)

> 所有人物、订单、轨迹与媒体均为合成演示数据；规则为演示版本。本项目验证产品机制和工程可行性，不连接真实生产处置。

## 为什么不是另一个 AI 总结工具

- 先经过证据充分度门控，再允许输出责任结论；
- 将 `SUPPORTED / CONTRADICTED / UNKNOWN / CONFLICTED` 作为一等事实状态；
- 区分媒体“真实性”和材料对具体事实的“证明力”；
- 每条结论引用证据来源与规则版本；
- 责任判定和体验问题可并行输出；
- 使用金标用例、反事实变异和 UI 契约形成可重复 Harness。

## 作品集浏览路径

1. `/`：问题定义、关键产品决策、个人职责与项目边界；
2. `/journey`：CASE–005 从行程到裁决的可交互回放；
3. `/workbench`：四类证据状态的 B 端判责工作台；
4. `/verdict`：面向乘客的隐私友好裁决书与申诉路径；
5. `/evaluation`：金标案件、反事实测试和质量闸门。

## 本地运行

```bash
npm install
npm run dev
```

验证完整交付链路：

```bash
npm run harness
npm run lint
npm run build
```

## 部署

仓库内置 GitHub Pages 工作流。推送至 `main` 后，在仓库 Settings → Pages 中将 Source 设为 **GitHub Actions**，即可获得独立公开访问地址。

## 技术结构

- Next.js 16 + React 19 + TypeScript
- 确定性证据充分度与规则计算引擎
- Vitest、Testing Library、axe-core
- GitHub Actions + 静态导出

更完整的产品假设、接口契约和数据要求见 [`docs/CASE_005_FULL_CHAIN.md`](docs/CASE_005_FULL_CHAIN.md)。
