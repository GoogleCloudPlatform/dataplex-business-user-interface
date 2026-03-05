import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  InputBase,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  ClickAwayListener,
  MenuList,
  CircularProgress,
} from "@mui/material";
import { Search, ExpandMore, Sort, Close } from "@mui/icons-material";
import AnnotationSubitemIcon from '../../assets/svg/annotation-subitem.svg';
import TypeIcon from '../../assets/svg/type-icon.svg';

// Helper function to format type display
const formatTypeDisplay = (type: string, stringType?: string): string => {
  // Handle string type with various stringType values
  if (type === 'string') {
    if (stringType === 'richText') {
      return 'Text (Rich Text)';
    }
    if (stringType === 'resource') {
      return 'Text (Resource)';
    }
    if (stringType === 'url') {
      return 'Text (URL)';
    }
    // Plain text (empty or no stringType)
    return 'Text';
  }

  // Handle other types with proper display names
  const typeDisplayMap: Record<string, string> = {
    'bool': 'Boolean',
    'int': 'Integer',
    'enum': 'Enum',
    'record': 'Record',
    'array': 'Array',
    'map': 'Map',
    'double': 'Double',
    'float': 'Float',
  };

  return typeDisplayMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

// Filter types
type FilterFieldType = 'name' | 'description' | 'type';

interface FilterChip {
  id: string;
  field: FilterFieldType;
  value: string;
  displayLabel: string;
  isOr?: boolean; // If true, this filter is OR'd with previous filters
}

const FILTER_FIELD_LABELS: Record<FilterFieldType, string> = {
  name: 'Name',
  description: 'Description',
  type: 'Type',
};

const VALID_FILTER_FIELDS: FilterFieldType[] = ['name', 'description', 'type'];

interface SubTypesTabProps {
  items: any[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortBy: 'name' | 'assets' | 'type';
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: 'name' | 'assets' | 'type') => void;
  onSortOrderToggle: () => void;
  onItemClick: (item: any) => void;
}

const SubTypesTab: React.FC<SubTypesTabProps> = ({
  items,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderToggle,
  onItemClick,
}) => {
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterChip[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedField, setSelectedField] = useState<FilterFieldType | null>(null);
  const [isOrMode, setIsOrMode] = useState(false); // Track if next filter should be OR
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  const hasFilters = filters.length > 0;

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (criteria: 'name' | 'assets' | 'type') => {
    if (criteria !== sortBy) {
      onSortByChange(criteria);
    }
    handleSortClose();
  };

  // Filter handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value) {
      setShowDropdown(false);
    }
  };

  const handleFieldSelect = (e: React.MouseEvent, field: FilterFieldType) => {
    e.stopPropagation();
    justSelectedRef.current = true;
    setSelectedField(field);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleOrSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    justSelectedRef.current = true;
    setIsOrMode(true);
    // Keep dropdown open to show field options
    setShowDropdown(true);
    inputRef.current?.focus();
  };

  const handleClickAway = () => {
    setShowDropdown(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    // Show dropdown immediately on focus when no input value
    if (!inputValue && !selectedField) {
      setShowDropdown(true);
    }
  };

  const handleInputClick = () => {
    // Show dropdown immediately on click when no input value
    if (!inputValue && !selectedField) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const value = inputValue.trim();

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();

        if (!value) return;

        // Create filter chip
        const field = selectedField || 'name';
        const newChip: FilterChip = {
          id: `${field}-${Date.now()}`,
          field,
          value,
          displayLabel: `${FILTER_FIELD_LABELS[field]}: ${value}`,
          isOr: isOrMode && filters.length > 0, // Only set isOr if there are existing filters
        };

        setFilters([...filters, newChip]);
        setInputValue("");
        setSelectedField(null);
        setIsOrMode(false); // Reset OR mode after adding filter
      } else if (e.key === "Backspace" && !inputValue) {
        if (selectedField) {
          setSelectedField(null);
          setShowDropdown(true);
        } else if (isOrMode) {
          setIsOrMode(false);
          setShowDropdown(true);
        } else if (filters.length > 0) {
          setFilters(filters.slice(0, -1));
          setShowDropdown(true);
        }
      } else if (e.key === "Escape") {
        setSelectedField(null);
        setIsOrMode(false);
        setShowDropdown(false);
      }
    },
    [inputValue, filters, selectedField, isOrMode]
  );

  const handleRemoveChip = useCallback(
    (chipId: string) => {
      setFilters(filters.filter((f) => f.id !== chipId));
    },
    [filters]
  );

  const getPlaceholder = () => {
    if (selectedField) {
      return `Enter ${FILTER_FIELD_LABELS[selectedField]} value...`;
    }
    if (isOrMode) {
      return "Select field for OR filter...";
    }
    if (hasFilters) {
      return "Add filter...";
    }
    return "Filter Sub Types";
  };

  // Helper function to check if an item matches a single filter
  const matchesFilter = (item: { displayName?: string; title?: string; description?: string; type?: string }, filter: FilterChip): boolean => {
    const searchValue = filter.value.toLowerCase();
    switch (filter.field) {
      case 'name':
        return (item.displayName || item.title || '').toLowerCase().includes(searchValue);
      case 'description':
        return (item.description || '').toLowerCase().includes(searchValue);
      case 'type':
        return (item.type || 'string').toLowerCase().includes(searchValue);
      default:
        return true;
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply filter chips with AND/OR logic
    // Logic: Group consecutive AND filters, then OR between groups
    // Example: [A, B, C(or), D, E(or), F] = (A AND B) OR (C AND D) OR (E AND F)
    if (filters.length > 0) {
      // Split filters into groups separated by OR
      const filterGroups: FilterChip[][] = [];
      let currentGroup: FilterChip[] = [];

      filters.forEach((filter) => {
        if (filter.isOr && currentGroup.length > 0) {
          filterGroups.push(currentGroup);
          currentGroup = [filter];
        } else {
          currentGroup.push(filter);
        }
      });
      if (currentGroup.length > 0) {
        filterGroups.push(currentGroup);
      }

      filtered = items.filter((item) => {
        // Item matches if ANY group matches (OR between groups)
        return filterGroups.some((group) => {
          // Within a group, ALL filters must match (AND within group)
          return group.every((filter) => matchesFilter(item, filter));
        });
      });
    }

    // Sort items
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.displayName || a.title).localeCompare(b.displayName || b.title);
          break;
        case 'assets':
          comparison = (b.fieldValues || 0) - (a.fieldValues || 0);
          break;
        case 'type':
          comparison = (a.type || 'string').localeCompare(b.type || 'string');
          break;
        default:
          return 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, filters, sortBy, sortOrder]);

  return (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header Section (Search/Sort) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Filter Input with Dropdown */}
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    border: isFocused || hasFilters || selectedField ? "1px solid #0E4DCA" : "1px solid #DADCE0",
                    borderRadius: "54px",
                    px: 1.5,
                    py: 0.5,
                    height: "32px",
                    width: "309px",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s ease",
                    "&:hover": {
                      borderColor: "#0E4DCA",
                    },
                  }}
                  onClick={() => inputRef.current?.focus()}
                >
                  <Search sx={{ color: "#575757", mr: 1, fontSize: 20 }} />
                  {isOrMode && (
                    <Box
                      component="span"
                      sx={{
                        fontFamily: "'Google Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: "11px",
                        lineHeight: "16px",
                        color: "#FFFFFF",
                        backgroundColor: "#0B57D0",
                        borderRadius: "4px",
                        px: 0.75,
                        py: 0.25,
                        mr: 0.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      OR
                    </Box>
                  )}
                  {selectedField && (
                    <Box
                      component="span"
                      sx={{
                        fontFamily: "'Google Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: "12px",
                        lineHeight: "16px",
                        color: "#1F1F1F",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {FILTER_FIELD_LABELS[selectedField]}:
                    </Box>
                  )}
                  <InputBase
                    inputRef={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onClick={handleInputClick}
                    placeholder={getPlaceholder()}
                    sx={{
                      flex: 1,
                      fontFamily: "Google Sans Text",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#1F1F1F",
                      letterSpacing: "0.1px",
                      ml: selectedField ? 0.5 : 0,
                      "& input::placeholder": {
                        color: "#5E5E5E",
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                {/* Filter Field Dropdown */}
                {showDropdown && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "35px",
                      left: 0,
                      right: 0,
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0px 4px 8px 3px rgba(60, 64, 67, 0.15), 0px 1px 3px rgba(60, 64, 67, 0.3)",
                      borderRadius: "8px",
                      zIndex: 1000,
                    }}
                  >
                    <MenuList dense sx={{ py: 1 }}>
                      {/* Show OR option when filters already exist */}
                      {hasFilters && (
                        <MenuItem
                          onClick={handleOrSelect}
                          sx={{
                            fontFamily: "'Product Sans', sans-serif",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#0B57D0",
                            py: 0.5,
                            px: 1.5,
                            borderBottom: "1px solid #E0E0E0",
                            mb: 0.5,
                          }}
                        >
                          OR
                        </MenuItem>
                      )}
                      {VALID_FILTER_FIELDS.map((field) => (
                        <MenuItem
                          key={field}
                          onClick={(e) => handleFieldSelect(e, field)}
                          sx={{
                            fontFamily: "'Product Sans', sans-serif",
                            fontSize: "12px",
                            color: "#1F1F1F",
                            py: 0.5,
                            px: 1.5,
                          }}
                        >
                          {FILTER_FIELD_LABELS[field]}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Box>
                )}
              </Box>
            </ClickAwayListener>

            {/* Sort Controls */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                onClick={onSortOrderToggle}
                sx={{ p: 0.5, mr: 0.5, color: "#1F1F1F" }}
              >
                <Sort
                  sx={{
                    fontSize: 16,
                    transform: sortOrder === "asc" ? "scaleY(-1)" : "none",
                  }}
                />
              </IconButton>

              <Button
                onClick={handleSortClick}
                endIcon={
                  <ExpandMore
                    sx={{
                      color: "#1F1F1F",
                      fontSize: 20,
                      transform: sortAnchorEl ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                }
                sx={{
                  textTransform: "none",
                  color: "#1F1F1F",
                  fontFamily: "Product Sans",
                  fontSize: "12px",
                  fontWeight: 400,
                  padding: 0,
                  minWidth: "auto",
                  "&:hover": { background: "transparent" },
                }}
              >
                Sort by: {sortBy === "name" ? "Name" : sortBy === "assets" ? "Assets" : "Type"}
              </Button>
            </Box>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
              MenuListProps={{ dense: true, sx: { py: 0.5 } }}
              PaperProps={{
                sx: {
                  borderRadius: "8px",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                },
              }}
            >
              <MenuItem
                onClick={() => handleSortSelect("name")}
                sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
              >
                Name
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect("assets")}
                sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
              >
                Assets
              </MenuItem>
              <MenuItem
                onClick={() => handleSortSelect("type")}
                sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
              >
                Type
              </MenuItem>
            </Menu>
          </Box>

          {/* Filter Chips */}
          {hasFilters && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {filters.map((chip, index) => {
                const colonIndex = chip.displayLabel.indexOf(":");
                const fieldLabel = colonIndex !== -1 ? chip.displayLabel.slice(0, colonIndex + 1) : "";
                const valueLabel = colonIndex !== -1 ? chip.displayLabel.slice(colonIndex + 1).trim() : chip.displayLabel;

                return (
                  <React.Fragment key={chip.id}>
                    {/* Show OR separator before OR chips */}
                    {chip.isOr && index > 0 && (
                      <Typography
                        sx={{
                          fontFamily: "'Google Sans', sans-serif",
                          fontWeight: 500,
                          fontSize: "11px",
                          lineHeight: "16px",
                          color: "#0B57D0",
                          px: 0.5,
                        }}
                      >
                        OR
                      </Typography>
                    )}
                    <Tooltip title={chip.displayLabel} arrow>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "#E7F0FE",
                          borderRadius: "25px",
                          padding: "2px 3px 2px 8px",
                          gap: "4px",
                          maxWidth: "100%",
                          overflow: "hidden",
                          minWidth: 0,
                        }}
                      >
                        {fieldLabel && (
                          <Typography
                            sx={{
                              fontFamily: "'Google Sans', sans-serif",
                              fontWeight: 500,
                              fontSize: "11px",
                              lineHeight: "16px",
                              letterSpacing: "0.1px",
                              color: "#0B57D0",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {fieldLabel}
                          </Typography>
                        )}
                        <Typography
                          sx={{
                            fontFamily: "'Google Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: "11px",
                            lineHeight: "16px",
                            letterSpacing: "0.1px",
                            color: "#0B57D0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: 0,
                          }}
                        >
                          {valueLabel}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveChip(chip.id)}
                          sx={{
                            width: 14,
                            height: 14,
                            backgroundColor: "#0B57D0",
                            borderRadius: "50%",
                            padding: 0,
                            flexShrink: 0,
                            "&:hover": {
                              backgroundColor: "#0842A0",
                            },
                          }}
                        >
                          <Close
                            sx={{
                              fontSize: 10,
                              color: "#FFFFFF",
                            }}
                          />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </React.Fragment>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Conditional Body: Empty State OR Grid */}
        {filteredAndSortedItems.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 1,
              gap: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              {hasFilters ? "No sub types match the filter criteria" : "No sub types available"}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "16px",
              width: "100%",
              overflowY: "auto",
              minHeight: 0,
              pb: 2,
              px: 1,
              mx: -1,
              pt: 1,
              mt: -1,
            }}
          >
            {filteredAndSortedItems.map((item: any, index: number) => (
              <Card
                key={index}
                variant="outlined"
                onClick={() => onItemClick(item)}
                sx={{
                  borderRadius: "16px",
                  height: "134px",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    boxShadow: "0 4px 8px 0 rgba(60,64,67,0.15)",
                    borderColor: "#0B57D0",
                    transform: "scale(1.02)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    p: "16px",
                    "&:last-child": { pb: "16px" },
                  }}
                >
                  {/* Header: Icon + Title */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <img
                      src={AnnotationSubitemIcon}
                      alt=""
                      style={{ width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <Tooltip
                      title={item.displayName || item.title}
                      placement="top"
                      enterDelay={500}
                      arrow
                    >
                      <Typography
                        variant="h6"
                        noWrap
                        sx={{
                          fontFamily: "Google Sans",
                          fontSize: "18px",
                          fontWeight: 400,
                          lineHeight: "24px",
                          color: "#1F1F1F",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.displayName || item.title}
                      </Typography>
                    </Tooltip>
                  </Box>

                  {/* Description: 2-line ellipsis */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "Google Sans",
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "20px",
                      color: "#575757",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.description || "No description"}
                  </Typography>

                  {/* Footer: Asset count + Type badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    {item.isCountLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          height: "24px",
                          backgroundColor: "#C2E7FF",
                          borderRadius: "25px",
                          px: 1.5,
                        }}
                      >
                        <CircularProgress
                          size={12}
                          thickness={4}
                          sx={{ color: "#004A77" }}
                        />
                        <Typography
                          sx={{
                            fontFamily: "Google Sans Text",
                            fontWeight: 500,
                            fontSize: "12px",
                            color: "#004A77",
                          }}
                        >
                          Loading
                        </Typography>
                      </Box>
                    ) : (
                      <Chip
                        label={`${item.fieldValues || 0} asset${(item.fieldValues || 0) !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                          height: "24px",
                          backgroundColor: "#C2E7FF",
                          color: "#004A77",
                          fontFamily: "Google Sans Text",
                          fontWeight: 500,
                          fontSize: "12px",
                          borderRadius: "25px",
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 0,
                        gap: "5px",
                        height: "16px",
                      }}
                    >
                      <img
                        src={TypeIcon}
                        alt=""
                        style={{ width: '16px', height: '16px' }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Google Sans Text",
                          fontWeight: 500,
                          fontSize: "12px",
                          lineHeight: "16px",
                          color: "#575757",
                        }}
                      >
                        {formatTypeDisplay(item.type, item.stringType)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SubTypesTab;
