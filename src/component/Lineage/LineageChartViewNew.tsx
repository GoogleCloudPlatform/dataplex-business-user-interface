import { useState, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
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
//@ts-ignore: Could not find a declaration file for module '@dagrejs/dagre'
import dagre from '@dagrejs/dagre';
import './LineageChartViewNew.css';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes:any, edges:any, direction = 'LR') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node:any) => {
    dagreGraph.setNode(node.id, { width: (node.type === 'lineageNode' ? 350 : 150), height: (node.data?.nodeData?.isRoot ? 350 / 2 : 200 / 2) });
  });

  edges.forEach((edge:any) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node:any) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - (node.type === 'lineageNode' ? 350/2 : 150/2),
        y: nodeWithPosition.y - (node.data?.nodeData?.isRoot ? 350 / 2 : 200 / 2),
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};


const snapGrid:[number,number] = [20, 20];
// --- 2. Register Custom Node Types ---
// We tell React Flow that whenever it sees a node with type 'multiInput',
// it should render our MultiInputNode component.
const nodeTypes = {
  lineageNode: LineageNode,
  queryNode: QueryNode,
};
const defaultViewport = { x: 0, y: 0, zoom: 4 };

interface LineageChartViewProps {
  handleSidePanelToggle?: (data:any, showSchema:boolean) => void;
  handleQueryPanelToggle?: (data:any) => void;
  fetchLineageDownStream?: (nodeData:any) => void;
  fetchLineageUpStream?: (nodeData:any) => void;
  //entry?: any; // Optional entry prop for data
  graphData: any[]; // Optional entry prop for data
  isSidePanelOpen?: boolean; // Side panel state
  selectedNode?: string | null; // Selected node name
  isFullScreen?: boolean;
  toggleFullScreen?: () => void;
}


const LineageChartViewNew : React.FC<LineageChartViewProps> = ({ handleSidePanelToggle, handleQueryPanelToggle, fetchLineageDownStream, fetchLineageUpStream, graphData, isSidePanelOpen = false, selectedNode = null, isFullScreen=false, toggleFullScreen }) => {
  
  const [refresh, setRefresh] = useState<number>(0);  
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  useEffect(() => {
    
    const nodesArray:any = [];
    const edgesArray:any = [];

    graphData.map((item:any, index:number) => {
      // Create node object
        if(item.type === 'assetNode' ){
            nodesArray.push({
                id: item.id,
                type: 'lineageNode', // 'output' is another default node type
                data: { label: item.name, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode, nodeData:item, fetchLineageDownStream, fetchLineageUpStream},
                position: {x:0,y:0},
                className: `${selectedNode === item.id ? 'card' : ''}`,
                style: { 
                    border: '1px solid #bdbdbdff',
                    padding: '0px',
                    backgroundColor: '#ffffff'  
                },
            });
        }else if(item.type === 'queryNode' ){
            // defaultX = isLastNodeAsset ? defaultX : defaultX + nodeSpacingX;
            // isLastNodeAsset = false;
            nodesArray.push({
                id: item.id,
                type: 'queryNode', // 'output' is another default node type
                data: { label: item.name, nodeData:item, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode},
                position: {x:0,y:0},
                style: { borderRadius: '50%', padding: '5px', border:'1px solid #d58813ff' },
            });

            // Create edge object if not the first node
            edgesArray.push({
                id: `e${index-1}-${item.id}`, 
                source: item.source , // The 'id' of the source node
                target: item.id, // The 'id' of the target node
                animated: true,
                style: { stroke: '#555555', strokeWidth: 3 }
            });
            edgesArray.push({
                id: `e${index}-${item.id}`, 
                source:item.id , // The 'id' of the source node
                target: item.target, // The 'id' of the target node
                animated: true,
                style: { stroke: '#2b75d0ff', strokeWidth: 3 }
            });
        }
    }); 
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodesArray,
      edgesArray,
      'LR',
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [selectedNode]);
  
  useEffect(() => {

    const nodesArray:any = [];
    const edgesArray:any = [];
    graphData.map((item:any, index:number) => {
      // Create node object
        if(item.type === 'assetNode' ){
            nodesArray.push({
                id: item.id,
                type: 'lineageNode', // 'output' is another default node type
                data: { label: item.name, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode, nodeData:item, fetchLineageDownStream, fetchLineageUpStream},
                position: {x:0,y:0},
                className: `${selectedNode === item.id ? 'card' : ''}`,
                style: { 
                    border: '1px solid #bdbdbdff',
                    padding: '0px',
                    backgroundColor: '#ffffff'  
                },
            });
        }else if(item.type === 'queryNode' ){
            // defaultX = isLastNodeAsset ? defaultX : defaultX + nodeSpacingX;
            // isLastNodeAsset = false;
            nodesArray.push({
                id: item.id,
                type: 'queryNode', // 'output' is another default node type
                data: { label: item.name, nodeData:item, handleSidePanelToggle, handleQueryPanelToggle, setRefresh, isSidePanelOpen, selectedNode},
                position: {x:0,y:0},
                style: { borderRadius: '50%', padding: '5px', border:'1px solid #d58813ff' },
            });

            // Create edge object if not the first node
            edgesArray.push({
                id: `e${index-1}-${item.id}`, 
                source: item.source , // The 'id' of the source node
                target: item.id, // The 'id' of the target node
                animated: true,
                style: { stroke: '#555555', strokeWidth: 3 }
            });
            edgesArray.push({
                id: `e${index}-${item.id}`, 
                source:item.id , // The 'id' of the source node
                target: item.target, // The 'id' of the target node
                animated: true,
                style: { stroke: '#2b75d0ff', strokeWidth: 3 }
            });
        }
    }); 
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodesArray,
      edgesArray,
      'LR',
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [graphData, refresh]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={()=>{}}
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
