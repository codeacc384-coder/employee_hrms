import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./Documents.css";

const DOCUMENT_BUCKET = "employee-documents";

export default function Documents() {
  const [currentUser, setCurrentUser] = useState(null);
  const [employee, setEmployee] = useState(null);

  const [personalDocuments, setPersonalDocuments] = useState([]);
  const [requestedDocuments, setRequestedDocuments] = useState([]);

  const [activeTab, setActiveTab] = useState("personal");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [uploadMode, setUploadMode] = useState("personal");

  const [submitting, setSubmitting] = useState(false);

  /* =====================================================
     UPLOAD FORM
  ===================================================== */

  const [uploadForm, setUploadForm] = useState({
    documentType: "Aadhaar Card",
    category: "Identity Proof",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    file: null,
    notes: "",
  });

  /* =====================================================
     EDIT FORM
  ===================================================== */

  const [editForm, setEditForm] = useState({
    documentType: "",
    category: "Identity Proof",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    file: null,
    notes: "",
  });

  /* =====================================================
     REQUEST FORM
  ===================================================== */

  const [requestForm, setRequestForm] = useState({
    requestFrom: "HR",
    targetName: "",
    documentType: "",
    dueDate: "",
    purpose: "",
    priority: "Normal",
    additionalDetails: "",
  });

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {
    loadEmployeeAndDocuments();
  }, []);

  async function loadEmployeeAndDocuments() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("No logged-in user found.");
      }

      setCurrentUser(user);

      /* Get employee ID from profiles */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.employee_id) {
        throw new Error(
          "Employee profile is not linked to this user."
        );
      }

      /* Get employee */

      const {
        data: employeeData,
        error: employeeError,
      } = await supabase
        .from("employees")
        .select("id")
        .eq("id", profile.employee_id)
        .single();

      if (employeeError) {
        throw employeeError;
      }

      setEmployee(employeeData);

      await loadDocuments(employeeData.id);
    } catch (error) {
      console.error("Load error:", error);

      setErrorMessage(
        error.message ||
          "Unable to load employee documents."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOAD DOCUMENTS + REQUESTS
  ===================================================== */

  async function loadDocuments(employeeId) {
    const [
      {
        data: personalData,
        error: personalError,
      },
      {
        data: requestData,
        error: requestError,
      },
    ] = await Promise.all([
      supabase
        .from("employee_documents")
        .select("*")
        .eq("employee_id", employeeId)
        .order("uploaded_at", {
          ascending: false,
        }),

      supabase
        .from("document_requests")
        .select("*")
        .eq("recipient_employee_id", employeeId)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (personalError) {
      throw personalError;
    }

    if (requestError) {
      throw requestError;
    }

    setPersonalDocuments(personalData || []);
    setRequestedDocuments(requestData || []);
  }

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  function formatDate(dateValue) {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  /* =====================================================
     FILE SIZE
  ===================================================== */

  function formatFileSize(size) {
    if (
      size === null ||
      size === undefined ||
      size === ""
    ) {
      return "—";
    }

    const bytes = Number(size);

    if (Number.isNaN(bytes)) {
      return "—";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* =====================================================
     STATUS
  ===================================================== */

  function getStatusClass(status) {
    const value = String(status || "").toLowerCase();

    if (
      value === "verified" ||
      value === "approved" ||
      value === "completed" ||
      value === "submitted"
    ) {
      return "badge-verified";
    }

    return "badge-pending";
  }

  /* =====================================================
     PRIORITY
  ===================================================== */

  function getPriorityClass(priority) {
    const value = String(priority || "").toLowerCase();

    if (value === "urgent") {
      return "badge-urgent";
    }

    if (value === "high") {
      return "badge-high-priority";
    }

    return "badge-normal";
  }

  /* =====================================================
     FILTER DOCUMENTS
  ===================================================== */

  const filteredDocuments = personalDocuments.filter(
    (doc) => {
      const search = searchTerm
        .toLowerCase()
        .trim();

      if (!search) {
        return true;
      }

      return (
        String(doc.document_type || "")
          .toLowerCase()
          .includes(search) ||
        String(doc.file_name || "")
          .toLowerCase()
          .includes(search) ||
        String(doc.category || "")
          .toLowerCase()
          .includes(search) ||
        String(doc.document_number || "")
          .toLowerCase()
          .includes(search) ||
        String(doc.verification_status || "")
          .toLowerCase()
          .includes(search)
      );
    }
  );

  /* =====================================================
     FILTER REQUESTS
  ===================================================== */

  const filteredRequests = requestedDocuments.filter(
    (request) => {
      const search = searchTerm
        .toLowerCase()
        .trim();

      if (!search) {
        return true;
      }

      return (
        String(request.document_type || "")
          .toLowerCase()
          .includes(search) ||
        String(request.request_to || "")
          .toLowerCase()
          .includes(search) ||
        String(request.priority || "")
          .toLowerCase()
          .includes(search) ||
        String(request.status || "")
          .toLowerCase()
          .includes(search) ||
        String(request.reason || "")
          .toLowerCase()
          .includes(search)
      );
    }
  );

  /* =====================================================
     KPI
  ===================================================== */

  const totalDocuments =
    personalDocuments.length;

  const pendingRequests =
    requestedDocuments.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "pending"
    ).length;

  const submittedRequests =
    requestedDocuments.filter((item) => {
      const status = String(
        item.status || ""
      ).toLowerCase();

      return (
        status === "completed" ||
        status === "submitted" ||
        status === "approved"
      );
    }).length;

  const highPriorityRequests =
    requestedDocuments.filter((item) => {
      const priority = String(
        item.priority || ""
      ).toLowerCase();

      return (
        priority === "high" ||
        priority === "urgent"
      );
    }).length;

  /* =====================================================
     RESET UPLOAD FORM
  ===================================================== */

  function resetUploadForm() {
    setUploadForm({
      documentType: "Aadhaar Card",
      category: "Identity Proof",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      file: null,
      notes: "",
    });
  }

  /* =====================================================
     OPEN PERSONAL UPLOAD
  ===================================================== */

  function openPersonalUpload() {
    setUploadMode("personal");
    setSelectedRequest(null);
    resetUploadForm();
    setShowUploadModal(true);
  }

  /* =====================================================
     OPEN REQUESTED UPLOAD
  ===================================================== */

  function openRequestedUpload(request) {
    setUploadMode("requested");
    setSelectedRequest(request);

    setUploadForm({
      documentType:
        request.document_type || "",
      category: "Requested Document",
      documentNumber: "",
      issueDate: "",
      expiryDate: "",
      file: null,
      notes: request.reason || "",
    });

    setShowUploadModal(true);
  }

  /* =====================================================
     FILE VALIDATION
  ===================================================== */

  function validateFile(file) {
    if (!file) {
      return "Please select a file.";
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only PDF, JPG and PNG files are allowed.";
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return "File size must be 5 MB or less.";
    }

    return "";
  }

  /* =====================================================
     CREATE STORAGE PATH
  ===================================================== */

  function createStoragePath(file) {
    const originalName =
      file.name || "document";

    const safeFileName =
      originalName
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        )
        .replace(/_+/g, "_");

    const uniqueId =
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`;

    return `${employee.id}/${uniqueId}-${safeFileName}`;
  }

  /* =====================================================
     UPLOAD DOCUMENT
  ===================================================== */

  async function handleUploadDocument(event) {
    event.preventDefault();

    if (!currentUser || !employee) {
      alert(
        "Employee information is not available."
      );
      return;
    }

    const fileError = validateFile(
      uploadForm.file
    );

    if (fileError) {
      alert(fileError);
      return;
    }

    try {
      setSubmitting(true);

      const file = uploadForm.file;

      const filePath =
        createStoragePath(file);

      /* Upload to Storage */

      const {
        error: storageError,
      } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          }
        );

      if (storageError) {
        throw storageError;
      }

      /* Insert database record */

      const {
        data: insertedDocument,
        error: insertError,
      } = await supabase
        .from("employee_documents")
        .insert({
          employee_id:
            employee.id,

          category:
            uploadMode === "requested"
              ? "Requested Document"
              : uploadForm.category,

          document_type:
            uploadForm.documentType.trim(),

          document_number:
            uploadForm.documentNumber.trim() ||
            null,

          issue_date:
            uploadForm.issueDate || null,

          expiry_date:
            uploadForm.expiryDate || null,

          file_name:
            file.name,

          file_path:
            filePath,

          file_type:
            file.type,

          file_size:
            file.size,

          uploaded_by:
            employee.id,

          uploaded_at:
            new Date().toISOString(),

          verification_status:
            "Pending",
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage
          .from(DOCUMENT_BUCKET)
          .remove([filePath]);

        throw insertError;
      }

      /* Complete request */

      if (
        uploadMode === "requested" &&
        selectedRequest
      ) {
        const {
          error: requestUpdateError,
        } = await supabase
          .from("document_requests")
          .update({
            status: "Completed",

            completed_at:
              new Date().toISOString(),

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            selectedRequest.id
          );

        if (requestUpdateError) {
          if (insertedDocument?.id) {
            await supabase
              .from("employee_documents")
              .delete()
              .eq(
                "id",
                insertedDocument.id
              );
          }

          await supabase.storage
            .from(DOCUMENT_BUCKET)
            .remove([filePath]);

          throw requestUpdateError;
        }
      }

      alert(
        uploadMode === "requested"
          ? "Document submitted successfully."
          : "Document uploaded successfully."
      );

      setShowUploadModal(false);
      setSelectedRequest(null);
      resetUploadForm();

      await loadDocuments(
        employee.id
      );
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      alert(
        error.message ||
          "Unable to upload document."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  function openEditDocument(doc) {
    setEditingDocument(doc);

    setEditForm({
      documentType:
        doc.document_type || "",

      category:
        doc.category ||
        "Identity Proof",

      documentNumber:
        doc.document_number || "",

      issueDate:
        doc.issue_date
          ? String(
              doc.issue_date
            ).substring(0, 10)
          : "",

      expiryDate:
        doc.expiry_date
          ? String(
              doc.expiry_date
            ).substring(0, 10)
          : "",

      file: null,

      notes:
        doc.notes || "",
    });

    setShowEditModal(true);
  }

  /* =====================================================
     EDIT DOCUMENT
  ===================================================== */

  async function handleEditDocument(event) {
    event.preventDefault();

    if (!editingDocument || !employee) {
      alert(
        "Document information is not available."
      );
      return;
    }

    if (
      !editForm.documentType.trim()
    ) {
      alert(
        "Please enter the document type."
      );
      return;
    }

    if (editForm.file) {
      const fileError =
        validateFile(
          editForm.file
        );

      if (fileError) {
        alert(fileError);
        return;
      }
    }

    try {
      setSubmitting(true);

      const oldFilePath =
        editingDocument.file_path;

      let newFilePath =
        oldFilePath;

      let newFileName =
        editingDocument.file_name;

      let newFileType =
        editingDocument.file_type;

      let newFileSize =
        editingDocument.file_size;

      /* Replace file if selected */

      if (editForm.file) {
        const newFile =
          editForm.file;

        newFilePath =
          createStoragePath(
            newFile
          );

        newFileName =
          newFile.name;

        newFileType =
          newFile.type;

        newFileSize =
          newFile.size;

        const {
          error: uploadError,
        } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .upload(
            newFilePath,
            newFile,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                newFile.type,
            }
          );

        if (uploadError) {
          throw uploadError;
        }
      }

      /* Update database */

      const {
        error: updateError,
      } = await supabase
        .from("employee_documents")
        .update({
          document_type:
            editForm.documentType.trim(),

          category:
            editForm.category,

          document_number:
            editForm.documentNumber.trim() ||
            null,

          issue_date:
            editForm.issueDate || null,

          expiry_date:
            editForm.expiryDate || null,

          file_name:
            newFileName,

          file_path:
            newFilePath,

          file_type:
            newFileType,

          file_size:
            newFileSize,

          verification_status:
            "Pending",

          uploaded_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          editingDocument.id
        )
        .eq(
          "employee_id",
          employee.id
        );

      if (updateError) {
        if (
          editForm.file &&
          newFilePath !== oldFilePath
        ) {
          await supabase.storage
            .from(DOCUMENT_BUCKET)
            .remove([
              newFilePath,
            ]);
        }

        throw updateError;
      }

      /* Delete old file */

      if (
        editForm.file &&
        oldFilePath &&
        newFilePath !== oldFilePath
      ) {
        await supabase.storage
          .from(DOCUMENT_BUCKET)
          .remove([
            oldFilePath,
          ]);
      }

      alert(
        "Document updated successfully."
      );

      setShowEditModal(false);
      setEditingDocument(null);

      await loadDocuments(
        employee.id
      );
    } catch (error) {
      console.error(
        "Edit error:",
        error
      );

      alert(
        error.message ||
          "Unable to update document."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     DELETE DOCUMENT
  ===================================================== */

  async function handleDeleteDocument(
    doc
  ) {
    if (!doc?.id) {
      alert(
        "Document ID is not available."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${doc.document_type || doc.file_name || "this document"}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);

      /* Delete database record */

      const {
        error: deleteError,
      } = await supabase
        .from("employee_documents")
        .delete()
        .eq(
          "id",
          doc.id
        )
        .eq(
          "employee_id",
          employee.id
        );

      if (deleteError) {
        throw deleteError;
      }

      /* Delete storage file */

      if (doc.file_path) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(DOCUMENT_BUCKET)
          .remove([
            doc.file_path,
          ]);

        if (storageError) {
          console.warn(
            "Storage deletion error:",
            storageError
          );

          alert(
            "Document record deleted, but the Storage file could not be removed."
          );
        } else {
          alert(
            "Document deleted successfully."
          );
        }
      } else {
        alert(
          "Document deleted successfully."
        );
      }

      await loadDocuments(
        employee.id
      );
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete document."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     VIEW DOCUMENT
  ===================================================== */

  async function handleViewDocument(
    doc
  ) {
    if (!doc?.file_path) {
      alert(
        "File path is not available."
      );
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(
          doc.file_path,
          600
        );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to generate document URL."
        );
      }

      setSelectedDocument({
        ...doc,
        signedUrl:
          data.signedUrl,
      });

      setShowViewModal(true);
    } catch (error) {
      console.error(
        "View error:",
        error
      );

      alert(
        error.message ||
          "Unable to open document."
      );
    }
  }

  /* =====================================================
     DOWNLOAD DOCUMENT
  ===================================================== */

  async function handleDownloadDocument(
    doc
  ) {
    if (!doc?.file_path) {
      alert(
        "File path is not available."
      );
      return;
    }

    try {
      const {
        data,
        error,
      } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(
          doc.file_path,
          600
        );

      if (error) {
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "Unable to generate download URL."
        );
      }

      const response =
        await fetch(
          data.signedUrl
        );

      if (!response.ok) {
        throw new Error(
          "Unable to download the document."
        );
      }

      const blob =
        await response.blob();

      const downloadUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        window.document.createElement(
          "a"
        );

      link.href =
        downloadUrl;

      link.download =
        doc.file_name ||
        "document";

      link.style.display =
        "none";

      window.document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (error) {
      console.error(
        "Download error:",
        error
      );

      alert(
        error.message ||
          "Unable to download document."
      );
    }
  }

  /* =====================================================
     REQUEST FORM RESET
  ===================================================== */

  function resetRequestForm() {
    setRequestForm({
      requestFrom: "HR",
      targetName: "",
      documentType: "",
      dueDate: "",
      purpose: "",
      priority: "Normal",
      additionalDetails: "",
    });
  }

  /* =====================================================
     OPEN REQUEST
  ===================================================== */

  function openRequestModal() {
    resetRequestForm();
    setShowRequestModal(true);
  }

  /* =====================================================
     CREATE REQUEST
  ===================================================== */

  async function handleCreateRequest(event) {
  event.preventDefault();

  if (!currentUser || !employee) {
    alert("Employee information is not available.");
    return;
  }

  if (!requestForm.documentType.trim()) {
    alert("Please enter the document type.");
    return;
  }

  if (!requestForm.dueDate) {
    alert("Please select a due date.");
    return;
  }

  if (!requestForm.purpose.trim()) {
    alert("Please enter the purpose.");
    return;
  }

  const allowedPriorities = [
    "Normal",
    "High",
    "Urgent",
  ];

  if (!allowedPriorities.includes(requestForm.priority)) {
    alert("Please select a valid priority.");
    return;
  }

  try {
    setSubmitting(true);

    /*
      DATABASE CONSTRAINT:

      request_to can only contain:
      Employee
      Team Leader

      UI values are:
      HR
      Team Lead

      Therefore we convert the UI value
      before inserting into Supabase.
    */

    const target =
      requestForm.requestFrom === "HR"
        ? "Employee"
        : "Team Leader";

    /*
      Keep the purpose as the main reason.
      If the user entered a recipient name,
      save that name inside the reason instead
      of putting it into request_to, because
      request_to only accepts Employee / Team Leader.
    */

    let reason = requestForm.purpose.trim();

    if (requestForm.targetName.trim()) {
      reason +=
        `\n\nRecipient Name: ${requestForm.targetName.trim()}`;
    }

    if (requestForm.additionalDetails.trim()) {
      reason +=
        `\n\nAdditional details: ${requestForm.additionalDetails.trim()}`;
    }

    console.log("Document request being submitted:", {
      request_to: target,
      recipient_employee_id: employee.id,
      document_type: requestForm.documentType.trim(),
      due_date: requestForm.dueDate,
      priority: requestForm.priority,
      reason,
      status: "Pending",
      created_by: employee.id,
    });

    const { error } = await supabase
      .from("document_requests")
      .insert({
        request_to: target,

        recipient_employee_id:
          employee.id,

        document_type:
          requestForm.documentType.trim(),

        due_date:
          requestForm.dueDate,

        priority:
          requestForm.priority,

        reason,

        status:
          "Pending",

        created_by:
          employee.id,

        created_at:
          new Date().toISOString(),
      });

    if (error) {
      throw error;
    }

    alert(
      "Document request created successfully."
    );

    setShowRequestModal(false);

    resetRequestForm();

    await loadDocuments(employee.id);

  } catch (error) {
    console.error(
      "Request error:",
      error
    );

    alert(
      error.message ||
        "Unable to create document request."
    );

  } finally {
    setSubmitting(false);
  }
}

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="docs-page-container">
        <div className="docs-loading">
          Loading documents...
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    errorMessage &&
    !employee
  ) {
    return (
      <div className="docs-page-container">
        <div className="docs-error">
          <h2>
            Unable to load Documents
          </h2>

          <p>
            {errorMessage}
          </p>

          <button
            className="btn-upload-trigger"
            onClick={
              loadEmployeeAndDocuments
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <div className="docs-page-container">

      {/* =================================================
          BREADCRUMB
      ================================================= */}

      <div className="docs-breadcrumb">
        <span>
          Employee Portal
        </span>

        <span>/</span>

        <span>
          Documents
        </span>
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="docs-header-row">

        <div>
          <h1 className="docs-main-title">
            Documents
          </h1>

          <p className="docs-subtitle">
            Manage your personal documents
            and document requests.
          </p>
        </div>

        <div className="docs-header-actions">

          <button
            className="btn-upload-trigger"
            onClick={
              openPersonalUpload
            }
          >
            ＋ Upload Document
          </button>

          <button
            className="btn-request-trigger"
            onClick={
              openRequestModal
            }
          >
            ＋ Request Document
          </button>

        </div>

      </div>

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="docs-kpi-grid">

        <div className="kpi-card">

          <div className="kpi-icon-box file-icon">
            📄
          </div>

          <div>
            <div className="kpi-title">
              My Documents
            </div>

            <div className="kpi-number">
              {totalDocuments}
            </div>
          </div>

        </div>

        <div className="kpi-card">

          <div className="kpi-icon-box pending-icon">
            ⏳
          </div>

          <div>
            <div className="kpi-title">
              Pending Requests
            </div>

            <div className="kpi-number">
              {pendingRequests}
            </div>
          </div>

        </div>

        <div className="kpi-card">

          <div className="kpi-icon-box submitted-icon">
            ✓
          </div>

          <div>
            <div className="kpi-title">
              Submitted
            </div>

            <div className="kpi-number">
              {submittedRequests}
            </div>
          </div>

        </div>

        <div className="kpi-card">

          <div className="kpi-icon-box priority-icon">
            !
          </div>

          <div>
            <div className="kpi-title">
              High / Urgent
            </div>

            <div className="kpi-number">
              {highPriorityRequests}
            </div>
          </div>

        </div>

      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="docs-tab-bar">

        <button
          className={`tab-btn ${
            activeTab === "personal"
              ? "active"
              : ""
          }`}
          onClick={() => {
            setActiveTab(
              "personal"
            );
            setSearchTerm("");
          }}
        >
          My Documents

          <span className="tab-counter">
            {
              personalDocuments.length
            }
          </span>
        </button>

        <button
          className={`tab-btn ${
            activeTab === "requested"
              ? "active"
              : ""
          }`}
          onClick={() => {
            setActiveTab(
              "requested"
            );
            setSearchTerm("");
          }}
        >
          Document Requests

          <span className="tab-counter">
            {
              requestedDocuments.length
            }
          </span>
        </button>

      </div>

      {/* =================================================
          MY DOCUMENTS
      ================================================= */}

      {activeTab === "personal" && (
        <section className="documents-section">

          <div className="documents-table-header">

            <div>
              <h2>
                Submitted Documents
              </h2>

              <p>
                Documents uploaded to
                your employee profile.
              </p>
            </div>

            <div className="documents-search">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search..."
                value={
                  searchTerm
                }
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {filteredDocuments.length ===
          0 ? (

            <div className="empty-documents">
              <div className="empty-icon">
                📄
              </div>

              <h3>
                No documents found
              </h3>

              <p>
                {searchTerm
                  ? "No documents match your search."
                  : "Upload your first document using the button above."}
              </p>

              {!searchTerm && (
                <button
                  className="btn-upload-trigger"
                  onClick={
                    openPersonalUpload
                  }
                >
                  ＋ Upload Document
                </button>
              )}
            </div>

          ) : (

            <div className="documents-table-wrapper">

              <table className="documents-table">

                <thead>

                  <tr>

                    <th>
                      Document
                    </th>

                    <th>
                      File
                    </th>

                    <th>
                      Uploaded
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredDocuments.map(
                    (doc) => (

                      <tr
                        key={
                          doc.id
                        }
                      >

                        {/* DOCUMENT */}

                        <td>

                          <div className="table-document">

                            <div className="table-document-icon">
                              📄
                            </div>

                            <div>

                              <div className="table-document-name">
                                {
                                  doc.document_type ||
                                  "Document"
                                }
                              </div>

                              <div className="table-document-category">
                                {
                                  doc.category ||
                                  "—"
                                }
                              </div>

                            </div>

                          </div>

                        </td>

                        {/* FILE */}

                        <td>

                          <div className="table-file-name">
                            {
                              doc.file_name ||
                              "—"
                            }
                          </div>

                          <div className="table-file-size">
                            {
                              formatFileSize(
                                doc.file_size
                              )
                            }
                          </div>

                        </td>

                        {/* UPLOADED */}

                        <td>
                          <span className="table-date">
                            {
                              formatDate(
                                doc.uploaded_at
                              )
                            }
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`table-status ${getStatusClass(
                              doc.verification_status
                            )}`}
                          >
                            <span className="status-dot">
                              ✓
                            </span>

                            {
                              doc.verification_status ||
                              "Pending"
                            }

                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="table-actions">

                            {/* VIEW */}

                            <button
                              className="table-action view-action"
                              title="View"
                              onClick={() =>
                                handleViewDocument(
                                  doc
                                )
                              }
                            >
                              👁
                            </button>

                            {/* DOWNLOAD */}

                            <button
                              className="table-action download-action"
                              title="Download"
                              onClick={() =>
                                handleDownloadDocument(
                                  doc
                                )
                              }
                            >
                              ↓
                            </button>

                            {/* EDIT */}

                            <button
                              className="table-action edit-action"
                              title="Edit"
                              onClick={() =>
                                openEditDocument(
                                  doc
                                )
                              }
                            >
                              ✎
                            </button>

                            {/* DELETE */}

                            <button
                              className="table-action delete-action"
                              title="Delete"
                              disabled={
                                submitting
                              }
                              onClick={() =>
                                handleDeleteDocument(
                                  doc
                                )
                              }
                            >
                              🗑
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>
      )}

      {/* =================================================
          DOCUMENT REQUESTS
      ================================================= */}

      {activeTab === "requested" && (
        <section className="documents-section">

          <div className="documents-table-header">

            <div>
              <h2>
                Document Requests
              </h2>

              <p>
                Documents requested from
                you by HR or your team lead.
              </p>
            </div>

            <div className="documents-search">

              <span className="search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search..."
                value={
                  searchTerm
                }
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {filteredRequests.length ===
          0 ? (

            <div className="empty-documents">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No document requests
              </h3>

              <p>
                {searchTerm
                  ? "No requests match your search."
                  : "You currently don't have any document requests."}
              </p>

            </div>

          ) : (

            <div className="documents-table-wrapper">

              <table className="documents-table requests-table">

                <thead>

                  <tr>

                    <th>
                      Document
                    </th>

                    <th>
                      Requested To
                    </th>

                    <th>
                      Requested
                    </th>

                    <th>
                      Due Date
                    </th>

                    <th>
                      Priority
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRequests.map(
                    (request) => {

                      const status =
                        String(
                          request.status ||
                          ""
                        ).toLowerCase();

                      const isPending =
                        status ===
                        "pending";

                      return (

                        <tr
                          key={
                            request.id
                          }
                        >

                          {/* DOCUMENT */}

                          <td>

                            <div className="table-document">

                              <div className="table-document-icon request-table-icon">
                                📋
                              </div>

                              <div>

                                <div className="table-document-name">
                                  {
                                    request.document_type ||
                                    "Document Request"
                                  }
                                </div>

                                <div className="table-document-category request-purpose">
                                  {
                                    request.reason
                                      ? request.reason
                                          .split(
                                            "\n"
                                          )[0]
                                      : "No purpose provided"
                                  }
                                </div>

                              </div>

                            </div>

                          </td>

                          {/* REQUESTED TO */}

                          <td>

                            <span className="requested-person">
                              {
                                request.request_to ||
                                "—"
                              }
                            </span>

                          </td>

                          {/* REQUESTED DATE */}

                          <td>

                            <span className="table-date">
                              {
                                formatDate(
                                  request.created_at
                                )
                              }
                            </span>

                          </td>

                          {/* DUE DATE */}

                          <td>

                            <span className="due-date-text">
                              {
                                request.due_date
                                  ? formatDate(
                                      request.due_date
                                    )
                                  : "—"
                              }
                            </span>

                          </td>

                          {/* PRIORITY */}

                          <td>

                            <span
                              className={`table-status priority-status ${getPriorityClass(
                                request.priority
                              )}`}
                            >

                              {request.priority ||
                                "Normal"}

                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={`table-status ${getStatusClass(
                                request.status
                              )}`}
                            >

                              <span className="status-dot">
                                {isPending
                                  ? "!"
                                  : "✓"}
                              </span>

                              {
                                request.status ||
                                "Pending"
                              }

                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="table-actions">

                              {isPending ? (

                                <button
                                  className="request-submit-button"
                                  onClick={() =>
                                    openRequestedUpload(
                                      request
                                    )
                                  }
                                  title="Upload and submit document"
                                >
                                  Upload
                                </button>

                              ) : (

                                <span className="completed-label">
                                  Completed
                                </span>

                              )}

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>
      )}

      {/* =================================================
          UPLOAD MODAL
      ================================================= */}

      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!submitting) {
              setShowUploadModal(
                false
              );
            }
          }}
        >

          <div
            className="modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {uploadMode ===
                  "requested"
                    ? "Submit Requested Document"
                    : "Upload Document"}
                </h2>

                <p className="modal-sub">
                  {uploadMode ===
                  "requested"
                    ? "Upload the requested document and submit it."
                    : "Upload a document to your employee profile."}
                </p>

              </div>

              <button
                className="modal-close-btn"
                onClick={() =>
                  !submitting &&
                  setShowUploadModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <form
              className="modal-body"
              onSubmit={
                handleUploadDocument
              }
            >

              <div className="form-group">

                <label>
                  Document Type
                </label>

                <input
                  type="text"
                  value={
                    uploadForm.documentType
                  }
                  onChange={(event) =>
                    setUploadForm(
                      (previous) => ({
                        ...previous,
                        documentType:
                          event.target
                            .value,
                      })
                    )
                  }
                  required
                />

              </div>

              {uploadMode ===
                "personal" && (
                <>

                  <div className="form-group">

                    <label>
                      Category
                    </label>

                    <select
                      value={
                        uploadForm.category
                      }
                      onChange={(event) =>
                        setUploadForm(
                          (previous) => ({
                            ...previous,
                            category:
                              event.target
                                .value,
                          })
                        )
                      }
                    >

                      <option value="Identity Proof">
                        Identity Proof
                      </option>

                      <option value="Education">
                        Education
                      </option>

                      <option value="Personal">
                        Personal
                      </option>

                      <option value="Employment">
                        Employment
                      </option>

                      <option value="Address Proof">
                        Address Proof
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Document Number
                    </label>

                    <input
                      type="text"
                      value={
                        uploadForm.documentNumber
                      }
                      onChange={(event) =>
                        setUploadForm(
                          (previous) => ({
                            ...previous,
                            documentNumber:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="Optional"
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Issue Date
                    </label>

                    <input
                      type="date"
                      value={
                        uploadForm.issueDate
                      }
                      onChange={(event) =>
                        setUploadForm(
                          (previous) => ({
                            ...previous,
                            issueDate:
                              event.target
                                .value,
                          })
                        )
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Expiry Date
                    </label>

                    <input
                      type="date"
                      value={
                        uploadForm.expiryDate
                      }
                      onChange={(event) =>
                        setUploadForm(
                          (previous) => ({
                            ...previous,
                            expiryDate:
                              event.target
                                .value,
                          })
                        )
                      }
                    />

                  </div>

                </>
              )}

              {uploadMode ===
                "requested" &&
                selectedRequest && (

                  <div className="request-info-box">

                    <strong>
                      Requested Document:
                    </strong>

                    <div>
                      {
                        selectedRequest.document_type
                      }
                    </div>

                    {selectedRequest.due_date && (
                      <div>
                        Due date:{" "}
                        {
                          formatDate(
                            selectedRequest.due_date
                          )
                        }
                      </div>
                    )}

                  </div>

                )}

              <div className="form-group">

                <label>
                  File
                </label>

                <input
                  className="file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) =>
                    setUploadForm(
                      (previous) => ({
                        ...previous,
                        file:
                          event.target
                            .files?.[0] ||
                          null,
                      })
                    )
                  }
                  required
                />

                <small>
                  Accepted: PDF, JPG,
                  PNG. Maximum size: 5 MB.
                </small>

              </div>

              <div className="form-group">

                <label>
                  Notes
                </label>

                <textarea
                  rows="4"
                  value={
                    uploadForm.notes
                  }
                  onChange={(event) =>
                    setUploadForm(
                      (previous) => ({
                        ...previous,
                        notes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional notes"
                />

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() =>
                    !submitting &&
                    setShowUploadModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Uploading..."
                    : uploadMode ===
                      "requested"
                    ? "Submit Document"
                    : "Upload Document"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {showEditModal &&
        editingDocument && (

          <div
            className="modal-overlay"
            onClick={() => {
              if (!submitting) {
                setShowEditModal(
                  false
                );
              }
            }}
          >

            <div
              className="modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    Edit Document
                  </h2>

                  <p className="modal-sub">
                    Change document
                    information or
                    replace the file.
                  </p>

                </div>

                <button
                  className="modal-close-btn"
                  onClick={() =>
                    !submitting &&
                    setShowEditModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="modal-body"
                onSubmit={
                  handleEditDocument
                }
              >

                <div className="form-group">

                  <label>
                    Document Type
                  </label>

                  <input
                    type="text"
                    value={
                      editForm.documentType
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          documentType:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    value={
                      editForm.category
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          category:
                            event.target
                              .value,
                        })
                      )
                    }
                  >

                    <option value="Identity Proof">
                      Identity Proof
                    </option>

                    <option value="Education">
                      Education
                    </option>

                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Employment">
                      Employment
                    </option>

                    <option value="Address Proof">
                      Address Proof
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Document Number
                  </label>

                  <input
                    type="text"
                    value={
                      editForm.documentNumber
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          documentNumber:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Optional"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Issue Date
                  </label>

                  <input
                    type="date"
                    value={
                      editForm.issueDate
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          issueDate:
                            event.target
                              .value,
                        })
                      )
                    }
                  />

                </div>

                <div className="form-group">

                  <label>
                    Expiry Date
                  </label>

                  <input
                    type="date"
                    value={
                      editForm.expiryDate
                    }
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          expiryDate:
                            event.target
                              .value,
                        })
                      )
                    }
                  />

                </div>

                <div className="current-file-box">

                  <strong>
                    Current File
                  </strong>

                  <div>
                    {
                      editingDocument.file_name ||
                      "No file"
                    }
                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Replace File
                  </label>

                  <input
                    className="file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) =>
                      setEditForm(
                        (previous) => ({
                          ...previous,
                          file:
                            event.target
                              .files?.[0] ||
                            null,
                        })
                      )
                    }
                  />

                  <small>
                    Leave empty if you
                    only want to edit
                    the information.
                  </small>

                </div>

                <div className="modal-warning">

                  <strong>
                    Note:
                  </strong>{" "}
                  Editing a document
                  changes its verification
                  status back to Pending.

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() =>
                      !submitting &&
                      setShowEditModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={
                      submitting
                    }
                  >
                    {submitting
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      {/* =================================================
          REQUEST DOCUMENT MODAL
      ================================================= */}

      {showRequestModal && (

        <div
          className="modal-overlay"
          onClick={() => {
            if (!submitting) {
              setShowRequestModal(
                false
              );
            }
          }}
        >

          <div
            className="req-modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="req-modal-header">

              <div className="req-header-left">

                <div className="req-icon-badge">
                  📋
                </div>

                <div>

                  <div className="req-tagline">
                    DOCUMENT REQUEST
                  </div>

                  <div className="req-heading">
                    Request a Document
                  </div>

                  <div className="req-subheading">
                    Submit a request to
                    HR or your team lead.
                  </div>

                </div>

              </div>

              <button
                className="req-close-btn"
                onClick={() =>
                  !submitting &&
                  setShowRequestModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleCreateRequest
              }
            >

              <div className="req-target-section">

                <div className="req-field-title">
                  Request document from
                </div>

                <div className="req-radio-grid">

                  <div
                    className={`req-radio-card ${
                      requestForm.requestFrom ===
                      "HR"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          requestFrom:
                            "HR",
                        })
                      )
                    }
                  >

                    <div className="req-custom-radio">

                      <div
                        className={`radio-dot ${
                          requestForm.requestFrom ===
                          "HR"
                            ? "checked"
                            : ""
                        }`}
                      />

                    </div>

                    <div>

                      <div className="radio-label-title">
                        HR
                      </div>

                      <div className="radio-label-desc">
                        Human Resources
                      </div>

                    </div>

                  </div>

                  <div
                    className={`req-radio-card ${
                      requestForm.requestFrom ===
                      "Team Lead"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          requestFrom:
                            "Team Lead",
                        })
                      )
                    }
                  >

                    <div className="req-custom-radio">

                      <div
                        className={`radio-dot ${
                          requestForm.requestFrom ===
                          "Team Lead"
                            ? "checked"
                            : ""
                        }`}
                      />

                    </div>

                    <div>

                      <div className="radio-label-title">
                        Team Lead
                      </div>

                      <div className="radio-label-desc">
                        Reporting Manager
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <div className="req-form-grid">

                <div className="req-form-group">

                  <label>
                    Recipient Name
                  </label>

                  <input
                    type="text"
                    value={
                      requestForm.targetName
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          targetName:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder={
                      requestForm.requestFrom ===
                      "HR"
                        ? "HR Manager"
                        : "Team Lead name"
                    }
                  />

                </div>

                <div className="req-form-group">

                  <label>
                    Document Type
                  </label>

                  <input
                    type="text"
                    value={
                      requestForm.documentType
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          documentType:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Enter document type"
                    required
                  />

                </div>

                <div className="req-form-group">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={
                      requestForm.dueDate
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          dueDate:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />

                </div>

                <div className="req-form-group">

                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      requestForm.priority
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          priority:
                            event.target
                              .value,
                        })
                      )
                    }
                  >

                    <option value="Normal">
                      Normal
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Urgent">
                      Urgent
                    </option>

                  </select>

                </div>

                <div className="req-form-group full-width">

                  <label>
                    Purpose
                  </label>

                  <textarea
                    rows="3"
                    value={
                      requestForm.purpose
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          purpose:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Why do you need this document?"
                    required
                  />

                </div>

                <div className="req-form-group full-width">

                  <label>
                    Additional Details
                  </label>

                  <textarea
                    rows="3"
                    value={
                      requestForm.additionalDetails
                    }
                    onChange={(event) =>
                      setRequestForm(
                        (previous) => ({
                          ...previous,
                          additionalDetails:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Add any additional information"
                  />

                </div>

              </div>

              <div className="req-modal-footer">

                <button
                  type="button"
                  className="btn-req-cancel"
                  onClick={() =>
                    !submitting &&
                    setShowRequestModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-req-submit"
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Send Request"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          VIEW DOCUMENT MODAL
      ================================================= */}

      {showViewModal &&
        selectedDocument && (

          <div
            className="modal-overlay"
            onClick={() =>
              setShowViewModal(
                false
              )
            }
          >

            <div
              className="modal-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">

                <div>

                  <h2>
                    {
                      selectedDocument.document_type ||
                      "Document"
                    }
                  </h2>

                  <p className="modal-sub">
                    {
                      selectedDocument.file_name ||
                      "Document"
                    }
                  </p>

                </div>

                <button
                  className="modal-close-btn"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="modal-body">

                <div className="view-document-content">

                  <div className="view-document-icon">
                    📄
                  </div>

                  <h3>
                    {
                      selectedDocument.file_name
                    }
                  </h3>

                  <p>
                    {
                      selectedDocument.category ||
                      "Document"
                    }
                  </p>

                  <p>
                    Status:{" "}
                    {
                      selectedDocument.verification_status ||
                      "Pending"
                    }
                  </p>

                  <p>
                    Uploaded:{" "}
                    {
                      formatDate(
                        selectedDocument.uploaded_at
                      )
                    }
                  </p>

                  <button
                    className="btn-submit"
                    onClick={() => {
                      if (
                        selectedDocument.signedUrl
                      ) {
                        window.open(
                          selectedDocument.signedUrl,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    Open Document
                  </button>

                </div>

              </div>

              <div className="modal-footer">

                <button
                  className="btn-cancel"
                  onClick={() =>
                    setShowViewModal(
                      false
                    )
                  }
                >
                  Close
                </button>

                <button
                  className="btn-submit"
                  onClick={() =>
                    handleDownloadDocument(
                      selectedDocument
                    )
                  }
                >
                  Download
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}