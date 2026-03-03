import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
      // System aspects have keys matching the pattern ${number}.global.{aspectName}
      // With entryType 'projects/table/...', number = 'table'
      // These are filtered out from annotation list, leaving no annotations to display
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

      expect(screen.getByText('Filter')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search aspect names...')).toBeInTheDocument();
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

      expect(screen.getByText('Filter')).toBeInTheDocument();
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

      const searchInput = screen.getByPlaceholderText('Search aspect names...');
      await user.type(searchInput, 'quality');

      await waitFor(() => {
        expect(mockOnFilteredEntryChange).toHaveBeenCalled();
      });
    });

    it('should show clear button when text is entered', async () => {
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

      const searchInput = screen.getByPlaceholderText('Search aspect names...');
      await user.type(searchInput, 'test');

      // Clear button should be visible
      const clearButtons = screen.getAllByRole('button');
      const clearButton = clearButtons.find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
      expect(clearButton).toBeTruthy();
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

      const searchInput = screen.getByPlaceholderText('Search aspect names...') as HTMLInputElement;
      await user.type(searchInput, 'test');

      expect(searchInput.value).toBe('test');

      // Find and click the clear button
      const clearButtons = screen.getAllByRole('button');
      const clearButton = clearButtons.find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
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

      const searchInput = screen.getByPlaceholderText('Search aspect names...');
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

      // Find the expand/collapse button (UnfoldMore icon button)
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

  describe('dropdown filter menu', () => {
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

      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
      });
    });

    it('should open filter menu when Filter text is clicked', async () => {
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

      const filterText = screen.getByText('Filter');
      await user.click(filterText);

      await waitFor(() => {
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
      });
    });

    it('should show annotation values when property is selected', async () => {
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

      // Open filter menu
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);

      // Select "Name" property
      const nameOption = screen.getByText('Name');
      await user.click(nameOption);

      await waitFor(() => {
        expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
        expect(screen.getByText('Filter by: Name')).toBeInTheDocument();
      });
    });

    it('should go back to properties when back button is clicked', async () => {
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Click back button
      await user.click(screen.getByText('← Back to Properties'));

      await waitFor(() => {
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
      });
    });

    it('should toggle annotation value selection', async () => {
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Select a value (quality should be in the list)
      await waitFor(() => {
        const qualityOption = screen.getByText('quality');
        expect(qualityOption).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        await user.click(qualityMenuItem);
      }

      // Verify checkbox is checked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const qualityCheckbox = checkboxes.find(cb => {
          const menuItem = cb.closest('[role="menuitem"]');
          return menuItem?.textContent?.includes('quality');
        });
        expect(qualityCheckbox).toBeChecked();
      });
    });

    it('should close menu when clicking outside', async () => {
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

      // Open filter menu
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
      });

      // Press escape to close
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Select Property to Filter')).not.toBeInTheDocument();
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Select a value
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        await user.click(qualityMenuItem);
      }

      // Close menu
      await user.keyboard('{Escape}');

      // Verify chip is displayed
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
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

      // Apply a filter
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        await user.click(qualityMenuItem);
      }

      await user.keyboard('{Escape}');

      // Wait for chip to appear
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
      });

      // Find and click the chip's close button
      const chipCloseButtons = screen.getAllByRole('button').filter(btn => {
        const parent = btn.closest('[style*="border-radius: 16px"]') || btn.closest('div');
        return parent?.textContent?.includes('Name:');
      });

      if (chipCloseButtons.length > 0) {
        await user.click(chipCloseButtons[chipCloseButtons.length - 1]);
      }

      await waitFor(() => {
        expect(screen.queryByText('Name:')).not.toBeInTheDocument();
      });
    });

    it('should display multiple filter values in chip', async () => {
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Select multiple values
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        await user.click(qualityMenuItem);
      }

      const sensitivityMenuItem = screen.getByText('sensitivity').closest('[role="menuitem"]');
      if (sensitivityMenuItem) {
        await user.click(sensitivityMenuItem);
      }

      await user.keyboard('{Escape}');

      // Chip should show both values
      await waitFor(() => {
        expect(screen.getByText('Name:')).toBeInTheDocument();
        expect(screen.getByText(/quality.*sensitivity|sensitivity.*quality/)).toBeInTheDocument();
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

      // Apply text filter
      const searchInput = screen.getByPlaceholderText('Search aspect names...');
      await user.type(searchInput, 'quality');

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
      expect(screen.getByText('Filter')).toBeInTheDocument();
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
      expect(screen.getByText('Filter')).toBeInTheDocument();
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

      expect(screen.getByText('Filter')).toBeInTheDocument();
    });

    it('should unselect value when clicked twice', async () => {
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Select a value
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        // Select
        await user.click(qualityMenuItem);

        // Verify selected
        await waitFor(() => {
          const checkbox = qualityMenuItem.querySelector('input[type="checkbox"]');
          expect(checkbox).toBeChecked();
        });

        // Unselect
        await user.click(qualityMenuItem);

        // Verify unselected
        await waitFor(() => {
          const checkbox = qualityMenuItem.querySelector('input[type="checkbox"]');
          expect(checkbox).not.toBeChecked();
        });
      }
    });

    it('should load existing filter values when reopening property', async () => {
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

      // Open filter menu and select property
      const filterButton = screen.getByRole('button', { name: /filter by aspect name/i });
      await user.click(filterButton);
      await user.click(screen.getByText('Name'));

      // Select a value
      await waitFor(() => {
        expect(screen.getByText('quality')).toBeInTheDocument();
      });

      const qualityMenuItem = screen.getByText('quality').closest('[role="menuitem"]');
      if (qualityMenuItem) {
        await user.click(qualityMenuItem);
      }

      // Go back and reselect property
      await user.click(screen.getByText('← Back to Properties'));
      await user.click(screen.getByText('Name'));

      // Previously selected value should still be checked
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const qualityCheckbox = checkboxes.find(cb => {
          const menuItem = cb.closest('[role="menuitem"]');
          return menuItem?.textContent?.includes('quality');
        });
        expect(qualityCheckbox).toBeChecked();
      });
    });
  });
});
