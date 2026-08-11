import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import NewCasePage from "@/app/workbench/new/page";

describe("真实案件上传链路", () => {
  it("可载入样例并完成订单、轨迹、解析三步校验", async () => {
    const user = userEvent.setup();
    render(<NewCasePage />);

    await user.click(screen.getByRole("button", { name: "一键载入完整样例" }));
    expect(screen.getByText("order.json")).toBeInTheDocument();
    expect(screen.getAllByText("待验证").length).toBeGreaterThan(0);
    expect(screen.getByText(/必须由平台证据验证/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("trajectory.csv")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("heading", { name: "确认解析结果" })).toBeInTheDocument();
    expect(screen.getByText("ORDER-LOCAL-001")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建案件并进入工作台" })).toBeEnabled();
  });

  it("未上传订单时不能进入下一步", async () => {
    const user = userEvent.setup();
    render(<NewCasePage />);
    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByRole("alert")).toHaveTextContent("请先上传");
  });

  it("创建页无 axe 可自动识别的无障碍违规", async () => {
    const { container } = render(<NewCasePage />);
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
