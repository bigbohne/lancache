export class CacheHelper {
    public canRequestBeCached(request: Request): boolean {
        // Only GET requests are cacheable
        if (request.method !== "GET") {
            return false;
        }

        // Add more conditions if needed (e.g., check headers)

        return true;
    }

    public fetchFromBackend(request: Request): Promise<Response> {
        const backendRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
        });

        return fetch(backendRequest);
    }

    public async createCacheKey(request: Request): Promise<string> {
        const url = new URL(request.url);

        // Normalize the URL by removing query parameters and fragments
        if (url.hostname.endsWith("steamcontent.com")) {
            url.hostname = "steamcontent.com";
        }

        const cacheKey = `${url.toString()}`;

        const messageBuffer = new TextEncoder().encode(cacheKey);
        const hashBuffer = await crypto.subtle.digest("SHA-256", messageBuffer);
        const hash = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return hash;
    }
}