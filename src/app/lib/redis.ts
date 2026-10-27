import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
  username: config.redis_user,
  password: config.redis_password,
  socket: {
    host: config.redis_host,
    port: Number(config.redis_port),
    // give up after a few attempts instead of retrying (and logging) forever
    reconnectStrategy: (retries) =>
      retries > 5 ? false : Math.min(retries * 500, 3000),
  },
});

// without a listener, a redis "error" event crashes the whole process
redisClient.on("error", (error) => {
  console.log("Redis error:", error.message);
});
