import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private readonly store = new Map<string, number[]>();

  isLimited(key: string, max = 5, windowMs = 10_000): boolean {
    const now = Date.now();
    const from = now - windowMs;

    const arr = this.store.get(key) ?? [];
    const recent = arr.filter((ts) => ts >= from);

    if (recent.length >= max) {
      this.store.set(key, recent);
      return true;
    }

    recent.push(now);
    this.store.set(key, recent);
    return false;
  }
}
