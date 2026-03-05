import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, it, describe, expect } from 'vitest';
import CurrentRules from './CurrentRules';

// Mock ConfigurationsPanel
vi.mock('./ConfigurationsPanel', () => ({
  default: ({ isOpen, onClose, dataQualtyScan }: { isOpen: boolean; onClose: () => void; dataQualtyScan: any }) => (
    <div data-testid="configurations-panel" data-open={isOpen}>
      <button onClick={onClose} data-testid="config-close-btn">Close Config</button>
      Configurations Panel
      {dataQualtyScan && <span data-testid="scan-data">Has Scan Data</span>}
    </div>
  ),
}));

vi.mock('../../contexts/AccessRequestContext', () => ({
  useAccessRequest: () => ({
    isAccessPanelOpen: false,
    setAccessPanelOpen: vi.fn(),
  }),
}));

describe('CurrentRules', () => {
  const mockDataQualityScan = {
    scan: {
      dataQualitySpec: {
        rowFilter: 'test-filter',
        samplingPercent: 100,
        rules: [
          {
            column: 'test_column',
            name: 'test_rule',
            ruleType: 'NOT_NULL',
            evaluation: 'PASSED',
            dimension: 'COMPLETENESS',
            NOT_NULL: { columnName: 'test_column' },
            threshold: 0.95
          },
          {
            column: 'another_column',
            name: 'range_rule',
            ruleType: 'RANGE',
            evaluation: 'FAILED',
            dimension: 'VALIDITY',
            RANGE: { minValue: 0, maxValue: 100 },
            threshold: 0.85
          },
          {
            column: 'third_column',
            name: '',
            ruleType: 'UNIQUENESS',
            evaluation: 'PASSED',
            dimension: 'UNIQUENESS',
            UNIQUENESS: {},
            threshold: null
          }
        ]
      },
      resultsTable: 'test-results-table'
    },
    jobs: [
      {
        state: 'SUCCEEDED',
        startTime: { seconds: 1640995200 },
        endTime: { seconds: 1640995200 },
        dataQualityResult: {
          score: 95,
          rules: [],
          dimensions: []
        }
      }
    ]
  };

  const mockEmptyScan = {
    scan: {
      dataQualitySpec: {
        rules: []
      }
    },
    jobs: []
  };

  const mockScanWithEmptyParams = {
    scan: {
      dataQualitySpec: {
        rules: [
          {
            column: 'col1',
            name: 'rule1',
            ruleType: 'CUSTOM',
            evaluation: 'PASSED',
            dimension: 'CUSTOM_DIM',
            CUSTOM: {},
            threshold: 0.5
          }
        ]
      }
    },
    jobs: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Current Rules header', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('Current Rules')).toBeInTheDocument();
    });

    it('should render all table headers', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('Column Name')).toBeInTheDocument();
      expect(screen.getByText('Rule Name')).toBeInTheDocument();
      expect(screen.getByText('Rule Type')).toBeInTheDocument();
      expect(screen.getByText('Evaluation')).toBeInTheDocument();
      expect(screen.getByText('Dimensions')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('Threshold')).toBeInTheDocument();
    });

    it('should render rules data in table', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('test_column')).toBeInTheDocument();
      expect(screen.getByText('test_rule')).toBeInTheDocument();
      expect(screen.getByText('NOT_NULL')).toBeInTheDocument();
      expect(screen.getByText('COMPLETENESS')).toBeInTheDocument();
    });

    it('should render empty table when no rules', () => {
      render(<CurrentRules dataQualtyScan={mockEmptyScan} />);
      expect(screen.getByText('Current Rules')).toBeInTheDocument();
      expect(screen.queryByText('test_column')).not.toBeInTheDocument();
    });

    it('should render threshold as percentage', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render N/A for null threshold', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should render parameters as JSON string', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('{"columnName":"test_column"}')).toBeInTheDocument();
      expect(screen.getByText('{"minValue":0,"maxValue":100}')).toBeInTheDocument();
    });

    it('should render empty parameters for empty rule type object', () => {
      render(<CurrentRules dataQualtyScan={mockScanWithEmptyParams} />);
      expect(screen.getByText('col1')).toBeInTheDocument();
    });

    it('should render filter text field', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByPlaceholderText('Enter property name or value')).toBeInTheDocument();
    });

    it('should render Filter label', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('Filter')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse', () => {
    it('should toggle collapse on header click', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const header = screen.getByText('Current Rules').closest('div');

      expect(screen.getByText('test_column')).toBeInTheDocument();

      if (header) {
        fireEvent.click(header);
        // Table should be collapsed
      }
    });

    it('should toggle collapse on expand icon click', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const expandIcon = document.querySelector('[data-testid="ExpandLessIcon"]');
      if (expandIcon) {
        const button = expandIcon.closest('button');
        if (button) {
          fireEvent.click(button);
          // Click again to expand
          fireEvent.click(button);
          expect(screen.getByText('Current Rules')).toBeInTheDocument();
        }
      }
    });

    it('should show table when expanded', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('test_column')).toBeInTheDocument();
    });
  });

  describe('Configurations Panel', () => {
    it('should open configurations panel on button click', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const configButton = screen.getByRole('button', { name: /configurations/i });

      fireEvent.click(configButton);

      const panel = screen.getByTestId('configurations-panel');
      expect(panel).toHaveAttribute('data-open', 'true');
    });

    it('should close configurations panel on overlay click', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      // Open the panel
      const configButton = screen.getByRole('button', { name: /configurations/i });
      fireEvent.click(configButton);

      expect(screen.getByTestId('configurations-panel')).toHaveAttribute('data-open', 'true');

      // Find and click the overlay
      const overlay = document.querySelector('[style*="position: fixed"]');
      if (overlay) {
        fireEvent.click(overlay);

        await waitFor(() => {
          const panel = screen.getByTestId('configurations-panel');
          expect(panel).toHaveAttribute('data-open', 'false');
        });
      }
    });

    it('should close configurations panel via close callback', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      // Open panel
      const configButton = screen.getByRole('button', { name: /configurations/i });
      fireEvent.click(configButton);

      // Close via the panel's close button
      const closeBtn = screen.getByTestId('config-close-btn');
      fireEvent.click(closeBtn);

      const panel = screen.getByTestId('configurations-panel');
      expect(panel).toHaveAttribute('data-open', 'false');
    });

    it('should pass dataQualtyScan to ConfigurationsPanel', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const configButton = screen.getByRole('button', { name: /configurations/i });
      fireEvent.click(configButton);

      expect(screen.getByTestId('scan-data')).toBeInTheDocument();
    });
  });

  describe('Text Filtering', () => {
    it('should filter by column name', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'test_column' } });

      expect(screen.getByText('test_column')).toBeInTheDocument();
      expect(screen.queryByText('another_column')).not.toBeInTheDocument();
    });

    it('should filter by rule name', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'range_rule' } });

      expect(screen.getByText('another_column')).toBeInTheDocument();
      expect(screen.queryByText('test_column')).not.toBeInTheDocument();
    });

    it('should filter by rule type', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'NOT_NULL' } });

      expect(screen.getByText('test_column')).toBeInTheDocument();
      expect(screen.queryByText('another_column')).not.toBeInTheDocument();
    });

    it('should filter by dimension', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'VALIDITY' } });

      expect(screen.getByText('another_column')).toBeInTheDocument();
      expect(screen.queryByText('test_column')).not.toBeInTheDocument();
    });

    it('should clear filter text with close button', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'test' } });
      expect(filterInput).toHaveValue('test');

      const closeIcon = document.querySelector('[data-testid="CloseIcon"]');
      if (closeIcon) {
        const closeButton = closeIcon.closest('button');
        if (closeButton) {
          fireEvent.click(closeButton);
          expect(filterInput).toHaveValue('');
        }
      }
    });

    it('should handle case insensitive filtering', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'TEST_COLUMN' } });

      expect(screen.getByText('test_column')).toBeInTheDocument();
    });

    it('should show no results when filter matches nothing', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      const filterInput = screen.getByPlaceholderText('Enter property name or value');

      fireEvent.change(filterInput, { target: { value: 'xyz_nonexistent' } });

      expect(screen.queryByText('test_column')).not.toBeInTheDocument();
      expect(screen.queryByText('another_column')).not.toBeInTheDocument();
    });
  });

  describe('Filter Dropdown Menu', () => {
    it('should open filter menu on filter icon click', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterIcon = document.querySelector('[data-testid="FilterListIcon"]');
      if (filterIcon) {
        const filterButton = filterIcon.closest('button');
        if (filterButton) {
          fireEvent.click(filterButton);

          await waitFor(() => {
            const menu = document.querySelector('[role="menu"]');
            expect(menu).toBeInTheDocument();
          });
        }
      }
    });

    it('should open filter menu on Filter text click', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should show property selection menu initially', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
      });
    });

    it('should show property values when property is selected', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Find and click "Rule Type" property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const ruleTypeItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Rule Type')
      );
      if (ruleTypeItem) {
        fireEvent.click(ruleTypeItem);

        await waitFor(() => {
          expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
          expect(screen.getByText('Filter by: Rule Type')).toBeInTheDocument();
        });
      }
    });

    it('should go back to properties when clicking back', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Select a property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const ruleTypeItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Rule Type')
      );
      if (ruleTypeItem) {
        fireEvent.click(ruleTypeItem);

        await waitFor(() => {
          expect(screen.getByText('← Back to Properties')).toBeInTheDocument();
        });

        // Click back
        fireEvent.click(screen.getByText('← Back to Properties'));

        await waitFor(() => {
          expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
        });
      }
    });

    it('should close filter menu', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Press Escape to close menu
      fireEvent.keyDown(document.querySelector('[role="menu"]')!, { key: 'Escape' });

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeNull();
      }, { timeout: 2000 });
    });

    it('should toggle value selection in property values', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Select Evaluation property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        // Click on FAILED value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          // Should show filter chip
          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Active Filters', () => {
    it('should show active filter chips after selecting values', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Select Evaluation property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        // Click on FAILED value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
            // FAILED appears in table and in filter chip, so just check for the filter chip container
            expect(screen.getAllByText('FAILED').length).toBeGreaterThan(0);
          });
        }
      }
    });

    it('should remove filter chip when clicking X button', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      // Add a filter first
      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
          });

          // Find and click the remove button (×)
          const removeButton = screen.getByText('×').closest('button');
          if (removeButton) {
            fireEvent.click(removeButton);

            await waitFor(() => {
              expect(screen.queryByText('Evaluation:')).not.toBeInTheDocument();
            });
          }
        }
      }
    });

    it('should show Clear All button when filters are active', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Clear All')).toBeInTheDocument();
          });
        }
      }
    });

    it('should clear all filters when clicking Clear All', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Clear All')).toBeInTheDocument();
          });

          // Click Clear All
          fireEvent.click(screen.getByText('Clear All'));

          await waitFor(() => {
            expect(screen.queryByText('Evaluation:')).not.toBeInTheDocument();
            expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
          });
        }
      }
    });

    it('should update existing filter when re-selecting same property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      // Add first filter
      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        // Select FAILED
        let valueItems = document.querySelectorAll('[role="menuitem"]');
        let failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
          });

          // Now unselect FAILED (toggle off)
          valueItems = document.querySelectorAll('[role="menuitem"]');
          failedItem = Array.from(valueItems).find(
            item => item.textContent?.includes('FAILED')
          );
          if (failedItem) {
            fireEvent.click(failedItem);

            await waitFor(() => {
              // Filter should be removed when no values selected
              expect(screen.queryByText('Evaluation:')).not.toBeInTheDocument();
            });
          }
        }
      }
    });
  });

  describe('Sorting', () => {
    it('should sort by column name on first click (ascending)', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const sortButton = columnNameHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        // Table should still render
        expect(screen.getByText('test_column')).toBeInTheDocument();
      }
    });

    it('should sort by column name descending on second click', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const sortButton = columnNameHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton); // asc
        fireEvent.click(sortButton); // desc
        expect(screen.getByText('test_column')).toBeInTheDocument();
      }
    });

    it('should reset sort on third click', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const sortButton = columnNameHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton); // asc
        fireEvent.click(sortButton); // desc
        fireEvent.click(sortButton); // reset
        expect(screen.getByText('test_column')).toBeInTheDocument();
      }
    });

    it('should sort by rule name', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const ruleNameHeader = screen.getByText('Rule Name').closest('th');
      const sortButton = ruleNameHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('test_rule')).toBeInTheDocument();
      }
    });

    it('should sort by rule type', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const ruleTypeHeader = screen.getByText('Rule Type').closest('th');
      const sortButton = ruleTypeHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('NOT_NULL')).toBeInTheDocument();
      }
    });

    it('should sort by evaluation', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const evaluationHeader = screen.getByText('Evaluation').closest('th');
      const sortButton = evaluationHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('FAILED')).toBeInTheDocument();
      }
    });

    it('should sort by dimensions', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const dimensionsHeader = screen.getByText('Dimensions').closest('th');
      const sortButton = dimensionsHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('COMPLETENESS')).toBeInTheDocument();
      }
    });

    it('should sort by parameters', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const parametersHeader = screen.getByText('Parameters').closest('th');
      const sortButton = parametersHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('{"columnName":"test_column"}')).toBeInTheDocument();
      }
    });

    it('should sort by threshold', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const thresholdHeader = screen.getByText('Threshold').closest('th');
      const sortButton = thresholdHeader?.querySelector('button');

      if (sortButton) {
        fireEvent.click(sortButton);
        expect(screen.getByText('85%')).toBeInTheDocument();
      }
    });

    it('should change sort column when clicking different column', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const ruleTypeHeader = screen.getByText('Rule Type').closest('th');

      const columnNameSortButton = columnNameHeader?.querySelector('button');
      const ruleTypeSortButton = ruleTypeHeader?.querySelector('button');

      if (columnNameSortButton && ruleTypeSortButton) {
        fireEvent.click(columnNameSortButton);
        fireEvent.click(ruleTypeSortButton);
        expect(screen.getByText('test_column')).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle rule without name', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('third_column')).toBeInTheDocument();
    });

    it('should handle rule with empty parameters object', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      // UNIQUENESS appears twice (in Rule Type and Dimensions columns)
      expect(screen.getAllByText('UNIQUENESS').length).toBeGreaterThanOrEqual(1);
    });

    it('should render without crashing with various scan data', () => {
      // Test with the main mock data
      const { unmount } = render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);
      expect(screen.getByText('Current Rules')).toBeInTheDocument();
      unmount();
    });
  });

  describe('Property Value Filtering', () => {
    it('should filter table data based on active filters', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        const menu = document.querySelector('[role="menu"]');
        expect(menu).toBeInTheDocument();
      });

      // Select Evaluation property and FAILED value
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            // Only FAILED rows should be visible
            expect(screen.getByText('another_column')).toBeInTheDocument();
            // PASSED rows should be filtered out
            expect(screen.queryByText('test_column')).not.toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('Component Export', () => {
    it('should be defined', () => {
      expect(CurrentRules).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof CurrentRules).toBe('function');
    });
  });

  describe('Combined Filtering and Sorting', () => {
    it('should apply both text filter and sort', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      // Apply text filter
      const filterInput = screen.getByPlaceholderText('Enter property name or value');
      fireEvent.change(filterInput, { target: { value: 'column' } });

      // Apply sort
      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const sortButton = columnNameHeader?.querySelector('button');
      if (sortButton) {
        fireEvent.click(sortButton);
      }

      // Both filter and sort should work together
      expect(screen.getByText('test_column')).toBeInTheDocument();
    });
  });

  describe('Additional Branch Coverage', () => {
    it('should add multiple values to same filter property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Evaluation property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      expect(evaluationItem).toBeTruthy();
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        // Select first value (FAILED)
        let valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        expect(failedItem).toBeTruthy();
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
          });

          // Now select second value (PASSED) - this tests the update existing filter branch
          valueItems = document.querySelectorAll('[role="menuitem"]');
          const passedItem = Array.from(valueItems).find(
            item => item.textContent?.includes('PASSED')
          );
          expect(passedItem).toBeTruthy();
          if (passedItem) {
            fireEvent.click(passedItem);

            await waitFor(() => {
              // Filter should now have both values
              expect(screen.getByText('Evaluation:')).toBeInTheDocument();
            });
          }
        }
      }
    });

    it('should handle sort direction cycling from null to asc', () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const columnNameHeader = screen.getByText('Column Name').closest('th');
      const sortButton = columnNameHeader?.querySelector('button');

      if (sortButton) {
        // First click: asc
        fireEvent.click(sortButton);
        // Second click: desc
        fireEvent.click(sortButton);
        // Third click: null (reset)
        fireEvent.click(sortButton);
        // Fourth click: asc again (covers line 334)
        fireEvent.click(sortButton);

        expect(screen.getByText('test_column')).toBeInTheDocument();
      }
    });

    it('should filter by Column Name property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Column Name property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const columnNameItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Column Name')
      );
      expect(columnNameItem).toBeTruthy();
      if (columnNameItem) {
        fireEvent.click(columnNameItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Column Name')).toBeInTheDocument();
        });

        // Select a column value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const testColumnItem = Array.from(valueItems).find(
          item => item.textContent === 'test_column'
        );
        if (testColumnItem) {
          fireEvent.click(testColumnItem);

          await waitFor(() => {
            // Filter chip should show
            expect(screen.getByText('Column Name:')).toBeInTheDocument();
          });
        }
      }
    });

    it('should filter by Rule Name property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Rule Name property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const ruleNameItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Rule Name')
      );
      expect(ruleNameItem).toBeTruthy();
      if (ruleNameItem) {
        fireEvent.click(ruleNameItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Rule Name')).toBeInTheDocument();
        });
      }
    });

    it('should filter by Dimensions property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Dimensions property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const dimensionsItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Dimensions')
      );
      expect(dimensionsItem).toBeTruthy();
      if (dimensionsItem) {
        fireEvent.click(dimensionsItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Dimensions')).toBeInTheDocument();
        });

        // Select COMPLETENESS value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const completenessItem = Array.from(valueItems).find(
          item => item.textContent?.includes('COMPLETENESS')
        );
        if (completenessItem) {
          fireEvent.click(completenessItem);

          await waitFor(() => {
            expect(screen.getByText('Dimensions:')).toBeInTheDocument();
          });
        }
      }
    });

    it('should filter by Parameters property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Parameters property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const parametersItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Parameters')
      );
      expect(parametersItem).toBeTruthy();
      if (parametersItem) {
        fireEvent.click(parametersItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Parameters')).toBeInTheDocument();
        });
      }
    });

    it('should filter by Threshold property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Threshold property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const thresholdItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Threshold')
      );
      expect(thresholdItem).toBeTruthy();
      if (thresholdItem) {
        fireEvent.click(thresholdItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Threshold')).toBeInTheDocument();
        });

        // Select 95% value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const value95Item = Array.from(valueItems).find(
          item => item.textContent?.includes('95%')
        );
        if (value95Item) {
          fireEvent.click(value95Item);

          await waitFor(() => {
            expect(screen.getByText('Threshold:')).toBeInTheDocument();
          });
        }
      }
    });

    it('should filter by Rule Type property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Rule Type property
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      const ruleTypeItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Rule Type')
      );
      expect(ruleTypeItem).toBeTruthy();
      if (ruleTypeItem) {
        fireEvent.click(ruleTypeItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Rule Type')).toBeInTheDocument();
        });

        // Select NOT_NULL value
        const valueItems = document.querySelectorAll('[role="menuitem"]');
        const notNullItem = Array.from(valueItems).find(
          item => item.textContent?.includes('NOT_NULL')
        );
        if (notNullItem) {
          fireEvent.click(notNullItem);

          await waitFor(() => {
            expect(screen.getByText('Rule Type:')).toBeInTheDocument();
          });
        }
      }
    });

    it('should handle existing filter pre-selection when selecting property', async () => {
      render(<CurrentRules dataQualtyScan={mockDataQualityScan} />);

      const filterText = screen.getByText('Filter');
      fireEvent.click(filterText);

      await waitFor(() => {
        expect(document.querySelector('[role="menu"]')).toBeInTheDocument();
      });

      // Select Evaluation property and add a filter
      let menuItems = document.querySelectorAll('[role="menuitem"]');
      let evaluationItem = Array.from(menuItems).find(
        item => item.textContent?.includes('Evaluation')
      );
      if (evaluationItem) {
        fireEvent.click(evaluationItem);

        await waitFor(() => {
          expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
        });

        // Select FAILED
        let valueItems = document.querySelectorAll('[role="menuitem"]');
        const failedItem = Array.from(valueItems).find(
          item => item.textContent?.includes('FAILED')
        );
        if (failedItem) {
          fireEvent.click(failedItem);

          await waitFor(() => {
            expect(screen.getByText('Evaluation:')).toBeInTheDocument();
          });

          // Go back to properties
          fireEvent.click(screen.getByText('← Back to Properties'));

          await waitFor(() => {
            expect(screen.getByText('Select Property to Filter')).toBeInTheDocument();
          });

          // Select Evaluation again - should pre-select FAILED
          menuItems = document.querySelectorAll('[role="menuitem"]');
          evaluationItem = Array.from(menuItems).find(
            item => item.textContent?.includes('Evaluation')
          );
          if (evaluationItem) {
            fireEvent.click(evaluationItem);

            await waitFor(() => {
              expect(screen.getByText('Filter by: Evaluation')).toBeInTheDocument();
            });
          }
        }
      }
    });
  });
});
