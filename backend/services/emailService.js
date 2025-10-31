const { google } = require('googleapis');
const { GoogleAuth, OAuth2Client } = require('google-auth-library');

// Initialize Gmail API client
let gmailClient = null; 

class CustomGoogleAuth extends GoogleAuth {
    constructor(token) {
      super();
      this.token = token;
    }
  
    async getClient() {
      const client = new OAuth2Client();
      client.setCredentials({ access_token: this.token });
      return client;
    }
  
    // Add getUniverseDomain() stub to fix gax compatibility
    async getUniverseDomain() {
      return 'googleapis.com'; // default public cloud domain
    }
}

const initializeGmailClient = async (accessToken) => {
  try {
    const oauth2Client = new CustomGoogleAuth(accessToken);
        
    gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
    
  } catch (error) {
    console.error('Failed to initialize Gmail API client:', error);
    throw error;
  }
};

// Email template for access request
const createAccessRequestEmail = (assetName, message, requesterEmail, projectId) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Access Request</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 2px solid #0E4DCA;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0E4DCA;
          margin: 0;
          font-size: 24px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: 600;
          color: #1F1F1F;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0E4DCA;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 14px;
          color: #1F1F1F;
          font-weight: 500;
        }
        .message-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #0E4DCA;
        }
        .message-text {
          font-style: italic;
          color: #555;
          margin: 0;
        }
        .actions {
          margin-top: 30px;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 0 10px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .btn-primary {
          background-color: #0E4DCA;
          color: white;
        }
        .btn-primary:hover {
          background-color: #0B3DA8;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #5a6268;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .console-link {
          color: #0E4DCA;
          text-decoration: none;
        }
        .console-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Access Request Notification</h1>
        </div>
        
        <div class="section">
          <div class="section-title">Request Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Asset Name</div>
              <div class="info-value">${assetName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Project ID</div>
              <div class="info-value">${projectId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Requester</div>
              <div class="info-value">${requesterEmail}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Request Date</div>
              <div class="info-value">${currentDate}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Request Message</div>
          <div class="message-section">
            <p class="message-text">"${message || 'No additional message provided.'}"</p>
          </div>
        </div>
        
        <div class="actions">
          <a href="https://console.cloud.google.com/iam-admin/iam?project=${projectId}" class="btn btn-primary" style="color:#fff !important"  target="_blank">
            Manage Access in Console
          </a>
          <a href="https://console.cloud.google.com/dataplex?project=${projectId}" class="btn btn-secondary" style="color:#fff !important"  target="_blank">
            View in Dataplex
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from Dataplex Universal Catalog.</p>
          <p>You can manage access permissions directly in the 
            <a href="https://console.cloud.google.com/iam-admin/iam?project=${projectId}" class="console-link" style="color:#fff !important" target="_blank">
              Google Cloud Console
            </a>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `Access Request: ${assetName} - ${projectId}`,
    html: emailContent
  };
};

// Email template for access request
const createFeedbackEmail = ( message, requesterEmail, projectId) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Send Feedback</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 2px solid #0E4DCA;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0E4DCA;
          margin: 0;
          font-size: 24px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-weight: 600;
          color: #1F1F1F;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .info-item {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #0E4DCA;
        }
        .info-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 14px;
          color: #1F1F1F;
          font-weight: 500;
        }
        .message-section {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #0E4DCA;
        }
        .message-text {
          font-style: italic;
          color: #555;
          margin: 0;
        }
        .actions {
          margin-top: 30px;
          text-align: center;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          margin: 0 10px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .btn-primary {
          background-color: #0E4DCA;
          color: white;
        }
        .btn-primary:hover {
          background-color: #0B3DA8;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #5a6268;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .console-link {
          color: #0E4DCA;
          text-decoration: none;
        }
        .console-link:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🔐 Send Feedback Notification</h1>
        </div>
        
        <div class="section">
          <div class="section-title">Request Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Project ID</div>
              <div class="info-value">${projectId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Requester</div>
              <div class="info-value">${requesterEmail}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Request Date</div>
              <div class="info-value">${currentDate}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Request Message</div>
          <div class="message-section">
            <p class="message-text">"${message || 'No additional message provided.'}"</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from Dataplex Universal Catalog.</p>
          <p>You can manage access permissions directly in the 
            <a href="https://console.cloud.google.com/iam-admin/iam?project=${projectId}" class="console-link" target="_blank">
              Google Cloud Console
            </a>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    subject: `Send Feedback : Email from ${requesterEmail} - ${projectId}`,
    html: emailContent
  };
};

// Create email message in Gmail API format
const createGmailMessage = (to, subject, htmlContent, fromEmail) => {
  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent
  ];

  const email = emailLines.join('\r\n');
  const base64Email = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  return base64Email;
};

// Send access request email using Gmail API
const sendAccessRequestEmail = async (accessToken, assetName, message, requesterEmail, projectId, projectAdmin = []) => {
    try {
    
    await initializeGmailClient(accessToken);

    const emailContent = createAccessRequestEmail(assetName, message, requesterEmail, projectId);
    const fromEmail = requesterEmail
    
    // Use projectAdmin emails if available, otherwise fall back to test email
    const toEmails = projectAdmin;

    // Send email to each project admin
    const emailPromises = toEmails.map(async (toEmail) => {
      const gmailMessage = createGmailMessage(
        toEmail,
        emailContent.subject,
        emailContent.html,
        fromEmail
      );
      return await gmailClient.users.messages.send({
        userId: fromEmail,
        requestBody: {
          raw: gmailMessage
        }
      });
    });


    const responses = await Promise.all(emailPromises);

    console.log('Access request emails sent successfully to', responses.length, 'recipients'); 
    return {
      success: true,
      messageIds: responses.map(r => r.data.id),
      message: `Access request email sent successfully to ${responses.length} recipient(s)`
    };
  } catch (error) {
    console.error('Error sending access request email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send access request email'
    };
  }
};

// Send Feedback email using Gmail API
const sendFeedbackEmail = async (accessToken, message, requesterEmail, projectId, projectAdmin = []) => {
    try {
    
    await initializeGmailClient(accessToken);

    const emailContent = createFeedbackEmail( message, requesterEmail, projectId);
    const fromEmail = requesterEmail
    
    // Use projectAdmin emails if available, otherwise fall back to test email
    const toEmails = projectAdmin;

    // Send email to each project admin
    const emailPromises = toEmails.map(async (toEmail) => {
      const gmailMessage = createGmailMessage(
        toEmail,
        emailContent.subject,
        emailContent.html,
        fromEmail
      );
      return await gmailClient.users.messages.send({
        userId: fromEmail,
        requestBody: {
          raw: gmailMessage
        }
      });
    });


    const responses = await Promise.all(emailPromises);

    console.log('Access request emails sent successfully to', responses.length, 'recipients'); 
    return {
      success: true,
      messageIds: responses.map(r => r.data.id),
      message: `Access request email sent successfully to ${responses.length} recipient(s)`
    };
  } catch (error) {
    console.error('Error sending access request email:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to send access request email'
    };
  }
};

module.exports = {
  sendFeedbackEmail,
  sendAccessRequestEmail,
  createAccessRequestEmail,
  initializeGmailClient
};
