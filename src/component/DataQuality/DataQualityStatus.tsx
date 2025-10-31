import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import { 
  ExpandLess,
  InfoOutline
} from '@mui/icons-material';

/**
 * @file DataQualityStatus.tsx
 * @summary Renders a collapsible panel displaying the status and scores of a Data Quality scan.
 *
 * @description
 * This component displays a high-level summary of the results from a Data Quality
 * scan. It is rendered as a collapsible box, controlled by its internal `isExpanded`
 * state.
 *
 * It parses the `dataQualityScan` prop (specifically the first job in the
 * `jobs` array) to display:
 * 1.  An "Overall Score" as a percentage, visualized with a horizontal bar graph.
 * 2.  The timestamp of the last scan.
 * 3.  The total count of "Passed Rules".
 * 4.  Specific scores for dimensions like "Completeness", "Uniqueness", and
 * "Validity", along with a green check icon if a score is present.
 *
 * @param {object} props - The props for the DataQualityStatus component.
 * @param {any} props.dataQualityScan - The full data quality scan object, which
 * is expected to contain a `jobs` array. The component will parse the
 * `dataQualityResult` from the first job (`jobs[0]`).
 *
 * @returns {JSX.Element} A React component rendering the collapsible status panel.
 */

interface DataQualityStatusProps {
  dataQualityScan: any;
}

