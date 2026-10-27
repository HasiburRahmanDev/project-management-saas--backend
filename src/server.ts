import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { redisClient } from "./app/lib/redis";
import { seedOwner, seedTesterAdmin } from "./app/utils/seeds";

const PORT = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    try {
      await redisClient.connect();
      console.log("redis connected successfully");
    } catch (error) {
      // redis is only needed for bkash tokens and password-reset OTPs
      console.log(
        "Redis connection failed, continuing without it:",
        (error as Error).message,
      );
    }

    await seedOwner();
    await seedTesterAdmin();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
