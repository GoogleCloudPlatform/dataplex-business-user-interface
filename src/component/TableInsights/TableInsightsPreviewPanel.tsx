import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TablePagination,
} from '@mui/material';
import { Close, FilterList } from '@mui/icons-material';
import type { ColumnDescription } from '../../mocks/insightsMockData';

interface TableInsightsPreviewPanelProps {
  currentDescription: string;
  geminiDescription: string;
  columnDescriptions: ColumnDescription[];
  onClose: () => void;
}

const TableInsightsPreviewPanel: React.FC<TableInsightsPreviewPanelProps> = ({
  currentDescription,
  geminiDescription,
  columnDescriptions,
  onClose,
}) => {
  const [filterTerm, setFilterTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter column descriptions
  const filteredColumns = columnDescriptions.filter((col) =>
    col.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
    col.description.toLowerCase().includes(filterTerm.toLowerCase())
  );

  // Paginate filtered columns
  const paginatedColumns = filteredColumns.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #DADCE0',
          flex: '0 0 auto',
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Google Sans", sans-serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#1F1F1F',
            lineHeight: '24px',
          }}
        >
          Preview descriptions
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#1F1F1F',
            width: '24px',
            height: '24px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <Close sx={{ fontSize: '24px' }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '0 24px 24px 24px',
          flex: '1 1 auto',
          overflowY: 'auto',
        }}
      >
        {/* Table Description Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1F1F1F',
              lineHeight: '20px',
              marginTop: '20px',
              marginBottom: '0',
            }}
          >
            Table Description
          </Typography>

          {/* Current description field */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '12px 0 20px',
              gap: '4px',
              width: '100%',
              borderBottom: '1px solid #DADCE0',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '16px',
                letterSpacing: '0.1px',
              }}
            >
              Current description
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: '20px',
              }}
            >
              {currentDescription}
            </Typography>
          </Box>

          {/* Gemini generated description field */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '12px 0 20px',
              gap: '4px',
              width: '100%',
              borderBottom: '1px solid #DADCE0',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#575757',
                lineHeight: '16px',
                letterSpacing: '0.1px',
              }}
            >
              Gemini generated description
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Google Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: '20px',
              }}
            >
              {geminiDescription}
            </Typography>
          </Box>
        </Box>

        {/* Column Descriptions Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 0,
            gap: '4px',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              color: '#1F1F1F',
              lineHeight: '20px',
            }}
          >
            Column descriptions
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              color: '#575757',
              lineHeight: '16px',
              letterSpacing: '0.1px',
              marginBottom: '12px',
            }}
          >
            Here are the column descriptions generated by Gemini.
          </Typography>

          {/* Table with Filter */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: '100%',
              border: '1px solid #E1E3E1',
              borderRadius: '4px',
            }}
          >
            {/* Filter Bar */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '8px 16px',
                gap: '8px',
                width: '100%',
                borderBottom: '1px solid #DADCE0',
                boxSizing: 'border-box',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FilterList sx={{ fontSize: '16px', color: '#1F1F1F' }} />
                <Typography
                  sx={{
                    fontFamily: '"Google Sans", sans-serif',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#1F1F1F',
                    lineHeight: '20px',
                  }}
                >
                  Filter
                </Typography>
              </Box>
              <InputBase
                placeholder="Enter property name or value"
                value={filterTerm}
                onChange={(e) => {
                  setFilterTerm(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  fontFamily: '"Roboto", sans-serif',
                  fontSize: '12px',
                  color: '#575757',
                  '& .MuiInputBase-input::placeholder': {
                    color: '#575757',
                    opacity: 1,
                  },
                }}
              />
            </Box>

            {/* Table Header */}
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                backgroundColor: '#F0F4F8',
                borderBottom: '1px solid #DADCE0',
              }}
            >
              <Box
                sx={{
                  flex: '0 0 30%',
                  padding: '8px 16px',
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#444746',
                  lineHeight: '16px',
                  letterSpacing: '0.1px',
                }}
              >
                Column description
              </Box>
              <Box
                sx={{
                  flex: '0 0 25%',
                  padding: '8px 16px',
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#444746',
                  lineHeight: '16px',
                  letterSpacing: '0.1px',
                }}
              >
                Current description
              </Box>
              <Box
                sx={{
                  flex: '0 0 45%',
                  padding: '8px 16px',
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#444746',
                  lineHeight: '16px',
                  letterSpacing: '0.1px',
                }}
              >
                Gemini generated description
              </Box>
            </Box>

            {/* Table Body */}
            <TableContainer sx={{ maxHeight: '300px' }}>
              <Table size="small" stickyHeader>
                <TableBody>
                  {paginatedColumns.map((col, index) => (
                    <TableRow key={index}>
                      <TableCell
                        sx={{
                          flex: '0 0 30%',
                          width: '30%',
                          fontFamily: '"Google Sans", sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#1F1F1F',
                          lineHeight: '16px',
                          letterSpacing: '0.1px',
                          padding: '10px 16px',
                          borderBottom: '1px solid #DADCE0',
                        }}
                      >
                        {col.name}
                      </TableCell>
                      <TableCell
                        sx={{
                          flex: '0 0 25%',
                          width: '25%',
                          fontFamily: '"Google Sans", sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#1F1F1F',
                          lineHeight: '16px',
                          letterSpacing: '0.1px',
                          padding: '10px 16px',
                          borderBottom: '1px solid #DADCE0',
                        }}
                      >
                        -
                      </TableCell>
                      <TableCell
                        sx={{
                          flex: '0 0 45%',
                          width: '45%',
                          fontFamily: '"Google Sans", sans-serif',
                          fontSize: '12px',
                          fontWeight: 400,
                          color: '#1F1F1F',
                          lineHeight: '16px',
                          letterSpacing: '0.1px',
                          padding: '10px 16px',
                          borderBottom: '1px solid #DADCE0',
                        }}
                      >
                        {col.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Pagination */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%',
              marginTop: '0',
            }}
          >
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredColumns.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  color: '#5E5E5E',
                },
                '& .MuiTablePagination-select': {
                  fontFamily: '"Google Sans", sans-serif',
                  fontSize: '12px',
                  color: '#1F1F1F',
                },
                '& .MuiTablePagination-toolbar': {
                  paddingRight: 0,
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TableInsightsPreviewPanel;