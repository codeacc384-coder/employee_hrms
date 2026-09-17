import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show / Hide password
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /* ============================================
         STEP 1: SUPABASE AUTHENTICATION
      ============================================ */

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

      /* ============================================
         AUTHENTICATION FAILED
      ============================================ */

      if (authError) {
        console.error("Supabase Auth Error:", authError);

        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      const user = authData.user;

      if (!user) {
        setError("Unable to identify the logged-in user.");
        setLoading(false);
        return;
      }

      console.log("Authenticated User:", user);

      /* ============================================
         STEP 2: GET PROFILE

         profiles.id should match auth.users.id
      ============================================ */

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

      /* ============================================
         PROFILE QUERY ERROR
      ============================================ */

      if (profileError) {
        console.error(
          "Profile Query Error:",
          profileError
        );

        await supabase.auth.signOut();

        setError(
          "Unable to verify your employee profile."
        );

        setLoading(false);
        return;
      }

      /* ============================================
         PROFILE NOT FOUND
      ============================================ */

      if (!profile) {
        console.error(
          "No profile found for user:",
          user.id
        );

        await supabase.auth.signOut();

        setError(
          "Your employee profile was not found."
        );

        setLoading(false);
        return;
      }

      console.log("Profile:", profile);

      /* ============================================
         STEP 3: CHECK ROLE
      ============================================ */

      const role = String(profile.role || "")
        .trim()
        .toLowerCase();

      console.log("Profile Role:", role);

      /* ============================================
         ONLY EMPLOYEE CAN ENTER THIS PORTAL
      ============================================ */

      if (role !== "employee") {
        console.log(
          "Access denied. User role:",
          profile.role
        );

        await supabase.auth.signOut();

        setError(
          "Access denied. This portal is only for employees."
        );

        setLoading(false);
        return;
      }

      /* ============================================
         STEP 4: EMPLOYEE LOGIN SUCCESS
      ============================================ */

      console.log(
        "Employee authentication successful."
      );

      /* ============================================
         SAVE EMPLOYEE INFORMATION
      ============================================ */

      sessionStorage.setItem(
        "employee",
        JSON.stringify(profile)
      );

      sessionStorage.setItem(
        "employeeId",
        profile.employee_id || ""
      );

      sessionStorage.setItem(
        "employeeEmail",
        user.email || ""
      );

      sessionStorage.setItem(
        "employeeRole",
        profile.role || ""
      );

      /* ============================================
         STEP 5: GO TO DASHBOARD
      ============================================ */

      navigate("/dashboard");

    } catch (err) {
      console.error("Login Error:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================
     EYE ICON
  ============================================ */

  const EyeIcon = () => (
    <svg
      onClick={() => setShowPassword(!showPassword)}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        cursor: "pointer",
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 2,
      }}
      aria-label={
        showPassword
          ? "Hide password"
          : "Show password"
      }
    >
      {showPassword ? (
        <>
          {/* Eye with slash */}
          <path d="M3 3l18 18" />

          <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />

          <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-3.17 4.19" />

          <path d="M6.61 6.61C3.89 8.44 1 12 1 12s4 8 11 8a10.94 10.94 0 0 0 4.24-.88" />
        </>
      ) : (
        <>
          {/* Normal eye */}
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

          <circle
            cx="12"
            cy="12"
            r="3"
          />
        </>
      )}
    </svg>
  );

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          E
        </div>

        <h1>Employee Portal</h1>

        <p className="login-subtitle">
          Sign in to access your employee account
        </p>

        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <div className="form-group">

            <label>
              Company Email ID
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

          </div>


          {/* PASSWORD */}

          <div className="form-group">

            <label>
              Password
            </label>

            <div
              style={{
                position: "relative",
                width: "100%",
              }}
            >

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                style={{
                  width: "100%",
                  paddingRight: "45px",
                  boxSizing: "border-box",
                }}
              />

              <EyeIcon />

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}


          {/* OPTIONS */}

          <div className="login-options">

            <label className="remember">

              <input type="checkbox" />

              Remember me

            </label>

            <button
              type="button"
              className="forgot-btn"
              onClick={() =>
                alert(
                  "Please contact HR/Admin to reset your password."
                )
              }
            >
              Forgot Password?
            </button>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "Checking..."
              : "Login"}
          </button>

        </form>


        <p className="login-footer">
          Employee Management Portal
        </p>

      </div>

    </div>
  );
}

export default Login;