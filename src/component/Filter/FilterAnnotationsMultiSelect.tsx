import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox
} from '@mui/material';
import { Search, Close, Check } from '@mui/icons-material';
import EditNoteIcon from '../../assets/svg/edit_note.svg';

/**
 * @file FilterAnnotationsMultiSelect.tsx
 * @description
 * This component renders a modal-like pop-up for multi-selecting filter options,
 * specifically designed for annotations.
 *
 * It features a two-panel layout:
 * 1.  **Left Panel (Browse):** Displays all available `options`. It includes a
 * search bar to filter the list and a "Select All" checkbox that
 * selects/deselects all *filtered* options.
 * 2.  **Right Panel (Selected):** Displays only the items currently present in the
 * `value` array. It shows a count of selected items and provides a
 * "Clear All" button.
 *
 * The component's visibility is controlled by the `isOpen` prop. It can be closed
 * by clicking the 'OK' button, the 'X' icon, or by clicking outside the
 * component's boundaries.
 *
 * @param {FilterAnnotationsMultiSelectProps} props - The props for the component.
 * @param {string[]} [props.options=[]] - The complete list of available string
 * options to display in the filter.
 * @param {string[]} [props.value=[]] - The array of currently selected option strings.
 * @param {(value: string[]) => void} props.onChange - Callback function invoked with
 * the new array of selected values whenever a selection is toggled, cleared, or
 * "Select All" is used.
 * @param {() => void} props.onClose - Callback function invoked when the user
 * clicks 'OK', the 'Close' icon, or outside the component.
 * @param {boolean} props.isOpen - Controls whether the component is visible.
 * @param {string} [props.filterType='Annotations'] - (Optional) The string to
 * display as the title in the component's header.
 * @param {{ top: number; left: number } | null} [props.position=null] - (Optional)
 * An object with `top` and `left` coordinates for fixed positioning of the pop-up.
 *
 * @returns {React.ReactElement | null} A React element representing the filter
 * pop-up, or `null` if `isOpen` is false.
 */

interface FilterAnnotationsMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
  filterType?: string;
  position?: { top: number; left: number } | null;
}

