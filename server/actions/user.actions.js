import mongoose from "mongoose";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import Quiz from "../models/quiz.model.js";
import QuizSession from "../models/quizSession.model.js";
import Notification from "../models/notification.model.js";

const secret = process.env.SECRET;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (req, res) => {
  console.log(req.body);
  const { image } = req.body;

  try {
    const uploadedImage = await cloudinary.uploader.upload(image, {
      upload_preset: "ml_default",
      folder: "quiz",
    });
    res.status(200).json({ url: uploadedImage.secure_url });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};

export const resetImage = async (req, res) => {
  const { userId, picture } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.picture = picture;
    await user.save();
    res.status(200).json({ message: "Image reset successfully", user });
  } catch (error) {
    console.log("Error resetting image:", error);
    res.status(500).json({ message: "Image reset failed" });
  }
};

export const googleAuth = async (req, res) => {
  const { email, name, picture, password } = req.body;
  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(200)
        .json({ message: "User already exists", user: existingUser });
    } else {
      const hasPass = await bcrypt.hash(password, 12);
      const newUser = new User({
        email,
        name,
        picture,
        password: hasPass,
      });
      await newUser.save();
      return res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    }
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signupUser = async (req, res) => {
  const { email, password, name, picture } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hasPass = await bcrypt.hash(password, 12);

    const newUser = new User({
      email,
      password: hasPass,
      name,
      picture,
    });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    const checkPass = await bcrypt.compare(password, user.password);
    if (!checkPass) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, picture } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID" });
    }

    const updateFields = {};

    if (name) {
      updateFields.name = name;
    }
    if (email) {
      updateFields.email = email;
    }

    if (picture) {
      const uploadedImage = await cloudinary.uploader.upload(picture, {
        upload_preset: "ml_default",
        folder: "profile_pictures",
      });
      updateFields.picture = uploadedImage.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "User profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update profile" });
  }
};

export const DeleteUser = async (req, res) => {
  const { userId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userIdObj = new mongoose.Types.ObjectId(userId);

    await Quiz.deleteMany({ userId: userIdObj }, { session });

    await QuizSession.deleteMany({ hostId: userIdObj }, { session });

    await QuizSession.updateMany(
      { "participants.userId": userIdObj },
      { $pull: { participants: { userId: userIdObj } } },
      { session }
    );

    await Notification.deleteMany({ userId: userIdObj }, { session });

    await Feedback.deleteMany({ userId: userIdObj }, { session });

    const user = await User.findByIdAndDelete(userIdObj, { session });
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User not found" });
    }

    await session.commitTransaction();
    session.endSession();

    res
      .status(200)
      .json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateFcmToken = async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.fcmToken = fcmToken;
    await user.save();

    // console.log("FCM token updated for user:", user);
    res.status(200).json({ message: "FCM token updated successfully", user });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = 10;

    const createdQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const hostedSessions = await QuizSession.find({ hostId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("quizId", "title")
      .lean();
    const participatedSessions = await QuizSession.find({
      "participants.userId": userId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("quizId", "title")
      .lean();

    const activity = [
      ...createdQuizzes.map((q) => ({
        type: "created_quiz",
        item: q,
        date: q.createdAt,
      })),
      ...hostedSessions.map((s) => ({
        type: "hosted_session",
        item: s,
        date: s.createdAt,
      })),
      ...participatedSessions.map((s) => ({
        type: "played_quiz",
        item: s,
        date: s.createdAt,
      })),
    ];

    activity.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(activity.slice(0, limit));
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Server error" });
  }
};
