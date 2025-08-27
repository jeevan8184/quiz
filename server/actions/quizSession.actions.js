import QuizSession from "../models/quizSession.model.js";
import Quiz from "../models/quiz.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Feedback from "../models/feedback.model.js";
import QuizSchedule from "../models/quizSchedule.model.js";
import Notification from "../models/notification.model.js";
import admin from "firebase-admin";

export const createQuizSession = async (req, res) => {
  try {
    const { quizId } = req.params;
    const {
      userId,
      isPublic = true,
      maxParticipants = 100,
      code = nanoid(6).toUpperCase(),
      socketId,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      throw new Error("Invalid quiz ID");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (!quiz.userId.equals(userId)) {
      throw new Error("Only the quiz creator can start a session");
    }

    const existingSession = await QuizSession.findOne({
      quizId,
      status: { $in: ["lobby", "in-progress", "paused"] },
    });
    if (existingSession) {
      throw new Error("An active session already exists for this quiz");
    }

    const quizSession = new QuizSession({
      quizId,
      hostId: userId,
      hostSocketId: null,
      code: code,
      participants: [],
      maxParticipants,
      isPublic,
      status: "lobby",
      startTime: null,
      endTime: null,
      currentQuestion: {
        index: 0,
        startTime: null,
        locked: false,
        timeLimit: quiz.timeLimit,
      },
      leaderboard: [],
      auditLog: [
        { action: "create", performedBy: userId, details: "Session created" },
      ],
    });

    // await User.updateOne({ _id: userId }, { activeSession: quizSession._id });

    // req.io.to(`quiz:${quizId}`).emit("sessionCreated", {
    //   sessionId: quizSession._id,
    //   code: quizSession.code,
    //   status: quizSession.status,
    // });

    const hostSocket = req.io.sockets.sockets.get(socketId);

    if (hostSocket) {
      quizSession.hostSocketId = socketId;
    }

    await quizSession.save();

    return res
      .status(201)
      .json({ message: "Quiz session created successfully", quizSession });
  } catch (error) {
    console.error("Error verifying quiz code:", error);
    res.status(500).json({
      error: error.message || "Failed to verify quiz code",
    });
  }
};

export const createSessionFromSchedule = async (scheduleId) => {
  try {
    const schedule = await QuizSchedule.findById(scheduleId).populate("quizId");
    if (!schedule || schedule.status !== "pending") {
      console.log(`Schedule ${scheduleId} not found or not pending.`);
      return;
    }

    const quiz = schedule.quizId;
    const host = await User.findById(schedule.userId);

    const newQuizSession = new QuizSession({
      quizId: quiz._id,
      hostId: host._id,
      code: schedule.code,
      status: "schedule",
      participants: [],
      maxParticipants: 100,
      isPublic: true,
      startTime: new Date(),
      endTime: null,
      currentQuestion: {
        index: 0,
        startTime: null,
        locked: false,
        timeLimit: quiz.timeLimit,
      },
      leaderboard: [],
      auditLog: [
        {
          action: "create",
          performedBy: host._id,
          details: "Session created from schedule",
        },
      ],
    });
    await newQuizSession.save();

    schedule.status = "active";
    await schedule.save();

    const hostLink = `${process.env.CLIENT_URL}/activity/start-quiz/${newQuizSession._id}`;
    const participantLink = `${process.env.CLIENT_URL}/activity/start-join?code=${schedule.code}`;

    const initialInvites = await Notification.find({
      sessionId: schedule._id,
    }).populate("userId");
    const participants = initialInvites
      .map((invite) => invite.userId)
      .filter((user) => user && !user._id.equals(host._id));

    const hostNotification = {
      userId: host._id,
      sessionId: schedule._id,
      title: `Your Quiz is Starting: ${quiz.title}`,
      message: `Your scheduled quiz is now live. Click here to start hosting.`,
      inviteLink: hostLink,
      coverImage: quiz.coverImage,
      isRead: false,
      priority: "high",
    };
    await new Notification(hostNotification).save();

    if (host && host.fcmToken) {
      const hostMessage = {
        notification: {
          title: `Your Quiz is Starting!`,
          body: `Click here to start hosting "${quiz.title}".`,
        },
        data: {
          inviteLink: hostLink,
          coverImage: quiz.coverImage,
        },
        token: host.fcmToken,
      };
      try {
        await admin.messaging().send(hostMessage);
      } catch (error) {
        console.error(
          `Failed to send start notification to host ${host.email}:`,
          error
        );
      }
    }

    const participantNotifications = participants.map((participant) => ({
      userId: participant._id,
      sessionId: schedule._id,
      title: `Quiz Starting: ${quiz.title}`,
      message: "The scheduled quiz is now live! Click to join the lobby.",
      inviteLink: participantLink,
      coverImage: quiz.coverImage,
      isRead: false,
      priority: "high",
    }));

    if (participantNotifications.length > 0) {
      await Notification.insertMany(participantNotifications);
    }

    for (const participant of participants) {
      if (participant && participant.fcmToken) {
        const participantMessage = {
          notification: {
            title: `Quiz Starting: ${quiz.title}`,
            body: "The quiz is now live! Click to join.",
          },
          data: {
            inviteLink: participantLink,
            coverImage: quiz.coverImage,
          },
          token: participant.fcmToken,
        };
        try {
          await admin.messaging().send(participantMessage);
        } catch (error) {
          console.error(
            `Failed to send start notification to ${participant.email}:`,
            error
          );
        }
      }
    }

    await QuizSchedule.findByIdAndUpdate(scheduleId, { status: "active" });
    console.log(
      `Successfully created QuizSession ${newQuizSession.code} from schedule ${scheduleId}`
    );
  } catch (error) {
    console.error(`Error creating session from schedule ${scheduleId}:`, error);
  }
};

export const getQuizSessionById = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    const quizSession = await QuizSession.findById(id)
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      });

    if (quizSession.status === "ended") {
      return res.status(200).json({ quizSession, ended: true });
    }

    if (!quizSession) {
      return res.status(404).json({ error: "Quiz session not found" });
    }

    if (quizSession.status === "schedule") {
      quizSession.status = "lobby";
      await quizSession.save();
    }

    const users = await User.find(
      userId ? { _id: { $ne: userId } } : {},
      "name email picture"
    ).exec();

    return res.status(200).json({ quizSession, users });
  } catch (error) {
    console.error("Error fetching quiz session:", error);
    return res.status(500).json({ error: "Failed to fetch quiz session" });
  }
};

