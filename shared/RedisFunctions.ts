import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisSetName = process.env.REDIS_SET_NAME || "githubusernames";

export const addUsernameToRedis = async (username: string) => {
  const redis = new IORedis(REDIS_URL);
  await redis.sadd(redisSetName, username);
};

export const isUsernameInRedis = async (username: string) => {
  const redis = new IORedis(REDIS_URL);
  const isMember: number = await redis.sismember(redisSetName, username);
  if (isMember === 1) return true;
  return false;
};
