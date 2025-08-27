import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import toast, { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import type { Route } from "./+types/root";
import "./app.css";
import ReduxProvider from "./redux/reduxProvider";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUnreadCount, getUser } from "./redux/actions";
import { useNavigate } from "react-router-dom";
import { getMessagingInstance } from "~/firebase";
import { getToken, onMessage } from "firebase/messaging";
import Close from "@mui/icons-material/Close";
import { motion } from "framer-motion";
import axios from "axios";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
          <ReduxProvider>
            {children}
            <ScrollRestoration />
            <Scripts />
          </ReduxProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.reducer.currentUser);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      // navigate("/dashboard");
      dispatch(getUser(userId));
    } else {
      navigate("/");
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [dispatch]);

  useEffect(() => {
    const messaging = getMessagingInstance();

    if (messaging && user?._id) {
      const requestNotificationPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const token = await getToken(messaging, {
              vapidKey:
                "BAxcOCe0MIeSAUW3ccOk44jtQWPlUyISCpD6KEVPc7Pt54MdkBaUWaBHSEACIoF_UL6VbCUv2sNM8MWrBDY3tWM",
            });

            console.log("FCM Token:", token);
            // Send the token to your servers
            if (token) {
              await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/user/update-fcm`,
                {
                  userId: user._id,
                  fcmToken: token,
                }
              );
            }
          } else {
            console.log("Notification permission denied.");
          }
        } catch (error) {
          console.error("Error getting FCM token:", error);
          if (error.code === "messaging/unsupported-browser") {
            toast.error("Notifications are not supported on this browser.");
          }
        }
      };

      requestNotificationPermission();

      const unsubscribe = onMessage(messaging, (payload) => {
        dispatch(fetchUnreadCount(user?._id));
        console.log("Foreground message received:", payload);

        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            onClick={() => {
              toast.dismiss(t.id);
              navigate("/dashboard/notifications");
            }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="max-w-sm w-full bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-xl p-4 flex items-center space-x-4 border border-slate-700/50 cursor-pointer hover:bg-slate-700/70"
          >
            {payload.data.coverImage && (
              <img
                src={payload.data.coverImage}
                alt="Quiz Cover"
                className="h-16 w-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-100">
                {payload.notification.title}
              </p>
              <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                {payload.notification.body}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="text-slate-400 hover:text-white focus:outline-none transition-colors"
            >
              <Close className="w-6 h-6" />
            </button>
          </motion.div>
        ));
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          style: {
            borderRadius: "8px",
            padding: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
        }}
      />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
