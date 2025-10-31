import { Box } from '@mui/material';
import * as React from 'react';

/**
 * @file CustomTabPanel.tsx
 * @description
 * This component is a helper used for implementing tabbed interfaces,
 * typically in conjunction with Material-UI's `Tabs` component.
 *
 * It is responsible for displaying the content of a single tab panel.
 * It conditionally renders its `children` only when its `index` prop
 * matches the `value` prop (which represents the currently active tab).
 *
 * It also sets the appropriate `role` and ARIA attributes for accessibility.
 *
 * @param {TabPanelProps} props - The props for the component.
 * @param {React.ReactNode} [props.children] - (Optional) The content to be
 * displayed within this tab panel.
 * @param {number} props.index - The unique, 0-based index of this tab panel.
 * @param {number} props.value - The index of the currently active tab.
 *
 * @returns {React.ReactElement} A `div` element that conditionally
 * renders its children wrapped in a Material-UI `Box` when `value`
 * equals `index`.
 */

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return ( 
    <>
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        aria-labelledby={`tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ padding:"5px 0px"  }}>{children}</Box>}
      </div>
    </>
  );
}

export default CustomTabPanel;