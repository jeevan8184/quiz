import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Badge } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications"; // Corrected import
import { fetchUnreadCount } from "~/redux/actions";

export default function NotificationsBell() {
  const user = useSelector((state) => state.reducer.currentUser);
  const unreadCount = useSelector((state) => state.reducer.unreadCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      dispatch(fetchUnreadCount(user?._id));
    }
  }, [user]);

  const handleClick = () => {
    navigate("/dashboard/notifications");
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon className="text-white" />
      </Badge>
    </div>
  );
}
