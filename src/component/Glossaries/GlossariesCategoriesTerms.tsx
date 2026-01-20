import React, { useState } from "react";
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
} from "@mui/material";
import { Search, AccessTime, ExpandMore, Sort } from "@mui/icons-material";
import { type GlossaryItem } from "./GlossaryDataType";
import { getIcon } from "./glossaryUIHelpers";
import { getFormattedDateTimePartsByDateTime } from "../../utils/resourceUtils";

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

  const label = mode === "categories" ? "categories" : "terms";

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
            alignItems: "center",
            gap: "16px",
            mb: 3,
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#fff",
              border: "1px solid #DADCE0",
              borderRadius: "54px",
              px: 1.5,
              py: 0.5,
              height: "32px",
              width: "309px",
              boxSizing: "border-box",
            }}
          >
            <Search sx={{ color: "#575757", mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder={`Search ${label}`}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              sx={{
                fontFamily: "Google Sans Text",
                fontSize: "12px",
                fontWeight: 500,
                color: "#5E5E5E",
                width: "100%",
                letterSpacing: "0.1px",
                "& ::placeholder": {
                  opacity: 1,
                  color: "#5E5E5E",
                },
              }}
            />
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

        {/* Conditional Body: Empty State OR Grid */}
        {items.length === 0 ? (
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
            }}
          >
            {items.map((item: GlossaryItem) => (
              <Card
                key={item.id}
                variant="outlined"
                onClick={() => onItemClick(item.id)}
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
                        fontSize: "18px",
                        fontWeight: 400,
                        lineHeight: "24px",
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
