type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

export class LRUCache<T> {
	private cache: Map<string, CacheEntry<T>>;
	private readonly maxSize: number;
	private readonly ttlMs: number;

	constructor(maxSize: number, ttlMs: number) {
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttlMs = ttlMs;
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		// Move to end (most recently used)
		this.cache.delete(key);
		this.cache.set(key, entry);
		return entry.value;
	}

	set(key: string, value: T): void {
		// Delete first to update position if exists
		this.cache.delete(key);

		// Evict oldest if at capacity
		if (this.cache.size >= this.maxSize) {
			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) this.cache.delete(oldestKey);
		}

		this.cache.set(key, {
			value,
			expiresAt: Date.now() + this.ttlMs,
		});
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	get size(): number {
		return this.cache.size;
	}
}
