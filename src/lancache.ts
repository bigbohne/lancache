import { Server } from "./lib/server.ts"
import { RequestHandler } from "./lib/handler.ts";
import { collectDefaultMetrics } from "prom-client";

async function main() {
    const handler = new RequestHandler();

    // Loads cache
    await handler.initialize();

    new Server(handler);

    collectDefaultMetrics();
}

main()

process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});