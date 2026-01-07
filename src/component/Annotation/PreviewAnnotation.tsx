import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton, 
  Tooltip
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '../../assets/svg/help_outline.svg';

/**
 * @file PreviewAnnotation.tsx
 * @summary Renders a list of accordions for displaying "aspect" data from an entry.
 *
 * @description
 * This component takes a data `entry` object and iterates over its `aspects`.
 * It filters out a predefined set of "global" aspects (like schema, overview)
 * and renders a Material-UI `Accordion` for each remaining annotation.
 *
 * Each `AccordionSummary` displays the aspect's name and an "Aspect" chip.
 * The `AccordionDetails` contains a custom table (rendered by `renderAnnotation`)
 * that displays the key-value pairs from the aspect's data fields.
 *
 * Key features:
 * 1.  **Sortable Table**: The rendered Name/Value table supports three-state
 * sorting (ascending, descending, off) on both the "Name" and "Value" columns.
 * 2.  **Controlled Expansion**: The component uses a `Set` (`expandedItems`) and
 * a setter function (`setExpandedItems`) passed as props. This allows a
 * parent component to control which accordions are open, enabling features
 * like "Expand All" / "Collapse All".
 * 3.  **Empty Data Handling**: It uses `hasValidAnnotationData` to check if an
 * aspect has displayable data. If not, the accordion is rendered as
 * disabled (grayed out, non-clickable).
 * 4.  **Layout Toggling**: The `isTopComponent` prop adjusts the column widths
 * of the Name/Value table for different layout needs.
 *
 * @param {object} props - The props for the PreviewAnnotation component.
 * @param {any} props.entry - The data entry object, which must contain an `aspects`
 * property.
 * @param {React.CSSProperties} props.css - Optional CSS properties to be
 * applied to the main container `div`.
 * @param {boolean} [props.isTopComponent=false] - An optional flag (defaults
 * to `false`) that adjusts the flex-basis of the table columns.
 * @param {Set<string>} props.expandedItems - A `Set` of strings, where each
 * string is the key of an aspect that should be rendered in an expanded state.
 * @param {React.Dispatch<React.SetStateAction<Set<string>>>} props.setExpandedItems -
 * The React state setter function from the parent component to update the
 * `expandedItems` set when an accordion is toggled.
 *
 * @returns {JSX.Element} A React component rendering a list of accordions
 * inside a styled `div`.
 */

// interface for the filter dropdown Props
interface PreviewAnnotationProps {
  entry: any;
  css: React.CSSProperties; // Optional CSS properties for the button
  isTopComponent?: boolean;
  expandedItems: Set<string>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  isGlossary?: boolean;
}

