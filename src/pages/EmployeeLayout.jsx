import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./EmployeeLayout.css";

function EmployeeLayout() {

  const navClass = ({ isActive }) =>
    isActive
      ? "employee-nav-link active"
      : "employee-nav-link";

  return (
    <div className="employee-layout">

      {/* SIDEBAR */}
      <aside className="employee-sidebar">

        {/* LOGO / TITLE */}
        <div className="employee-logo">
          Employee Portal
        </div>

        {/* NAVIGATION */}
        <nav className="employee-nav">

          <NavLink
            to="/dashboard"
            className={navClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/attendance"
            className={navClass}
          >
            Attendance
          </NavLink>

          <NavLink
            to="/leave"
            className={navClass}
          >
            Leave
          </NavLink>

          <NavLink
            to="/payslips"
            className={navClass}
          >
            PaySlips
          </NavLink>

          <NavLink
            to="/documents"
            className={navClass}
          >
            Documents
          </NavLink>

          <NavLink
            to="/notifications"
            className={navClass}
          >
            Notifications
          </NavLink>

          <NavLink
            to="/performance"
            className={navClass}
          >
            Performance
          </NavLink>

          <NavLink
            to="/support"
            className={navClass}
          >
            Support
          </NavLink>


          <NavLink
            to="/profile"
            className={navClass}
          >
            Profile
          </NavLink>

          <NavLink
            to="/Rules-Regulations"
            className={navClass}
          >
            Rules & Regulations
          </NavLink>

        </nav>

      </aside>

      {/* PAGE CONTENT */}
      <main className="employee-main">
        <Outlet />
      </main>

    </div>
  );
}

export default EmployeeLayout;