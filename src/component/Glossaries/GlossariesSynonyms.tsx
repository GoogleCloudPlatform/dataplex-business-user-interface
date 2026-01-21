import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  InputBase,
  Chip,
  Card,
  CardContent,
  Button,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Search,
  DescriptionOutlined,
  AccessTime,
  ExpandMore,
  Sort,
} from "@mui/icons-material";
import { type GlossaryRelation } from "./GlossaryDataType";
import { getFormattedDateTimePartsByDateTime } from "../../utils/resourceUtils";

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

  const handleSortClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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

  // searchedRelations is used for chip counts (only search filter applied)
  const searchedRelations = useMemo(() => {
    if (!searchTerm.trim()) return relations;
    return relations.filter((r) =>
      r.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [relations, searchTerm]);

  // filteredRelations is used for display (search + type filter applied)
  const filteredRelations = useMemo(() => {
    const filtered = relations.filter((r) => {
      const matchesSearch = r.displayName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = relationFilter === "all" || r.type === relationFilter;
      return matchesSearch && matchesType;
    });
    return sortItems(filtered);
  }, [relations, searchTerm, relationFilter, sortBy, sortOrder]);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Section (Search/Chips) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#fff",
              border: "1px solid #dadce0",
              borderRadius: "24px",
              px: 2,
              py: 0.5,
              width: 300,
              height: 32,
            }}
          >
            <Search sx={{ color: "#5f6368", mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search synonyms and related terms"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              sx={{
                fontSize: "0.875rem",
                width: "100%",
                "& ::placeholder": {
                  opacity: 100,
                  color: "#5E5E5E",
                  fontSize: 12,
                  fontWeight: 500,
                },
              }}
            />
          </Box>
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
        </Box>
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
            Sort by: {sortBy === "name" ? "Name" : "Last Modified"}
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
            onClick={() => handleSortSelect("lastModified")}
            sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
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
                transition: "box-shadow 0.2s",
                display: "flex",
                flexDirection: "column",
                "&:hover": {
                  boxShadow: "0 4px 8px 0 rgba(60,64,67,0.15)",
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
                    <DescriptionOutlined
                      sx={{
                        color: "#F4B400",
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    />
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
