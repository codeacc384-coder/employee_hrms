import React, { useEffect, useState } from "react";
import "./Leave.css";
import { supabase } from "../lib/supabase";

function Leave() {
  /* =====================================================
     STATE
  ===================================================== */

  const [activeTab, setActiveTab] = useState("balance");

  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const [leaveType, setLeaveType] = useState("Casual Leave");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [reason, setReason] = useState("");

  const [leaveRequests, setLeaveRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     GET EMPLOYEE INFORMATION
  ===================================================== */

  const getEmployeeInformation = () => {
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

    return {
      employeeId,
      employeeName,
    };
  };

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const newDate = new Date(`${date}T00:00:00`);

    if (isNaN(newDate.getTime())) {
      return date;
    }

    return newDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =====================================================
     CONVERT DATABASE STATUS TO EMPLOYEE STATUS
     
     REQUIRED WORKFLOW:

     Initial:
     Pending TL approval

     TL approves:
     Pending HR approval

     HR approves:
     Pending TL approval

     Final:
     Approved
  ===================================================== */

  const formatStatus = (status, approvalStage, request = {}) => {
    const stage = String(approvalStage || "")
      .trim()
      .toUpperCase();

    const value = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    /* ---------------------------------------------
       FINAL APPROVED
    --------------------------------------------- */

    if (
      stage === "APPROVED" ||
      value === "approved" ||
      value === "fully approved" ||
      value === "final approved" ||
      value === "completed"
    ) {
      return "Approved";
    }

    /* ---------------------------------------------
       HR REJECTED

       IMPORTANT:
       Some existing HR approval code stores both TL and HR
       rejection as approval_stage = "REJECTED". If TL already
       approved the request, a later rejection belongs to HR.
       Therefore we check TL approval fields before treating a
       generic REJECTED stage as TL Rejected.
    --------------------------------------------- */

    const tlAlreadyApproved = Boolean(
      request?.tl_approved_at ||
      request?.tl_approved_by ||
      request?.tl_review_comment?.toLowerCase?.().includes("approved")
    );

    if (
      stage === "HR_REJECTED" ||
      value === "hr rejected" ||
      value.includes("rejected by hr") ||
      value.includes("rejected by human resources") ||
      (stage === "REJECTED" && tlAlreadyApproved)
    ) {
      return "HR Rejected";
    }

    /* ---------------------------------------------
       TL REJECTED
    --------------------------------------------- */

    if (
      stage === "TL_REJECTED" ||
      value === "tl rejected" ||
      value.includes("rejected by tl") ||
      value.includes("rejected by team lead") ||
      value.includes("rejected by teamlead")
    ) {
      return "TL Rejected";
    }

    /* ---------------------------------------------
       OLD REJECTED ROWS
       A generic Rejected request is treated as TL
       rejected because TL is the first approval step.
    --------------------------------------------- */

    if (
      value === "rejected" ||
      value === "declined" ||
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "TL Rejected";
    }

    /* ---------------------------------------------
       TL APPROVED → WAITING FOR HR

       TL approval keeps status = "Pending" and changes
       approval_stage to "HR_PENDING".
    --------------------------------------------- */

    if (
      stage === "HR_PENDING" ||
      value === "pending hr approval" ||
      value.includes("pending hr") ||
      value.includes("waiting for hr") ||
      value.includes("approved by tl") ||
      value.includes("tl approved") ||
      value.includes("team lead approved") ||
      value.includes("teamlead approved") ||
      value.includes("approved by team lead")
    ) {
      return "Pending HR approval";
    }

    /* ---------------------------------------------
       INITIAL → WAITING FOR TL
    --------------------------------------------- */

    if (
      stage === "TL_PENDING" ||
      value === "pending" ||
      value === "submitted" ||
      value === "requested" ||
      value === "pending tl approval" ||
      value === "pending team lead approval" ||
      value.includes("waiting for tl") ||
      value.includes("waiting for team lead")
    ) {
      return "Pending TL approval";
    }

    /* ---------------------------------------------
       FALLBACK
    --------------------------------------------- */

    if (!status) {
      return "Pending TL approval";
    }

    return (
      String(status).charAt(0).toUpperCase() +
      String(status).slice(1)
    );
  };

  /* =====================================================
     INTERNAL STATUS CHECK
     
     Used for calculations.
  ===================================================== */

  const isFinalApproved = (status, approvalStage) => {
    const stage = String(approvalStage || "")
      .trim()
      .toUpperCase();

    if (stage === "APPROVED") {
      return true;
    }

    if (!status) {
      return false;
    }

    const value = String(status)
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");

    return (
      value === "approved" ||
      value === "fully approved" ||
      value === "final approved" ||
      value === "completed"
    );
  };

  /* =====================================================
     FETCH LEAVE REQUESTS
  ===================================================== */

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { employeeId } = getEmployeeInformation();

      console.log("Leave - Employee ID:", employeeId);

      if (!employeeId) {
        setErrorMessage(
          "Employee ID not found. Please log in again."
        );

        setLeaveRequests([]);

        return;
      }

      /* ---------------------------------------------
         FETCH LEAVE REQUESTS
      --------------------------------------------- */

      const { data, error } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("request_type", "LEAVE")
        .order("created_at", {
          ascending: false,
        });

      console.log("Leave requests:", data);
      console.log("Leave fetch error:", error);

      if (error) {
        throw error;
      }

      /* ---------------------------------------------
         FORMAT REQUESTS
      --------------------------------------------- */

      const formattedRequests = (data || []).map(
        (request) => {
          let leaveDetails = {
            startDate: "",
            endDate: "",
            reason: request.description || "",
          };

          /* -----------------------------------------
             READ JSON DESCRIPTION
          ----------------------------------------- */

          try {
            if (request.description) {
              const parsedDescription =
                JSON.parse(request.description);

              if (
                parsedDescription &&
                typeof parsedDescription === "object"
              ) {
                leaveDetails = {
                  startDate:
                    parsedDescription.startDate || "",

                  endDate:
                    parsedDescription.endDate || "",

                  reason:
                    parsedDescription.reason || "",
                };
              }
            }
          } catch {
            /*
              Older records may contain plain text.
            */
          }

          /* -----------------------------------------
             EMPLOYEE-FACING STATUS
          ----------------------------------------- */

          const displayStatus = formatStatus(
            request.status,
            request.approval_stage,
            request
          );

          return {
            id: request.id,

            type:
              request.title ||
              "Leave",

            startDate:
              formatDate(
                leaveDetails.startDate
              ),

            endDate:
              formatDate(
                leaveDetails.endDate
              ),

            days:
              Number(request.amount) || 1,

            reason:
              leaveDetails.reason ||
              request.description ||
              "",

            status: displayStatus,

            /* Keep original DB status and approval stage */
            rawStatus: request.status,

            approvalStage:
              request.approval_stage || "",

            rawStartDate:
              leaveDetails.startDate,

            rawEndDate:
              leaveDetails.endDate,
          };
        }
      );

      setLeaveRequests(formattedRequests);
    } catch (error) {
      console.error(
        "Error fetching leave requests:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to load leave requests."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LEAVE BALANCE
  ===================================================== */

  const leaveTotals = {
    casual: 12,
    sick: 10,
    annual: 21,
  };

  /* =====================================================
     CALCULATE USED LEAVE
     
     ONLY FULLY APPROVED REQUESTS ARE COUNTED.
  ===================================================== */

  const getUsedLeave = (leaveName) => {
    return leaveRequests
      .filter(
        (request) =>
          request.type.toLowerCase() ===
            leaveName.toLowerCase() &&
          isFinalApproved(request.rawStatus)
      )
      .reduce(
        (total, request) =>
          total + Number(request.days || 0),
        0
      );
  };

  const casualUsed =
    getUsedLeave("Casual Leave");

  const sickUsed =
    getUsedLeave("Sick Leave");

  const annualUsed =
    getUsedLeave("Annual Leave");

  const leaveBalance = {
    casual: {
      total: leaveTotals.casual,

      used: casualUsed,

      remaining: Math.max(
        leaveTotals.casual -
          casualUsed,
        0
      ),
    },

    sick: {
      total: leaveTotals.sick,

      used: sickUsed,

      remaining: Math.max(
        leaveTotals.sick -
          sickUsed,
        0
      ),
    },

    annual: {
      total: leaveTotals.annual,

      used: annualUsed,

      remaining: Math.max(
        leaveTotals.annual -
          annualUsed,
        0
      ),
    },
  };

  /* =====================================================
     SUMMARY COUNTS
  ===================================================== */

  const approvedCount =
    leaveRequests.filter(
      (request) =>
        isFinalApproved(
          request.rawStatus,
          request.approvalStage
        )
    ).length;

  const pendingCount =
    leaveRequests.filter((request) => {
      const status =
        request.status.toLowerCase();

      return (
        status.includes("pending")
      );
    }).length;

  const rejectedCount =
    leaveRequests.filter((request) => {
      const status = String(request.status || "")
        .trim()
        .toLowerCase();

      return (
        status === "tl rejected" ||
        status === "hr rejected" ||
        status === "rejected"
      );
    }).length;

  const totalBalance =
    leaveBalance.casual.remaining +
    leaveBalance.sick.remaining +
    leaveBalance.annual.remaining;

  /* =====================================================
     TOTAL APPROVED DAYS
  ===================================================== */

  const totalApprovedDays =
    leaveRequests
      .filter((request) =>
        isFinalApproved(
          request.rawStatus,
          request.approvalStage
        )
      )
      .reduce(
        (total, request) =>
          total +
          Number(request.days || 0),
        0
      );

  /* =====================================================
     CALCULATE DAYS
  ===================================================== */

  const calculateDays = () => {
    if (!startDate || !endDate) {
      return 1;
    }

    const start =
      new Date(
        `${startDate}T00:00:00`
      );

    const end =
      new Date(
        `${endDate}T00:00:00`
      );

    const difference =
      end.getTime() -
      start.getTime();

    const days =
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return days > 0 ? days : 1;
  };

  /* =====================================================
     APPLY LEAVE
  ===================================================== */

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (
      !startDate ||
      !endDate ||
      !reason.trim()
    ) {
      alert(
        "Please fill all leave details."
      );

      return;
    }

    if (
      new Date(startDate) >
      new Date(endDate)
    ) {
      alert(
        "End date cannot be before start date."
      );

      return;
    }

    const {
      employeeId,
      employeeName,
    } = getEmployeeInformation();

    if (!employeeId) {
      alert(
        "Employee ID not found. Please log in again."
      );

      return;
    }

    const selectedDays =
      calculateDays();

    /* =================================================
       CHECK AVAILABLE BALANCE
    ================================================= */

    let remainingBalance = 0;

    if (
      leaveType ===
      "Casual Leave"
    ) {
      remainingBalance =
        leaveBalance.casual.remaining;
    }

    if (
      leaveType ===
      "Sick Leave"
    ) {
      remainingBalance =
        leaveBalance.sick.remaining;
    }

    if (
      leaveType ===
      "Annual Leave"
    ) {
      remainingBalance =
        leaveBalance.annual.remaining;
    }

    if (
      selectedDays >
      remainingBalance
    ) {
      alert(
        `You only have ${remainingBalance} days remaining for ${leaveType}.`
      );

      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      /* -----------------------------------------------
         STORE DATES + REASON
      ----------------------------------------------- */

      const description =
        JSON.stringify({
          startDate,
          endDate,
          reason: reason.trim(),
        });

      /* -----------------------------------------------
         INSERT NEW REQUEST

         Initial status:
         Pending

         Employee UI displays:
         Pending TL approval
      ----------------------------------------------- */

      const { data, error } =
        await supabase
          .from("approval_requests")
          .insert([
            {
              employee_id:
                employeeId,

              request_type:
                "LEAVE",

              title:
                leaveType,

              description,

              amount:
                selectedDays,

              status:
                "Pending",

              /* Initial approval stage */
              approval_stage:
                "TL_PENDING",

              requested_by:
                employeeName,

              requested_at:
                new Date().toISOString(),
            },
          ])
          .select()
          .single();

      console.log(
        "New leave request:",
        data
      );

      console.log(
        "Leave insert error:",
        error
      );

      if (error) {
        throw error;
      }

      /* -----------------------------------------------
         ADD NEW REQUEST TO UI
      ----------------------------------------------- */

      const newRequest = {
        id: data.id,

        type: leaveType,

        startDate:
          formatDate(startDate),

        endDate:
          formatDate(endDate),

        days: selectedDays,

        reason:
          reason.trim(),

        status:
          "Pending TL approval",

        rawStatus:
          data.status,

        approvalStage:
          data.approval_stage || "TL_PENDING",

        rawStartDate:
          startDate,

        rawEndDate:
          endDate,
      };

      setLeaveRequests(
        (previousRequests) => [
          newRequest,
          ...previousRequests,
        ]
      );

      /* -----------------------------------------------
         CLEAR FORM
      ----------------------------------------------- */

      setStartDate("");

      setEndDate("");

      setReason("");

      setLeaveType(
        "Casual Leave"
      );

      setShowLeaveForm(false);

      setActiveTab("history");

      alert(
        "Leave request submitted successfully."
      );
    } catch (error) {
      console.error(
        "Error submitting leave:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to submit leave request."
      );

      alert(
        error.message ||
          "Unable to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================================================
     CANCEL FORM
  ===================================================== */

  const handleCancel = () => {
    setShowLeaveForm(false);

    setStartDate("");

    setEndDate("");

    setReason("");

    setLeaveType(
      "Casual Leave"
    );
  };

  /* =====================================================
     STATUS CSS CLASS
  ===================================================== */

  const getStatusClass = (status) => {
    const value = String(status || "")
      .toLowerCase();

    if (
      value === "approved"
    ) {
      return "approved";
    }

    if (
      value === "rejected"
    ) {
      return "rejected";
    }

    if (
      value.includes("pending")
    ) {
      return "pending";
    }

    return "pending";
  };

  return (
    <div className="leave-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="leave-top-section">

        <div className="leave-breadcrumb">

          <span className="leave-employee-badge">
            EMPLOYEE
          </span>

          <span>
            MYWORKSPACE
          </span>

        </div>

        <div className="leave-title-row">

          <div>

            <h1>
              Leave
            </h1>

            <p>
              Balances, requests and calendar
            </p>

          </div>

          <button
            className="apply-leave-button"
            onClick={() =>
              setShowLeaveForm(true)
            }
          >
            Apply for Leave
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {errorMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "14px",
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* =================================================
          LEAVE SUMMARY
      ================================================= */}

      <div className="leave-summary-card">

        <div className="summary-main">

          <div className="summary-item large">

            <span>
              TOTAL BALANCE
            </span>

            <strong>
              {totalBalance}
            </strong>

            <small>
              Days available
            </small>

          </div>

          <div className="summary-item">

            <span>
              AUGUST QUOTA
            </span>

            <strong>
              {totalApprovedDays} / 2
            </strong>

            <small>
              Days used
            </small>

          </div>

          <div className="summary-item">

            <span>
              APPROVED
            </span>

            <strong className="approved-number">
              {approvedCount}
            </strong>

            <small>
              Requests
            </small>

          </div>

          <div className="summary-item">

            <span>
              PENDING
            </span>

            <strong className="pending-number">
              {pendingCount}
            </strong>

            <small>
              Requests
            </small>

          </div>

          <div className="summary-item">

            <span>
              REJECTED
            </span>

            <strong className="rejected-number">
              {rejectedCount}
            </strong>

            <small>
              Requests
            </small>

          </div>

          <div className="summary-item">

            <span>
              LOP DAYS
            </span>

            <strong>
              0
            </strong>

            <small>
              Loss of pay
            </small>

          </div>

        </div>

        {/* =================================================
            LEAVE BALANCE CARDS
        ================================================= */}

        <div className="leave-balance-cards">

          {/* Casual Leave */}

          <div className="balance-card">

            <div className="balance-card-header">

              <div>

                <h3>
                  Casual Leave
                </h3>

                <span>
                  CL
                </span>

              </div>

              <strong>
                {leaveBalance.casual.remaining}
              </strong>

            </div>

            <p>
              {leaveBalance.casual.used} used of{" "}
              {leaveBalance.casual.total}
            </p>

            <div className="balance-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.casual.used /
                      leaveBalance.casual.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.casual.remaining} days remaining
            </small>

          </div>

          {/* Sick Leave */}

          <div className="balance-card">

            <div className="balance-card-header">

              <div>

                <h3>
                  Sick Leave
                </h3>

                <span>
                  SL
                </span>

              </div>

              <strong>
                {leaveBalance.sick.remaining}
              </strong>

            </div>

            <p>
              {leaveBalance.sick.used} used of{" "}
              {leaveBalance.sick.total}
            </p>

            <div className="balance-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.sick.used /
                      leaveBalance.sick.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.sick.remaining} days remaining
            </small>

          </div>

          {/* Annual Leave */}

          <div className="balance-card">

            <div className="balance-card-header">

              <div>

                <h3>
                  Annual Leave
                </h3>

                <span>
                  AL
                </span>

              </div>

              <strong>
                {leaveBalance.annual.remaining}
              </strong>

            </div>

            <p>
              {leaveBalance.annual.used} used of{" "}
              {leaveBalance.annual.total}
            </p>

            <div className="balance-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.annual.used /
                      leaveBalance.annual.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.annual.remaining} days remaining
            </small>

          </div>

        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="leave-tabs">

        <button
          className={
            activeTab === "balance"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("balance")
          }
        >
          Leave Balance
        </button>

        <button
          className={
            activeTab === "history"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("history")
          }
        >
          Leave History
        </button>

        <button
          className={
            activeTab === "calendar"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("calendar")
          }
        >
          Leave Calendar
        </button>

        <button
          className={
            activeTab === "holidays"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("holidays")
          }
        >
          Holidays
        </button>

      </div>

      {/* =================================================
          TAB CONTENT
      ================================================= */}

      <div className="leave-tab-content">

        {/* =================================================
            BALANCE TAB
        ================================================= */}

        {activeTab === "balance" && (

          <div className="balance-tab-content">

            <h2>
              Leave Balance
            </h2>

            <p className="section-description">
              Your available leave balance for 2026.
            </p>

            <div className="balance-detail-table">

              <div className="table-header">

                <span>
                  Leave Type
                </span>

                <span>
                  Total
                </span>

                <span>
                  Used
                </span>

                <span>
                  Remaining
                </span>

              </div>

              <div className="table-row">

                <span>
                  Casual Leave
                </span>

                <strong>
                  {leaveBalance.casual.total}
                </strong>

                <span>
                  {leaveBalance.casual.used}
                </span>

                <strong>
                  {leaveBalance.casual.remaining}
                </strong>

              </div>

              <div className="table-row">

                <span>
                  Sick Leave
                </span>

                <strong>
                  {leaveBalance.sick.total}
                </strong>

                <span>
                  {leaveBalance.sick.used}
                </span>

                <strong>
                  {leaveBalance.sick.remaining}
                </strong>

              </div>

              <div className="table-row">

                <span>
                  Annual Leave
                </span>

                <strong>
                  {leaveBalance.annual.total}
                </strong>

                <span>
                  {leaveBalance.annual.used}
                </span>

                <strong>
                  {leaveBalance.annual.remaining}
                </strong>

              </div>

            </div>

          </div>

        )}

        {/* =================================================
            HISTORY TAB
        ================================================= */}

        {activeTab === "history" && (

          <div className="history-tab-content">

            <div className="history-header">

              <div>

                <h2>
                  Leave History
                </h2>

                <p>
                  View all your leave requests.
                </p>

              </div>

              <button
                className="small-apply-button"
                onClick={() =>
                  setShowLeaveForm(true)
                }
              >
                Apply for Leave
              </button>

            </div>

            <div className="leave-history-table">

              <div className="history-table-header">

                <span>
                  Leave Type
                </span>

                <span>
                  Start Date
                </span>

                <span>
                  End Date
                </span>

                <span>
                  Days
                </span>

                <span>
                  Reason
                </span>

                <span>
                  Status
                </span>

              </div>

              {loading ? (

                <div
                  className="history-table-row"
                  style={{
                    justifyContent:
                      "center",
                  }}
                >
                  <span>
                    Loading leave requests...
                  </span>
                </div>

              ) : leaveRequests.length === 0 ? (

                <div
                  className="history-table-row"
                  style={{
                    justifyContent:
                      "center",
                  }}
                >
                  <span>
                    No leave requests found.
                  </span>
                </div>

              ) : (

                leaveRequests.map(
                  (request) => (

                    <div
                      className="history-table-row"
                      key={request.id}
                    >

                      <span>
                        {request.type}
                      </span>

                      <span>
                        {request.startDate}
                      </span>

                      <span>
                        {request.endDate}
                      </span>

                      <span>
                        {request.days}
                      </span>

                      <span>
                        {request.reason}
                      </span>

                      <span>

                        <b
                          className={getStatusClass(
                            request.status
                          )}
                        >
                          {request.status}
                        </b>

                      </span>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        )}

        {/* =================================================
            CALENDAR TAB
        ================================================= */}

        {activeTab === "calendar" && (

          <div className="calendar-content">

            <h2>
              Leave Calendar
            </h2>

            <p className="section-description">
              Your leave schedule for August 2026.
            </p>

            <div className="calendar-grid">

              <div className="calendar-day-name">
                Sun
              </div>

              <div className="calendar-day-name">
                Mon
              </div>

              <div className="calendar-day-name">
                Tue
              </div>

              <div className="calendar-day-name">
                Wed
              </div>

              <div className="calendar-day-name">
                Thu
              </div>

              <div className="calendar-day-name">
                Fri
              </div>

              <div className="calendar-day-name">
                Sat
              </div>

              {Array.from(
                { length: 31 },
                (_, index) => {

                  const day =
                    index + 1;

                  const dateString =
                    `2026-08-${String(
                      day
                    ).padStart(2, "0")}`;

                  const isLeaveDay =
                    leaveRequests.some(
                      (request) => {

                        if (
                          !request.rawStartDate ||
                          !request.rawEndDate
                        ) {
                          return false;
                        }

                        const start =
                          new Date(
                            `${request.rawStartDate}T00:00:00`
                          );

                        const end =
                          new Date(
                            `${request.rawEndDate}T00:00:00`
                          );

                        const current =
                          new Date(
                            `${dateString}T00:00:00`
                          );

                        return (
                          current >= start &&
                          current <= end &&
                          !["tl rejected", "hr rejected", "rejected"].includes(
                              String(request.status || "").toLowerCase()
                            )
                        );
                      }
                    );

                  return (
                    <div
                      className={
                        isLeaveDay
                          ? "calendar-date leave-day"
                          : "calendar-date"
                      }
                      key={day}
                    >

                      {day}

                      {isLeaveDay && (
                        <small>
                          Leave
                        </small>
                      )}

                    </div>
                  );
                }
              )}

            </div>

          </div>

        )}

        {/* =================================================
            HOLIDAYS TAB
        ================================================= */}

        {activeTab === "holidays" && (

          <div className="holidays-content">

            <h2>
              Holidays
            </h2>

            <p className="section-description">
              Company holidays for 2026.
            </p>

            <div className="holiday-list">

              <div className="holiday-row">

                <strong>
                  15 August 2026
                </strong>

                <span>
                  Independence Day
                </span>

              </div>

              <div className="holiday-row">

                <strong>
                  2 October 2026
                </strong>

                <span>
                  Gandhi Jayanti
                </span>

              </div>

              <div className="holiday-row">

                <strong>
                  20 October 2026
                </strong>

                <span>
                  Dussehra
                </span>

              </div>

              <div className="holiday-row">

                <strong>
                  25 December 2026
                </strong>

                <span>
                  Christmas
                </span>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* =================================================
          BOTTOM INFORMATION
      ================================================= */}

      <div className="leave-bottom-grid">

        {/* UTILIZATION */}

        <div className="utilization-card">

          <h2>
            Utilization
          </h2>

          <p>
            Leave utilization for this year
          </p>

          <div className="utilization-item">

            <div className="utilization-title">

              <span>
                Casual Leave
              </span>

              <strong>
                {leaveBalance.casual.used} /{" "}
                {leaveBalance.casual.total}
              </strong>

            </div>

            <div className="utilization-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.casual.used /
                      leaveBalance.casual.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.casual.remaining} days remaining
            </small>

          </div>

          <div className="utilization-item">

            <div className="utilization-title">

              <span>
                Sick Leave
              </span>

              <strong>
                {leaveBalance.sick.used} /{" "}
                {leaveBalance.sick.total}
              </strong>

            </div>

            <div className="utilization-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.sick.used /
                      leaveBalance.sick.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.sick.remaining} days remaining
            </small>

          </div>

          <div className="utilization-item">

            <div className="utilization-title">

              <span>
                Annual Leave
              </span>

              <strong>
                {leaveBalance.annual.used} /{" "}
                {leaveBalance.annual.total}
              </strong>

            </div>

            <div className="utilization-progress">

              <div
                style={{
                  width: `${Math.min(
                    (
                      leaveBalance.annual.used /
                      leaveBalance.annual.total
                    ) * 100,
                    100
                  )}%`,
                }}
              ></div>

            </div>

            <small>
              {leaveBalance.annual.remaining} days remaining
            </small>

          </div>

        </div>

        {/* LEAVE POLICY */}

        <div className="policy-card">

          <h2>
            Leave Policy
          </h2>

          <p>
            Company leave rules and policies.
          </p>

          <div className="policy-row">

            <span>
              Carry forward limit
            </span>

            <strong>
              10 days
            </strong>

          </div>

          <div className="policy-row">

            <span>
              Encashment
            </span>

            <strong>
              5 days
            </strong>

          </div>

          <div className="policy-row">

            <span>
              Notice period
            </span>

            <strong>
              2 days
            </strong>

          </div>

          <div className="policy-row">

            <span>
              Sick leave proof
            </span>

            <strong>
              Medical
            </strong>

          </div>

          <div className="policy-row">

            <span>
              WFH limit
            </span>

            <strong>
              3 days
            </strong>

          </div>

          <div className="policy-row">

            <span>
              Comp off validity
            </span>

            <strong>
              30 days
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
          APPLY LEAVE MODAL
      ================================================= */}

      {showLeaveForm && (

        <div className="leave-modal-overlay">

          <div className="leave-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Apply for Leave
                </h2>

                <p>
                  Submit a new leave request.
                </p>

              </div>

              <button
                className="close-modal"
                onClick={handleCancel}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleApplyLeave}
            >

              {/* Leave Type */}

              <div className="form-group">

                <label>
                  Leave Type
                </label>

                <select
                  value={leaveType}
                  onChange={(e) =>
                    setLeaveType(
                      e.target.value
                    )
                  }
                >

                  <option>
                    Casual Leave
                  </option>

                  <option>
                    Sick Leave
                  </option>

                  <option>
                    Annual Leave
                  </option>

                </select>

              </div>

              {/* Dates */}

              <div className="date-row">

                <div className="form-group">

                  <label>
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(
                        e.target.value
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    End Date
                  </label>

                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              {/* Reason */}

              <div className="form-group">

                <label>
                  Reason
                </label>

                <textarea
                  rows="4"
                  placeholder="Enter reason for leave..."
                  value={reason}
                  onChange={(e) =>
                    setReason(
                      e.target.value
                    )
                  }
                ></textarea>

              </div>

              {/* Days */}

              <div className="selected-days">

                Selected days:

                <strong>
                  {" "}
                  {calculateDays()}
                </strong>

              </div>

              {/* Buttons */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-leave-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Leave"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Leave;