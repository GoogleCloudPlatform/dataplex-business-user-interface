import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, Tooltip } from '@mui/material';
import { ExpandMore, ExpandLess, HelpOutline } from '@mui/icons-material';

interface InsightsTableDescriptionProps {
  description: string;
  onViewColumnDescriptions: () => void;
}

const SparkleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.88504 5.85547C9.88504 10.0073 7.39397 12.4983 3.24219 12.4983C7.39397 12.4983 9.88504 14.9894 9.88504 19.1412C9.88505 14.9894 12.3761 12.4983 16.5279 12.4983C12.3761 12.4983 9.88504 10.0073 9.88504 5.85547Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.1864 16.6523C18.1864 18.2093 17.2522 19.1434 15.6953 19.1434C17.2522 19.1434 18.1864 20.0776 18.1864 21.6345C18.1864 20.0776 19.1205 19.1434 20.6775 19.1434C19.1205 19.1434 18.1864 18.2093 18.1864 16.6523Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.1864 3.36719C18.1864 4.92411 17.2522 5.85826 15.6953 5.85826C17.2522 5.85826 18.1864 6.79241 18.1864 8.34933C18.1864 6.79241 19.1205 5.85826 20.6775 5.85826C19.1205 5.85826 18.1864 4.92411 18.1864 3.36719Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const InsightsTableDescription: React.FC<InsightsTableDescriptionProps> = ({
  description,
  onViewColumnDescriptions,
}) => {
  const [expanded, setExpanded] = useState(true);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box className="insights-section">
      {/* Header */}
      <Box
        className="insights-section__header"
        onClick={handleToggle}
        sx={{ cursor: 'pointer' }}
      >
        <Box className="insights-section__header-left">
          <SparkleIcon />
          <Typography
            className="insights-section__title"
            sx={{
              fontFamily: '"Google Sans"',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '18px',
              lineHeight: '24px',
              color: '#1F1F1F',
            }}
          >
            Table Description
          </Typography>
          <Tooltip title="AI-generated description of this table based on its schema and data patterns">
            <HelpOutline sx={{ fontSize: 16, color: '#575757', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Content */}
      <Collapse in={expanded}>
        <Box className="insights-section__content">
          <Typography
            className="insights-section__description"
            sx={{
              fontFamily: '"Google Sans"',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '20px',
              color: '#1F1F1F',
              marginBottom: '16px',
            }}
          >
            {description}
          </Typography>
          <Typography
            component="span"
            className="insights-section__link"
            onClick={onViewColumnDescriptions}
            sx={{
              fontFamily: '"Google Sans"',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0.1px',
              color: '#0B57D0',
              cursor: 'pointer',
            }}
          >
            View column descriptions
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};

export default InsightsTableDescription;