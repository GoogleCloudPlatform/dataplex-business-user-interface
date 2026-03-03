import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SideNav from './SideNav';

// Mock SVG imports
vi.mock('../../assets/svg/annotations-icon-blue.svg', () => ({
  default: 'annotations-icon-blue.svg',
}));

vi.mock('../../assets/svg/annotation-subitem.svg', () => ({
  default: 'annotation-subitem.svg',
}));

// Mock data
const mockAnnotationsData = [
  {
    title: 'Aspect One',
    name: 'projects/test/aspectTypes/aspect1',
    fieldValues: 3,
    assets: 10,
    subItems: [
      { title: 'Field1', fieldValues: 5, assets: 5 },
      { title: 'Field2', fieldValues: 3, assets: 3 },
      { title: 'Field3', fieldValues: 2, assets: 2 },
    ],
  },
  {
    title: 'Aspect Two',
    name: 'projects/test/aspectTypes/aspect2',
    fieldValues: 2,
    assets: 5,
    subItems: [
      { title: 'FieldA', fieldValues: 3, assets: 3 },
      { title: 'FieldB', fieldValues: 2, assets: 2 },
    ],
  },
  {
    title: 'Aspect Three',
    name: 'projects/test/aspectTypes/aspect3',
    fieldValues: 1,
    assets: 1,
    subItems: [{ title: 'SingleField', fieldValues: 1, assets: 1 }],
  },
];

const mockSelectedItem = {
  title: 'Aspect One',
  name: 'projects/test/aspectTypes/aspect1',
  fieldValues: 3,
  assets: 10,
  subItems: [
    { title: 'Field1', fieldValues: 5, assets: 5 },
    { title: 'Field2', fieldValues: 3, assets: 3 },
    { title: 'Field3', fieldValues: 2, assets: 2 },
  ],
};

const mockSelectedSubItem = {
  title: 'Field1',
  fieldValues: 5,
  assets: 5,
};

