import React, { useEffect, useState, useMemo } from 'react';
import { Alert, Box, Grid, Tooltip, IconButton, Typography, Skeleton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import Tag from '../Tags/Tag';
import CTAButton from '../Buttons/CTAButton';
import { fetchEntry } from '../../features/entry/entrySlice';
import PreviewSchema from '../Schema/PreviewSchema';
import PreviewAnnotation from '../Annotation/PreviewAnnotation';
import SchemaFilter from '../Schema/SchemaFilter';
import AnnotationFilter from '../Annotation/AnnotationFilter';
import { useNavigate } from 'react-router-dom';
import SubmitAccess from '../SearchPage/SubmitAccess';
import NotificationBar from '../SearchPage/NotificationBar';
import ShimmerLoader from '../Shimmer/ShimmerLoader';
import type { AppDispatch } from '../../app/store';
import { getName, getEntryType, generateBigQueryLink, hasValidAnnotationData, generateLookerStudioLink, getFormattedDateTimePartsByDateTime } from '../../utils/resourceUtils';
// import { useFavorite } from '../../hooks/useFavorite';
import { useAuth } from '../../auth/AuthProvider';
import { usePreviewEntry } from '../../hooks/usePreviewEntry';
import { useAccessRequest } from '../../contexts/AccessRequestContext';

/**
 * @file ResourcePreview.tsx
 * @summary Renders a detailed preview panel for a selected data resource.
 *
 * @description
 * This component displays a comprehensive side panel (or main view) for a
 * resource selected from a list (passed via the `previewData` prop).
 *
 * When `previewData` is provided, this component:
 * 1.  Dispatches the `fetchEntry` Redux action to retrieve the full, detailed
 * entry, including schema and all aspects (annotations).
 * 2.  Manages the loading (`entryStatus === 'loading'`) and error states
 * (`entryStatus === 'failed'`) for this fetch, displaying `ShimmerLoader`
 * skeletons or an `Alert` message, respectively.
 * 3.  Handles permission-denied (403) errors by disabling the "View Details"
 * button.
 * 4.  Handles unauthenticated (401) errors by logging the user out.
 *
 * The UI consists of:
 * -   A header with the resource title, a "Close" button, and dynamic links
 * to "Open in BigQuery" and "Explore with Looker Studio" (if applicable).
 * -   Metadata tags (e.g., "BigQuery", "Table").
 * -   CTA buttons: "View Details" and "Request Access".
 * -   A tabbed interface for "Overview", "Schema", and "Aspects".
 *
 * It renders sub-components for filtering and displaying tab content:
 * -   **Overview:** Displays key-value metadata (description, dates, contacts).
 * -   **Schema:** (For tables only) Renders `SchemaFilter` and `PreviewSchema`.
 * -   **Aspects:** Renders `AnnotationFilter` and `PreviewAnnotation`.
 *
 * This component also orchestrates the "Request Access" flow by managing
 * the `SubmitAccess` modal and the `NotificationBar` for success messages.
 *
 * If `previewData` is `null` or a placeholder, it renders a default message
 * prompting the user to select an item.
 *
 * @param {object} props - The props for the ResourcePreview component.
 * @param {any | null} props.previewData - The core data object for the resource
 * to be previewed. If `null`, a placeholder is shown.
 * @param {(data: any | null) => void} props.onPreviewDataChange - Callback function
 * to update the parent's preview state (e.g., pass `null` to close the preview).
 * @param {string} props.id_token - The user's authentication token, required
 * for the `fetchEntry` API call.
 * @param {(entry: any) => void} [props.onViewDetails] - Optional callback to
 * override the default "View Details" behavior (which navigates to '/view-details').
 * @param {(entry: any) => void} [props.onRequestAccess] - Optional callback to
 * override the default "Request Access" behavior (which opens the `SubmitAccess` modal).
 *
 * @returns {JSX.Element} A styled `div` containing the full resource preview
 * panel or a placeholder message.
 */

interface ResourcePreviewProps {
  // Preview props
  previewData: any | null;
  onPreviewDataChange: (data: any | null) => void;

  // Access control props
  id_token: string;
  demoMode?: boolean;

  // Preview mode control
  previewMode?: 'redux' | 'isolated'; // Default: 'redux' for backward compatibility

  // Event handlers
  onViewDetails?: (entry: any) => void;
  onRequestAccess?: (entry: any) => void;
  isGlossary?: boolean;
}

const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  previewData,
  onPreviewDataChange,
  id_token,
  onViewDetails,
  onRequestAccess,
  demoMode = false,
  isGlossary = false,
  previewMode = 'redux' // Default to existing behavior for backward compatibility
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setAccessPanelOpen } = useAccessRequest();

  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitAccessOpen, setIsSubmitAccessOpen] = useState<boolean>(false);
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [filteredSchemaEntry, setFilteredSchemaEntry] = useState<any | null>(null);
  const [filteredAnnotationEntry, setFilteredAnnotationEntry] = useState<any | null>(null);
  const [viewDetailAccessable, setViewDetailAccessable] = useState<boolean>(true);
  const [expandedAnnotations, setExpandedAnnotations] = useState<Set<string>>(new Set());

  // Use shared favorite state
  // const { isFavorite: isFavorited, toggleFavorite } = useFavorite(previewData?.name || '');

  // Redux selectors (used in 'redux' mode)
  const reduxEntry = useSelector((state: any) => state.entry.items);
  const reduxEntryStatus = useSelector((state: any) => state.entry.status);
  const reduxEntryError = useSelector((state: any) => state.entry.error);

  // Isolated preview hook (used in 'isolated' mode)
  const {
    entry: isolatedEntry,
    status: isolatedStatus,
    error: isolatedError
  } = usePreviewEntry({
    entryName: previewMode === 'isolated' ? previewData?.name : null,
    id_token,
    enabled: previewMode === 'isolated' && !demoMode
  });

  // Determine which data source to use based on mode
  const entry = demoMode
    ? previewData
    : previewMode === 'isolated'
      ? isolatedEntry
      : reduxEntry;

  const entryStatus = demoMode
    ? 'succeeded'
    : previewMode === 'isolated'
      ? isolatedStatus
      : reduxEntryStatus;

  const entryError = previewMode === 'isolated'
    ? isolatedError
    : reduxEntryError;
  const number = entry?.entryType?.split('/')[1];
  const contacts = entry?.aspects?.[`${number}.global.contacts`]?.data?.fields?.identities?.listValue?.values || [];
  const schemaData = entry?.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];
  const hasAnnotations = entry?.aspects ? Object.keys(entry.aspects).some(key => hasValidAnnotationData(entry.aspects[key])) : false;


  const { date: creationDate, time: creationTime } = getFormattedDateTimePartsByDateTime(previewData?.createTime);
  const { date: updateDate, time: updateTime } = getFormattedDateTimePartsByDateTime(previewData?.updateTime);


  // Event handlers
  const handleTabClick = (tabIndex: number) => {
    setTabValue(tabIndex);
  };

  const handleViewDetails = (entry: any) => {
    if (onViewDetails) {
      onViewDetails(entry);
    } else {
      navigate('/view-details');
    }
  };

  const handleRequestAccess = (entry: any) => {
    if (onRequestAccess) {
      onRequestAccess(entry);
    } else {
      setIsSubmitAccessOpen(true);
    }
  };

  const handleCloseSubmitAccess = () => {
    setIsSubmitAccessOpen(false);
  };

  const handleSubmitSuccess = (_assetName: string) => {
    setIsSubmitAccessOpen(false);
    setNotificationMessage(`Request sent`);
    setIsNotificationVisible(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 5000);
  };

  const handleCloseNotification = () => {
    setIsNotificationVisible(false);
  };

  const handleUndoNotification = () => {
    setIsNotificationVisible(false);
  };

  const handleAnnotationCollapseAll = () => {
  setExpandedAnnotations(new Set());
  };

  const lookerUrl = useMemo(() => {
      if (!entry) {
        return '';
      }
      return generateLookerStudioLink(entry);
    }, [entry]);

  const bigQueryUrl = useMemo(() => {
      if (!entry) {
        return '';
      }
      return generateBigQueryLink(entry);
    }, [entry]);


    const getDisplayName = (contact: any) => {
    try {
      const name = contact.structValue.fields.name.stringValue;
      if (!name) return "--";
      return name.split('<').length > 1
        ? name.split('<')[1].slice(0, -1)
        : name;
    } catch (e) {
      console.error("Error parsing contact name:", e);
      return "--"; // Failsafe
    }
  };

  const handleAnnotationExpandAll = () => {
  if (entry?.aspects) {
    const number = getEntryType(entry.name, '/');
    const annotationKeys = Object.keys(entry.aspects)
      .filter(key =>
        // First, filter out the non-annotation aspects as before
        key !== `${number}.global.schema` &&
        key !== `${number}.global.overview` &&
        key !== `${number}.global.contacts` &&
        key !== `${number}.global.usage`
      )
      .filter(key => 
        // THEN, filter again to only keep keys that have valid data
        hasValidAnnotationData(entry.aspects[key])
      );
    setExpandedAnnotations(new Set(annotationKeys));
  }
};
  // Effects
  // Sync local panel state with global context
  useEffect(() => {
    setAccessPanelOpen(isSubmitAccessOpen);
  }, [isSubmitAccessOpen, setAccessPanelOpen]);

  useEffect(() => {
    // Only dispatch Redux action in 'redux' mode
    if (previewData !== null && !demoMode && previewMode === 'redux') {
       dispatch(fetchEntry({ entryName: previewData.name, id_token: id_token }));
    }
    // In 'isolated' mode, the hook handles fetching automatically
  }, [previewData, dispatch, id_token, demoMode, previewMode]);

  // Sync filtered entries with fetched entry
  // Only react to entryStatus when we have previewData (i.e., we've actually requested data)
  // This prevents reacting to stale Redux state from previous operations elsewhere in the app
  useEffect(() => {
    // Skip if no previewData - we haven't requested any entry yet
    if (!previewData) {
      return;
    }

    if (entryStatus === 'loading') {
      setViewDetailAccessable(false);
    }
    if (entryStatus === 'succeeded') {
      setFilteredSchemaEntry(entry);
      setFilteredAnnotationEntry(entry);
      setViewDetailAccessable(true);
    }
    if (entryStatus === 'failed') {
      if(entryError?.details?.toLowerCase().includes('403') || entryError?.details?.includes('PERMISSION_DENIED')) {
        setViewDetailAccessable(false);
      }else if(entryError?.details?.includes('UNAUTHENTICATED')) {
        logout();
        navigate('/login');
      }
    }
  }, [entry, entryStatus, previewData]);

  // Preview content rendering logic
  let schema;
  let annotationTab;

  if (entryStatus === 'loading') {
    annotationTab = schema = (
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ 
          minHeight: '50vh',
        }}
      >
        <div style={{ fontSize: "1rem", color: "#575757", fontWeight: "500", marginTop: "1.25rem", fontFamily: "sans-serif", }}>
          <ShimmerLoader type="list" count={3} />
        </div>
      </Grid>
    );
  } else if (entryStatus === 'succeeded') {
    schema = <PreviewSchema entry={filteredSchemaEntry || entry} sx={{ width: "100%", borderTopLeftRadius: '0px', borderTopRightRadius: '0px' }} />;
    annotationTab = <PreviewAnnotation entry={filteredAnnotationEntry || entry} css={{
      width: "100%",
      border: "1px solid #E0E0E0",
      borderRadius: "8px",
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
      borderTopLeftRadius: '0px',
      borderTopRightRadius: '0px'
    }} isTopComponent={false}
    expandedItems={expandedAnnotations}
    setExpandedItems={setExpandedAnnotations}
    isGlossary={isGlossary}
    />;
  } else if (entryStatus === 'failed') {
    if(entryError?.details?.toLowerCase().includes('403') || entryError?.details?.includes('PERMISSION_DENIED')) {
      annotationTab = schema = <Alert severity="error">You do not have enough permisssion to see this entry data.</Alert>;
    }else{
      annotationTab = schema = <Alert severity="error">Failed to load entry data: {entryError?.message || entryError}</Alert>;
    }
    
  }

  let preview = (<>
  <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
    <Tooltip title="Close preview" arrow>
    <IconButton
      aria-label="close"
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
      }}
      onClick={() => onPreviewDataChange(null)}
    >
      <Close sx={{ fontSize: '1.5rem', color: '#575757' }} />
    </IconButton>
    </Tooltip>
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: '75vh' }}
    >
      <img
        src="/assets/images/asset-preview-default.png"
        alt="Asset Preview"
        style={{ width: "12.5rem", flex: "0 0 auto" }}
      />
      <span style={{ fontSize: "0.875rem", color: "#575757", fontWeight: "500", marginTop: "1.25rem", fontFamily: "Google Sans Text, sans-serif" }}>
        Click on an item to see preview
      </span>
    </Grid>
  </Box>
