import DashboardIcon from "@mui/icons-material/Dashboard";
import QuizIcon from "@mui/icons-material/Quiz";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
};

export const slideUp = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export interface SidebarItem {
  name: string;
  icon: React.ElementType;
  path: string;
}

export const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    icon: DashboardIcon,
    path: "/dashboard",
  },
  {
    name: "Quizzes",
    icon: QuizIcon,
    path: "/dashboard/quizzes",
  },
  {
    name: "Analytics",
    icon: AnalyticsIcon,
    path: "/dashboard/analytics",
  },
  {
    name: "Community",
    icon: PeopleIcon,
    path: "/dashboard/community",
  },
  // {
  //   name: "Settings",
  //   icon: SettingsIcon,
  //   path: "/dashboard/settings",
  // },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    tagline: "For individuals starting out with AI-powered quiz creation.",
    credits: "5 AI Quiz Generations per month",
    isPopular: false,
    features: [
      "Up to 10 questions per quiz",
      "Manual quiz creation",
      "Access to public quiz library",
      "Basic analytics",
    ],
  },
  {
    name: "Pro",
    price: "₹99",
    tagline:
      "For educators and professionals who need more power and features.",
    credits: "50 AI Quiz Generations per month",
    isPopular: true,
    features: [
      "Up to 50 questions per quiz",
      "Advanced AI generation options",
      "Image & media uploads",
      "Detailed performance analytics",
      "Publish quizzes to community",
    ],
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    tagline:
      "For organizations and teams requiring custom solutions and support.",
    credits: "Unlimited AI Quiz Generations",
    isPopular: false,
    features: [
      "Unlimited questions per quiz",
      "Team collaboration features",
      "Custom branding options",
      "API access for integration",
      "Dedicated support",
    ],
  },
];

export const faqItems = [
  {
    question: "How do credits work?",
    answer:
      "Credits are consumed when you create quizzes or use advanced AI features. Different actions use varying amounts of credits. You can always purchase more credits or upgrade your plan.",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, absolutely! You can easily upgrade or downgrade your plan at any time directly from your account settings. Changes are pro-rated.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal for your convenience.",
  },
  {
    question: "Is there a money-back guarantee?",
    answer:
      "We offer a 30-day money-back guarantee for all our paid plans. If you're not satisfied, we'll refund your purchase, no questions asked.",
  },
  {
    question: "What does 'Unlimited Quizzes' mean in the Pro plan?",
    answer:
      "With 'Unlimited Quizzes' in the Pro plan, you can create as many quizzes as you like without a numerical limit. This is subject to our fair usage policy and credit availability for AI-powered features.",
  },
];

export const testimonials = [
  {
    name: "Alice Johnson",
    title: "Educator at Springfield High",
    quote:
      "This platform has completely transformed how I create and manage quizzes for my students. The analytics are incredibly insightful and help me tailor my teaching!",
    profilePic: "https://placehold.co/100x100/00bcd4/ffffff?text=AJ",
  },
  {
    name: "Bob Smith",
    title: "Marketing Specialist, InnovateCorp",
    quote:
      "The 'Pro' plan is an absolute game-changer for our marketing campaigns. Unlimited quizzes and detailed analytics have significantly boosted our audience engagement.",
    profilePic: "https://placehold.co/100x100/8e24aa/ffffff?text=BS",
  },
  {
    name: "Charlie Brown",
    title: "HR Team Lead, Global Solutions",
    quote:
      "The Enterprise plan's team collaboration tools are phenomenal for our internal training programs. The dedicated support ensures everything runs smoothly. Highly recommend!",
    profilePic: "https://placehold.co/100x100/42a5f5/ffffff?text=CB",
  },
  {
    name: "Diana Miller",
    title: "Freelance Content Creator",
    quote:
      "As a freelancer, the flexibility and powerful features of the Pro plan are exactly what I needed to create engaging content for my clients. Super easy to use!",
    profilePic: "https://placehold.co/100x100/ec407a/ffffff?text=DM",
  },
  {
    name: "Ethan Davis",
    title: "Startup Founder",
    quote:
      "We use this for customer feedback surveys and internal team knowledge checks. The Enterprise features are robust and scalable for our growing needs.",
    profilePic: "https://placehold.co/100x100/66bb6a/ffffff?text=ED",
  },
  {
    name: "Fiona White",
    title: "Online Course Instructor",
    quote:
      "The quiz analytics help me understand where my students struggle, allowing me to refine my course material. It's an indispensable tool for online education.",
    profilePic: "https://placehold.co/100x100/ff7043/ffffff?text=FW",
  },
];

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 12px 40px rgba(0, 255, 255, 0.3)",
    transition: { duration: 0.3 },
  },
};

