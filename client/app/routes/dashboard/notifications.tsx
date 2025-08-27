import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { containerVariants, itemVariants } from "~/components/constants";
import { fetchUnreadCount } from "~/redux/actions";

// Corrected Material-UI Icon Imports
import NotificationsIcon from "@mui/icons-material/Notifications";
import BackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

const NotificationItem = ({ notification, onDelete }) => {
  const isUnread = !notification.isRead;
  const navigate = useNavigate();

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(notification._id);
  };

  return (
    <motion.div
      variants={itemVariants}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={() => window.open(notification?.inviteLink)}
      className="cursor-pointer"
    >
      <div
        className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10
            ${
              isUnread
                ? "bg-gradient-to-r from-cyan-800/30 to-cyan-600/30 border-cyan-600/60 shadow-cyan-600/20"
                : "bg-slate-800/70 border-slate-700/60 hover:bg-slate-800/80 hover:border-cyan-500/50"
            }`}
      >
        {/* <Link to={notification.inviteLink} className="absolute inset-0 z-10" /> */}

        <div className="relative z-20 flex-shrink-0">
          <img
            src={notification?.coverImage}
            alt="Quiz"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover"
          />
          {isUnread && (
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </div>
        <div className="relative z-20 min-w-0 flex-1">
          <p className="truncate font-semibold text-white text-sm sm:text-base">
            {notification.title}
          </p>
          <p className="line-clamp-2 mt-1 text-xs sm:text-sm text-slate-300">
            {notification.message}
          </p>
          <p className="mt-1.5 sm:mt-2 text-xs text-slate-500">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        <motion.button
          onClick={handleDeleteClick}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full  text-slate-400 hover:text-red-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <CloseIcon sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.reducer.currentUser);
  const dispatch = useDispatch();

  const handleDeleteNotification = async (notificationId) => {
    const originalNotifications = notifications;
    setNotifications(notifications.filter((n) => n._id !== notificationId));

    try {
      await axios.delete(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/notifications/${notificationId}`,
        {
          data: { userId: user._id },
        }
      );
      toast.success("Notification deleted.");
      dispatch(fetchUnreadCount(user?._id));
    } catch (error) {
      toast.error("Failed to delete notification.");
      // Revert the UI on error
      setNotifications(originalNotifications);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/notifications/${user._id}`
        );
        if (response) {
          console.log("Fetched notifications:", response.data);
          setNotifications(response.data);

          axios
            .post(
              `${import.meta.env.VITE_SERVER_URL}/api/notifications/mark-read`,
              {
                userId: user._id,
              }
            )
            .catch((err) =>
              console.error("Failed to mark notifications as read", err)
            );
          dispatch(fetchUnreadCount(user?._id));
        }
      } catch (error) {
        toast.error("Failed to fetch notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  return (
    <div className="mx-auto min-h-screen max-w-full sm:max-w-3xl md:max-w-4xl px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 z-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          to="/dashboard"
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm sm:text-base transition-colors"
        >
          <BackIcon sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="flex items-center gap-2 sm:gap-3 text-2xl sm:text-3xl md:text-4xl font-bold text-white">
          <NotificationsIcon
            sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" } }}
          />
          Notifications
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex h-48 sm:h-64 items-center justify-center">
          <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-t-cyan-400 border-r-transparent" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 sm:mt-8 space-y-3 sm:space-y-4"
        >
          <AnimatePresence>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif._id}
                  notification={notif}
                  onDelete={handleDeleteNotification}
                />
              ))
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-slate-800/50 py-10 sm:py-12 text-center"
              >
                <CheckCircle className="mx-auto text-4xl sm:text-5xl text-slate-500" />
                <p className="mt-3 sm:mt-4 text-slate-400 text-sm sm:text-base">
                  You're all caught up! No notifications here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
