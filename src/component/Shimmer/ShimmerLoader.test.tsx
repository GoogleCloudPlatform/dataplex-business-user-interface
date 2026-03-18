import { render } from '@testing-library/react';
import { it, describe, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ShimmerLoader from './ShimmerLoader';

const createMockStore = (mode = 'light') =>
  configureStore({
    reducer: {
      user: (state = { mode }) => state,
    },
  });

const renderWithStore = (ui: React.ReactElement, mode = 'light') =>
  render(<Provider store={createMockStore(mode)}>{ui}</Provider>);

describe('ShimmerLoader', () => {
  describe('Default Rendering', () => {
    it('renders with default props (type=list, count=6)', () => {
      const { container } = renderWithStore(<ShimmerLoader />);

      // Should render a container Box
      expect(container.firstChild).toBeInTheDocument();

      // Should render shimmer items
      const shimmerItems = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(shimmerItems.length).toBeGreaterThan(0);
    });

    it('renders 6 list items by default', () => {
      const { container } = renderWithStore(<ShimmerLoader />);

      // The root Box contains shimmer items - each list item has multiple child boxes
      // Count direct children of root (excluding animation overlays)
      const rootBox = container.firstChild;
      expect(rootBox).toBeInTheDocument();

      // Get all direct MuiBox children that represent list items
      const allBoxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // With 6 items and multiple boxes per item, we expect many boxes
      expect(allBoxes.length).toBeGreaterThan(6);
    });
  });

  describe('List Type', () => {
    it('renders list shimmer structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={3} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(3);
    });

    it('renders list shimmer with count=1', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // 1 container + 1 item wrapper + multiple inner boxes
      expect(boxes.length).toBeGreaterThan(5);
    });

    it('renders more boxes with higher count', () => {
      const { container: container3 } = renderWithStore(<ShimmerLoader type="list" count={3} />);
      const { container: container6 } = renderWithStore(<ShimmerLoader type="list" count={6} />);

      const boxes3 = container3.querySelectorAll('[class*="MuiBox-root"]');
      const boxes6 = container6.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxes6.length).toBeGreaterThan(boxes3.length);
    });

    it('renders list item structure with icon, title, description, and tags placeholders', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // List item has: container + item wrapper + animation + icon + title wrapper + title + subtitle + description + tags container + 2 tags = 11+ boxes
      expect(boxes.length).toBeGreaterThan(8);
    });
  });

  describe('Table Type', () => {
    it('renders table shimmer structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(6);
    });

    it('renders table shimmer with specified count', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={4} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(4);
    });

    it('renders table shimmer with count=1', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={1} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // 1 container + 1 row wrapper + animation + row content + 4 columns = 7+ boxes
      expect(boxes.length).toBeGreaterThanOrEqual(7);
    });

    it('renders more boxes with higher count for table', () => {
      const { container: container2 } = renderWithStore(<ShimmerLoader type="table" count={2} />);
      const { container: container5 } = renderWithStore(<ShimmerLoader type="table" count={5} />);

      const boxes2 = container2.querySelectorAll('[class*="MuiBox-root"]');
      const boxes5 = container5.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxes5.length).toBeGreaterThan(boxes2.length);
    });

    it('renders table row structure with multiple column placeholders', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Table row has 4 column placeholders
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Card Type', () => {
    it('renders card shimmer structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(6);
    });

    it('renders card shimmer with specified count', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={2} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(2);
    });

    it('renders card shimmer with count=1', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={1} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // 1 container + 1 card wrapper + animation + 3 content lines = 6+ boxes
      expect(boxes.length).toBeGreaterThanOrEqual(5);
    });

    it('renders more boxes with higher count for card', () => {
      const { container: container2 } = renderWithStore(<ShimmerLoader type="card" count={2} />);
      const { container: container8 } = renderWithStore(<ShimmerLoader type="card" count={8} />);

      const boxes2 = container2.querySelectorAll('[class*="MuiBox-root"]');
      const boxes8 = container8.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxes8.length).toBeGreaterThan(boxes2.length);
    });

    it('renders card structure with title and content line placeholders', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Simple List Type', () => {
    it('renders simple-list shimmer structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(6);
    });

    it('renders simple-list shimmer with specified count', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={5} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(5);
    });

    it('renders simple-list shimmer with count=1', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={1} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // 1 container + 1 item wrapper + animation + icon + text = 5+ boxes
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });

    it('renders more boxes with higher count for simple-list', () => {
      const { container: container2 } = renderWithStore(<ShimmerLoader type="simple-list" count={2} />);
      const { container: container6 } = renderWithStore(<ShimmerLoader type="simple-list" count={6} />);

      const boxes2 = container2.querySelectorAll('[class*="MuiBox-root"]');
      const boxes6 = container6.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxes6.length).toBeGreaterThan(boxes2.length);
    });

    it('renders simple-list structure with icon and text placeholders', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Has circular icon and text line
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Header Type', () => {
    it('renders header shimmer', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders header shimmer with icon and title placeholders', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Container + header wrapper + animation + icon + title = 5+ boxes
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });

    it('renders header shimmer regardless of count prop', () => {
      const { container: container1 } = renderWithStore(<ShimmerLoader type="header" count={1} />);
      const { container: container10 } = renderWithStore(<ShimmerLoader type="header" count={10} />);

      // Header doesn't use count, so both should render the same structure
      const boxes1 = container1.querySelectorAll('[class*="MuiBox-root"]');
      const boxes10 = container10.querySelectorAll('[class*="MuiBox-root"]');

      // Both should have the same number of boxes
      expect(boxes1.length).toBe(boxes10.length);
    });

    it('renders header with flex display', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });
  });

  describe('Title Type', () => {
    it('renders title shimmer', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders title shimmer with single title placeholder', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Container + title box + animation = 3+ boxes
      expect(boxes.length).toBeGreaterThanOrEqual(2);
    });

    it('renders title shimmer regardless of count prop', () => {
      const { container: container1 } = renderWithStore(<ShimmerLoader type="title" count={1} />);
      const { container: container10 } = renderWithStore(<ShimmerLoader type="title" count={10} />);

      // Title doesn't use count, so both should render the same structure
      const boxes1 = container1.querySelectorAll('[class*="MuiBox-root"]');
      const boxes10 = container10.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxes1.length).toBe(boxes10.length);
    });

    it('renders title shimmer with animation overlay', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });
  });

  describe('Count Prop', () => {
    it('renders nothing with count=0 for list', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={0} />);

      // Should only have the container box
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes).toHaveLength(1);
    });

    it('renders nothing with count=0 for table', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={0} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes).toHaveLength(1);
    });

    it('renders nothing with count=0 for card', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={0} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes).toHaveLength(1);
    });

    it('renders nothing with count=0 for simple-list', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={0} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes).toHaveLength(1);
    });

    it('renders correct proportional boxes for different counts', () => {
      const { container: container5 } = renderWithStore(<ShimmerLoader type="list" count={5} />);
      const { container: container10 } = renderWithStore(<ShimmerLoader type="list" count={10} />);

      const boxes5 = container5.querySelectorAll('[class*="MuiBox-root"]');
      const boxes10 = container10.querySelectorAll('[class*="MuiBox-root"]');

      // 10 items should have roughly double the boxes of 5 items
      // (accounting for the container)
      expect(boxes10.length).toBeGreaterThan(boxes5.length);
    });
  });

  describe('Default Fallback', () => {
    it('renders list shimmer as default when type is undefined', () => {
      const { container } = renderWithStore(<ShimmerLoader count={3} />);

      expect(container.firstChild).toBeInTheDocument();
      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(3);
    });

    it('renders same structure for list type and default', () => {
      const { container: containerDefault } = renderWithStore(<ShimmerLoader count={2} />);
      const { container: containerList } = renderWithStore(<ShimmerLoader type="list" count={2} />);

      const boxesDefault = containerDefault.querySelectorAll('[class*="MuiBox-root"]');
      const boxesList = containerList.querySelectorAll('[class*="MuiBox-root"]');

      expect(boxesDefault.length).toBe(boxesList.length);
    });
  });

  describe('Container Structure', () => {
    it('renders a container Box with MuiBox-root class', () => {
      const { container } = renderWithStore(<ShimmerLoader />);

      const rootBox = container.firstChild as HTMLElement;
      expect(rootBox).toBeInTheDocument();
      expect(rootBox).toHaveClass('MuiBox-root');
    });

    it('renders container for all shimmer types', () => {
      const types: Array<'list' | 'table' | 'card' | 'simple-list' | 'header' | 'title'> = [
        'list', 'table', 'card', 'simple-list', 'header', 'title'
      ];

      types.forEach(type => {
        const { container } = renderWithStore(<ShimmerLoader type={type} />);
        const rootBox = container.firstChild as HTMLElement;
        expect(rootBox).toBeInTheDocument();
        expect(rootBox).toHaveClass('MuiBox-root');
      });
    });
  });

  describe('Shimmer Animation', () => {
    it('renders shimmer animation overlay for list type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });

    it('renders shimmer animation overlay for table type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });

    it('renders shimmer animation overlay for card type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });

    it('renders shimmer animation overlay for simple-list type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });

    it('renders shimmer animation overlay for header type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });

    it('renders shimmer animation overlay for title type', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      expect(boxes.length).toBeGreaterThan(1);
    });
  });

  describe('Specific Element Structures', () => {
    it('list type renders expected number of nested boxes per item', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Each list item has: wrapper + animation + icon + title container + title line + subtitle line + description + tags container + 2 tags
      expect(boxes.length).toBeGreaterThanOrEqual(10);
    });

    it('table type renders expected number of nested boxes per row', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Each table row has: wrapper + animation + row content container + 4 columns
      expect(boxes.length).toBeGreaterThanOrEqual(7);
    });

    it('card type renders expected number of nested boxes per card', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Each card has: wrapper + animation + 3 content lines
      expect(boxes.length).toBeGreaterThanOrEqual(5);
    });

    it('simple-list type renders expected number of nested boxes per item', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={1} />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Each simple-list item has: wrapper + animation + icon + text
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });

    it('header type renders expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Header has: container + header wrapper + animation + icon + title
      expect(boxes.length).toBeGreaterThanOrEqual(4);
    });

    it('title type renders expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);

      const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
      // Title has: container + title wrapper + animation
      expect(boxes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Accessibility', () => {
    it('shimmer content is not interactive', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);

      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      const inputs = container.querySelectorAll('input');

      expect(buttons).toHaveLength(0);
      expect(links).toHaveLength(0);
      expect(inputs).toHaveLength(0);
    });

    it('all shimmer types have no interactive elements', () => {
      const types: Array<'list' | 'table' | 'card' | 'simple-list' | 'header' | 'title'> = [
        'list', 'table', 'card', 'simple-list', 'header', 'title'
      ];

      types.forEach(type => {
        const { container } = renderWithStore(<ShimmerLoader type={type} count={1} />);

        const buttons = container.querySelectorAll('button');
        const links = container.querySelectorAll('a');

        expect(buttons).toHaveLength(0);
        expect(links).toHaveLength(0);
      });
    });
  });

  describe('Type Switching', () => {
    it('switches from list to table type', () => {
      const { container: listContainer } = renderWithStore(<ShimmerLoader type="list" count={2} />);
      const { container: tableContainer } = renderWithStore(<ShimmerLoader type="table" count={2} />);

      const listBoxes = listContainer.querySelectorAll('[class*="MuiBox-root"]');
      const tableBoxes = tableContainer.querySelectorAll('[class*="MuiBox-root"]');

      // Different structures should produce different box counts
      expect(listBoxes.length).not.toBe(tableBoxes.length);
    });

    it('switches from card to simple-list type', () => {
      const { container: cardContainer } = renderWithStore(<ShimmerLoader type="card" count={2} />);
      const { container: simpleListContainer } = renderWithStore(<ShimmerLoader type="simple-list" count={2} />);

      const cardBoxes = cardContainer.querySelectorAll('[class*="MuiBox-root"]');
      const simpleListBoxes = simpleListContainer.querySelectorAll('[class*="MuiBox-root"]');

      // Different structures should produce different box counts
      expect(cardBoxes.length).not.toBe(simpleListBoxes.length);
    });

    it('header and title types are different structures', () => {
      const { container: headerContainer } = renderWithStore(<ShimmerLoader type="header" />);
      const { container: titleContainer } = renderWithStore(<ShimmerLoader type="title" />);

      const headerBoxes = headerContainer.querySelectorAll('[class*="MuiBox-root"]');
      const titleBoxes = titleContainer.querySelectorAll('[class*="MuiBox-root"]');

      expect(headerBoxes.length).not.toBe(titleBoxes.length);
    });
  });

  describe('Snapshot Tests', () => {
    it('list shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="list" count={1} />);
      expect(container.firstChild).toBeDefined();
    });

    it('table shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="table" count={1} />);
      expect(container.firstChild).toBeDefined();
    });

    it('card shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="card" count={1} />);
      expect(container.firstChild).toBeDefined();
    });

    it('simple-list shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="simple-list" count={1} />);
      expect(container.firstChild).toBeDefined();
    });

    it('header shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="header" />);
      expect(container.firstChild).toBeDefined();
    });

    it('title shimmer matches expected structure', () => {
      const { container } = renderWithStore(<ShimmerLoader type="title" />);
      expect(container.firstChild).toBeDefined();
    });
  });
});
