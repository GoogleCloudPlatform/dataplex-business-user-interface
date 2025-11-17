import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import './xy-theme.css';
// @ts-ignore: Could not find a declaration file for module './ColorSelectorNode'
// import ColorSelectorNode from './ColorSelectorNode';
import LineageNode from './LineageNode';
import QueryNode from './QueryNode';
import { CloseFullscreen } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

const snapGrid:[number,number] = [20, 20];

// --- 2. Register Custom Node Types ---
// We tell React Flow that whenever it sees a node with type 'multiInput',
// it should render our MultiInputNode component.
const nodeTypes = {
  lineageNode: LineageNode,
  queryNode: QueryNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

interface LineageChartViewProps {
  handleSidePanelToggle?: (data:any, showSchema:boolean) => void;
  handleQueryPanelToggle?: (data:any) => void;
  //entry?: any; // Optional entry prop for data
  graphData: any[]; // Optional entry prop for data
  isSidePanelOpen?: boolean; // Side panel state
  selectedNode?: string | null; // Selected node name
  isFullScreen?: boolean;
  toggleFullScreen?: () => void;
}

const LineageChartViewNew : React.FC<LineageChartViewProps> = ({ handleSidePanelToggle, handleQueryPanelToggle, graphData, isSidePanelOpen = false, selectedNode = null, isFullScreen=false, toggleFullScreen }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [refresh, setRefresh] = useState<number>(0);

  useEffect(() => {

    const nodesArray:any = [];
    const edgesArray:any = [];
    const nodeSpacingX = 350; // Horizontal spacing between nodes
    const nodeSpacingY = 150; // Vertical spacing between nodes
    // Iterate over
    let defaultX = 100;
    let defaultY = 100;
    graphData.map((item:any, index:number) => {
      // Create node object
        if(item.type === 'assetNode' ){
            // defaultY = isLastNodeAsset ? defaultY + nodeSpacingY : defaultY;
            // isLastNodeAsset = true;
            nodesArray.push({
                id: item.id,
                type: 'lineageNode', // 'output' is another default node type
                data: { label: item.name, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode, nodeData:item },
                position: { x: (defaultX + (item.level * nodeSpacingX)), y: (defaultY + (item.count * nodeSpacingY ))},
                className: '!bg-blue-100 !border-blue-400',
                style: { 
                    border: '1px solid #bdbdbdff',
                    padding: '5px' 
                },
            });
        }else if(item.type === 'queryNode' ){
            // defaultX = isLastNodeAsset ? defaultX : defaultX + nodeSpacingX;
            // isLastNodeAsset = false;
            nodesArray.push({
                id: item.id,
                type: 'queryNode', // 'output' is another default node type
                data: { label: item.name, nodeData:item, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode},
                position: { x: (defaultX + (item.level * nodeSpacingX) + (item.level > 0 ? 100 : 0)), y: (defaultY + (item.count * nodeSpacingY ))},
                className: '!bg-blue-100 !border-blue-400',
                style: { borderRadius: '50%', padding: '5px', border:'1px solid #d58813ff' },
            });

            // Create edge object if not the first node
            edgesArray.push({
                id: `e${index-1}-${item.id}`, 
                source: item.source , // The 'id' of the source node
                target: item.id, // The 'id' of the target node
                animated: true,
                style: { stroke: '#555555', strokeWidth: 3 },
            });
            edgesArray.push({
                id: `e${index}-${item.id}`, 
                source:item.id , // The 'id' of the source node
                target: item.target, // The 'id' of the target node
                animated: true,
                style: { stroke: '#2b75d0ff', strokeWidth: 3 },
            });
        }
        // defaultX += nodeSpacingX;
        // defaultY += nodeSpacingY;
    }); 
    console.log("nodesArray, edgesArray", nodesArray, edgesArray);
    setNodes(nodesArray);
    setEdges(edgesArray);
}, [graphData, refresh]);

  const onConnect = useCallback(
    (params:any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [],
  );
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      style={{ border: '1px solid #fafafa', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px'}}
      nodeTypes={nodeTypes}
      snapToGrid={true}
      snapGrid={snapGrid}
      defaultViewport={defaultViewport}
      fitView
      attributionPosition="bottom-left"
    >
      {isFullScreen && (
            <Tooltip title={"Exit Fullscreen View"}>
            <CloseFullscreen 
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 9999,
                    fontSize: '1.25rem', 
                    color: '#575757', 
                    cursor: 'pointer', 
                    backgroundColor: '#F5F5F5',
                    borderRadius: '4px',
                    padding: '0.125rem',
                }}
                onClick={toggleFullScreen} 
            />
            </Tooltip>
        )}
      <Background
        variant={BackgroundVariant.Dots}
        gap={25}
        size={2}
        color="#c4c4c4"
        bgColor='rgb(248, 250, 253)' />
      <MiniMap
        nodeStrokeWidth={1}
        nodeStrokeColor={(n) => {
          if (n.type === 'lineageNode') return '#0041d0';
          if (n.type === 'queryNode') return '#5a3600ff';
          return '#000';
        }}
        nodeColor={(n) => {
          if (n.type === 'lineageNode') return '#0041d0';
          if (n.type === 'queryNode') return '#e4a03bff';
          return '#fff';
        }}
        pannable={true}
        zoomable={true}
        style={{backgroundColor: '#ffffff'}}
      />
      <Controls showInteractive={false}/>
    </ReactFlow>
  );
};

export default LineageChartViewNew;
