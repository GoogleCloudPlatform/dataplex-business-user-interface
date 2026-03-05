import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  Tooltip,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import AnnotationsIconBlue from '../../assets/svg/annotations-icon-blue.svg';
import AnnotationSubitemIcon from '../../assets/svg/annotation-subitem.svg';
import ShimmerLoader from '../Shimmer/ShimmerLoader';

/**
 * @file SideNav.tsx
 * @summary Renders the side navigation panel for the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component displays a list of "Aspects" (from the `annotationsData` prop)
 * using Material-UI `ListItemButton` components with a pill-shaped design matching
 * the Glossary sidebar. Only one aspect can be expanded at a time, which is managed
 * by the internal `expandedItem` state.
 *
 * Each expanded aspect reveals a list of its `subItems`. When a user clicks on a `subItem`:
 * 1.  It calls the `onItemClick` prop function, passing the parent aspect item.
 * 2.  It calls the `onSubItemClick` prop function, passing the specific sub-item
 * that was clicked.
 *
 * These callbacks allow the parent component to navigate to the ResourceViewer.
 *
 * @param {object} props - The props for the SideNav component.
 * @param {any} props.selectedItem - The currently selected top-level aspect item.
 * @param {(item: any) => void} props.onItemClick - Callback function when an aspect is clicked.
 * @param {any} props.selectedSubItem - The currently selected sub-item.
 * @param {(subItem: any) => void} props.onSubItemClick - Callback function when a sub-item is clicked.
 * @param {any[]} props.annotationsData - The array of aspect objects to be rendered.
 *
 * @returns {JSX.Element} The rendered React component for the side navigation bar.
 */

interface SideNavProps {
  selectedItem: any;
  onItemClick: (item: any) => void;
  selectedSubItem: any;
  onSubItemClick: (subItem: any) => void;
  annotationsData: any[];
  loadingAspectName?: string | null;
}

const SideNav: React.FC<SideNavProps> = ({
  selectedItem,
  onItemClick,
  selectedSubItem,
  onSubItemClick,
  annotationsData,
  loadingAspectName = null,
}) => {

  const [expandedItem, setExpandedItem] = React.useState<number | false>(0); // Auto-expand first item

  const handleAspectClick = (annotation: any, index: number) => {
    // Toggle expansion
    setExpandedItem(expandedItem === index ? false : index);
    // Select the aspect
    onItemClick(annotation);
  };

  const handleSubItemClick = (subItem: any, item: any) => {
    if (selectedItem?.name !== item?.name) {
      onItemClick(item);
    }
    onSubItemClick(subItem);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: '18%',
        minWidth: '240px',
        height: 'calc(100vh - 80px)',
        borderRadius: '24px',
        backgroundColor: '#fff',
        border: 'transparent',
        mr: '2%',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        py: '20px',
        gap: '8px',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontFamily: 'Google Sans Text',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: '24px',
          color: '#000000',
          mb: 2,
          px: 2.5,
        }}
      >
        Aspects
      </Typography>

      <List component="div" disablePadding sx={{ overflowY: 'auto', flex: 1, pt: 0, px: 0 }}>
        {annotationsData.map((annotation: any, index: number) => {
          const isExpanded = expandedItem === index;
          const isSelected = selectedItem?.name === annotation.name;

          return (
            <Box key={annotation.name || index}>
              {/* Parent Item - Aspect */}
              <ListItemButton
                selected={isSelected && !selectedSubItem}
                onClick={() => handleAspectClick(annotation, index)}
                sx={{
                  ml: '15px',
                  mr: '20px',
                  pl: '8px',
                  pr: '12px',
                  py: '8px',
                  height: '32px',
                  borderRadius: '200px',
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "#C2E7FF",
                    color: "#1F1F1F",
                    "&:hover": { backgroundColor: "#C2E7FF" },
                    "& .MuiListItemIcon-root": { color: "#1F1F1F" },
                    "& .MuiTypography-root": { fontWeight: 500 },
                  },
                  '&:hover': {
                    backgroundColor: (isSelected && !selectedSubItem) ? '#C2E7FF' : '#F1F3F4',
                  },
                }}
              >
                {/* Chevron Icon */}
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mr: 0.5,
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <ExpandMore
                    sx={{ fontSize: 16, color: '#1F1F1F' }}
                  />
                </Box>

                {/* Annotation Icon */}
                <ListItemIcon sx={{ minWidth: 20, mr: 0.1, color: '#1F1F1F' }}>
                  <img
                    src={AnnotationsIconBlue}
                    alt=""
                    style={{ width: '16px', height: '16px' }}
                  />
                </ListItemIcon>

                {/* Title */}
                <ListItemText
                  primary={annotation.title}
                  primaryTypographyProps={{
                    fontFamily: 'Product Sans',
                    fontSize: '12px',
                    fontWeight: isExpanded || isSelected ? 500 : 400,
                    color: '#1F1F1F',
                    noWrap: true,
                    letterSpacing: '0.1px',
                  }}
                />
              </ListItemButton>

              {/* Sub-Items - Collapsed */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                {loadingAspectName === annotation.name && !annotation.subTypesLoaded ? (
                  <Box sx={{ pl: '40px', pr: '20px', pt: 1 }}>
                    <ShimmerLoader count={4} type="simple-list" />
                  </Box>
                ) : (
                  <List component="div" disablePadding>
                    {annotation.subItems.map((subItem: any, subIndex: number) => {
                      const isSubItemSelected = selectedSubItem?.title === subItem.title && selectedItem?.name === annotation.name;

                      return (
                        <ListItemButton
                          key={subIndex}
                          selected={isSubItemSelected}
                          onClick={() => handleSubItemClick(subItem, annotation)}
                          sx={{
                            ml: '40px',
                            mr: '20px',
                            pl: '8px',
                            pr: '12px',
                            py: '8px',
                            height: '32px',
                            borderRadius: '200px',
                            mb: 0.5,
                            '&.Mui-selected': {
                              backgroundColor: '#C2E7FF',
                              color: '#1F1F1F',
                              '&:hover': { backgroundColor: '#C2E7FF' },
                              '& .MuiListItemIcon-root': { color: '#1F1F1F' },
                              '& .MuiTypography-root': { fontWeight: 500 },
                            },
                            '&:hover': {
                              backgroundColor: isSubItemSelected ? '#C2E7FF' : '#F1F3F4',
                            },
                          }}
                        >
                          {/* Sub-item Icon */}
                          <ListItemIcon sx={{ minWidth: 20, mr: 0.1, color: '#1F1F1F' }}>
                            <img
                              src={AnnotationSubitemIcon}
                              alt=""
                              style={{ width: '12px', height: '12px' }}
                            />
                          </ListItemIcon>

                          {/* Sub-item Title - Show displayName if available */}
                          <Tooltip
                            title={subItem.displayName || subItem.title}
                            placement="right"
                            enterDelay={500}
                            arrow
                          >
                            <ListItemText
                              primary={subItem.displayName || subItem.title}
                              primaryTypographyProps={{
                                fontFamily: 'Google Sans',
                                fontSize: '12px',
                                fontWeight: isSubItemSelected ? 500 : 400,
                                color: '#1F1F1F',
                                noWrap: true,
                                letterSpacing: '0.1px',
                              }}
                            />
                          </Tooltip>
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
};

export default SideNav;
