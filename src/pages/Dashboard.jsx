
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "../context/AttendanceContext";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // =====================================================
  // EMPLOYEE NAME
  // =====================================================

  const employeeProfile = JSON.parse(
    sessionStorage.getItem("employee") || "{}"
  );

  const employeeId =
    sessionStorage.getItem("employeeId") ||
    employeeProfile.employee_id ||
    "";

  const [employeeName, setEmployeeName] = useState(
    employeeProfile.full_name ||
      employeeProfile.name ||
      employeeProfile.employee_name ||
      "Employee"
  );

  const [employeeRole, setEmployeeRole] = useState(
    employeeProfile.role || "Employee"
  );

  // =====================================================
  // FETCH CURRENT EMPLOYEE DATA
  // =====================================================

  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        if (!employeeId) {
          console.warn("Employee ID not found in sessionStorage.");
          return;
        }

        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching employee:", error);
          return;
        }

        if (!data) {
          console.warn("No employee found for ID:", employeeId);
          return;
        }

        console.log("Current employee data:", data);

        const name =
          data.full_name ||
          data.name ||
          data.employee_name ||
          `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
          "Employee";

        setEmployeeName(name);

        const role =
          data.role ||
          data.designation ||
          data.job_title ||
          "Employee";

        setEmployeeRole(role);

        sessionStorage.setItem(
          "employee",
          JSON.stringify(data)
        );

        sessionStorage.setItem(
          "employeeId",
          data.id
        );
      } catch (error) {
        console.error(
          "Unexpected error loading employee data:",
          error
        );
      }
    };

    loadEmployeeData();
  }, [employeeId]);

  // =====================================================
  // ATTENDANCE
  // =====================================================

  const {
    checkInTime,
    checkOutTime,
    location,
    isCheckedIn,
    workingSeconds,
    checkIn,
    checkOut,
    formatTime,
    isOnBreak,
    breakSeconds,
    startBreak,
    endBreak,
    formatBreakTime
  } = useAttendance();

  // =====================================================
  // DASHBOARD CHECKOUT HANDLER
  // =====================================================

  const handleDashboardCheckout = () => {
    console.log("Dashboard Checkout button clicked.");

    console.log("Dashboard attendance state:", {
      isCheckedIn,
      checkInTime,
      checkOutTime
    });

    if (!isCheckedIn) {
      alert("Please check in before checking out.");
      return;
    }

    if (!checkOut) {
      console.error(
        "Checkout function is not available from AttendanceContext."
      );

      alert(
        "Checkout is currently unavailable. Please refresh the page and try again."
      );

      return;
    }

    checkOut();
  };

  // =====================================================
  // FORMAT CLOCK TIME
  // =====================================================

  const formatClockTime = (time) => {
    if (!time) {
      return "--";
    }

    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const handleProfile = () => {
    setShowProfileMenu(false);
    navigate("/profile");
  };

  // =====================================================
  // SIGN OUT
  // =====================================================

  const handleSignOut = async () => {
    setShowProfileMenu(false);

    sessionStorage.removeItem("employee");
    sessionStorage.removeItem("employeeId");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
    }

    navigate("/login");
  };

  return (
    <div className="dashboard-page">

      {/* =================================================
          TOP NAVIGATION BAR
      ================================================= */}

      <div className="dashboard-top-bar">

        {/* SEARCH - TOP LEFT */}

        <div className="dashboard-search">

          

          <input
            type="text"
            placeholder="Search employees, docs, policies..."
          />

        </div>


        {/* PROFILE - TOP RIGHT */}

        <div className="dashboard-profile-wrapper">

          <button
            type="button"
            className="dashboard-profile-button"
            onClick={() =>
              setShowProfileMenu(
                previous => !previous
              )
            }
          >

            <div className="dashboard-profile-avatar">
              👤
            </div>

            <div className="dashboard-profile-info">

              <strong>
                {employeeName}
              </strong>

              <span>
                {employeeRole}
              </span>

            </div>

            <span className="profile-arrow">
              {showProfileMenu ? "▲" : "▼"}
            </span>

          </button>

          {showProfileMenu && (

            <div className="dashboard-profile-dropdown">

              <button
                type="button"
                onClick={handleProfile}
              >

                <span className="dropdown-icon">
                  👤
                </span>

                <span>
                  Profile
                </span>

              </button>

              <button
                type="button"
                className="signout-option"
                onClick={handleSignOut}
              >

                <span className="dropdown-icon">
                  ↪
                </span>

                <span>
                  Sign Out
                </span>

              </button>

            </div>

          )}

        </div>

      </div>

      {/* =================================================
          DASHBOARD HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div className="dashboard-greeting">

          <div className="workspace">

            <span>
              Employee
            </span>

            <span>
              MY WORKSPACE
            </span>

          </div>

          <h1>
            Good Afternoon, {employeeName}
          </h1>

          <p>
            Here's what's happening with your work today.
          </p>

        </div>

        {/* =================================================
            RIGHT SIDE - ATTENDANCE BUTTONS
        ================================================= */}

        <div className="header-buttons">

          {isCheckedIn && (

            <button
              type="button"
              className="break-btn"
              onClick={
                isOnBreak
                  ? endBreak
                  : startBreak
              }
            >

              {isOnBreak
                ? "End Break"
                : " Break"
              }

            </button>

          )}

          {!isCheckedIn ? (

            <button
              type="button"
              className="checkin-btn"
              onClick={checkIn}
            >
              ◉ Check In
            </button>

          ) : (

            <button
              type="button"
              className="checkout-btn"
              onClick={handleDashboardCheckout}
            >
              ◉ Check Out
            </button>

          )}

        </div>

      </div>

      {/* =================================================
          DASHBOARD OVERVIEW CARDS
      ================================================= */}

      <div className="dashboard-cards">

        <div className="dashboard-card">

          

          <p>
            TODAY'S HOURS
          </p>

          <h2>
            {formatTime(workingSeconds)}
          </h2>

          <span className="green-text">

            {isCheckedIn
              ? isOnBreak
                ? "On break"
                : "Working now"
              : "Not checked in"}

          </span>

        </div>

        <div className="dashboard-card">

          

          <p>
            LEAVE BALANCE
          </p>

          <h2>
            12 days
          </h2>

          <span className="green-text">
            0 pending requests
          </span>

        </div>

        <div className="dashboard-card">

          

          <p>
            NET SALARY
          </p>

          <h2>
            ₹25,000
          </h2>

          <span className="green-text">
            {employeeRole}
          </span>

        </div>

        <div className="dashboard-card">

          

          <p>
            BREAK TODAY
          </p>

          <h2>
            {formatBreakTime(breakSeconds)}
          </h2>

          <span className="green-text">

            {isOnBreak
              ? "Break in progress"
              : "Total break time"}

          </span>

        </div>

      </div>

      {/* =================================================
          TODAY'S ATTENDANCE
      ================================================= */}

      <div className="attendance-dashboard">

        <div className="attendance-title">

          <div className="title-icon">
            ◷
          </div>

          <div>

            <h2>
              Today's Attendance
            </h2>

            <p>
              Check-ins, breaks, working hours and check-out
            </p>

          </div>

        </div>

        {/* =================================================
            ATTENDANCE CARDS
        ================================================= */}

        <div className="attendance-dashboard-grid">

          {/* CHECK IN */}

          <div className="attendance-dashboard-card">

            <div className="circle green-circle">
              →
            </div>

            <h3>
              Check In
            </h3>

            <h2>
              {formatClockTime(checkInTime)}
            </h2>

            {isCheckedIn ? (

              <span className="live-badge">
                ● Live
              </span>

            ) : (

              <button
                type="button"
                className="small-checkin"
                onClick={checkIn}
              >
                Check In
              </button>

            )}

          </div>

          {/* BREAK */}

          <div className="attendance-dashboard-card">

            <div className="circle orange-circle">
              ☕
            </div>

            <h3>
              Break
            </h3>

            <h2>
              {formatBreakTime(breakSeconds)}
            </h2>

            {isOnBreak ? (

              <button
                type="button"
                className="break-small"
                onClick={endBreak}
              >
                End Break
              </button>

            ) : (

              <button
                type="button"
                className="break-small"
                disabled={!isCheckedIn}
                onClick={startBreak}
              >
                Start Break
              </button>

            )}

          </div>

          {/* WORKING HOURS */}

          <div className="attendance-dashboard-card">

            <div className="circle blue-circle">
              ◷
            </div>

            <h3>
              Working Hours
            </h3>

            <h2>
              {formatTime(workingSeconds)}
            </h2>

            <span className="working-text">

              {isCheckedIn
                ? isOnBreak
                  ? "On break"
                  : "Working now"
                : "Not started"}

            </span>

          </div>

          {/* CHECK OUT */}

          <div className="attendance-dashboard-card">

            <div className="circle gray-circle">
              ○
            </div>

            <h3>
              Check Out
            </h3>

            <h2>
              {formatClockTime(checkOutTime)}
            </h2>

            {checkOutTime ? (

              <span className="working-text">
                Checked out
              </span>

            ) : (

              <button
                type="button"
                className="checkout-small"
                disabled={!isCheckedIn}
                onClick={handleDashboardCheckout}
              >
                Check Out
              </button>

            )}

          </div>

        </div>

        {/* =================================================
            CURRENT LOCATION
        ================================================= */}

        <div className="location-box">

          <div>

            <strong>
              Current Location
            </strong>

            <p>
              {location
                ? location
                : "Location not detected"}
            </p>

          </div>

          {location && (

            <span className="location-detected">
              ● Location detected
            </span>

          )}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;