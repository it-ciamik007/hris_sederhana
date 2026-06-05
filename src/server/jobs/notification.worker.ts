import { db } from "@/lib/db";
import { processQueuedNotification } from "@/server/services/notification.service";

async function processBatch() {
  const jobs = await db.notificationQueue.findMany({
    where: { status: "QUEUED", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 25
  });

  for (const job of jobs) {
    await processQueuedNotification(job.id);
  }

  console.log(`Processed ${jobs.length} notification job(s).`);
}

async function main() {
  console.log("Notification worker started.");
  await processBatch();
  setInterval(() => {
    processBatch().catch((error) => console.error(error));
  }, 5000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
