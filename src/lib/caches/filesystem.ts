import { readdir } from "node:fs/promises";
import { Cache, CacheStats } from "./cache.ts";
import { BoundedLRUCache } from "./lru.ts";
import { mkdir, readFile, writeFile, rm } from "fs/promises";

export class FilesystemCache implements Cache {
    private basePath: string;
    private lru: BoundedLRUCache;

    constructor(basePath: string, maxSize: number) {
        this.basePath = basePath;
        this.lru = new BoundedLRUCache(maxSize);
    }

    async stats(): Promise<CacheStats> {
      return {
        itemCount: this.lru.count(),
        totalSize: this.lru.totalSize()
      }
    }

    async initialize(): Promise<void> {
        await mkdir(this.basePath, { recursive: true });

        // load existing files into LRU cache here by reading the directory content
        const files = await readdir(this.basePath);
        for (const file of files) {
            const bunFile = Bun.file(`${this.basePath}/${file}`);
            this.lru.set(file, bunFile.size);
        }
    }

    async get(key: string): Promise<Uint8Array | null> {
        if (!this.lru.has(key)) { // Update LRU access time
            return null;
        }

        const filePath = `${this.basePath}/${key}`;
        try {
            const file = Bun.file(filePath);
            return new Uint8Array(await file.bytes());
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
        const file = Bun.file(filePath);
        await file.write(data);
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