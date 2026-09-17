import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './Settings.css';

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    payslipNotif: true,
    announcementNotif: true,
  });

  const handleToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ==========================================
  // CHANGE PASSWORD
  // ==========================================
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple clicks
    if (updatingPassword) return;

    // Check all fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }

    // Check new password confirmation
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }

    // Check minimum length
    if (newPassword.length < 8) {
      alert('New password must contain at least 8 characters.');
      return;
    }

    // Check uppercase
    if (!/[A-Z]/.test(newPassword)) {
      alert('New password must contain at least one uppercase letter.');
      return;
    }

    // Check number
    if (!/[0-9]/.test(newPassword)) {
      alert('New password must contain at least one number.');
      return;
    }

    // Check special character
    if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=;'`~]/.test(newPassword)) {
      alert('New password must contain at least one special character.');
      return;
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      alert('New password must be different from your current password.');
      return;
    }

    try {
      setUpdatingPassword(true);

      // ==========================================
      // STEP 1: GET CURRENT LOGGED-IN USER
      // ==========================================
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Get user error:', userError);
        alert(`Unable to get logged-in user: ${userError.message}`);
        return;
      }

      if (!user || !user.email) {
        alert('No logged-in user found. Please login again.');
        return;
      }

      console.log('Logged-in user email:', user.email);

      // ==========================================
      // STEP 2: VERIFY CURRENT PASSWORD
      // ==========================================
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        console.error(
          'Current password verification failed:',
          verifyError
        );

        alert('Current password is incorrect.');
        return;
      }

      console.log('Current password verified successfully.');

      // ==========================================
      // STEP 3: UPDATE PASSWORD IN SUPABASE AUTH
      // ==========================================
      const { data, error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        console.error(
          'Supabase password update error:',
          updateError
        );

        alert(`Password update failed: ${updateError.message}`);
        return;
      }

      console.log('Password update response:', data);

      // ==========================================
      // STEP 4: SUCCESS
      // ==========================================
      alert('Password updated successfully!');

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Unexpected password update error:', error);

      alert(
        error?.message ||
          'Something went wrong while updating the password.'
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ==========================================
  // SVG EYE ICON
  // ==========================================
  const EyeIcon = ({ onClick }) => (
    <svg
      onClick={onClick}
      className="input-eye-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ cursor: 'pointer' }}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  return (
    <div className="settings-page-wrapper">

      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#0f172a',
          margin: '0 0 20px 0',
        }}
      >
        Account Settings
      </h1>

      {/* ==========================================
          1. CHANGE PASSWORD CARD
          ========================================== */}
      <div className="change-pwd-card">

        <div className="card-title-row">
          <svg
            className="lock-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              ry="2"
            ></rect>

            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>

          <h3>Change Password</h3>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="pwd-form"
        >

          {/* CURRENT PASSWORD */}
          <div className="pwd-field-group">
            <label>Current password</label>

            <div className="pwd-input-wrapper">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                placeholder="••••••••••••"
                required
                disabled={updatingPassword}
              />

              <EyeIcon
                onClick={() =>
                  setShowCurrent(!showCurrent)
                }
              />
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div className="pwd-field-group">
            <label>New password</label>

            <div className="pwd-input-wrapper">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Min 8 characters"
                required
                disabled={updatingPassword}
              />

              <EyeIcon
                onClick={() =>
                  setShowNew(!showNew)
                }
              />
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="pwd-field-group">
            <label>Confirm new password</label>

            <div className="pwd-input-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Repeat new password"
                required
                disabled={updatingPassword}
              />

              <EyeIcon
                onClick={() =>
                  setShowConfirm(!showConfirm)
                }
              />
            </div>
          </div>

          {/* PASSWORD REQUIREMENTS */}
          <div className="pwd-requirements">
            <p>Password must contain:</p>

            <ul>
              <li>At least 8 characters</li>
              <li>One uppercase letter</li>
              <li>One number</li>
              <li>One special character</li>
            </ul>
          </div>

          {/* UPDATE BUTTON */}
          <button
            type="submit"
            className="update-pwd-btn"
            disabled={updatingPassword}
          >
            {updatingPassword
              ? 'Updating Password...'
              : 'Update Password'}
          </button>

        </form>
      </div>

      {/* ==========================================
          2. NOTIFICATION PREFERENCES CARD
          ========================================== */}
      <div className="change-pwd-card notif-card">

        <div className="card-title-row">
          <h3>Notification Preferences</h3>
        </div>

        <div className="notif-list">

          {/* EMAIL ALERTS */}
          <div className="notif-row">
            <div>
              <h4>Email Alerts</h4>
              <p>
                Receive email updates on system and work activities.
              </p>
            </div>

            <input
              type="checkbox"
              className="notif-check"
              checked={notifications.emailAlerts}
              onChange={() =>
                handleToggle('emailAlerts')
              }
            />
          </div>

          {/* SMS ALERTS */}
          <div className="notif-row">
            <div>
              <h4>SMS Alerts</h4>
              <p>
                Receive urgent alerts via SMS.
              </p>
            </div>

            <input
              type="checkbox"
              className="notif-check"
              checked={notifications.smsAlerts}
              onChange={() =>
                handleToggle('smsAlerts')
              }
            />
          </div>

          {/* PAYSLIP ALERTS */}
          <div className="notif-row">
            <div>
              <h4>Payslip Alerts</h4>
              <p>
                Get notified when your monthly payslip is generated.
              </p>
            </div>

            <input
              type="checkbox"
              className="notif-check"
              checked={notifications.payslipNotif}
              onChange={() =>
                handleToggle('payslipNotif')
              }
            />
          </div>

        </div>
      </div>

    </div>
  );
}