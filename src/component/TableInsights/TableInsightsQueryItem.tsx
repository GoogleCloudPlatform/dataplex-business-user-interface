import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess, ContentCopy } from '@mui/icons-material';
import { Highlight, themes } from 'prism-react-renderer';
import { useNotification } from '../../contexts/NotificationContext';
import type { QueryItem } from '../../mocks/insightsMockData';

interface TableInsightsQueryItemProps {
  query: QueryItem;
}

const SparkleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.88504 5.85547C9.88504 10.0073 7.39397 12.4983 3.24219 12.4983C7.39397 12.4983 9.88504 14.9894 9.88504 19.1412C9.88505 14.9894 12.3761 12.4983 16.5279 12.4983C12.3761 12.4983 9.88504 10.0073 9.88504 5.85547Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.1864 16.6523C18.1864 18.2093 17.2522 19.1434 15.6953 19.1434C17.2522 19.1434 18.1864 20.0776 18.1864 21.6345C18.1864 20.0776 19.1205 19.1434 20.6775 19.1434C19.1205 19.1434 18.1864 18.2093 18.1864 16.6523Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18.1864 3.36719C18.1864 4.92411 17.2522 5.85826 15.6953 5.85826C17.2522 5.85826 18.1864 6.79241 18.1864 8.34933C18.1864 6.79241 19.1205 5.85826 20.6775 5.85826C19.1205 5.85826 18.1864 4.92411 18.1864 3.36719Z" stroke="#1F1F1F" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const TableInsightsQueryItem: React.FC<TableInsightsQueryItemProps> = ({ query }) => {
  const [expanded, setExpanded] = useState(false);
  const { showNotification } = useNotification();

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(query.sql);
    showNotification('SQL copied to clipboard', 'success', 3000);
  };

  return (
    <Box className="insights-query-item">
      {/* Query Header */}
      <Box
        className="insights-query-item__header"
        onClick={handleToggle}
        sx={{ cursor: 'pointer' }}
      >
        <Box className="insights-query-item__header-left">
          <SparkleIcon size={20} />
          <Typography className="insights-query-item__description">
            {query.description}
          </Typography>
        </Box>
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* SQL Code Block */}
      <Collapse in={expanded}>
        <Box className="insights-query-item__code-container">
          <IconButton
            size="small"
            className="insights-query-item__copy-btn"
            onClick={handleCopy}
            title="Copy SQL"
          >
            <ContentCopy sx={{ fontSize: 16 }} />
          </IconButton>
          {/* <pre className="insights-query-item__code">
            <code>query.sql</code>
          </pre> */}
          <Highlight theme={themes.nightOwlLight} code={query?.sql || ''} language="sql">
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <Box
                component="pre"
                className={className}
                sx={{
                    ...style, 
                    padding: '16px',
                    paddingRight: '40px',
                    margin: 0,
                    borderRadius: '8px',
                    overflow: 'auto',
                    fontSize: '12px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                }}
                >
                {tokens.map((line, i) => (
                    <div {...getLineProps({ line, key: i })}>
                    {line.map((token, key) => (
                        <span {...getTokenProps({ token, key })} />
                    ))}
                    </div>
                ))}
                </Box>
            )}
          </Highlight>
        </Box>
      </Collapse>
    </Box>
  );
};

export default TableInsightsQueryItem;