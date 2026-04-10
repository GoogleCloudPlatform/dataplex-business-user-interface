import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import AnnotationSubitemIcon from '../../assets/svg/annotation-subitem.svg';
import ThemedIconContainer from '../Common/ThemedIconContainer';
import TypeIcon from '../../assets/svg/type-icon.svg';
import FilterBar from '../Common/FilterBar';
import type { ActiveFilter, PropertyConfig } from '../Common/FilterBar';

// Helper function to format type display
const formatTypeDisplay = (type: string, stringType?: string): string => {
  if (type === 'string') {
    if (stringType === 'richText') return 'Text (Rich Text)';
    if (stringType === 'resource') return 'Text (Resource)';
    if (stringType === 'url') return 'Text (URL)';
    return 'Text';
  }

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

const FILTER_PROPERTIES: PropertyConfig[] = [
  { name: 'Name', mode: 'text' },
  { name: 'Description', mode: 'text' },
  { name: 'Type', mode: 'dropdown' },
];

const SubTypesTab: React.FC<SubTypesTabProps> = ({
  items,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderToggle,
  onItemClick,
}) => {
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [filterText, setFilterText] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
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

  // Get unique type values for dropdown
  const getPropertyValues = (property: string): string[] => {
    if (property === 'Type') {
      const types = new Set<string>();
      items.forEach((item) => {
        const formatted = formatTypeDisplay(item.type || 'string', item.stringType);
        types.add(formatted);
      });
      return Array.from(types).sort();
    }
    return [];
  };

  // Helper function to check if an item matches a single filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchesFilter = (item: any, filter: ActiveFilter): boolean => {
    return filter.values.some(value => {
      const lower = value.toLowerCase();
      switch (filter.property) {
        case 'Name':
          return (item.displayName || item.title || '').toLowerCase().includes(lower);
        case 'Description':
          return (item.description || '').toLowerCase().includes(lower);
        case 'Type': {
          const formatted = formatTypeDisplay(item.type || 'string', item.stringType);
          return formatted === value;
        }
        default:
          return true;
      }
    });
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply filter chips with AND/OR logic
    if (activeFilters.length > 0) {
      // Split filters into groups separated by OR
      const filterGroups: ActiveFilter[][] = [];
      let currentGroup: ActiveFilter[] = [];

      activeFilters.forEach((filter) => {
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
        return filterGroups.some((group) => {
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
  }, [items, activeFilters, sortBy, sortOrder]);

  const hasFilters = activeFilters.length > 0 || filterText.trim().length > 0;

  return (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header Section (Filter/Sort) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            mb: 2,
            flexShrink: 0,
          }}
        >
          <FilterBar
            filterText={filterText}
            onFilterTextChange={setFilterText}
            propertyNames={FILTER_PROPERTIES}
            getPropertyValues={getPropertyValues}
            activeFilters={activeFilters}
            onActiveFiltersChange={setActiveFilters}
            marginLeft="0px"
            placeholder="Filter Sub Types"
            endContent={
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <Typography
                  component="span"
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "#1F1F1F",
                    whiteSpace: "nowrap",
                    fontFamily: '"Google Sans Text", sans-serif',
                  }}
                  onClick={handleSortClick}
                >
                  <ExpandMore
                    sx={{
                      fontSize: '20px',
                      color: '#575757',
                      transform: sortAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                  {sortBy === "name" ? "Name" : sortBy === "assets" ? "Assets" : "Type"}
                </Typography>
                <Tooltip title={sortOrder === 'asc' ? 'Sort large to small' : 'Sort small to large'} arrow>
                  <span
                    data-testid="sort-order-toggle"
                    onClick={onSortOrderToggle}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease-in-out',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="12" fill="#C2E7FF"/>
                      <path d="M11.168 15.4818L11.168 5.33594L12.8346 5.33594L12.8346 15.4818L17.5013 10.8151L18.668 12.0026L12.0013 18.6693L5.33464 12.0026L6.5013 10.8151L11.168 15.4818Z" fill="#004A77"/>
                    </svg>
                  </span>
                </Tooltip>
              </div>
            }
          />
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              style: {
                marginTop: '4px',
                borderRadius: '8px',
                boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                minWidth: '140px',
              },
            }}
          >
            <MenuItem
              onClick={() => handleSortSelect("name")}
              sx={{
                fontSize: "12px",
                fontFamily: "Google Sans",
                fontWeight: sortBy === "name" ? "500" : "400",
                color: sortBy === "name" ? "#0B57D0" : "#1F1F1F",
                backgroundColor: sortBy === "name" ? "#F8FAFD" : "transparent",
                '&:hover': { backgroundColor: '#F1F3F4' },
              }}
            >
              Name
            </MenuItem>
            <MenuItem
              onClick={() => handleSortSelect("assets")}
              sx={{
                fontSize: "12px",
                fontFamily: "Google Sans",
                fontWeight: sortBy === "assets" ? "500" : "400",
                color: sortBy === "assets" ? "#0B57D0" : "#1F1F1F",
                backgroundColor: sortBy === "assets" ? "#F8FAFD" : "transparent",
                '&:hover': { backgroundColor: '#F1F3F4' },
              }}
            >
              Assets
            </MenuItem>
            <MenuItem
              onClick={() => handleSortSelect("type")}
              sx={{
                fontSize: "12px",
                fontFamily: "Google Sans",
                fontWeight: sortBy === "type" ? "500" : "400",
                color: sortBy === "type" ? "#0B57D0" : "#1F1F1F",
                backgroundColor: sortBy === "type" ? "#F8FAFD" : "transparent",
                '&:hover': { backgroundColor: '#F1F3F4' },
              }}
            >
              Type
            </MenuItem>
          </Menu>
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
                  overflow: "hidden",
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
                    <ThemedIconContainer iconColor="#F9AB00" size="small">
                      <img
                        src={AnnotationSubitemIcon}
                        alt=""
                        style={{ width: '18px', height: '18px' }}
                      />
                    </ThemedIconContainer>
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
                          fontSize: "16px",
                          fontWeight: 500,
                          lineHeight: "24px",
                          letterSpacing: "0.15px",
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
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
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
