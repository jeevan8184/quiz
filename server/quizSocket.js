import { Server } from "socket.io";
import QuizSession from "./models/quizSession.model.js";
import mongoose from "mongoose";
import async from "async";
import { Queue, Worker } from "bullmq";
import { createClient } from "redis";

// const connection = { host: "127.0.0.1", port: 6379 };
// const redisClient = createClient({
//   password: "TNfsQM1PUDO5Pf2t8slr8iZf6yL6BkKT",
//   socket: {
//     host: "redis-15660.c301.ap-south-1-1.ec2.redns.redis-cloud.com",
//     port: 15660,
//   },
// });

const redisClient = createClient({
  url: "redis://default:TNfsQM1PUDO5Pf2t8slr8iZf6yL6BkKT@redis-15660.c301.ap-south-1-1.ec2.redns.redis-cloud.com:15660",
});

redisClient.on("error", (err) => console.error("Redis connection error:", err));
redisClient.on("connect", () => console.log("Redis connected successfully"));
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis:", err);
  process.exit(1);
});

const submissionQueue = new Queue("quiz-submissions", {
  connection: {
    url: "redis://default:TNfsQM1PUDO5Pf2t8slr8iZf6yL6BkKT@redis-15660.c301.ap-south-1-1.ec2.redns.redis-cloud.com:15660",
  },
});

