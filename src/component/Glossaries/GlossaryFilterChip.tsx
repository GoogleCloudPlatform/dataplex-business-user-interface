import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { type FilterChip } from "./GlossaryDataType";
import { isOrConnector } from "../../utils/glossaryUtils";

interface GlossaryFilterChipProps {
  chip: FilterChip;
  onRemove: (id: string) => void;
}

const GlossaryFilterChip: React.FC<GlossaryFilterChipProps> = ({
  chip,
  onRemove,
}) => {
  const isOr = isOrConnector(chip);

  if (isOr) {
    // OR connector chip styling
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
            "&:hover": {
              backgroundColor: "#0842A0",
            },
          }}
        >
          <CloseIcon
            sx={{
              fontSize: 10,
              color: "#FFFFFF",
            }}
          />
        </IconButton>
      </Box>
    );
  }

  // Regular filter chip styling
  // Check if we should show the field label based on showFieldLabel property
  const shouldShowFieldLabel = chip.showFieldLabel !== false;

  // Parse display label to separate field and value (only if showing field label)
  const colonIndex = chip.displayLabel.indexOf(":");
  const fieldLabel =
    shouldShowFieldLabel && colonIndex !== -1 ? chip.displayLabel.slice(0, colonIndex + 1) : "";
  const valueLabel =
    shouldShowFieldLabel && colonIndex !== -1
      ? chip.displayLabel.slice(colonIndex + 1).trim()
      : chip.displayLabel;

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
      {fieldLabel && (
        <Typography
          sx={{
            fontFamily: "'Google Sans', sans-serif",
            fontWeight: 500,
            fontSize: "11px",
            lineHeight: "16px",
            letterSpacing: "0.1px",
            color: "#0B57D0",
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
          "&:hover": {
            backgroundColor: "#0842A0",
          },
        }}
      >
        <CloseIcon
          sx={{
            fontSize: 10,
            color: "#FFFFFF",
          }}
        />
      </IconButton>
    </Box>
  );
};

export default GlossaryFilterChip;
