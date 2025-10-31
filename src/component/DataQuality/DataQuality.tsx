import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import CurrentRules from './CurrentRules';
import DataQualityStatus from './DataQualityStatus';
import { useAuth } from '../../auth/AuthProvider';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchDataScan, selectScanData, selectScanStatus, selectIsScanLoading } from '../../features/dataScan/dataScanSlice';

/**
 * @file DataQuality.tsx
 * @summary Orchestrates and renders the "Data Quality" tab for a data entry.
 *
 * @description
 * This component serves as the main container for the Data Quality section.
 *
 * 1.  **Data Fetching**: On mount, it inspects the `entry.entrySource.labels`
 * to find a Dataplex Data Quality Scan ID (`dataplex-dq-published-scan`).
 * 2.  **Redux Integration**: It uses this scan ID (formatted as a full scan name)
 * to check the Redux store (via `dataScanSlice` selectors) to see if the
 * scan's data has already been fetched.
 * 3.  **API Call**: If the data is not in the store and not already loading,
 * it dispatches the `fetchDataScan` action to retrieve it.
 * 4.  **State Handling**: It manages and renders different UI based on the
 * fetch status:
 * -   **Loading**: Displays a `CircularProgress` spinner.
 * -   **No Data**: If no scan ID is found in the entry's labels or the
 * fetch fails, it displays a "No published Data Quality available"
 * message.
 * -   **Success**: It renders the `CurrentRules` and `DataQualityStatus`
 * components side-by-side, passing the fetched `dataQualityScan`
 * object to both.
 *
 * @param {object} props - The props for the DataQuality component.
 * @param {any} props.entry - The data entry object, which is inspected for
 * data quality scan labels.
 *
 * @returns {JSX.Element} A React component that renders the Data Quality
 * section, showing either a loader, a "no data" message, or the detailed
 * rule and status components.
 */

interface DataQualityProps {
  entry: any;
}

const DataQuality: React.FC<DataQualityProps> = ({ entry }) => {

  const { user } = useAuth();
  const id_token = user?.token || '';
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState<boolean>(true);
  const [dataQualityAvailable, setDataQualityAvailable] = useState<boolean>(false);

  // Get the scan name for this component
  const scanName = React.useMemo(() => {
    const labels: Object = entry?.entrySource?.labels;
    if (entry && labels && labels.hasOwnProperty('dataplex-dq-published-scan')) {
      const dqScanProject = entry.entrySource.labels['dataplex-dq-published-project'];
      const dqScanLocation = entry.entrySource.labels['dataplex-dq-published-location'];
      const dqScanId = entry.entrySource.labels['dataplex-dq-published-scan'];
      return `projects/${dqScanProject}/locations/${dqScanLocation}/dataScans/${dqScanId}`;
    }
    return null;
  }, [entry]);

  // Use selectors to get data for this specific scan
  const dataQualityScan = useSelector(selectScanData(scanName || ''));
  const dataQualityScanStatus = useSelector(selectScanStatus(scanName || ''));
  const isScanLoading = useSelector(selectIsScanLoading(scanName || ''));

  useEffect(() => {
    // Only fetch if we have a scan name and token, and don't already have the data
    if (scanName && id_token && !dataQualityScan && !isScanLoading) {
      console.log("Data Quality Scan Name:", scanName);
      dispatch(fetchDataScan({ name: scanName, id_token: id_token }));
    } else if (scanName && dataQualityScan) {
      // We already have the data, no need to fetch
      setDataQualityAvailable(true);
      setLoading(false);
    } else if (!scanName) {
      // No scan available
      setLoading(false);
    }
  }, [scanName, id_token, dataQualityScan, isScanLoading, dispatch]);

  useEffect(() => {
    // Handle data scan status changes
    if (dataQualityScanStatus === 'succeeded' && dataQualityScan) {
      setDataQualityAvailable(true);
      setLoading(false);
      console.log("Data Quality Scan:", dataQualityScan);
    } else if (dataQualityScanStatus === 'failed') {
      setDataQualityAvailable(false);
      setLoading(false);
      console.log("Data Quality Scan failed");
    } else if (dataQualityScanStatus === 'idle' && !scanName) {
      setLoading(false);
    }
  }, [dataQualityScanStatus, dataQualityScan, scanName]);

  return (
    <Box sx={{
      display: 'flex',
      gap: '0.125rem',
      padding: '1.25rem',
      height: '100%',
      minHeight: '31.25rem',
      marginLeft: '-1.25rem',
      width: 'calc(100% + 2.5rem)',
    }}>
      { loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '31.25rem' }}>
          <CircularProgress />
        </div>) : (dataQualityAvailable ? (
        <>
          <CurrentRules dataQualtyScan={dataQualityScan}/>
          <DataQualityStatus dataQualityScan={dataQualityScan}/>
        </>)
        : (
          <Box sx={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #DADCE0',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '500px'
                }}>
          <Typography sx={{
          fontSize: '14px',
          fontWeight: 400,
          color: '#575757',
          lineHeight: '1.43em' }}>
            No published Data Quality available for this entry
          </Typography>
          </Box>
        )) 
      }
      
    </Box>
  );
};

export default DataQuality;
