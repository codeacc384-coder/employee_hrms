
import { useEffect, useState } from "react";
import "./Attendance.css";

import { useAttendance } from "../context/AttendanceContext";

function Attendance() {
  const [activeTab, setActiveTab] = useState("Today");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();

    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  /* =========================
     AUTOMATIC DATE UPDATE
  ========================= */

  useEffect(() => {
    const updateDate = () => {
      const today = new Date();

      setCurrentMonth(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );
    };

    updateDate();

    const timer = setInterval(updateDate, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const {
    checkInTime,
    checkOutTime,

    location,
    checkoutLocation,

    isCheckedIn,
    workingSeconds,

    checkIn,
    checkOut,

    confirmCheckIn,
    cancelCheckIn,
    checkInPreview,

    confirmCheckOut,
    cancelCheckOut,
    checkOutPreview,

    locationLoading,

    isOnBreak,
    breakSeconds,

    startBreak,
    endBreak,

    formatTime,
    formatBreakTime,

    attendanceHistory,
  } = useAttendance();

  /* =========================
     FORMAT CLOCK
  ========================= */

  const formatClockTime = (time) => {
    if (!time) {
      return "--";
    }

    return new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================
     FORMAT DATE
  ========================= */

  const formatDate = (date) => {
    if (!date) {
      return "--";
    }

    return new Date(
      date + "T00:00:00"
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================
     TODAY DISPLAY DATE
  ========================= */

  const todayDisplayDate =
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });

  /* =========================
     COMBINE HISTORY
  ========================= */

  const historyData = attendanceHistory || [];

  /* =========================
     TODAY'S COMPLETED RECORD
  ========================= */

  const todayString =
    new Date().toLocaleDateString("en-CA");

  const todayCompletedRecord = historyData.find(
    (record) =>
      record.date === todayString &&
      record.checkInTime &&
      record.checkOutTime
  );

  const displayedCheckOutTime =
    checkOutTime ||
    todayCompletedRecord?.checkOutTime ||
    null;

  /* =========================
     CALENDAR
  ========================= */

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const monthName =
    currentMonth.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });

  /* =========================
     PRESENT THIS MONTH
  ========================= */

  const presentThisMonth = historyData.filter(
    (record) => {
      if (!record.date) {
        return false;
      }

      const recordDate = new Date(
        record.date + "T00:00:00"
      );

      return (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month &&
        (
          record.status === "Present" ||
          record.status === "Late"
        )
      );
    }
  ).length;

  /* =========================
     FESTIVALS
  ========================= */

  const festivals = {
    "2026-09-14": "Ganesh Chaturthi",
    "2026-09-27": "Dussehra Holiday",
    "2026-10-02": "Gandhi Jayanti",
    "2026-10-20": "Diwali",
  };

  /* =========================
     CALENDAR DATE TYPE
  ========================= */

  const getDateType = (day) => {
    /*
     * IMPORTANT:
     * The previous code had a missing "}" here.
     */

    const dateString =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const date = new Date(
      year,
      month,
      day
    );

    const dayOfWeek = date.getDay();

    /* Festival */

    if (festivals[dateString]) {
      return "festival";
    }

    /* Weekend */

    if (
      dayOfWeek === 0 ||
      dayOfWeek === 6
    ) {
      return "weekend";
    }

    /* Working day */

    return "working-day";
  };

  /* =========================
     PREVIOUS MONTH
  ========================= */

  const previousMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  /* =========================
     NEXT MONTH
  ========================= */

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="attendance-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="attendance-header">

        <div>

          <div className="breadcrumb">
            EMPLOYEE / MY WORKSPACE
          </div>

          <h1>
            Attendance
          </h1>

          <p>
            Check-ins, check-outs, breaks and attendance history
          </p>

        </div>

        <div className="today-date">

          <span>
            Today
          </span>

          <strong>
            {todayDisplayDate}
          </strong>

        </div>

      </div>

      {/* =========================
          SUMMARY CARDS
      ========================= */}

      <div className="attendance-summary-grid">

        {/* PRESENT */}

        <div className="summary-card">

          <p>
            Present This Month
          </p>

          <h2>
            {presentThisMonth}
          </h2>

          <span>
            {currentMonth.toLocaleString(
              "en-IN",
              {
                month: "long",
                year: "numeric",
              }
            )}
          </span>

        </div>

        {/* STATUS */}

        <div className="summary-card">

          <p>
            Today Status
          </p>

          <h2>

            {isOnBreak
              ? "On Break"
              : isCheckedIn
              ? "Checked In"
              : displayedCheckOutTime
              ? "Checked Out"
              : "Not Checked In"}

          </h2>

          <span>

            {isOnBreak
              ? "Break in progress"
              : checkInTime
              ? "In at " +
                formatClockTime(checkInTime)
              : "No check in yet"}

          </span>

        </div>

        {/* WORKING */}

        <div className="summary-card">

          <p>
            Working Hours
          </p>

          <h2>
            {formatTime(workingSeconds)}
          </h2>

          <span>

            {isOnBreak
              ? "Working time paused"
              : "Working time today"}

          </span>

        </div>

        {/* BREAK */}

        <div className="summary-card">

          <p>
            Break Today
          </p>

          <h2>
            {formatBreakTime(breakSeconds)}
          </h2>

          <span>

            {isOnBreak
              ? "Break in progress"
              : "Total break time"}

          </span>

        </div>

      </div>

      {/* =========================
          TABS
      ========================= */}

      <div className="tabs">

        {[
          "Today",
          "History",
          "Calendar",
          "Corrections",
        ].map((tab) => (

          <button
            key={tab}
            className={
              activeTab === tab
                ? "active-tab"
                : ""
            }
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>

        ))}

      </div>

      {/* =========================
          TODAY
      ========================= */}

      {activeTab === "Today" && (

        <div className="today-attendance-section">

          <h3>
            ◷ Today
          </h3>

          <div className="attendance-grid">

            {/* CHECK IN */}

            <div className="attendance-record">

              <h4>
                ↪ Check In
              </h4>

              <h2>
                {formatClockTime(checkInTime)}
              </h2>

              {isCheckedIn ? (

                <span className="live-badge">
                  ● Live
                </span>

              ) : (

                <button
                  className="checkin-button"
                  onClick={checkIn}
                  disabled={locationLoading}
                >
                  {locationLoading
                    ? "Detecting..."
                    : "Check In"}
                </button>

              )}

            </div>

            {/* BREAK */}

            <div className="attendance-record">

              <h4>
                ☕ Break
              </h4>

              <h2>
                {formatBreakTime(breakSeconds)}
              </h2>

              <p>
                {isOnBreak
                  ? "Break in progress"
                  : "Total break time"}
              </p>

              {isOnBreak ? (

                <button
                  className="break-button"
                  onClick={endBreak}
                >
                  End Break
                </button>

              ) : (

                <button
                  className="break-button"
                  disabled={!isCheckedIn}
                  onClick={startBreak}
                >
                  Start Break
                </button>

              )}

            </div>

            {/* WORKING */}

            <div className="attendance-record">

              <h4>
                ◷ Working Hours
              </h4>

              <h2>
                {formatTime(workingSeconds)}
              </h2>

              <p>
                {isOnBreak
                  ? "Working time paused"
                  : "Working time today"}
              </p>

              {isOnBreak ? (

                <span className="live-badge">
                  ● Break
                </span>

              ) : isCheckedIn ? (

                <span className="live-badge">
                  ● Live
                </span>

              ) : null}

            </div>

            {/* CHECK OUT */}

            <div className="attendance-record">

              <h4>
                ↪ Check Out
              </h4>

              <h2>
                {formatClockTime(
                  displayedCheckOutTime
                )}
              </h2>

              <p>
                {displayedCheckOutTime
                  ? "Checked out"
                  : "Not checked out"}
              </p>

              <button
                className="checkout-button"
                disabled={
                  !isCheckedIn ||
                  locationLoading
                }
                onClick={checkOut}
              >
                {locationLoading
                  ? "Detecting..."
                  : displayedCheckOutTime
                  ? "Checked Out"
                  : "Check Out"}
              </button>

            </div>

          </div>

          {/* LOCATION */}

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

          {/* CHECKOUT LOCATION */}

          {checkoutLocation && (

            <div className="location-box checkout-location-box">

              <div>

                <strong>
                  Checkout Location
                </strong>

                <p>
                  {checkoutLocation}
                </p>

              </div>

              <span className="location-detected">
                ● Checkout location saved
              </span>

            </div>

          )}

        </div>

      )}

      {/* =========================
          HISTORY
      ========================= */}

      {activeTab === "History" && (

        <div className="history-section">

          <div className="history-heading">

            <div>

              <h2>
                Attendance History
              </h2>

              <p>
                Your previous attendance records
              </p>

            </div>

          </div>

          <div className="history-table-wrapper">

            <table className="attendance-history-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Check In
                  </th>

                  <th>
                    Check In Location
                  </th>

                  <th>
                    Working Hours
                  </th>

                  <th>
                    Break Time
                  </th>

                  <th>
                    Check Out Location
                  </th>

                  <th>
                    Check Out
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {historyData.map((record) => (

                  <tr key={record.id}>

                    <td>
                      {formatDate(record.date)}
                    </td>

                    <td>
                      {formatClockTime(
                        record.checkInTime
                      )}
                    </td>

                    <td className="location-cell">
                      {record.checkInLocation || "--"}
                    </td>

                    <td>
                      {formatTime(
                        record.workingSeconds
                      )}
                    </td>

                    <td>
                      {formatBreakTime(
                        record.breakSeconds
                      )}
                    </td>

                    <td className="location-cell">
                      {record.checkOutLocation || "--"}
                    </td>

                    <td>
                      {formatClockTime(
                        record.checkOutTime
                      )}
                    </td>

                    <td>

                      <span
                        className={
                          record.status === "Late"
                            ? "status-late"
                            : "status-present"
                        }
                      >
                        {record.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* =========================
          CALENDAR
      ========================= */}

      {activeTab === "Calendar" && (

        <div className="calendar-section">

          {/* CALENDAR HEADER */}

          <div className="calendar-header">

            <button
              onClick={previousMonth}
              className="calendar-nav"
            >
              ‹
            </button>

            <h2>
              {monthName}
            </h2>

            <button
              onClick={nextMonth}
              className="calendar-nav"
            >
              ›
            </button>

          </div>

          {/* LEGEND */}

          <div className="calendar-legend">

            <div>

              <span className="legend-box working-color"></span>

              Working Day

            </div>

            <div>

              <span className="legend-box weekend-color"></span>

              Weekend

            </div>

            <div>

              <span className="legend-box festival-color"></span>

              Festival

            </div>

          </div>

          {/* CALENDAR GRID */}

          <div className="calendar-grid">

            {/* DAY NAMES */}

            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (

              <div
                key={day}
                className="calendar-day-name"
              >
                {day}
              </div>

            ))}

            {/* EMPTY CELLS */}

            {Array.from({
              length: firstDay,
            }).map((_, index) => (

              <div
                key={`empty-${index}`}
                className="calendar-empty"
              ></div>

            ))}

            {/* DATES */}

            {Array.from({
              length: daysInMonth,
            }).map((_, index) => {

              const day = index + 1;

              const dateType =
                getDateType(day);

              const dateString =
                `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const today = new Date();

              const todayString =
                today.toLocaleDateString(
                  "en-CA"
                );

              const isToday =
                dateString === todayString;

              return (

                <div
                  key={day}
                  className={
                    `calendar-date ${dateType}` +
                    (
                      isToday
                        ? " calendar-today"
                        : ""
                    )
                  }
                  title={
                    festivals[dateString] || ""
                  }
                >

                  <span className="date-number">
                    {day}
                  </span>

                  {festivals[dateString] && (

                    <span className="festival-name">
                      {festivals[dateString]}
                    </span>

                  )}

                </div>

              );

            })}

          </div>

        </div>

      )}

      {/* =========================
          CORRECTIONS
      ========================= */}

      {activeTab === "Corrections" && (

        <div className="today-attendance-section">

          <h3>
            My Correction Requests
          </h3>

          <p>
            No correction requests yet.
          </p>

          <button>
            + Request Correction
          </button>

        </div>

      )}

      {/* =====================================================
          CHECK-IN CONFIRMATION
      ===================================================== */}

      {checkInPreview && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >

          <div
            style={{
              width: "min(420px, 90%)",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Confirm Check In
            </h3>

            <p>
              Your current location has been detected.
            </p>

            <div
              style={{
                padding: "12px",
                background: "#f5f7fa",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {checkInPreview.locationText}
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >

              <button
                type="button"
                onClick={cancelCheckIn}
                style={{
                  padding: "10px 18px",
                  border: "1px solid #ddd",
                  borderRadius: "7px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmCheckIn}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Confirm Check In
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          CHECK-OUT CONFIRMATION
      ===================================================== */}

      {checkOutPreview && (

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >

          <div
            style={{
              width: "min(420px, 90%)",
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              boxShadow:
                "0 20px 50px rgba(0,0,0,0.2)",
            }}
          >

            <h3
              style={{
                marginTop: 0,
                marginBottom: "10px",
              }}
            >
              Confirm Check Out
            </h3>

            <p>
              Your current location has been detected.
            </p>

            <div
              style={{
                padding: "12px",
                background: "#f5f7fa",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >

              <strong>
                Checkout Location
              </strong>

              <br />

              <span>
                {checkOutPreview.locationText}
              </span>

            </div>

            <p
              style={{
                fontSize: "14px",
                color: "#555",
                marginBottom: "20px",
              }}
            >
              Do you want to confirm your checkout?
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >

              <button
                type="button"
                onClick={cancelCheckOut}
                style={{
                  padding: "10px 18px",
                  border: "1px solid #ddd",
                  borderRadius: "7px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmCheckOut}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: "7px",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Confirm Check Out
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Attendance;