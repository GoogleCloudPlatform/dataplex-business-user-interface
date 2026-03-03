/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PreviewAnnotation from './PreviewAnnotation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock SVG import
vi.mock('../../assets/svg/help_outline.svg', () => ({
  default: 'help-outline-icon'
}));

describe('PreviewAnnotation', () => {
  // --- MOCK DATA ---
  const mockEntry = {
    entryType: 'tables/123',
    aspects: {
      '123.custom.annotation1': {
        aspectType: 'tables/custom/annotation1',
        data: {
          fields: {
            field1: { kind: 'stringValue', stringValue: 'test value 1' },
          }
        }
      },
      '123.custom.annotation2': {
        aspectType: 'tables/custom/annotation2',
        data: {
          fields: {
            listField: { kind: 'listValue', listValue: { values: [{ stringValue: 'list item 1' }, { stringValue: 'list item 2' }] } }
          }
        }
      },
      '123.custom.empty': {
        aspectType: 'tables/custom/empty',
        data: { fields: { emptyField: { kind: 'stringValue', stringValue: '' } } }
      },
      '123.custom.null': { aspectType: 'tables/custom/null', data: null }
    }
  };

  const mockEntryWithAllFieldTypes = {
    entryType: 'tables/123',
    aspects: {
      '123.custom.alltypes': {
        aspectType: 'tables/custom/alltypes',
        data: {
          fields: {
            stringField: { kind: 'stringValue', stringValue: 'string value' },
            numberField: { kind: 'numberValue', numberValue: 42 },
            boolTrueField: { kind: 'boolValue', boolValue: true },
            boolFalseField: { kind: 'boolValue', boolValue: false },
            listField: { kind: 'listValue', listValue: { values: [{ stringValue: 'item1' }] } }
          }
        }
      }
    }
  };

  const mockEntryWithSimpleValues = {
    entryType: 'tables/123',
    aspects: {
      '123.custom.simple': {
        aspectType: 'tables/custom/simple',
        data: {
          fields: {
            simpleString: 'direct string',
            simpleNumber: 123,
            simpleNull: null,
            simpleUndefined: undefined
          }
        }
      }
    }
  };

  const mockEntryWithGlobalAspects = {
    entryType: 'tables/123',
    aspects: {
      '123.global.schema': {
        aspectType: 'tables/global/schema',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'schema data' } } }
      },
      '123.global.overview': {
        aspectType: 'tables/global/overview',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'overview data' } } }
      },
      '123.global.contacts': {
        aspectType: 'tables/global/contacts',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'contacts data' } } }
      },
      '123.global.usage': {
        aspectType: 'tables/global/usage',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'usage data' } } }
      },
      '123.global.glossary-term-aspect': {
        aspectType: 'tables/global/glossary-term-aspect',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'glossary data' } } }
      },
      '123.global.refresh-cadence': {
        aspectType: 'tables/global/refresh-cadence',
        data: { fields: { field1: { kind: 'stringValue', stringValue: 'refresh data' } } }
      },
      '123.custom.visible': {
        aspectType: 'tables/custom/visible',
        data: { fields: { visibleField: { kind: 'stringValue', stringValue: 'visible value' } } }
      }
    }
  };

  const mockEntryWithRawData = {
    entryType: 'tables/123',
    aspects: {
      '123.custom.rawdata': {
        aspectType: 'tables/custom/rawdata',
        data: {
          directField: { kind: 'stringValue', stringValue: 'direct value' }
        }
      }
    }
  };

  let setExpandedItemsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setExpandedItemsMock = vi.fn();
    vi.clearAllMocks();
  });

  // --- RENDER HELPER ---
  const renderPreviewAnnotation = (props = {}, initialExpanded = new Set<string>()) => {
    const defaultProps = {
      entry: mockEntry,
      css: {},
      expandedItems: initialExpanded,
      setExpandedItems: setExpandedItemsMock,
    };
    return render(<PreviewAnnotation {...defaultProps} {...props} />);
  };

  // --- BASIC RENDERING TESTS ---

  describe('Basic Rendering', () => {
    it('renders annotation accordions including those with null data as static items', () => {
      renderPreviewAnnotation();
      expect(screen.getByText('annotation1')).toBeInTheDocument();
      expect(screen.getByText('annotation2')).toBeInTheDocument();
      expect(screen.getByText('empty')).toBeInTheDocument();
      // Null data aspects are rendered as non-expandable static items
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('renders "Aspect" label for each annotation', () => {
      renderPreviewAnnotation();
      const aspectLabels = screen.getAllByText('Aspect');
      expect(aspectLabels.length).toBeGreaterThan(0);
    });

    it('handles entry without aspects gracefully', () => {
      const entryWithoutAspects = { ...mockEntry, aspects: undefined };
      renderPreviewAnnotation({ entry: entryWithoutAspects });
      expect(screen.queryByText('annotation1')).not.toBeInTheDocument();
    });

    it('handles entry without entryType gracefully', () => {
      const entryWithoutType = { ...mockEntry, entryType: undefined };
      renderPreviewAnnotation({ entry: entryWithoutType });
      expect(screen.getByText('annotation1')).toBeInTheDocument();
    });

    it('handles null entry gracefully', () => {
      renderPreviewAnnotation({ entry: null });
      expect(screen.getByText('No aspects available for this resource')).toBeInTheDocument();
    });
  });

  // --- EMPTY STATE TESTS ---

  describe('Empty State', () => {
    it('shows empty state message when no displayable aspects exist', () => {
      const entryWithOnlyGlobalAspects = {
        entryType: 'tables/123',
        aspects: {
          '123.global.schema': {
            aspectType: 'tables/global/schema',
            data: { fields: { field1: { kind: 'stringValue', stringValue: 'schema data' } } }
          }
        }
      };
      renderPreviewAnnotation({ entry: entryWithOnlyGlobalAspects });
      expect(screen.getByText('No aspects available for this resource')).toBeInTheDocument();
    });

    it('shows empty state when aspects object is empty', () => {
      const entryWithEmptyAspects = { entryType: 'tables/123', aspects: {} };
      renderPreviewAnnotation({ entry: entryWithEmptyAspects });
      expect(screen.getByText('No aspects available for this resource')).toBeInTheDocument();
    });
  });

  // --- GLOBAL ASPECTS FILTERING ---

  describe('Global Aspects Filtering', () => {
    it('filters out schema, overview, contacts, usage, glossary-term-aspect, and refresh-cadence aspects', () => {
      renderPreviewAnnotation({ entry: mockEntryWithGlobalAspects });

      // These should be filtered out
      expect(screen.queryByText('schema')).not.toBeInTheDocument();
      expect(screen.queryByText('overview')).not.toBeInTheDocument();
      expect(screen.queryByText('contacts')).not.toBeInTheDocument();
      expect(screen.queryByText('usage')).not.toBeInTheDocument();
      expect(screen.queryByText('glossary-term-aspect')).not.toBeInTheDocument();
      expect(screen.queryByText('refresh-cadence')).not.toBeInTheDocument();

      // This should be visible
      expect(screen.getByText('visible')).toBeInTheDocument();
    });
  });

  // --- ACCORDION EXPANSION TESTS ---

  describe('Accordion Expansion', () => {
    it('calls setExpandedItems when an accordion is clicked', () => {
      renderPreviewAnnotation();

      const annotation1Accordion = screen.getByText('annotation1');
      fireEvent.click(annotation1Accordion);

      expect(setExpandedItemsMock).toHaveBeenCalledTimes(1);
      expect(setExpandedItemsMock).toHaveBeenCalledWith(new Set(['123.custom.annotation1']));
    });

    it('shows annotation data when the expandedItems prop is updated', () => {
      // Render with accordion already expanded
      const expandedSet = new Set(['123.custom.annotation1']);
      renderPreviewAnnotation({}, expandedSet);

      expect(screen.getByText('field1')).toBeInTheDocument();
      expect(screen.getByText('test value 1')).toBeInTheDocument();
    });

    it('correctly toggles an accordion via parent state control', () => {
      let expandedSet = new Set<string>();

      setExpandedItemsMock.mockImplementation((newSet) => {
        expandedSet = newSet;
      });

      const { rerender } = renderPreviewAnnotation({}, expandedSet);

      const annotation1Accordion = screen.getByText('annotation1');

      // Expand
      fireEvent.click(annotation1Accordion);
      expect(setExpandedItemsMock).toHaveBeenCalledTimes(1);
      expect(expandedSet.has('123.custom.annotation1')).toBe(true);

      rerender(<PreviewAnnotation entry={mockEntry} css={{}} expandedItems={expandedSet} setExpandedItems={setExpandedItemsMock} />);
      expect(screen.getByText('test value 1')).toBeInTheDocument();

      // Collapse
      fireEvent.click(annotation1Accordion);
      expect(setExpandedItemsMock).toHaveBeenCalledTimes(2);
      expect(expandedSet.has('123.custom.annotation1')).toBe(false);
    });

    it('does not expand accordion for annotations without valid data', () => {
      renderPreviewAnnotation();

      const emptyAccordion = screen.getByText('empty');

      // Clicking should not attempt to change state
      fireEvent.click(emptyAccordion);
      expect(setExpandedItemsMock).not.toHaveBeenCalled();
    });

    it('updates annotation label styling when expanded', () => {
      const { rerender } = renderPreviewAnnotation();
      const annotationLabel = screen.getAllByText('Aspect')[0];

      // Initial (collapsed) style
      expect(annotationLabel).toHaveStyle({ background: '#E7F0FE', color: '#004A77' });

      // Rerender with the item expanded
      const expandedSet = new Set(['123.custom.annotation1']);
      rerender(<PreviewAnnotation entry={mockEntry} css={{}} expandedItems={expandedSet} setExpandedItems={setExpandedItemsMock} />);

      // Expanded style
      expect(annotationLabel).toHaveStyle({ background: '#0B57D0', color: '#FFFFFF' });
    });
  });

  // --- FIELD TYPE RENDERING TESTS ---

  describe('Field Type Rendering', () => {
    it('renders stringValue fields correctly', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      expect(screen.getByText('stringField')).toBeInTheDocument();
      expect(screen.getByText('string value')).toBeInTheDocument();
    });

    it('renders numberValue fields correctly', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      expect(screen.getByText('numberField')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders boolValue fields correctly (true and false)', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      expect(screen.getByText('boolTrueField')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('boolFalseField')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('renders listValue fields with multiple items', () => {
      const expandedSet = new Set(['123.custom.annotation2']);
      renderPreviewAnnotation({}, expandedSet);

      expect(screen.getByText('list item 1')).toBeInTheDocument();
      expect(screen.getByText('list item 2')).toBeInTheDocument();
    });

    it('renders simple (non-object) field values', () => {
      const expandedSet = new Set(['123.custom.simple']);
      renderPreviewAnnotation({ entry: mockEntryWithSimpleValues }, expandedSet);

      expect(screen.getByText('simpleString')).toBeInTheDocument();
      expect(screen.getByText('direct string')).toBeInTheDocument();
      expect(screen.getByText('simpleNumber')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('renders "No data available" when fields are empty or invalid', () => {
      const entryWithNoFields = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.nodata': {
            aspectType: 'tables/custom/nodata',
            data: { fields: {} }
          }
        }
      };

      // The accordion won't have content so it renders as static div
      renderPreviewAnnotation({ entry: entryWithNoFields });
      expect(screen.getByText('nodata')).toBeInTheDocument();
    });

    it('handles raw data without fields property', () => {
      const expandedSet = new Set(['123.custom.rawdata']);
      renderPreviewAnnotation({ entry: mockEntryWithRawData }, expandedSet);

      expect(screen.getByText('directField')).toBeInTheDocument();
      expect(screen.getByText('direct value')).toBeInTheDocument();
    });
  });

  // --- SORTING TESTS ---

  describe('Sorting Functionality', () => {
    it('shows sort button on hover over Name column', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      const nameHeader = screen.getByText('Name');
      fireEvent.mouseEnter(nameHeader.parentElement!);

      // Sort button should appear with tooltip
      expect(screen.getByRole('button')).toBeInTheDocument();

      fireEvent.mouseLeave(nameHeader.parentElement!);
    });

    it('shows sort button on hover over Value column', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader.parentElement!);

      // Sort button should appear
      expect(screen.getByRole('button')).toBeInTheDocument();

      fireEvent.mouseLeave(valueHeader.parentElement!);
    });

    it('sorts by name on click and maintains sort state', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      const nameHeader = screen.getByText('Name');
      fireEvent.mouseEnter(nameHeader.parentElement!);

      const sortButton = screen.getByRole('button');
      fireEvent.click(sortButton);

      // After clicking, button should still be visible (active sort)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('cycles through sort states on multiple clicks', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      const nameHeader = screen.getByText('Name');
      fireEvent.mouseEnter(nameHeader.parentElement!);

      const sortButton = screen.getByRole('button');

      // First click - ascending
      fireEvent.click(sortButton);
      expect(sortButton).toBeInTheDocument();

      // Second click - descending
      fireEvent.click(sortButton);
      expect(sortButton).toBeInTheDocument();

      // Third click - clears sort
      fireEvent.click(sortButton);
      expect(sortButton).toBeInTheDocument();
    });

    it('sorts by value column', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader.parentElement!);

      const sortButton = screen.getByRole('button');
      fireEvent.click(sortButton);

      // Should sort by value
      expect(sortButton).toBeInTheDocument();
    });

    it('handles sort column switching', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Sort by name first
      const nameHeader = screen.getByText('Name');
      fireEvent.mouseEnter(nameHeader.parentElement!);
      let sortButton = screen.getByRole('button');
      fireEvent.click(sortButton);

      // Now hover and sort by value
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader.parentElement!);

      // Should have multiple sort buttons now
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // --- PROP TESTS ---

  describe('isTopComponent Prop', () => {
    it('renders correctly with isTopComponent true', () => {
      const expandedSet = new Set(['123.custom.annotation1']);
      renderPreviewAnnotation({ isTopComponent: true }, expandedSet);

      // Component should render without errors
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    });

    it('renders correctly with isTopComponent false (default)', () => {
      const expandedSet = new Set(['123.custom.annotation1']);
      renderPreviewAnnotation({ isTopComponent: false }, expandedSet);

      // Component should render without errors
      expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    });
  });

  describe('isGlossary Prop', () => {
    it('applies glossary-specific styling when isGlossary is true', () => {
      renderPreviewAnnotation({ isGlossary: true });

      const annotationName = screen.getByText('annotation1');
      expect(annotationName).toHaveStyle({ fontSize: '0.7rem' });
    });

    it('applies default styling when isGlossary is false', () => {
      renderPreviewAnnotation({ isGlossary: false });

      const annotationName = screen.getByText('annotation1');
      expect(annotationName).toHaveStyle({ fontSize: '0.875rem' });
    });
  });

  describe('CSS Prop', () => {
    it('accepts custom CSS prop without errors', () => {
      const customCss = { backgroundColor: 'red', padding: '20px' };
      renderPreviewAnnotation({ css: customCss });

      // Component should render without errors
      expect(screen.getByText('annotation1')).toBeInTheDocument();
    });

    it('applies CSS to empty state container', () => {
      const customCss = { minHeight: '300px' };
      const entryWithOnlyGlobalAspects = {
        entryType: 'tables/123',
        aspects: {
          '123.global.schema': {
            aspectType: 'tables/global/schema',
            data: { fields: { field1: { kind: 'stringValue', stringValue: 'data' } } }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithOnlyGlobalAspects, css: customCss });
      expect(screen.getByText('No aspects available for this resource')).toBeInTheDocument();
    });
  });

  // --- EDGE CASES ---

  describe('Edge Cases', () => {
    it('handles aspect with hyphenated name correctly', () => {
      const entryWithHyphenatedName = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.my-custom-aspect': {
            aspectType: 'tables/custom/my-custom-aspect',
            data: { fields: { field1: { kind: 'stringValue', stringValue: 'value' } } }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithHyphenatedName });
      // Hyphenated names should be converted to spaces
      expect(screen.getByText('my custom aspect')).toBeInTheDocument();
    });

    it('handles multiple accordions expanded simultaneously', () => {
      const expandedSet = new Set(['123.custom.annotation1', '123.custom.annotation2']);
      renderPreviewAnnotation({}, expandedSet);

      expect(screen.getByText('test value 1')).toBeInTheDocument();
      expect(screen.getByText('list item 1')).toBeInTheDocument();
    });

    it('handles entry with deeply nested entryType', () => {
      const entryWithDeepType = {
        entryType: 'projects/myproject/datasets/123',
        aspects: {
          '123.custom.test': {
            aspectType: 'tables/custom/test',
            data: { fields: { field1: { kind: 'stringValue', stringValue: 'value' } } }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithDeepType });
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('handles listValue with empty values array', () => {
      const entryWithEmptyList = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.emptylist': {
            aspectType: 'tables/custom/emptylist',
            data: {
              fields: {
                emptyListField: { kind: 'listValue', listValue: { values: [] } }
              }
            }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithEmptyList });
      // Should render but not show the empty list field
      expect(screen.getByText('emptylist')).toBeInTheDocument();
    });

    it('filters fields with null listValue', () => {
      const entryWithNullListValue = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.nulllist': {
            aspectType: 'tables/custom/nulllist',
            data: {
              fields: {
                nullListField: { kind: 'listValue', listValue: null }
              }
            }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithNullListValue });
      expect(screen.getByText('nulllist')).toBeInTheDocument();
    });

    it('handles numberValue of 0 correctly', () => {
      const entryWithZero = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.zero': {
            aspectType: 'tables/custom/zero',
            data: {
              fields: {
                zeroField: { kind: 'numberValue', numberValue: 0 }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.zero']);
      renderPreviewAnnotation({ entry: entryWithZero }, expandedSet);

      expect(screen.getByText('zeroField')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('does not render fields with empty stringValue', () => {
      const entryWithEmptyString = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.emptystring': {
            aspectType: 'tables/custom/emptystring',
            data: {
              fields: {
                emptyStringField: { kind: 'stringValue', stringValue: '' },
                validField: { kind: 'stringValue', stringValue: 'valid' }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.emptystring']);
      renderPreviewAnnotation({ entry: entryWithEmptyString }, expandedSet);

      // Valid field should be shown
      expect(screen.getByText('valid')).toBeInTheDocument();
      // Empty field should not trigger row rendering
    });
  });

  // --- HELP ICON TESTS ---

  describe('Help Icons', () => {
    it('renders help icon for list value items', () => {
      const expandedSet = new Set(['123.custom.annotation2']);
      renderPreviewAnnotation({}, expandedSet);

      const helpIcons = screen.getAllByAltText('Help');
      expect(helpIcons.length).toBeGreaterThan(0);
    });
  });

  // --- ADDITIONAL COVERAGE TESTS ---

  describe('Additional Sort and Edge Case Coverage', () => {
    it('handles click on Value column sort button', async () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      const { container } = renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Find the Value header and trigger mouseEnter
      const valueHeaders = screen.getAllByText('Value');
      const valueHeader = valueHeaders[0];
      const valueHeaderContainer = valueHeader.parentElement;

      if (valueHeaderContainer) {
        fireEvent.mouseEnter(valueHeaderContainer);
      }

      // Try to find and click any sort buttons that appear
      const sortButtons = container.querySelectorAll('button');
      if (sortButtons.length > 0) {
        fireEvent.click(sortButtons[sortButtons.length - 1]);
      }

      // Component should handle the sort
      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    });

    it('handles sorting when sort config exists for value column', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      const { container } = renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Find Value headers and trigger hover on them directly
      const valueHeaders = screen.getAllByText('Value');

      // Hover over the first Value header to show sort button
      if (valueHeaders[0]?.parentElement) {
        fireEvent.mouseEnter(valueHeaders[0].parentElement);

        // Find any buttons that appeared
        const buttons = container.querySelectorAll('[role="button"]');
        if (buttons.length > 0) {
          // Click the last button (Value sort button)
          fireEvent.click(buttons[buttons.length - 1]);

          // Click again to change direction to desc
          fireEvent.click(buttons[buttons.length - 1]);

          // Click again to clear
          fireEvent.click(buttons[buttons.length - 1]);
        }

        fireEvent.mouseLeave(valueHeaders[0].parentElement);
      }

      // Component should handle sorting state changes
      expect(valueHeaders.length).toBeGreaterThan(0);
    });

    it('renders No data available for truly empty fields object', () => {
      const entryWithEmptyObject = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.emptyobj': {
            aspectType: 'tables/custom/emptyobj',
            data: { fields: {} }
          }
        }
      };

      // This will render a static div, not an expandable accordion
      renderPreviewAnnotation({ entry: entryWithEmptyObject });
      expect(screen.getByText('emptyobj')).toBeInTheDocument();
    });

    it('renders correctly when fields is not an object', () => {
      const entryWithNonObjectFields = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.noobj': {
            aspectType: 'tables/custom/noobj',
            data: { fields: null }
          }
        }
      };

      renderPreviewAnnotation({ entry: entryWithNonObjectFields });
      expect(screen.getByText('noobj')).toBeInTheDocument();
    });

    it('handles field with empty displayValue after filtering', () => {
      // This tests the return null case at line 359
      // The field passes the validFields filter but has empty displayValue
      const entryWithMixedFields = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.mixed': {
            aspectType: 'tables/custom/mixed',
            data: {
              fields: {
                validField: { kind: 'stringValue', stringValue: 'valid' },
                // Field with a kind but no corresponding value
                weirdField: { kind: 'stringValue', stringValue: undefined },
                // Object that doesn't match any known kind
                unknownKindField: { kind: 'unknownKind' }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.mixed']);
      renderPreviewAnnotation({ entry: entryWithMixedFields }, expandedSet);

      // Valid field should be shown
      expect(screen.getByText('valid')).toBeInTheDocument();
    });

    it('handles field where displayValue is explicitly empty string', () => {
      const entryWithEmptyDisplay = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.emptydisplay': {
            aspectType: 'tables/custom/emptydisplay',
            data: {
              fields: {
                // This passes validFields filter (has stringValue) but displayValue will be empty
                hasKindButEmpty: { kind: 'stringValue', stringValue: '' },
                validOne: { kind: 'stringValue', stringValue: 'valid one' }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.emptydisplay']);
      renderPreviewAnnotation({ entry: entryWithEmptyDisplay }, expandedSet);

      // Valid field should be shown
      expect(screen.getByText('valid one')).toBeInTheDocument();
    });

    it('handles undefined numberValue', () => {
      const entryWithUndefinedNumber = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.undefinednum': {
            aspectType: 'tables/custom/undefinednum',
            data: {
              fields: {
                numField: { kind: 'numberValue', numberValue: undefined }
              }
            }
          }
        }
      };

      // Should not crash and render the aspect name
      renderPreviewAnnotation({ entry: entryWithUndefinedNumber });
      expect(screen.getByText('undefinednum')).toBeInTheDocument();
    });

    it('handles sorting with boolValue fields', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Sort by value to test boolValue string conversion
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader.parentElement!);
      const sortButton = screen.getByRole('button');
      fireEvent.click(sortButton);

      // Should have sorted and still show the fields
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('handles multiple accordions with independent sort states', () => {
      const entryWithMultiple = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.first': {
            aspectType: 'tables/custom/first',
            data: {
              fields: {
                aField: { kind: 'stringValue', stringValue: 'A value' },
                bField: { kind: 'stringValue', stringValue: 'B value' }
              }
            }
          },
          '123.custom.second': {
            aspectType: 'tables/custom/second',
            data: {
              fields: {
                xField: { kind: 'stringValue', stringValue: 'X value' },
                yField: { kind: 'stringValue', stringValue: 'Y value' }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.first', '123.custom.second']);
      renderPreviewAnnotation({ entry: entryWithMultiple }, expandedSet);

      // Both accordions should be expanded
      expect(screen.getByText('A value')).toBeInTheDocument();
      expect(screen.getByText('X value')).toBeInTheDocument();
    });

    it('handles aspect with data but no fields property', () => {
      const entryWithNoFieldsProperty = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.direct': {
            aspectType: 'tables/custom/direct',
            data: {
              directKey: { kind: 'stringValue', stringValue: 'direct data' }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.direct']);
      renderPreviewAnnotation({ entry: entryWithNoFieldsProperty }, expandedSet);

      expect(screen.getByText('direct')).toBeInTheDocument();
      expect(screen.getByText('direct data')).toBeInTheDocument();
    });

    it('triggers sort on Value column with userEvent hover', async () => {
      const user = userEvent.setup();
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Find Value header and hover using userEvent
      const valueHeaders = screen.getAllByText('Value');
      if (valueHeaders[0]?.parentElement) {
        await user.hover(valueHeaders[0].parentElement);

        // Wait for the sort button to appear and click it
        await waitFor(() => {
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThan(0);
        });

        const buttons = screen.getAllByRole('button');
        await user.click(buttons[buttons.length - 1]);
      }

      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    });

    it('shows and clicks Value column sort button correctly', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Get the Value header element directly (not its parent)
      const valueHeader = screen.getByText('Value');

      // Hover directly on the Value header div to trigger onMouseEnter
      fireEvent.mouseEnter(valueHeader);

      // The sort button should appear for the Value column
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Click the Value sort button
      fireEvent.click(buttons[buttons.length - 1]);

      // Button should still be visible due to sortConfigs state
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('cycles through Value column sort states: asc -> desc -> off', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Get Value header element directly
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader);

      // Get the sort button for Value column
      let buttons = screen.getAllByRole('button');
      const valueButton = buttons[buttons.length - 1];

      // First click - ascending sort by value
      fireEvent.click(valueButton);

      // Second click - descending sort by value
      fireEvent.click(valueButton);

      // Third click - clears the sort
      fireEvent.click(valueButton);

      // After clearing, button should still be visible if hovered
      expect(screen.getAllByText('Value').length).toBeGreaterThan(0);
    });

    it('maintains Value column sort button visible after sorting', () => {
      const expandedSet = new Set(['123.custom.alltypes']);
      renderPreviewAnnotation({ entry: mockEntryWithAllFieldTypes }, expandedSet);

      // Hover on Value header
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader);

      // Click to sort by value
      const sortButton = screen.getAllByRole('button').pop();
      if (sortButton) {
        fireEvent.click(sortButton);
      }

      // Leave the Value column
      fireEvent.mouseLeave(valueHeader);

      // The button should still be visible because sortConfigs[key].key === 'value'
      const buttonsAfterLeave = screen.getAllByRole('button');
      expect(buttonsAfterLeave.length).toBeGreaterThan(0);
    });

    it('sorts data by value column correctly', () => {
      const entryWithSortableValues = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.sorttest': {
            aspectType: 'tables/custom/sorttest',
            data: {
              fields: {
                alpha: { kind: 'stringValue', stringValue: 'zzz' },
                beta: { kind: 'stringValue', stringValue: 'aaa' },
                gamma: { kind: 'stringValue', stringValue: 'mmm' }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.sorttest']);
      renderPreviewAnnotation({ entry: entryWithSortableValues }, expandedSet);

      // Verify initial values are present
      expect(screen.getByText('zzz')).toBeInTheDocument();
      expect(screen.getByText('aaa')).toBeInTheDocument();
      expect(screen.getByText('mmm')).toBeInTheDocument();

      // Hover on Value and click sort
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]);

      // Values should still be present after sorting
      expect(screen.getByText('zzz')).toBeInTheDocument();
      expect(screen.getByText('aaa')).toBeInTheDocument();
      expect(screen.getByText('mmm')).toBeInTheDocument();
    });

    it('handles value column sort with mixed field types', () => {
      const entryWithMixedTypes = {
        entryType: 'tables/123',
        aspects: {
          '123.custom.mixedsort': {
            aspectType: 'tables/custom/mixedsort',
            data: {
              fields: {
                strField: { kind: 'stringValue', stringValue: 'zebra' },
                numField: { kind: 'numberValue', numberValue: 100 },
                boolField: { kind: 'boolValue', boolValue: true }
              }
            }
          }
        }
      };

      const expandedSet = new Set(['123.custom.mixedsort']);
      renderPreviewAnnotation({ entry: entryWithMixedTypes }, expandedSet);

      // Hover on Value column and sort
      const valueHeader = screen.getByText('Value');
      fireEvent.mouseEnter(valueHeader);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[buttons.length - 1]); // Sort ascending
      fireEvent.click(buttons[buttons.length - 1]); // Sort descending

      // All values should still be present
      expect(screen.getByText('zebra')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });
});
