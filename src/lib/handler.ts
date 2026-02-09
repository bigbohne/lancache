import { FilesystemCache } from "./caches/filesystem.ts";
import { CacheHelper } from "./helper.ts";

export class RequestHandler {
    private helper: CacheHelper = new CacheHelper();
    private cache: FilesystemCache = new FilesystemCache("./cache", 15 * 1024 * 1024 * 1024); // 15 GB

    private hitCount: number = 0;
    private missCount: number = 0;

    public async initialize(): Promise<void> {
        console.log("Initializing cache...");
        await this.cache.initialize();
        const stats = await this.cache.stats();
        console.log(`Cache initialized: ${stats.itemCount} files and ${Math.round(stats.totalSize / (1024 * 1024 * 102.4)) / 10} gigabytes used.`);

        setInterval(async () => {
            await this.cache.evictIfNeeded();
            const stats = await this.cache.stats();
        }, 10 * 1000); // Evict every 10 seconds
    }

    // Function that creates a cache key based on the requet URL

    public async handler(request: Request): Promise<Response> {
        if (!this.helper.canRequestBeCached(request)) {
            return await this.helper.fetchFromBackend(request);
        }

        const cacheKey = await this.helper.createCacheKey(request);
        
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
            const cachedResponse = new Response(cachedData, { status: 200 });
            //console.log("H: " + request.url);
            this.hitCount++;
            return cachedResponse;
        }

        // If the file does not exist, fetch from the backend
        // and write to the cache.
        const backendRequest = new Request(request.url);
        const response = await fetch(backendRequest);

        const backendData = await response.bytes();
        this.cache.set(cacheKey, backendData);

        const backendResponse = new Response(backendData, { status: 200 });
        //console.log("M: " + request.url);
        this.missCount++;
        return backendResponse;
    }

    public getStats(): { hits: number; misses: number } {
        return {
            hits: this.hitCount,
            misses: this.missCount,
        };
    }
}
