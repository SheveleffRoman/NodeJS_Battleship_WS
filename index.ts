import { httpServer } from "./src/http_server/index.js";
import { wsServer } from "./src/ws/ws-server.js";
import dotenv from "dotenv";

dotenv.config();

const HOST = "localhost";
const http_port = process.env.HTTP_PORT || 8181;

console.log(`Start static http server on the ${http_port} port!`);
httpServer.listen(http_port);

wsServer.on("listening", () => {
  console.log(`WS server started on ws://${HOST}:${wsServer.options.port}`);
});
