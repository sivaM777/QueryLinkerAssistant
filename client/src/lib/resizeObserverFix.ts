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
  const isROMessage = (msg?: string) => !!msg && (
    msg.includes('ResizeObserver loop completed with undelivered notifications') ||
    msg.includes('ResizeObserver loop limit exceeded')
  );
  window.ResizeObserver = class extends originalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      const wrappedCallback: ResizeObserverCallback = (entries, observer) => {
        try {
          // Defer callback to next frame to avoid feedback loops
          requestAnimationFrame(() => callback(entries, observer));
        } catch (e) {
          if (e instanceof Error && isROMessage(e.message)) {
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
    if (typeof message === 'string' && isROMessage(message)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && isROMessage(message)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  // Listen for unhandled errors
  window.addEventListener('error', (event) => {
    if (isROMessage(event.message)) {
      event.preventDefault();
    }
  });

  // Some libraries surface this via unhandledrejection
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const msg = (event.reason && (event.reason.message || String(event.reason))) as string;
    if (isROMessage(msg)) {
      event.preventDefault();
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
