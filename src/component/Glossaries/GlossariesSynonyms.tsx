import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  AccessTime,
  ExpandMore,
} from "@mui/icons-material";
import { type GlossaryRelation } from "./GlossaryDataType";
import { getIcon } from "./glossaryUIHelpers";
import { getFormattedDateTimePartsByDateTime } from "../../utils/resourceUtils";
import FilterBar from '../Common/FilterBar';
import type { ActiveFilter, PropertyConfig } from '../Common/FilterBar';

interface GlossariesSynonymsProps {
  relations: GlossaryRelation[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  relationFilter: "all" | "synonym" | "related";
  onRelationFilterChange: (value: "all" | "synonym" | "related") => void;
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

const GlossariesSynonyms: React.FC<GlossariesSynonymsProps> = ({
  relations,
  searchTerm,
  onSearchTermChange,
  relationFilter,
  onRelationFilterChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderToggle,
  onItemClick,
}) => {
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

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

  const sortItems = (items: GlossaryRelation[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.displayName.toLowerCase();
        const nameB = b.displayName.toLowerCase();
        if (sortOrder === "asc") return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
      } else {
        const dateA = a.lastModified || 0;
        const dateB = b.lastModified || 0;
        if (sortOrder === "asc") return dateA - dateB;
        return dateB - dateA;
      }
    });
  };

  // searchedRelations is used for chip counts (type filter not applied)
  const searchedRelations = useMemo(() => {
    if (activeFilters.length === 0) return relations;
    return relations.filter((r) => {
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
              case 'Name': return r.displayName.toLowerCase().includes(lower);
              case 'Description': return (r.description || '').toLowerCase().includes(lower);
              default: return r.displayName.toLowerCase().includes(lower) || (r.description || '').toLowerCase().includes(lower);
            }
          })
        )
      );
    });
  }, [relations, activeFilters]);

  // filteredRelations is used for display (type filter + active filters applied)
  const filteredRelations = useMemo(() => {
    let filtered = relations.filter((r) => {
      const matchesType = relationFilter === "all" || r.type === relationFilter;
      return matchesType;
    });

    // Apply active filters (from FilterBar chips)
    if (activeFilters.length > 0) {
      filtered = filtered.filter(r => {
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
                case 'Name': return r.displayName.toLowerCase().includes(lower);
                case 'Description': return (r.description || '').toLowerCase().includes(lower);
                default: return r.displayName.toLowerCase().includes(lower) || (r.description || '').toLowerCase().includes(lower);
              }
            })
          )
        );
      });
    }

    return sortItems(filtered);
  }, [relations, relationFilter, activeFilters, sortBy, sortOrder]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Section (Search/Chips) */}
      <Box sx={{ mb: 3 }}>
        <FilterBar
          filterText={searchTerm}
          onFilterTextChange={onSearchTermChange}
          propertyNames={FILTER_PROPERTIES}
          activeFilters={activeFilters}
          onActiveFiltersChange={setActiveFilters}
          marginLeft="0px"
          placeholder="Filter synonyms and related terms"
          showTextInFilterMenu
          endContent={
            <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={`All (${searchedRelations.length})`}
                  onClick={() => onRelationFilterChange("all")}
                  sx={{
                    fontSize: 12,
                    bgcolor: relationFilter === "all" ? "#e8f0fe" : "transparent",
                    color: relationFilter === "all" ? "#1967d2" : "#1F1F1F",
                    fontWeight: relationFilter === "all" ? 500 : 300,
                    border: relationFilter === "all" ? "none" : "1px solid #dadce0",
                  }}
                />
                <Chip
                  label={`Synonyms (${
                    searchedRelations.filter((r) => r.type === "synonym").length
                  })`}
                  onClick={() => onRelationFilterChange("synonym")}
                  sx={{
                    fontSize: 12,
                    bgcolor:
                      relationFilter === "synonym" ? "#e8f0fe" : "transparent",
                    color: relationFilter === "synonym" ? "#1967d2" : "#1F1F1F",
                    fontWeight: relationFilter === "synonym" ? 500 : 300,
                    border:
                      relationFilter === "synonym" ? "none" : "1px solid #dadce0",
                  }}
                />
                <Chip
                  label={`Related Terms (${
                    searchedRelations.filter((r) => r.type === "related").length
                  })`}
                  onClick={() => onRelationFilterChange("related")}
                  sx={{
                    fontSize: 12,
                    bgcolor:
                      relationFilter === "related" ? "#e8f0fe" : "transparent",
                    color: relationFilter === "related" ? "#1967d2" : "#1F1F1F",
                    fontWeight: relationFilter === "related" ? 500 : 300,
                    border:
                      relationFilter === "related" ? "none" : "1px solid #dadce0",
                  }}
                />
              </Box>
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
            </Box>
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

      {/* Conditional Body */}
      {filteredRelations.length === 0 ? (
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
            No matching synonyms or related terms found
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
          {filteredRelations.map((rel) => (
            <Card
              key={rel.id}
              onClick={() => onItemClick(rel.id)}
              variant="outlined"
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
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      overflow: "hidden",
                    }}
                  >
                    {getIcon("term", "medium")}
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
                      {rel.displayName}
                    </Typography>
                  </Box>
                  <Chip
                    label={rel.type === "synonym" ? "Synonym" : "Related"}
                    size="small"
                    sx={{
                      height: "20px",
                      backgroundColor: "#E7F0FE",
                      color: "#004A77",
                      fontFamily: "Google Sans Text",
                      fontWeight: 500,
                      fontSize: "11px",
                      borderRadius: "25px",
                      flexShrink: 0,
                      ml: 1,
                    }}
                  />
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
                  {rel.description || "No description"}
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
                      fontFamily: "Google Sans Text Medium",
                      fontSize: "12px",
                      fontWeight: 500,
                      lineHeight: "16px",
                      letterSpacing: "0.1px",
                      color: "#575757",
                    }}
                  >
                    {(() => {
                      const { date } = getFormattedDateTimePartsByDateTime({
                        seconds: rel.lastModified,
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
  );
};

export default GlossariesSynonyms;