</>
  );
  const parentHorizontalPadding = '20px';
  if (previewData !== null && !previewData?.isPlaceholder) {
    preview = (
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '1.5rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.625rem',
          flex: '0 0 auto'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            flex: '1 1 auto'
          }}>
            {/* Title and Icons Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Tooltip 
                title={
                  previewData.entrySource?.displayName?.length > 0
                  ? previewData.entrySource.displayName 
                  : getName(previewData.name || '', '/')
                }
                arrow placement='top'
              >
              <label style={{
                color: "#0E4DCA",
                fontSize: "1.125rem",
                fontWeight: "400",
                fontFamily: '"Google Sans", sans-serif',
                lineHeight: 1.33,
                maxWidth: isGlossary ? '175px' : '200px',
                // textTransform:"capitalize",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textWrap: "nowrap",
              }}>
                {previewData.entrySource?.displayName?.length > 0 ? previewData.entrySource.displayName : getName(previewData.name || '', '/')}
              </label>
              </Tooltip>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flex: '0 0 auto'
              }}>

                {/* Favorite/Star Icon */}
                {/* <Tooltip title={isFavorited ? "Remove from favorites" : "Add to favorites"} arrow>
                  <svg 
                    width="1.25rem" 
                    height="1.25rem" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        cursor: "pointer",
                        flexShrink: 0 // Prevent icon from shrinking
                    }}
                    onClick={() => {
                      const newStatus = toggleFavorite();
                      console.log(newStatus ? 'Added to favorites' : 'Removed from favorites');
                    }}
                  >
                    {isFavorited ? (
                        // Filled star when favorited
                        <path 
                            d="M9 1.5L11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5Z" 
                            fill="#F4B400"
                        />
                    ) : (
                        // Outlined star when not favorited
                        <path 
                            fillRule="evenodd" 
                            clipRule="evenodd" 
                            d="M11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5L11.1075 6.465ZM6.18 13.2525L9 11.55L11.8275 13.26L11.0775 10.05L13.5675 7.89L10.2825 7.605L9 4.575L7.725 7.5975L4.44 7.8825L6.93 10.0425L6.18 13.2525Z" 
                            fill="#575757"
                            opacity="0.4"
                        />
                    )}
                  </svg>

                </Tooltip> */}
                {
                  previewData.entrySource?.system ? ((previewData.entrySource?.system.toLowerCase() === 'bigquery') ? (<>
                    <Tooltip title={entryStatus !== 'succeeded' ? "Loading link..." : "Open in BigQuery"} arrow>
                      <IconButton
                        disabled={entryStatus !== 'succeeded' || !bigQueryUrl || demoMode}
                        size="small"
                        onClick={() => {
                          window.open(bigQueryUrl, '_blank');
                        }}
                        sx={{
                          padding: '5px',
                          '&:hover': {
                            backgroundColor: '#F5F5F5'
                          }
                        }}
                      >
                        <img
                          src="/assets/svg/bigquery-icon.svg"
                          alt="Open in BigQuery"
                          style={{ width: "1.2rem", height: "1.2rem", opacity: entryStatus !== 'succeeded' || !bigQueryUrl || demoMode ? 0.4 : 1    }}
                        />
                      </IconButton>
                    </Tooltip>
                  
                      
                {/* Open in Looker */}
                <Tooltip title={entryStatus !== 'succeeded' ? "Loading link..." : (demoMode ? "Disabled in Demo Mode" : "Explore with Looker Studio")} arrow>                  
                  <IconButton
                    size="small"
                    disabled={entryStatus !== 'succeeded' || !lookerUrl || demoMode}
                    onClick={() => {
                      window.open(lookerUrl, '_blank');
                    }}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#F5F5F5'
                      }
                    }}
                  >
                    <img
                      src="/assets/svg/looker-icon.svg"
                      alt="Open in Looker"
                      style={{ width: "1.2rem", height: "1.2rem", opacity: entryStatus !== 'succeeded' || !lookerUrl || demoMode ? 0.4 : 1    }}
                    />
                  </IconButton>
                </Tooltip>
                </>):(<></>)) : (<></>)
                }
                
                <div style={{ marginLeft: '-5px' }} />

                {/* Close Icon */}
                <Tooltip title="Close preview" arrow>
                  <IconButton
                    size="small"
                    onClick={() => onPreviewDataChange(null)}
                    sx={{
                      padding: '4px',
                      position:'relative',
                      top:'1px',
                      '&:hover': {
                        backgroundColor: '#F5F5F5'
                      }
                    }}
                  >
                    <Close sx={{ fontSize: '1.2rem', color: '#575757'}} />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '0.75rem',
          flex: '0 0 auto',
          flexWrap: 'wrap'
        }}>
          <Tag text={previewData.entrySource.system ? (previewData.entrySource.system.toLowerCase() === 'bigquery' ? 'BigQuery' : previewData.entrySource.system.replace("_", " ").replace("-", " ").toLowerCase() ) : "Custom"} css={{
            fontFamily: '"Google Sans Text", sans-serif',
                    color: '#004A77',
                    backgroundColor: '#C2E7FF',
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem 0.5rem",
                    fontWeight: 500,
                    borderRadius: '8px',
                    textTransform:'capitalize',
                    flexShrink: 0
          }} />
          <Tag 
            text={
              previewData.entryType.split('-').length > 1 ? previewData.entryType.split('-').pop() : previewData.name.split('/').at(-2)
            }
            css={{
            fontFamily: '"Google Sans Text", sans-serif',
                    color: '#004A77',
                    backgroundColor: '#C2E7FF',
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem 0.5rem",
                    fontWeight: 500,
                    borderRadius: '8px',
                    textTransform:'capitalize',
                    flexShrink: 0
          }} />
        </div>

        {/* CTA Buttons Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flex: '0 0 auto',
          flexWrap: 'wrap'
        }}>
          <Tooltip title={demoMode ? "Action disabled in demo mode" : (viewDetailAccessable ? "Click to view details of the entry" : "You do not have permission to view details")} arrow>
          <CTAButton
            //disabled={!viewDetailAccessable}
            handleClick={() => {if(viewDetailAccessable && !demoMode) handleViewDetails(entry);}}
            text="View Details"
            css={{
              fontFamily: '"Google Sans Text", sans-serif',
              backgroundColor: '#0E4DCA',
              color: '#FFFFFF',
              borderRadius: '6.25rem',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontWeight: '500',
              // letterSpacing: '0.71px',
              border: 'none',
              height: '2.1rem',
              maxWidth: '6rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              flex: '0 0 auto',
              opacity: viewDetailAccessable && !demoMode ? 1 : 0.6,
            }}
          />
          </Tooltip>

          <Tooltip title={(viewDetailAccessable ? "You cannot request permission for the entries which you already have access to." : "Click to request permission for this entry")} arrow>
          <CTAButton
            //disabled={viewDetailAccessable}
            handleClick={() => { if(!demoMode) handleRequestAccess(entry) }}
            text="Request Access"
            css={{
              fontFamily: '"Google Sans Text", sans-serif',
              color: '#575757', //!viewDetailAccessable ? '#575757' : '#A8A8A8',
              backgroundColor: '#FFFFFF', //!viewDetailAccessable ? '#FFFFFF' : '#E0E0E0',
              borderRadius: '6.25rem',
              padding: '0.5rem 1rem',
              fontStyle: 'bold',
              fontSize: '0.8rem',
              fontWeight: '500',
              // letterSpacing: '0.71px',
              border: '1px solid #DADCE0',
              height: '2.1rem',
              maxWidth: '7rem',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textTransform: 'none',
              flex: '0 0 auto',
              opacity: demoMode ? 0.6 : 1,
            }}
          />
          </Tooltip>
        </div>

        {/* Tabs Section */}
        <div
        style={{
          display: "flex", // Main flex container
          borderBottom: "1px solid #DADCE0",
          position: "relative",
          marginBottom: "20px",
          marginLeft: `-${parentHorizontalPadding}`,
          marginRight: `-${parentHorizontalPadding}`,
          paddingLeft: parentHorizontalPadding,
          paddingRight: parentHorizontalPadding,
        }}
