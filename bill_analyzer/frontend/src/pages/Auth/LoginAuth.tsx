/* Created by Metrum AI for Dell */
/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import { ChangeEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setToken, setUser } from "../../actions/UserSlice";
import { useLoginUserMutation, useRegisterUserMutation } from "../../app/api";
import "../../styles/LoginAuth.css";

interface LoginAuthProps {
  onShowNotification: (message: string, type: "failure" | "neutral") => void;
  mode: string;
}

interface Credentials {
  username: string;
  password: string;
}

const LoginAuth: React.FC<LoginAuthProps> = ({ onShowNotification, mode }) => {
  const [credentials, setCredentials] = useState<Credentials>({
    username: "",
    password: "",
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const [registerUser] = useRegisterUserMutation();

  const handleLoginClick = async () => {
    if (credentials.username && credentials.password) {
      try {
        let response;
        if (mode === "login") {
          response = await loginUser(credentials).unwrap();

          const { access_token } = response || {};
          if (access_token) {
            dispatch(setToken(access_token));
            dispatch(setUser({ username: credentials.username }));
            console.log("Login successful, navigating to dashboard...");
            navigate("/dashboard");
          } else {
            console.log("Access token not found in response");
            onShowNotification("Login failed. No access token.", "failure");
          }
        } else {
          // Registration flow
          response = await registerUser(credentials).unwrap();
          console.log("Registration successful, redirecting to login...");
          onShowNotification("Registration successful! Please login.", "neutral");
          navigate("/login");
        }
      } catch (error: any) {
        console.error(`${mode === "login" ? "Login" : "Registration"} failed:`, error);
        const message = error.status === 401
          ? "Invalid username or password"
          : `${mode === "login" ? "Login" : "Registration"} failed. Please try again.`;
        onShowNotification(message, "failure");
      }
    } else {
      console.log("Please enter both username and password");
      onShowNotification(
        "Please enter both username and password",
        "neutral"
      );
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="login-title">Welcome</h1>
        <div className="login-form">
          <motion.div className="input-field">
            <motion.input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Username"
              className="login-input"
            />
          </motion.div>
          <motion.div
            className="input-field"
          >
            <motion.input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Password"
              className="login-input"
            />
          </motion.div>

          <motion.button
            onClick={handleLoginClick}
            className="primary-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loader"></span>
            ) : mode === "login" ? (
              <>Login</>
            ) : (
              <>Sign Up</>
            )}
          </motion.button>

          {mode === "signup" ? (
            <div className="signup-prompt">
              Already have an account?{" "}
              <Link to="/login" className="link">
                Login here
              </Link>
              .
            </div>
          ) : (
            mode === "login" && (
              <div className="signup-prompt">
                Don't have an account?{" "}
                <Link to="/signup" className="link">
                  Sign up now
                </Link>
                .
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginAuth;
