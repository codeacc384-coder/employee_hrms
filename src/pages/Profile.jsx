import React, { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { supabase } from "../lib/supabase"; 
import "./Profile.css"; 
 
export default function Profile() { 
  const navigate = useNavigate(); 
 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(""); 
 
  const [employee, setEmployee] = useState(null); 
 
  const [editingPersonal, setEditingPersonal] = useState(false); 
  const [editingContact, setEditingContact] = useState(false); 
 
  const [personalInfo, setPersonalInfo] = useState({ 
    fullName: "", 
    dateOfBirth: "", 
    gender: "", 
    phone: "", 
    email: "", 
    address: "" 
  }); 
 
  const [contactInfo, setContactInfo] = useState({ 
    workEmail: "", 
    phoneNumber: "", 
    location: "" 
  }); 
 
  /* ===================================================== 
     LOAD LOGGED-IN EMPLOYEE 
  ===================================================== */ 
 
  useEffect(() => { 
    loadEmployeeProfile(); 
  }, []); 
 
  const loadEmployeeProfile = async () => { 
    try { 
      setLoading(true); 
      setError(""); 
 
      /* ================================================ 
         1. GET CURRENT AUTHENTICATED USER 
      ================================================ */ 
 
      const { 
        data: { user }, 
        error: userError 
      } = await supabase.auth.getUser(); 
 
      if (userError) { 
        console.error("Auth user error:", userError); 
        setError("Unable to get logged-in user."); 
        setLoading(false); 
        return; 
      } 
 
      if (!user) { 
        navigate("/login"); 
        return; 
      } 
 
      /* ================================================ 
         2. GET PROFILE 
          
         profiles.id = auth.users.id 
      ================================================ */ 
 
      const { data: profile, error: profileError } = 
        await supabase 
          .from("profiles") 
          .select("*") 
          .eq("id", user.id) 
          .maybeSingle(); 
 
      if (profileError) { 
        console.error( 
          "Profile query error:", 
          profileError 
        ); 
 
        setError("Unable to load employee profile."); 
        setLoading(false); 
        return; 
      } 
 
      if (!profile) { 
        setError("Employee profile not found."); 
        setLoading(false); 
        return; 
      } 
 
      /* ================================================ 
         3. CHECK ROLE 
      ================================================ */ 
 
      if ( 
        String(profile.role || "") 
          .trim() 
          .toLowerCase() !== "employee" 
      ) { 
        await supabase.auth.signOut(); 
        navigate("/login"); 
        return; 
      } 
 
      /* ================================================ 
         4. GET EMPLOYEE USING employee_id 
      ================================================ */ 
 
      const { data: employeeData, error: employeeError } = 
        await supabase 
          .from("employees") 
          .select("*") 
          .eq("id", profile.employee_id) 
          .maybeSingle(); 
 
      if (employeeError) { 
        console.error( 
          "Employee query error:", 
          employeeError 
        ); 
 
        setError("Unable to load employee information."); 
        setLoading(false); 
        return; 
      } 
 
      if (!employeeData) { 
        setError( 
          "Employee information was not found in the database." 
        ); 
 
        setLoading(false); 
        return; 
      } 
 
      /* ================================================ 
         5. SAVE EMPLOYEE DATA 
      ================================================ */ 
 
      setEmployee(employeeData); 
 
      /* ================================================ 
         6. SET PERSONAL INFORMATION 
      ================================================ */ 
 
      setPersonalInfo({ 
        fullName: employeeData.full_name || "", 
        dateOfBirth: employeeData.date_of_birth || "", 
        gender: employeeData.gender || "", 
        phone: employeeData.phone || "", 
        email: employeeData.personal_email || "", 
        address: employeeData.address || "" 
      }); 
 
      /* ================================================ 
         7. SET CONTACT INFORMATION 
      ================================================ */ 
 
      setContactInfo({ 
        workEmail: employeeData.work_email || "", 
        phoneNumber: employeeData.phone || "", 
        location: employeeData.location || "" 
      }); 
 
      setLoading(false); 
 
    } catch (err) { 
      console.error("Profile loading error:", err); 
 
      setError( 
        "Something went wrong while loading your profile." 
      ); 
 
      setLoading(false); 
    } 
  }; 
 
  /* ===================================================== 
     PERSONAL INFORMATION CHANGE 
  ===================================================== */ 
 
  const handlePersonalChange = (e) => { 
    const { name, value } = e.target; 
 
    setPersonalInfo((prev) => ({ 
      ...prev, 
      [name]: value 
    })); 
  }; 
 
  /* ===================================================== 
     CONTACT INFORMATION CHANGE 
  ===================================================== */ 
 
  const handleContactChange = (e) => { 
    const { name, value } = e.target; 
 
    setContactInfo((prev) => ({ 
      ...prev, 
      [name]: value 
    })); 
  }; 
 
  /* ===================================================== 
     SAVE PERSONAL INFORMATION 
  ===================================================== */ 
 
  const savePersonalInformation = async () => { 
    if (!employee?.id) { 
      return; 
    } 
 
    try { 
      const { data, error: updateError } = 
        await supabase 
          .from("employees") 
          .update({ 
            full_name: personalInfo.fullName, 
            date_of_birth: 
              personalInfo.dateOfBirth || null, 
            gender: personalInfo.gender, 
            phone: personalInfo.phone, 
            personal_email: personalInfo.email, 
            address: personalInfo.address, 
            updated_at: new Date().toISOString() 
          }) 
          .eq("id", employee.id) 
          .select() 
          .single(); 
 
      if (updateError) { 
        console.error( 
          "Personal information update error:", 
          updateError 
        ); 
 
        alert( 
          "Unable to save personal information." 
        ); 
 
        return; 
      } 
 
      setEmployee(data); 
 
      setEditingPersonal(false); 
 
      alert( 
        "Personal information updated successfully." 
      ); 
 
    } catch (err) { 
      console.error(err); 
 
      alert( 
        "Something went wrong while saving." 
      ); 
    } 
  }; 
 
  /* ===================================================== 
     SAVE CONTACT INFORMATION 
  ===================================================== */ 
 
  const saveContactInformation = async () => { 
    if (!employee?.id) { 
      return; 
    } 
 
    try { 
      const { data, error: updateError } = 
        await supabase 
          .from("employees") 
          .update({ 
            work_email: contactInfo.workEmail, 
            phone: contactInfo.phoneNumber, 
            location: contactInfo.location, 
            updated_at: new Date().toISOString() 
          }) 
          .eq("id", employee.id) 
          .select() 
          .single(); 
 
      if (updateError) { 
        console.error( 
          "Contact information update error:", 
          updateError 
        ); 
 
        alert( 
          "Unable to save contact information." 
        ); 
 
        return; 
      } 
 
      setEmployee(data); 
 
      setContactInfo({ 
        workEmail: data.work_email || "", 
        phoneNumber: data.phone || "", 
        location: data.location || "" 
      }); 
 
      setEditingContact(false); 
 
      alert( 
        "Contact information updated successfully." 
      ); 
 
    } catch (err) { 
      console.error(err); 
 
      alert( 
        "Something went wrong while saving." 
      ); 
    } 
  }; 
 
  /* ===================================================== 
     EDIT BUTTON HANDLER 
  ===================================================== */ 
 
  const handlePersonalEdit = () => { 
    if (editingPersonal) { 
      savePersonalInformation(); 
    } else { 
      setEditingPersonal(true); 
    } 
  }; 
 
  const handleContactEdit = () => { 
    if (editingContact) { 
      saveContactInformation(); 
    } else { 
      setEditingContact(true); 
    } 
  }; 
 
  /* ===================================================== 
     LOADING 
  ===================================================== */ 
 
  if (loading) { 
    return ( 
      <div className="profile-page-wrapper"> 
        <div 
          style={{ 
            padding: "40px", 
            textAlign: "center" 
          }} 
        > 
          Loading your profile... 
        </div> 
      </div> 
    ); 
  } 
 
  /* ===================================================== 
     ERROR 
  ===================================================== */ 
 
  if (error) { 
    return ( 
      <div className="profile-page-wrapper"> 
        <div 
          style={{ 
            padding: "40px", 
            textAlign: "center", 
            color: "#dc2626" 
          }} 
        > 
          <h2>Unable to load profile</h2> 
 
          <p>{error}</p> 
 
          <button 
            onClick={() => navigate("/login")} 
            style={{ 
              marginTop: "20px", 
              padding: "10px 20px", 
              border: "none", 
              borderRadius: "8px", 
              background: "#2563eb", 
              color: "#fff", 
              cursor: "pointer" 
            }} 
          > 
            Go to Login 
          </button> 
        </div> 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="profile-page-wrapper"> 
 
      {/* ================================================= 
          HEADER 
      ================================================= */} 
 
      <div className="profile-header-bar"> 
 
        <div className="profile-header-text"> 
 
          <h1> 
            My Profile 
          </h1> 
 
          <p> 
            View and manage your personal and work information. 
          </p> 
 
        </div> 
 
 
        <button 
          className="header-settings-btn" 
          onClick={() => navigate("/settings")} 
          title="Go to Account Settings" 
        > 
 
          <svg 
            className="settings-icon" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          > 
 
            <circle 
              cx="12" 
              cy="12" 
              r="3" 
            /> 
 
            <path 
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
            /> 
 
          </svg> 
 
          <span> 
            Settings 
          </span> 
 
        </button> 
 
      </div> 
 
 
      {/* ================================================= 
          TOP ROW 
      ================================================= */} 
 
      <div className="profile-grid-row"> 
 
        {/* ================================================= 
            AVATAR CARD 
        ================================================= */} 
 
        <div className="profile-card avatar-card"> 
 
          <div className="avatar-wrapper"> 
 
            <div className="avatar-circle"> 
 
              <svg 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="#64748b" 
              > 
 
                <path 
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" 
                /> 
 
              </svg> 
 
            </div> 
 
            <button className="avatar-badge-btn"> 
              + 
            </button> 
 
          </div> 
 
 
          <h3 className="profile-user-name"> 
            {employee.full_name || 
              `${employee.first_name || ""} ${employee.last_name || ""}`} 
          </h3> 
 
 
          <p className="profile-user-role"> 
            {employee.role || "Employee"} 
          </p> 
 
 
          <div className="avatar-meta-bar"> 
 
            <div> 
 
              <span className="meta-label"> 
                Employee ID 
              </span> 
 
              <span className="meta-value"> 
                {employee.employee_code || "-"} 
              </span> 
 
            </div> 
 
 
            <div> 
 
              <span className="meta-label"> 
                Department 
              </span> 
 
              <span className="meta-value"> 
                {employee.department || "-"} 
              </span> 
 
            </div> 
 
 
            <div> 
 
              <span className="meta-label"> 
                Location 
              </span> 
 
              <span className="meta-value"> 
                {employee.location || "-"} 
              </span> 
 
            </div> 
 
          </div> 
 
        </div> 
 
 
        {/* ================================================= 
            PERSONAL INFORMATION 
        ================================================= */} 
 
        <div className="profile-card info-card"> 
 
          <div className="card-section-header"> 
 
            <h3> 
              Personal Information 
            </h3> 
 
            <button 
              className="edit-btn" 
              onClick={handlePersonalEdit} 
            > 
              {editingPersonal 
                ? "💾 Save" 
                : "✏️ Edit"} 
            </button> 
 
          </div> 
 
 
          <div className="info-fields-grid"> 
 
            {/* FULL NAME */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Full Name 
              </span> 
 
              {editingPersonal ? ( 
 
                <input 
                  className="edit-input" 
                  name="fullName" 
                  value={personalInfo.fullName} 
                  onChange={handlePersonalChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.fullName || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* DATE OF BIRTH */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Date of Birth 
              </span> 
 
              {editingPersonal ? ( 
 
                <input 
                  className="edit-input" 
                  type="date" 
                  name="dateOfBirth" 
                  value={personalInfo.dateOfBirth} 
                  onChange={handlePersonalChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.dateOfBirth || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* GENDER */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Gender 
              </span> 
 
              {editingPersonal ? ( 
 
                <select 
                  className="edit-input" 
                  name="gender" 
                  value={personalInfo.gender} 
                  onChange={handlePersonalChange} 
                > 
 
                  <option value=""> 
                    Select 
                  </option> 
 
                  <option value="Male"> 
                    Male 
                  </option> 
 
                  <option value="Female"> 
                    Female 
                  </option> 
 
                  <option value="Other"> 
                    Other 
                  </option> 
 
                </select> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.gender || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* PHONE */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Phone 
              </span> 
 
              {editingPersonal ? ( 
 
                <input 
                  className="edit-input" 
                  name="phone" 
                  value={personalInfo.phone} 
                  onChange={handlePersonalChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.phone || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* PERSONAL EMAIL */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Personal Email 
              </span> 
 
              {editingPersonal ? ( 
 
                <input 
                  className="edit-input" 
                  type="email" 
                  name="email" 
                  value={personalInfo.email} 
                  onChange={handlePersonalChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.email || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* ADDRESS */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Address 
              </span> 
 
              {editingPersonal ? ( 
 
                <input 
                  className="edit-input" 
                  name="address" 
                  value={personalInfo.address} 
                  onChange={handlePersonalChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {personalInfo.address || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
          </div> 
 
        </div> 
 
      </div> 
 
 
      {/* ================================================= 
          BOTTOM ROW 
      ================================================= */} 
 
      <div className="profile-grid-row"> 
 
        {/* ================================================= 
            WORK INFORMATION 
        ================================================= */} 
 
        <div className="profile-card"> 
 
          <div className="card-section-header"> 
 
            <h3> 
              Work Information 
            </h3> 
 
          </div> 
 
 
          <div className="info-fields-grid"> 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Employee ID 
              </span> 
 
              <span className="field-val"> 
                {employee.employee_code || "-"} 
              </span> 
 
            </div> 
 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Department 
              </span> 
 
              <span className="field-val"> 
                {employee.department || "-"} 
              </span> 
 
            </div> 
 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Role 
              </span> 
 
              <span className="field-val"> 
                {employee.role || "-"} 
              </span> 
 
            </div> 
 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Location 
              </span> 
 
              <span className="field-val"> 
                {employee.location || "-"} 
              </span> 
 
            </div> 
 
          </div> 
 
        </div> 
 
 
        {/* ================================================= 
            CONTACT INFORMATION 
        ================================================= */} 
 
        <div className="profile-card"> 
 
          <div className="card-section-header"> 
 
            <h3> 
              Contact Information 
            </h3> 
 
            <button 
              className="edit-btn" 
              onClick={handleContactEdit} 
            > 
              {editingContact 
                ? "💾 Save" 
                : "✏️ Edit"} 
            </button> 
 
          </div> 
 
 
          <div className="info-fields-grid"> 
 
            {/* WORK EMAIL */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Work Email 
              </span> 
 
              {editingContact ? ( 
 
                <input 
                  className="edit-input" 
                  type="email" 
                  name="workEmail" 
                  value={contactInfo.workEmail} 
                  onChange={handleContactChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {contactInfo.workEmail || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* PHONE */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Phone Number 
              </span> 
 
              {editingContact ? ( 
 
                <input 
                  className="edit-input" 
                  name="phoneNumber" 
                  value={contactInfo.phoneNumber} 
                  onChange={handleContactChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {contactInfo.phoneNumber || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
 
            {/* LOCATION */} 
 
            <div className="field-box"> 
 
              <span className="field-label"> 
                Location 
              </span> 
 
              {editingContact ? ( 
 
                <input 
                  className="edit-input" 
                  name="location" 
                  value={contactInfo.location} 
                  onChange={handleContactChange} 
                /> 
 
              ) : ( 
 
                <span className="field-val"> 
                  {contactInfo.location || "-"} 
                </span> 
 
              )} 
 
            </div> 
 
          </div> 
 
        </div> 
 
      </div> 
 
    </div> 
  ); 
} 