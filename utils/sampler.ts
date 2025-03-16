/**
 * Creates a function that samples calls at regular intervals and captures trailing calls.
 * - Drops calls that occur between sampling intervals
 * - Takes one call per sampling interval if available
 * - Captures the last call if no call was made during the interval
 * - Uses requestAnimationFrame for better performance when available
 *
 * @param fn The function to sample
 * @param sampleInterval How often to sample calls (in ms)
 * @returns The sampled function
 */
export function createSampler<T extends (...args: any[]) => any>(fn: T, sampleInterval: number): T {
  let lastArgs: Parameters<T> | null = null;
  let lastTime = 0;
  let timeout: number | NodeJS.Timeout | null = null;
  let isScheduled = false;

  // 使用 requestAnimationFrame 进行更高效的调度
  const scheduleExecution = (delay: number, context: any) => {
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      // 如果延迟很短，直接使用 requestAnimationFrame
      if (delay < 16) {
        return window.requestAnimationFrame(() => {
          if (lastArgs) {
            fn.apply(context, lastArgs);
            lastArgs = null;
          }
          isScheduled = false;
        });
      }
    }
    
    // 否则使用 setTimeout
    return setTimeout(() => {
      if (lastArgs) {
        fn.apply(context, lastArgs);
        lastArgs = null;
      }
      isScheduled = false;
    }, delay);
  };

  // 取消调度
  const cancelSchedule = (id: number | NodeJS.Timeout) => {
    if (typeof id === 'number' && typeof window !== 'undefined' && 'cancelAnimationFrame' in window) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  };

  // Create a function with the same type as the input function
  const sampled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    lastArgs = args;

    // If we're within the sample interval, just store the args
    if (now - lastTime < sampleInterval) {
      // Set up trailing call if not already set
      if (!isScheduled) {
        isScheduled = true;
        if (timeout) {
          cancelSchedule(timeout);
        }
        
        timeout = scheduleExecution(
          sampleInterval - (now - lastTime),
          this
        );
      }

      return;
    }

    // If we're outside the interval, execute immediately
    lastTime = now;
    fn.apply(this, args);
    lastArgs = null;
  } as T;

  return sampled;
}
