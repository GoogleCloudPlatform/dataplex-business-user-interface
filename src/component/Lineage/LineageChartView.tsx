import { AddOutlined } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import Tree from 'react-d3-tree'; // This import requires 'react-d3-tree' to be installed in your project.
import './LineageChartView.css'

/**
 * @file LineageChartView.tsx
 * @description
 * This component renders an interactive, horizontal lineage graph using the
 * `react-d3-tree` library. It is responsible for visualizing the hierarchical
 * `graphData` prop.
 *
 * It defines a custom node rendering function, `renderRectSvgNode`, which displays
 * two distinct types of nodes:
 * 1.  **Asset Nodes ('assetNode')**: A rectangular card showing an icon, the asset
 * name, and an "add" icon. If the node is the root (`isRoot`), it also
 * displays a preview of its schema (up to 3 fields). Clicking this node
 * triggers the `handleSidePanelToggle` callback.
 * 2.  **Query Nodes ('queryNode')**: A smaller square icon representing a
 * process or query. Clicking this node triggers the
 * `handleQueryPanelToggle` callback.
 *
 * The component supports zooming (controlled by the `zoomLevel` prop), panning,
 * and highlights the `selectedNode` with a blue border.
 *
 * @param {LineageChartViewProps} props - The props for the component.
 * @param {(data: any) => void} [props.handleSidePanelToggle] - (Optional) Callback
 * function invoked with the node's data when an 'assetNode' is clicked.
 * @param {(data: any) => void} [props.handleQueryPanelToggle] - (Optional) Callback
 * function invoked with the node's data when a 'queryNode' is clicked.
 * @param {any} props.graphData - The hierarchical data object (or array of
 * objects) to be rendered as a tree.
 * @param {React.CSSProperties} [props.css] - (Optional) Additional CSS styles
 * to apply to the main component `Box`.
 * @param {number} [props.zoomLevel=100] - (Optional) The current zoom percentage
 * to apply as a scale transform.
 * @param {boolean} [props.isSidePanelOpen=false] - (Optional) Flag to indicate if
 * the side panel is open, used for node highlighting.
 * @param {string | null} [props.selectedNode=null] - (Optional) The name of the
 * node to highlight as currently selected.
 *
 * @returns {React.ReactElement} A React element containing the `react-d3-tree`
 * component within a scalable `Box`.
 */

// MUI component styles based on Figma design
const nodeContentStyles = {
  color: '#1F1F1F',
  padding: '0.5rem',
  fontFamily: '"Google Sans", sans-serif',
};

