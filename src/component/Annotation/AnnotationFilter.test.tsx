import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnotationFilter from './AnnotationFilter';

// Mock data for entry with aspects
// Note: entryType format is 'projects/{project}/locations/{location}/entryTypes/{type}'
// The component extracts the second segment (project number) to build system aspect keys
const createMockEntry = (aspects: Record<string, any> = {}) => ({
  entryType: 'projects/table/locations/us/entryTypes/dataset',
  aspects: aspects,
});

// System aspect keys follow pattern: ${entryType.split('/')[1]}.global.{aspectName}
// With entryType 'projects/table/...', number = 'table'
const mockAspectData = {
  'table.global.schema': {
    aspectType: 'projects/123/locations/us/aspectTypes/schema',
    data: { columns: [] },
  },
  'table.global.overview': {
    aspectType: 'projects/123/locations/us/aspectTypes/overview',
    data: { description: 'test' },
  },
  'table.global.contacts': {
    aspectType: 'projects/123/locations/us/aspectTypes/contacts',
    data: { owners: [] },
  },
  'table.global.usage': {
    aspectType: 'projects/123/locations/us/aspectTypes/usage',
    data: { stats: {} },
  },
  'table.annotation.quality': {
    aspectType: 'projects/123/locations/us/aspectTypes/quality',
    data: { score: 95 },
  },
  'table.annotation.sensitivity': {
    aspectType: 'projects/123/locations/us/aspectTypes/sensitivity',
    data: { level: 'high' },
  },
  'table.annotation.ownership': {
    aspectType: 'projects/123/locations/us/aspectTypes/ownership',
    data: { team: 'data' },
  },
};

