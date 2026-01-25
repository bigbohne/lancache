import { RequestHandler } from "./handler.ts";
import Bun from "bun";

export class Server {
    private server: Bun.Server;
    constructor(handler: RequestHandler) {
        this.server = Bun.serve({
            port: 8080,
            fetch(request) {
                return handler.handler(request);
            }
        });
        console.log(`Server running at http://localhost:8080`);
    }
}
