import { fireEvent, render, screen } from "@testing-library/react";
import { MapPin } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { MapMarkerTag } from "./map-marker-tag";

describe("MapMarkerTag image carousel", () => {
  it("switches images and updates the carousel state", () => {
    render(
      <MapMarkerTag
        markerId="poi-1"
        label="Test Marker"
        x={0}
        y={0}
        z={0}
        isActive
        isHovered={false}
        icon={MapPin}
        onHoverChange={vi.fn()}
        detailContent={{
          title: "Test POI",
          images: [
            { imageUrl: "https://example.com/1.jpg", alt: "image 1" },
            { imageUrl: "https://example.com/2.jpg", alt: "image 2" },
            { imageUrl: "https://example.com/3.jpg", alt: "image 3" },
          ],
        }}
      />,
    );

    expect(screen.getByAltText("image 1")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下一張圖片" }));
    expect(screen.getByAltText("image 2")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "查看第 3 張圖片" }));
    expect(screen.getByAltText("image 3")).toBeInTheDocument();
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });
});
