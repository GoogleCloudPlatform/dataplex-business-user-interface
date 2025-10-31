import { render, screen, fireEvent } from '@testing-library/react';
import PreviewAnnotation from './PreviewAnnotation';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock SVG and utility function imports
vi.mock('../../assets/svg/help_outline.svg', () => ({
  default: 'help-outline-icon'
}));

vi.mock('../../utils/resourceUtils', () => ({
  hasValidAnnotationData: (aspectData: any) => {
    if (!aspectData || !aspectData.data || !aspectData.data.fields) return false;
    const fields = aspectData.data.fields;
    const fieldKeys = Object.keys(fields);
    const validFields = fieldKeys.filter(key => {
      const item = fields[key];
      return (item.kind === 'stringValue' && item.stringValue) || 
             (item.kind === "listValue" && item.listValue?.values?.length > 0);
    });
    return validFields.length > 0;
  }
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
            listField: { kind: 'listValue', listValue: { values: [{ stringValue: 'list item 1' }] } }
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

  let setExpandedItemsMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
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

  // --- TESTS ---

  it('renders annotation accordions but filters out those with null data', () => {
    renderPreviewAnnotation();
    expect(screen.getByText('annotation1')).toBeInTheDocument();
    expect(screen.getByText('annotation2')).toBeInTheDocument();
    expect(screen.getByText('empty')).toBeInTheDocument();
    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('calls setExpandedItems when an accordion is clicked', () => {
    renderPreviewAnnotation();
    
    const annotation1Accordion = screen.getByText('annotation1');
    fireEvent.click(annotation1Accordion);
    
    // Check that the parent's setter function was called with the new state
    expect(setExpandedItemsMock).toHaveBeenCalledTimes(1);
    expect(setExpandedItemsMock).toHaveBeenCalledWith(new Set(['123.custom.annotation1']));
  });
  
  it('shows annotation data when the expandedItems prop is updated', () => {
    // 1. Initial render (collapsed)
    const { rerender } = renderPreviewAnnotation();
    expect(screen.queryByText('test value 1')).not.toBeInTheDocument();

    // 2. Rerender with updated props to simulate parent state change
    const expandedSet = new Set(['123.custom.annotation1']);
    rerender(
      <PreviewAnnotation 
        entry={mockEntry} 
        css={{}} 
        expandedItems={expandedSet} 
        setExpandedItems={setExpandedItemsMock} 
      />
    );
    
    // 3. Assert content is now visible
    expect(screen.getByText('field1')).toBeInTheDocument();
    expect(screen.getByText('test value 1')).toBeInTheDocument();
  });
  
  it('correctly toggles an accordion via parent state control', () => {
    let expandedSet = new Set<string>();
    
    // Mock a stateful setter
    setExpandedItemsMock.mockImplementation((newSet) => {
      expandedSet = newSet;
    });

    const { rerender } = renderPreviewAnnotation({}, expandedSet);

    const annotation1Accordion = screen.getByText('annotation1');
    
    // --- Expand ---
    fireEvent.click(annotation1Accordion);
    rerender(<PreviewAnnotation entry={mockEntry} css={{}} expandedItems={expandedSet} setExpandedItems={setExpandedItemsMock} />);
    expect(expandedSet.has('123.custom.annotation1')).toBe(true);
    expect(screen.getByText('test value 1')).toBeInTheDocument();
    
    // --- Collapse ---
    fireEvent.click(annotation1Accordion);
    rerender(<PreviewAnnotation entry={mockEntry} css={{}} expandedItems={expandedSet} setExpandedItems={setExpandedItemsMock} />);
    expect(expandedSet.has('123.custom.annotation1')).toBe(false);
    expect(screen.queryByText('test value 1')).not.toBeInTheDocument();
  });
  
  it('does not expand accordion for annotations without valid data', () => {
    renderPreviewAnnotation();
    
    const emptyAccordion = screen.getByText('empty');
    const accordionButton = emptyAccordion.closest('[role="button"]');
    
    // Check for UI cues indicating non-interactivity
    expect(accordionButton).toHaveStyle({ cursor: 'default' });
    expect(accordionButton?.querySelector('[data-testid="ExpandMoreIcon"]')).toBeNull();
    
    // Clicking should not attempt to change state
    fireEvent.click(emptyAccordion);
    expect(setExpandedItemsMock).not.toHaveBeenCalled();
  });

  it('updates annotation label styling when expanded', () => {
    const { rerender } = renderPreviewAnnotation();
    const annotationLabel = screen.getAllByText('Annotation')[0]; // Corresponds to annotation1
    
    // Initial (collapsed) style
    expect(annotationLabel).toHaveStyle({ background: '#E7F0FE', color: '#004A77' });
    
    // Rerender with the item expanded
    const expandedSet = new Set(['123.custom.annotation1']);
    rerender(<PreviewAnnotation entry={mockEntry} css={{}} expandedItems={expandedSet} setExpandedItems={setExpandedItemsMock} />);
    
    // Expanded style
    expect(annotationLabel).toHaveStyle({ background: '#0B57D0', color: '#FFFFFF' });
  });

  it('handles entry without aspects gracefully', () => {
    const entryWithoutAspects = { ...mockEntry, aspects: undefined };
    renderPreviewAnnotation({ entry: entryWithoutAspects });
    // Check that it renders without crashing and no annotations are shown
    expect(screen.queryByText('annotation1')).not.toBeInTheDocument();
  });
  
  it('handles entry without entryType gracefully', () => {
    const entryWithoutType = { ...mockEntry, entryType: undefined };
    renderPreviewAnnotation({ entry: entryWithoutType });
    // Should still render annotations, just using a default '0' for filtering
    expect(screen.getByText('annotation1')).toBeInTheDocument();
  });
});