import { Server } from "./lib/server.ts"
import { RequestHandler } from "./lib/handler.ts";

async function main() {
    const handler = new RequestHandler();
    await handler.initialize();
    new Server(handler);

    let stats = handler.getStats();
    setInterval(() => {
        // build diff stats
        const current = handler.getStats();
        const diff = {
            hits: current.hits - stats.hits,
            misses: current.misses - stats.misses,
        };

        console.log(`Cache Stats - Hits: ${diff.hits}, Misses: ${diff.misses}`);
        stats = current;
    }, 1000); // Log stats every second
}

main()