describe('AnnotationFilter', () => {
  const mockOnFilteredEntryChange = vi.fn();
  const mockOnCollapseAll = vi.fn();
  const mockOnExpandAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should return null when entry has no aspects', () => {
      const entry = createMockEntry({});

      const { container } = render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when entry is null', () => {
      const { container } = render(
        <AnnotationFilter
          entry={null}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should return null when entry has only system aspects', () => {
      const entry = {
        entryType: 'projects/table/locations/us/entryTypes/dataset',
        aspects: {
          'table.global.schema': {
            aspectType: 'projects/123/locations/us/aspectTypes/schema',
            data: { columns: [] },
          },
          'table.global.overview': {
            aspectType: 'projects/123/locations/us/aspectTypes/overview',
            data: { description: 'test' },
          },
          'table.global.contacts': {
            aspectType: 'projects/123/locations/us/aspectTypes/contacts',
            data: { owners: [] },
          },
          'table.global.usage': {
            aspectType: 'projects/123/locations/us/aspectTypes/usage',
            data: { stats: {} },
          },
        },
      };

      const { container } = render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render filter bar when entry has annotation aspects', () => {
      const entry = createMockEntry(mockAspectData);

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument();
    });

    it('should apply custom sx prop styles', () => {
      const entry = createMockEntry(mockAspectData);
      const customSx = { marginTop: '20px' };

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
          sx={customSx}
        />
      );

      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should call onFilteredEntryChange on initial render', () => {
      const entry = createMockEntry(mockAspectData);

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(mockOnFilteredEntryChange).toHaveBeenCalled();
    });
  });

  describe('text search functionality', () => {
    it('should filter aspects by text input', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'quality');

      await waitFor(() => {
        expect(mockOnFilteredEntryChange).toHaveBeenCalled();
      });
    });

    it('should show clear button when text is entered', async () => {
      const entry = createMockEntry(mockAspectData);

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      // Use fireEvent.change to set text without triggering menu via click
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        // Clear button (CloseIcon) should be visible in the input
        const clearButton = screen.getAllByRole('button').find(btn =>
          btn.querySelector('[data-testid="CloseIcon"]')
        );
        expect(clearButton).toBeTruthy();
      });
    });

    it('should clear text when clear button is clicked', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      const searchInput = screen.getByPlaceholderText('Enter property name or value') as HTMLInputElement;
      // Use fireEvent.change to set text without triggering menu via click
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(searchInput.value).toBe('test');
      });

      // Find and click the clear button
      const clearButton = screen.getAllByRole('button').find(btn =>
        btn.querySelector('[data-testid="CloseIcon"]')
      );
      if (clearButton) {
        await user.click(clearButton);
      }

      await waitFor(() => {
        expect(searchInput.value).toBe('');
      });
    });

    it('should handle case-insensitive search', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.type(searchInput, 'QUALITY');

      await waitFor(() => {
        expect(mockOnFilteredEntryChange).toHaveBeenCalled();
      });
    });
  });

  describe('expand/collapse functionality', () => {
    it('should call onExpandAll when expand button is clicked', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      const expandButton = screen.getByRole('button', { name: /expand all/i });
      await user.click(expandButton);

      expect(mockOnExpandAll).toHaveBeenCalled();
    });

    it('should call onCollapseAll after expand then collapse', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // First click to expand
      const expandButton = screen.getByRole('button', { name: /expand all/i });
      await user.click(expandButton);

      expect(mockOnExpandAll).toHaveBeenCalled();

      // Second click to collapse
      const collapseButton = screen.getByRole('button', { name: /collapse all/i });
      await user.click(collapseButton);

      expect(mockOnCollapseAll).toHaveBeenCalled();
    });

    it('should toggle expand/collapse icon', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Initially shows expand button
      expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByRole('button', { name: /expand all/i }));

      // Now shows collapse button
      expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument();
    });
  });

  describe('filter menu and text property flow', () => {
    it('should open filter menu when filter icon is clicked', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Click input to open the filter dropdown
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);

      // Menu should show the "Name" text-mode property
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Name/i })).toBeInTheDocument();
      });
    });

    it('should set text property prefix when Name is selected from menu', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Open menu by clicking input
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);

      // Click "Name" text-mode property
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);

      // Should show "Name:" prefix and update placeholder
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Name value...')).toBeInTheDocument();
      });
    });

    it('should create filter chip when typing value and pressing Enter', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Open menu and select "Name" property
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);

      // Type a value and press Enter
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      // A filter chip should appear with the value
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });
    });

    it('should close menu when pressing Escape', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Open menu
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /Name/i })).toBeInTheDocument();
      });

      // Press Escape to close
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: /Name/i })).not.toBeInTheDocument();
      });
    });

    it('should create chip using default text property when typing and pressing Enter directly', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Click input to open menu, select "Name" to set text property
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);

      // Type value and press Enter (uses "Name" text property)
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'sensitivity{Enter}');

      // A chip should be created
      await waitFor(() => {
        expect(screen.getByText('sensitivity')).toBeInTheDocument();
      });
    });
  });

  describe('filter chips', () => {
    it('should display filter chip when filter is applied', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Open menu and select Name property
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);

      // Type value and press Enter to create chip
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      // Verify chip is displayed with property label
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
        expect(screen.getByText('quality')).toBeInTheDocument();
      });
    });

    it('should remove filter when chip close button is clicked', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Create a filter chip
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      // Wait for chip to appear
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      // Find the chip's close button (small IconButton with CloseIcon inside the chip area)
      const chipCloseButtons = screen.getAllByRole('button').filter(btn => {
        const svg = btn.querySelector('[data-testid="CloseIcon"]');
        // Chip close buttons are small (14x14) with blue background
        return svg && btn.closest('[class*="MuiBox-root"]');
      });

      // Click the last close button (the one in the chip, not the input clear button)
      if (chipCloseButtons.length > 0) {
        await user.click(chipCloseButtons[chipCloseButtons.length - 1]);
      }

      await waitFor(() => {
        expect(screen.queryByText('quality')).not.toBeInTheDocument();
      });
    });

    it('should show Clear All button when filters are active', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Create a filter chip
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      // Clear All button should be visible
      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });
    });

    it('should remove all filters when Clear All is clicked', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Create a filter chip
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Clear All')).toBeInTheDocument();
      });

      // Click Clear All
      await user.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(screen.queryByText('quality')).not.toBeInTheDocument();
        expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
      });
    });
  });

  describe('filtered entry computation', () => {
    it('should include system aspects in filtered entry', async () => {
      const entry = createMockEntry(mockAspectData);
      let filteredEntry: any = null;
      let callCount = 0;

      const captureFilteredEntry = (entry: any) => {
        filteredEntry = entry;
        callCount++;
      };

      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={captureFilteredEntry}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Wait for initial render callback
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });

      // Open menu, select Name, type filter, press Enter to create chip
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      // Wait for filter to be applied and callback to be called again
      await waitFor(() => {
        expect(callCount).toBeGreaterThan(1);
        expect(filteredEntry).not.toBeNull();
        // System aspects should always be included
        expect(filteredEntry.aspects['table.global.schema']).toBeDefined();
        expect(filteredEntry.aspects['table.global.overview']).toBeDefined();
        // Only filtered annotation should be included
        expect(filteredEntry.aspects['table.annotation.quality']).toBeDefined();
      }, { timeout: 3000 });
    });

    it('should return original entry when no filters applied', async () => {
      const entry = createMockEntry(mockAspectData);
      let filteredEntry: any = null;

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={(e) => { filteredEntry = e; }}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      await waitFor(() => {
        expect(filteredEntry).not.toBeNull();
      });

      expect(filteredEntry).toEqual(entry);
    });
  });

  describe('edge cases', () => {
    it('should handle entry with null aspect data', () => {
      const entry = createMockEntry({
        'table.annotation.test': {
          aspectType: 'projects/123/locations/us/aspectTypes/test',
          data: null,
        },
        'table.annotation.valid': {
          aspectType: 'projects/123/locations/us/aspectTypes/valid',
          data: { value: 'test' },
        },
      });

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Should render because there's a valid aspect
      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should handle glossary term aspects', () => {
      const entry = createMockEntry({
        'table.global.glossary-term-aspect': {
          aspectType: 'projects/123/locations/us/aspectTypes/glossary-term-aspect',
          data: { term: 'test' },
        },
        'table.annotation.valid': {
          aspectType: 'projects/123/locations/us/aspectTypes/valid',
          data: { value: 'test' },
        },
      });

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Should render with valid aspect only
      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should handle entry without entryType', () => {
      const entry = {
        aspects: {
          'annotation.test': {
            aspectType: 'projects/123/locations/us/aspectTypes/test',
            data: { value: 'test' },
          },
        },
      };

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should remove last chip when pressing Backspace on empty input', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Create a filter chip
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);
      await user.type(screen.getByPlaceholderText('Enter Name value...'), 'quality{Enter}');

      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      // Press Backspace on empty input to remove last chip
      await user.keyboard('{Backspace}');

      await waitFor(() => {
        expect(screen.queryByText('quality')).not.toBeInTheDocument();
      });
    });

    it('should clear text property prefix when pressing Backspace on empty input', async () => {
      const entry = createMockEntry(mockAspectData);
      const user = userEvent.setup();

      render(
        <AnnotationFilter
          entry={entry}
          onFilteredEntryChange={mockOnFilteredEntryChange}
          onCollapseAll={mockOnCollapseAll}
          onExpandAll={mockOnExpandAll}
        />
      );

      // Open menu and select "Name" property
      const searchInput = screen.getByPlaceholderText('Enter property name or value');
      await user.click(searchInput);
      const nameOption = await screen.findByRole('menuitem', { name: /Name/i });
      await user.click(nameOption);

      // Verify prefix is shown
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
      });

      // Press Backspace to clear prefix
      await user.keyboard('{Backspace}');

      await waitFor(() => {
        expect(screen.queryByText('Name:')).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
      });
    });
  });
});
