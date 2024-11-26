/* Created by Metrum AI for Dell */
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { RedirectBasedOnAuth } from "./components/Auth/RedirectBasedOnAuth";
import Header from "./components/Header/Header";
import LoginAuth from "./pages/Auth/LoginAuth";
import Notification from "./components/Notification";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "./pages/Dashboard/Dashboard";
import { useState } from "react";

interface NotificationState {
  message: string;
  type: 'success' | 'failure' | 'neutral' | '';
}

function App() {
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "" });

  const handleShowNotification = (message: string, type: 'success' | 'failure' | 'neutral') => {
    setNotification({ message, type });
  };

  const handleCloseNotification = () => {
    setNotification({ message: "", type: "" });
  };

  return (
    <Router>
      <div className="app-container">
        <div className="main-content">
          <Routes>
            <Route path="/" element={<RedirectBasedOnAuth />} />
            <Route
              path="/login"
              element={
                <LoginAuth
                  onShowNotification={handleShowNotification}
                  mode="login"
                />
              }
            />
            <Route
              path="/signup"
              element={
                <LoginAuth
                  onShowNotification={handleShowNotification}
                  mode="signup"
                />
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>

          <AnimatePresence>
          {notification.message && notification.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Notification
                message={notification.message}
                type={notification.type as 'success' | 'failure' | 'neutral'}
                onClose={handleCloseNotification}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </Router>
  );
}

export default App;
