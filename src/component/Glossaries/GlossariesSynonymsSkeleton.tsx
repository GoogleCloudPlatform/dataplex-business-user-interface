import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * @file GlossariesSynonymsSkeleton.tsx
 * @summary Skeleton loader for Synonyms tab in Glossaries
 *
 * @description
 * Displays a skeleton loading state matching the GlossariesSynonyms
 * component layout with search bar, filter chips, sort controls,
 * and a grid of card placeholders with type chips.
 */

const GlossariesSynonymsSkeleton: React.FC = () => {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Section (Search/Chips/Sort) Skeleton */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Search Bar Skeleton */}
          <Skeleton
            variant="rounded"
            width={300}
            height={32}
            sx={{ borderRadius: "24px" }}
          />
          {/* Filter Chips Skeleton */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Skeleton
              variant="rounded"
              width={60}
              height={32}
              sx={{ borderRadius: "16px" }}
            />
            <Skeleton
              variant="rounded"
              width={90}
              height={32}
              sx={{ borderRadius: "16px" }}
            />
            <Skeleton
              variant="rounded"
              width={110}
              height={32}
              sx={{ borderRadius: "16px" }}
            />
          </Box>
        </Box>
        {/* Sort Controls Skeleton */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={100} height={20} />
        </Box>
      </Box>

      {/* Cards Grid Skeleton */}
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
        {[1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            sx={{
              border: "1px solid #DADCE0",
              borderRadius: "16px",
              height: "132px",
              p: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Card Header with Icon, Title, and Type Chip */}
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
                  flex: 1,
                }}
              >
                <Skeleton
                  variant="circular"
                  width={24}
                  height={24}
                  sx={{ flexShrink: 0 }}
                />
                <Skeleton variant="text" width="50%" height={24} />
              </Box>
              {/* Type Chip Skeleton */}
              <Skeleton
                variant="rounded"
                width={60}
                height={20}
                sx={{ borderRadius: "25px", ml: 1, flexShrink: 0 }}
              />
            </Box>
            {/* Description Lines */}
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="80%" height={20} />
            </Box>
            {/* Footer with Time */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
              }}
            >
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={100} height={16} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default GlossariesSynonymsSkeleton;
