import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * @file SideNav.tsx
 * @summary Renders the side navigation panel for the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component displays a list of "Aspects" (from the `annotationsData` prop)
 * as a series of Material-UI `Accordion` components. Only one accordion
 * (Aspect) can be expanded at a time, which is managed by the internal
 * `expandedItem` state.
 *
 * Each expanded accordion reveals a list of its `subItems`. When a user
 * clicks on a `subItem`:
 * 1.  It calls the `onItemClick` prop function, passing the parent aspect item.
 * 2.  It calls the `onSubItemClick` prop function, passing the specific sub-item
 * that was clicked.
 *
 * These callbacks allow the parent component (e.g., `BrowseByAnnotation`) to
 * update the application's main content area.
 *
 * The component also uses the `selectedSubItem` prop to apply active
 * (blue, bold) styling to the sub-item that is currently selected.
 *
 * @param {object} props - The props for the SideNav component.
 * @param {any} props.selectedItem - The currently selected top-level aspect
 * item.
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

  const handleAccordionChange = (panelIndex: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedItem(isExpanded ? panelIndex : false);
  };

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
        padding: 2,
        overflowY: 'auto',
      }}
    >
      <Typography
        sx={{
          fontWeight: 500,
          fontSize: '1rem',
          lineHeight: '3rem',
          marginBottom: 2,
          paddingLeft: '10px',
          color: '#000000',
        }}
      >
        Aspects
      </Typography>

      <Box>
        <Box
          sx={{
            height: '0.1px',
            backgroundColor: '#E0E0E0',
            marginLeft: '5px',
            marginRight: '3.5px',
          }}
        />
        {annotationsData.map((annotation: any, index: number) => (
          <Accordion
            key={index}
            expanded={expandedItem === index}
            onChange={handleAccordionChange(index)}
            disableGutters
            style={{ background: 'none', boxShadow: 'none', margin: 0 }}
            sx={{
              '&:not(:first-of-type)::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                backgroundColor: '#E0E0E0',
                height: '1px',
                left: '5px',
                right: '3.5px',
                opacity: 1,
              },
              '&:before': {
                  height: 0,
              }
            }}
           >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
              sx={{
                padding: '0rem 0.3215rem 0rem 0.65rem',
                height: '48px',
                '& .MuiAccordionSummary-content': {
                  lineHeight: '48px',
                  margin: '14px -4.8px',
                },
                '& .MuiAccordionSummary-expandIconWrapper': {
                  marginRight: '-3px',
                },
                '&.Mui-expanded': {
                  minHeight: 'auto',
                  '& .MuiAccordionSummary-content': {
                    lineHeight: '48px',
                    margin: '14px -4.8px',
                  },
                },
              }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#1F1F1F',
                  fontFamily: 'Google Sans Text, sans-serif',
                }}
              >
                {annotation.title}
              </Typography>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                paddingTop: 0,
                marginTop: '-10px',
                paddingBottom: '0.5rem',
                paddingLeft: '0.35rem',
                paddingRight: '0.5rem',
              }}
            >
              {annotation.subItems.map((subItem: any, subIndex: number) => (
                <Box
                  key={subIndex}
                  onClick={() => handleSubItemClick(subItem, annotation)}
                  sx={{
                    padding: '6px 0',
                    cursor: 'pointer',
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: selectedSubItem?.title === subItem.title ? 500: 400,
                      fontSize: '12px',
                      fontFamily: 'Google Sans Text, sans-serif',
                      lineHeight: '16px',
                      color: selectedSubItem?.title === subItem.title ? '#0B57D0' : '#1F1F1F',
                    }}
                  >
                    {subItem.title}
                  </Typography>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default SideNav;