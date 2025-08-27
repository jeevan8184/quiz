import React, { useState, type ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Menu, MenuItem } from "@mui/material";
import { getUser, logout } from "~/redux/actions";
import {
  desktopSidebarVariants,
  itemVariants,
  sidebarItems,
  sidebarVariants,
} from "./constants";
import NotificationsBell from "./NotificationBell";

// Corrected Material-UI Icon Imports
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const Dashboard: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.reducer.currentUser);
  const userLoading = useSelector((state: any) => state.reducer.userLoading);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isProfileMenuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate("/");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSidebarItemClick = () => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
    }
  };

  if (userLoading) {
    return <div className="text-center mt-10 text-white">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // text-white bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]

  return (
    <div className="min-h-screen font-inter text-white bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <motion.header
        className="flex justify-between items-center p-4 max-sm:p-3 sm:px-8 bg-black/30 backdrop-blur-md shadow-md sticky top-0 z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img
            src="/logo1.png"
            alt="Logo"
            className="h-12 w-12 mr-3 rounded-full shadow-md"
          />
          <span className="text-xl font-bold text-cyan-300 drop-shadow-[0_0_8px_#0ff]">
            AI Quiz Builder
          </span>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className=" pr-2">
            <NotificationsBell />
          </div>
          <div className="flex items-center gap-2">
            <div
              className="cursor-pointer h-10 w-10 rounded-full bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center text-cyan-300 font-semibold shadow-[0_0_5px_#0ff] hover:shadow-[0_0_10px_#0ff] transition-shadow duration-200"
              onClick={handleMenuOpen}
            >
              <img
                src={user?.picture}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <span className="text-cyan-100 font-medium hidden sm:block">
              {user.name || "User"}
            </span>
          </div>
          <Menu
            anchorEl={anchorEl}
            open={isProfileMenuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                backgroundColor: "rgba(0,0,0,0.9)",
                backdropFilter: "blur(8px)",
                borderRadius: "12px",
                width: "256px",
                p: 2,
                color: "#67e8f9", // text-cyan-100
                boxShadow: "0px 4px 12px rgba(0, 255, 255, 0.2)",
              },
            }}
          >
            <div className="text-center">
              {/* Profile Image */}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate("/dashboard/profile");
                }}
                sx={{
                  justifyContent: "center",
                  display: "flex",
                  p: 1,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "rgba(103, 232, 249, 0.1)", // hover:bg-cyan-500/20
                    boxShadow: "0 0 5px #0ff",
                  },
                }}
              >
                <div className="h-12 w-12 rounded-full bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center mx-auto mb-2">
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </MenuItem>

              {/* User Name */}
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  navigate("/dashboard/profile");
                }}
                sx={{
                  justifyContent: "center",
                  fontWeight: "600",
                  color: "#67e8f9", // text-cyan-300
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "rgba(103, 232, 249, 0.1)",
                    boxShadow: "0 0 5px #0ff",
                  },
                }}
              >
                {user.name || "User"}
              </MenuItem>

              {/* Email */}
              <div className="text-center text-sm text-cyan-100 mb-4">
                {user.email || "user@example.com"}
              </div>

              {/* Logout */}
              <MenuItem
                onClick={handleLogout}
                sx={{
                  justifyContent: "center",
                  display: "flex",
                  gap: 1,
                  color: "#67e8f9",
                  p: 1,
                  borderRadius: "8px",
                  "&:hover": {
                    backgroundColor: "rgba(103, 232, 249, 0.1)",
                    boxShadow: "0 0 5px #0ff",
                  },
                }}
              >
                <LogoutIcon className="w-5 h-5" />
                <span>Logout</span>
              </MenuItem>
            </div>
          </Menu>

          <button
            className="sm:hidden text-cyan-300"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <CloseIcon className="w-8 h-8 transition-transform duration-200 hover:scale-125" />
            ) : (
              <MenuIcon className="w-8 h-8 transition-transform duration-200 hover:scale-125" />
            )}
          </button>
        </div>
      </motion.header>

      <div className="flex">
        <motion.aside
          className="hidden sm:block bg-black/20 backdrop-blur-md p-4 h-[calc(100vh-64px)] sticky top-16"
          variants={desktopSidebarVariants}
          initial="expanded"
          animate={isSidebarCollapsed ? "collapsed" : "expanded"}
        >
          <button
            className="flex items-center justify-center w-full p-2 mb-4 text-cyan-300 hover:bg-cyan-500/20 rounded-md hover:shadow-[0_0_5px_#0ff] transition-all duration-200"
            onClick={toggleSidebar}
          >
            {isSidebarCollapsed ? (
              <ChevronRightIcon className="w-6 h-6 transition-transform duration-200 hover:scale-125" />
            ) : (
              <ChevronLeftIcon className="w-6 h-6 transition-transform duration-200 hover:scale-125" />
            )}
          </button>
          {sidebarItems.map((item, index) => (
            <motion.div
              key={item.name}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              custom={index}
              className="group"
            >
              <Link
                to={item.path}
                className={`flex items-center p-2 mb-2 text-cyan-300 hover:bg-cyan-500/20 rounded-md hover:shadow-[0_0_5px_#0ff] transition-all duration-200 ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                }`}
                onClick={handleSidebarItemClick}
              >
                <item.icon className="w-6 h-6 text-cyan-300 transition-transform duration-200 group-hover:scale-125" />
                <span
                  className={`text-lg font-medium transition-opacity duration-200 ${
                    isSidebarCollapsed
                      ? "opacity-0 w-0 overflow-hidden"
                      : "opacity-100"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.aside>

        <motion.aside
          className={`fixed top-16 left-0 w-full h-[calc(100vh-64px)] bg-black/90 backdrop-blur-md p-6 z-10 sm:hidden ${
            isSidebarOpen ? "block" : "hidden"
          }`}
          variants={sidebarVariants}
          initial="closed"
          animate={isSidebarOpen ? "open" : "closed"}
        >
          {sidebarItems.map((item, index) => (
            <motion.div
              key={item.name}
              variants={itemVariants}
              initial="hidden"
              animate={isSidebarOpen ? "visible" : "hidden"}
              custom={index}
              className="group"
            >
              <Link
                to={item.path}
                className="flex items-center gap-3 p-3 mb-2 text-cyan-300 hover:bg-cyan-500/20 rounded-md hover:shadow-[0_0_5px_#0ff] transition-all duration-200"
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-6 h-6 text-cyan-300 transition-transform duration-200 group-hover:scale-125" />
                <span className="text-lg font-medium">{item.name}</span>
              </Link>
            </motion.div>
          ))}
        </motion.aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Dashboard;
