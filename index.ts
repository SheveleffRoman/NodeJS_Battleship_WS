import { httpServer } from "./src/http_server/index.js";
import { wsServer } from "./src/ws/ws-server.js";

const HTTP_PORT = 8181;
const HOST = "localhost"

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

wsServer.on("listening", () => {
  console.log(
    `WS server started on ws://${HOST}:${wsServer.options.port}`
  );
});
