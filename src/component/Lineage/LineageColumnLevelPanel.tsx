import React from 'react';
import {
  Typography,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {Close } from '@mui/icons-material';
/**
 * @file LineageColumnLevelPanel.tsx
 * @description Side panel component to display detailed information about a lineage column level entry,
 * including asset info, aspects, and schema.
 */

interface LineageColumnLevelPanelProps {
  entryData?: any;
  columnName?: string;
  setColumnName?: (name: string) => void;
  fetchColumnLineage?: (columnName: string|undefined,  direction: 'upstream' | 'downstream' | 'both') => void;
  resetLineageGraph:()=>void;
  direction?: 'upstream' | 'downstream' | 'both';
  setDirection?: (direction: 'upstream' | 'downstream' | 'both') => void;
  onClose?: () => void;
  css?: React.CSSProperties;
}

const LineageColumnLevelPanel: React.FC<LineageColumnLevelPanelProps> = ({ entryData, columnName, setColumnName, direction, setDirection, fetchColumnLineage, resetLineageGraph, onClose, css }) => {
  const entry = entryData;

  const number = entry?.entryType?.split('/')[1];
  const schema = entry?.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values || [];

  return (
    <Box sx={{ 
      width: '22rem', 
      background: '#ffffff', 
      border: '1px solid #DADCE0',
      borderRadius: '0.5rem',
      height: '380px',
      overflowY: 'auto',
      flex: '0 0 auto',
      ...css 
    }}>
      {/* Panel Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1.25rem',
        background: '#fafafa'
      }}>
        <Typography variant="heading2Medium" sx={{ 
          fontWeight: 500, 
          color: '#1F1F1F',
          fontSize: '1rem',
          lineHeight: 1.4,
          //textTransform:"capitalize",
          width:"300px",
          textOverflow:"ellipses",
          overflow:"hidden"
        }}>
          Lineage Explorer (<span style={{ fontSize: '0.8rem' }}>Preview Feature</span>)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onClose && (
            <IconButton 
              onClick={onClose} 
              size="small"
              sx={{ 
                color: '#666',
                '&:hover': { 
                  background: '#f0f0f0',
                  color: '#333'
                }
              }}
            >
              <Close sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Content Container */}
      <Box sx={{ padding: '1rem', overflowY: 'auto' }}>
          <Box sx={{ 
            borderRadius: '8px', 
            overflow: 'hidden',
            background: '#ffffff'
          }}>
            <Typography variant="heading2Medium" sx={{ 
                fontWeight: 500, 
                color: '#1F1F1F',
                fontSize: '0.9rem',
                lineHeight: 1.4,
                //textTransform:"capitalize",
                width:"300px",
                textOverflow:"ellipses",
                overflow:"hidden"
                }}>
                Column Level Lineage
            </Typography>
            </Box>
            <Box sx={{ marginTop: '1rem' }}>
            <FormControl fullWidth>
                <InputLabel id="lineage-column-select-helper-label">Column Name</InputLabel>
                <Select
                    sx={{ 
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                    }}
                    labelId="lineage-column-select-helper-label"
                    id="lineage-column-select-helper"
                    value={columnName || ''}
                    label="Column Name"
                    onChange={(event) => {
                        const selectedColumn = event.target.value;
                        if (setColumnName) {
                            setColumnName(selectedColumn);
                        }}
                    }
                >
                    {
                        schema.map((field: any, index: number) => (
                            <MenuItem
                                sx={{ 
                                    fontSize: '0.9rem',
                                    lineHeight: 1.4,
                                }} 
                                key={index} value={field.structValue.fields.name.stringValue}>
                                {(field.structValue.fields.name.stringValue).toUpperCase()}
                            </MenuItem>
                        ))
                    }
                </Select>
            </FormControl>

            <Box sx={{ marginTop: '1rem' }}>
                <Typography variant="heading2Medium" sx={{ 
                    fontWeight: 500, 
                    color: '#1F1F1F',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    //textTransform:"capitalize",
                    width:"300px",
                    textOverflow:"ellipses",
                    overflow:"hidden"
                    }}
                >
                    Direction
                </Typography>
                <FormGroup>
                    <FormControlLabel 
                        sx={{
                            '&.MuiTypography-root': {
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                            }
                        }}
                        control={
                        <Checkbox 
                            sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                            }}
                            checked={(direction=='upstream' || direction=='both') ? true : false } 
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                if (setDirection) {
                                    setDirection(event.target.checked ? (direction != 'downstream' ? 'upstream' : 'both') : 'downstream');
                                }
                            }}
                        />
                    } label={
                        <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>UPSTREAM</span>
                    } />
                    <FormControlLabel 
                        sx={{ 
                            '&.MuiTypography-root': {
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                            }
                        }}
                        control={
                        <Checkbox
                            sx={{ 
                                fontSize: '0.9rem',
                                lineHeight: 1.4,
                            }} 
                            checked={(direction=='downstream' || direction=='both') ? true : false } 
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                if (setDirection) {
                                    setDirection(event.target.checked ? (direction != 'upstream' ? 'downstream' : 'both') : 'upstream');
                                }
                            }}
                        />
                    } label={
                        <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>DOWNSTREAM</span>
                    } />
                </FormGroup>
            </Box>
            <Box sx={{ marginTop: '1rem' }}>
                <button
                    style={{    
                        backgroundColor: '#1A73E8',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                    }}
                    onClick={() => {  
                        console.log('Apply clicked');  
                        if (fetchColumnLineage) {
                            fetchColumnLineage(columnName, direction || 'both');
                        }
                    }}
                >
                    Apply
                </button>
                <button
                    style={{    
                        backgroundColor: '#FFFFFF',
                        color: '#333333',
                        border:'1px solid #333333',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        position:'absolute',
                        right:'10px'
                    }}
                    onClick={() => {  
                        if (resetLineageGraph) {
                            resetLineageGraph();
                        }
                    }}
                >
                    Reset
                </button>
          </Box>
      </Box>
    </Box>
    </Box>
  );
};

export default LineageColumnLevelPanel;