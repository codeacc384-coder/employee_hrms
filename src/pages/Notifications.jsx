
import React, { useState } from "react";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Leave Request Approved",
      message:
        "Your leave request for September 5, 2026 has been approved by HR.",
      from: "HR Department",
      date: "Sep 1, 2026",
      type: "Leave",
      unread: true,
    },
    {
      id: 2,
      title: "August Payslip Available",
      message:
        "Your salary slip for August 2026 is now available in the Payslips section.",
      from: "Payroll Department",
      date: "Sep 1, 2026",
      type: "Payroll",
      unread: true,
    },
    {
      id: 3,
      title: "Attendance Reminder",
      message:
        "Please remember to check in and check out using the Employee Portal every working day.",
      from: "HR Department",
      date: "Aug 31, 2026",
      type: "Attendance",
      unread: false,
    },
    {
      id: 4,
      title: "Company Holiday Announcement",
      message:
        "The office will remain closed on September 7, 2026 due to the company holiday.",
      from: "Admin",
      date: "Aug 30, 2026",
      type: "Announcement",
      unread: false,
    },
    {
      id: 5,
      title: "Document Update Required",
      message:
        "Please update your employee documents and make sure all required documents are uploaded.",
      from: "HR Department",
      date: "Aug 29, 2026",
      type: "Documents",
      unread: true,
    },
    {
      id: 6,
      title: "Mandatory Training",
      message:
        "Mandatory workplace safety training is scheduled for September 10, 2026.",
      from: "HR Department",
      date: "Aug 28, 2026",
      type: "Training",
      unread: true,
    },
    {
      id: 7,
      title: "Performance Review Reminder",
      message:
        "Your quarterly performance review is due by September 15, 2026. Please complete your self-assessment.",
      from: "HR Manager",
      date: "Aug 27, 2026",
      type: "Performance",
      unread: false,
    },
    {
      id: 8,
      title: "Profile Update Request",
      message:
        "Please verify your contact information and emergency contact details in your employee profile.",
      from: "HR Department",
      date: "Aug 26, 2026",
      type: "Profile",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const markAsRead = (id) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "Leave":
        return "✓";
      case "Payroll":
        return "₹";
      case "Attendance":
        return "◷";
      case "Announcement":
        return "📢";
      case "Documents":
        return "▣";
      case "Training":
        return "🎓";
      case "Performance":
        return "★";
      case "Profile":
        return "●";
      default:
        return "!";
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>
            Stay updated with the latest messages and announcements from HR
            and Admin.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="mark-all-btn"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="notification-summary">
        <div className="summary-card">
          <span className="summary-number">{notifications.length}</span>
          <span className="summary-label">Total Notifications</span>
        </div>

        <div className="summary-card">
          <span className="summary-number">{unreadCount}</span>
          <span className="summary-label">Unread</span>
        </div>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-card ${
              notification.unread ? "unread" : ""
            }`}
          >
            <div className="notification-icon">
              {getIcon(notification.type)}
            </div>

            <div className="notification-content">
              <div className="notification-top">
                <div>
                  <h3>{notification.title}</h3>
                  <span className="notification-type">
                    {notification.type}
                  </span>
                </div>

                {notification.unread && (
                  <span className="unread-dot"></span>
                )}
              </div>

              <p>{notification.message}</p>

              <div className="notification-footer">
                <span>
                  From: <strong>{notification.from}</strong>
                </span>

                <span>{notification.date}</span>

                {notification.unread && (
                  <button
                    className="read-btn"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;