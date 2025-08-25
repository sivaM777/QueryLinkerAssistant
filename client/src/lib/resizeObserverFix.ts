// Fix for ResizeObserver loop completed with undelivered notifications
// This is a common issue with chart libraries like Recharts

let resizeObserverErrorSuppressed = false;

export function suppressResizeObserverError() {
  if (resizeObserverErrorSuppressed) {
    return;
  }

  resizeObserverErrorSuppressed = true;

  // Override ResizeObserver to catch and ignore the specific error
  const originalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends originalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      const wrappedCallback: ResizeObserverCallback = (entries, observer) => {
        try {
          callback(entries, observer);
        } catch (e) {
          // Suppress the specific ResizeObserver error
          if (e instanceof Error && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
            console.warn('ResizeObserver error suppressed:', e.message);
            return;
          }
          throw e;
        }
      };
      super(wrappedCallback);
    }
  };

  // Also catch unhandled ResizeObserver errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && message.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.warn('ResizeObserver error suppressed:', message);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Listen for unhandled errors
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      console.warn('ResizeObserver error suppressed:', event.message);
    }
  });
}

// Debounced ResizeObserver for custom use
export function createDebouncedResizeObserver(callback: ResizeObserverCallback, delay = 100) {
  let timeoutId: number;

  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      try {
        callback(entries, observer);
      } catch (e) {
        if (e instanceof Error && e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          console.warn('ResizeObserver error suppressed in debounced callback');
          return;
        }
        throw e;
      }
    }, delay);
  };

  return new ResizeObserver(debouncedCallback);
}
