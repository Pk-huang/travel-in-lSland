import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/components/providers/WorkspaceProvider", () => ({
  useWorkspaceData: () => ({ loading: false }),
  useWorkspacePois: () => ({ points: [] }),
}));

import { SceneControlPanel } from "./SceneControlPanel";

describe("SceneControlPanel", () => {
  it("opens and switches tabs correctly", () => {
    render(<SceneControlPanel />);

    const openButton = screen.getByRole("button", { name: "開啟設定抽屜" });
    fireEvent.click(openButton);

    expect(screen.getByText("Scene Settings")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "顯示" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "光影風格" }));
    expect(screen.getByLabelText("光影風格")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "時間軸" }));
    expect(screen.getByLabelText("選擇時間")).toBeInTheDocument();
  });

  it("closes the panel and keeps buttons in sync", () => {
    render(<SceneControlPanel />);

    fireEvent.click(screen.getByRole("button", { name: "開啟設定抽屜" }));
    const panel = screen.getByText("Scene Settings").closest("section");
    expect(panel).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(screen.getByRole("button", { name: "關閉設定抽屜" }));

    expect(screen.getByRole("button", { name: "開啟設定抽屜" })).toBeInTheDocument();
    expect(panel).toHaveAttribute("aria-hidden", "true");
  });
});
