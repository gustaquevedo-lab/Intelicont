import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined;
}

let redis: Redis;

if (process.env.NODE_ENV === "production") {
  if (!redisUrl) {
    console.warn("WARNING: REDIS_URL environment variable is not defined");
  }
  redis = new Redis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
} else {
  if (!global.redis) {
    global.redis = new Redis(redisUrl || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  redis = global.redis;
}

redis.on("connect", () => {
  console.log("🚀 Connected to Redis database");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

export { redis };
