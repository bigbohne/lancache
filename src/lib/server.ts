import { RequestHandler } from "./handler.ts";
import Bun from "bun";
import { register } from "prom-client";

export class Server {
    private server: Bun.Server<undefined>;

    constructor(handler: RequestHandler) {
        this.server = Bun.serve({
            routes: {
                '/metrics': async () => {
                    return new Response(await register.metrics(), {
                        status: 200,
                        headers: { 'Content-Type': register.contentType }
                    });
                },
                '/favicon.ico': () => new Response(null, { status: 204 }) // Ignore favicon requests
            },
            port: 8080,
            fetch(request) {
                return handler.handler(request);
            }
        });
        console.log(`Server running at http://localhost:8080`);
        console.log(`Metrics available at http://localhost:8080/metrics`);
    }
}
