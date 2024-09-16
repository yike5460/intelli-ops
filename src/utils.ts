export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  initialDelay: number
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      console.log(`Attempt ${retries + 1} of ${maxRetries + 1}`);
      const result = await fn();
      console.log(`Function executed successfully on attempt ${retries + 1}`);
      return result;
    } catch (error) {
      if (retries >= maxRetries) {
        console.error(`Max retries (${maxRetries}) reached. Throwing error.`);
        throw error;
      }
      const delay = initialDelay * Math.pow(2, retries);
      console.log(`Attempt ${retries + 1} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
}