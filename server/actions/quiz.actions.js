import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Quiz from "../models/quiz.model.js";
import QuizSchedule from "../models/quizSchedule.model.js";
import QuizSession from "../models/quizSession.model.js";
import Feedback from "../models/feedback.model.js";
import User from "../models/user.model.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createQuiz = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      difficulty,
      questions,
      enableTimer,
      timeLimit,
      showTimer,
      maxAttempts,
      randomizeQuestions,
      randomizeAnswers,
      showCorrectAnswers,
      showExplanations,
      allowReview,
      coverImage,
      userId,
      isAICreated,
    } = req.body;

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (error) {
      res
        .status(400)
        .json({ error: "Invalid questions format. Must be valid JSON" });
      return;
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      res.status(400).json({ error: "At least one question is required" });
      return;
    }

    const processedQuestions = await Promise.all(
      parsedQuestions.map(async (question, index) => {
        const processedContent = question.content
          ? await Promise.all(
              question.content.map(async (content) => {
                if (
                  (content.type === "image" || content.type === "audio") &&
                  content.url &&
                  content.url.startsWith("data:")
                ) {
                  if (
                    (content.type === "image" &&
                      !content.url.startsWith("data:image/")) ||
                    (content.type === "audio" &&
                      !content.url.startsWith("data:audio/"))
                  ) {
                    throw new Error(
                      `Invalid ${content.type} format. Must be a valid ${content.type} base64 data URL`
                    );
                  }
                  try {
                    const uploadedMedia = await cloudinary.uploader.upload(
                      content.url,
                      {
                        resource_type:
                          content.type === "audio" ? "video" : "image",
                        upload_preset: "ml_default",
                        folder: "quiz",
                      }
                    );
                    return {
                      ...content,
                      url: uploadedMedia.secure_url,
                      value: undefined,
                    };
                  } catch (uploadError) {
                    throw new Error(
                      `Failed to upload ${content.type} to Cloudinary`
                    );
                  }
                }

                return content;
              })
            )
          : [];

        let processedOptions = question.options;
        if (question.type === "multiple-choice") {
          processedOptions = await Promise.all(
            question.options.map(async (option) => {
              if (
                typeof option === "object" &&
                option.url &&
                !option.url.includes("giphy.com") &&
                !option.url.includes("unsplash.com") &&
                option.url.startsWith("data:")
              ) {
                if (!option.url.startsWith("data:image/")) {
                  throw new Error(
                    "Invalid option image format. Must be a valid image base64 data URL"
                  );
                }
                try {
                  const uploadedOptionImage = await cloudinary.uploader.upload(
                    option.url,
                    {
                      upload_preset: "ml_default",
                      folder: "quiz",
                    }
                  );
                  return {
                    ...option,
                    url: uploadedOptionImage.secure_url,
                    description: option.description?.trim() || "",
                  };
                } catch (uploadError) {
                  throw new Error(
                    "Failed to upload option image to Cloudinary"
                  );
                }
              }

              return option;
            })
          );
        }

        return {
          ...question,
          content: processedContent,
          options: processedOptions,
          id: index + 1,
        };
      })
    );

    let finalCoverImageUrl =
      "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg";

    if (coverImage) {
      if (coverImage.startsWith("data:image")) {
        try {
          const uploadedImage = await cloudinary.uploader.upload(coverImage, {
            upload_preset: "ml_default",
            folder: "quiz",
          });
          finalCoverImageUrl = uploadedImage.secure_url;
        } catch (uploadError) {
          throw new Error("Failed to upload cover image to Cloudinary");
        }
      } else if (
        coverImage.startsWith("http") ||
        coverImage.startsWith("https") ||
        coverImage.includes("cloudinary.com") ||
        coverImage.includes("unsplash.com") ||
        coverImage.includes("giphy.com")
      ) {
        finalCoverImageUrl = coverImage;
      }
    }

    const quiz = new Quiz({
      title: title.trim(),
      description:
        description.trim() !== ""
          ? description.trim()
          : "No description provided",
      subject: subject.trim(),
      difficulty,
      questions: processedQuestions,
      enableTimer: !!enableTimer,
      timeLimit: Number(timeLimit) || 0,
      showTimer: !!showTimer,
      maxAttempts: Number(maxAttempts) || 1,
      randomizeQuestions: !!randomizeQuestions,
      randomizeAnswers: !!randomizeAnswers,
      showCorrectAnswers: !!showCorrectAnswers,
      showExplanations: !!showExplanations,
      allowReview: !!allowReview,
      coverImage: finalCoverImageUrl,
      userId: new mongoose.Types.ObjectId(userId),
      isAICreated: !!isAICreated,
    });

    await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({
      error: error.message || "Failed to create quiz",
    });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: "Valid user ID is required" });
      return;
    }

    const quizzes = await Quiz.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });

    res.status(200).json({ quizzes });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({
      error: error.message || "Failed to fetch quizzes",
    });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid quiz ID is required" });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const quiz = await Quiz.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!quiz) {
      return res.status(404).json({
        error: "Quiz not found or you do not have permission to view it",
      });
    }

    const quizSchedule = await QuizSchedule.findOne({
      quizId: id,
      userId,
      status: { $in: ["pending"] },
    }).lean();

    return res.status(200).json({ quiz, quizSchedule });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return res.status(500).json({
      error: error.message || "Failed to fetch quiz",
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid quiz ID is required" });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    const quiz = await Quiz.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!quiz) {
      return res.status(404).json({
        error: "Quiz not found or you do not have permission to delete it",
      });
    }

    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({
      error: error.message || "Failed to delete quiz",
    });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      subject,
      difficulty,
      questions,
      enableTimer,
      timeLimit,
      showTimer,
      maxAttempts,
      randomizeQuestions,
      randomizeAnswers,
      showCorrectAnswers,
      showExplanations,
      allowReview,
      coverImage,
      userId,
      isAICreated,
    } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid quiz ID is required" });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Invalid questions format. Must be valid JSON" });
    }

    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one question is required" });
    }

    const processedQuestions = await Promise.all(
      parsedQuestions.map(async (question, index) => {
        const processedContent = question.content
          ? await Promise.all(
              question.content.map(async (content) => {
                if (
                  (content.type === "image" || content.type === "audio") &&
                  content.url &&
                  content.url.startsWith("data:")
                ) {
                  if (
                    (content.type === "image" &&
                      !content.url.startsWith("data:image/")) ||
                    (content.type === "audio" &&
                      !content.url.startsWith("data:audio/"))
                  ) {
                    throw new Error(
                      `Invalid ${content.type} format. Must be a valid ${content.type} base64 data URL`
                    );
                  }
                  try {
                    const uploadedMedia = await cloudinary.uploader.upload(
                      content.url,
                      {
                        resource_type:
                          content.type === "audio" ? "video" : "image",
                        upload_preset: "ml_default",
                        folder: "quiz",
                      }
                    );
                    return {
                      ...content,
                      url: uploadedMedia.secure_url,
                      value: undefined,
                    };
                  } catch (uploadError) {
                    throw new Error(
                      `Failed to upload ${content.type} to Cloudinary`
                    );
                  }
                }
                return content;
              })
            )
          : [];

        let processedOptions = question.options;
        if (question.type === "multiple-choice") {
          processedOptions = await Promise.all(
            question.options.map(async (option) => {
              if (
                typeof option === "object" &&
                option.url &&
                !option.url.includes("giphy.com") &&
                !option.url.includes("unsplash.com") &&
                !option.url.includes("cloudinary.com") &&
                option.url.startsWith("data:")
              ) {
                if (!option.url.startsWith("data:image/")) {
                  throw new Error(
                    "Invalid option image format. Must be a valid image base64 data URL"
                  );
                }
                try {
                  const uploadedOptionImage = await cloudinary.uploader.upload(
                    option.url,
                    {
                      upload_preset: "ml_default",
                      folder: "quiz",
                    }
                  );
                  return {
                    ...option,
                    url: uploadedOptionImage.secure_url,
                    description: option.description?.trim() || "",
                  };
                } catch (uploadError) {
                  throw new Error(
                    "Failed to upload option image to Cloudinary"
                  );
                }
              }
              return option;
            })
          );
        }

        return {
          ...question,
          content: processedContent,
          options: processedOptions,
          id: index + 1,
        };
      })
    );

    let coverImageUrl = coverImage;
    if (coverImage && coverImage.startsWith("data:image")) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(coverImage, {
          upload_preset: "ml_default",
          folder: "quiz",
        });
        coverImageUrl = uploadedImage.secure_url;
      } catch (uploadError) {
        throw new Error("Failed to upload cover image to Cloudinary");
      }
    }

    const updatedQuiz = await Quiz.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        title: title.trim(),
        description:
          description.trim() !== ""
            ? description.trim()
            : "No description provided",
        subject: subject.trim(),
        difficulty,
        questions: processedQuestions,
        enableTimer: !!enableTimer,
        timeLimit: Number(timeLimit) || 0,
        showTimer: !!showTimer,
        maxAttempts: maxAttempts === "unlimited" ? 0 : Number(maxAttempts) || 1,
        randomizeQuestions: !!randomizeQuestions,
        randomizeAnswers: !!randomizeAnswers,
        showCorrectAnswers: !!showCorrectAnswers,
        showExplanations: !!showExplanations,
        allowReview: !!allowReview,
        coverImage:
          coverImageUrl ||
          "https://res.cloudinary.com/doxykd1yk/image/upload/v1753004996/istockphoto-1488144839-612x612_boylds.jpg",
        isAICreated: !!isAICreated,
      },
      { new: true, runValidators: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({
        error: "Quiz not found or you do not have permission to update it",
      });
    }

    res
      .status(200)
      .json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({
      error: error.message || "Failed to update quiz",
    });
  }
};

