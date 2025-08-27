import Notification from "../models/notification.model.js";
import mongoose from "mongoose";

export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "sessionId",
        select: "quizId",
        populate: {
          path: "quizId",
          select: "title coverImage",
        },
      });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching notifications" });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const deletedNotification = await Notification.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!deletedNotification) {
      return res
        .status(404)
        .json({ error: "Notification not found or not authorized to delete" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
};
