import { useState } from "react";
import "./Announcements.css";

function Announcements() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const announcements = [
    {
      id: 1,
      title: "🎉 Welcome to the Employee Dashboard!",
      description:
        "We are excited to launch the new employee dashboard. You can now easily access important company announcements, updates, and information in one place.",
      date: "August 25, 2026",
      author: "HR Team",
      type: "General",
    },
    {
      id: 2,
      title: "📢 Monthly Team Meeting",
      description:
        "The monthly team meeting will be conducted this Friday. All employees are requested to attend the meeting and be available on time.",
      date: "August 24, 2026",
      author: "Management",
      type: "Meeting",
    },
    {
      id: 3,
      title: "🎯 New Employee Policies",
      description:
        "Please review the latest employee policies and guidelines. If you have any questions regarding the new policies, please contact the HR department.",
      date: "August 22, 2026",
      author: "HR Team",
      type: "Policy",
    },
  ];

  return (
    <div className="announcements-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p>
            Stay updated with the latest company announcements
          </p>
        </div>
      </div>

      {/* ANNOUNCEMENT CARDS */}
      <div className="announcement-container">
        {announcements.map((announcement) => (
          <div
            className="announcement-card"
            key={announcement.id}
            onClick={() => setSelectedAnnouncement(announcement)}
          >
            <div className="announcement-header">
              <div className="announcement-title-section">
                <h2>{announcement.title}</h2>

                <span className="announcement-type">
                  {announcement.type}
                </span>
              </div>
            </div>

            <p className="announcement-description">
              {announcement.description}
            </p>

            <div className="announcement-footer">
              <span>📅 {announcement.date}</span>

              <span>
                👤 Posted by {announcement.author}
              </span>
            </div>

            <div className="view-more">
              Click to view announcement
            </div>
          </div>
        ))}
      </div>

      {/* POPUP / MODAL */}
      {selectedAnnouncement && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="announcement-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="modal-header">
              <div>
                <span className="modal-label">
                  ANNOUNCEMENT
                </span>

                <h2>{selectedAnnouncement.title}</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setSelectedAnnouncement(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <span className="modal-type">
                {selectedAnnouncement.type}
              </span>

              <p className="modal-description">
                {selectedAnnouncement.description}
              </p>

              <div className="modal-information">

                <div className="info-item">
                  <span className="info-label">
                    Posted By
                  </span>

                  <span className="info-value">
                    {selectedAnnouncement.author}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-label">
                    Date
                  </span>

                  <span className="info-value">
                    {selectedAnnouncement.date}
                  </span>
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button
                className="close-modal-button"
                onClick={() => setSelectedAnnouncement(null)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;