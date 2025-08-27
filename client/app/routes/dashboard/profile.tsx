import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { updateUser } from "../../redux/actions";
import { pricingPlans } from "~/components/constants";

// Corrected Material-UI Icon Imports
import EditIcon from "@mui/icons-material/Edit";
import DeleteForever from "@mui/icons-material/DeleteForever";
import Save from "@mui/icons-material/Save";
import Cancel from "@mui/icons-material/Cancel";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import LockResetIcon from "@mui/icons-material/LockReset";

export default function ProfilePage() {
  const user = useSelector((state) => state.reducer.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(user?.picture || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [activity, setActivity] = useState([]);

  const currentPlanDetails = pricingPlans.find(
    (plan) => plan.name === (user?.plan || "Free")
  );

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/user/${user._id}/activity`
        );
        setActivity(res.data);
      } catch (error) {
        console.error("Failed to fetch activity");
      }
    };
    fetchActivity();
  }, [user]);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result;
          setProfileImage(base64Image);
          try {
            const res = await axios.put(
              `${import.meta.env.VITE_SERVER_URL}/api/user/update/${user?._id}`,
              { picture: base64Image }
            );
            dispatch(updateUser(res.data.user));
            toast.success("Profile picture updated!");
          } catch (error) {
            toast.error("Failed to upload image.");
            setProfileImage(user?.picture);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [user, dispatch]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/user/update/${user?._id}`,
        formData
      );
      dispatch(updateUser(res.data.user));
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/user/delete/${user?._id}`
      );
      toast.success("Account deleted successfully.");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete account.");
    }
    setOpenDialog(false);
  };

  const renderActivity = (item) => {
    switch (item.type) {
      case "created_quiz":
        return `You created a new quiz: "${item.item.title}"`;
      case "hosted_session":
        return `You hosted a quiz session: "${item.item.quizId.title}"`;
      case "played_quiz":
        return `You participated in a quiz: "${item.item.quizId.title}"`;
      default:
        return "An unknown activity occurred.";
    }
  };

  return (
    <div className="min-h-screen font-inter text-white bg-slate-900 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl border border-slate-700/80"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div
                  {...getRootProps()}
                  className="relative cursor-pointer group flex-shrink-0"
                >
                  <input {...getInputProps()} />
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-40 w-40 rounded-full object-cover border-4 border-slate-600"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditIcon />
                  </div>
                </div>
                <div className="text-center sm:text-left w-full">
                  {!isEditing ? (
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        {formData.name}
                      </h1>
                      <p className="text-slate-400 mt-1">{formData.email}</p>
                      <div className="mt-4 flex gap-4 justify-center sm:justify-start">
                        <motion.button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <EditIcon /> Edit Profile
                        </motion.button>
                        <motion.button
                          onClick={() => navigate("/reset-password")}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <LockResetIcon /> Change Password
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded-lg text-lg"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full p-2 bg-slate-900/50 border border-slate-600 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-4">
                        <motion.button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSaving ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Save />
                          )}{" "}
                          Save
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          <Cancel /> Cancel
                        </motion.button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl border border-slate-700/80"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Your Subscription
                  </h2>
                  <p className="text-slate-400 mt-1">
                    You are on the{" "}
                    <span className="font-medium text-cyan-400">
                      {user?.plan || "Free"} Plan
                    </span>
                    .
                  </p>
                </div>
                {user?.plan !== "Pro" && (
                  <motion.button
                    onClick={() => navigate("/pricing")}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-semibold rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Upgrade to Pro <ArrowForward />
                  </motion.button>
                )}
              </div>
              {currentPlanDetails && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="font-semibold text-white mb-3">
                    Your Plan Features:
                  </h3>
                  <ul className="space-y-2">
                    {currentPlanDetails.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-3 text-slate-300 text-sm"
                      >
                        <CheckCircle
                          sx={{ fontSize: "1rem", color: "#22d3ee" }}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </main>

          <aside className="lg:col-span-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                AI Credits
              </h2>
              <div className="text-center">
                <p className="text-6xl font-bold text-cyan-400">
                  {user?.credits}
                </p>
                <p className="text-slate-400">Generations Remaining</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
              className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/80"
            >
              <h2 className="text-xl font-semibold text-white mb-4">
                Recent Activity
              </h2>
              <ul className="space-y-4">
                {activity.slice(0, 5).map((item, index) => (
                  <li
                    key={`${item.item._id}-${index}`}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1.5 flex-shrink-0 h-2.5 w-2.5 rounded-full bg-cyan-400/70" />
                    <div>
                      <p className="text-slate-300 text-sm">
                        {renderActivity(item)}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        {formatDistanceToNow(new Date(item.date), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
              className="bg-red-900/20 p-6 rounded-2xl border border-red-500/50"
            >
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                Danger Zone
              </h2>
              <p className="text-red-400/80 text-sm mb-4">
                Permanently delete your account and all its data. This action
                cannot be undone.
              </p>
              <motion.button
                onClick={() => setOpenDialog(true)}
                className="w-full px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              >
                <DeleteForever /> Delete My Account
              </motion.button>
            </motion.div>
          </aside>
        </div>
      </motion.div>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          style: {
            backgroundColor: "#1e293b",
            color: "white",
            border: "1px solid #475569",
          },
        }}
      >
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#9ca3af" }}>
            Are you absolutely sure you want to delete your account? All your
            quizzes and data will be permanently removed. This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{ color: "#cbd5e1" }}
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteAccount} sx={{ color: "#ef4444" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
