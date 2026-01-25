import { Cache } from "./cache.ts";
import { BoundedLRUCache } from "./lru.ts";
import { mkdir, readFile, writeFile, rm } from "fs/promises";

export class FilesystemCache implements Cache {
    private basePath: string;
    private lru: BoundedLRUCache;

    constructor(basePath: string, maxSize: number) {
        this.basePath = basePath;
        this.lru = new BoundedLRUCache(maxSize);
    }

    async get(key: string): Promise<Uint8Array | null> {
        if (!this.lru.has(key)) { // Update LRU access time
            return null;
        }

        const filePath = `${this.basePath}/${key}`;
        try {
            return new Uint8Array(await readFile(filePath));
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    async set(key: string, data: Uint8Array): Promise<void> {
        this.lru.set(key, data.length);
        const filePath = `${this.basePath}/${key}`;
        await mkdir(this.basePath, { recursive: true });
        await writeFile(filePath, data);
    }

    async evictIfNeeded(): Promise<void> {
        const evictedKeys = this.lru.evict();
        for (const key of evictedKeys) {
            const filePath = `${this.basePath}/${key}`;
            try {
                await rm(filePath);
            } catch (error) {
                if (((error as NodeJS.ErrnoException).code !== "ENOENT")) {
                    throw error;
                }
            }
        }
    }
}