import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const startedAt = new Date();
const stages = [
  {
    id: "HARNESS",
    objective: "领域金标、组件交互与可访问性闸门",
    command: "npm",
    args: ["run", "harness"],
  },
  {
    id: "LINT",
    objective: "代码规范与 JSX 可访问性规则",
    command: "npm",
    args: ["run", "lint"],
  },
  {
    id: "BUILD",
    objective: "可部署构建闸门",
    command: "npm",
    args: ["run", "build"],
  },
];

const results = [];

for (const stage of stages) {
  console.log("\n[LOOP] " + stage.id + " · " + stage.objective);
  const result = spawnSync(stage.command, stage.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  results.push({
    id: stage.id,
    objective: stage.objective,
    passed: result.status === 0,
    exitCode: result.status,
  });

  if (result.status !== 0) break;
}

const passed = results.length === stages.length && results.every((item) => item.passed);
const report = {
  loopVersion: "LOOP-6-v1",
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  target: "仅在证据充分且规则可追溯时输出自动判责结论",
  result: passed ? "PROMOTE" : "REWORK",
  stages: results,
  nextAction: passed
    ? "允许进入下一项已冻结的开发目标"
    : "定位首个失败闸门，建立最小复现样本并修复后重新运行全量 loop",
};

mkdirSync("work", { recursive: true });
writeFileSync(
  "work/latest-loop-report.json",
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

console.log(
  "\n[LOOP] " +
    report.result +
    " · 报告已写入 work/latest-loop-report.json\n[LOOP] " +
    report.nextAction,
);

process.exit(passed ? 0 : 1);