const checkAnswer = (question, answer) => {
  if (!question || answer === undefined || answer == null) return false;

  switch (question.type) {
    case "multiple-choice":
    case "true-false":
      return question.correctAnswer === answer;
    case "short-answer":
    case "fill-in-the-blank":
      return (
        question.correctAnswer.toLowerCase().trim() ===
        answer.toString().toLowerCase().trim()
      );
    default:
      return false;
  }
};

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    allowEIO3: true,
    connectionStateRecovery: {
      maxDisconnectionDuration: 120000,
      skipMiddlewares: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const { userId, sessionId } = socket.handshake.auth;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      if (sessionId && !mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Error("Invalid session ID");
      }

      socket.userId = userId;
      socket.sessionId = sessionId;
      next();
    } catch (error) {
      next(new Error(error.message || "Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinSession", async (sessionId) => {
      // const queue = getSessionQueue(sessionId);
      // queue.push({
      //   operation: async () => {
      try {
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
          throw new Error("Invalid session ID");
        }

        const session = await QuizSession.findById(sessionId).populate(
          "quizId",
          "questions"
        );
        if (!session) throw new Error("Session not found");

        if (session.hostId.equals(socket.userId)) {
          await QuizSession.findByIdAndUpdate(sessionId, {
            $set: { hostSocketId: socket.id },
          });
          socket.join(`host:${sessionId}`);
          console.log(`Host ${socket.userId} joined session ${sessionId}`);
        } else {
          const participant = session.participants.find((p) =>
            p.userId.equals(socket.userId)
          );
          if (participant) {
            await QuizSession.findOneAndUpdate(
              { _id: sessionId, "participants.userId": socket.userId },
              {
                $set: {
                  "participants.$.socketId": socket.id,
                  "participants.$.disconnected": false,
                },
              }
            );
            console.log(
              `Participant ${socket.userId} rejoined session ${sessionId}`
            );
          }
        }

        socket.join(`session:${sessionId}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
      // },
      // });
    });

    socket.on("removeParticipant", async ({ sessionId, userId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(userId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or user ID");
        }

        const session = await QuizSession.findById(sessionId);
        if (!session) throw new Error("Session not found");

        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can remove participants");
        }

        const participantIndex = session.participants.findIndex((p) =>
          p.userId.equals(userId)
        );
        if (participantIndex === -1) throw new Error("Participant not found");

        const removedParticipant = session.participants[participantIndex];
        session.participants.splice(participantIndex, 1);
        await session.save();

        io.to(`session:${sessionId}`).emit("participantLeft", {
          userId,
          isHost: false,
          sessionId,
        });

        if (removedParticipant.socketId && !removedParticipant.disconnected) {
          io.to(removedParticipant.socketId).emit("removed", {
            message: "You have been removed from the quiz session by the host",
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Remove participant failed:", {
          error: error.message,
        });
      }
    });

    socket.on(
      "startQuizCountdown",
      async ({ sessionId, countdown, adminId }) => {
        try {
          if (
            !mongoose.Types.ObjectId.isValid(sessionId) ||
            !mongoose.Types.ObjectId.isValid(adminId)
          ) {
            throw new Error("Invalid session or admin ID");
          }
          if (!Number.isInteger(countdown) || countdown <= 0) {
            throw new Error("Invalid countdown duration");
          }

          const session = await QuizSession.findById(sessionId);
          if (!session) throw new Error("Session not found");
          if (!session.hostId.equals(adminId)) {
            throw new Error("Only the host can start the quiz countdown");
          }

          io.to(`session:${sessionId}`).emit("countdownStarted", { countdown });
        } catch (error) {
          socket.emit("error", { message: error.message });
          console.error("Start quiz countdown failed:", {
            sessionId,
            adminId,
            countdown,
            error: error.message,
          });
        }
      }
    );

    socket.on("stopQuizCountdown", async ({ sessionId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        const session = await QuizSession.findById(sessionId);
        if (!session) throw new Error("Session not found");
        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can stop the quiz countdown");
        }

        io.to(`session:${sessionId}`).emit("countdownStopped");
      } catch (error) {
        socket.emit("error", { message: error.message });
        console.error("Stop quiz countdown failed:", {
          sessionId,
          adminId,
          error: error.message,
        });
      }
    });

    socket.on("startQuiz", async ({ sessionId, adminId }) => {
      try {
        // Validate IDs
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        // Update session status and set first question
        const session = await QuizSession.findOneAndUpdate(
          { _id: sessionId, hostId: adminId, status: "lobby" },
          {
            $set: {
              status: "in-progress",
              startTime: new Date(),
              "currentQuestion.index": 0,
              "currentQuestion.startTime": new Date(),
              "currentQuestion.locked": false,
            },
          },
          { new: true }
        )
          .populate("quizId", "questions")
          .lean();

        if (!session) {
          throw new Error("Session not found or not in lobby state");
        }

        // Get first question
        const question = session.quizId.questions[0];
        const totalQuestions = session.quizId.questions.length;

        // Build leaderboard
        const leaderboardData = session.participants.reduce(
          (acc, participant) => {
            const correctAnswers = participant.answers.filter(
              (a) => a.isCorrect
            ).length;
            const accuracy =
              participant.answers.length > 0
                ? Math.round(
                    (correctAnswers / participant.answers.length) * 100
                  )
                : 0;

            acc[participant.userId.toString()] = {
              userId: participant.userId.toString(),
              username: participant.name,
              avatar: participant.avatar,
              score: participant.score || 0,
              selectedAnswer: null,
              isCorrect: false,
              answersCount: participant.answers.length,
              correctAnswers,
              accuracy,
              lastActive: participant.lastActive || new Date(),
            };
            return acc;
          },
          {}
        );

        io.to(`session:${sessionId}`).emit("quizStarted", {
          sessionId,
          question,
          index: 0,
          countdown: session.currentQuestion.timeLimit,
        });

        // Emit leaderboard
        io.to(`host:${sessionId}`).emit("leaderboardUpdate", {
          sessionId,
          questionIndex: 0,
          totalQuestions,
          leaderboard: leaderboardData,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("nextQuestion", async ({ sessionId, adminId, questionIndex }) => {
      try {
        // Input validation
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId) ||
          typeof questionIndex !== "number" ||
          questionIndex < 0
        ) {
          throw new Error("Invalid session, admin ID, or question index");
        }

        // Get session data
        const session = await QuizSession.findById(sessionId)
          .populate("quizId", "questions")
          .lean();
        if (!session) throw new Error("Session not found");
        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can advance to the next question");
        }

        const totalQuestions = session.quizId.questions.length;

        // Check if quiz should end
        if (questionIndex >= totalQuestions) {
          await QuizSession.updateOne(
            { _id: sessionId },
            { $set: { status: "ended", endTime: new Date() } }
          );
          io.to(`session:${sessionId}`).emit("allQuestionsCompleted", {
            sessionId,
            reason: "All questions completed",
          });
          return;
        }

        // Get current question
        const question = session.quizId.questions[questionIndex];

        // Check if all active participants have answered
        const activeParticipants = session.participants.filter(
          (p) => !p.disconnected
        );

        const allAnswered = activeParticipants.every((p) =>
          p.answers.some(
            (a) => a.questionId && a.questionId.equals(question._id)
          )
        );

        const updateData = {
          "currentQuestion.index": questionIndex,
          "currentQuestion.startTime": new Date(),
          "currentQuestion.locked": false,
        };
        await QuizSession.updateOne({ _id: sessionId }, { $set: updateData });

        const leaderboardData = session.participants.reduce(
          (acc, participant) => {
            const currentAnswer = participant.answers.find(
              (a) => a.questionId && a.questionId.equals(question._id)
            );

            const correctAnswers = participant.answers.filter(
              (a) => a.isCorrect
            ).length;
            const accuracy =
              participant.answers.length > 0
                ? Math.round(
                    (correctAnswers / participant.answers.length) * 100
                  )
                : 0;

            acc[participant.userId.toString()] = {
              userId: participant.userId.toString(),
              username: participant.name,
              avatar: participant.avatar || "default-avatar.png",
              score: participant.score || 0,
              selectedAnswer: currentAnswer?.selectedAnswer ?? null,
              isCorrect: currentAnswer?.isCorrect ?? false,
              answersCount: participant.answers.length,
              correctAnswers,
              accuracy,
              lastActive: participant.lastActive || new Date(),
            };
            return acc;
          },
          {}
        );

        io.to(`host:${sessionId}`).emit("leaderboardUpdate", {
          sessionId,
          questionIndex,
          totalQuestions,
          leaderboard: leaderboardData,
          timestamp: new Date().toISOString(),
        });

        if (allAnswered) {
          io.to(`session:${sessionId}`).emit("allAnswersSubmitted", {
            sessionId,
            answers: activeParticipants.map((p) => ({
              userId: p.userId.toString(),
              isCorrect:
                p.answers.find(
                  (a) => a.questionId && a.questionId.equals(question._id)
                )?.isCorrect || false,
              timeTaken:
                p.answers.find(
                  (a) => a.questionId && a.questionId.equals(question._id)
                )?.timeTaken || 0,
            })),
          });
        }

        io.to(`session:${sessionId}`).emit("nextQuestion", {
          sessionId,
          question,
          index: questionIndex,
          countdown: session.currentQuestion.timeLimit || 10,
        });
      } catch (error) {
        console.error("Next question error:", error);
        socket.emit("error", {
          message: error.message,
          action: "advancing-to-next-question",
        });
      }
    });

    new Worker(
      "quiz-submissions",
      async (job) => {
        const { sessionId, userId, questionId, selectedOption, socketId } =
          job.data;
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
          const dbSession = await mongoose.startSession();
          dbSession.startTransaction();
          try {
            const session = await QuizSession.findById(sessionId)
              .populate("quizId")
              .session(dbSession);
            if (!session) throw new Error("Quiz session not found");
            if (session.currentQuestion.locked)
              throw new Error("Question locked");

            const participant = session.participants.find(
              (p) => p.userId && p.userId.equals(userId)
            );
            if (!participant) throw new Error("Participant not found");

            const question =
              session.quizId.questions[session.currentQuestion.index];
            if (!question || !question._id.equals(questionId))
              throw new Error("Question not found");

            const hasAnswered = participant.answers.some(
              (a) =>
                a.questionId &&
                a.questionId.toString() === questionId.toString()
            );
            if (hasAnswered) {
              // io.to(socketId).emit("error", {
              //   message: "You already answered this question",
              // });
              return;
            }

            const isCorrect =
              selectedOption !== null
                ? checkAnswer(question, selectedOption)
                : false;
            const points = isCorrect ? 10 : 0;
            const timeTaken = Math.floor(
              (Date.now() - session.currentQuestion.startTime.getTime()) / 1000
            );

            const updateOperation = {
              $push: {
                "participants.$[participant].answers": {
                  questionId,
                  selectedAnswer: selectedOption,
                  isCorrect,
                  points,
                  answeredAt: new Date(),
                  timeTaken,
                },
              },
              $inc: {
                "participants.$[participant].score": points,
                __v: 1,
              },
              $set: { "participants.$[participant].lastActive": new Date() },
            };

            const result = await QuizSession.updateOne(
              {
                _id: sessionId,
                "participants.userId": userId,
                __v: session.__v,
              },
              updateOperation,
              {
                session: dbSession,
                arrayFilters: [{ "participant.userId": userId }],
              }
            );

            if (result.modifiedCount === 0) throw new Error("Update failed");

            await dbSession.commitTransaction();

            const updatedSession = await QuizSession.findById(sessionId)
              .populate("quizId")
              .lean();

            const leaderboardData = updatedSession.participants.reduce(
              (acc, p) => {
                const currentAnswer = p.answers.find(
                  (a) =>
                    a.questionId &&
                    a.questionId.toString() === question._id.toString()
                );
                const correctAnswers = p.answers.filter(
                  (a) => a.isCorrect
                ).length;
                const accuracy =
                  p.answers.length > 0
                    ? Math.round((correctAnswers / p.answers.length) * 100)
                    : 0;

                acc[p.userId.toString()] = {
                  userId: p.userId.toString(),
                  username: p.name,
                  avatar: p.avatar || "default-avatar.png",
                  score: p.score || 0,
                  selectedAnswer: currentAnswer?.selectedAnswer ?? null,
                  isCorrect: currentAnswer?.isCorrect ?? false,
                  answersCount: p.answers.length,
                  correctAnswers,
                  accuracy,
                  lastActive: p.lastActive || new Date(),
                  timeTaken: currentAnswer?.timeTaken || 0,
                };
                return acc;
              },
              {}
            );

            if (participant.socketId) {
              io.to(participant.socketId).emit("answerFeedback", {
                isCorrect,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || "",
                points,
                timeTaken,
                selectedOption,
              });
            }

            io.to(`host:${sessionId}`).emit("leaderboardUpdate", {
              sessionId,
              questionIndex: updatedSession.currentQuestion.index,
              totalQuestions: updatedSession.quizId.questions.length,
              leaderboard: leaderboardData,
              timestamp: new Date().toISOString(),
            });

            const activeParticipants = updatedSession.participants.filter(
              (p) => !p.disconnected
            );
            const allAnswered = activeParticipants.every((p) =>
              p.answers.some(
                (a) =>
                  a.questionId &&
                  a.questionId.toString() === question._id.toString()
              )
            );

            if (allAnswered) {
              io.to(`session:${sessionId}`).emit("allAnswersSubmitted", {
                sessionId,
                answers: activeParticipants.map((p) => ({
                  userId: p.userId.toString(),
                  isCorrect:
                    p.answers.find(
                      (a) =>
                        a.questionId &&
                        a.questionId.toString() === question._id.toString()
                    )?.isCorrect || false,
                  timeTaken:
                    p.answers.find(
                      (a) =>
                        a.questionId &&
                        a.questionId.toString() === question._id.toString()
                    )?.timeTaken || 0,
                })),
              });
            }
            return;
          } catch (error) {
            await dbSession.abortTransaction();
            if (
              error.message.includes("Write conflict") &&
              retryCount < maxRetries - 1
            ) {
              retryCount++;
              console.warn(
                `Retrying submitAnswer (${retryCount}/${maxRetries}) for session ${sessionId}`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 100 * 2 ** retryCount)
              );
              continue;
            }
            console.error("Submission error:", error.message);
            io.to(socketId).emit("error", {
              message: error.message.includes("Duplicate")
                ? "You already answered this question"
                : "Error processing answer",
            });
            return;
          } finally {
            dbSession.endSession();
          }
        }
        console.error("Max retries reached for session:", sessionId);
        io.to(socketId).emit("error", {
          message: "Max retries reached, please try again",
        });
      },
      {
        connection: {
          url: "redis://default:TNfsQM1PUDO5Pf2t8slr8iZf6yL6BkKT@redis-15660.c301.ap-south-1-1.ec2.redns.redis-cloud.com:15660",
        },
      }
    );

    socket.on(
      "submitAnswer",
      async ({ sessionId, userId, questionId, selectedOption }) => {
        await submissionQueue.add(
          `submit-${sessionId}-${userId}-${questionId}`,
          {
            sessionId,
            userId,
            questionId,
            selectedOption,
            socketId: socket.id,
          }
        );
      }
    );

    socket.on("restartQuestion", async ({ sessionId, adminId, questionId }) => {
      const dbSession = await mongoose.startSession();
      dbSession.startTransaction();

      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId) ||
          !mongoose.Types.ObjectId.isValid(questionId)
        ) {
          throw new Error("Invalid session, admin, or question ID");
        }

        // 2. Find and validate session
        const session = await QuizSession.findById(sessionId)
          .populate("quizId", "questions")
          .session(dbSession);

        if (!session) throw new Error("Session not found");
        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can restart the question");
        }

        // 3. Remove all answers for this question
        const updateResult = await QuizSession.updateOne(
          { _id: sessionId },
          {
            $pull: {
              "participants.$[].answers": { questionId: questionId },
            },
            $inc: { __v: 1 }, // Handle optimistic concurrency
            $set: {
              "currentQuestion.startTime": new Date(),
              "currentQuestion.locked": false,
            },
          },
          { session: dbSession }
        );

        if (updateResult.modifiedCount === 0) {
          throw new Error("Failed to restart question");
        }

        await dbSession.commitTransaction();

        // 4. Get updated session data
        const updatedSession = await QuizSession.findById(sessionId)
          .populate("quizId", "questions")
          .lean();

        // 5. Reset leaderboard by removing answers for this question
        const leaderboardData = updatedSession.participants.reduce((acc, p) => {
          const correctAnswers = p.answers.filter((a) => a.isCorrect).length;
          const accuracy =
            p.answers.length > 0
              ? Math.round((correctAnswers / p.answers.length) * 100)
              : 0;

          acc[p.userId.toString()] = {
            userId: p.userId.toString(),
            username: p.name,
            avatar: p.avatar || "default-avatar.png",
            score: p.score || 0,
            selectedAnswer: null, // Reset answer for this question
            isCorrect: false, // Reset correctness
            answersCount: p.answers.length,
            correctAnswers,
            accuracy,
            lastActive: p.lastActive || new Date(),
          };
          return acc;
        }, {});

        // 6. Emit updates
        io.to(`session:${sessionId}`).emit("nextQuestion", {
          question:
            updatedSession.quizId.questions[
              updatedSession.currentQuestion.index
            ],
          index: updatedSession.currentQuestion.index,
          countdown: updatedSession.currentQuestion.timeLimit,
          reset: true,
        });

        io.to(`host:${sessionId}`).emit("leaderboardUpdate", {
          sessionId,
          questionIndex: updatedSession.currentQuestion.index,
          totalQuestions: updatedSession.quizId.questions.length,
          leaderboard: leaderboardData,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        await dbSession.abortTransaction();
        console.error("Restart question error:", error.message);
        socket.emit("error", {
          message: error.message || "Failed to restart question",
        });
      } finally {
        dbSession.endSession();
      }
    });

    socket.on("skipQuestion", async ({ sessionId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        const session = await QuizSession.findById(sessionId).populate(
          "quizId",
          "questions"
        );
        if (!session) throw new Error("Session not found");
        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can skip the question");
        }

        const nextIndex = (session.currentQuestion.index || 0) + 1;
        const updatedSession = await QuizSession.findOneAndUpdate(
          { _id: sessionId, hostId: adminId },
          nextIndex >= session.quizId.questions.length
            ? {
                $set: {
                  status: "ended",
                  endTime: new Date(),
                },
              }
            : {
                $set: {
                  "currentQuestion.index": nextIndex,
                  "currentQuestion.startTime": new Date(),
                  "currentQuestion.timeLimit":
                    session.currentQuestion.timeLimit,
                  "currentQuestion.locked": false,
                },
              },
          { new: true }
        ).populate("quizId", "questions");

        if (updatedSession.status === "ended") {
          io.to(`session:${sessionId}`).emit("sessionEnded", {
            reason: "All questions completed",
            endedAt: new Date(),
          });
        } else {
          io.to(`session:${sessionId}`).emit("nextQuestion", {
            question: updatedSession.quizId.questions[nextIndex],
            index: nextIndex,
            countdown: updatedSession.currentQuestion.timeLimit,
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("pauseQuiz", async ({ sessionId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        await QuizSession.findOneAndUpdate(
          { _id: sessionId, hostId: adminId },
          {
            $set: {
              status: "paused",
              "currentQuestion.locked": true,
            },
          }
        );

        io.to(`session:${sessionId}`).emit("quizPaused", { sessionId });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("resumeQuiz", async ({ sessionId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        const session = await QuizSession.findOneAndUpdate(
          { _id: sessionId, hostId: adminId },
          {
            $set: {
              status: "in-progress",
              "currentQuestion.locked": false,
            },
          },
          { new: true }
        ).populate("quizId", "questions");

        if (!session) throw new Error("Session not found");

        io.to(`session:${sessionId}`).emit("quizResumed", { sessionId });
        io.to(`session:${sessionId}`).emit("nextQuestion", {
          question:
            session.quizId.questions[session.currentQuestion.index || 0],
          index: session.currentQuestion.index || 0,
          countdown: session.currentQuestion.timeLimit || 10,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("endQuiz", async ({ sessionId, adminId }) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        await QuizSession.findOneAndUpdate(
          { _id: sessionId, hostId: adminId },
          {
            $set: {
              status: "ended",
              endTime: new Date(),
            },
          }
        );

        io.to(`session:${sessionId}`).emit("sessionEnded", {
          sessionId,
          reason: "Host ended the quiz",
        });

        io.socketsLeave(`host:${sessionId}`);
        io.socketsLeave(`session:${sessionId}`);

        // if (sessionQueues.has(sessionId)) {
        //   const queue = sessionQueues.get(socket.sessionId);
        //   queue.drain();
        //   sessionQueues.delete(socket.sessionId);
        // }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("collectAnswers", async ({ sessionId, adminId }) => {
      // const queue = getSessionQueue(sessionId);
      // queue.push({
      //   operation: async () => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(adminId)
        ) {
          throw new Error("Invalid session or admin ID");
        }

        const session = await QuizSession.findById(sessionId).populate(
          "quizId",
          "questions"
        );
        if (!session) throw new Error("Session not found");
        if (!session.hostId.equals(adminId)) {
          throw new Error("Only the host can collect answers");
        }

        const answers = session.participants.map((p) => ({
          userId: p.userId,
          isCorrect:
            p.answers.find((a) =>
              a.questionId.equals(
                session.quizId.questions[session.currentQuestion.index]?._id
              )
            )?.isCorrect || false,
          points:
            p.answers.find((a) =>
              a.questionId.equals(
                session.quizId.questions[session.currentQuestion.index]?._id
              )
            )?.points || 0,
        }));

        io.to(`session:${sessionId}`).emit("answerFeedback", {
          sessionId,
          answers,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
      // },
      // });
    });

    socket.on("leave-quiz", async () => {
      try {
        const session = await QuizSession.findById(socket.sessionId);
        if (!session) throw new Error("Session not found");

        const participant = session.participants.find((p) =>
          p.userId.equals(socket.userId)
        );
        if (participant) {
          await QuizSession.findOneAndUpdate(
            { _id: socket.sessionId, "participants.userId": socket.userId },
            {
              $set: {
                "participants.$.disconnected": true,
                "participants.$.socketId": null,
              },
            }
          );

          io.to(`session:${session._id}`).emit("participantLeft", {
            userId: socket.userId,
            isHost: false,
            sessionId: session._id,
          });
          socket.leave(`session:${session._id}`);
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", async () => {
      if (!socket.sessionId) return;

      // const queue = getSessionQueue(socket.sessionId);
      // queue.push({
      //   operation: async () => {
      try {
        const session = await QuizSession.findById(socket.sessionId);
        if (!session) return;

        socket.leave(`session:${socket.sessionId}`);
        socket.leave(`host:${socket.sessionId}`);

        if (session.hostId.equals(socket.userId)) {
          await QuizSession.findByIdAndUpdate(socket.sessionId, {
            $set: {
              hostSocketId: null,
              status: "ended",
              endTime: new Date(),
            },
          });

          io.to(`session:${socket.sessionId}`).emit("sessionEnded", {
            reason: "Host disconnected",
            endedAt: new Date(),
          });
          console.log(`Host ${socket.userId} disconnected - session ended`);

          // if (sessionQueues.has(socket.sessionId)) {
          //   const queue = sessionQueues.get(socket.sessionId);
          //   queue.drain();
          //   sessionQueues.delete(socket.sessionId);
          // }
        } else {
          await QuizSession.findOneAndUpdate(
            {
              _id: socket.sessionId,
              "participants.userId": socket.userId,
            },
            {
              $set: {
                "participants.$.disconnected": true,
                "participants.$.socketId": null,
              },
            }
          );

          io.to(`session:${socket.sessionId}`).emit("participantLeft", {
            userId: socket.userId,
            sessionId: socket.sessionId,
          });
          console.log(`Participant ${socket.userId} disconnected`);
        }
      } catch (error) {
        console.error("Disconnection error:", error);
      }
      // },
      // });
    });
  });

  return io;
};