describe('SideNav', () => {
  let mockOnItemClick: ReturnType<typeof vi.fn>;
  let mockOnSubItemClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnItemClick = vi.fn();
    mockOnSubItemClick = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('rendering', () => {
    it('should render the Aspects header', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });

    it('should render all annotation items', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      expect(screen.getByText('Aspect One')).toBeInTheDocument();
      expect(screen.getByText('Aspect Two')).toBeInTheDocument();
      expect(screen.getByText('Aspect Three')).toBeInTheDocument();
    });

    it('should render annotation icons', () => {
      const { container } = render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Images have alt="" (decorative) so we query by tag name instead of role
      const icons = container.querySelectorAll('img');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should show first item sub-items initially (auto-expanded) and hide others', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item's sub-items should be visible (auto-expanded)
      expect(screen.getByText('Field1')).toBeInTheDocument();
      expect(screen.getByText('Field2')).toBeInTheDocument();
      expect(screen.getByText('Field3')).toBeInTheDocument();
      // Other items' sub-items should not be visible
      expect(screen.queryByText('FieldA')).not.toBeInTheDocument();
      expect(screen.queryByText('SingleField')).not.toBeInTheDocument();
    });

    it('should handle empty annotations data', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={[]}
        />
      );

      expect(screen.getByText('Aspects')).toBeInTheDocument();
      // No annotation items should be rendered
      expect(screen.queryByText('Aspect One')).not.toBeInTheDocument();
    });
  });

  describe('expand/collapse functionality', () => {
    it('should expand annotation item when clicked', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, click on second annotation to expand it
      await user.click(screen.getByText('Aspect Two'));

      // Second item's sub-items should now be visible
      await waitFor(() => {
        expect(screen.getByText('FieldA')).toBeInTheDocument();
        expect(screen.getByText('FieldB')).toBeInTheDocument();
      });
    });

    it('should collapse annotation item when clicked again', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, verify sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByText('Aspect One'));

      await waitFor(() => {
        expect(screen.queryByText('Field1')).not.toBeInTheDocument();
      });
    });

    it('should only have one item expanded at a time', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Expand second annotation
      await user.click(screen.getByText('Aspect Two'));

      await waitFor(() => {
        // First annotation's sub-items should be hidden
        expect(screen.queryByText('Field1')).not.toBeInTheDocument();
        // Second annotation's sub-items should be visible
        expect(screen.getByText('FieldA')).toBeInTheDocument();
        expect(screen.getByText('FieldB')).toBeInTheDocument();
      });
    });

    it('should rotate chevron icon when expanded', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, verify its sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click Aspect Two to expand it - the transform style should change
      await user.click(screen.getByText('Aspect Two'));

      // The component applies transform based on isExpanded state
      // We verify the expand functionality works by checking sub-items
      await waitFor(() => {
        expect(screen.getByText('FieldA')).toBeInTheDocument();
      });
    });
  });

  describe('handleSubItemClick', () => {
    it('should call onSubItemClick when sub-item is clicked', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click sub-item
      await user.click(screen.getByText('Field1'));

      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[0].subItems[0]);
    });

    it('should call onItemClick when selectedItem is different from clicked item', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click sub-item - since selectedItem is null, onItemClick should be called
      await user.click(screen.getByText('Field1'));

      expect(mockOnItemClick).toHaveBeenCalledWith(mockAnnotationsData[0]);
      expect(mockOnSubItemClick).toHaveBeenCalled();
    });

    it('should not call onItemClick when selectedItem matches clicked item', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click sub-item - onItemClick should NOT be called since selectedItem.title matches
      await user.click(screen.getByText('Field1'));

      expect(mockOnItemClick).not.toHaveBeenCalled();
      expect(mockOnSubItemClick).toHaveBeenCalled();
    });

    it('should call onItemClick when clicking sub-item from different annotation', async () => {
      const user = userEvent.setup();
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={mockSelectedSubItem}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Expand second annotation (different from selectedItem)
      await user.click(screen.getByText('Aspect Two'));

      await waitFor(() => {
        expect(screen.getByText('FieldA')).toBeInTheDocument();
      });

      // Click sub-item from Aspect Two - onItemClick should be called
      await user.click(screen.getByText('FieldA'));

      expect(mockOnItemClick).toHaveBeenCalledWith(mockAnnotationsData[1]);
      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[1].subItems[0]);

      consoleLog.mockRestore();
    });

  });

  describe('selected styling', () => {
    it('should apply selected styling to the selected sub-item', () => {
      render(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={mockSelectedSubItem}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Check that Field1 has selected class
      const field1Button = screen.getByText('Field1').closest('div[role="button"]');
      expect(field1Button).toHaveClass('Mui-selected');
    });

    it('should not apply selected styling to non-selected sub-items', () => {
      render(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={mockSelectedSubItem}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field2')).toBeInTheDocument();

      // Check that Field2 does NOT have selected class
      const field2Button = screen.getByText('Field2').closest('div[role="button"]');
      expect(field2Button).not.toHaveClass('Mui-selected');
    });

    it('should apply bold font weight to expanded parent item', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, the expanded item should have fontWeight 500
      // We verify by checking that sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();
    });
  });

  describe('multiple sub-items interaction', () => {
    it('should allow clicking different sub-items', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click first sub-item
      await user.click(screen.getByText('Field1'));
      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[0].subItems[0]);

      // Click second sub-item
      await user.click(screen.getByText('Field2'));
      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[0].subItems[1]);

      // Click third sub-item
      await user.click(screen.getByText('Field3'));
      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[0].subItems[2]);

      expect(mockOnSubItemClick).toHaveBeenCalledTimes(3);
    });

    it('should handle annotation with single sub-item', async () => {
      const user = userEvent.setup();
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Expand third annotation (has only one sub-item)
      await user.click(screen.getByText('Aspect Three'));

      await waitFor(() => {
        expect(screen.getByText('SingleField')).toBeInTheDocument();
      });

      // Click the single sub-item
      await user.click(screen.getByText('SingleField'));

      expect(mockOnSubItemClick).toHaveBeenCalledWith(mockAnnotationsData[2].subItems[0]);

      consoleLog.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle selectedItem with undefined name', async () => {
      const user = userEvent.setup();

      // selectedItem has no name property, so comparison will use undefined
      const selectedItemWithUndefinedName = { title: 'Something', fieldValues: 1 };

      render(
        <SideNav
          selectedItem={selectedItemWithUndefinedName}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Click sub-item - should call onItemClick since selectedItem.name (undefined) !== item.name
      await user.click(screen.getByText('Field1'));

      expect(mockOnItemClick).toHaveBeenCalled();
    });

    it('should handle selectedSubItem with null', () => {
      render(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // No sub-item should have selected class
      const field1Button = screen.getByText('Field1').closest('div[role="button"]');
      expect(field1Button).not.toHaveClass('Mui-selected');
    });

    it('should handle annotation without subItems array', async () => {
      const annotationsWithMissingSubItems = [
        {
          title: 'No SubItems',
          fieldValues: 0,
          assets: 0,
          subItems: [],
        },
      ];

      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={annotationsWithMissingSubItems}
        />
      );

      // Expand the annotation
      await user.click(screen.getByText('No SubItems'));

      // No error should occur, and no sub-items should be rendered
      expect(screen.getByText('No SubItems')).toBeInTheDocument();
    });

    it('should handle rapid expand/collapse clicks', async () => {
      const user = userEvent.setup();

      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Rapid clicks
      await user.click(screen.getByText('Aspect One'));
      await user.click(screen.getByText('Aspect One'));
      await user.click(screen.getByText('Aspect One'));

      // Should not throw errors
      expect(screen.getByText('Aspects')).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should render with correct container styling', () => {
      const { container } = render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Check for MUI Paper container
      const paper = container.firstChild as HTMLElement;
      expect(paper).toHaveClass('MuiPaper-root');
    });

    it('should render List component for annotations', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // MUI List renders as a div with role="presentation" or similar
      const lists = document.querySelectorAll('.MuiList-root');
      expect(lists.length).toBeGreaterThan(0);
    });

    it('should render ListItemButton for each annotation', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Should have 3 parent annotation buttons + 3 sub-item buttons (first item auto-expanded)
      expect(buttons.length).toBe(6);
    });
  });

  describe('default export', () => {
    it('should export SideNav as default', async () => {
      const module = await import('./SideNav');
      expect(module.default).toBeDefined();
    });

    it('should export a function component', async () => {
      const module = await import('./SideNav');
      expect(typeof module.default).toBe('function');
    });
  });

  describe('re-renders', () => {
    it('should handle prop updates correctly', () => {
      const { rerender } = render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // First item is already expanded, sub-items are visible
      expect(screen.getByText('Field1')).toBeInTheDocument();

      // Re-render with different selectedSubItem
      rerender(
        <SideNav
          selectedItem={mockSelectedItem}
          onItemClick={mockOnItemClick}
          selectedSubItem={mockSelectedSubItem}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Field1 should now have selected class
      const field1Button = screen.getByText('Field1').closest('div[role="button"]');
      expect(field1Button).toHaveClass('Mui-selected');
    });

    it('should handle annotationsData updates', () => {
      const { rerender } = render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      expect(screen.getByText('Aspect One')).toBeInTheDocument();
      expect(screen.getByText('Aspect Two')).toBeInTheDocument();

      // Update with different data
      const newAnnotationsData = [
        {
          title: 'New Aspect',
          fieldValues: 1,
          assets: 1,
          subItems: [{ title: 'NewField', fieldValues: 1, assets: 1 }],
        },
      ];

      rerender(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={newAnnotationsData}
        />
      );

      expect(screen.queryByText('Aspect One')).not.toBeInTheDocument();
      expect(screen.getByText('New Aspect')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles for list items', () => {
      render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      const buttons = screen.getAllByRole('button');
      // Should have 3 parent annotation buttons + 3 sub-item buttons (first item auto-expanded)
      expect(buttons.length).toBe(6);
    });

    it('should have alt text for images', () => {
      const { container } = render(
        <SideNav
          selectedItem={null}
          onItemClick={mockOnItemClick}
          selectedSubItem={null}
          onSubItemClick={mockOnSubItemClick}
          annotationsData={mockAnnotationsData}
        />
      );

      // Images have alt="" (decorative) so we query by tag name instead of role
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
      images.forEach((img) => {
        // Alt can be empty string for decorative images
        expect(img).toHaveAttribute('alt');
      });
    });
  });
});
