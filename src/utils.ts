export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialDelay: number
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, retries)));
      retries++;
    }
  }
}