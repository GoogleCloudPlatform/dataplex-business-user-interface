import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * @file AspectLinkedAssetsSkeleton.tsx
 * @summary Skeleton loader for Linked Assets view in Browse by Annotation
 *
 * @description
 * Displays a skeleton loading state matching the AspectLinkedAssets
 * component layout with filter button, search bar, and a list of card placeholders.
 * Shows while linked assets are being fetched.
 */

const AspectLinkedAssetsSkeleton: React.FC = () => {
  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          borderRadius: "16px",
          overflow: "visible",
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Toolbar Skeleton: Filter Button + Search */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            mb: 2,
            pt: 1,
          }}
        >
          {/* Filter Button Skeleton */}
          <Skeleton
            variant="rounded"
            width={40}
            height={32}
            sx={{ borderRadius: "59px", mr: 1 }}
          />

          {/* Search Bar Skeleton */}
          <Skeleton
            variant="rounded"
            width={309}
            height={32}
            sx={{ borderRadius: "54px" }}
          />
        </Box>

        {/* Resource Cards Skeleton */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box
              key={i}
              sx={{
                marginBottom: "10px",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #E0E0E0",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Shimmer Animation */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                  animation: "shimmer 1.5s infinite",
                  "@keyframes shimmer": {
                    "0%": { left: "-100%" },
                    "100%": { left: "100%" },
                  },
                }}
              />

              {/* Card Content Structure */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                {/* Icon placeholder */}
                <Skeleton
                  variant="rounded"
                  width={40}
                  height={40}
                  sx={{ borderRadius: "8px", flexShrink: 0 }}
                />

                {/* Title and subtitle placeholder */}
                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={16}
                    sx={{ marginBottom: "4px" }}
                  />
                  <Skeleton variant="text" width="40%" height={12} />
                </Box>
              </Box>

              {/* Description placeholder */}
              <Skeleton
                variant="text"
                width="80%"
                height={12}
                sx={{ marginBottom: "8px" }}
              />

              {/* Tags placeholder */}
              <Box sx={{ display: "flex", gap: "8px" }}>
                <Skeleton
                  variant="rounded"
                  width={60}
                  height={20}
                  sx={{ borderRadius: "12px" }}
                />
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={20}
                  sx={{ borderRadius: "12px" }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AspectLinkedAssetsSkeleton;
