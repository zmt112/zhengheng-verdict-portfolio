import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import { CaseCounterfactual, CaseDecision, CaseEvidence, CaseOverview } from "@/app/workbench/case-components";
import Workbench from "@/app/workbench/page";
import { demoCases } from "@/lib/cases";

describe("案件运营工作台交互契约", () => {
  it("队列页只负责案件分发，不汇集研判详情", () => {
    render(<Workbench />);

    expect(screen.getByRole("heading", { name: "案件队列" })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^queue-CASE-/)).toHaveLength(4);
    expect(screen.queryByRole("heading", { name: "必要事实" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "证据账本" })).not.toBeInTheDocument();
  });

  it("可按案件 ID 搜索队列", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.type(screen.getByRole("textbox", { name: "搜索案件" }), "CASE-002");
    expect(screen.getByTestId("queue-CASE-002")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-CASE-001")).not.toBeInTheDocument();
  });

  it("可筛选证据不足案件", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.selectOptions(screen.getByRole("combobox", { name: "判责状态" }), "INSUFFICIENT");
    expect(screen.getByTestId("queue-CASE-002")).toBeInTheDocument();
    expect(screen.queryByTestId("queue-CASE-003")).not.toBeInTheDocument();
  });

  it("勾选案件后显示批量任务操作", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByRole("checkbox", { name: "选择 CASE-001" }));
    expect(screen.getByRole("status")).toHaveTextContent("已选择 1 个案件");
    expect(screen.getByRole("button", { name: "批量领取" })).toBeInTheDocument();
  });

  it("案件概览负责定向，并通过子导航进入专业任务页", () => {
    render(<CaseOverview caseData={demoCases[0]} />);

    expect(screen.getByRole("heading", { name: "双方主张" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "必要事实" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "案件处理步骤" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "证据账本" })).not.toBeInTheDocument();
  });

  it("证据页支持逐条选择并更新核验详情", async () => {
    const user = userEvent.setup();
    render(<CaseEvidence caseData={demoCases[0]} />);

    await user.click(screen.getByRole("button", { name: /14:33:10平台通话记录/ }));
    expect(screen.getByRole("heading", { name: "平台通话记录" })).toBeInTheDocument();
    expect(screen.getByText("两次拨打，一次接通 21 秒；不使用通话内容判责。")).toBeInTheDocument();
  });

  it("证据不足案件停止自动结案，只允许补证或转人工", () => {
    render(<CaseDecision caseData={demoCases[1]} />);

    expect(screen.getByRole("heading", { name: "证据不足，自动处置已停止" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "采纳建议并结案" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "转人工复核" })).toBeInTheDocument();
  });

  it("人工操作产生明确的演示反馈", async () => {
    const user = userEvent.setup();
    render(<CaseDecision caseData={demoCases[0]} />);

    await user.click(screen.getByRole("button", { name: "采纳建议并结案" }));
    expect(screen.getByRole("status")).toHaveTextContent("裁决已保存并写入审计记录（演示）");
  });

  it("删除决定性轨迹后，反事实实验将自动结论降级", async () => {
    const user = userEvent.setup();
    render(<CaseCounterfactual caseData={{ ...demoCases[0], storage: "LOCAL" }} />);

    expect(screen.getByText("这是基准结果")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /删除连续轨迹/ }));
    expect(screen.getByText("证据不足")).toBeInTheDocument();
    expect(screen.getByText("通过：结论随证据正确变化")).toBeInTheDocument();
  });

  it("初始队列无 axe 可自动识别的可访问性违规", async () => {
    const { container } = render(<Workbench />);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
