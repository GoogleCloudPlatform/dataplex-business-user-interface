import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, InputBase, Tooltip } from '@mui/material';
import { ExpandMore, ExpandLess, HelpOutline, FilterList } from '@mui/icons-material';
import TableInsightsQueryItem from './TableInsightsQueryItem'; 
import type { GroupedQueries } from '../../utils/insightsUtils'; 

interface TableInsightsGeneratedQueriesProps {
  groupedQueries: GroupedQueries[];
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const TableInsightsGeneratedQueries: React.FC<TableInsightsGeneratedQueriesProps> = ({
  groupedQueries,
  searchTerm,
  onSearchTermChange,
}) => {
  const [mainExpanded, setMainExpanded] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const handleMainToggle = () => {
    setMainExpanded(!mainExpanded);
  };

  const handleDateToggle = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  return (
    <Box className="insights-section insights-section--queries">
      {/* Header */}
      <Box
        className="insights-section__header"
        onClick={handleMainToggle}
        sx={{ cursor: 'pointer' }}
      >
        <Box className="insights-section__header-left">
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
            Generated Queries
          </Typography>
          <Tooltip title="AI-generated SQL queries based on the table's schema and data patterns">
            <HelpOutline sx={{ fontSize: 16, color: '#575757', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMainToggle(); }}>
          {mainExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={mainExpanded}>
        {/* Filter Bar */}
        <Box className="insights-filter-bar">
          <FilterList sx={{ fontSize: 16, color: '#1F1F1F' }} />
          <Typography
            sx={{
              fontFamily: '"Google Sans"',
              fontStyle: 'normal',
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '20px',
              color: '#1F1F1F',
            }}
          >
            Filter
          </Typography>
          <InputBase
            placeholder="Search query description"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            sx={{
              fontFamily: '"Google Sans"',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '20px',
              color: '#575757',
              flex: 1,
              '& .MuiInputBase-input::placeholder': {
                fontFamily: '"Google Sans"',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '20px',
                color: '#575757',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Query Groups by Date */}
        <Box className="insights-queries-list">
          {groupedQueries.length === 0 ? (
            <Box className="insights-queries-empty">
              <Typography>No queries match your search criteria.</Typography>
            </Box>
          ) : (
            groupedQueries.map((group) => (
              <Box key={group.jobUid} className={`insights-date-group ${expandedDates.has(group.jobUid) ? 'insights-date-group--expanded' : ''}`}>
                {/* Date Header */}
                <Box
                  className="insights-date-group__header"
                  onClick={() => handleDateToggle(group.jobUid)}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Google Sans"',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: '#1F1F1F',
                    }}
                  >
                    Generated date: {group.formattedDate}
                  </Typography>
                  <IconButton size="small">
                    {expandedDates.has(group.jobUid) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                {/* Queries for this date */}
                <Collapse in={expandedDates.has(group.jobUid)}>
                  <Box className="insights-date-group__queries">
                    {group.queries.map((query, index) => (
                      <TableInsightsQueryItem
                        key={`${group.jobUid}-${index}`}
                        query={query}
                      />
                    ))}
                  </Box>
                </Collapse>
              </Box>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TableInsightsGeneratedQueries;