export const verifyQuizSession = async (req, res) => {
  try {
    const { code, userId, socketId, name } = req.body;

    if (!code || !userId || !socketId || !name) {
      return res
        .status(400)
        .json({ success: false, error: "There are some missing fields" });
    }

    const quizSession = await QuizSession.findOne({ code })
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      });

    if (!quizSession) {
      return res
        .status(404)
        .json({ success: false, error: "Quiz session not found" });
    }
    if (quizSession.status === "ended") {
      return res
        .status(403)
        .json({ success: false, error: "Quiz session has ended" });
    }
    if (quizSession.participants.length >= quizSession.maxParticipants) {
      return res.status(403).json({
        success: false,
        error: "Session has reached maximum participants",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const participantIndex = quizSession.participants.findIndex((p) =>
      p.userId.equals(userId)
    );

    if (participantIndex !== -1) {
      const participant = quizSession.participants[participantIndex];
      participant.socketId = socketId;
      participant.name = name.trim();
      participant.disconnected = false;

      quizSession.markModified("participants");

      await quizSession.save();

      req.io.to(`session:${quizSession._id}`).emit("participantJoined", {
        sessionId: quizSession._id,
        participant: participant,
      });

      return res
        .status(200)
        .json({ success: true, quizSession, alreadyJoined: true });
    }

    return res.status(200).json({ success: true, quizSession });
  } catch (error) {
    console.error("Error verifying quiz session:", error);

    if (req.io && socketId) {
      req.io.to(socketId).emit("error", {
        message: error.message || "Failed to verify quiz session",
      });
    }

    return res
      .status(500)
      .json({ success: false, error: "Failed to verify quiz session" });
  }
};

export const joinQuizSession = async (req, res) => {
  try {
    const { sessionId, userId, socketId, name } = req.body;

    if (!sessionId || !userId || !socketId || !name) {
      return res
        .status(400)
        .json({ success: false, error: "There are some missing fields" });
    }

    const quizSession = await QuizSession.findById(sessionId)
      .populate("quizId", "title questions")
      .populate("hostId", "name");

    if (!quizSession) {
      return res
        .status(404)
        .json({ success: false, error: "Quiz session not found" });
    }
    // if (quizSession.status !== "lobby") {
    //   return res
    //     .status(403)
    //     .json({ success: false, error: "Quiz session is not in lobby state" });
    // }
    if (quizSession.participants.length >= quizSession.maxParticipants) {
      return res.status(403).json({
        success: false,
        error: "Session has reached maximum participants",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    if (quizSession.participants.some((p) => p.userId.equals(userId))) {
      return res
        .status(409)
        .json({ success: false, error: "User is already a participant" });
    }
    // if (!quizSession.isPublic) {
    //   const invitation = await SessionInvitation.findOne({
    //     sessionId: quizSession._id,
    //     userId,
    //     status: "accepted",
    //   });
    //   if (!invitation) {
    //     return res.status(403).json({ success: false, error: "No valid invitation found for private session" });
    //   }
    // }

    const participant = {
      userId,
      socketId,
      name: name.trim(),
      score: 0,
      answers: [],
      disconnected: false,
      joinedAt: new Date(),
      avatar: `https://randomuser.me/api/portraits/${
        Math.random() > 0.5 ? "men" : "women"
      }/${Math.floor(Math.random() * 100)}.jpg`,
    };

    quizSession.participants.push(participant);
    quizSession.auditLog.push({
      action: "join",
      performedBy: userId,
      details: `${name} joined the session`,
      timestamp: new Date(),
    });

    await quizSession.save();
    // await User.updateOne({ _id: userId }, { activeSession: quizSession._id });

    req.io.to(`session:${sessionId}`).emit("participantJoined", {
      sessionId,
      participant,
    });

    return res.status(200).json({ success: true, quizSession });
  } catch (error) {
    console.error("Error joining quiz session:", error);
    req.io.to(socketId).emit("error", {
      message: error.message || "Failed to join quiz session",
    });
    return res
      .status(500)
      .json({ success: false, error: "Failed to join quiz session" });
  }
};

// Host Results Endpoint
export const getHostResults = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid quiz session ID" });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(401)
      .json({ error: "User ID is required and must be valid" });
  }

  try {
    const session = await QuizSession.findById(id)
      .populate({
        path: "quizId",
        select: "title subject duration questions coverImage",
        populate: {
          path: "questions",
          select: "question type options correctAnswer explanation",
        },
      })
      .populate({
        path: "hostId",
        select: "username avatar",
      })
      .lean();

    if (!session) {
      return res.status(404).json({ error: "Quiz session not found" });
    }

    if (session.hostId._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Only the host can access this data" });
    }

    const leaderboard = session.participants
      .map((p, index) => {
        const correctAnswers = p.answers.filter((a) => a.isCorrect).length;
        const answersCount = p.answers.length;
        const averageTime =
          answersCount > 0
            ? p.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0) /
              answersCount
            : 0;
        return {
          userId: p.userId.toString(),
          name: p.name,
          score: p.score || 0,
          correctAnswers,
          answersCount,
          accuracy:
            answersCount > 0
              ? Math.round((correctAnswers / answersCount) * 100)
              : 0,
          avatar: p.avatar || "default-avatar.png",
          averageTime: Number(averageTime.toFixed(1)),
          lastAnsweredAt:
            p.answers.length > 0
              ? p.answers[p.answers.length - 1].answeredAt
              : p.joinedAt,
          badges: calculateBadges(p, session),
          questionStats: p.answers.map((answer) => ({
            questionId: answer.questionId.toString(),
            question:
              session.quizId.questions.find(
                (q) => q._id.toString() === answer.questionId.toString()
              )?.question || "N/A",
            userAnswer: answer.selectedAnswer ?? "Not answered",
            correctAnswer: getCorrectAnswer(
              session.quizId.questions.find(
                (q) => q._id.toString() === answer.questionId.toString()
              )
            ),
            isCorrect: answer.isCorrect,
            timeTaken: answer.timeTaken || 0,
            points: answer.points || 0,
            explanation:
              session.quizId.questions.find(
                (q) => q._id.toString() === answer.questionId.toString()
              )?.explanation || "",
          })),
        };
      })
      .sort((a, b) => b.score - a.score || a.averageTime - b.averageTime)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    const feedbacks = await Feedback.find({ quizSessionId: id });

    return res.status(200).json({
      quizSession: session,
      leaderboard,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching host quiz results:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserResults = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid quiz session ID" });
  }

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(401)
      .json({ error: "User ID is required and must be valid" });
  }

  try {
    const session = await QuizSession.findById(id)
      .populate({
        path: "quizId",
        select: "title subject duration questions coverImage",
        populate: {
          path: "questions",
          select: "question type options correctAnswer explanation",
        },
      })
      .populate({
        path: "hostId",
        select: "username avatar",
      })
      .lean();

    if (!session) {
      return res.status(404).json({ error: "Quiz session not found" });
    }

    const isParticipant = session.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Unauthorized: User is not a participant" });
    }

    const userParticipant = session.participants.find(
      (p) => p.userId.toString() === userId.toString()
    );
    let userStats = null;
    if (userParticipant) {
      const correctAnswers = userParticipant.answers.filter(
        (a) => a.isCorrect
      ).length;
      const answersCount = userParticipant.answers.length;
      const averageTime =
        answersCount > 0
          ? userParticipant.answers.reduce(
              (sum, a) => sum + (a.timeTaken || 0),
              0
            ) / answersCount
          : 0;
      userStats = {
        userId: userParticipant.userId.toString(),
        name: userParticipant.name,
        score: userParticipant.score || 0,
        correctAnswers,
        answersCount,
        accuracy:
          answersCount > 0
            ? Math.round((correctAnswers / answersCount) * 100)
            : 0,
        averageTime: Number(averageTime.toFixed(1)),
        avatar: userParticipant.avatar || "default-avatar.png",
        badges: calculateBadges(userParticipant, session),
        questionStats: userParticipant.answers.map((answer) => ({
          questionId: answer.questionId.toString(),
          question:
            session.quizId.questions.find(
              (q) => q._id.toString() === answer.questionId.toString()
            )?.question || "N/A",
          userAnswer: answer.selectedAnswer ?? "Not answered",
          correctAnswer: getCorrectAnswer(
            session.quizId.questions.find(
              (q) => q._id.toString() === answer.questionId.toString()
            )
          ),
          isCorrect: answer.isCorrect,
          timeTaken: answer.timeTaken || 0,
          points: answer.points || 0,
          explanation:
            session.quizId.questions.find(
              (q) => q._id.toString() === answer.questionId.toString()
            )?.explanation || "",
        })),
      };

      const sortedParticipants = session.participants
        .map((p) => ({
          userId: p.userId.toString(),
          score: p.score || 0,
          averageTime:
            p.answers.length > 0
              ? p.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0) /
                p.answers.length
              : 0,
        }))
        .sort((a, b) => b.score - a.score || a.averageTime - b.averageTime);
      userStats.rank =
        sortedParticipants.findIndex((p) => p.userId === userId.toString()) + 1;
    }

    return res.status(200).json({
      quizSession: session,
      userStats,
    });
  } catch (error) {
    console.error("Error fetching user quiz results:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

function getCorrectAnswer(question) {
  if (!question) return "N/A";
  switch (question.type) {
    case "multiple-choice":
      return question.options && question.options[question.correctAnswer]
        ? `${String.fromCharCode(65 + question.correctAnswer)}. ${
            question.options[question.correctAnswer]
          }`
        : "N/A";
    case "true-false":
      return question.correctAnswer ? "True" : "False";
    case "short-answer":
    case "fill-in-the-blank":
      return question.correctAnswer || "N/A";
    default:
      return "N/A";
  }
}

function calculateBadges(participant, session) {
  const badges = [];
  const totalQuestions = session.quizId.questions.length;
  const correctAnswers = participant.answers.filter((a) => a.isCorrect).length;
  const answersCount = participant.answers.length;
  const averageTime =
    answersCount > 0
      ? participant.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0) /
        answersCount
      : 0;

  if (correctAnswers === totalQuestions && totalQuestions > 0) {
    badges.push("Perfect Score");
  }
  if (averageTime > 0 && averageTime <= 5) {
    badges.push("Fastest Responder");
  }
  if (correctAnswers >= Math.ceil(totalQuestions * 0.8)) {
    badges.push("High Achiever");
  }
  if (participant.score >= 1000) {
    badges.push("Score Master");
  }
  if (answersCount === totalQuestions && answersCount > 0) {
    badges.push("Completionist");
  }

  return badges;
}

export const getUserHostedQuizSessions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ error: "User ID is required and must be valid" });
    }

    const quizSessions = await QuizSession.find({ hostId: userId })
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      })
      .lean();

    if (!quizSessions.length) {
      return res.status(404).json({ error: "No hosted quiz sessions found" });
    }

    return res.status(200).json({ quizSessions });
  } catch (error) {
    console.error("Error fetching hosted quiz sessions:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch hosted quiz sessions" });
  }
};

