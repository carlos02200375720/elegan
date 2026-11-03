import mongoose from "mongoose";

/**
 * Wait briefly for an in-progress initial MongoDB connection.
 * A disconnected database is reported immediately; callers can return a
 * controlled 503 instead of racing the server's asynchronous startup.
 */
export async function waitForMongoConnection(timeoutMs = 10000): Promise<boolean> {
  if (mongoose.connection.readyState === 1) return true;
  if (mongoose.connection.readyState !== 2) return false;

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const finish = (connected: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      mongoose.connection.removeListener("connected", onConnected);
      resolve(connected || mongoose.connection.readyState === 1);
    };

    const onConnected = () => finish(true);
    mongoose.connection.once("connected", onConnected);
    timer = setTimeout(() => finish(false), timeoutMs);

    if (mongoose.connection.readyState === 1) finish(true);
  });
}
