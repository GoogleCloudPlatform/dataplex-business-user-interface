import { Box, CircularProgress, Typography } from '@mui/material';
import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';

/**
 * @file LineageNode.tsx
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
    const number = nodeData.isRoot ? nodeData.entryData.entryType.split('/')[1] : null;
    const schema = nodeData.isRoot ? nodeData.entryData.aspects[`${number}.global.schema`].data.fields.fields.listValue.values : [];
    const [lineageLoader, setLineageLoader] = useState<boolean>(false); 

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
            data.handleSidePanelToggle(nodeData, false);
          }}
          sx={{
            // height: (nodeData.isRoot && schema.length > 0 ? "185px" : "36px"),
            width: '18.3rem',
            borderRadius: '0.5rem',
            backgroundColor: '#FFFFFF',
            padding:'3px 2px 0px 2px',
          }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: '0.3rem', 
              padding: '0px',//'0.2rem' 
              }}>
              <Box >
                { nodeData.showDownStreamIcon && (<>
                {(!lineageLoader || nodeData.isUpStreamFetched) && (<ChevronLeftOutlined 
                onClick={(e) => {
                  e.stopPropagation();
                  setLineageLoader(true);
                  //onNodeClick(nodeData.name);
                  data.fetchLineageDownStream(nodeData);
                }}
                sx={{
                  transition: 'transform 0.3s ease',
                  transform: nodeData.isRoot || nodeData.isDownStreamFetched ? `rotate(180deg)` : `rotate(0deg)`,
                  cursor: nodeData.isRoot ? 'not-allowed' :'pointer',
                  fontSize: "2.2rem",
                  color: '#0B57D0',
                  border: '2px solid #efefef',
                  borderRadius: '0.5rem',
                  padding: '2px',
                  zIndex:2,
                  "&:hover": { 
                    background: nodeData.isRoot ? '#a6a6a6' : '#0B57D0',
                    color: nodeData.isRoot ? '#0B57D0' : '#FFFFFF',
                    transition: "background-color 150ms linear"
                  }
                }}/>)}
                {(lineageLoader && !nodeData.isUpStreamFetched )&& (<CircularProgress style={{width:'30px', height:'30px', margin:'5px 2px 3px 5px'}}/>)}
                </>)}
              </Box>
            <Box sx={{
              ...nodeContentStyles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '2.25rem',
              width:nodeData.isRoot ? "13.75rem" :'15.3rem',
              // borderRadius: '0.5rem',
              // border: '1px solid #DADCE0',
            }}>
              {/* Top section - Icon and Name */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                  <img 
                    src="/assets/images/Product-Icons.png" 
                    alt="Asset Preview" 
                    style={{width:"1.5rem", height:"1.5rem"}} 
                  />
                  <Typography 
                    variant="heading2Medium"
                    sx={{ 
                      color: "#1F1F1F", 
                      fontSize:"0.875rem", 
                      fontWeight:"500", 
                      textAlign: 'center',
                      overflow: 'hidden', 
                      whiteSpace: 'nowrap', 
                      textOverflow: 'ellipsis',
                      maxWidth: '100%',
                      // textTransform: 'capitalize',
                      width: nodeData.isRoot ? "10rem" : "12.5rem"
                    }}
                  >
                      {nodeData.name}
                  </Typography>
              </Box>
            </Box>
            <Box >
              { nodeData.showUpStreamIcon && (<>
                {(!lineageLoader || nodeData.isDownStreamFetched) && (<ChevronRightOutlined 
              onClick={(e) => {
                e.stopPropagation();
                //onNodeClick(nodeData.name);
                data.fetchLineageUpStream(nodeData);
              }}
              sx={{
                  transition: 'transform 0.3s ease',
                  transform: nodeData.isRoot || nodeData.isUpStreamFetched ? `rotate(180deg)` : `rotate(0deg)`,
                  cursor: nodeData.isRoot ? 'not-allowed' :'pointer',
                  fontSize: "2.2rem",
                  color: '#0B57D0',
                  border: '2px solid #efefef',
                  borderRadius: '0.5rem',
                  padding: '2px',
                  zIndex:2,
                  "&:hover": { 
                    background: nodeData.isRoot ? '#a6a6a6' : '#0B57D0',
                    color: nodeData.isRoot ? '#0B57D0' : '#FFFFFF',
                    transition: "background-color 150ms linear"
                  }
              }}/>)}
                {(lineageLoader && !nodeData.isDownStreamFetched )&& (<CircularProgress style={{width:'30px', height:'30px', margin:'5px 2px 3px 5px'}}/>)}
                </>)}
            </Box>
            </Box>
            
          {
            schema.length > 0 && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '18.1rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
              }}>

                {schema.slice(0,3).map((field:any, index:number) => (
                  <Box 
                    key={index}
                    sx={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      boxSizing: 'border-box',
                    }}>
                    <Typography 
                      sx={{
                        color: "#1F1F1F", 
                        fontSize:"0.75rem", 
                        fontWeight:"400", 
                        textAlign: 'left',
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        textTransform: 'capitalize',
                        width:"100%"
                      }}
                    >
                        {field.structValue.fields.name.stringValue}
                    </Typography>
                  </Box>
                ))}
                {schema.length > 3 && (
                  <Box 
                    sx={{
                      flex: 1,
                      padding: '0.5rem',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Typography 
                      sx={{
                        color: "#0B57D0",
                        fontSize:"0.75rem", 
                        fontWeight:"500", 
                        textAlign: 'center',
                        cursor: 'pointer',
                        "&:hover" : { textDecoration: 'underline', backgroundColor:"#b3caf2ff", borderRadius: '4px' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        //onNodeClick(nodeData.name);
                        //setSchemaFullView(true);
                        data.handleSidePanelToggle(nodeData, true);
                      }}
                    >
                        +{schema.length - 3} more
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
        </Box>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
});

