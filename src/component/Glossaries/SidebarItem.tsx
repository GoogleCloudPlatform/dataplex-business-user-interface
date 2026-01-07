// SidebarItem.tsx
import React from "react";
import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  List,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { type GlossaryItem } from "./GlossaryDataType";
import { getIcon } from "./glossaryUIHelpers";

interface SidebarItemProps {
  item: GlossaryItem;
  depth?: number;
  selectedId: string;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  depth = 0,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}) => {
  const isSelected = selectedId === item.id;
  const isExpanded = expandedIds.has(item.id);
  const renderableChildren = item.children || [];
  const indent = depth * 20;

  return (
    <>
      <ListItemButton
        selected={isSelected}
        onClick={() => {
          onSelect(item.id);
          if (!isExpanded) onToggle(item.id);
        }}
        sx={{
          ml: `${20 + indent}px`,
          mr: "20px",
          pl: "8px",
          pr: "12px",
          py: "8px",
          height: "32px",
          borderRadius: "200px",
          mb: 0.5,
          width: "auto",

          "&.Mui-selected": {
            backgroundColor: "#C2E7FF",
            color: "#1F1F1F",
            "&:hover": { backgroundColor: "#C2E7FF" },
            "& .MuiListItemIcon-root": { color: "#1F1F1F" },
            "& .MuiTypography-root": { fontWeight: 500 },
          },
          "&:hover": { backgroundColor: "#F1F3F4" },
        }}
      >
        {/* Chevron Icon Container */}
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.id);
            onSelect(item.id);
          }}
          sx={{
            display: item.type !== "term" ? "flex" : "none",

            alignItems: "center",
            cursor: "pointer",
            mr: 0.5,
            transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
            visibility: "visible",
          }}
        >
          <ExpandMore
            fontSize="inherit"
            sx={{ fontSize: 16, color: "#1F1F1F" }}
          />
        </Box>

        <ListItemIcon sx={{ minWidth: 20, mr: 0.1, color: "#1F1F1F" }}>
          {getIcon(item.type, "small")}
        </ListItemIcon>
        <ListItemText
          primary={item.displayName}
          primaryTypographyProps={{
            fontFamily: depth === 0 ? "Product Sans" : "Google Sans",
            fontSize: "12px",
            fontWeight: isSelected ? 500 : 400,
            color: "#1F1F1F",
            noWrap: true,
            letterSpacing: "0.1px",
          }}
        />
      </ListItemButton>
      {renderableChildren.length > 0 && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {renderableChildren.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                depth={depth + 1}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

export default SidebarItem;
