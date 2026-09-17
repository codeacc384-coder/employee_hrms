import React, { useEffect, useState } from "react";
import "./PaySlips.css";
import { supabase } from "../lib/supabase";

function PaySlips() {
  const [payslips, setPayslips] = useState([]);
  const [selectedSlip, setSelectedSlip] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // Format currency
  // --------------------------------------------------
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------
  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Format month
  // --------------------------------------------------
  const formatMonth = (startDate, endDate) => {
    const dateValue = endDate || startDate;

    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Get display status
  // --------------------------------------------------
  const getDisplayStatus = (payslip, payrollItem) => {
    const payslipStatus = String(payslip?.status || "").toLowerCase();
    const paymentStatus = String(
      payrollItem?.payment_status || ""
    ).toLowerCase();

    if (
      payslip?.published_at ||
      payslipStatus === "published" ||
      payslipStatus === "verified" ||
      payslipStatus === "approved"
    ) {
      return "Verified";
    }

    if (
      paymentStatus === "paid" ||
      paymentStatus === "completed" ||
      paymentStatus === "success"
    ) {
      return "Verified";
    }

    if (
      payslipStatus === "generated" ||
      payslipStatus === "ready"
    ) {
      return "Generated";
    }

    if (
      payslipStatus === "pending" ||
      payslipStatus === "draft"
    ) {
      return "Pending";
    }

    return payslip?.status || "Generated";
  };

  // --------------------------------------------------
  // Load payslips
  // --------------------------------------------------
  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      setLoading(true);
      setError("");

      // ----------------------------------------------
      // 1. Get logged-in user
      // ----------------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User is not logged in.");
      }

      // ----------------------------------------------
      // 2. Get employee profile
      // ----------------------------------------------
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("employee_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("Employee profile not found.");
      }

      // ----------------------------------------------
      // 3. Check employee role
      // ----------------------------------------------
      if (
        profile.role &&
        String(profile.role).toLowerCase() !== "employee"
      ) {
        throw new Error("This page is available for employees only.");
      }

      if (!profile.employee_id) {
        throw new Error("Employee ID is not linked to this profile.");
      }

      // ----------------------------------------------
      // 4. Get employee
      // ----------------------------------------------
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select(
          `
          id,
          employee_code,
          first_name,
          last_name,
          full_name
          `
        )
        .eq("id", profile.employee_id)
        .maybeSingle();

      if (employeeError) {
        throw employeeError;
      }

      if (!employee) {
        throw new Error("Employee record not found.");
      }

      // ----------------------------------------------
      // 5. Get payslips
      // ----------------------------------------------
      const { data: payslipRows, error: payslipError } = await supabase
        .from("payslips")
        .select("*")
        .eq("employee_id", employee.id)
        .order("pay_period_end", {
          ascending: false,
        });

      if (payslipError) {
        throw payslipError;
      }

      if (!payslipRows || payslipRows.length === 0) {
        setPayslips([]);
        return;
      }

      // ----------------------------------------------
      // 6. Get payroll items
      //
      // payslips.payroll_item_id
      //              ↓
      // payroll_items.id
      // ----------------------------------------------
      const payrollItemIds = payslipRows
        .map((slip) => slip.payroll_item_id)
        .filter(Boolean);

      let payrollItems = [];

      if (payrollItemIds.length > 0) {
        const {
          data: payrollItemRows,
          error: payrollItemsError,
        } = await supabase
          .from("payroll_items")
          .select(
            `
            id,
            payroll_run_id,
            employee_id,
            attendance_days,
            late_days,
            absent_days,
            leave_days,
            worked_hours,
            overtime_hours,
            basic,
            hra,
            allowance,
            overtime,
            bonus,
            shift,
            lop,
            loan,
            advance,
            pf,
            esi,
            pt,
            tds,
            gross_pay,
            deductions,
            net_pay,
            previous_net_pay,
            variance_percent,
            status,
            payment_status,
            payment_reference,
            payment_mode,
            payment_gateway,
            executed_at,
            payslip_released_at,
            created_at,
            updated_at
            `
          )
          .in("id", payrollItemIds);

        if (payrollItemsError) {
          throw payrollItemsError;
        }

        payrollItems = payrollItemRows || [];
      }

      // ----------------------------------------------
      // 7. Create lookup by payroll item ID
      // ----------------------------------------------
      const payrollItemMap = {};

      payrollItems.forEach((item) => {
        payrollItemMap[item.id] = item;
      });

      // ----------------------------------------------
      // 8. Combine payslip + payroll item data
      // ----------------------------------------------
      const formattedPayslips = payslipRows.map((slip) => {
        const payrollItem = payrollItemMap[slip.payroll_item_id];

        const employeeName =
          employee.full_name ||
          `${employee.first_name || ""} ${
            employee.last_name || ""
          }`.trim();

        return {
          id: slip.id,

          employeeId: employee.employee_code || employee.id,

          employeeUuid: employee.id,

          employeeName: employeeName || "Employee",

          month: formatMonth(
            slip.pay_period_start,
            slip.pay_period_end
          ),

          payPeriodStart: slip.pay_period_start,

          payPeriodEnd: slip.pay_period_end,

          documentNumber: slip.document_number || "—",

          documentType: "Salary Statement",

          status: getDisplayStatus(slip, payrollItem),

          // ------------------------------------------
          // Salary information from payroll_items
          // ------------------------------------------
          basicSalary: payrollItem?.basic ?? null,

          hra: payrollItem?.hra ?? null,

          allowance: payrollItem?.allowance ?? null,

          overtime: payrollItem?.overtime ?? null,

          bonus: payrollItem?.bonus ?? null,

          grossPay: payrollItem?.gross_pay ?? null,

          deductions: payrollItem?.deductions ?? null,

          netSalary: payrollItem?.net_pay ?? null,

          // ------------------------------------------
          // Payment information
          // ------------------------------------------
          paymentStatus: payrollItem?.payment_status || "—",

          paymentMode: payrollItem?.payment_mode || "—",

          paymentReference:
            payrollItem?.payment_reference || "—",

          executedAt: payrollItem?.executed_at || null,

          releasedAt:
            payrollItem?.payslip_released_at ||
            slip.published_at ||
            null,

          // ------------------------------------------
          // Attendance information
          // ------------------------------------------
          attendanceDays:
            payrollItem?.attendance_days ?? null,

          lateDays: payrollItem?.late_days ?? null,

          absentDays: payrollItem?.absent_days ?? null,

          leaveDays: payrollItem?.leave_days ?? null,

          workedHours: payrollItem?.worked_hours ?? null,

          overtimeHours:
            payrollItem?.overtime_hours ?? null,

          // ------------------------------------------
          // Payslip PDF
          // ------------------------------------------
          pdfUrl: slip.pdf_url || null,

          publishedAt: slip.published_at || null,

          generatedAt: slip.generated_at || null,
        };
      });

      setPayslips(formattedPayslips);
    } catch (err) {
      console.error("Error loading payslips:", err);

      setError(
        err?.message ||
          "Unable to load payslip information."
      );

      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // View payslip
  // --------------------------------------------------
  const handleView = (slip) => {
    setSelectedSlip(slip);
  };

  // --------------------------------------------------
  // Close modal
  // --------------------------------------------------
  const handleCloseModal = () => {
    setSelectedSlip(null);
  };

  // --------------------------------------------------
  // Download / open actual PDF
  // --------------------------------------------------
  const handleDownload = (slip) => {
    if (!slip?.pdfUrl) {
      alert("PDF is not available for this payslip.");
      return;
    }

    window.open(slip.pdfUrl, "_blank", "noopener,noreferrer");
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="payslips-page">
        <div className="page-header">
          <div>
            <div className="page-label">
              PAYSLIPS
            </div>

            <h1>Payslips</h1>
          </div>
        </div>

        <div className="payslip-container">
          <p>Loading payslips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payslips-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}
      <div className="page-header">
        <div>
          <div className="page-label">
            PAYSLIPS
          </div>

          <h1>Salary Statements</h1>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}
      {error && (
        <div className="payslip-error-message">
          {error}
        </div>
      )}

      {/* =================================================
          PAYSLIP CONTAINER
      ================================================= */}
      <div className="payslip-container">

        <div className="payslip-heading">
          <div>
            <h2>My Payslips</h2>

            <p>
              View your salary statements and payment
              details.
            </p>
          </div>

          <div className="record-count">
            {payslips.length} Records
          </div>
        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}
        {!error && payslips.length === 0 && (
          <div className="payslip-empty-state">
            <div className="empty-document-icon">
              📄
            </div>

            <h3>No Payslips Available</h3>

            <p>
              Your salary statements will appear here
              once they are generated.
            </p>
          </div>
        )}

        {/* =================================================
            TABLE
        ================================================= */}
        {payslips.length > 0 && (
          <div className="table-wrapper">

            <table className="payslip-table">

              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Month</th>
                  <th>Basic Salary</th>
                  <th>Net Salary</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {payslips.map((slip) => (
                  <tr key={slip.id}>

                    <td>
                      {slip.employeeId}
                    </td>

                    <td>
                      {slip.month}
                    </td>

                    <td>
                      {formatCurrency(
                        slip.basicSalary
                      )}
                    </td>

                    <td className="net-salary">
                      {formatCurrency(
                        slip.netSalary
                      )}
                    </td>

                    <td>
                      {slip.documentType}
                    </td>

                    <td>
                      <span
                        className={
                          slip.status === "Verified"
                            ? "verified"
                            : ""
                        }
                      >
                        {slip.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">

                        <button
                          className="view-btn"
                          onClick={() =>
                            handleView(slip)
                          }
                        >
                          View
                        </button>

                        <button
                          className="download-btn"
                          onClick={() =>
                            handleDownload(slip)
                          }
                          disabled={!slip.pdfUrl}
                          title={
                            slip.pdfUrl
                              ? "Open payslip PDF"
                              : "PDF not available"
                          }
                        >
                          Download
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}
      </div>

      {/* =================================================
          VIEW PAYSLIP MODAL
      ================================================= */}
      {selectedSlip && (
        <div
          className="modal-overlay"
          onClick={handleCloseModal}
        >

          <div
            className="payslip-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Modal Header */}
            <div className="modal-header">

              <div>
                <div className="modal-document-icon">
                  📄
                </div>

                <h2>
                  Salary Statement
                </h2>
              </div>

              <button
                className="close-modal"
                onClick={handleCloseModal}
              >
                ×
              </button>

            </div>

            {/* =================================================
                DETAILS
            ================================================= */}
            <div className="payslip-details">

              <div className="payslip-detail-box">
                <span>Employee ID</span>
                <strong>
                  {selectedSlip.employeeId}
                </strong>
              </div>

              <div className="payslip-detail-box">
                <span>Employee Name</span>
                <strong>
                  {selectedSlip.employeeName}
                </strong>
              </div>

              <div className="payslip-detail-box">
                <span>Pay Month</span>
                <strong>
                  {selectedSlip.month}
                </strong>
              </div>

              <div className="payslip-detail-box">
                <span>Document Number</span>
                <strong>
                  {selectedSlip.documentNumber}
                </strong>
              </div>

              <div className="payslip-detail-box">
                <span>Status</span>

                <strong className="verified">
                  {selectedSlip.status}
                </strong>
              </div>

            </div>

            {/* =================================================
                DOCUMENT PREVIEW
            ================================================= */}
            <div className="document-preview">

              <div className="preview-row">
                <span>
                  Pay Period
                </span>

                <strong>
                  {formatDate(
                    selectedSlip.payPeriodStart
                  )}{" "}
                  -{" "}
                  {formatDate(
                    selectedSlip.payPeriodEnd
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Basic Salary
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.basicSalary
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  HRA
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.hra
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Allowance
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.allowance
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Overtime
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.overtime
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Bonus
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.bonus
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Gross Pay
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.grossPay
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Deductions
                </span>

                <strong>
                  {formatCurrency(
                    selectedSlip.deductions
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Net Salary
                </span>

                <strong className="preview-net-salary">
                  {formatCurrency(
                    selectedSlip.netSalary
                  )}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Payment Status
                </span>

                <strong>
                  {selectedSlip.paymentStatus}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Payment Mode
                </span>

                <strong>
                  {selectedSlip.paymentMode}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Payment Reference
                </span>

                <strong>
                  {selectedSlip.paymentReference}
                </strong>
              </div>

              <div className="preview-row">
                <span>
                  Payslip Released
                </span>

                <strong>
                  {formatDate(
                    selectedSlip.releasedAt
                  )}
                </strong>
              </div>

            </div>

            {/* =================================================
                PDF STATUS
            ================================================= */}
            {selectedSlip.pdfUrl ? (
              <div className="pdf-available-message">
                PDF payslip is available.
              </div>
            ) : (
              <div className="pdf-unavailable-message">
                PDF payslip is not available yet.
              </div>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}
            <div className="preview-footer">
              Salary information is retrieved from
              the payroll records.
            </div>

            {/* =================================================
                MODAL FOOTER
            ================================================= */}
            <div className="modal-footer">

              <button
                className="close-btn"
                onClick={handleCloseModal}
              >
                Close
              </button>

              <button
                className="modal-download-btn"
                onClick={() =>
                  handleDownload(selectedSlip)
                }
                disabled={!selectedSlip.pdfUrl}
              >
                Download Payslip
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default PaySlips;