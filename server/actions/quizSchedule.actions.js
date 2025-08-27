import QuizSchedule from "../models/quizSchedule.model.js";
import Quiz from "../models/quiz.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import admin from "firebase-admin";
import QuizSession from "../models/quizSession.model.js";

export const scheduleQuiz = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { userId, scheduleTime } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(quizId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: "Invalid quiz or user ID" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (!quiz.userId.equals(userId)) {
      return res
        .status(403)
        .json({ error: "Only the quiz creator can schedule" });
    }

    const parsedTime = new Date(scheduleTime);

    if (isNaN(parsedTime.getTime()) || parsedTime <= Date.now()) {
      return res
        .status(400)
        .json({ error: "Schedule time must be a valid future date" });
    }

    // const existingSchedule = await QuizSchedule.findOne({
    //   quizId,
    //   status: { $in: ["pending", "active"] },
    // });

    // if (existingSchedule) {
    //   return res.status(409).json({
    //     error: "A pending or active schedule already exists for this quiz",
    //   });
    // }

    const quizSchedule = new QuizSchedule({
      quizId,
      userId,
      scheduleTime: parsedTime,
      status: "pending",
    });

    await quizSchedule.save();

    return res
      .status(201)
      .json({ message: "Quiz scheduled successfully", quizSchedule });
  } catch (error) {
    console.error("Error scheduling quiz:", error);
    return res.status(500).json({ error: "Failed to schedule quiz" });
  }
};

export const InviteParticipantSession = async (req, res) => {
  const {
    sessionId,
    inviteeEmail,
    inviteeIds,
    inviteLink,
    quizTitle,
    inviteMethod,
  } = req.body;

  try {
    if (!sessionId || !inviteLink || !quizTitle || !inviteMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (inviteMethod === "email" && !inviteeEmail) {
      return res.status(400).json({ error: "Email required for email invite" });
    }
    if (inviteMethod === "userId" && (!inviteeIds || inviteeIds.length === 0)) {
      return res.status(400).json({ error: "At least one user ID required" });
    }

    const session = await QuizSession.findById(sessionId).populate("quizId");
    if (!session) {
      return res.status(404).json({ error: "Quiz session not found" });
    }

    let invitees = [];
    if (inviteMethod === "email") {
      const invitee = await User.findOne({ email: inviteeEmail });
      if (!invitee) {
        return res
          .status(404)
          .json({ error: "User with that email not found" });
      }
      invitees = [invitee];
    } else {
      invitees = await User.find({ _id: { $in: inviteeIds } });
      if (invitees.length === 0) {
        return res
          .status(404)
          .json({ error: "No users found with the provided IDs" });
      }
    }

    const coverImage = session.quizId?.coverImage;
    const notifications = invitees.map((invitee) => ({
      userId: invitee._id,
      //       sessionId: session._id,
      title: `Invitation to ${quizTitle}`,
      message: `You've been invited to join the quiz: "${quizTitle}".`,
      inviteLink,
      coverImage,
      priority: "high",
    }));

    await Notification.insertMany(notifications);

    for (const invitee of invitees) {
      if (invitee.fcmToken) {
        const message = {
          notification: {
            title: `Invitation to ${quizTitle}`,
            body: `You've been invited to join a quiz session. Click to join!`,
          },
          data: {
            sessionId: sessionId.toString(),
            inviteLink,
            coverImage: coverImage || "",
          },
          token: invitee.fcmToken,
        };
        try {
          await admin.messaging().send(message);
          await Notification.updateOne(
            { userId: invitee._id, sessionId },
            { status: "delivered" }
          );
        } catch (error) {
          await Notification.updateOne(
            { userId: invitee._id, sessionId },
            { status: "failed" }
          );
          console.error("FCM error:", error);
        }
      }
    }

    res.status(200).json({ message: "Invitations sent successfully" });
  } catch (error) {
    console.error("Error sending invitations:", error);
    res.status(500).json({ error: "Server error while sending invitations" });
  }
};

export const InviteParticipant = async (req, res) => {
  const {
    sessionId,
    inviteeEmail,
    inviteeIds,
    inviteLink,
    quizTitle,
    inviteMethod,
  } = req.body;

  try {
    if (!sessionId || !inviteLink || !quizTitle || !inviteMethod) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (inviteMethod === "email" && !inviteeEmail) {
      return res.status(400).json({ error: "Email required for email invite" });
    }
    if (inviteMethod === "userId" && (!inviteeIds || inviteeIds.length === 0)) {
      return res.status(400).json({ error: "At least one user ID required" });
    }

    const session = await QuizSchedule.findById(sessionId).populate("quizId");
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    let invitees = [];
    if (inviteMethod === "email") {
      const invitee = await User.findOne({ email: inviteeEmail });
      if (!invitee) return res.status(404).json({ error: "User not found" });
      invitees = [invitee];
    } else {
      invitees = await User.find({ _id: { $in: inviteeIds } });
      if (invitees.length === 0)
        return res.status(404).json({ error: "No users found" });
    }

    const coverImage = session.quizId.coverImage;
    const priority =
      session.startTime &&
      new Date(session.startTime) < new Date("2025-08-23T18:48:00Z")
        ? "high"
        : "medium";
    const notifications = invitees.map((invitee) => ({
      userId: invitee._id,
      sessionId,
      title: `Invitation to ${quizTitle}`,
      message: `You've been invited to join a quiz session: ${quizTitle}. Join now: ${inviteLink}`,
      inviteLink,
      coverImage,
      isRead: false,
      priority,
    }));

    await Notification.insertMany(notifications);

    for (const invitee of invitees) {
      if (invitee.fcmToken) {
        const message = {
          notification: {
            title: `Invitation to ${quizTitle}`,
            body: `You've been invited to join a quiz session. Click to join!`,
          },
          data: {
            sessionId: sessionId.toString(),
            inviteLink,
            coverImage,
          },
          token: invitee.fcmToken,
        };
        try {
          await admin.messaging().send(message);
          await Notification.updateOne(
            { userId: invitee._id, sessionId },
            { status: "delivered" }
          );
        } catch (error) {
          await Notification.updateOne(
            { userId: invitee._id, sessionId },
            { status: "failed" }
          );
          console.error("FCM error:", error);
        }
      }
    }

    res.status(200).json({ message: "Invitations sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

export const cancelQuizSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await QuizSchedule.findByIdAndUpdate(
      id,
      { status: "canceled" },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ error: "Scheduled quiz not found" });
    }

    res
      .status(200)
      .json({ message: "Quiz schedule cancelled successfully", schedule });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
