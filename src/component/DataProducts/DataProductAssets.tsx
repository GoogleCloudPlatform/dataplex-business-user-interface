import React, { useState, useMemo } from "react";
import { Box, Typography, InputBase, Tooltip } from "@mui/material";
import { Tune } from "@mui/icons-material";
import ResourceViewer from "../Common/ResourceViewer";
import FilterDropdown from "../Filter/FilterDropDown";
import { typeAliases } from "../../utils/resourceUtils";
import { GridFilterListIcon } from "@mui/x-data-grid";

interface DataProductAssetsProps {
  linkedAssets: any[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  idToken: string;
  onAssetPreviewChange: (data: any | null) => void;
}

const DataProductAssets: React.FC<DataProductAssetsProps> = ({
  linkedAssets,
  searchTerm,
  onSearchTermChange,
  idToken,
  onAssetPreviewChange,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);
  const [assetViewMode, setAssetViewMode] = useState<"list" | "table">("list");
  const [assetPageSize, setAssetPageSize] = useState(20);
  const [assetPreviewData, setAssetPreviewData] = useState<any | null>(null);

  const filteredLinkedAssets = useMemo(() => {
    let assets = linkedAssets || [];

    //if(searchTerm.length !== 0){
        if (searchTerm.trim()) {
        const lowerTerm = searchTerm.toLowerCase();
        assets = assets.filter((asset: any) => {
            const name = asset.dataplexEntry?.entrySource?.displayName || "";
            const description = asset.dataplexEntry?.entrySource?.description || "";
            return (
            name.toLowerCase().includes(lowerTerm) ||
            description.toLowerCase().includes(lowerTerm)
            );
        });
        }
    //}

    if (activeFilters.length > 0) {
      const systemFilters = activeFilters.filter(
        (f: any) => f.type === "system"
      );
      const typeFilters = activeFilters.filter(
        (f: any) => f.type === "typeAliases"
      );
      const projectFilters = activeFilters.filter(
        (f: any) => f.type === "project"
      );
      const aspectFilters = activeFilters.filter(
        (f: any) => f.type === "aspectType"
      );

      assets = assets.filter((asset: any) => {
        // Product Filter
        if (systemFilters.length > 0) {
          const system =
            asset.dataplexEntry?.entrySource?.system?.toLowerCase() || "";
          const match = systemFilters.some((filter: any) => {
            if (filter.name === "Others") return true;
            return system === filter.name.toLowerCase();
          });
          if (!match) return false;
        }

        // Asset Type Filter
        if (typeFilters.length > 0) {
          const entryTypeStr =
            asset.dataplexEntry?.entryType?.toLowerCase() || "";
          const match = typeFilters.some((filter: any) => {
            const filterName = filter.name.toLowerCase();
            const hyphenatedName = filterName.replace(/\s+/g, "-");
            return (
              entryTypeStr.includes(hyphenatedName) ||
              entryTypeStr.includes(filterName)
            );
          });
          if (!match) return false;
        }

        // Project Filter
        if (projectFilters.length > 0) {
          const resourcePath = asset.dataplexEntry?.entrySource?.resource || "";
          const linkedPath = asset.linkedResource || "";
          const match = projectFilters.some((filter: any) => {
            if (filter.name === "Others") return true;
            return (
              resourcePath.includes(filter.name) ||
              linkedPath.includes(filter.name)
            );
          });
          if (!match) return false;
        }

        // Aspect Filter
        if (aspectFilters.length > 0) {
          const aspects = asset.dataplexEntry?.aspects || {};
          const match = aspectFilters.some((filter: any) =>
            Object.keys(aspects).some((key) =>
              key.toLowerCase().includes(filter.name.toLowerCase())
            )
          );
          if (!match) return false;
        }

        return true;
      });
    }

    return assets;
  }, [linkedAssets, searchTerm, activeFilters]);

  const handlePreviewDataChange = (data: any | null) => {
    setAssetPreviewData(data);
    onAssetPreviewChange(data);
    if (data) setIsFilterOpen(false);
  };

  if (!linkedAssets || linkedAssets.length === 0) {
    return (
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
          No assets available for this Data Product.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "row",
          gap: "16px",
        }}
      >
        {/* LEFT SECTION: Search + List */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Toolbar: Search + Tune Icon */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              pt: 1,
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
              <GridFilterListIcon style={{ color: "#575757", marginRight: 10, fontSize: 16 }} />
              <InputBase
                placeholder="Filter assets by name or description"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                sx={{
                  fontFamily: "Google Sans Text",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#5E5E5E",
                  width: "100%",
                  "& ::placeholder": {
                    opacity: 1,
                    color: "#5E5E5E",
                  },
                }}
              />
            </Box>

            {/* Tune Icon - Toggles Filter */}
            <Tooltip title="Toggle Filters">
              <Box
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "32px",
                  borderRadius: "59px",
                  cursor: "pointer",
                  border: isFilterOpen ? "none" : "1px solid #DADCE0",
                  backgroundColor: isFilterOpen ? "#E7F0FE" : "transparent",
                  color: isFilterOpen ? "#0E4DCA" : "#575757",
                  transition: "all 0.2s ease",
                  mr: 2.5,
                }}
              >
                <Tune sx={{ fontSize: 20 }} />
              </Box>
            </Tooltip>
          </Box>

          {/* Resource Viewer Content */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResourceViewer
              resources={filteredLinkedAssets}
              resourcesStatus="succeeded"
              resourcesTotalSize={filteredLinkedAssets.length}
              previewData={assetPreviewData}
              onPreviewDataChange={handlePreviewDataChange}
              viewMode={assetViewMode}
              onViewModeChange={setAssetViewMode}
              selectedTypeFilter={null}
              onTypeFilterChange={() => {}}
              typeAliases={typeAliases}
              id_token={idToken}
              pageSize={assetPageSize}
              setPageSize={setAssetPageSize}
              requestItemStore={filteredLinkedAssets}
              handlePagination={() => {}}
              showFilters={false}
              showSortBy={false}
              showResultsCount={true}
              containerStyle={{
                height: "100%",
                border: "none",
                margin: 0,
                backgroundColor: "#fff",
                width: "100%",
              }}
              contentStyle={{
                minHeight: "auto",
                maxHeight: "100%",
              }}
            />
          </Box>
        </Box>

        {/* RIGHT SECTION: Filter Card (Collapsible) */}
        <Box
          sx={{
            width: isFilterOpen ? "clamp(230px, 18vw, 280px)" : "0px",
            minWidth: isFilterOpen ? "clamp(230px, 18vw, 280px)" : "0px",
            transition:
              "width 0.3s ease, min-width 0.3s ease, padding 0.3s ease, opacity 0.3s ease",
            opacity: isFilterOpen ? 1 : 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: isFilterOpen ? "20px" : "0px",
            gap: "20px",
            backgroundColor: "#FFFFFF",
            border: isFilterOpen ? "1px solid #DADCE0" : "none",
            borderRadius: "16px",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <FilterDropdown
              filters={activeFilters}
              onFilterChange={(newFilters) => setActiveFilters(newFilters)}
              isGlossary={true}
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default DataProductAssets;
