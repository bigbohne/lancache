import { FilesystemCache } from "./caches/filesystem.ts";
import { CacheHelper } from "./helper.ts";
import { Counter, Gauge } from "prom-client";

const CACHE_MAX_SIZE = 15 * 1024 * 1024 * 1024; // 15 GB

export class RequestHandler {
    private helper: CacheHelper = new CacheHelper();
    private cache: FilesystemCache = new FilesystemCache("./cache", CACHE_MAX_SIZE);

    private cacheRequests = new Counter({
        name: "lancache_requests_total",
        help: "Total number of requests"
    });

    private cacheRequestsSkipped = new Counter({
        name: "lancache_requests_skipped_total",
        help: "Total number of requests that were skipped for caching"
    });

    private cacheHits = new Counter({
        name: "lancache_hits_total",
        help: "Total number of cache hits"
    });

    private cacheMisses = new Counter({
        name: "lancache_misses_total",
        help: "Total number of cache misses"
    });

    private cacheMaxSize = new Gauge({
        name: "lancache_max_size_bytes",
        help: "Maximum cache size in bytes",
        collect() {
            this.set(CACHE_MAX_SIZE);
        }
    })

    private cacheSize = new Gauge({
        name: "lancache_size_bytes",
        help: "Current cache size in bytes"
    });

    private cacheItemCount = new Gauge({
        name: "lancache_items_total",
        help: "Total number of items in cache"
    });

    public async initialize(): Promise<void> {
        console.log("Initializing cache...");
        await this.cache.initialize();
        const stats = await this.cache.stats();
        console.log(`Cache initialized: ${stats.itemCount} files and ${Math.round(stats.totalSize / (1024 * 1024 * 102.4)) / 10} gigabytes used.`);

        this.cacheSize.set(stats.totalSize);
        this.cacheItemCount.set(stats.itemCount);

        setInterval(async () => {
            await this.cache.evictIfNeeded();
            const stats = await this.cache.stats();
            this.cacheSize.set(stats.totalSize);
            this.cacheItemCount.set(stats.itemCount);
        }, 10 * 1000); // Evict every 10 seconds
    }

    // Function that creates a cache key based on the requet URL

    public async handler(request: Request): Promise<Response> {
        this.cacheRequests.inc();
        if (!this.helper.canRequestBeCached(request)) {
            this.cacheRequestsSkipped.inc();
            return await this.helper.fetchFromBackend(request);
        }

        const cacheKey = await this.helper.createCacheKey(request);

        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
            const cachedResponse = new Response(cachedData, { status: 200 });
            this.cacheHits.inc();
            return cachedResponse;
        }

        // If the file does not exist, fetch from the backend
        // and write to the cache.
        const backendRequest = new Request(request.url);
        const response = await fetch(backendRequest);

        const backendData = await response.bytes();
        this.cache.set(cacheKey, backendData);

        const backendResponse = new Response(backendData, { status: 200 });
        this.cacheMisses.inc();
        return backendResponse;
    }
}
