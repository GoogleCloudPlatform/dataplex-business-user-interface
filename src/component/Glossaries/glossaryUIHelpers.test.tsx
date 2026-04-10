import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getIcon } from "./glossaryUIHelpers";
import type { ItemType } from "./GlossaryDataType";

// Helper: glossary type renders a <span> (Material Symbol), others render <svg> (MUI icon)
const expectIconRendered = (container: HTMLElement) => {
  const svgEl = container.querySelector("svg");
  const spanEl = container.querySelector("span.material-symbols-outlined");
  expect(svgEl || spanEl).toBeTruthy();
};

describe("glossaryUIHelpers", () => {
  describe("getIcon", () => {
    describe("Icon Type Selection", () => {
      it("returns an icon for glossary type", () => {
        const icon = getIcon("glossary");
        const { container } = render(<>{icon}</>);
        expect(container.querySelector("span.material-symbols-outlined")).toBeInTheDocument();
      });

      it("returns a MUI icon for category type", () => {
        const icon = getIcon("category");
        const { container } = render(<>{icon}</>);
        expect(container.querySelector("svg")).toBeInTheDocument();
      });

      it("returns a MUI icon for term type", () => {
        const icon = getIcon("term");
        const { container } = render(<>{icon}</>);
        expect(container.querySelector("svg")).toBeInTheDocument();
      });

      it("returns term icon for unknown/default type", () => {
        const icon = getIcon("unknown" as ItemType);
        const { container } = render(<>{icon}</>);
        expectIconRendered(container);
      });
    });

    describe("Return Value", () => {
      it("returns a valid React element", () => {
        const icon = getIcon("glossary");
        expect(icon).toBeDefined();
        expect(icon).not.toBeNull();
        expect(() => render(<>{icon}</>)).not.toThrow();
      });

      it("returns an icon element", () => {
        const icon = getIcon("category", "large");
        const { container } = render(<>{icon}</>);
        expect(container.querySelector("svg")).toBeInTheDocument();
      });
    });

    describe("All Type and Size Combinations", () => {
      const types: ItemType[] = ["glossary", "category", "term"];
      const sizes: Array<"small" | "medium" | "large"> = ["small", "medium", "large"];

      types.forEach((type) => {
        sizes.forEach((size) => {
          it(`renders ${type} icon with ${size} size correctly`, () => {
            const icon = getIcon(type, size);
            const { container } = render(<>{icon}</>);
            expectIconRendered(container);
          });
        });
      });
    });

    describe("Edge Cases", () => {
      it("handles empty string type by returning an icon (default)", () => {
        const icon = getIcon("" as ItemType);
        const { container } = render(<>{icon}</>);
        expectIconRendered(container);
      });

      it("handles null-like type by returning an icon (default)", () => {
        // @ts-expect-error - Testing edge case with invalid input
        const icon = getIcon(null);
        const { container } = render(<>{icon}</>);
        expectIconRendered(container);
      });

      it("handles undefined-like type by returning an icon (default)", () => {
        // @ts-expect-error - Testing edge case with invalid input
        const icon = getIcon(undefined);
        const { container } = render(<>{icon}</>);
        expectIconRendered(container);
      });
    });
  });

  describe("Module Exports", () => {
    it("exports getIcon function", () => {
      expect(getIcon).toBeDefined();
      expect(typeof getIcon).toBe("function");
    });
  });
});
