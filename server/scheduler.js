import cron from "node-cron";
import QuizSchedule from "./models/quizSchedule.model.js";
import { createSessionFromSchedule } from "./actions/quizSession.actions.js";
import QuizSession from "./models/quizSession.model.js";

const startScheduler = () => {
  cron.schedule("* * * * *", async () => {
    console.log("Running scheduled quiz check...");
    try {
      const now = new Date();

      const dueSchedules = await QuizSchedule.find({
        scheduleTime: { $lte: now },
        status: "pending",
      });

      const twoMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
      const abandonedSessions = await QuizSession.updateMany(
        {
          status: { $in: ["lobby", "in-progress", "paused", "schedule"] },
          createdAt: { $lte: twoMinutesAgo },
        },
        { $set: { status: "ended" } }
      );

      if (abandonedSessions.modifiedCount > 0) {
        console.log(
          `Ended ${abandonedSessions.modifiedCount} abandoned scheduled sessions.`
        );
      }

      if (dueSchedules.length > 0) {
        console.log(`Found ${dueSchedules.length} due quiz schedules.`);

        const fourSecondsAgo = new Date(now.getTime() - 3000);

        for (const schedule of dueSchedules) {
          if (schedule.scheduleTime >= fourSecondsAgo) {
            await createSessionFromSchedule(schedule._id);
          } else {
            console.log(
              `Skipping schedule ${schedule._id} as it is older than 4 seconds.`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error in scheduler job:", error);
    }
  });

  console.log(
    "Quiz scheduler started. Will check for due quizzes every minute."
  );
};

export default startScheduler;
