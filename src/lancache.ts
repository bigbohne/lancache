import { Server } from "./lib/server.ts"
import { RequestHandler } from "./lib/handler.ts";

async function main() {
    const handler = new RequestHandler();
    await handler.initialize();
    new Server(handler);
}

main()