export const getUserParticipatedQuizSessions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ error: "User ID is required and must be valid" });
    }

    const quizSessions = await QuizSession.find({
      "participants.userId": userId,
    })
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      })
      .lean();

    if (!quizSessions.length) {
      return res
        .status(404)
        .json({ error: "No participated quiz sessions found" });
    }

    return res.status(200).json({ quizSessions });
  } catch (error) {
    console.error("Error fetching participated quiz sessions:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch participated quiz sessions" });
  }
};

export const getUserAllQuizSessions = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ error: "User ID is required and must be valid" });
    }

    // Fetch hosted quiz sessions
    const hostedSessions = await QuizSession.find({ hostId: userId })
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      })
      .lean();

    // Fetch participated quiz sessions
    const participatedSessions = await QuizSession.find({
      "participants.userId": userId,
    })
      .populate({
        path: "quizId",
        model: Quiz,
        select: "title description subject difficulty coverImage questions",
      })
      .populate({
        path: "hostId",
        model: User,
        select: "name email picture",
      })
      .lean();

    // Fetch feedback for all sessions
    const feedback = await Feedback.find({
      quizSessionId: {
        $in: [...hostedSessions, ...participatedSessions].map(
          (session) => session._id
        ),
      },
    })
      .populate({
        path: "quizSessionId",
        model: QuizSession,
        select: "quizId",
        populate: {
          path: "quizId",
          model: Quiz,
          select: "title",
        },
      })
      .populate({
        path: "userId",
        model: User,
        select: "name email picture",
      })
      .lean();

    if (!hostedSessions.length && !participatedSessions.length) {
      return res.status(404).json({ error: "No quiz sessions found" });
    }

    return res
      .status(200)
      .json({ hostedSessions, participatedSessions, feedback });
  } catch (error) {
    console.error("Error fetching user quiz sessions:", error);
    return res.status(500).json({ error: "Failed to fetch quiz sessions" });
  }
};