const FilterAnnotationsMultiSelect: React.FC<FilterAnnotationsMultiSelectProps> = ({
  options = [],
  value = [],
  onChange,
  onClose,
  isOpen,
  filterType = 'Annotations',
  position = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    return options.filter((option: string) => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleToggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(item => item !== option)
      : [...value, option];
    onChange(newValue);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      // If all are selected, deselect all
      onChange([]);
    } else {
      // Select all filtered options
      onChange([...filteredOptions]);
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        top: position ? `${position.top}px` : '6.25rem',
        left: position ? `${position.left}px` : '13.75rem',
        zIndex: 1300,
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        boxShadow: '0px 1px 3px 0px rgba(60, 64, 67, 0.3), 0px 4px 8px 3px rgba(60, 64, 67, 0.15)',
        width: '44rem',
        height: '21.3125rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #DADCE0',
          flex: '0 0 auto'
        }}
      >
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '1rem',
            lineHeight: 1.5,
            color: '#1F1F1F',
            flex: '0 1 auto'
          }}
        >
          {filterType}
        </Typography>
        <Button
          onClick={onClose}
          sx={{
            minWidth: 'auto',
            padding: 0,
            color: '#1F1F1F',
            width: '1.5rem',
            height: '1.5rem',
            flex: '0 0 auto',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <Close sx={{ fontSize: '0.875rem' }} />
        </Button>
      </Box>





      {/* Main Content - Two Panels */}
      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          overflow: 'hidden'
        }}
      >
        {/* Left Panel - Browse Options */}
        <Box
          sx={{
            flex: '1 1 auto',
            borderRight: '1px solid #DADCE0',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Bar with Select All Checkbox */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.3125rem 0.75rem 0.3125rem 1.125rem',
              borderBottom: '1px solid #DADCE0',
              flexShrink: 0,
              flex: '0 0 auto'
            }}
          >
            <Checkbox
              checked={filteredOptions.length > 0 && value.length === filteredOptions.length}
              indeterminate={value.length > 0 && value.length < filteredOptions.length}
              onChange={handleSelectAll}
              sx={{
                color: '#575757',
                '&.Mui-checked': {
                  color: '#0E4DCA',
                },
                '&.MuiCheckbox-indeterminate': {
                  color: '#0E4DCA',
                },
                padding: '0px',
                marginRight: '8px'
              }}
            />
            <Search sx={{ color: '#1F1F1F', fontSize: '16px' }} />
            <TextField
              placeholder={`Search for ${filterType.toLowerCase()}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="standard"
              fullWidth
              sx={{
                '& .MuiInput-root': {
                  fontSize: '0.75rem',
                  color: '#575757',
                  '&:before': { borderBottom: 'none' },
                  '&:after': { borderBottom: 'none' },
                  '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
                },
                '& .MuiInput-input': {
                  padding: 0,
                  fontSize: '0.75rem',
                  color: '#575757',
                  fontWeight: 400,
                  lineHeight: 1.33,
                  letterSpacing: '0.83px',
                  flex: '1 1 auto'
                },
              }}
            />
          </Box>

          {/* Options List */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '18px',
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.38)',
                borderRadius: '31px',
                opacity: 0.5,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            {filteredOptions.map((option) => (
              <Box
                key={option}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  width: '100%',
                  cursor: 'pointer',
                  padding: '4px 0px'
                }}
                onClick={() => handleToggleOption(option)}
              >
                {value.includes(option) ? (
                  <Box
                    sx={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      backgroundColor: '#0E4DCA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOption(option);
                    }}
                  >
                    <Check sx={{ fontSize: '14px', color: '#FFFFFF' }} />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '2px solid #575757',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleOption(option);
                    }}
                  />
                )}
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '1.3333333333333333em',
                    letterSpacing: '0.8333333457509676%',
                    color: '#1F1F1F',
                    flex: 1,
                  }}
                >
                  {option}
                </Typography>
                <img 
                  src={EditNoteIcon} 
                  alt="Edit Note" 
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
              </Box>
            ))}
            {filteredOptions.length === 0 && (
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.3333333333333333em',
                  color: '#575757',
                  padding: '16px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                No {`${filterType.toLowerCase()}`} found
              </Typography>
            )}
          </Box>
        </Box>

        {/* Right Panel - Selected Items */}
        <Box
          sx={{
            width: '352px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Selected Count and Clear All Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '9px 16px',
              borderBottom: '1px solid #DADCE0',
              flexShrink: 0
            }}
          >
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '1.3333333333333333em',
                color: '#1F1F1F'
              }}
            >
              {value.length} Selected
            </Typography>
            <Button
              onClick={handleClearAll}
              sx={{
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '1.3333333333333333em',
                color: '#0E4DCA',
                textTransform: 'none',
                padding: '0',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              Clear All
            </Button>
          </Box>

          {/* Selected Items List */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '18px',
              flex: 1,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.38)',
                borderRadius: '31px',
                opacity: 0.5,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            {value.map((selectedOption) => (
              <Box
                key={selectedOption}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  width: '100%',
                  padding: '4px 0px'
                }}
              >
                <Box
                  sx={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    backgroundColor: '#0E4DCA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleOption(selectedOption);
                  }}
                >
                  <Check sx={{ fontSize: '14px', color: '#FFFFFF' }} />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: '12px',
                    lineHeight: '1.3333333333333333em',
                    color: '#1F1F1F',
                    flex: 1,
                  }}
                >
                  {selectedOption}
                </Typography>
                <img 
                  src={EditNoteIcon} 
                  alt="Edit Note" 
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
              </Box>
            ))}
            {value.length === 0 && (
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '1.3333333333333333em',
                  color: '#575757',
                  padding: '16px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                No items selected
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Footer with OK Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '8px',
          borderTop: '1px solid #DADCE0',
          flex: '0 0 auto'
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: '#0E4DCA',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'none',
            padding: '6px 16px',
            minWidth: 'auto',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#0B4BA8',
            },
          }}
        >
          OK
        </Button>
      </Box>
    </Box>
  );
};

export default FilterAnnotationsMultiSelect;
