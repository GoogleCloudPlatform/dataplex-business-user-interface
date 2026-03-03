import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * @file SubTypesTabSkeleton.tsx
 * @summary Skeleton loader for Sub Types tab in Browse by Annotation
 *
 * @description
 * Displays a skeleton loading state matching the SubTypesTab
 * component layout with search bar, sort controls, and a grid of card placeholders.
 * Shows while asset counts are being fetched.
 */

const SubTypesTabSkeleton: React.FC = () => {
  return (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Header Section (Search/Sort) Skeleton */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            mb: 3,
            flexShrink: 0,
          }}
        >
          {/* Search Bar Skeleton */}
          <Skeleton
            variant="rounded"
            width={309}
            height={32}
            sx={{ borderRadius: "54px" }}
          />
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box
              key={i}
              sx={{
                border: "1px solid #DADCE0",
                borderRadius: "16px",
                height: "120px",
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Top Row: Icon on left, Asset count chip on right */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Skeleton variant="circular" width={24} height={24} />
                {/* Asset count chip skeleton in top right */}
                <Skeleton
                  variant="rounded"
                  width={60}
                  height={20}
                  sx={{ borderRadius: "25px" }}
                />
              </Box>
              {/* Bottom: Name skeleton */}
              <Skeleton variant="text" width={120} height={24} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default SubTypesTabSkeleton;