// FilterDropdown component
const PreviewAnnotation: React.FC<PreviewAnnotationProps> = ({ 
  entry, 
  css, 
  isTopComponent = false, 
  expandedItems = new Set(),
  setExpandedItems,
  isGlossary = false 
}) => {
  
  const aspects = entry?.aspects;
  const number = entry?.entryType?.split('/').length > 0 ? entry?.entryType.split('/')[1] : '0';
  const keys = Object.keys(aspects ?? {});
  
  // State to track which accordions are expanded
  // const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
  
  const [sortConfigs, setSortConfigs] = useState<Record<string, { key: 'name' | 'value'; direction: 'asc' | 'desc' } | null>>({});
  const [hoveredInfo, setHoveredInfo] = useState<{ aspectKey: string; column: 'name' | 'value' } | null>(null);

  // Handle accordion expansion change
  const handleAccordionChange = (key: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    
    // Create a new Set based on the prop to avoid direct mutation
    const newExpanded = new Set(expandedItems);
    if (isExpanded) {
      newExpanded.add(key);
    } else {
      newExpanded.delete(key);
    }
    // Call the setter function from props to update the parent's state
    setExpandedItems(newExpanded);
  };

    const handleSort = (aspectKey: string, column: 'name' | 'value') => {
    const currentConfig = sortConfigs[aspectKey];
      if (currentConfig?.key === column) {
        if (currentConfig.direction === 'asc') {
          // From 'asc', go to 'desc'
          setSortConfigs(prev => ({ ...prev, [aspectKey]: { key: column, direction: 'desc' } }));
        } else {
          // From 'desc', clear the sort (third click)
          setSortConfigs(prev => {
            const newConfigs = { ...prev };
            delete newConfigs[aspectKey];
            return newConfigs;
          });
        }
      } else {
        // No sort or new column, so start with 'asc'
        setSortConfigs(prev => ({ ...prev, [aspectKey]: { key: column, direction: 'asc' } }));
      }
    };

    // Returns the correct sort icon based on the current state
    const getSortIcon = (aspectKey: string, column: 'name' | 'value') => {
      const sortConfig = sortConfigs[aspectKey]; // Get the config for the specific accordion

      if (sortConfig?.key !== column) {
        // Default, non-active icon
        return <ArrowUpward sx={{ fontSize: '14px', color: '#575757', opacity: 0.3 }} />;
      }
      return sortConfig.direction === 'asc' ? 
        <ArrowUpward sx={{ fontSize: '14px', color: '#575757' }} /> : 
        <ArrowDownward sx={{ fontSize: '14px', color: '#575757' }} />;
    };

   const renderAnnotation = (fields: any, aspectKey: string) => {
    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return (
        <div style={{ padding: '0.5rem', color: '#575757', fontStyle: 'italic', fontSize: '0.75rem' }}>
          No data available
        </div>
      );
    }

    const fieldKeys = Object.keys(fields);

  const validFields = fieldKeys.filter(key => {
  const item = fields[key];
  if (item && typeof item === 'object' && 'kind' in item) {
     return (item.kind === 'stringValue' && item.stringValue) ||
            (item.kind === 'numberValue' && item.numberValue !== undefined) ||
            (item.kind === 'boolValue') ||
            (item.kind === "listValue" && item.listValue && item.listValue.values && item.listValue.values.length > 0);
  }
  // Simple type (Standard JSON key-value)
  return item !== null && item !== undefined && typeof item !== 'object';
});

    if (validFields.length === 0) {
      return null;
    }

    const sortedFieldKeys = [...validFields].sort((a, b) => {
      const sortConfig = sortConfigs[aspectKey]; 
      
      if (!sortConfig) {
        return 0;
      }
      
      let aValue: string;
      let bValue: string;

      if (sortConfig.key === 'name') {
        aValue = a.toLowerCase();
        bValue = b.toLowerCase();
      } else { // sorting by 'value'
        const valA = fields[a];
        const valB = fields[b];
        
        // Helper to extract string value regardless of format
        const getString = (v: any) => {
            if (v?.kind === 'stringValue') return v.stringValue || '';
            if (v?.kind === 'numberValue') return String(v.numberValue) || '';
            if (v?.kind === 'boolValue') return v.boolValue ? 'true' : 'false';
            if (typeof v !== 'object') return String(v);
            return ''; 
        };

        aValue = getString(valA).toLowerCase();
        bValue = getString(valB).toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return (
      <div style={{
        border: "1px solid #E0E0E0",
        borderRadius: "0.5rem",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
      }}>
        {/* Table Header */}
        <div
        style={{
          height: "36px",
          display: "flex",
          backgroundColor: "#F8F9FA",
          borderBottom: "1px solid #E0E0E0",
          padding: "0.5rem 1rem",
          flex: "0 0 auto"
        }}>
          <div
            onMouseEnter={() => setHoveredInfo({ aspectKey: aspectKey, column: 'name' })}
            onMouseLeave={() => setHoveredInfo(null)}
            style={{
              flex: isTopComponent ? "0 0 30%" : "0 0 50%",
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "#444746",
              fontFamily: "Google Sans Text, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
          >
            Name
            {((hoveredInfo?.aspectKey === aspectKey && hoveredInfo?.column === 'name') || sortConfigs[aspectKey]?.key === 'name') && (

              <Tooltip title="Sort" arrow>
                <IconButton size="small" onClick={() => handleSort(aspectKey, 'name')} sx={{ padding: 0 }}>
                  {getSortIcon(aspectKey, 'name')}
                </IconButton>
              </Tooltip>
            )}
          </div>
          <div
            onMouseEnter={() => setHoveredInfo({ aspectKey: aspectKey, column: 'value' })}
            onMouseLeave={() => setHoveredInfo(null)}
            style={{
              flex: isTopComponent ? "0 0 70%" : "0 0 50%",
              fontSize: "0.75rem",
              fontWeight: "500",
              color: "#444746",
              fontFamily: "Google Sans Text, sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Value
            {((hoveredInfo?.aspectKey === aspectKey && hoveredInfo?.column === 'value') || sortConfigs[aspectKey]?.key === 'value') && (
              <Tooltip title="Sort" arrow>
                <IconButton size="small" onClick={() => handleSort(aspectKey, 'value')} sx={{ padding: 0 }}>
                  {getSortIcon(aspectKey, 'value')}
                </IconButton>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Table Rows */}
        {sortedFieldKeys.map((key, index) => {
          const item = fields[key];
          let displayValue = '';

          if (item && typeof item === 'object' && item.kind === "listValue") {
            return item.listValue.values.map((value: any, valueIndex: number) => (
              <div key={`${key}-annotation-${valueIndex}`} style={{
                display: "flex", borderBottom: "1px solid #E0E0E0", padding: "0.75rem 1rem",
                backgroundColor: "#FFFFFF", flex: "0 0 auto"
              }}>
                <div style={{ flex: isTopComponent ? "0 0 30%" : "0 0 40%", display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "#1F1F1F", fontFamily: "sans-serif",wordBreak: 'break-word' }}>
                  {key}
                  <img src={HelpOutlineIcon} alt="Help" style={{ width: "0.875rem", height: "0.875rem", opacity: "0.6", flex: "0 0 auto" }} />
                </div>
                <div style={{ flex: isTopComponent ? "0 0 70%" : "0 0 60%", fontSize: "0.75rem", color: "#1F1F1F", fontFamily: "sans-serif", wordBreak: 'break-word' }}>
                  {value.stringValue}
                </div>
              </div>
            ));
          }

          if (item && typeof item === 'object') {
            if (item.kind === 'stringValue') displayValue = item.stringValue;
            else if (item.kind === 'numberValue') displayValue = String(item.numberValue);
            else if (item.kind === 'boolValue') displayValue = item.boolValue ? 'true' : 'false';
          } else if (typeof item !== 'object' && item !== null && item !== undefined) {
            displayValue = String(item);
          }

          if (displayValue) {
            return (
              <div key={key + "annotation"} style={{
                minHeight: '36px',
                display: "flex",
                borderBottom: index === sortedFieldKeys.length - 1 ? 'none' : '1px solid #E0E0E0',
                paddingLeft: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backgroundColor: "#FFFFFF",
                flex: "0 0 auto",
                gap: '0.3rem'
              }}>
                <div style={{
                  flex: isTopComponent ? "0 0 30%" : "0 0 50%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.75rem",
                  color: "#1F1F1F",
                  fontFamily: "sans-serif",
                  wordBreak: 'break-word',
                }}>
                  {key}
                </div>
                <div style={{
                  flex: isTopComponent ? "0 0 70%" : "0 0 50%",
                  fontSize: "0.75rem",
                  color: "#1F1F1F",
                  fontFamily: "Google Sans Text, sans-serif",
                  fontWeight: "400",
                  bottom: '-1px',
                  right: '6px',
                  position: "relative",
                  wordBreak: 'break-word',
                }}>
                  {displayValue}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
};

  return (
    <>
      <div style={{ fontSize: "0.75rem", border: "1px solid #E0E0E0", display: "flex", flexDirection: "column", flex: "1 1 auto", overflow: "hidden", borderRadius: "8px", ...css }}>
        {keys.map((key, index) => {
          const isSchema = key === `${number}.global.schema`;
          const isOverview = key.endsWith('.global.overview');
          const isContacts = key === `${number}.global.contacts`;
          const isUsage = key === `${number}.global.usage`;
          const isGlossaryTermAspect = key.endsWith('.global.glossary-term-aspect');

          if (isSchema || isOverview || isContacts || isUsage || isGlossaryTermAspect) {
            return null;
          }

          const rawData = aspects[key].data;
          
          const hasFields = rawData && rawData.fields && Object.keys(rawData.fields).length > 0;
          let hasContent = false;

          if (rawData) {
             const fieldsToCheck = rawData.fields || rawData;

             const validFieldKeys = Object.keys(fieldsToCheck).filter(fieldKey => {
                const item = fieldsToCheck[fieldKey];
                
                if (item && typeof item === 'object' && 'kind' in item) {
                    return (item.kind === 'stringValue' && item.stringValue) ||
                          (item.kind === 'numberValue' && item.numberValue !== undefined) ||
                          (item.kind === 'boolValue') ||
                          (item.kind === "listValue" && item.listValue?.values?.length > 0);
                }
                
                return item !== null && item !== undefined && typeof item !== 'object';
            });

             hasContent = validFieldKeys.length > 0;
          }
          const aspectName = aspects[key].aspectType.split('/').pop().replaceAll('-', ' ');

          const headerContent = (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flex: '1 1 auto',
              marginRight: isGlossary ? '0.5rem' : '3.75rem'
            }}>
              <Typography component="span" sx={{
                fontFamily: 'Google Sans Text, sans-serif',
                fontWeight: 500,
                fontSize: isGlossary ? '0.7rem': '0.875rem',
                lineHeight: 1.43,
                color: "#1f1f1f",
                textTransform: "capitalize",
                wordBreak: isGlossary ? 'break-word' : 'normal',
              }}>
                {aspectName}
              </Typography>
              <span style={{
                fontFamily: '"Google Sans Text", sans-serif',
                fontSize: isGlossary ? "0.7rem": "0.75rem",
                background: expandedItems.has(key) ? "#0B57D0" : "#E7F0FE",
                color: expandedItems.has(key) ? "#FFFFFF" : "#004A77",
                padding: "0.25rem 0.625rem",
                borderRadius: "1.875rem",
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1,
                fontWeight: 500
              }}>
                Aspect
              </span>
            </div>
          );

          if (hasContent) {
            return (
              <Accordion
                key={key + "accordion"}
                expanded={expandedItems.has(key)}
                onChange={handleAccordionChange(key)} 
                disableGutters
                sx={{
                  background: "none",
                  boxShadow: "none",
                  '&:before': { display: 'none' },
                  borderTop: index === 0 ? 'none' : '1px solid #E0E0E0',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={key + "-content"}
                  id={key + "-header"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '3rem',
                    padding: '0 1rem',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                  }}
                  sx={{
                    '& .MuiAccordionSummary-content': { margin: 0 },
                    '& .MuiAccordionSummary-expandIconWrapper': {
                      color: '#575757'
                    }
                  }}
                >
                  {headerContent}
                </AccordionSummary>
                <AccordionDetails sx={{ padding: "0rem 1rem 1rem 1rem" }}>
                  {renderAnnotation(hasFields ? rawData.fields : rawData, key)}
                </AccordionDetails>
              </Accordion>
            );
          } else {
            return (
              <div
                key={key + "static"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '3rem',
                  padding: '0 1rem',
                  backgroundColor: '#ffffff',
                  borderTop: index === 0 ? 'none' : '1px solid #E0E0E0',
                  cursor: 'default'
                }}
              >
                {headerContent}
              </div>
            );
          }
        })}
      </div>
    </>
  );
}

export default PreviewAnnotation;