import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Layout from "./Layout";

// Mock child components
vi.mock("../GlobalSidebar/GlobalSidebar", () => ({
  default: vi.fn(() => (
    <div data-testid="global-sidebar">
      GlobalSidebar
    </div>
  )),
}));

vi.mock("../Navbar/Navbar", () => ({
  default: vi.fn(
    ({
      searchBar,
      searchNavigate,
    }: {
      searchBar: boolean;
      searchNavigate: boolean;
    }) => (
      <div
        data-testid="navbar"
        data-search-bar={searchBar}
        data-search-navigate={searchNavigate}
      >
        Navbar
      </div>
    )
  ),
}));

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Layout Structure", () => {
    it("renders app-layout container", () => {
      const { container } = render(
        <Layout>
          <div data-testid="child-content">Child Content</div>
        </Layout>
      );

      expect(container.querySelector(".app-layout")).toBeInTheDocument();
    });

    it("renders GlobalSidebar component", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(screen.getByTestId("global-sidebar")).toBeInTheDocument();
      expect(screen.getByText("GlobalSidebar")).toBeInTheDocument();
    });

    it("renders main-content-area container", () => {
      const { container } = render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(container.querySelector(".main-content-area")).toBeInTheDocument();
    });

    it("renders navbar inside main-content-area", () => {
      const { container } = render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      const mainContentArea = container.querySelector(".main-content-area");
      expect(mainContentArea?.querySelector('[data-testid="navbar"]')).toBeInTheDocument();
    });

    it("renders page-content container", () => {
      const { container } = render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(container.querySelector(".page-content")).toBeInTheDocument();
    });

    it("renders children in page-content", () => {
      const { container } = render(
        <Layout>
          <div data-testid="child-content">Child Content</div>
        </Layout>
      );

      const pageContent = container.querySelector(".page-content");
      expect(pageContent).toBeInTheDocument();
      expect(pageContent?.querySelector('[data-testid="child-content"]')).toBeInTheDocument();
    });

    it("passes default props to Navbar when not specified", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-bar", "false");
      expect(navbar).toHaveAttribute("data-search-navigate", "true");
    });

    it("passes custom searchBar prop to Navbar", () => {
      render(
        <Layout searchBar={true}>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-bar", "true");
    });

    it("passes custom searchNavigate prop to Navbar", () => {
      render(
        <Layout searchNavigate={false}>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-navigate", "false");
    });

    it("passes both custom props to Navbar", () => {
      render(
        <Layout searchBar={true} searchNavigate={false}>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-bar", "true");
      expect(navbar).toHaveAttribute("data-search-navigate", "false");
    });
  });

  describe("Children Rendering", () => {
    it("renders single child element", () => {
      render(
        <Layout>
          <div data-testid="single-child">Single Child</div>
        </Layout>
      );

      expect(screen.getByTestId("single-child")).toBeInTheDocument();
      expect(screen.getByText("Single Child")).toBeInTheDocument();
    });

    it("renders multiple children elements", () => {
      render(
        <Layout>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </Layout>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });

    it("renders text children", () => {
      render(<Layout>Plain text content</Layout>);

      expect(screen.getByText("Plain text content")).toBeInTheDocument();
    });

    it("renders nested children", () => {
      render(
        <Layout>
          <div data-testid="parent">
            <div data-testid="nested-child">Nested Content</div>
          </div>
        </Layout>
      );

      expect(screen.getByTestId("parent")).toBeInTheDocument();
      expect(screen.getByTestId("nested-child")).toBeInTheDocument();
      expect(screen.getByText("Nested Content")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("renders GlobalSidebar component", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(screen.getByTestId("global-sidebar")).toBeInTheDocument();
      expect(screen.getByText("GlobalSidebar")).toBeInTheDocument();
    });

    it("renders Navbar component", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(screen.getByTestId("navbar")).toBeInTheDocument();
      expect(screen.getByText("Navbar")).toBeInTheDocument();
    });

    it("renders both GlobalSidebar and Navbar", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      expect(screen.getByTestId("global-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("navbar")).toBeInTheDocument();
    });
  });

  describe("Props Interface", () => {
    it("accepts children prop", () => {
      const { container } = render(
        <Layout>
          <span>Test Children</span>
        </Layout>
      );

      expect(container.querySelector("span")).toHaveTextContent("Test Children");
    });

    it("accepts optional searchBar prop", () => {
      expect(() =>
        render(
          <Layout>
            <div>Child</div>
          </Layout>
        )
      ).not.toThrow();
    });

    it("accepts optional searchNavigate prop", () => {
      expect(() =>
        render(
          <Layout>
            <div>Child</div>
          </Layout>
        )
      ).not.toThrow();
    });

    it("uses default value false for searchBar", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-bar", "false");
    });

    it("uses default value true for searchNavigate", () => {
      render(
        <Layout>
          <div>Child</div>
        </Layout>
      );

      const navbar = screen.getByTestId("navbar");
      expect(navbar).toHaveAttribute("data-search-navigate", "true");
    });
  });

  describe("Module Export", () => {
    it("exports Layout as default export", () => {
      expect(Layout).toBeDefined();
      expect(typeof Layout).toBe("function");
    });
  });
});
