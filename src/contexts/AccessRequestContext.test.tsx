import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { AccessRequestProvider, useAccessRequest } from './AccessRequestContext';

describe('AccessRequestContext', () => {
  // Suppress console.error for expected error tests
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('AccessRequestProvider', () => {
    it('renders children correctly', () => {
      render(
        <AccessRequestProvider>
          <div data-testid="child">Child Content</div>
        </AccessRequestProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders multiple children correctly', () => {
      render(
        <AccessRequestProvider>
          <div data-testid="child1">First Child</div>
          <div data-testid="child2">Second Child</div>
          <span data-testid="child3">Third Child</span>
        </AccessRequestProvider>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    it('renders nested components correctly', () => {
      const NestedComponent = () => <div data-testid="nested">Nested</div>;

      render(
        <AccessRequestProvider>
          <div data-testid="wrapper">
            <NestedComponent />
          </div>
        </AccessRequestProvider>
      );

      expect(screen.getByTestId('wrapper')).toBeInTheDocument();
      expect(screen.getByTestId('nested')).toBeInTheDocument();
    });

    it('renders with no children', () => {
      const { container } = render(<AccessRequestProvider>{null}</AccessRequestProvider>);
      expect(container).toBeInTheDocument();
    });

    it('renders with fragment children', () => {
      render(
        <AccessRequestProvider>
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </AccessRequestProvider>
      );

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
    });
  });

  describe('useAccessRequest hook', () => {
    it('returns context value when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isAccessPanelOpen).toBeDefined();
      expect(result.current.setAccessPanelOpen).toBeDefined();
    });

    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAccessRequest());
      }).toThrow('useAccessRequest must be used within an AccessRequestProvider');
    });

    it('returns isAccessPanelOpen as false by default', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(result.current.isAccessPanelOpen).toBe(false);
    });

    it('returns setAccessPanelOpen as a function', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(typeof result.current.setAccessPanelOpen).toBe('function');
    });
  });

  describe('setAccessPanelOpen functionality', () => {
    it('updates isAccessPanelOpen to true', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(result.current.isAccessPanelOpen).toBe(false);

      act(() => {
        result.current.setAccessPanelOpen(true);
      });

      expect(result.current.isAccessPanelOpen).toBe(true);
    });

    it('updates isAccessPanelOpen to false', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // First set to true
      act(() => {
        result.current.setAccessPanelOpen(true);
      });

      expect(result.current.isAccessPanelOpen).toBe(true);

      // Then set to false
      act(() => {
        result.current.setAccessPanelOpen(false);
      });

      expect(result.current.isAccessPanelOpen).toBe(false);
    });

    it('handles multiple state toggles', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      expect(result.current.isAccessPanelOpen).toBe(false);

      act(() => {
        result.current.setAccessPanelOpen(true);
      });
      expect(result.current.isAccessPanelOpen).toBe(true);

      act(() => {
        result.current.setAccessPanelOpen(false);
      });
      expect(result.current.isAccessPanelOpen).toBe(false);

      act(() => {
        result.current.setAccessPanelOpen(true);
      });
      expect(result.current.isAccessPanelOpen).toBe(true);

      act(() => {
        result.current.setAccessPanelOpen(true);
      });
      expect(result.current.isAccessPanelOpen).toBe(true);
    });

    it('setting same value does not cause issues', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Set to false when already false
      act(() => {
        result.current.setAccessPanelOpen(false);
      });
      expect(result.current.isAccessPanelOpen).toBe(false);

      // Set to true
      act(() => {
        result.current.setAccessPanelOpen(true);
      });
      expect(result.current.isAccessPanelOpen).toBe(true);

      // Set to true again when already true
      act(() => {
        result.current.setAccessPanelOpen(true);
      });
      expect(result.current.isAccessPanelOpen).toBe(true);
    });
  });

  describe('Context sharing between components', () => {
    it('shares state between multiple consumers', () => {
      let consumerOneValue: boolean | undefined;
      let consumerTwoValue: boolean | undefined;
      let setterFunction: ((isOpen: boolean) => void) | undefined;

      const ConsumerOne = () => {
        const { isAccessPanelOpen } = useAccessRequest();
        consumerOneValue = isAccessPanelOpen;
        return <div data-testid="consumer-one">{String(isAccessPanelOpen)}</div>;
      };

      const ConsumerTwo = () => {
        const { isAccessPanelOpen, setAccessPanelOpen } = useAccessRequest();
        consumerTwoValue = isAccessPanelOpen;
        setterFunction = setAccessPanelOpen;
        return <div data-testid="consumer-two">{String(isAccessPanelOpen)}</div>;
      };

      render(
        <AccessRequestProvider>
          <ConsumerOne />
          <ConsumerTwo />
        </AccessRequestProvider>
      );

      // Both should have same initial value
      expect(consumerOneValue).toBe(false);
      expect(consumerTwoValue).toBe(false);
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('false');
      expect(screen.getByTestId('consumer-two')).toHaveTextContent('false');

      // Update from one consumer
      act(() => {
        setterFunction!(true);
      });

      // Both should reflect the change
      expect(screen.getByTestId('consumer-one')).toHaveTextContent('true');
      expect(screen.getByTestId('consumer-two')).toHaveTextContent('true');
    });

    it('nested providers have independent state', () => {
      let outerValue: boolean | undefined;
      let innerValue: boolean | undefined;
      let outerSetter: ((isOpen: boolean) => void) | undefined;
      let innerSetter: ((isOpen: boolean) => void) | undefined;

      const OuterConsumer = () => {
        const { isAccessPanelOpen, setAccessPanelOpen } = useAccessRequest();
        outerValue = isAccessPanelOpen;
        outerSetter = setAccessPanelOpen;
        return <div data-testid="outer">{String(isAccessPanelOpen)}</div>;
      };

      const InnerConsumer = () => {
        const { isAccessPanelOpen, setAccessPanelOpen } = useAccessRequest();
        innerValue = isAccessPanelOpen;
        innerSetter = setAccessPanelOpen;
        return <div data-testid="inner">{String(isAccessPanelOpen)}</div>;
      };

      render(
        <AccessRequestProvider>
          <OuterConsumer />
          <AccessRequestProvider>
            <InnerConsumer />
          </AccessRequestProvider>
        </AccessRequestProvider>
      );

      // Both start as false
      expect(outerValue).toBe(false);
      expect(innerValue).toBe(false);

      // Update outer
      act(() => {
        outerSetter!(true);
      });

      expect(screen.getByTestId('outer')).toHaveTextContent('true');
      expect(screen.getByTestId('inner')).toHaveTextContent('false');

      // Update inner
      act(() => {
        innerSetter!(true);
      });

      expect(screen.getByTestId('outer')).toHaveTextContent('true');
      expect(screen.getByTestId('inner')).toHaveTextContent('true');
    });
  });

  describe('Context value memoization', () => {
    it('setAccessPanelOpen function reference is stable', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result, rerender } = renderHook(() => useAccessRequest(), { wrapper });

      const initialSetter = result.current.setAccessPanelOpen;

      // Trigger a rerender
      rerender();

      // Function reference should remain the same due to useCallback
      expect(result.current.setAccessPanelOpen).toBe(initialSetter);
    });

    it('context value object changes when state changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      const initialValue = result.current;

      act(() => {
        result.current.setAccessPanelOpen(true);
      });

      // Value object should be different due to useMemo dependencies
      expect(result.current).not.toBe(initialValue);
      expect(result.current.isAccessPanelOpen).toBe(true);
    });
  });

  describe('Component integration', () => {
    it('button click can toggle panel state', () => {
      const TestComponent = () => {
        const { isAccessPanelOpen, setAccessPanelOpen } = useAccessRequest();

        return (
          <div>
            <span data-testid="status">{isAccessPanelOpen ? 'open' : 'closed'}</span>
            <button data-testid="open-btn" onClick={() => setAccessPanelOpen(true)}>
              Open
            </button>
            <button data-testid="close-btn" onClick={() => setAccessPanelOpen(false)}>
              Close
            </button>
          </div>
        );
      };

      render(
        <AccessRequestProvider>
          <TestComponent />
        </AccessRequestProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('closed');

      act(() => {
        screen.getByTestId('open-btn').click();
      });

      expect(screen.getByTestId('status')).toHaveTextContent('open');

      act(() => {
        screen.getByTestId('close-btn').click();
      });

      expect(screen.getByTestId('status')).toHaveTextContent('closed');
    });

    it('conditional rendering based on context state', () => {
      const PanelComponent = () => {
        const { isAccessPanelOpen } = useAccessRequest();

        return isAccessPanelOpen ? (
          <div data-testid="panel">Panel is visible</div>
        ) : null;
      };

      const ToggleButton = () => {
        const { setAccessPanelOpen, isAccessPanelOpen } = useAccessRequest();

        return (
          <button
            data-testid="toggle-btn"
            onClick={() => setAccessPanelOpen(!isAccessPanelOpen)}
          >
            Toggle
          </button>
        );
      };

      render(
        <AccessRequestProvider>
          <PanelComponent />
          <ToggleButton />
        </AccessRequestProvider>
      );

      // Panel should not be visible initially
      expect(screen.queryByTestId('panel')).not.toBeInTheDocument();

      // Toggle to open
      act(() => {
        screen.getByTestId('toggle-btn').click();
      });

      expect(screen.getByTestId('panel')).toBeInTheDocument();
      expect(screen.getByTestId('panel')).toHaveTextContent('Panel is visible');

      // Toggle to close
      act(() => {
        screen.getByTestId('toggle-btn').click();
      });

      expect(screen.queryByTestId('panel')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles rapid state changes', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      act(() => {
        result.current.setAccessPanelOpen(true);
        result.current.setAccessPanelOpen(false);
        result.current.setAccessPanelOpen(true);
        result.current.setAccessPanelOpen(false);
        result.current.setAccessPanelOpen(true);
      });

      expect(result.current.isAccessPanelOpen).toBe(true);
    });

    it('works with deeply nested consumers', () => {
      let deepValue: boolean | undefined;

      const Level1 = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="level1">{children}</div>
      );
      const Level2 = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="level2">{children}</div>
      );
      const Level3 = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="level3">{children}</div>
      );

      const DeepConsumer = () => {
        const { isAccessPanelOpen } = useAccessRequest();
        deepValue = isAccessPanelOpen;
        return <div data-testid="deep-consumer">{String(isAccessPanelOpen)}</div>;
      };

      render(
        <AccessRequestProvider>
          <Level1>
            <Level2>
              <Level3>
                <DeepConsumer />
              </Level3>
            </Level2>
          </Level1>
        </AccessRequestProvider>
      );

      expect(deepValue).toBe(false);
      expect(screen.getByTestId('deep-consumer')).toHaveTextContent('false');
    });
  });

  describe('TypeScript type safety', () => {
    it('context returns correct types', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessRequestProvider>{children}</AccessRequestProvider>
      );

      const { result } = renderHook(() => useAccessRequest(), { wrapper });

      // Type assertions to verify TypeScript types at runtime
      const isBoolean = typeof result.current.isAccessPanelOpen === 'boolean';
      const isFunction = typeof result.current.setAccessPanelOpen === 'function';

      expect(isBoolean).toBe(true);
      expect(isFunction).toBe(true);
    });
  });
});
