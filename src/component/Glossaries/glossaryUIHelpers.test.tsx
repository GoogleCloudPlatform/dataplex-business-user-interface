import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { getIcon } from "./glossaryUIHelpers";
import type { ItemType } from "./GlossaryDataType";

// Mock SVG imports
vi.mock("../../assets/svg/glossary.svg", () => ({
  default: "mocked-glossary-icon.svg",
}));

vi.mock("../../assets/svg/glossary_term.svg", () => ({
  default: "mocked-term-icon.svg",
}));

vi.mock("../../assets/svg/glossary_category.svg", () => ({
  default: "mocked-category-icon.svg",
}));

describe("glossaryUIHelpers", () => {
  describe("getIcon", () => {
    describe("Icon Type Selection", () => {
      it("returns glossary icon for glossary type", () => {
        const icon = getIcon("glossary");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Glossary" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "mocked-glossary-icon.svg");
      });

      it("returns category icon for category type", () => {
        const icon = getIcon("category");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Category" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "mocked-category-icon.svg");
      });

      it("returns term icon for term type", () => {
        const icon = getIcon("term");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Term" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "mocked-term-icon.svg");
      });

      it("returns term icon for unknown/default type", () => {
        // Cast to ItemType to test default case
        const icon = getIcon("unknown" as ItemType);

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Term" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "mocked-term-icon.svg");
      });
    });

    describe("Size Mapping", () => {
      it("applies small size (1rem) by default", () => {
        const icon = getIcon("glossary");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Glossary" });
        expect(img).toHaveStyle({ width: "1rem", height: "1rem" });
      });

      it("applies small size (1rem) when explicitly specified", () => {
        const icon = getIcon("glossary", "small");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Glossary" });
        expect(img).toHaveStyle({ width: "1rem", height: "1rem" });
      });

      it("applies medium size (1.5rem) when specified", () => {
        const icon = getIcon("category", "medium");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Category" });
        expect(img).toHaveStyle({ width: "1.5rem", height: "1.5rem" });
      });

      it("applies large size (2.5rem) when specified", () => {
        const icon = getIcon("term", "large");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Term" });
        expect(img).toHaveStyle({ width: "2.5rem", height: "2.5rem" });
      });
    });

    describe("Common Style Properties", () => {
      it("applies flex: 0 0 auto to icon", () => {
        const icon = getIcon("glossary");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Glossary" });
        expect(img).toHaveStyle({ flex: "0 0 auto" });
      });

      it("applies opacity: 1 to icon", () => {
        const icon = getIcon("category");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Category" });
        expect(img).toHaveStyle({ opacity: "1" });
      });

      it("applies all common styles together", () => {
        const icon = getIcon("term", "medium");

        render(<>{icon}</>);

        const img = screen.getByRole("img", { name: "Term" });
        expect(img).toHaveStyle({
          width: "1.5rem",
          height: "1.5rem",
          flex: "0 0 auto",
          opacity: "1",
        });
      });
    });

    describe("Alt Text", () => {
      it("sets alt text to 'Glossary' for glossary type", () => {
        const icon = getIcon("glossary");

        render(<>{icon}</>);

        expect(screen.getByAltText("Glossary")).toBeInTheDocument();
      });

      it("sets alt text to 'Category' for category type", () => {
        const icon = getIcon("category");

        render(<>{icon}</>);

        expect(screen.getByAltText("Category")).toBeInTheDocument();
      });

      it("sets alt text to 'Term' for term type", () => {
        const icon = getIcon("term");

        render(<>{icon}</>);

        expect(screen.getByAltText("Term")).toBeInTheDocument();
      });

      it("sets alt text to 'Term' for default/unknown type", () => {
        const icon = getIcon("invalid" as ItemType);

        render(<>{icon}</>);

        expect(screen.getByAltText("Term")).toBeInTheDocument();
      });
    });

    describe("All Type and Size Combinations", () => {
      const types: ItemType[] = ["glossary", "category", "term"];
      const sizes: Array<"small" | "medium" | "large"> = ["small", "medium", "large"];
      const expectedSizes = {
        small: "1rem",
        medium: "1.5rem",
        large: "2.5rem",
      };

      types.forEach((type) => {
        sizes.forEach((size) => {
          it(`renders ${type} icon with ${size} size correctly`, () => {
            const icon = getIcon(type, size);

            render(<>{icon}</>);

            const altText = type.charAt(0).toUpperCase() + type.slice(1);
            const img = screen.getByRole("img", { name: altText });

            expect(img).toBeInTheDocument();
            expect(img).toHaveStyle({
              width: expectedSizes[size],
              height: expectedSizes[size],
            });
          });
        });
      });
    });

    describe("Return Value", () => {
      it("returns a valid React element", () => {
        const icon = getIcon("glossary");

        expect(icon).toBeDefined();
        expect(icon).not.toBeNull();
        // Should be renderable without errors
        expect(() => render(<>{icon}</>)).not.toThrow();
      });

      it("returns an img element", () => {
        const icon = getIcon("category", "large");

        const { container } = render(<>{icon}</>);

        expect(container.querySelector("img")).toBeInTheDocument();
      });
    });

    describe("Edge Cases", () => {
      it("handles empty string type by returning term icon (default)", () => {
        const icon = getIcon("" as ItemType);

        render(<>{icon}</>);

        expect(screen.getByAltText("Term")).toBeInTheDocument();
      });

      it("handles null-like type by returning term icon (default)", () => {
        // @ts-expect-error - Testing edge case with invalid input
        const icon = getIcon(null);

        render(<>{icon}</>);

        expect(screen.getByAltText("Term")).toBeInTheDocument();
      });

      it("handles undefined-like type by returning term icon (default)", () => {
        // @ts-expect-error - Testing edge case with invalid input
        const icon = getIcon(undefined);

        render(<>{icon}</>);

        expect(screen.getByAltText("Term")).toBeInTheDocument();
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
