import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";

import TimelinePrototypePage, { TimelineCaseDetail } from "@/app/workbench/timeline-prototype/page";

describe("双视角证据时间轴原型", () => {
  it("单案详情隐藏案例切换器并按指定案件初始化", () => {
    render(<TimelineCaseDetail initialCaseId="CASE-006" showScenarioSwitcher={false} />);
    expect(screen.queryByRole("region", { name: "选择演示案件" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "隔日申诉 · 两路定位矛盾" })).toBeInTheDocument();
    expect(screen.getAllByText("证据冲突，停止自动判责").length).toBeGreaterThan(0);
  });

  it("用生命周期、当前片段分析器和必要事实矩阵组织案件", () => {
    render(<TimelinePrototypePage />);
    expect(screen.getByRole("heading", { name: "从行程事实到申诉处理" })).toBeInTheDocument();
    expect(screen.getByText("当前事件片段分析器")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "系统为什么能判，或为什么必须停下来" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "必要事实评估结果" })).toBeInTheDocument();
  });

  it("按乘客、平台、司机三层组织事件", () => {
    render(<TimelinePrototypePage />);
    expect(screen.getAllByText("乘客行为").length).toBeGreaterThan(0);
    expect(screen.getByText("平台事件")).toBeInTheDocument();
    expect(screen.getAllByText("司机行为").length).toBeGreaterThan(0);
  });

  it("点击证据包后打开对应详情并可关闭", async () => {
    const user = userEvent.setup();
    render(<TimelinePrototypePage />);
    await user.click(screen.getByRole("button", { name: /14:32:10 平台电话接通/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "平台电话接通" })).toBeInTheDocument();
    expect(screen.getByText("平台通话录音.wav")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "关闭证据详情" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("支持按 GPS 类型筛选", async () => {
    const user = userEvent.setup();
    render(<TimelinePrototypePage />);
    await user.click(screen.getByRole("button", { name: "GPS" }));
    expect(screen.getByRole("button", { name: /连续 GPS 轨迹/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /平台电话接通/ })).not.toBeInTheDocument();
  });

  it("隔日案件遇到高可信证据冲突时停止自动判责", async () => {
    const user = userEvent.setup();
    render(<TimelinePrototypePage />);
    await user.click(screen.getByRole("button", { name: /CASE-006.*隔日申诉/ }));
    expect(screen.getByText(/跨夜 13小时10分/)).toBeInTheDocument();
    expect(screen.getAllByText("证据冲突，停止自动判责").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "暂不输出司乘责任结论" })).toBeInTheDocument();
    expect(screen.getAllByText("证据冲突").length).toBeGreaterThan(0);
  });

  it("隔日上传的证据同时保留形成时间与提交时间", async () => {
    const user = userEvent.setup();
    render(<TimelinePrototypePage />);
    await user.click(screen.getByRole("button", { name: /CASE-006.*隔日申诉/ }));
    await user.click(screen.getByRole("button", { name: /8月13日.*隔日申诉/ }));
    await user.click(screen.getByRole("button", { name: /补传昨日地图截图/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("形成时间与提交时间不同")).toBeInTheDocument();
    expect(screen.getAllByText("2026-08-12 20:05:52").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-08-13 09:24:10").length).toBeGreaterThan(0);
  });

  it("无 axe 可自动识别的无障碍违规", async () => {
    const { container } = render(<TimelinePrototypePage />);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
