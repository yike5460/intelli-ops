export declare function exponentialBackoff<T>(fn: () => Promise<T>, maxRetries: number, initialDelay: number): Promise<T>;