export const faqContentVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export interface PricingPlan {
  name: string;
  tagline: string;
  price: string;
  credits: string;
  features: string[];
  isPopular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Testimonial {
  name: string;
  title: string;
  quote: string;
  profilePic: string;
}

export const sidebarVariants = {
  open: { x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  closed: { x: "-100%", transition: { duration: 0.3, ease: "easeIn" } },
};

export const desktopSidebarVariants = {
  expanded: {
    width: "16rem",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  collapsed: {
    width: "4.5rem",
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const menuVariants = {
  open: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  closed: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export interface Question {
  id: number;
  type: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: (
    | string
    | { type: "image"; url: string; file: File; description: string }
  )[];
  correctAnswer?: number | boolean | string;
  explanation: string;
}

export interface UnsplashImage {
  id: string;
  urls: { small: string };
}

export interface GifImage {
  id: string;
  urls: { small: string };
}

export interface UploadedContent {
  type: string;
  name: string;
  url: string;
  file?: File;
}

export interface Quiz {
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  questions: Question[];
  enableTimer: boolean;
  timeLimit: number;
  showTimer: boolean;
  maxAttempts: string;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  coverImage: string | File | null;
  previewUrl?: string | null;
}

export interface Content {
  type: "image" | "text" | "video" | "audio";
  file?: File;
  url?: string;
  value?: string;
}

export interface Question {
  id: number;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-in-the-blank";
  question: string;
  options?: (
    | string
    | { type: "image"; url: string; file?: File; description: string }
  )[];
  correctAnswer?: number | boolean | string;
  explanation?: string;
  content?: Content[];
}

export const themes = {
  dark: {
    name: "Midnight",
    bg: "bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#24243e]",
    text: "text-white",
    card: "bg-[#1e1b4b]/80",
    accent: "text-purple-400",
    button: "bg-purple-600 hover:bg-purple-700",
    cssCard: "rgba(30, 27, 75, 0.8)",
    cssText: "white",
  },
  ocean: {
    name: "Ocean",
    bg: "bg-gradient-to-br from-[#0a192f] via-[#172a45] to-[#303f60]",
    text: "text-blue-50",
    card: "bg-[#172a45]/80",
    accent: "text-teal-400",
    button: "bg-teal-600 hover:bg-teal-700",
    cssCard: "rgba(23, 42, 69, 0.8)",
    cssText: "#dbeafe", // Tailwind blue-50
  },
  sunset: {
    name: "Sunset",
    bg: "bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]",
    text: "text-orange-50",
    card: "bg-[#203a43]/80",
    accent: "text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700",
    cssCard: "rgba(32, 58, 67, 0.8)",
    cssText: "#fff7ed", // Tailwind orange-50
  },
  forest: {
    name: "Forest",
    bg: "bg-gradient-to-br from-[#0a1a0a] via-[#1a3a1a] to-[#2a5a2a]",
    text: "text-green-50",
    card: "bg-[#1a3a1a]/80",
    accent: "text-green-400",
    button: "bg-green-600 hover:bg-green-700",
    cssCard: "rgba(26, 58, 26, 0.8)",
    cssText: "#ecfdf5", // Tailwind green-50
  },
  light: {
    name: "Light",
    bg: "bg-gradient-to-br from-[#f0f2f5] via-[#e6e9ef] to-[#dde1e9]",
    text: "text-gray-800",
    card: "bg-white/80",
    accent: "text-blue-600",
    button: "bg-blue-500 hover:bg-blue-600 text-white",
    cssCard: "rgba(255, 255, 255, 0.8)",
    cssText: "#1f2937", // Tailwind gray-800
  },
  sky: {
    name: "Sky",
    bg: "bg-gradient-to-br from-[#e0f7fa] via-[#b2ebf2] to-[#80deea]",
    text: "text-black",
    card: "bg-white/80",
    accent: "text-cyan-600",
    button: "bg-cyan-500 hover:bg-cyan-600 text-white",
    cssCard: "rgba(255, 255, 255, 0.8)",
    cssText: "black",
  },
};