>
  {/* Tab 1: Overview */}
  <div
    style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      cursor: "pointer",
      padding: "0.5rem 0",
    }}
    onClick={() => handleTabClick(0)}
  >
    <div style={{ position: "relative", display: "inline-block", padding: "0px 0px 6px", }}>
      <span
        style={{
          fontFamily: '"Google Sans Text", sans-serif',
          fontWeight: "500",
          fontSize: "0.875rem",
          color: tabValue === 0 ? "#0E4DCA" : "#575757",
        }}
      >
        Overview
      </span>
      <div
        style={{
          position: "absolute",
          bottom: "-0.5rem",
          left: 0,
          width: "100%",
          height: "3px",
          backgroundColor: tabValue === 0 ? "#0E4DCA" : "transparent",
          borderRadius: "2.5px 2.5px 0 0",
        }}
      />
    </div>
  </div>

  {/* Tab 2: Schema */}
  {getEntryType(previewData.name, '/') == 'Tables' && (<div
    style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      cursor: "pointer",
      padding: "0.5rem 0",
    }}
    onClick={() => handleTabClick(1)}
  >
    <div style={{ position: "relative", display: "inline-block", padding: "0px 0px 6px", }}>
      <span
        style={{
          fontFamily: '"Google Sans Text", sans-serif',
          fontWeight: "500",
          fontSize: "0.875rem",
          color: tabValue === 1 ? "#0E4DCA" : "#575757",
        }}
      >
        Schema
      </span>
      <div
        style={{
          position: "absolute",
          bottom: "-0.5rem",
          left: 0,
          width: "100%",
          height: "3px",
          backgroundColor: tabValue === 1 ? "#0E4DCA" : "transparent",
          borderRadius: "2.5px 2.5px 0 0",
        }}
      />
    </div>
  </div>)}

  {/* Tab 3: Aspects */}
  <div
    style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      cursor: "pointer",
      padding: "0.5rem 0",
    }}
    onClick={() => handleTabClick(2)}
  >
    <div style={{ position: "relative", display: "inline-block", padding: "0px 0px 6px" }}>
      <span
        style={{
          fontFamily: '"Google Sans Text", sans-serif',
          fontWeight: "500",
          fontSize: "0.875rem",
          color: tabValue === 2 ? "#0E4DCA" : "#575757",
        }}
      >
        Aspects
      </span>
      <div
        style={{
          position: "absolute",
          bottom: "-0.5rem",
          left: 0,
          width: "100%",
          height: "3px",
          backgroundColor: tabValue === 2 ? "#0E4DCA" : "transparent",
          borderRadius: "2.5px 2.5px 0 0",
        }}
      />
    </div>
  </div>
