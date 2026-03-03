import { describe, it, expect } from 'vitest';
import { sanitizeFirstName, FALLBACK_GREETING, MAX_NAME_LENGTH } from './sanitizeName';

describe('sanitizeFirstName', () => {
  // ========================================================================
  // 1. Null / Empty (Absence of Data)
  // ========================================================================
  describe('Null/Empty cases', () => {
    it('returns fallback for null', () => {
      expect(sanitizeFirstName(null)).toBe(FALLBACK_GREETING);
    });

    it('returns fallback for undefined', () => {
      expect(sanitizeFirstName(undefined)).toBe(FALLBACK_GREETING);
    });

    it('returns fallback for empty string', () => {
      expect(sanitizeFirstName('')).toBe(FALLBACK_GREETING);
    });

    it('returns fallback for string of only spaces', () => {
      expect(sanitizeFirstName('   ')).toBe(FALLBACK_GREETING);
    });
  });

  // ========================================================================
  // 2. Whitespace Anomalies
  // ========================================================================
  describe('Whitespace anomalies', () => {
    it('trims leading spaces', () => {
      expect(sanitizeFirstName('  John Doe')).toBe('John');
    });

    it('trims trailing spaces', () => {
      expect(sanitizeFirstName('John  ')).toBe('John');
    });

    it('collapses multiple internal spaces before extracting first name', () => {
      expect(sanitizeFirstName('Mary    Jane')).toBe('Mary');
    });

    it('converts tab characters to spaces', () => {
      expect(sanitizeFirstName('John\tDoe')).toBe('John');
    });

    it('converts newline characters to spaces', () => {
      expect(sanitizeFirstName('John\nDoe')).toBe('John');
    });

    it('converts carriage return to space', () => {
      expect(sanitizeFirstName('John\rDoe')).toBe('John');
    });

    it('strips zero-width spaces (U+200B)', () => {
      expect(sanitizeFirstName('John\u200BDoe')).toBe('JohnDoe');
    });

    it('strips zero-width non-joiner (U+200C)', () => {
      expect(sanitizeFirstName('John\u200CDoe')).toBe('JohnDoe');
    });

    it('strips zero-width joiner (U+200D)', () => {
      expect(sanitizeFirstName('John\u200DDoe')).toBe('JohnDoe');
    });

    it('strips BOM character (U+FEFF)', () => {
      expect(sanitizeFirstName('\uFEFFJohn')).toBe('John');
    });

    it('strips soft hyphen (U+00AD)', () => {
      expect(sanitizeFirstName('John\u00ADDoe')).toBe('JohnDoe');
    });

    it('handles mixed whitespace anomalies together', () => {
      expect(sanitizeFirstName('  \t John \n Doe  ')).toBe('John');
    });
  });

  // ========================================================================
  // 3. Length Boundaries
  // ========================================================================
  describe('Length boundaries', () => {
    it('handles minimum length (1 character)', () => {
      expect(sanitizeFirstName('A')).toBe('A');
    });

    it('preserves a name under the max length', () => {
      const name = 'A'.repeat(50);
      expect(sanitizeFirstName(name)).toBe(name);
    });

    it('preserves a name at exactly the max length', () => {
      const name = 'A'.repeat(MAX_NAME_LENGTH);
      expect(sanitizeFirstName(name)).toBe(name);
    });

    it('truncates a single word exceeding max length', () => {
      const name = 'A'.repeat(MAX_NAME_LENGTH + 1);
      expect(sanitizeFirstName(name)).toBe('A'.repeat(MAX_NAME_LENGTH));
    });

    it('truncates an extremely long single word (255 chars)', () => {
      const name = 'B'.repeat(255);
      expect(sanitizeFirstName(name)).toHaveLength(MAX_NAME_LENGTH);
    });

    it('extracts only the first word from a long multi-word string', () => {
      const name = 'John Jacob Jingleheimer Schmidt The Third Of His Name';
      expect(sanitizeFirstName(name)).toBe('John');
    });

    it('handles a long first word with short remainder', () => {
      const longFirst = 'A'.repeat(70) + ' Short';
      expect(sanitizeFirstName(longFirst)).toBe('A'.repeat(MAX_NAME_LENGTH));
    });
  });

  // ========================================================================
  // 4. Character Sets & Typography
  // ========================================================================
  describe('Character sets & typography', () => {
    it('preserves standard hyphens', () => {
      expect(sanitizeFirstName('Mary-Jane Watson')).toBe('Mary-Jane');
    });

    it('escapes apostrophes', () => {
      expect(sanitizeFirstName("O'Connor Smith")).toBe("O&#x27;Connor");
    });

    it("handles D'Artagnan style names", () => {
      expect(sanitizeFirstName("D'Artagnan Musketeer")).toBe("D&#x27;Artagnan");
    });

    it('preserves accented characters (René)', () => {
      expect(sanitizeFirstName('René Dupont')).toBe('René');
    });

    it('preserves umlauts (Zöe)', () => {
      expect(sanitizeFirstName('Zöe Schmidt')).toBe('Zöe');
    });

    it('preserves macrons (Jūlija)', () => {
      expect(sanitizeFirstName('Jūlija Kalnina')).toBe('Jūlija');
    });

    it('preserves Cyrillic characters', () => {
      expect(sanitizeFirstName('Иван Петров')).toBe('Иван');
    });

    it('preserves Kanji characters', () => {
      expect(sanitizeFirstName('太郎 山田')).toBe('太郎');
    });

    it('preserves Arabic characters (RTL)', () => {
      expect(sanitizeFirstName('محمد أحمد')).toBe('محمد');
    });

    it('preserves Hebrew characters (RTL)', () => {
      expect(sanitizeFirstName('שלום Cohen')).toBe('שלום');
    });

    it('preserves Korean characters', () => {
      expect(sanitizeFirstName('김철수 Lee')).toBe('김철수');
    });

    it('preserves emojis in name', () => {
      expect(sanitizeFirstName('✨Dave✨ Smith')).toBe('✨Dave✨');
    });

    it('extracts first word when emoji is in second word', () => {
      expect(sanitizeFirstName('John 👨‍💻')).toBe('John');
    });

    it('handles numbers in names', () => {
      expect(sanitizeFirstName('John 2nd')).toBe('John');
    });

    it('preserves alphanumeric names', () => {
      expect(sanitizeFirstName('R2D2')).toBe('R2D2');
    });

    it('handles complex European names with hyphens and accents', () => {
      expect(sanitizeFirstName('Jean-François de la Tour')).toBe('Jean-François');
    });

    it('handles name with period', () => {
      expect(sanitizeFirstName('Dr. Smith')).toBe('Dr.');
    });
  });

  // ========================================================================
  // 5. Security / Injection Attempts
  // ========================================================================
  describe('Security / Injection', () => {
    it('escapes basic HTML tags', () => {
      expect(sanitizeFirstName('<b>John</b>')).toBe('&lt;b&gt;John&lt;/b&gt;');
    });

    it('escapes script tag XSS attempt (extracts first word)', () => {
      const result = sanitizeFirstName('<script>alert("hack")</script>');
      expect(result).toBe('&lt;script&gt;alert(&quot;hack&quot;)&lt;/script&gt;');
    });

    it('escapes script tag with single quotes', () => {
      const result = sanitizeFirstName("<script>alert('xss')</script>");
      expect(result).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;");
    });

    it('handles SQL injection attempt (extracts first word)', () => {
      const result = sanitizeFirstName("Robert'); DROP TABLE Students;--");
      expect(result).toBe("Robert&#x27;);");
    });

    it('renders template literal injection as plain string', () => {
      expect(sanitizeFirstName('{{7*7}}')).toBe('{{7*7}}');
    });

    it('renders JS template string injection as plain string', () => {
      expect(sanitizeFirstName('${7*7}')).toBe('${7*7}');
    });

    it('escapes img tag with onerror (extracts first word)', () => {
      const result = sanitizeFirstName('<img src=x onerror=alert(1)>');
      expect(result).toBe('&lt;img');
    });

    it('escapes anchor tag injection', () => {
      const result = sanitizeFirstName('<a href="javascript:alert(1)">click</a>');
      expect(result).toBe('&lt;a');
    });

    it('escapes event handler injection', () => {
      const result = sanitizeFirstName('" onmouseover="alert(1)');
      expect(result).toBe('&quot;');
    });

    it('handles iframe injection attempt', () => {
      const result = sanitizeFirstName('<iframe src="evil.com"></iframe>');
      expect(result).toBe('&lt;iframe');
    });

    it('escapes ampersand to prevent entity injection', () => {
      expect(sanitizeFirstName('Tom&Jerry')).toBe('Tom&amp;Jerry');
    });
  });
});
