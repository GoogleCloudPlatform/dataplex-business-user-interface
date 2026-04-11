const nodemailer = require('nodemailer');

/**
 * SMTP Email Service using Nodemailer
 *
 * Configuration via environment variables:
 *   SMTP_EMAIL    - The sender email (e.g., noreply@cmorizot.altostrat.com)
 *   SMTP_PASSWORD - App Password for the sender account
 *   SMTP_HOST     - (Optional) SMTP host, defaults to smtp.gmail.com
 *   SMTP_PORT     - (Optional) SMTP port, defaults to 587
 */

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const email = process.env.SMTP_EMAIL;
    const password = process.env.SMTP_PASSWORD;

    if (!email || !password) {
      console.warn('[EMAIL] SMTP_EMAIL and SMTP_PASSWORD not set — emails will be skipped');
      return null;
    }

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user: email, pass: password },
    });

    console.log(`[EMAIL] SMTP transporter initialized: ${email} via ${host}:${port}`);
  }
  return transporter;
};

const getSenderEmail = () => process.env.SMTP_EMAIL || 'noreply@example.com';
const getAppUrl = () => process.env.APP_URL || process.env.VITE_APP_URL || '';

// ─── Shared styles ───────────────────────────────────────────────
const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
  .email-container { background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .header { border-bottom: 2px solid #0E4DCA; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { color: #0E4DCA; margin: 0; font-size: 24px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .info-item { background-color: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #0E4DCA; }
  .info-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
  .info-value { font-size: 14px; color: #1F1F1F; font-weight: 500; }
  .section { margin-bottom: 25px; }
  .section-title { font-weight: 600; color: #1F1F1F; margin-bottom: 10px; font-size: 16px; }
  .message-section { background-color: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #0E4DCA; }
  .message-text { font-style: italic; color: #555; margin: 0; }
  .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
  .status-approved { background-color: #d4edda; color: #155724; }
  .status-rejected { background-color: #f8d7da; color: #721c24; }
  .status-pending { background-color: #fff3cd; color: #856404; }
  .actions { margin-top: 30px; text-align: center; }
  .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; color: #fff !important; }
  .btn-primary { background-color: #0E4DCA; }
  .btn-secondary { background-color: #6c757d; }
  .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px; }
`;

const formatDate = () => new Date().toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

// ─── Email Templates ─────────────────────────────────────────────

/**
 * Template: New access request (sent to admins/data owners)
 */
const createNewRequestEmail = (assetName, message, requesterEmail, projectId, assetType) => ({
  subject: `New Access Request: ${assetName} - ${projectId}`,
  html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head><body>
    <div class="email-container">
      <div class="header"><h1>New Access Request</h1></div>
      <div class="section">
        <div class="section-title">Request Details</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Asset Name</div><div class="info-value">${assetName}</div></div>
          <div class="info-item"><div class="info-label">Asset Type</div><div class="info-value">${assetType || 'Unknown'}</div></div>
          <div class="info-item"><div class="info-label">Project ID</div><div class="info-value">${projectId}</div></div>
          <div class="info-item"><div class="info-label">Requester</div><div class="info-value">${requesterEmail}</div></div>
          <div class="info-item"><div class="info-label">Request Date</div><div class="info-value">${formatDate()}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Justification</div>
        <div class="message-section"><p class="message-text">"${message || 'No additional message provided.'}"</p></div>
      </div>
      <div class="actions">
        ${getAppUrl() ? `<a href="${getAppUrl()}/admin" class="btn btn-primary">Review in App</a>` : ''}
        <a href="https://new-version-tst-54254020796.europe-west1.run.app" class="btn btn-secondary">Go to Dataplex UI</a>
      </div>
      <div class="footer"><p>This is an automated notification from Dataplex Business Interface.</p></div>
    </div></body></html>`
});

/**
 * Template: Request approved (sent to requester)
 */
const createApprovedEmail = (assetName, requesterEmail, projectId, adminNote, reviewerEmail) => ({
  subject: `Access Approved: ${assetName}`,
  html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head><body>
    <div class="email-container">
      <div class="header"><h1>Access Request Approved</h1></div>
      <div class="section" style="text-align:center; margin-bottom:20px;">
        <span class="status-badge status-approved">APPROVED</span>
      </div>
      <div class="section">
        <p>Your access request for <strong>${assetName}</strong> has been approved. BigQuery READER access has been granted to <strong>${requesterEmail}</strong>.</p>
      </div>
      <div class="section">
        <div class="section-title">Details</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Asset</div><div class="info-value">${assetName}</div></div>
          <div class="info-item"><div class="info-label">Project</div><div class="info-value">${projectId}</div></div>
          <div class="info-item"><div class="info-label">Reviewed By</div><div class="info-value">${reviewerEmail || 'Admin'}</div></div>
          <div class="info-item"><div class="info-label">Date</div><div class="info-value">${formatDate()}</div></div>
        </div>
      </div>
      ${adminNote ? `<div class="section"><div class="section-title">Admin Note</div><div class="message-section"><p class="message-text">"${adminNote}"</p></div></div>` : ''}
      <div class="actions">
        <a href="https://console.cloud.google.com/bigquery?project=${projectId}" class="btn btn-primary">Open BigQuery</a>
      </div>
      <div class="footer"><p>This is an automated notification from Dataplex Business Interface.</p></div>
    </div></body></html>`
});

/**
 * Template: Request rejected (sent to requester)
 */
const createRejectedEmail = (assetName, requesterEmail, projectId, adminNote, reviewerEmail) => ({
  subject: `Access Rejected: ${assetName}`,
  html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head><body>
    <div class="email-container">
      <div class="header"><h1>Access Request Rejected</h1></div>
      <div class="section" style="text-align:center; margin-bottom:20px;">
        <span class="status-badge status-rejected">REJECTED</span>
      </div>
      <div class="section">
        <p>Your access request for <strong>${assetName}</strong> has been rejected.</p>
      </div>
      <div class="section">
        <div class="section-title">Details</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Asset</div><div class="info-value">${assetName}</div></div>
          <div class="info-item"><div class="info-label">Project</div><div class="info-value">${projectId}</div></div>
          <div class="info-item"><div class="info-label">Reviewed By</div><div class="info-value">${reviewerEmail || 'Admin'}</div></div>
          <div class="info-item"><div class="info-label">Date</div><div class="info-value">${formatDate()}</div></div>
        </div>
      </div>
      ${adminNote ? `<div class="section"><div class="section-title">Reason</div><div class="message-section"><p class="message-text">"${adminNote}"</p></div></div>` : '<div class="section"><p style="color:#666;">No reason was provided. You may contact your data owner for more information.</p></div>'}
      <div class="footer"><p>This is an automated notification from Dataplex Business Interface.</p></div>
    </div></body></html>`
});

/**
 * Template: Feedback (sent to admins)
 */
const createFeedbackEmail = (message, requesterEmail, projectId) => ({
  subject: `Feedback from ${requesterEmail} - ${projectId}`,
  html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head><body>
    <div class="email-container">
      <div class="header"><h1>Feedback Notification</h1></div>
      <div class="section">
        <div class="section-title">Details</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-label">Project ID</div><div class="info-value">${projectId}</div></div>
          <div class="info-item"><div class="info-label">From</div><div class="info-value">${requesterEmail}</div></div>
          <div class="info-item"><div class="info-label">Date</div><div class="info-value">${formatDate()}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Message</div>
        <div class="message-section"><p class="message-text">"${message || 'No message provided.'}"</p></div>
      </div>
      <div class="footer"><p>This is an automated notification from Dataplex Business Interface.</p></div>
    </div></body></html>`
});

// ─── Send Functions ──────────────────────────────────────────────

/**
 * Core send function
 */
const sendEmail = async (to, subject, html) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn('[EMAIL] Skipping email (SMTP not configured):', subject);
    return { success: false, error: 'SMTP not configured' };
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) {
    console.warn('[EMAIL] No recipients, skipping:', subject);
    return { success: false, error: 'No recipients' };
  }

  try {
    const info = await transport.sendMail({
      from: `"Dataplex Catalog" <${getSenderEmail()}>`,
      to: recipients.join(', '),
      subject,
      html,
    });
    console.log(`[EMAIL] Sent "${subject}" to ${recipients.join(', ')} — messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] Failed to send "${subject}":`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send new access request notification (to admins/data owners)
 */
const sendAccessRequestEmail = async (assetName, message, requesterEmail, projectId, projectAdmin = [], assetType = '') => {
  let toEmails = (projectAdmin || []).filter(Boolean);
  if (toEmails.length === 0) {
    const fallback = process.env.VITE_SUPPORT_EMAIL || process.env.VITE_ADMIN_EMAIL;
    if (fallback) toEmails = [fallback];
  }
  if (toEmails.length === 0) {
    console.warn('[EMAIL] No admin recipients for new access request email');
    return { success: false, error: 'No recipients' };
  }

  const email = createNewRequestEmail(assetName, message, requesterEmail, projectId, assetType);
  return sendEmail(toEmails, email.subject, email.html);
};

/**
 * Send approval notification (to requester)
 */
const sendApprovalEmail = async (assetName, requesterEmail, projectId, adminNote, reviewerEmail) => {
  if (!requesterEmail) return { success: false, error: 'No requester email' };
  const email = createApprovedEmail(assetName, requesterEmail, projectId, adminNote, reviewerEmail);
  return sendEmail(requesterEmail, email.subject, email.html);
};

/**
 * Send rejection notification (to requester)
 */
const sendRejectionEmail = async (assetName, requesterEmail, projectId, adminNote, reviewerEmail) => {
  if (!requesterEmail) return { success: false, error: 'No requester email' };
  const email = createRejectedEmail(assetName, requesterEmail, projectId, adminNote, reviewerEmail);
  return sendEmail(requesterEmail, email.subject, email.html);
};

/**
 * Send feedback email (to admins)
 */
const sendFeedbackEmail = async (message, requesterEmail, projectId, projectAdmin = []) => {
  let toEmails = (projectAdmin || []).filter(Boolean);
  if (toEmails.length === 0) {
    const fallback = process.env.VITE_SUPPORT_EMAIL || process.env.VITE_ADMIN_EMAIL;
    if (fallback) toEmails = [fallback];
  }
  const email = createFeedbackEmail(message, requesterEmail, projectId);
  return sendEmail(toEmails, email.subject, email.html);
};

module.exports = {
  sendAccessRequestEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendFeedbackEmail,
  createNewRequestEmail,
  createApprovedEmail,
  createRejectedEmail,
};
