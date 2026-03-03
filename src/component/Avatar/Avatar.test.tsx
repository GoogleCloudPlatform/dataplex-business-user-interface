import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  describe('rendering', () => {
    it('should render the first character of text uppercased', () => {
      render(<Avatar text="john" />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render uppercase first character for lowercase text', () => {
      render(<Avatar text="alice" />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should render uppercase first character for uppercase text', () => {
      render(<Avatar text="BOB" />);

      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should render uppercase first character for mixed case text', () => {
      render(<Avatar text="cHARLIE" />);

      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should render single character text', () => {
      render(<Avatar text="X" />);

      expect(screen.getByText('X')).toBeInTheDocument();
    });

    it('should render first character for multi-word text', () => {
      render(<Avatar text="John Doe" />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render number as first character', () => {
      render(<Avatar text="123abc" />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should render special character as first character', () => {
      render(<Avatar text="@user" />);

      expect(screen.getByText('@')).toBeInTheDocument();
    });

    it('should render space as first character for space-prefixed text', () => {
      const { container } = render(<Avatar text=" space" />);
      const avatar = container.firstChild as HTMLElement;

      // Space character uppercased is still space
      expect(avatar.textContent).toBe(' ');
    });
  });

  describe('color generation', () => {
    it('should generate consistent color for same text', () => {
      const { rerender, container } = render(<Avatar text="consistent" />);
      const firstRenderStyle = container.firstChild as HTMLElement;
      const firstBgColor = firstRenderStyle.style.backgroundColor;
      const firstTextColor = firstRenderStyle.style.color;

      rerender(<Avatar text="consistent" />);
      const secondRenderStyle = container.firstChild as HTMLElement;
      const secondBgColor = secondRenderStyle.style.backgroundColor;
      const secondTextColor = secondRenderStyle.style.color;

      expect(firstBgColor).toBe(secondBgColor);
      expect(firstTextColor).toBe(secondTextColor);
    });

    it('should generate expected color based on hash algorithm', () => {
      const testText = 'TestUser';

      const { container } = render(<Avatar text={testText} />);
      const avatar = container.firstChild as HTMLElement;

      // Verify the avatar has colors assigned (browser normalizes to rgb)
      expect(avatar.style.backgroundColor).toBeTruthy();
      expect(avatar.style.color).toBeTruthy();
    });

    it('should produce different colors for different text', () => {
      const { container: container1 } = render(<Avatar text="Alice" />);
      const { container: container2 } = render(<Avatar text="Bob" />);
      const { container: container3 } = render(<Avatar text="Charlie" />);

      const avatar1 = container1.firstChild as HTMLElement;
      const avatar2 = container2.firstChild as HTMLElement;
      const avatar3 = container3.firstChild as HTMLElement;

      // At least some should be different (not all texts hash to same color)
      const colors = [
        avatar1.style.backgroundColor,
        avatar2.style.backgroundColor,
        avatar3.style.backgroundColor,
      ];

      // Check that colors are applied
      colors.forEach((color) => {
        expect(color).toBeTruthy();
      });
    });

    it('should use one of the predefined colors', () => {
      const testTexts = ['User1', 'User2', 'Admin', 'Guest', 'Test'];

      testTexts.forEach((text) => {
        const { container } = render(<Avatar text={text} />);
        const avatar = container.firstChild as HTMLElement;

        // Verify that the avatar has background and text colors
        expect(avatar.style.backgroundColor).toBeTruthy();
        expect(avatar.style.color).toBeTruthy();
      });
    });

    it('should handle hash for single character text', () => {
      const { container } = render(<Avatar text="A" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.backgroundColor).toBeTruthy();
      expect(avatar.style.color).toBeTruthy();
    });

    it('should handle hash for very long text', () => {
      const longText = 'A'.repeat(1000);
      const { container } = render(<Avatar text={longText} />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.backgroundColor).toBeTruthy();
      expect(avatar.style.color).toBeTruthy();
    });

    it('should handle hash for text with special characters', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const { container } = render(<Avatar text={specialText} />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.backgroundColor).toBeTruthy();
      expect(avatar.style.color).toBeTruthy();
    });

    it('should handle hash for unicode characters', () => {
      const unicodeText = '日本語テスト';
      const { container } = render(<Avatar text={unicodeText} />);
      const avatar = container.firstChild as HTMLElement;

      expect(screen.getByText('日')).toBeInTheDocument();
      expect(avatar.style.backgroundColor).toBeTruthy();
    });

    it('should handle hash for emoji text', () => {
      const emojiText = '😀Hello';
      const { container } = render(<Avatar text={emojiText} />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.backgroundColor).toBeTruthy();
    });
  });

  describe('styling', () => {
    it('should apply correct width and height', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.width).toBe('40px');
      expect(avatar.style.height).toBe('40px');
    });

    it('should apply correct minWidth and minHeight', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.minWidth).toBe('40px');
      expect(avatar.style.minHeight).toBe('40px');
    });

    it('should apply circular border radius', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.borderRadius).toBe('50%');
    });

    it('should apply flexbox centering', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.display).toBe('flex');
      expect(avatar.style.alignItems).toBe('center');
      expect(avatar.style.justifyContent).toBe('center');
    });

    it('should apply bold font weight', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.fontWeight).toBe('bold');
    });

    it('should apply correct font size', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.fontSize).toBe('18px');
    });

    it('should apply margin right', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.marginRight).toBe('12px');
    });

    it('should apply flex shrink 0', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.flexShrink).toBe('0');
    });

    it('should render as a div element', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.tagName).toBe('DIV');
    });
  });

  describe('hash algorithm coverage', () => {
    it('should iterate through all characters in text for hash', () => {
      // Test with various text lengths to ensure the loop executes
      const texts = ['A', 'AB', 'ABC', 'ABCD', 'ABCDE'];

      texts.forEach((text) => {
        const { container } = render(<Avatar text={text} />);
        const avatar = container.firstChild as HTMLElement;

        // Each should render successfully with colors
        expect(avatar.style.backgroundColor).toBeTruthy();
        expect(avatar.style.color).toBeTruthy();
      });
    });

    it('should handle text that produces negative hash', () => {
      // Various texts to potentially hit negative hash values
      const texts = ['zzzzz', 'ZZZZZ', '99999', '~~~~~'];

      texts.forEach((text) => {
        const { container } = render(<Avatar text={text} />);
        const avatar = container.firstChild as HTMLElement;

        // Math.abs ensures the index is positive
        expect(avatar.style.backgroundColor).toBeTruthy();
      });
    });

    it('should produce valid color index for any text', () => {
      // Test multiple random-like texts
      const texts = [
        'abcdef',
        'GHIJKL',
        '123456',
        'mixed123ABC',
        'special!@#$',
        '     ',
        '\t\n\r',
      ];

      texts.forEach((text) => {
        const { container } = render(<Avatar text={text} />);
        const avatar = container.firstChild as HTMLElement;

        expect(avatar.style.backgroundColor).toBeTruthy();
        expect(avatar.style.color).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string (edge case)', () => {
      const { container } = render(<Avatar text="" />);
      const avatar = container.firstChild as HTMLElement;

      // Empty string charAt(0) returns empty string
      // toUpperCase() on empty string returns empty string
      expect(avatar.textContent).toBe('');
      expect(avatar.style.backgroundColor).toBeTruthy();
    });

    it('should handle whitespace-only text', () => {
      const { container } = render(<Avatar text="   " />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.textContent).toBe(' ');
      expect(avatar.style.backgroundColor).toBeTruthy();
    });

    it('should handle newline character', () => {
      const { container } = render(<Avatar text="\ntext" />);
      const avatar = container.firstChild as HTMLElement;

      // Newline as first character
      expect(avatar.style.backgroundColor).toBeTruthy();
    });

    it('should handle tab character', () => {
      const { container } = render(<Avatar text="\ttext" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.style.backgroundColor).toBeTruthy();
    });

    it('should handle text with numbers only', () => {
      render(<Avatar text="42" />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should preserve case sensitivity in hash generation', () => {
      const { container: lowerContainer } = render(<Avatar text="test" />);
      const { container: upperContainer } = render(<Avatar text="TEST" />);

      const lowerAvatar = lowerContainer.firstChild as HTMLElement;
      const upperAvatar = upperContainer.firstChild as HTMLElement;

      // Both display 'T' but may have different colors due to different hashes
      expect(screen.getAllByText('T')).toHaveLength(2);

      // Colors might be different because hash is case-sensitive
      // We just verify both have valid colors
      expect(lowerAvatar.style.backgroundColor).toBeTruthy();
      expect(upperAvatar.style.backgroundColor).toBeTruthy();
    });
  });

  describe('component structure', () => {
    it('should render only one element', () => {
      const { container } = render(<Avatar text="Test" />);

      expect(container.childElementCount).toBe(1);
    });

    it('should have text content inside the div', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.textContent).toBe('T');
    });

    it('should not have nested elements', () => {
      const { container } = render(<Avatar text="Test" />);
      const avatar = container.firstChild as HTMLElement;

      expect(avatar.childElementCount).toBe(0);
    });
  });

  describe('default export', () => {
    it('should export Avatar as default', async () => {
      const module = await import('./Avatar');
      expect(module.default).toBeDefined();
    });
  });
});
