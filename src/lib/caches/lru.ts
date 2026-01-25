export type CacheEntry = {
    key: string;
    size: number;
    createdAt: number; // Unix timestamp
    lastAccessed: number; // Unix timestamp
}

class BoundedLRUCache {
    private cache: Map<string, CacheEntry> =
        new Map();
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    set(key: string, size: number): void {
        const now = Date.now();
        this.cache.set(key, { key, size, createdAt: now, lastAccessed: now });
    }

    has(key: string): boolean {
        if (this.cache.has(key)) {
            const entry = this.cache.get(key)!;
            entry.lastAccessed = Date.now();
            return true;
        }
        return false;
    }

    /**
     * 
     * @returns List of keys that have been evicted due to size
     */
    evict(): string[] {
        const evicted: string[] = [];
        let totalSize = this.totalSize();

        if (totalSize <= this.maxSize) {
            return evicted;
        }

        const sorted = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        for (const [key, entry] of sorted) {
            if (totalSize <= this.maxSize) break;
            this.cache.delete(key);
            evicted.push(key);
            totalSize -= entry.size;
        }

        return evicted;
    }

    totalSize(): number {
        return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    }

    export(): CacheEntry[] {
        return Array.from(this.cache.values());
    }

    import(entries: CacheEntry[]): void {
        this.cache.clear();
        for (const entry of entries) {
            this.cache.set(entry.key, entry);
        }
    }
}

export { BoundedLRUCache };