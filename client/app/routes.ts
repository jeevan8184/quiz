import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("verify-otp", "routes/verify-otp.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("pricing", "routes/pricing.tsx"),

  route("dashboard", "routes/dashboard/layout.tsx", [
    index("routes/dashboard/index.tsx"),
    route("profile", "routes/dashboard/profile.tsx"),
    route("analytics", "routes/dashboard/analytics.tsx"),
    route("community", "routes/dashboard/community.tsx"),
    route("create-quiz", "routes/dashboard/create-quiz.tsx"),
    route("notifications", "routes/dashboard/notifications.tsx"),
    route("ai-generate", "routes/dashboard/ai-generate.tsx"),
    route("quizzes", "routes/dashboard/quizzes.tsx"),
    route("quizzes/:id", "routes/dashboard/quiz-detail.tsx"),
    route("edit-quiz/:id", "routes/dashboard/edit-quiz.tsx"),
    route("explore-quiz/:id", "routes/dashboard/explore-quiz.tsx"),
    route("public-quiz/:id", "routes/dashboard/public-quiz-details.tsx"),
  ]),
  route("activity", "routes/activity/layout.tsx", [
    index("routes/activity/index.tsx"),
    route("start-quiz/:id", "routes/activity/start-quiz.tsx"),
    route("start-join", "routes/activity/start-join.tsx"),
    route("waiting", "routes/activity/waiting.tsx"),
    route("host-result/:id", "routes/activity/host-result.tsx"),
    route("user-result/:id", "routes/activity/user-result.tsx"),
  ]),
] satisfies RouteConfig;