export const VerifyQuizCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: "Invalid quiz code" });
    }

    const quiz = await Quiz.findOne({ code });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz code is valid", quiz });
  } catch (error) {
    console.error("Error verifying quiz code:", error);
    res.status(500).json({
      error: error.message || "Failed to verify quiz code",
    });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const [
      quizStats,
      hostedSessions,
      participatedSessions,
      scheduledSessions,
      feedbackStats,
      performanceStats,
    ] = await Promise.all([
      // Quiz statistics
      Quiz.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $facet: {
            counts: [{ $count: "totalQuizzes" }],
            byDifficulty: [
              {
                $group: {
                  _id: "$difficulty",
                  count: { $sum: 1 },
                },
              },
            ],
            bySubject: [
              {
                $group: {
                  _id: "$subject",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),

      // Hosted sessions
      QuizSession.aggregate([
        { $match: { hostId: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "quizzes",
            localField: "quizId",
            foreignField: "_id",
            as: "quiz",
          },
        },
        { $unwind: "$quiz" },
        {
          $project: {
            _id: 1,
            quizTitle: "$quiz.title",
            description: "$quiz.description",
            image: "$quiz.coverImage",
            questionCount: { $size: "$quiz.questions" },
            participants: { $size: "$participants" },
            status: 1,
            createdAt: 1,
            isHost: { $literal: true },
          },
        },
      ]),

      // Participated sessions
      QuizSession.aggregate([
        {
          $match: {
            "participants.userId": new mongoose.Types.ObjectId(userId),
            hostId: { $ne: new mongoose.Types.ObjectId(userId) },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "quizzes",
            localField: "quizId",
            foreignField: "_id",
            as: "quiz",
          },
        },
        { $unwind: "$quiz" },
        {
          $project: {
            _id: 1,
            quizTitle: "$quiz.title",
            description: "$quiz.description",
            image: "$quiz.coverImage",
            questionCount: { $size: "$quiz.questions" },
            participants: { $size: "$participants" },
            status: 1,
            createdAt: 1,
            isHost: { $literal: false },
            userScore: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$participants",
                    as: "p",
                    cond: {
                      $eq: ["$$p.userId", new mongoose.Types.ObjectId(userId)],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      ]),

      // Scheduled sessions
      QuizSchedule.find({ userId, status: "pending" })
        .populate("quizId", "title description coverImage questions")
        .sort({ scheduleTime: 1 })
        .limit(5)
        .lean(),

      // Feedback stats
      Feedback.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalFeedback: { $sum: 1 },
            ratingDistribution: { $push: "$rating" },
          },
        },
      ]),

      // Performance stats - FIXED
      QuizSession.aggregate([
        {
          $match: {
            $or: [
              { hostId: new mongoose.Types.ObjectId(userId) },
              { "participants.userId": new mongoose.Types.ObjectId(userId) },
            ],
            status: "completed",
            endTime: { $exists: true, $ne: null },
            createdAt: { $exists: true, $ne: null },
          },
        },
        {
          $project: {
            isHost: { $eq: ["$hostId", new mongoose.Types.ObjectId(userId)] },
            duration: {
              $cond: {
                if: { $and: ["$endTime", "$createdAt"] },
                then: { $subtract: ["$endTime", "$createdAt"] },
                else: null,
              },
            },
            score: {
              $cond: {
                if: { $eq: ["$hostId", new mongoose.Types.ObjectId(userId)] },
                then: null,
                else: {
                  $let: {
                    vars: {
                      participant: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$participants",
                              as: "p",
                              cond: {
                                $eq: [
                                  "$$p.userId",
                                  new mongoose.Types.ObjectId(userId),
                                ],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$participant.score",
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            avgHostDuration: {
              $avg: {
                $cond: [{ $eq: ["$isHost", true] }, "$duration", "$$REMOVE"],
              },
            },
            avgParticipantDuration: {
              $avg: {
                $cond: [{ $eq: ["$isHost", false] }, "$duration", "$$REMOVE"],
              },
            },
            avgScore: {
              $avg: {
                $cond: [{ $eq: ["$isHost", false] }, "$score", "$$REMOVE"],
              },
            },
            bestScore: {
              $max: {
                $cond: [{ $eq: ["$isHost", false] }, "$score", "$$REMOVE"],
              },
            },
            totalHostedSessions: {
              $sum: { $cond: [{ $eq: ["$isHost", true] }, 1, 0] },
            },
            totalParticipatedSessions: {
              $sum: { $cond: [{ $eq: ["$isHost", false] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const users = await User.find(
      userId ? { _id: { $ne: userId } } : {},
      "name email picture"
    ).exec();

    // Extract performance stats with proper defaults
    const perfStats = performanceStats[0] || {};

    res.status(200).json({
      quizStats: {
        totalQuizzes: quizStats[0]?.counts[0]?.totalQuizzes || 0,
        byDifficulty: quizStats[0]?.byDifficulty || [],
        bySubject: quizStats[0]?.bySubject || [],
        totalHosted: hostedSessions.length,
        totalParticipated: participatedSessions.length,
        avgHostDuration: perfStats.avgHostDuration
          ? Math.round(perfStats.avgHostDuration / 60000)
          : 0,
        avgParticipantDuration: perfStats.avgParticipantDuration
          ? Math.round(perfStats.avgParticipantDuration / 60000)
          : 0,
        avgScore: perfStats.avgScore || 0,
        bestScore: perfStats.bestScore || 0,
        totalHostedSessions: perfStats.totalHostedSessions || 0,
        totalParticipatedSessions: perfStats.totalParticipatedSessions || 0,
        averageRating: feedbackStats[0]?.averageRating || 0,
        totalFeedback: feedbackStats[0]?.totalFeedback || 0,
        ratingDistribution: feedbackStats[0]?.ratingDistribution || [],
      },
      sessions: {
        hosted: hostedSessions,
        participated: participatedSessions.map((s) => ({
          ...s,
          userScore: s.userScore?.score || 0,
        })),
        scheduled: scheduledSessions.map((s) => ({
          _id: s._id,
          quizTitle: s.quizId?.title || "Untitled",
          description: s.quizId?.description || "",
          image: s.quizId?.coverImage || "",
          questionCount: s.quizId?.questions?.length || 0,
          status: s.status,
          scheduleTime: s.scheduleTime,
          quizId: s.quizId?._id,
          code: s.code,
        })),
      },
      users,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};

export const saveExploredQuiz = async (req, res) => {
  try {
    const { quizData, userId } = req.body;

    if (!quizData || !userId) {
      return res
        .status(400)
        .json({ error: "Quiz data and user ID are required." });
    }

    const newQuiz = new Quiz({
      ...quizData,
      userId: userId,
      isAICreated: false,
    });

    await newQuiz.save();
    res
      .status(201)
      .json({ message: "Quiz saved successfully!", quiz: newQuiz });
  } catch (error) {
    console.error("Error saving explored quiz:", error);
    res.status(500).json({ error: "Failed to save quiz." });
  }
};

export const toggleQuizPublicStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found." });
    }

    if (quiz.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to publish this quiz." });
    }

    quiz.isPublic = !quiz.isPublic;
    await quiz.save();

    res.status(200).json({
      message: `Quiz is now ${quiz.isPublic ? "public" : "private"}.`,
      quiz: quiz,
    });
  } catch (error) {
    console.error("Error toggling quiz public status:", error);
    res.status(500).json({ error: "Server error." });
  }
};

export const getPublicQuizzes = async (req, res) => {
  try {
    const publicQuizzes = await Quiz.find({ isPublic: true })
      .populate("userId", "name picture")
      .sort({ createdAt: -1 });

    res.status(200).json(publicQuizzes);
  } catch (error) {
    console.error("Error fetching public quizzes:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getSinglePublicQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, isPublic: true }).populate(
      "userId",
      "name picture"
    );

    if (!quiz) {
      return res.status(404).json({ error: "Public quiz not found." });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Error fetching single public quiz:", error);
    res.status(500).json({ error: "Server error." });
  }
};
