import { Server } from "./lib/server.ts"
import { RequestHandler } from "./lib/handler.ts";

function main() {
    const handler = new RequestHandler();
    new Server(handler);
}

main()