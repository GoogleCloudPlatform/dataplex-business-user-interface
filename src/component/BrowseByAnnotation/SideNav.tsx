import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import AnnotationsIconBlue from '../../assets/svg/annotations-icon-blue.svg';
import AnnotationSubitemIcon from '../../assets/svg/annotation-subitem.svg';

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
 * These callbacks allow the parent component (e.g., `BrowseByAnnotation`) to
 * update the application's main content area.
 *
 * The component uses the `selectedSubItem` prop to apply active styling
 * (light blue background, bold text) to the sub-item that is currently selected.
 *
 * @param {object} props - The props for the SideNav component.
 * @param {any} props.selectedItem - The currently selected top-level aspect item.
 * @param {() => void} props.onItemClick - Callback function to notify the
 * parent when an item (aspect) is selected (triggered by clicking a sub-item).
 * @param {any} props.selectedSubItem - The currently selected sub-item. This
 * is used to apply active styling.
 * @param {() => void} props.onSubItemClick - Callback function to notify the
 * parent when a sub-item is clicked.
 * @param {any[]} props.annotationsData - The array of aspect objects, each
 * containing a `title` and a `subItems` array, to be rendered.
 *
 * @returns {JSX.Element} The rendered React component for the side navigation bar.
 */

interface SideNavProps {
  selectedItem: any;
  onItemClick: any | (() => void);
  selectedSubItem: any;
  onSubItemClick: any | (() => void);
  annotationsData: any[];
}

const SideNav: React.FC<SideNavProps> = ({ selectedItem, onItemClick,selectedSubItem, onSubItemClick, annotationsData }) => {
    
  const [expandedItem, setExpandedItem] = React.useState<number | false>(false);

  const handleSubItemClick = (subItem:any, item:any) => {
    console.log(selectedItem);
    if (selectedItem?.title !== item?.title) {
      onItemClick(item);
    } 
    onSubItemClick(subItem);
   //dispatch(browseResourcesByAspects({term : '', id_token: id_token, annotationName : title, subAnnotationName: subItem?.title || null}));
  };

  return (
    <Box
      sx={{
        width: '250px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        height: 'calc(100vh - 1.5rem)',
        marginTop: "0px",
        marginRight: "10px",
        py: '20px',
        overflowY: 'auto',
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

      <List component="div" disablePadding>
        {annotationsData.map((annotation: any, index: number) => {
          const isExpanded = expandedItem === index;

          return (
            <Box key={index}>
              {/* Parent Item - Aspect */}
              <ListItemButton
                onClick={() => {
                  setExpandedItem(isExpanded ? false : index);
                }}
                sx={{
                  ml: '15px',
                  mr: '20px',
                  pl: '8px',
                  pr: '12px',
                  py: '8px',
                  height: '32px',
                  borderRadius: '200px',
                  mb: 0.5,
                  backgroundColor: undefined,
                  '&:hover': {
                    backgroundColor: '#F1F3F4',
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
                    fontWeight: isExpanded ? 500 : 400,
                    color: '#1F1F1F',
                    noWrap: true,
                    letterSpacing: '0.1px',
                  }}
                />
              </ListItemButton>

              {/* Sub-Items - Collapsed */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {annotation.subItems.map((subItem: any, subIndex: number) => {
                    const isSelected = selectedSubItem?.title === subItem.title;

                    return (
                      <ListItemButton
                        key={subIndex}
                        selected={isSelected}
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
                          backgroundColor: undefined,
                          '&.Mui-selected': {
                            backgroundColor: '#C2E7FF',
                            color: '#1F1F1F',
                            '&:hover': { backgroundColor: '#C2E7FF' },
                            '& .MuiListItemIcon-root': { color: '#1F1F1F' },
                            '& .MuiTypography-root': { fontWeight: 500 },
                          },
                          '&:hover': {
                            backgroundColor: isSelected ? '#C2E7FF' : '#F1F3F4',
                          },
                        }}
                      >
                        {/* Sub-item Icon */}
                        <ListItemIcon sx={{ minWidth: 20, mr: 0.1, color: '#1F1F1F' }}>
                          <img
                            src={AnnotationSubitemIcon}
                            alt=""
                            style={{ width: '16px', height: '16px' }}
                          />
                        </ListItemIcon>

                        {/* Sub-item Title */}
                        <ListItemText
                          primary={subItem.title}
                          primaryTypographyProps={{
                            fontFamily: 'Google Sans',
                            fontSize: '12px',
                            fontWeight: isSelected ? 500 : 400,
                            color: '#1F1F1F',
                            noWrap: true,
                            letterSpacing: '0.1px',
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
};

export default SideNav;