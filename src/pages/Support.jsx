import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Support.css";

function Support() {
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const [complaints, setComplaints] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     EMPLOYEE INFORMATION
  ===================================================== */

  const employeeProfile = JSON.parse(
    sessionStorage.getItem("employee") || "{}"
  );

  const employeeId =
    sessionStorage.getItem("employeeId") ||
    employeeProfile.employee_id ||
    "";

  const employeeName =
    employeeProfile.full_name ||
    employeeProfile.name ||
    employeeProfile.employee_name ||
    "Employee";

  const employeeEmail =
    employeeProfile.work_email ||
    employeeProfile.personal_email ||
    employeeProfile.email ||
    "";

  /* =====================================================
     TODAY
  ===================================================== */

  const getToday = () => {
    return new Date().toISOString().split("T")[0];
  };

  /* =====================================================
     COMPLAINT DATA
  ===================================================== */

  const [complaintData, setComplaintData] = useState({
    employee: employeeName,
    location: "Hyderabad Office",
    category: "Hardware",
    priority: "High",
    date: getToday(),
    description: "",
  });

  /* =====================================================
     TICKET DATA
  ===================================================== */

  const [ticketData, setTicketData] = useState({
    employee: employeeName,
    location: "",
    category: "",
    priority: "",
    date: getToday(),
    subject: "",
    description: "",
  });

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    fetchComplaints();
    fetchTickets();
  }, []);

  /* =====================================================
     LOAD COMPLAINTS
  ===================================================== */

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      setError("");

      if (!employeeId) {
        setError("Employee information was not found.");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Complaints Query Error:", fetchError);
        setError("Unable to load your complaints.");
        return;
      }

      setComplaints(data || []);
    } catch (err) {
      console.error("Fetch Complaints Error:", err);
      setError("Unable to load your complaints.");
    } finally {
      setLoadingComplaints(false);
    }
  };

  /* =====================================================
     LOAD TICKETS
  ===================================================== */

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const requesterEmail =
        employeeEmail ||
        user?.email ||
        "";

      if (!requesterEmail) {
        console.warn("Requester email not found.");
        setTickets([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("requester_email", requesterEmail)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Tickets Query Error:", fetchError);
        return;
      }

      console.log("Tickets loaded:", data);

      setTickets(data || []);
    } catch (err) {
      console.error("Fetch Tickets Error:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  /* =====================================================
     COMPLAINT INPUT
  ===================================================== */

  const handleComplaintChange = (e) => {
    const { name, value } = e.target;

    setComplaintData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     TICKET INPUT
  ===================================================== */

  const handleTicketChange = (e) => {
    const { name, value } = e.target;

    setTicketData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     OPEN COMPLAINT MODAL
  ===================================================== */

  const openComplaintModal = () => {
    setComplaintData({
      employee: employeeName,
      location: "Hyderabad Office",
      category: "Hardware",
      priority: "High",
      date: getToday(),
      description: "",
    });

    setError("");
    setShowComplaintModal(true);
  };

  /* =====================================================
     CLOSE COMPLAINT MODAL
  ===================================================== */

  const closeComplaintModal = () => {
    setShowComplaintModal(false);
  };

  /* =====================================================
     OPEN TICKET MODAL
  ===================================================== */

  const openTicketModal = () => {
    setTicketData({
      employee: employeeName,
      location: "",
      category: "",
      priority: "",
      date: getToday(),
      subject: "",
      description: "",
    });

    setError("");
    setShowTicketModal(true);
  };

  /* =====================================================
     CLOSE TICKET MODAL
  ===================================================== */

  const closeTicketModal = () => {
    setShowTicketModal(false);
  };

  /* =====================================================
     GENERATE COMPLAINT CODE
  ===================================================== */

  const generateComplaintCode = () => {
    const randomNumber = Math.floor(
      100000 + Math.random() * 900000
    );

    return `CMP-${randomNumber}`;
  };

  /* =====================================================
     GENERATE TICKET NUMBER
  ===================================================== */

  const generateTicketNumber = () => {
    const randomNumber = Math.floor(
      10000 + Math.random() * 90000
    );

    return `TKT-${randomNumber}`;
  };

  /* =====================================================
     SUBMIT COMPLAINT
  ===================================================== */

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!employeeId) {
      setError(
        "Employee information is missing. Please login again."
      );
      return;
    }

    if (
      !complaintData.category ||
      !complaintData.priority ||
      !complaintData.date ||
      !complaintData.description.trim()
    ) {
      alert("Please fill all the complaint fields.");
      return;
    }

    try {
      setSubmittingComplaint(true);

      const complaintCode = generateComplaintCode();

      const { data, error: insertError } = await supabase
        .from("complaints")
        .insert([
          {
            complaint_code: complaintCode,
            employee_id: employeeId,
            subject: `${complaintData.category} Complaint`,
            category: complaintData.category,
            priority: complaintData.priority,
            description: complaintData.description.trim(),
            status: "Open",
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error(
          "========== COMPLAINT INSERT ERROR =========="
        );
        console.error("Message:", insertError.message);
        console.error("Details:", insertError.details);
        console.error("Hint:", insertError.hint);
        console.error("Code:", insertError.code);
        console.error("Full Error:", insertError);
        console.error(
          "============================================="
        );

        setError(insertError.message);

        alert(
          `Complaint submission failed:\n\n${insertError.message}`
        );

        return;
      }

      console.log("Complaint submitted:", data);

      setComplaints((prev) => [
        data,
        ...prev,
      ]);

      setShowComplaintModal(false);

      setComplaintData({
        employee: employeeName,
        location: "Hyderabad Office",
        category: "Hardware",
        priority: "High",
        date: getToday(),
        description: "",
      });

      alert(
        `Complaint submitted successfully.\nComplaint ID: ${complaintCode}`
      );
    } catch (err) {
      console.error(
        "Submit Complaint Error:",
        err
      );

      setError(
        "Something went wrong while submitting the complaint."
      );
    } finally {
      setSubmittingComplaint(false);
    }
  };

  /* =====================================================
     SUBMIT TICKET TO SUPABASE
  ===================================================== */

  const handleTicketSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (
      !ticketData.employee.trim() ||
      !ticketData.location.trim() ||
      !ticketData.category ||
      !ticketData.priority ||
      !ticketData.date ||
      !ticketData.subject.trim() ||
      !ticketData.description.trim()
    ) {
      alert("Please fill all the ticket fields.");
      return;
    }

    try {
      setSubmittingTicket(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const requesterEmail =
        employeeEmail ||
        user?.email ||
        "";

      if (!requesterEmail) {
        alert(
          "Employee email was not found. Please login again."
        );
        return;
      }

      const ticketNumber =
        generateTicketNumber();

      const now =
        new Date().toISOString();

      const ticketPayload = {
        id: crypto.randomUUID(),
  ticket_number: ticketNumber,

  company_id:
    employeeProfile.company_id || null,

  company_name:
    employeeProfile.company_name || null,

  requester_name:
    ticketData.employee.trim(),

  requester_email:
    requesterEmail,

  subject:
    ticketData.subject.trim(),

  description:
    ticketData.description.trim(),

  priority:
    ticketData.priority,

  status:
    "Open",

  assigned_to:
    null,

  created_date:
    now,

  updated_date:
    now,

  category:
    ticketData.category,

  created_at:
    now,
};
      console.log(
        "======================================"
      );
      console.log(
        "Ticket being submitted:"
      );
      console.log(
        ticketPayload
      );
      console.log(
        "======================================"
      );

      const {
        data,
        error: insertError,
      } = await supabase
        .from("support_tickets")
        .insert([ticketPayload])
        .select()
        .single();

      /* =====================================================
         DETAILED SUPABASE ERROR
      ===================================================== */

      if (insertError) {
        console.error(
          "========== TICKET INSERT ERROR =========="
        );

        console.error(
          "Message:",
          insertError.message
        );

        console.error(
          "Details:",
          insertError.details
        );

        console.error(
          "Hint:",
          insertError.hint
        );

        console.error(
          "Code:",
          insertError.code
        );

        console.error(
          "Full Error:",
          insertError
        );

        console.error(
          "Ticket Payload:",
          ticketPayload
        );

        console.error(
          "=========================================="
        );

        setError(
          insertError.message ||
          "Unable to submit ticket."
        );

        alert(
          `Ticket submission failed:\n\n${insertError.message}\n\nError Code: ${insertError.code || "N/A"}`
        );

        return;
      }

      console.log(
        "Ticket submitted successfully:",
        data
      );

      /* =====================================================
         ADD NEW TICKET IMMEDIATELY
      ===================================================== */

      setTickets((prev) => [
        data,
        ...prev,
      ]);

      setShowTicketModal(false);

      setTicketData({
        employee: employeeName,
        location: "",
        category: "",
        priority: "",
        date: getToday(),
        subject: "",
        description: "",
      });

      alert(
        `Ticket submitted successfully.\nTicket No: ${ticketNumber}`
      );

    } catch (err) {
      console.error(
        "Submit Ticket Error:",
        err
      );

      console.error(
        "Error Message:",
        err?.message
      );

      console.error(
        "Error Stack:",
        err?.stack
      );

      setError(
        err?.message ||
        "Something went wrong while submitting the ticket."
      );

      alert(
        `Something went wrong while submitting the ticket.\n\n${err?.message || err}`
      );

    } finally {
      setSubmittingTicket(false);
    }
  };

  /* =====================================================
     DELETE COMPLAINT
  ===================================================== */

  const deleteComplaint = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this complaint?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const { error: deleteError } =
        await supabase
          .from("complaints")
          .delete()
          .eq("id", id)
          .eq("employee_id", employeeId);

      if (deleteError) {
        console.error(
          "Delete Complaint Error:",
          deleteError
        );

        alert(
          "Unable to delete complaint."
        );

        return;
      }

      setComplaints((prev) =>
        prev.filter(
          (complaint) =>
            complaint.id !== id
        )
      );
    } catch (err) {
      console.error(
        "Delete Error:",
        err
      );

      alert(
        "Something went wrong while deleting."
      );
    }
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =====================================================
     PRIORITY CLASS
  ===================================================== */

  const getPriorityClass = (priority) => {
    return `priority-${String(
      priority || ""
    ).toLowerCase()}`;
  };

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "open") {
      return "status-open";
    }

    if (
      value === "in progress" ||
      value === "pending"
    ) {
      return "status-progress";
    }

    if (
      value === "resolved" ||
      value === "closed"
    ) {
      return "status-resolved";
    }

    return "status-default";
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="support-page">

      {/* HEADER */}

      <div className="support-header">

        <div>
          <h1>Support</h1>

          <p>
            We're here to help you with any
            issues you face
          </p>
        </div>

        <div className="support-header-buttons">

          <button
            type="button"
            className="raise-ticket-btn"
            onClick={openTicketModal}
          >
            + Raise Ticket
          </button>

          <button
            type="button"
            className="raise-complaint-btn"
            onClick={openComplaintModal}
          >
            + Raise Complaint
          </button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="support-error">
          {error}
        </div>
      )}

      {/* =================================================
          SUBMITTED COMPLAINTS
      ================================================= */}

      <div className="submitted-section">

        <div className="submitted-heading">

          <div>

            <h2>
              Submitted Complaints
            </h2>

            <p>
              View the complaints you have
              submitted
            </p>

          </div>

          <span className="complaint-count">
            {complaints.length}
          </span>

        </div>

        {loadingComplaints ? (

          <div className="table-loading">
            Loading complaints...
          </div>

        ) : complaints.length === 0 ? (

          <div className="no-complaints">

            <div className="no-complaints-icon">
              📋
            </div>

            <h3>
              No complaints submitted
            </h3>

            <p>
              Click "Raise Complaint" to
              submit a new complaint.
            </p>

          </div>

        ) : (

          <div className="data-table-container">

            <table className="support-data-table">

              <thead>

                <tr>

                  <th>
                    Complaint ID
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Submitted On
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {complaints.map(
                  (complaint) => (

                    <tr
                      key={complaint.id}
                    >

                      <td>
                        <span className="table-id">
                          {complaint.complaint_code ||
                            `CMP-${String(
                              complaint.id
                            ).slice(-6)}`}
                        </span>
                      </td>

                      <td>

                        <div className="table-subject">

                          <strong>
                            {complaint.subject ||
                              `${complaint.category} Complaint`}
                          </strong>

                          <small>
                            {complaint.description
                              ? complaint.description.length > 45
                                ? `${complaint.description.slice(
                                    0,
                                    45
                                  )}...`
                                : complaint.description
                              : "-"}
                          </small>

                        </div>

                      </td>

                      <td>
                        {complaint.category || "-"}
                      </td>

                      <td>

                        <span
                          className={`priority-text ${getPriorityClass(
                            complaint.priority
                          )}`}
                        >
                          {complaint.priority || "-"}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`table-status ${getStatusClass(
                            complaint.status
                          )}`}
                        >
                          {complaint.status || "Open"}
                        </span>

                      </td>

                      <td>
                        {formatDate(
                          complaint.created_at
                        )}
                      </td>

                      <td>

                        <button
                          type="button"
                          className="table-delete-btn"
                          onClick={() =>
                            deleteComplaint(
                              complaint.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          SUBMITTED TICKETS
      ================================================= */}

      <div className="submitted-section tickets-section">

        <div className="submitted-heading">

          <div>

            <h2>
              Submitted Tickets
            </h2>

            <p>
              View the support tickets you have
              submitted
            </p>

          </div>

          <span className="ticket-count">
            {tickets.length}
          </span>

        </div>

        {loadingTickets ? (

          <div className="table-loading">
            Loading tickets...
          </div>

        ) : tickets.length === 0 ? (

          <div className="no-complaints">

            <div className="no-complaints-icon">
              🎫
            </div>

            <h3>
              No tickets submitted
            </h3>

            <p>
              Click "Raise Ticket" to
              create a new support ticket.
            </p>

          </div>

        ) : (

          <div className="data-table-container">

            <table className="support-data-table">

              <thead>

                <tr>

                  <th>
                    Ticket No.
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Assigned To
                  </th>

                  <th>
                    Created On
                  </th>

                </tr>

              </thead>

              <tbody>

                {tickets.map(
                  (ticket) => (

                    <tr
                      key={
                        ticket.id ||
                        ticket.ticket_number
                      }
                    >

                      <td>
                        <span className="table-id">
                          {ticket.ticket_number ||
                            "-"}
                        </span>
                      </td>

                      <td>

                        <div className="table-subject">

                          <strong>
                            {ticket.subject ||
                              "-"}
                          </strong>

                        </div>

                      </td>

                      <td>
                        {ticket.category ||
                          "-"}
                      </td>

                      <td>

                        <span
                          className={`priority-text ${getPriorityClass(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority ||
                            "-"}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`table-status ${getStatusClass(
                            ticket.status
                          )}`}
                        >
                          {ticket.status ||
                            "Open"}
                        </span>

                      </td>

                      <td>
                        {ticket.assigned_to ||
                          "—"}
                      </td>

                      <td>
                        {formatDate(
                          ticket.created_date ||
                            ticket.created_at
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          RAISE COMPLAINT MODAL
      ================================================= */}

      {showComplaintModal && (

        <div
          className="modal-overlay"
          onClick={closeComplaintModal}
        >

          <div
            className="complaint-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Raise Complaint
                </h2>

                <p>
                  Submit a new complaint
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={
                  closeComplaintModal
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleComplaintSubmit
              }
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Employee
                  </label>

                  <input
                    type="text"
                    name="employee"
                    value={
                      complaintData.employee
                    }
                    disabled
                  />

                </div>

                <div className="form-group">

                  <label>
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={
                      complaintData.location
                    }
                    onChange={
                      handleComplaintChange
                    }
                    placeholder="Enter location"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Category <span>*</span>
                  </label>

                  <select
                    name="category"
                    value={
                      complaintData.category
                    }
                    onChange={
                      handleComplaintChange
                    }
                  >

                    <option value="">
                      Select category
                    </option>

                    <option value="Hardware">
                      Hardware
                    </option>

                    <option value="Software">
                      Software
                    </option>

                    <option value="Network">
                      Network
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="Attendance">
                      Attendance
                    </option>

                    <option value="Payroll">
                      Payroll
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Priority <span>*</span>
                  </label>

                  <select
                    name="priority"
                    value={
                      complaintData.priority
                    }
                    onChange={
                      handleComplaintChange
                    }
                  >

                    <option value="">
                      Select priority
                    </option>

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>

                  </select>

                </div>

                <div className="form-group full-width">

                  <label>
                    Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      complaintData.date
                    }
                    onChange={
                      handleComplaintChange
                    }
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Description <span>*</span>
                  </label>

                  <textarea
                    name="description"
                    value={
                      complaintData.description
                    }
                    onChange={
                      handleComplaintChange
                    }
                    placeholder="Describe your complaint..."
                    rows="5"
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeComplaintModal
                  }
                  disabled={
                    submittingComplaint
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={
                    submittingComplaint
                  }
                >
                  {submittingComplaint
                    ? "Submitting..."
                    : "Submit Complaint"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          RAISE TICKET MODAL
      ================================================= */}

      {showTicketModal && (

        <div
          className="modal-overlay"
          onClick={closeTicketModal}
        >

          <div
            className="complaint-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Raise Ticket
                </h2>

                <p>
                  Create a new support ticket
                </p>

              </div>

              <button
                type="button"
                className="close-modal"
                onClick={closeTicketModal}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleTicketSubmit}
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Employee <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="employee"
                    value={
                      ticketData.employee
                    }
                    onChange={
                      handleTicketChange
                    }
                    placeholder="Enter employee name"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Location <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={
                      ticketData.location
                    }
                    onChange={
                      handleTicketChange
                    }
                    placeholder="Enter location"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Category <span>*</span>
                  </label>

                  <select
                    name="category"
                    value={
                      ticketData.category
                    }
                    onChange={
                      handleTicketChange
                    }
                  >

                    <option value="">
                      Select category
                    </option>

                    <option value="Hardware">
                      Hardware
                    </option>

                    <option value="Software">
                      Software
                    </option>

                    <option value="Network">
                      Network
                    </option>

                    <option value="Account">
                      Account
                    </option>

                    <option value="Attendance">
                      Attendance
                    </option>

                    <option value="Payroll">
                      Payroll
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Priority <span>*</span>
                  </label>

                  <select
                    name="priority"
                    value={
                      ticketData.priority
                    }
                    onChange={
                      handleTicketChange
                    }
                  >

                    <option value="">
                      Select priority
                    </option>

                    <option value="Low">
                      Low
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Critical">
                      Critical
                    </option>

                  </select>

                </div>

                <div className="form-group full-width">

                  <label>
                    Date <span>*</span>
                  </label>

                  <input
                    type="date"
                    name="date"
                    value={
                      ticketData.date
                    }
                    onChange={
                      handleTicketChange
                    }
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Subject <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="subject"
                    value={
                      ticketData.subject
                    }
                    onChange={
                      handleTicketChange
                    }
                    placeholder="Enter ticket subject"
                  />

                </div>

                <div className="form-group full-width">

                  <label>
                    Description <span>*</span>
                  </label>

                  <textarea
                    name="description"
                    value={
                      ticketData.description
                    }
                    onChange={
                      handleTicketChange
                    }
                    placeholder="Describe your issue..."
                    rows="5"
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeTicketModal
                  }
                  disabled={
                    submittingTicket
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-ticket-btn"
                  disabled={
                    submittingTicket
                  }
                >
                  {submittingTicket
                    ? "Submitting..."
                    : "Submit Ticket"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Support;