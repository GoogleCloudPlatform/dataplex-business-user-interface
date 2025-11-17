import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAuth } from '../../auth/AuthProvider';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { URLS } from '../../constants/urls';

/**
 * @file SubmitAccess.tsx
 * @description
 * This component renders a slidable side panel (from the right) that provides
 * a form for users to request access to a specific data asset.
 *
 * Key functionalities include:
 * 1.  **Form Display**: Shows details about the asset (creation/modification
 * time, contact info) and a multi-line `TextField` for the user to
 * enter a justification message.
 * 2.  **Contact Extraction**: On mount, it attempts to parse the `entry`
 * prop's "contacts" aspect to find data owner/steward emails.
 * 3.  **Submission Logic**:
 * - When "Submit" is clicked, it makes an `axios` POST request to the
 * `ACCESS_REQUEST` API endpoint.
 * - It sends the `assetName`, user's `message`, `requesterEmail` (from
 * `useAuth`), and the extracted `contactEmails`.
 * - If no contacts are found, it informs the user and does not send an email.
 * 4.  **State Handling**: Manages loading (`isSubmitting`), `error`, and
 * `success` states for the API request. On success, it calls the
 * `onSubmitSuccess` prop and closes the panel.
 *
 * @param {SubmitAccessProps} props - The props for the component.
 * @param {boolean} props.isOpen - Controls the visibility of the side panel.
 * If true, the panel slides in; if false, it slides out.
 * @param {() => void} props.onClose - A callback function to be invoked when
 * the panel's close ('X') icon or "Cancel" button is clicked.
 * @param {string} props.assetName - The name of the asset for which access
 * is being requested (e.g., "Sales Data").
 * @param {any} [props.entry] - (Optional) The full entry object for the
 * asset. This is used to extract contact information from its aspects.
 * @param {(assetName: string) => void} props.onSubmitSuccess - A callback
 * function triggered after a successful API submission, passing back the
 * `assetName`.
 * @param {any} [props.previewData] - (Optional) Data used to display
 * creation and modification times in the panel.
 *
 * @returns {React.ReactElement} A React element. It renders the slidable
 * panel `Box` or a `CircularProgress` spinner if `previewData` or `entry`
 * is not yet available.
 */

interface SubmitAccessProps {
  isOpen: boolean;
  onClose: () => void;
  assetName: string;
  entry?: any; // Add entry data to extract contacts
  onSubmitSuccess: (assetName: string) => void;
  previewData?: any; 
}

