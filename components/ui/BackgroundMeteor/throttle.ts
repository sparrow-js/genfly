/**
 * Creates a throttled function that only invokes the provided function at most once per
 * specified wait period.
 * 
 * @param func The function to throttle
 * @param wait The number of milliseconds to throttle invocations to
 * @returns A throttled version of the provided function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeout: number | null = null;
    
    return function(...args: Parameters<T>) {
      const now = Date.now();
      const remaining = wait - (now - lastCall);
      
      if (remaining <= 0) {
        if (timeout !== null) {
          clearTimeout(timeout);
          timeout = null;
        }
        lastCall = now;
        func(...args);
      } else if (timeout === null) {
        timeout = window.setTimeout(() => {
          lastCall = Date.now();
          timeout = null;
          func(...args);
        }, remaining);
      }
    };
  }
  