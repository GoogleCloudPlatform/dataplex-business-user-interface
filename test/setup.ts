import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock CSS imports
vi.mock('*.css', () => ({}));
vi.mock('*.scss', () => ({}));

// Runs a cleanup after each test case (e.g., clearing JSDOM)
afterEach(() => {
  cleanup();
});