// Custom node rendering function
// This allows for more detailed and styled nodes
const renderRectSvgNode = ({ nodeDatum, foreignObjectProps, handleSidePanelToggle, handleQueryPanelToggle, selectedNode, isSidePanelOpen }:any) => {
  let qForeignObjectProps = {
    width: 50,
    height: 50,
    x: -25, // Center the foreign object
    y: -25,
  };
  const number = nodeDatum.isRoot ? nodeDatum.entryData.entryType.split('/')[1] : null;
  const schema = nodeDatum.isRoot ? nodeDatum.entryData.aspects[`${number}.global.schema`].data.fields.fields.listValue.values : [];
  let foreignProps = foreignObjectProps;
  if(nodeDatum.isRoot) {
    foreignProps.height = schema.length > 0 ? 185 : 36;
  }
  return nodeDatum.name === "Virtual Root" ? (<></>) : nodeDatum.type == 'assetNode' ? (
    <g>
      {/* Node circle/rectangle */}
      <rect width="220" height={`${nodeDatum.isRoot && schema.length > 0 ? 185 : 36}`} x="-110" y="-18"
        fill="#FFFFFF"
        stroke="#E0E0E0"
        strokeWidth="1"
        rx="8"
        ry="8"
        onClick={() => {
        }}
        style={{ cursor: 'pointer' }}
      />

      {/* ForeignObject to embed HTML content */}
      <foreignObject {...foreignProps} style={{zIndex:-1}} onClick={(e) => {
          e.stopPropagation();
          //onNodeClick(nodeDatum.name);
          handleSidePanelToggle(nodeDatum);
        }}>
        <Box
          sx={{
            height: (nodeDatum.isRoot && schema.length > 0 ? "185px" : "36px"),
            width: '13.75rem',
            borderRadius: '0.5rem',
            border: (selectedNode === nodeDatum.name && isSidePanelOpen) ? '2px solid #0B57D0' : '1px solid #DADCE0',
          }}>
          <Box sx={{
            ...nodeContentStyles,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '2.25rem',
            width: '13.75rem',
            borderRadius: '0.5rem',
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
                    textTransform: 'capitalize',
                    width:"150px"
                  }}
                >
                    {nodeDatum.name}
                </Typography>
            </Box>
            
            {/* Bottom section - Add outline */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
                <AddOutlined style={{
                  cursor:"pointer", 
                  fontSize: "1.25rem",
                  color: "#0B57D0"
                }}/>
            </Box>
          </Box>
          {
            schema.length > 0 && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '13.75rem',
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
                        zIndex: -1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        //onNodeClick(nodeDatum.name);
                      }}
                    >
                        +{schema.length - 3} more
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
        </Box>
      </foreignObject>
    </g>
  ) : (
    <g>
      {/* Node circle/rectangle */}
      <rect width="50" height="50" x="-25" y="-25"
        fill="#FFFFFF"
        stroke="#E0E0E0"
        strokeWidth="1"
        rx="8"
        ry="8"
        onClick={() => {
        }}
        style={{ cursor: 'pointer' }}
      />
        <foreignObject {...qForeignObjectProps} style={{zIndex:-1}} onClick={(e) => {
            e.stopPropagation();
            //onNodeClick(nodeDatum.name);
            handleQueryPanelToggle(nodeDatum);
          }}>
          <Box sx={nodeContentStyles}>
            <Box sx={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <img src="/assets/svg/query-icon.svg" alt={nodeDatum.name} style={{ width: '30px', height: '30px', marginRight: '15px', marginTop: '2px' }} />
            </Box>
          </Box>
        </foreignObject>
    </g>
  )
};

interface LineageChartViewProps {
  handleSidePanelToggle?: (data:any) => void;
  handleQueryPanelToggle?: (data:any) => void;
  //entry?: any; // Optional entry prop for data
  graphData: any; // Optional entry prop for data
  css?: React.CSSProperties;
  zoomLevel?: number; // Zoom level prop
  isSidePanelOpen?: boolean; // Side panel state
  selectedNode?: string | null; // Selected node name
}

const LineageChartView : React.FC<LineageChartViewProps> = ({ handleSidePanelToggle, handleQueryPanelToggle, graphData, css, zoomLevel = 100, isSidePanelOpen = false, selectedNode = null }) => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // Sample data for the lineage graph
    // Each node represents an item in the lineage (e.g., a data product, a process)
    // 'children' array defines the direct descendants
  const initialData = Array.isArray(graphData) ? graphData : [graphData];

  // Use useEffect to get the container dimensions after the component mounts
  useEffect(() => {
    const treeContainer = document.getElementById('treeWrapper');
    if (treeContainer) {
      const { width, height } = treeContainer.getBoundingClientRect();
      setDimensions({ width, height });
      // Center the tree initially
      setTranslate({ x: 200, y: 100 });
    }
  }, []);

  const hideRootPath = (linkDatum:any) => {
    if (linkDatum.source.depth === 0 && linkDatum.source.data.name === "Virtual Root") { // Assuming depth 0 indicates the root node
      return 'hidden-link';
    }
    return '';
  };

  // const handleNodeClick = (nodeName: string) => {
  //   // Node selection is now handled by the parent component
  //   console.log('Node clicked:', nodeName);
  // };

  const foreignObjectProps = {
    width: 230,
    height: 36,
    x: -110, // Center the foreign object
    y: -18,
  };

//   const toggleNode = () => {
//     alert("Node clicked or toggle");
//   }

  // Define custom styles for links
  const pathFunc = (linkDatum:any, orientation:any) => {
    // This is the default diagonal path function used by react-d3-tree
    const { source, target } = linkDatum;
    const s = { x: source.x, y: source.y };
    const t = { x: target.x, y: target.y };

    if (orientation === 'horizontal') {
      return `M${s.y},${s.x}C${(s.y + t.y) / 2},${s.x} ${(s.y + t.y) / 2},${t.x} ${t.y},${t.x}`;
    }
    return `M${s.x},${s.y}C${s.x},${(s.y + t.y) / 2} ${t.x},${(s.y + t.y) / 2} ${t.x},${t.y}`;
  };

  return (
    <>
    <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            padding: '1rem',
            fontFamily: '"Google Sans", sans-serif',
            boxSizing: 'border-box',
            backgroundSize: 'cover',
            flex: '1 1 auto',
            backgroundColor: 'transparent',
            ...css,
      }}>
      <Box 
        id="treeWrapper" 
        sx={{
          width: '100%',
          height: '31.25rem',
          borderRadius: '0.5rem',
          overflow: 'hidden', 
          flex: '1 1 auto',
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'center center'
        }}
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          //initialData.map((rootData:any, index:number) => (
            // <Tree key={index} data={rootData} />
            <Tree
              data={initialData}
              //key={index}
              translate={translate}
              dimensions={dimensions}
              orientation="horizontal" // Can be 'horizontal' or 'vertical'
              pathClassFunc={hideRootPath}
              pathFunc={pathFunc} // Use default path function, can be customized
              nodeSize={{ x: 250, y: 150 }} // Spacing between nodes
              separation={{ siblings: 2.5, nonSiblings: 2.5 }} // Adjust separation
              zoomable={true}
              draggable={true}
              collapsible={true}

              // Use custom node element to apply styling and add interactivity
              renderCustomNodeElement={(rd3tProps) =>
                renderRectSvgNode({ ...rd3tProps, foreignObjectProps, handleSidePanelToggle, handleQueryPanelToggle, selectedNode, isSidePanelOpen })
              }
              onNodeClick={(node, evt) => {
                  console.log('onNodeClick', node, evt);
              }}
              onNodeMouseOver={(...args) => {
                  console.log('onNodeMouseOver', args);
              }}
              onNodeMouseOut={(...args) => {
                  console.log('onNodeMouseOut', args);
              }}
              onLinkClick={(...args) => {
                  console.log('onLinkClick');
                  console.log(args);
              }}
              onLinkMouseOver={(...args) => {
                  console.log('onLinkMouseOver', args);
              }}
              onLinkMouseOut={(...args) => {
                  console.log('onLinkMouseOut', args);
              }}
              // Custom link styling - using inline style for pathClassFunc
              // Note: 'pathClassFunc' returns a class name. Actual styling
              // for 'tree-path' would go into a global CSS file (e.g., index.css).
              // For purely inline styles, the `links` property in `styles` is used.
              depthFactor={200} // Increase depth factor for more vertical spacing
              
            />
          //))
          
        )}
      </Box>
    </Box>
    </>
  );
};

export default LineageChartView;
