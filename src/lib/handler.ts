import { FilesystemCache } from "./caches/filesystem.ts";
import { CacheHelper } from "./helper.ts";

export class RequestHandler {
    private helper: CacheHelper = new CacheHelper();
    private cache: FilesystemCache = new FilesystemCache("./cache", 10 * 1024 * 1024 * 1024); // 10 GB

    constructor() {}

    // Function that creates a cache key based on the requet URL

    public async handler(request: Request): Promise<Response> {
        if (!this.helper.canRequestBeCached(request)) {
            return await this.helper.fetchFromBackend(request);
        }

        const cacheKey = await this.helper.createCacheKey(request);
        
        const cachedData = await this.cache.get(cacheKey);
        if (cachedData) {
            const cachedResponse = new Response(cachedData, { status: 200 });
            console.log("H: " + request.url);
            return cachedResponse;
        }

        // If the file does not exist, fetch from the backend
        // and write to the cache.
        const backendRequest = new Request(request.url);
        const response = await fetch(backendRequest);

        const backendData = await response.bytes();
        this.cache.set(cacheKey, backendData);

        const backendResponse = new Response(backendData, { status: 200 });
        console.log("M: " + request.url);
        return backendResponse;

    }
}
