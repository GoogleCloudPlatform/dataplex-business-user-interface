import { useState, useCallback, useEffect, useRef, type Ref } from 'react';

/**
 * Extends HTMLElement to include vendor-prefixed fullscreen methods
 * for browsers like Safari.
 */
interface FullscreenableElement extends HTMLDivElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

/**
 * Defines the return type for the useFullScreenStatus hook.
 */
interface UseFullScreenStatusReturn {
  elementRef: Ref<FullscreenableElement | null>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

/**
 * A React hook to manage the fullscreen status of a specific element.
 *
 * @returns An object containing:
 * - `elementRef`: A React ref to attach to the target DOM element.
 * - `isFullscreen`: A boolean state indicating if the element is currently in fullscreen.
 * - `toggleFullscreen`: A function to toggle the element's fullscreen state.
 */
const useFullScreenStatus = (): UseFullScreenStatusReturn => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Type the ref to hold our custom FullscreenableElement or null
  const elementRef = useRef<FullscreenableElement | null>(null);

  const handleFullscreenChange = useCallback(() => {
    // Check if the elementRef.current is the current fullscreen element
    setIsFullscreen(document.fullscreenElement === elementRef.current);
  }, []); // No dependencies, as elementRef.current mutation doesn't trigger re-renders

  useEffect(() => {
    // Add event listeners to detect when fullscreen mode is entered or exited
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // For Safari
    
    return () => {
      // Clean up event listeners on component unmount
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen mode
      if (elementRef.current?.requestFullscreen) {
        elementRef.current.requestFullscreen();
      } else if (elementRef.current?.webkitRequestFullscreen) { // For Safari
        // This check is now type-safe thanks to the FullscreenableElement interface
        elementRef.current.webkitRequestFullscreen();
      }
    } else {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []); // No dependencies, as it relies on refs and document global

  // Return the ref to attach to the target element, the status, and the toggle function
  return { elementRef, isFullscreen, toggleFullscreen };
};

export default useFullScreenStatus;