const SubmitAccess: React.FC<SubmitAccessProps> = ({ isOpen, onClose, assetName, entry, onSubmitSuccess, previewData }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactEmails, setContactEmails] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const userState = useSelector((state: any) => state.user);
  // console.log(userState.token);

  const extractContacts = (entryData: any): any[] => {
    console.log(entryData);
    if (!entryData || !entryData.aspects) return [];
    
    const number = entryData.entryType?.split('/')[1];
    if (!number) return [];

    return entryData.aspects[`${number}.global.contacts`]?.data.fields.identities.listValue.values || [];
  };

  const extractContactEmails = (entryData: any): string[] => {
    const contacts = extractContacts(entryData);
    
    return (contacts.length > 0) ? contacts.map((contact: any) => {
      const nameValue = contact.structValue.fields.name.stringValue;
      // Extract email from format like "Name <email@example.com>"
      const emailMatch = nameValue.match(/<(.+?)>/);
      return emailMatch ? emailMatch[1] : null;
    }).filter((email: string | null) => email !== null) : [];
  };

  useEffect(() => {
    let contacts:string[] = extractContactEmails(entry);
    if (contacts.length > 0) {
      setContactEmails(contacts);
    }else{
      setContactEmails([]);
    }
  }, []);

  const handleSubmit = async () => {
    if (!user?.email) {
      setError('User email not available. Please log in again.');
      return;
    }

    if (!userState.token) {
      setError('Authentication token not found. Please log in again.');
      console.error('error:', error);
      return;
    }

    setIsSubmitting(true);
    console.log(isSubmitting);
    setError(null);
    setSuccess(false);

    try {
      console.log('Extracted contact emails:', contactEmails);
      if(contactEmails.length > 0){
        try{
        const response = await axios.post(`${URLS.API_URL}${URLS.ACCESS_REQUEST}`, {
            assetName,
            message,
            requesterEmail: user.email,
            projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
            projectAdmin: contactEmails 
          },{
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token || ''}`
          }
        });

        const data = await response.data;
        if (data.success) {
          setSuccess(true);
          console.log(success);
          setMessage('');
          onSubmitSuccess(assetName);
          
          // Close the panel after a short delay
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 2000);
        } else {
          throw new Error(data.error || 'Failed to submit access request');
        }
        
      }catch(error){
        console.log(error);
        throw new Error('Failed to submit access request');
      }

      }else{
        setSuccess(true);
        console.log(success);
        setMessage('Contacts/Emails not available for this entry');
        onSubmitSuccess(assetName);
        
        // Close the panel after a short delay
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting access request:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const getFormattedDateTimeParts = (timestamp: any) => {
    if (!timestamp) {
      return { date: '-', time: '' };
    }
    
    const myDate = new Date(timestamp * 1000);

    const date = new Intl.DateTimeFormat('en-US', { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
    }).format(myDate);

    const time = new Intl.DateTimeFormat('en-US', { 
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit", 
      hour12: true 
    }).format(myDate);

    return { date, time }; 
  };

const { date: creationDate, time: creationTime } = getFormattedDateTimeParts(previewData?.createTime?.seconds);
const { date: updateDate, time: updateTime } = getFormattedDateTimeParts(previewData?.updateTime?.seconds);

return ((previewData != null || previewData != undefined) && entry) ?(
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : '-500px',
        width: '500px',
        height: '100vh',
        backgroundColor: '#FFFFFF',
        boxShadow: '-4px 0px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1300,
        transition: 'right 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8.75rem', /* 140px */
          padding: '20px 24px',
          borderBottom: '1px solid #DADCE0',
          width: '31.1875rem' /* 499px */
        }}
      >
        <Typography
          variant="heading2Medium"
          sx={{
            fontFamily: 'Google Sans',
            fontSize: '1.125rem', /* 18px */
            fontWeight: '500',
            color: '#1F1F1F',
            lineHeight: '1.333em',
            textAlign: 'left'
          }}
        >
          Request Access for "{assetName.charAt(0).toUpperCase() + assetName.slice(1)}"
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            width: '1.5rem', /* 24px */
            height: '1.5rem', /* 24px */
            color: '#202124',
            padding: 0,
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        >
          <Close sx={{ fontSize: '1.5rem' }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          // border: '1px solid red'
        }}
      >
        {/* Request Details Section */}
        <Box sx={{ borderBottom: '1px solid #DADCE0', paddingBottom: '16px' }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1F1F1F',
              marginBottom: '16px'
            }}
          >
            Request details
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',   
              gap: '16px'
            }}
          >
            {/* Creation Time Block */}
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography
                sx={{
                  fontFamily: '"Google Sans Text", sans-serif',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#575757',
                  marginBottom: '4px'
                }}
              >
                Creation Time
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1F1F1F'
                }}
              >
                {creationDate}
                <br />
                {creationTime}
              </Typography>
            </Box>

            {/* Modification Time Block */}
            <Box sx={{ flex: '1 1 auto' }}>
              <Typography
                sx={{
                  fontFamily: '"Google Sans Text", sans-serif',
                  fontSize: '11px',
                  // Note: Original code had fontWeight 400 here, you may want 500 for consistency
                  fontWeight: '500', 
                  color: '#575757',
                  marginBottom: '4px'
                }}
              >
                Modification time
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: '400',
                  color: '#1F1F1F'
                }}
              >
                {updateDate}
                <br />
                {updateTime}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Contact Information Section */}
        <Box sx={{ borderBottom: '1px solid #DADCE0', paddingBottom: '16px' }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1F1F1F',
              marginBottom: '16px'
            }}
          >
            Contact information
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem'
            }}
          >
            {
              extractContacts(entry).length > 0 ? (
                extractContacts(entry).map((contact: any, index: number) => (
                    <Box key={index} sx={{ flex: '1 1 auto' }}>
                      <Typography
                        sx={{
                          fontFamily: '"Google Sans Text", sans-serif',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#575757',
                          marginBottom: '4px'
                        }}
                      >
                        {contact.structValue.fields.role.stringValue}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"Google Sans Text", sans-serif',
                          fontSize: '14px',
                          fontWeight: '400',
                          color: '#1F1F1F'
                        }}
                      >
                        {
                          contact.structValue.fields.name.stringValue.split('<').length > 1 
                          ? contact.structValue.fields.name.stringValue.split('<')[1].slice(0, -1) 
                          : contact.structValue.fields.name.stringValue.length > 0 
                            ? contact.structValue.fields.name.stringValue 
                            : "--"
                        }
                      </Typography>
          </Box>
        ))
    ) : (
      <Typography
        sx={{
          fontFamily: '"Google Sans Text", sans-serif',
          fontSize: '14px',
          fontWeight: '400',
          color: '#1F1F1F'
        }}
      >
        -
      </Typography>
    )
  }
</Box>
        </Box>

        {/* Context and Message Section */}
        <Box>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1F1F1F',
              marginBottom: '12px'
            }}
          >
            What context would you like to provide your data owner?
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '400',
              color: '#575757',
              lineHeight: '1.5',
              marginBottom: '16px'
            }}
          >
            The following message will be send to the the owner of the asset. 
            {/* The email will include your request justification, 
            and a link to the Google Cloud console where your data producer can address your request. */}
          </Typography>
          {/* <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1F1F1F',
              marginBottom: '12px'
            }}
          >
            Add your message here
          </Typography> */}
          <TextField
            multiline
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '14px',
                '& fieldset': {
                  borderColor: '#DADCE0',
                  borderRadius: '8px'
                },
                '&:hover fieldset': {
                  borderColor: '#B8B8B8'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0E4DCA'
                }
              },
              '& .MuiInputBase-input': {
                fontFamily: '"Google Sans Text", sans-serif',
                fontWeight: '400',
                fontSize: '14px',
                color: '#1F1F1F'
              }
            }}
          />
        </Box>
      </Box>

      {/* Footer with Action Buttons */}
      <Box
        sx={{
          padding: '16px 24px 24px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}
      >
        <Button
          onClick={handleCancel}
          sx={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#575757',
            textTransform: 'none',
            borderRadius: '100px',
            padding: '8px 16px',
            '&:hover': {
              backgroundColor: '#F5F5F5'
            }
          }}
        >
          Cancel
        </Button>
        <Tooltip title={extractContacts(entry).length > 0 ? "Click here to send an request access email" : "No contact information available to request access"} arrow>
        <Button
          //disabled = {contactEmails.length > 0 ? false : true}
          onClick={() => {
            if(extractContacts(entry).length > 0) handleSubmit();
          }}
          variant="contained"
          style={{color: '#FFFFFF',backgroundColor: '#0E4DCA'}}
          sx={{
            fontSize: '14px',
            fontWeight: '500',
            backgroundColor: extractContacts(entry).length > 0 ? '#0E4DCA' : '#A0A0A0',
            color: '#FFFFFF',
            textTransform: 'none',
            borderRadius: '100px',
            padding: '8px 16px',
            opacity: extractContacts(entry).length > 0 ? 1 : 0.6,
            '&:hover': {
              backgroundColor: extractContacts(entry).length > 0 ? '#0B3DA8' : '#909090'
            },
            cursor: extractContacts(entry).length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Submit
        </Button>
        </Tooltip>
      </Box>
    </Box>
  ) : (<>
    <CircularProgress />
  </>);
};

export default SubmitAccess;
