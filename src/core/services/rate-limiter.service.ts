import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private readonly store = new Map<string, number[]>();

  isLimited(key: string, max = 5, windowMs = 10_000): boolean {
    const now = Date.now();
    const from = now - windowMs;

    const arr = this.store.get(key) ?? [];
    const recent = arr.filter((ts) => ts >= from);

    // Check if we would exceed the limit with this request
    if (recent.length >= max) {
      return true;
    }

    // Add current timestamp since we're within the limit
    recent.push(now);
    this.store.set(key, recent);

    return false;
  }

  // Add method to clear rate limiter for testing
  clearAll(): void {
    this.store.clear();
  }

  // Clear specific key
  clearKey(key: string): void {
    this.store.delete(key);
  }
}