const DataQualityStatus: React.FC<DataQualityStatusProps> = ({dataQualityScan}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const dataQualityScanPublishedJob = dataQualityScan.jobs[0];

  const getFormatedDate = (date: any) =>{
    const myDate = new Date(date * 1000);
    const formatedDate = new Intl.DateTimeFormat('en-US', { month: "short" , day: "numeric", year: "numeric" }).format(myDate);
    return (formatedDate);
  }

  return (
    <Box 
      onClick={() => setIsExpanded(!isExpanded)}
      sx={{
      flex: 1,
      alignSelf: 'flex-start',
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
      border: '1px solid #DADCE0',
      marginLeft: '1rem',
      height: isExpanded ? '17rem' : 'auto',
      overflow:'auto', 
      cursor: 'pointer'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#F8FAFD',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Typography 
          variant="heading2Medium"  
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            color: '#1F1F1F',
            lineHeight: 1.33
          }}>
            Data Quality Status
          </Typography>
          <Tooltip title="Data Quality Status indicates the current data quality score across different dimensions" arrow>
            <InfoOutline
                sx={{
                    fontWeight: 800,
                    width: "18px",
                    height: "18px",
                    opacity: 0.9
                }}
            />
          </Tooltip>
        </Box>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            padding: '0.25rem',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ExpandLess sx={{ 
            fontSize: '1.5rem',
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease'
          }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={isExpanded} timeout={300}>
        <Box sx={{ padding: '0px 0px 0px 20px', paddingBottom: '0px' }}>
          {/* Overall Score Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              padding: '14px 20px 14px 0px',
              width: '101px',
              height: '70px',
              borderBottom: '1px solid #DADCE0'
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '1.45em',
                letterSpacing: '0.1px'
              }}>
                Overall Score
              </Typography>
              <Typography sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: 1.43
              }}>
                {`${dataQualityScanPublishedJob?.dataQualityResult?.score}%`}
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              padding: '16px 20px 16px 0px',
              flex: 1,
              borderBottom: '1px solid #DADCE0'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <Box sx={{
                  height: '17px',
                  backgroundColor: '#128937',
                  borderRadius: '4px',
                  width: `${dataQualityScanPublishedJob?.dataQualityResult?.score}%`
                }} />
                <Typography sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: '#575757',
                  lineHeight: '1.45em',
                  letterSpacing: '0.1px'
                }}>
                  {getFormatedDate(dataQualityScanPublishedJob?.endTime?.seconds)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quality Metrics Sections */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'stretch',
            alignItems: 'stretch',
            padding: '0px 0px 0px 0px'
          }}>
            {/* Passed Rules - Aligned with Overall Score */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              padding: '14px 20px 14px 0px',
              width: '101px',
              borderBottom: '1px solid #DADCE0'
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '1.45em',
                letterSpacing: '0.1px'
              }}>
                Passed Rules
              </Typography>
              <Typography sx={{
                fontSize: '0.875rem',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: 1.43
              }}>
                {`${dataQualityScanPublishedJob?.dataQualityResult?.rules.length}`}
              </Typography>
            </Box>

            {/* Completeness */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              padding: '14px 20px 14px 0px',
              flex: 1,
              borderBottom: '1px solid #DADCE0'
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '1.45em',
                letterSpacing: '0.1px'
              }}>
                Completeness
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '4px'
              }}>
                {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'COMPLETENESS')?.score && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="14" height="14" rx="7" fill="#128937"/>
                    <path d="M5.76783 10C5.69499 10 5.62418 9.98543 5.55539 9.9563C5.4866 9.92716 5.42387 9.88346 5.36722 9.82519L3.16995 7.56512C3.05665 7.44858 3 7.30706 3 7.14057C3 6.97409 3.05665 6.83257 3.16995 6.71603C3.28326 6.59949 3.41882 6.54122 3.57663 6.54122C3.73445 6.54122 3.87405 6.59949 3.99545 6.71603L5.76783 8.53907L10.0167 4.18126C10.13 4.06472 10.2656 4.00436 10.4234 4.0002C10.5812 3.99604 10.7167 4.05639 10.83 4.18126C10.9433 4.2978 11 4.43931 11 4.6058C11 4.77229 10.9433 4.9138 10.83 5.03034L6.16844 9.82519C6.11179 9.88346 6.04906 9.92716 5.98027 9.9563C5.91148 9.98543 5.84067 10 5.76783 10Z" fill="white"/>
                  </svg>
                )}
                <Typography sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: '#1F1F1F',
                  lineHeight: 1.43
                }}>
                  {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'COMPLETENESS')?.score ? 
                    `${dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'COMPLETENESS')?.score}%` : 
                    '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Second Row */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'stretch',
            alignItems: 'stretch',
            padding: '0px 0px 0px 0px',
            marginBottom: '0px'
          }}>
            {/* Uniqueness - Aligned with Overall Score */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              padding: '14px 20px 0px 0px',
              width: '101px',
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '1.45em',
                letterSpacing: '0.1px'
              }}>
                Uniqueness
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '4px'
              }}>
                {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'UNIQUENESS')?.score && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="14" height="14" rx="7" fill="#128937"/>
                    <path d="M5.76783 10C5.69499 10 5.62418 9.98543 5.55539 9.9563C5.4866 9.92716 5.42387 9.88346 5.36722 9.82519L3.16995 7.56512C3.05665 7.44858 3 7.30706 3 7.14057C3 6.97409 3.05665 6.83257 3.16995 6.71603C3.28326 6.59949 3.41882 6.54122 3.57663 6.54122C3.73445 6.54122 3.87405 6.59949 3.99545 6.71603L5.76783 8.53907L10.0167 4.18126C10.13 4.06472 10.2656 4.00436 10.4234 4.0002C10.5812 3.99604 10.7167 4.05639 10.83 4.18126C10.9433 4.2978 11 4.43931 11 4.6058C11 4.77229 10.9433 4.9138 10.83 5.03034L6.16844 9.82519C6.11179 9.88346 6.04906 9.92716 5.98027 9.9563C5.91148 9.98543 5.84067 10 5.76783 10Z" fill="white"/>
                  </svg>
                )}
                <Typography sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: '#1F1F1F',
                  lineHeight: 1.43
                }}>
                  {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'UNIQUENESS')?.score ? 
                    `${dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'UNIQUENESS')?.score}%` : 
                    '-'}
                </Typography>
              </Box>
            </Box>

            {/* Validity */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              padding: '14px 20px 0px 0px',
              flex: 1,
            }}>
              <Typography sx={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '1.45em',
                letterSpacing: '0.1px'
              }}>
                Validity
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '4px'
              }}>
                {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'VALIDITY')?.score && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="14" height="14" rx="7" fill="#128937"/>
                    <path d="M5.76783 10C5.69499 10 5.62418 9.98543 5.55539 9.9563C5.4866 9.92716 5.42387 9.88346 5.36722 9.82519L3.16995 7.56512C3.05665 7.44858 3 7.30706 3 7.14057C3 6.97409 3.05665 6.83257 3.16995 6.71603C3.28326 6.59949 3.41882 6.54122 3.57663 6.54122C3.73445 6.54122 3.87405 6.59949 3.99545 6.71603L5.76783 8.53907L10.0167 4.18126C10.13 4.06472 10.2656 4.00436 10.4234 4.0002C10.5812 3.99604 10.7167 4.05639 10.83 4.18126C10.9433 4.2978 11 4.43931 11 4.6058C11 4.77229 10.9433 4.9138 10.83 5.03034L6.16844 9.82519C6.11179 9.88346 6.04906 9.92716 5.98027 9.9563C5.91148 9.98543 5.84067 10 5.76783 10Z" fill="white"/>
                  </svg>
                )}
                <Typography sx={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: '#1F1F1F',
                  lineHeight: 1.43
                }}>
                  {dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'VALIDITY')?.score ? 
                    `${dataQualityScanPublishedJob?.dataQualityResult?.dimensions.find((d:any) => d.dimension.name === 'VALIDITY')?.score}%` : 
                    '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

        </Box>
      </Collapse>
    </Box>
  );
};

export default DataQualityStatus;
