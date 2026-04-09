import React from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { type AspectFilterChip as AspectFilterChipType, isOrConnector } from "./AspectFilterTypes";

interface AspectFilterChipProps {
  chip: AspectFilterChipType;
  onRemove: (id: string) => void;
}

const AspectFilterChip: React.FC<AspectFilterChipProps> = ({ chip, onRemove }) => {
  const isOr = isOrConnector(chip);

  if (isOr) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#E7F0FE",
          borderRadius: "25px",
          padding: "2px 3px 2px 8px",
          gap: "4px",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'Google Sans', sans-serif",
            fontWeight: 700,
            fontSize: "11px",
            lineHeight: "16px",
            letterSpacing: "0.1px",
            color: "#0B57D0",
          }}
        >
          OR
        </Typography>
        <IconButton
          size="small"
          onClick={() => onRemove(chip.id)}
          sx={{
            width: 14,
            height: 14,
            backgroundColor: "#0B57D0",
            borderRadius: "50%",
            padding: 0,
            "&:hover": { backgroundColor: "#0842A0" },
          }}
        >
          <CloseIcon sx={{ fontSize: 10, color: "#FFFFFF" }} />
        </IconButton>
      </Box>
    );
  }

  const shouldShowFieldLabel = chip.showFieldLabel !== false;
  const colonIndex = chip.displayLabel.indexOf(":");
  const fieldLabel =
    shouldShowFieldLabel && colonIndex !== -1 ? chip.displayLabel.slice(0, colonIndex + 1) : "";
  const valueLabel =
    shouldShowFieldLabel && colonIndex !== -1
      ? chip.displayLabel.slice(colonIndex + 1).trim()
      : chip.displayLabel;

  return (
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
          onClick={() => onRemove(chip.id)}
          sx={{
            width: 14,
            height: 14,
            backgroundColor: "#0B57D0",
            borderRadius: "50%",
            padding: 0,
            flexShrink: 0,
            "&:hover": { backgroundColor: "#0842A0" },
          }}
        >
          <CloseIcon sx={{ fontSize: 10, color: "#FFFFFF" }} />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default AspectFilterChip;
