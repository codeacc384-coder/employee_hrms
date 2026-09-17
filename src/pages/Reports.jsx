import { useRef, useState } from "react";
import "./Reports.css";


// ============================================
// GET CURRENT DATE
// ============================================

const getCurrentDate = () => {

  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    today.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


// ============================================
// FORMAT DATE
// Example: 2026-08-26 -> 26-08-2026
// ============================================

const formatDate = (date) => {

  const parts = date.split("-");

  if (parts.length !== 3) {
    return date;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};


// ============================================
// REPORTS COMPONENT
// ============================================

function Reports() {

  // ------------------------------------------
  // REPORT RECORDS
  // ------------------------------------------

  const [reports, setReports] = useState([]);


  // ------------------------------------------
  // CURRENT DATE
  // ------------------------------------------

  const [date] = useState(
    getCurrentDate()
  );


  // ------------------------------------------
  // ASSIGNED TASK
  // ------------------------------------------

  const [assignedTask, setAssignedTask] =
    useState("");


  // ------------------------------------------
  // SELECTED REPORT
  // ------------------------------------------

  const [selectedReport, setSelectedReport] =
    useState(null);


  // ------------------------------------------
  // FILE INPUT
  // ------------------------------------------

  const fileInputRef = useRef(null);



  // ==========================================
  // OPEN FILE EXPLORER
  // ==========================================

  const openFileExplorer = () => {

    if (assignedTask.trim() === "") {

      alert(
        "Please enter the assigned task first."
      );

      return;
    }


    fileInputRef.current.click();
  };



  // ==========================================
  // FILE SELECTED
  // ==========================================

  const handleFileChange = (event) => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    const newReport = {

      id: Date.now(),

      date: getCurrentDate(),

      assignedTask:
        assignedTask,

      document: file

    };


    setReports(
      (previousReports) => [

        ...previousReports,

        newReport

      ]
    );


    // Clear assigned task
    setAssignedTask("");


    // Clear file input
    event.target.value = "";
  };



  // ==========================================
  // VIEW REPORT
  // ==========================================

  const handleView = (report) => {

    setSelectedReport(report);

  };



  // ==========================================
  // CLOSE VIEW
  // ==========================================

  const closeView = () => {

    setSelectedReport(null);

  };



  // ==========================================
  // DOWNLOAD REPORT
  // ==========================================

  const handleDownload = (report) => {

    if (!report.document) {

      alert(
        "No document available."
      );

      return;
    }


    const fileUrl =
      URL.createObjectURL(
        report.document
      );


    const link =
      document.createElement("a");


    link.href = fileUrl;


    link.download =
      report.document.name;


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    URL.revokeObjectURL(
      fileUrl
    );
  };



  // ==========================================
  // DELETE REPORT
  // ==========================================

  const deleteReport = (id) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this report?"
      );


    if (!confirmDelete) {
      return;
    }


    setReports(
      (previousReports) =>
        previousReports.filter(
          (report) =>
            report.id !== id
        )
    );
  };



  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div className="reports-page">


      {/* ==================================== */}
      {/* HEADER */}
      {/* ==================================== */}

      <div className="reports-header">


        <div className="reports-labels">

          <span className="reports-badge">

            Work

          </span>


          <span className="reports-workspace">

            MYWORKSPACE

          </span>

        </div>



        <h1>

          Reports

        </h1>



        <p>

          View assigned tasks and upload
          your work documents

        </p>


      </div>



      {/* ==================================== */}
      {/* ADD REPORT CARD */}
      {/* ==================================== */}

      <div className="reports-card">


        <h2>

          Add Report

        </h2>


        <p className="section-description">

          Add your assigned task and upload
          the related document.

        </p>



        <div className="report-form">


          {/* -------------------------------- */}
          {/* DATE */}
          {/* -------------------------------- */}

          <div className="report-form-group">


            <label>

              Date

            </label>


            {/* 
              READ ONLY DATE

              User cannot edit this.
              It automatically shows today's date.
            */}

            <div className="current-date">

              {formatDate(date)}

            </div>


          </div>



          {/* -------------------------------- */}
          {/* ASSIGNED TASK */}
          {/* -------------------------------- */}

          <div className="report-form-group">


            <label>

              Assigned Task

            </label>


            <input
              type="text"
              placeholder="Enter assigned task"
              value={assignedTask}
              onChange={(event) =>
                setAssignedTask(
                  event.target.value
                )
              }
            />


          </div>


        </div>



        {/* ================================= */}
        {/* HIDDEN FILE INPUT */}
        {/* ================================= */}

        <input

          ref={fileInputRef}

          type="file"

          className="hidden-file-input"

          onChange={
            handleFileChange
          }

          accept="
            .pdf,
            .doc,
            .docx,
            .xls,
            .xlsx,
            .ppt,
            .pptx,
            .txt,
            .png,
            .jpg,
            .jpeg
          "

        />



        {/* ================================= */}
        {/* ADD REPORT BUTTON */}
        {/* ================================= */}

        <button

          className="add-report-button"

          onClick={
            openFileExplorer
          }

        >

          + Add Report

        </button>


      </div>



      {/* ==================================== */}
      {/* REPORT RECORDS */}
      {/* ==================================== */}

      <div className="reports-card">


        <div className="records-header">


          <div>


            <h2>

              Report Records

            </h2>


            <p>

              View assigned tasks and
              submitted documents

            </p>


          </div>



          <span className="report-count">

            {reports.length}

            {" "}

            {reports.length === 1
              ? "Report"
              : "Reports"}

          </span>


        </div>



        {/* ================================= */}
        {/* TABLE */}
        {/* ================================= */}

        <div className="reports-table-container">


          <table>


            <thead>

              <tr>

                <th>

                  DATE

                </th>


                <th>

                  ASSIGNED TASK

                </th>


                <th>

                  DOCUMENT

                </th>


                <th>

                  ACTION

                </th>

              </tr>

            </thead>



            <tbody>


              {/* ================================= */}
              {/* NO DATA */}
              {/* ================================= */}

              {reports.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="no-reports"
                  >

                    No report records found

                  </td>

                </tr>

              ) : (


                /* ================================= */
                /* REPORT DATA */
                /* ================================= */

                reports.map(
                  (report) => (

                    <tr
                      key={
                        report.id
                      }
                    >


                      {/* DATE */}

                      <td>

                        {formatDate(
                          report.date
                        )}

                      </td>



                      {/* ASSIGNED TASK */}

                      <td className="task-cell">

                        {
                          report.assignedTask
                        }

                      </td>



                      {/* DOCUMENT */}

                      <td>


                        <div className="uploaded-document">


                          <span className="file-icon">

                            📄

                          </span>


                          <span className="file-name">

                            {
                              report
                                .document
                                .name
                            }

                          </span>


                        </div>


                      </td>



                      {/* ACTION */}

                      <td>


                        <div className="report-actions">


                          {/* VIEW */}

                          <button

                            className="view-report-button"

                            onClick={() =>
                              handleView(
                                report
                              )
                            }

                          >

                            👁 View

                          </button>



                          {/* DOWNLOAD */}

                          <button

                            className="download-report-button"

                            onClick={() =>
                              handleDownload(
                                report
                              )
                            }

                          >

                            ↓ Download

                          </button>



                          {/* DELETE */}

                          <button

                            className="delete-report-button"

                            onClick={() =>
                              deleteReport(
                                report.id
                              )
                            }

                          >

                            Delete

                          </button>


                        </div>


                      </td>


                    </tr>

                  )

                )

              )}


            </tbody>


          </table>


        </div>


      </div>



      {/* ==================================== */}
      {/* VIEW REPORT */}
      {/* ==================================== */}

      {selectedReport && (

        <div className="report-modal-overlay">


          <div className="report-modal">


            {/* ================================= */}
            {/* MODAL HEADER */}
            {/* ================================= */}

            <div className="report-modal-header">


              <div>


                <span className="modal-document-icon">

                  📄

                </span>


                <h2>

                  Report Details

                </h2>


                <p>

                  Report and document information

                </p>


              </div>



              <button

                className="modal-close-button"

                onClick={
                  closeView
                }

              >

                ✕

              </button>


            </div>



            {/* ================================= */}
            {/* REPORT DETAILS */}
            {/* ================================= */}

            <div className="report-details">


              {/* DATE */}

              <div className="report-detail-box">


                <span>

                  Date

                </span>


                <strong>

                  {formatDate(
                    selectedReport.date
                  )}

                </strong>


              </div>



              {/* TASK */}

              <div className="report-detail-box">


                <span>

                  Assigned Task

                </span>


                <strong>

                  {
                    selectedReport
                      .assignedTask
                  }

                </strong>


              </div>



              {/* DOCUMENT */}

              <div className="report-detail-box">


                <span>

                  Document

                </span>


                <strong>

                  {
                    selectedReport
                      .document
                      .name
                  }

                </strong>


              </div>



              {/* STATUS */}

              <div className="report-detail-box">


                <span>

                  Status

                </span>


                <strong className="uploaded-status">

                  Document Uploaded

                </strong>


              </div>


            </div>



            {/* ================================= */}
            {/* DOCUMENT AREA */}
            {/* ================================= */}

            <div className="document-area">


              <div className="document-preview-icon">

                📄

              </div>


              <h3>

                {
                  selectedReport
                    .document
                    .name
                }

              </h3>


              <p>

                Your document has been
                uploaded successfully.

              </p>



              <button

                className="modal-download-button"

                onClick={() =>
                  handleDownload(
                    selectedReport
                  )
                }

              >

                ↓ Download Document

              </button>


            </div>



            {/* ================================= */}
            {/* FOOTER */}
            {/* ================================= */}

            <div className="report-modal-footer">


              <button

                className="modal-close-footer-button"

                onClick={
                  closeView
                }

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


export default Reports;