</div>

        {/* Tab Content */}
        <div style={{ padding: 0, flex: '1 1 auto', overflow: 'auto'}}>
          {tabValue === 0 && (
            <div style={{ color: "#6c6c6c" }}>
              {entryStatus === 'loading' ? (
                <>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0rem 0rem 0.875rem 0rem', gap: '0.25rem' }}>
                    <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500" }}>Description</div>
                    <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '90%', marginTop: "0.125rem" }} />
                    <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '70%' }} />
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Creation Time</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', marginTop: '0.125rem', width: '80%' }} />
                      </div>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Last Modification Time</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', marginTop: '0.125rem', width: '80%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Location</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', marginTop: '0.125rem', width: '60%' }} />
                      </div>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Last Run Time</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', marginTop: '0.125rem', width: '60%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0' }}>
                    <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500" }}>Contacts</div>
                    <Skeleton variant="text" sx={{ fontSize: '0.875rem', marginTop: '6px', width: '50%' }} />
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Parent</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '60%', marginTop: "0.125rem" }} />
                      </div>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Project</div>
                        <Skeleton variant="text" sx={{ fontSize: '0.875rem', width: '60%', marginTop: "0.125rem" }} />
                      </div>
                    </div>
                </div>
                </>
              ) : (
                <>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0rem 0rem 0.875rem 0rem', gap: '0.25rem'}}>
                    <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500"}}>Description</div>
                    <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", marginTop: "0.125rem" }}>{previewData.entrySource.description || '-'}</div>
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    {/* Creation Time Block */}
                    <div style={{ flex: '1 1 0' }}>
                      <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>
                        Creation Time
                      </div>
                      <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem" }}>
                        {creationDate}
                        <br />
                        {creationTime}
                      </div>
                    </div>

                    {/* Last Modification Time Block */}
                    <div style={{ flex: '1 1 0' }}>
                      <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>
                        Last Modification Time
                      </div>
                      <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem" }}>
                        {updateDate}
                        <br />
                        {updateTime}
                      </div>
                    </div>
                  </div>
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem'}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Location</div>
                        <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem" }}>{previewData.entrySource.location}</div>
                      </div>
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Last Run Time</div>
                        <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem" }}>{previewData.entrySource.lastRunTime || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0' }}>
                  <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500" }}>
                    Contacts
                  </div>
                  {entryStatus === 'succeeded' && contacts.length > 0 ? (
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', padding: '6px 0px' }}>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontSize: "14px", color: "#1F1F1F" }}>
                                {getDisplayName(contacts[0])}
                              </Typography>
                              {contacts.length > 1 && (
                                <Tooltip
                                  title={
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px' }}>
                                      {contacts.slice(1).map((contact: any, index: any) => (
                                        <Typography
                                          key={index}
                                          sx={{ fontFamily: '"Google Sans Text", sans-serif', fontSize: "12px" }}
                                        >
                                          {getDisplayName(contact)}
                                        </Typography>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Typography sx={{
                                    fontFamily: '"Google Sans Text", sans-serif',
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    color: "#0E4DCA",
                                    cursor: "pointer"
                                  }}>
                                    +{contacts.length - 1}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                    <Typography sx={{ fontFamily: '"Google Sans Text", sans-serif', fontSize: "14px", color: "#1F1F1F", marginTop: '6px' }}>
                      -
                    </Typography>
                  )}
                </div>
                <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem'}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: '1 1 0', width: '50%' }}>
                      <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Parent</div>
                      <Tooltip title={getName(previewData.parentEntry, '/') || '-'} arrow>
                        <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem", textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {getName(previewData.parentEntry, '/') || '-'}
                        </div>
                      </Tooltip>
                    </div>
                    <div style={{ flex: '1 1 0', width: '50%'  }}>
                      <div style={{ color: "#575757", fontSize: "0.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Project</div>
                      <Tooltip title={ ((previewData?.fullyQualifiedName || '').split(':').pop() || '').split('.')[0] || '-' } arrow>
                        <div style={{ color: "#1F1F1F", fontSize: "0.875rem", fontWeight: "400", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem", textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          { ((previewData?.fullyQualifiedName || '').split(':').pop() || '').split('.')[0] || '-' }
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>
          )}
          {tabValue === 1 && getEntryType(previewData.name, '/') == 'Tables' && (
              <>
                {entryStatus === 'succeeded' ? (
                  schemaData.length > 0 ? (
                    <div>
                      <SchemaFilter
                        entry={entry}
                        onFilteredEntryChange={setFilteredSchemaEntry}
                        isPreview={true}
                      />
                      {schema}
                    </div>
                  ) : (
                    <div style={{padding:"30px", textAlign: "center", fontSize: "14px", color: "#575757"}}>
                      No Schema Data available for this table
                    </div>
                  )
                ) : (
                  schema
                )}
              </>
          )}
          {tabValue === 2 && (
              <>
                {entryStatus === 'succeeded' ? (
                  hasAnnotations ? (
                    <div>
                      <AnnotationFilter
                        entry={entry}
                        onFilteredEntryChange={setFilteredAnnotationEntry}
                        onCollapseAll={handleAnnotationCollapseAll}
                        onExpandAll={handleAnnotationExpandAll}
                      />
                      {annotationTab}
                    </div>
                  ) : (
                    <div style={{padding:"30px", textAlign: "center", fontSize: "14px", color: "#575757"}}>
                      No Aspects Data available for this table
                    </div>
                  )
                ) : (
                  annotationTab
                )}
              </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: "#FFF",
        height: isGlossary ? '100%' : 'calc(100vh - 3.9rem)', 
        padding:"1.25rem",
        borderRadius:  "1.25rem", 
        marginLeft: isGlossary ? "0" : "0.9375rem", 
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto"
      }}>
        {preview}
      </div>

      {/* Backdrop Overlay */}
      {isSubmitAccessOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 }
            }
          }}
          onClick={handleCloseSubmitAccess}
        />
      )}

      {/* Submit Access Panel */}
      {previewData && (<SubmitAccess
        isOpen={isSubmitAccessOpen}
        onClose={handleCloseSubmitAccess}
        assetName={previewData?.entrySource?.displayName?.length > 0 ? previewData?.entrySource?.displayName : getName(previewData.name || '', '/')}
        entry={entry}
        onSubmitSuccess={handleSubmitSuccess}
        previewData={previewData ?? null}
      />)}

      {/* Notification Bar */}
      <NotificationBar
        isVisible={isNotificationVisible}
        onClose={handleCloseNotification}
        onUndo={handleUndoNotification}
        message={notificationMessage}
      />
    </>
  );
};

export default ResourcePreview;