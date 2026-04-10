import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { AccessTime, ExpandMore } from "@mui/icons-material";
import { type GlossaryItem } from "./GlossaryDataType";
import { getIcon } from "./glossaryUIHelpers";
import { getFormattedDateTimePartsByDateTime } from "../../utils/resourceUtils";
import FilterBar from '../Common/FilterBar';
import type { ActiveFilter, PropertyConfig } from '../Common/FilterBar';

interface GlossariesCategoriesTermsProps {
  mode: "categories" | "terms";
  items: GlossaryItem[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sortBy: "name" | "lastModified";
  sortOrder: "asc" | "desc";
  onSortByChange: (value: "name" | "lastModified") => void;
  onSortOrderToggle: () => void;
  onItemClick: (id: string) => void;
}

const FILTER_PROPERTIES: PropertyConfig[] = [
  { name: 'Name', mode: 'text' },
  { name: 'Description', mode: 'text' },
];

const GlossariesCategoriesTerms: React.FC<GlossariesCategoriesTermsProps> = ({
  mode,
  items,
  searchTerm,
  onSearchTermChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderToggle,
  onItemClick,
}) => {
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const label = mode === "categories" ? "categories" : "terms";

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (criteria: "name" | "lastModified") => {
    if (criteria !== sortBy) {
      onSortByChange(criteria);
    }
    handleSortClose();
  };

  // Apply active filters on top of parent-filtered items
  const displayItems = useMemo(() => {
    if (activeFilters.length === 0) return items;
    return items.filter(item => {
      // AND/OR logic: group by OR separators
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
      if (currentGroup.length > 0) filterGroups.push(currentGroup);

      return filterGroups.some(group =>
        group.every(filter =>
          filter.values.some(value => {
            const lower = value.toLowerCase();
            switch (filter.property) {
              case 'Name': return item.displayName.toLowerCase().includes(lower);
              case 'Description': return (item.description || '').toLowerCase().includes(lower);
              default: return item.displayName.toLowerCase().includes(lower) || (item.description || '').toLowerCase().includes(lower);
            }
          })
        )
      );
    });
  }, [items, activeFilters]);

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
        <Box sx={{ mb: 3, flexShrink: 0 }}>
          <FilterBar
            filterText={searchTerm}
            onFilterTextChange={onSearchTermChange}
            propertyNames={FILTER_PROPERTIES}
            activeFilters={activeFilters}
            onActiveFiltersChange={setActiveFilters}
            marginLeft="0px"
            placeholder={`Filter ${label}`}
            showTextInFilterMenu
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
                  {sortBy === "name" ? "Name" : "Last Modified"}
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
              onClick={() => handleSortSelect("lastModified")}
              sx={{
                fontSize: "12px",
                fontFamily: "Google Sans",
                fontWeight: sortBy === "lastModified" ? "500" : "400",
                color: sortBy === "lastModified" ? "#0B57D0" : "#1F1F1F",
                backgroundColor: sortBy === "lastModified" ? "#F8FAFD" : "transparent",
                '&:hover': { backgroundColor: '#F1F3F4' },
              }}
            >
              Last Modified
            </MenuItem>
          </Menu>
        </Box>

        {/* Conditional Body: Empty State OR Grid */}
        {displayItems.length === 0 ? (
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
              No {label} available
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
            {displayItems.map((item: GlossaryItem) => (
              <Card
                key={item.id}
                variant="outlined"
                onClick={() => onItemClick(item.id)}
                sx={{
                  borderRadius: "16px",
                  height: "132px",
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
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    {getIcon(item.type, "medium")}
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
                      {item.displayName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
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
                    {item.description ? item.description : "No description"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <AccessTime sx={{ fontSize: 16, color: "#575757" }} />
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "Google Sans Text",
                        fontSize: "12px",
                        fontWeight: 500,
                        lineHeight: "16px",
                        letterSpacing: "0.1px",
                        color: "#575757",
                      }}
                    >
                      {(() => {
                        const { date } = getFormattedDateTimePartsByDateTime({
                          seconds: item.lastModified,
                        });
                        return date;
                      })()}
                    </Typography>
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

export default GlossariesCategoriesTerms;
