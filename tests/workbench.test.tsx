import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import Workbench from "@/app/workbench/page";

describe("判责工作台交互契约", () => {
  it("默认只展示线性的案件队列、研判区和决定栏", () => {
    render(<Workbench />);

    expect(
      screen.getByRole("complementary", { name: "案件队列" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "案件详情" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "判责决定" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "研判概览" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("切换到证据不足案件时停止自动处置", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.click(screen.getByTestId("case-CASE-002"));

    const decision = screen.getByRole("complementary", {
      name: "判责决定",
    });
    expect(
      within(decision).getByRole("heading", { name: "证据不足" }),
    ).toBeInTheDocument();
    expect(
      within(decision).queryByRole("button", { name: "采纳建议并结案" }),
    ).not.toBeInTheDocument();
    expect(
      within(decision).getByRole("button", { name: "转人工复核" }),
    ).toBeInTheDocument();
  });

  it("规则校验按需展开，不占用默认研判空间", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    expect(
      screen.queryByText("逐项验证必要事实，不使用模型自报置信度。"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "规则校验" }));
    expect(
      screen.getByText("逐项验证必要事实，不使用模型自报置信度。"),
    ).toBeInTheDocument();
  });

  it("点击证据引用会进入证据详情并定位相应证据", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    const citations = screen.getAllByRole("button", {
      name: "查看证据 E03",
    });
    await user.click(citations[0]);

    expect(
      screen.getByRole("tab", { name: "全部证据4" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("button", {
        name: "14:33:10平台通话记录HIGH平台通信服务",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("支持 J/K 快捷键连续研判案件", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.keyboard("j");
    expect(screen.getByTestId("case-CASE-002")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.keyboard("k");
    expect(screen.getByTestId("case-CASE-001")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("初始工作台无 axe 可自动识别的可访问性违规", async () => {
    const { container } = render(<Workbench />);
    const results = await axe.run(container, {
      rules: {
        "color-contrast": { enabled: false },
      },
    });
    expect(results.violations).toEqual([]);
  });
});
