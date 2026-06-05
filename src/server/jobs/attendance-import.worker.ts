import { db } from "@/lib/db";

async function main() {
  const rawCount = await db.attendanceRawLog.count();
  console.log(`Attendance normalization skeleton. Raw logs available: ${rawCount}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => db.$disconnect());
