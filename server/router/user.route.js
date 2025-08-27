import express from "express";
import {
  DeleteUser,
  getUser,
  getUserActivity,
  googleAuth,
  loginUser,
  resetImage,
  resetPassword,
  signupUser,
  updateFcmToken,
  updateUser,
  uploadImage,
} from "../actions/user.actions.js";

const router = express.Router();

router.get("/:userId/activity", getUserActivity);
router.get("/:userId", getUser);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/googleauth", googleAuth);
router.post("/reset-password", resetPassword);
router.post("/upload", uploadImage);
router.post("/reset-image", resetImage);
router.put("/update/:userId", updateUser);
router.delete("/delete/:userId", DeleteUser);
router.post("/update-fcm", updateFcmToken);

export default router;
