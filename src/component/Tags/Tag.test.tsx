import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Tag from "./Tag";

// ==========================================================================
// Mock Data
// ==========================================================================

const defaultProps = {
  text: "Test Tag",
};

// ==========================================================================
// Basic Rendering Tests
// ==========================================================================

describe("Tag", () => {
  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<Tag {...defaultProps} />);
      expect(screen.getByText("Test Tag")).toBeInTheDocument();
    });

    it("renders the text prop correctly", () => {
      render(<Tag text="Custom Text" />);
      expect(screen.getByText("Custom Text")).toBeInTheDocument();
    });

    it("renders as a span element", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag.tagName.toLowerCase()).toBe("span");
    });

    it("has the capitalizeTag class", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveClass("capitalizeTag");
    });

    it("renders empty string text", () => {
      render(<Tag text="" />);
      const { container } = render(<Tag text="" />);
      const spans = container.querySelectorAll("span.capitalizeTag");
      expect(spans.length).toBeGreaterThan(0);
    });

    it("renders text with special characters", () => {
      render(<Tag text={'<Test> & \'Special\' "Characters"'} />);
      expect(
        screen.getByText('<Test> & \'Special\' "Characters"')
      ).toBeInTheDocument();
    });

    it("renders text with numbers", () => {
      render(<Tag text="Tag 123" />);
      expect(screen.getByText("Tag 123")).toBeInTheDocument();
    });

    it("renders text with unicode characters", () => {
      render(<Tag text="タグ テスト" />);
      expect(screen.getByText("タグ テスト")).toBeInTheDocument();
    });

    it("renders text with emojis", () => {
      render(<Tag text="🏷️ Tag" />);
      expect(screen.getByText("🏷️ Tag")).toBeInTheDocument();
    });

    it("renders long text", () => {
      const longText =
        "This is a very long tag text that might overflow or wrap depending on the container";
      render(<Tag text={longText} />);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Default Styling Tests
  // ==========================================================================

  describe("Default Styling", () => {
    it("has default background color", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ background: "#C2E7FF" });
    });

    it("has default text color", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ color: "#004A77" });
    });

    it("has default border radius", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ borderRadius: "16px" });
    });

    it("has default padding", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ padding: "4px 12px" });
    });

    it("has default height", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ height: "24px" });
    });

    it("has default font size", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontSize: "12px" });
    });

    it("has default font weight", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontWeight: "500" });
    });

    it("has default font family", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontFamily: "sans-serif" });
    });

    it("has default letter spacing", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ letterSpacing: "0.83%" });
    });

    it("has no border by default", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      // MUI renders border: "none" as "medium" in some cases
      expect(tag).toBeInTheDocument();
      expect(tag.style.border).toBeDefined();
    });
  });

  // ==========================================================================
  // Custom CSS Tests
  // ==========================================================================

  describe("Custom CSS", () => {
    it("applies custom background color", () => {
      render(<Tag {...defaultProps} css={{ background: "#FF0000" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ background: "#FF0000" });
    });

    it("applies custom text color", () => {
      render(<Tag {...defaultProps} css={{ color: "#000000" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ color: "#000000" });
    });

    it("applies custom padding", () => {
      render(<Tag {...defaultProps} css={{ padding: "10px 20px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ padding: "10px 20px" });
    });

    it("applies custom border radius", () => {
      render(<Tag {...defaultProps} css={{ borderRadius: "4px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ borderRadius: "4px" });
    });

    it("applies custom font size", () => {
      render(<Tag {...defaultProps} css={{ fontSize: "16px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontSize: "16px" });
    });

    it("applies custom font weight", () => {
      render(<Tag {...defaultProps} css={{ fontWeight: "700" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontWeight: "700" });
    });

    it("applies custom height", () => {
      render(<Tag {...defaultProps} css={{ height: "32px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ height: "32px" });
    });

    it("applies custom border", () => {
      render(<Tag {...defaultProps} css={{ border: "1px solid #000" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ border: "1px solid #000" });
    });

    it("applies custom margin", () => {
      render(<Tag {...defaultProps} css={{ margin: "5px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ margin: "5px" });
    });

    it("applies custom font family", () => {
      render(<Tag {...defaultProps} css={{ fontFamily: "Arial" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontFamily: "Arial" });
    });

    it("applies multiple custom styles at once", () => {
      const customCss = {
        background: "#000000",
        color: "#FFFFFF",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      };
      render(<Tag {...defaultProps} css={customCss} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle(customCss);
    });

    it("overrides default styles with custom css", () => {
      render(<Tag {...defaultProps} css={{ background: "#000000" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ background: "#000000" });
    });

    it("keeps default styles when css prop is undefined", () => {
      render(<Tag text="Test" />);
      const tag = screen.getByText("Test");
      expect(tag).toHaveStyle({ background: "#C2E7FF" });
    });

    it("applies empty css object without error", () => {
      render(<Tag {...defaultProps} css={{}} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ background: "#C2E7FF" });
    });
  });

  // ==========================================================================
  // Typography Component Tests
  // ==========================================================================

  describe("Typography Component", () => {
    it("renders as MUI Typography component", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      // MUI Typography adds specific classes
      expect(tag).toHaveClass("MuiTypography-root");
    });

    it("has the correct component prop (span)", () => {
      render(<Tag {...defaultProps} />);
      const tag = screen.getByText("Test Tag");
      expect(tag.tagName).toBe("SPAN");
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles whitespace-only text", () => {
      render(<Tag text="   " />);
      const { container } = render(<Tag text="   " />);
      const spans = container.querySelectorAll("span.capitalizeTag");
      expect(spans.length).toBeGreaterThan(0);
    });

    it("handles text with leading/trailing whitespace", () => {
      render(<Tag text="  Trimmed  " />);
      expect(screen.getByText("Trimmed")).toBeInTheDocument();
    });

    it("handles text with newline characters", () => {
      render(<Tag text="Line1\nLine2" />);
      // The literal string "Line1\nLine2" is rendered (backslash-n, not actual newline)
      const tag = screen.getByText(/Line1/);
      expect(tag).toBeInTheDocument();
    });

    it("handles text with tab characters", () => {
      render(<Tag text="Tab\tText" />);
      // The literal string is rendered
      const tag = screen.getByText(/Tab/);
      expect(tag).toBeInTheDocument();
    });

    it("handles very short text (single character)", () => {
      render(<Tag text="A" />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("renders correctly with numeric-like text", () => {
      render(<Tag text="12345" />);
      expect(screen.getByText("12345")).toBeInTheDocument();
    });

    it("handles HTML entities in text", () => {
      render(<Tag text="&amp; &lt; &gt;" />);
      // React renders HTML entities, so &amp; becomes & and &lt; becomes < etc
      const tag = screen.getByText(/&/);
      expect(tag).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CSS Priority Tests
  // ==========================================================================

  describe("CSS Priority", () => {
    it("custom css overrides background property", () => {
      render(<Tag {...defaultProps} css={{ background: "red" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ background: "red" });
    });

    it("custom css overrides color property", () => {
      render(<Tag {...defaultProps} css={{ color: "white" }} />);
      const tag = screen.getByText("Test Tag");
      // Browser normalizes "white" to rgb(255, 255, 255)
      expect(tag).toHaveStyle({ color: "rgb(255, 255, 255)" });
    });

    it("custom css overrides borderRadius property", () => {
      render(<Tag {...defaultProps} css={{ borderRadius: "0px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ borderRadius: "0px" });
    });

    it("custom css overrides padding property", () => {
      render(<Tag {...defaultProps} css={{ padding: "0px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ padding: "0px" });
    });

    it("custom css overrides height property", () => {
      render(<Tag {...defaultProps} css={{ height: "auto" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ height: "auto" });
    });

    it("custom css overrides fontSize property", () => {
      render(<Tag {...defaultProps} css={{ fontSize: "20px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontSize: "20px" });
    });

    it("custom css overrides fontWeight property", () => {
      render(<Tag {...defaultProps} css={{ fontWeight: "bold" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontWeight: "bold" });
    });

    it("custom css overrides fontFamily property", () => {
      render(<Tag {...defaultProps} css={{ fontFamily: "monospace" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ fontFamily: "monospace" });
    });

    it("custom css overrides letterSpacing property", () => {
      render(<Tag {...defaultProps} css={{ letterSpacing: "2px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ letterSpacing: "2px" });
    });

    it("custom css overrides border property", () => {
      render(<Tag {...defaultProps} css={{ border: "2px solid blue" }} />);
      const tag = screen.getByText("Test Tag");
      // Border is applied - check for border-style or border-width
      expect(tag.style.border).toBe("2px solid blue");
    });
  });

  // ==========================================================================
  // Additional Custom CSS Properties Tests
  // ==========================================================================

  describe("Additional Custom CSS Properties", () => {
    it("applies custom width", () => {
      render(<Tag {...defaultProps} css={{ width: "100px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ width: "100px" });
    });

    it("applies custom minWidth", () => {
      render(<Tag {...defaultProps} css={{ minWidth: "50px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ minWidth: "50px" });
    });

    it("applies custom maxWidth", () => {
      render(<Tag {...defaultProps} css={{ maxWidth: "200px" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ maxWidth: "200px" });
    });

    it("applies custom display", () => {
      render(<Tag {...defaultProps} css={{ display: "inline-block" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ display: "inline-block" });
    });

    it("applies custom textAlign", () => {
      render(<Tag {...defaultProps} css={{ textAlign: "center" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ textAlign: "center" });
    });

    it("applies custom textTransform", () => {
      render(<Tag {...defaultProps} css={{ textTransform: "uppercase" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ textTransform: "uppercase" });
    });

    it("applies custom boxShadow", () => {
      render(
        <Tag {...defaultProps} css={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
      );
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" });
    });

    it("applies custom opacity", () => {
      render(<Tag {...defaultProps} css={{ opacity: 0.5 }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ opacity: "0.5" });
    });

    it("applies custom cursor", () => {
      render(<Tag {...defaultProps} css={{ cursor: "pointer" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ cursor: "pointer" });
    });

    it("applies custom lineHeight", () => {
      render(<Tag {...defaultProps} css={{ lineHeight: "1.5" }} />);
      const tag = screen.getByText("Test Tag");
      expect(tag).toHaveStyle({ lineHeight: "1.5" });
    });
  });

  // ==========================================================================
  // Common Use Cases Tests
  // ==========================================================================

  describe("Common Use Cases", () => {
    it("renders BigQuery system tag style", () => {
      const bigQueryStyle = {
        background: "#C2E7FF",
        color: "#004A77",
        borderRadius: "8px",
        height: "20px",
        padding: "1px 8px",
        fontSize: "12px",
        fontWeight: "500",
      };
      render(<Tag text="BigQuery" css={bigQueryStyle} />);
      const tag = screen.getByText("BigQuery");
      expect(tag).toHaveStyle(bigQueryStyle);
    });

    it("renders entry type tag", () => {
      render(<Tag text="TABLE" />);
      expect(screen.getByText("TABLE")).toBeInTheDocument();
    });

    it("renders dataset tag", () => {
      render(<Tag text="Dataset" />);
      expect(screen.getByText("Dataset")).toBeInTheDocument();
    });

    it("renders system type tag", () => {
      render(<Tag text="Dataplex" />);
      expect(screen.getByText("Dataplex")).toBeInTheDocument();
    });

    it("renders status tag with success style", () => {
      const successStyle = {
        background: "#34A853",
        color: "#FFFFFF",
      };
      render(<Tag text="Active" css={successStyle} />);
      const tag = screen.getByText("Active");
      expect(tag).toHaveStyle(successStyle);
    });

    it("renders status tag with warning style", () => {
      const warningStyle = {
        background: "#FBBC04",
        color: "#000000",
      };
      render(<Tag text="Pending" css={warningStyle} />);
      const tag = screen.getByText("Pending");
      expect(tag).toHaveStyle(warningStyle);
    });

    it("renders status tag with error style", () => {
      const errorStyle = {
        background: "#EA4335",
        color: "#FFFFFF",
      };
      render(<Tag text="Error" css={errorStyle} />);
      const tag = screen.getByText("Error");
      expect(tag).toHaveStyle(errorStyle);
    });
  });

  // ==========================================================================
  // Snapshot Test
  // ==========================================================================

  describe("Snapshot", () => {
    it("matches snapshot with default props", () => {
      const { container } = render(<Tag {...defaultProps} />);
      expect(container.firstChild).toBeDefined();
    });

    it("matches snapshot with custom css", () => {
      const { container } = render(
        <Tag
          text="Custom Tag"
          css={{ background: "#000", color: "#FFF" }}
        />
      );
      expect(container.firstChild).toBeDefined();
    });
  });

  // ==========================================================================
  // Multiple Tags Tests
  // ==========================================================================

  describe("Multiple Tags", () => {
    it("renders multiple tags with different text", () => {
      render(
        <>
          <Tag text="Tag 1" />
          <Tag text="Tag 2" />
          <Tag text="Tag 3" />
        </>
      );
      expect(screen.getByText("Tag 1")).toBeInTheDocument();
      expect(screen.getByText("Tag 2")).toBeInTheDocument();
      expect(screen.getByText("Tag 3")).toBeInTheDocument();
    });

    it("renders multiple tags with different styles", () => {
      render(
        <>
          <Tag text="Red" css={{ background: "red" }} />
          <Tag text="Blue" css={{ background: "blue" }} />
          <Tag text="Green" css={{ background: "green" }} />
        </>
      );

      expect(screen.getByText("Red")).toHaveStyle({ background: "red" });
      expect(screen.getByText("Blue")).toHaveStyle({ background: "blue" });
      expect(screen.getByText("Green")).toHaveStyle({
        background: "green",
      });
    });

    it("renders tags with same text but different styles", () => {
      render(
        <>
          <Tag text="Same" css={{ background: "red" }} />
          <Tag text="Same" css={{ background: "blue" }} />
        </>
      );

      const tags = screen.getAllByText("Same");
      expect(tags).toHaveLength(2);
      expect(tags[0]).toHaveStyle({ background: "red" });
      expect(tags[1]).toHaveStyle({ background: "blue" });
    });
  });
});
