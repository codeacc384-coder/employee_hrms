import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import EmployeeLayout from "./pages/EmployeeLayout";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Attendance from "./pages/Attendance";
import PaySlips from "./pages/PaySlips";
import Documents from "./pages/Documents";
import Support from "./pages/Support";
import Performance from "./pages/Performance";
import Notifications from "./pages/Notifications";
import Leave from "./pages/Leave";
import Settings from "./pages/Settings";
import RulesRegulations from "./pages/RulesRegulations";

import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN PAGE
        ========================== */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* =========================
            EMPLOYEE PORTAL
        ========================== */}
        <Route
          path="/"
          element={<EmployeeLayout />}
        >

          {/* ROOT URL → LOGIN */}
          <Route
            index
            element={<Navigate to="/login" replace />}
          />

          {/* DASHBOARD */}
          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          {/* ATTENDANCE */}
          <Route
            path="attendance"
            element={<Attendance />}
          />

          {/* LEAVE */}
          <Route
            path="leave"
            element={<Leave />}
          />

          {/* PAYSLIPS */}
          <Route
            path="payslips"
            element={<PaySlips />}
          />

          {/* DOCUMENTS */}
          <Route
            path="documents"
            element={<Documents />}
          />

          {/* NOTIFICATIONS */}
          <Route
            path="notifications"
            element={<Notifications />}
          />

          {/* SUPPORT */}
          <Route
            path="support"
            element={<Support />}
          />

          {/* PERFORMANCE */}
          <Route
            path="performance"
            element={<Performance />}
          />

          {/* PROFILE */}
          <Route
            path="profile"
            element={<Profile />}
          />

          {/* SETTINGS */}
          <Route
            path="settings"
            element={<Settings />}
          />

          {/* RULES & REGULATIONS */}
          <Route
            path="rules-regulations"
            element={<RulesRegulations />}
          />

        </Route>


        {/* =========================
            UNKNOWN URL → LOGIN
        ========================== */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;