import { Box } from '@mui/material';
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * @file QueryNode.tsx
 * @description
 */

// MUI component styles based on Figma design
const nodeContentStyles = {
  color: '#1F1F1F',
  padding: '0.5rem',
  fontFamily: '"Google Sans", sans-serif',
};

export default memo(({ data, isConnectable } : any) => {
    const nodeData = data.nodeData;
  
    return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
        <Box 
        onClick={(e) => { 
            e.stopPropagation(); 
            data.handleQueryPanelToggle(nodeData);
        }}
        sx={nodeContentStyles}>
            <Box sx={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <img src="/assets/svg/query-icon.svg" alt={nodeData.name} style={{ width: '30px', height: '30px'}} />
            </Box>
        </Box>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});

