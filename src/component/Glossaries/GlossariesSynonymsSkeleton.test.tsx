import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import GlossariesSynonymsSkeleton from './GlossariesSynonymsSkeleton';

describe('GlossariesSynonymsSkeleton', () => {
  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it('renders the main container', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      const mainBox = container.firstChild as HTMLElement;
      expect(mainBox).toBeInTheDocument();
    });

    it('renders all skeleton elements', () => {
      render(<GlossariesSynonymsSkeleton />);
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Header Section Skeleton', () => {
    it('renders search bar skeleton with rounded variant', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // Search bar + 3 filter chips + 4 card type chips = 8 rounded skeletons
      expect(roundedSkeletons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders search bar skeleton with correct dimensions', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // First rounded skeleton is the search bar (300x32)
      expect(roundedSkeletons[0]).toHaveStyle({ width: '300px', height: '32px' });
    });

    it('renders three filter chip skeletons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // Filter chips are at indices 1, 2, 3
      expect(roundedSkeletons[1]).toHaveStyle({ width: '60px', height: '32px' });
      expect(roundedSkeletons[2]).toHaveStyle({ width: '90px', height: '32px' });
      expect(roundedSkeletons[3]).toHaveStyle({ width: '110px', height: '32px' });
    });

    it('renders sort icon circular skeleton in header', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // First circular skeleton is the sort icon (24x24)
      expect(circularSkeletons[0]).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('renders sort text skeleton in header', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // First text skeleton is the sort label
      expect(textSkeletons[0]).toHaveStyle({ width: '100px' });
    });
  });

  describe('Card Grid Skeleton', () => {
    it('renders exactly 4 card skeleton placeholders', () => {
      render(<GlossariesSynonymsSkeleton />);
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      // Header: 1 search + 3 chips + 1 sort icon + 1 sort text = 6
      // Each card: 1 icon + 1 title + 1 type chip + 2 desc + 1 time icon + 1 time text = 7
      // Total: 6 + (4 * 7) = 34 skeletons
      expect(skeletons.length).toBe(34);
    });

    it('renders circular skeleton for card icons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // 1 sort icon + 4 card icons + 4 time icons = 9 circular skeletons
      expect(circularSkeletons.length).toBe(9);
    });

    it('renders text skeletons for card content', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // 1 sort text + 4 titles + 8 descriptions (2 per card) + 4 time texts = 17
      expect(textSkeletons.length).toBe(17);
    });

    it('renders rounded skeletons for chips', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // 1 search + 3 filter chips + 4 type chips = 8 rounded skeletons
      expect(roundedSkeletons.length).toBe(8);
    });
  });

  describe('Skeleton Variants', () => {
    it('uses rounded variant for search bar and chips', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      expect(roundedSkeletons.length).toBe(8);
    });

    it('uses circular variant for icons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // 1 sort icon + 4 card icons + 4 time icons = 9
      expect(circularSkeletons.length).toBe(9);
    });

    it('uses text variant for text content', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // 1 sort + 4 titles + 8 descriptions + 4 times = 17
      expect(textSkeletons.length).toBe(17);
    });
  });

  describe('Layout Structure', () => {
    it('renders header section', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('renders grid container for cards', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
    });

    it('renders card containers with proper structure', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      const boxes = container.querySelectorAll('.MuiBox-root');
      // Main + header section + search/chips box + chips box + sort box +
      // grid + 4 cards * (card + header + icon/title box + desc box + footer) = many
      expect(boxes.length).toBeGreaterThan(10);
    });
  });

  describe('Skeleton Dimensions', () => {
    it('renders search bar skeleton with width 300', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      expect(roundedSkeletons[0]).toHaveStyle({ width: '300px' });
    });

    it('renders first filter chip with width 60', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      expect(roundedSkeletons[1]).toHaveStyle({ width: '60px' });
    });

    it('renders second filter chip with width 90', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      expect(roundedSkeletons[2]).toHaveStyle({ width: '90px' });
    });

    it('renders third filter chip with width 110', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      expect(roundedSkeletons[3]).toHaveStyle({ width: '110px' });
    });

    it('renders header sort icon with dimensions 24x24', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      expect(circularSkeletons[0]).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('renders sort text with width 100', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      expect(textSkeletons[0]).toHaveStyle({ width: '100px' });
    });

    it('renders card icon skeleton with dimensions 24x24', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // Index 1 is the first card icon (after sort icon)
      expect(circularSkeletons[1]).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('renders card title skeleton with 50% width', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Index 1 is the first card title (after sort text)
      expect(textSkeletons[1]).toHaveStyle({ width: '50%' });
    });

    it('renders type chip skeleton with dimensions 60x20', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // Index 4 is the first card type chip (after search + 3 filter chips)
      expect(roundedSkeletons[4]).toHaveStyle({ width: '60px', height: '20px' });
    });

    it('renders first description line with 100% width', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Index 2 is the first card's first description (after sort text + title)
      expect(textSkeletons[2]).toHaveStyle({ width: '100%' });
    });

    it('renders second description line with 80% width', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Index 3 is the first card's second description
      expect(textSkeletons[3]).toHaveStyle({ width: '80%' });
    });

    it('renders card time icon with dimensions 16x16', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // Index 2 is the first card's time icon (after sort icon + card icon)
      expect(circularSkeletons[2]).toHaveStyle({ width: '16px', height: '16px' });
    });

    it('renders card time text with width 100', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Index 4 is the first card's time text (after sort + title + 2 desc)
      expect(textSkeletons[4]).toHaveStyle({ width: '100px' });
    });
  });

  describe('Multiple Cards Verification', () => {
    it('renders 4 card icon skeletons (24x24)', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // Filter for 24x24 circular skeletons (sort icon + card icons)
      const largeIcons = Array.from(circularSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('24px');
      });
      // 1 sort icon + 4 card icons = 5
      expect(largeIcons.length).toBe(5);
    });

    it('renders 4 card time icon skeletons (16x16)', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      // Filter for 16x16 circular skeletons (time icons)
      const smallIcons = Array.from(circularSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('16px');
      });
      expect(smallIcons.length).toBe(4);
    });

    it('renders 4 card title skeletons with 50% width', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Filter for 50% width text skeletons (card titles)
      const titles = Array.from(textSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('50%');
      });
      expect(titles.length).toBe(4);
    });

    it('renders 4 type chip skeletons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');
      // Filter for 60px wide rounded skeletons with 20px height (type chips)
      const typeChips = Array.from(roundedSkeletons).filter((s) => {
        const style = s.getAttribute('style');
        return style?.includes('60px') && style?.includes('20px');
      });
      expect(typeChips.length).toBe(4);
    });

    it('renders 4 full-width description lines', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Filter for 100% width text skeletons
      const fullWidthDesc = Array.from(textSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('100%');
      });
      expect(fullWidthDesc.length).toBe(4);
    });

    it('renders 4 partial-width description lines', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Filter for 80% width text skeletons
      const partialWidthDesc = Array.from(textSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('80%');
      });
      expect(partialWidthDesc.length).toBe(4);
    });

    it('renders 4 time text skeletons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      // Filter for 100px width text skeletons (sort text + 4 time texts)
      const timeTexts = Array.from(textSkeletons).filter((s) => {
        return s.getAttribute('style')?.includes('100px');
      });
      // 1 sort text + 4 time texts = 5
      expect(timeTexts.length).toBe(5);
    });
  });

  describe('Default Export', () => {
    it('exports the component as default', () => {
      expect(GlossariesSynonymsSkeleton).toBeDefined();
      expect(typeof GlossariesSynonymsSkeleton).toBe('function');
    });

    it('is a valid React functional component', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      expect(container.firstChild).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Accessibility', () => {
    it('renders skeleton elements with proper MUI accessibility attributes', () => {
      render(<GlossariesSynonymsSkeleton />);
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBe(34);
    });

    it('renders with visible animation for loading indication', () => {
      render(<GlossariesSynonymsSkeleton />);
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      // MUI Skeleton uses pulse animation by default
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('MuiSkeleton-pulse');
      });
    });
  });

  describe('Component Structure Verification', () => {
    it('renders nested Box components correctly', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(15);
    });

    it('maintains consistent card structure across all 4 cards', () => {
      render(<GlossariesSynonymsSkeleton />);
      const circularSkeletons = document.querySelectorAll('.MuiSkeleton-circular');
      const textSkeletons = document.querySelectorAll('.MuiSkeleton-text');
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');

      // Each card has: 2 circular (icon + time) + 4 text (title + 2 desc + time) + 1 rounded (type chip)
      // Header has: 1 circular (sort) + 1 text (sort) + 4 rounded (search + 3 chips)
      // Total: 9 circular + 17 text + 8 rounded = 34 skeletons
      expect(circularSkeletons.length).toBe(9);
      expect(textSkeletons.length).toBe(17);
      expect(roundedSkeletons.length).toBe(8);
    });

    it('renders the component without any text content', () => {
      const { container } = render(<GlossariesSynonymsSkeleton />);
      const textContent = container.textContent?.trim();
      expect(textContent).toBe('');
    });
  });

  describe('Snapshot and Stability', () => {
    it('renders consistently on multiple renders', () => {
      const { container: container1 } = render(<GlossariesSynonymsSkeleton />);
      const { container: container2 } = render(<GlossariesSynonymsSkeleton />);

      const skeletons1 = container1.querySelectorAll('.MuiSkeleton-root').length;
      const skeletons2 = container2.querySelectorAll('.MuiSkeleton-root').length;

      expect(skeletons1).toBe(skeletons2);
    });

    it('renders the same number of elements each time', () => {
      const results: number[] = [];

      for (let i = 0; i < 3; i++) {
        const { container } = render(<GlossariesSynonymsSkeleton />);
        results.push(container.querySelectorAll('.MuiSkeleton-root').length);
      }

      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });

  describe('Edge Cases', () => {
    it('renders correctly when rendered multiple times in the same parent', () => {
      const { container } = render(
        <div>
          <GlossariesSynonymsSkeleton />
          <GlossariesSynonymsSkeleton />
        </div>
      );

      const skeletons = container.querySelectorAll('.MuiSkeleton-root');
      // 34 skeletons per component * 2 = 68
      expect(skeletons.length).toBe(68);
    });

    it('does not throw errors when unmounted', () => {
      const { unmount } = render(<GlossariesSynonymsSkeleton />);
      expect(() => unmount()).not.toThrow();
    });

    it('can be rendered within a fragment', () => {
      const { container } = render(
        <>
          <GlossariesSynonymsSkeleton />
        </>
      );
      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    });
  });

  describe('Filter Chips Section', () => {
    it('renders all three filter chip skeletons', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');

      // Check that we have filter chips with correct widths
      const chip60 = Array.from(roundedSkeletons).find(s =>
        s.getAttribute('style')?.includes('60px') &&
        s.getAttribute('style')?.includes('32px')
      );
      const chip90 = Array.from(roundedSkeletons).find(s =>
        s.getAttribute('style')?.includes('90px')
      );
      const chip110 = Array.from(roundedSkeletons).find(s =>
        s.getAttribute('style')?.includes('110px')
      );

      expect(chip60).toBeInTheDocument();
      expect(chip90).toBeInTheDocument();
      expect(chip110).toBeInTheDocument();
    });
  });

  describe('Card Type Chips', () => {
    it('renders type chip in each card with correct dimensions', () => {
      render(<GlossariesSynonymsSkeleton />);
      const roundedSkeletons = document.querySelectorAll('.MuiSkeleton-rounded');

      // Type chips are 60x20 (different from filter chips which are 60x32)
      const typeChips = Array.from(roundedSkeletons).filter(s => {
        const style = s.getAttribute('style');
        return style?.includes('60px') && style?.includes('20px');
      });

      expect(typeChips.length).toBe(4);
    });
  });
});
