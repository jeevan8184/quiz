import express from "express";
import {
  deleteNotification,
  getUnreadNotificationCount,
  getUserNotifications,
  markNotificationsAsRead,
} from "../actions/notification.actions.js";

const router = express.Router();

router.get("/:userId", getUserNotifications);
router.get("/unread-count/:userId", getUnreadNotificationCount);
router.post("/mark-read", markNotificationsAsRead);
router.delete("/:id", deleteNotification);

export default router;
