import React, { useEffect, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, IconButton, Typography, CircularProgress } from '@mui/material';
import SideDetailsPanel from './SideDetailsPanel';
import QueryPanel from './QueryPanel';
import ListView from './ListView.tsx';
import LineageChartView from './LineageChartView.tsx';
import zoomInIcon from '../../assets/svg/zoomIn.svg';
import zoomOutIcon from '../../assets/svg/zoomOut.svg';
import pipIcon from '../../assets/svg/pip.svg';
//import lineageGraphBg from '../../assets/svg/Lineage Graph.svg';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../auth/AuthProvider.tsx';
import type { AppDispatch } from '../../app/store.ts';
import { fetchLineageSearchLinks } from '../../features/lineage/lineageSlice.ts';
import { fetchLineageEntry } from '../../features/entry/entrySlice.ts';
import { URLS } from '../../constants/urls.ts';
import axios from 'axios';

/**
 * @file index.tsx
 * @description
 * This component is responsible for rendering the data lineage for a specific
 * data entry. It orchestrates fetching lineage data and displaying it in
 * one of two formats: a graph or a list.
 *
 * Key functionalities include:
 * 1.  **View Toggling**: Allows the user to switch between a 'graph' view
 * (`LineageChartView`) and a 'list' view (`ListView`) using a
 * ToggleButtonGroup.
 * 2.  **Data Fetching**:
 * - On mount, it dispatches `fetchLineageSearchLinks` (from `lineageSlice`)
 * to get the upstream and downstream links for the provided `entry`.
 * - It processes this data into a hierarchical structure for the graph
 * and a flat array for the list.
 * 3.  **Interactive Graph Panels**: When in 'graph' view:
 * - Clicking an asset node opens a `SideDetailsPanel`, dispatching
 * `fetchLineageEntry` (from `entrySlice`) to get that node's details.
 * - Clicking a query/process node opens a `QueryPanel`, making an `axios`
 * call to `GET_PROCESS_AND_JOB_DETAILS` to fetch its information.
 * 4.  **State Management**: Manages the state for the current view mode,
 * zoom level, selected node, and the visibility and data for the
 * `SideDetailsPanel` and `QueryPanel`.
 *
 * @param {LineageProps} props - The props for the component.
 * @param {any} props.entry - The central data entry object for which to fetch
 * and display the lineage. The component uses `entry.name` and
 * `entry.fullyQualifiedName` to initiate the data fetches.
 *
 * @returns {React.ReactElement} A React element that renders the lineage
 * visualization. This includes the header with view/zoom controls, the main
 * content area (either graph or list), and conditionally rendered side panels
 * for details.
 */

interface LineageProps {
  entry: any; // entry data
}

const Lineage: React.FC<LineageProps> = ({entry}) => {

  const { user } = useAuth();
  const id_token = user?.token || '';
  const dispatch = useDispatch<AppDispatch>();

  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [graphData, setGraphData] = useState<any|null>(null);
  const [listData, setListData] = useState<any|null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const [sidePanelData, setSidePanelData] = useState<any|null>(null);
  const [sidePanelDataStatus, setSidePanelDataStatus] = useState<string | undefined>('idle');
  const [queryPanelData, setQueryPanelData] = useState<any|null>(null);
  const [queryPanelDataStatus, setQueryPanelDataStatus] = useState<string | undefined>('idle');

  // Select data from the Redux store
  const lineageSearchLinks = useSelector((state: any) => state.lineage.items);
  const lineageSearchLinksStatus = useSelector((state: any) => state.lineage.status);

  const lineageEntry = useSelector((state: any) => state.entry.lineageEntryItems);
  const lineageEntryStatus = useSelector((state: any) => state.entry.lineageEntrystatus);
  //const error = useSelector((state: any) => state.lineage.error);

  useEffect(() => {
    dispatch(fetchLineageSearchLinks({parent : entry.name.split('/').slice(0,4).join("/"), fqn:entry.fullyQualifiedName, id_token: id_token}));   
  }, []);

  useEffect(() => {
    if(lineageEntryStatus === 'loading') {
      setSidePanelData(null);
      setSidePanelDataStatus('loading');
    }else if(lineageEntryStatus === 'succeeded') {
      setSidePanelData(lineageEntry);
      setSidePanelDataStatus('succeeded');
    }else if(lineageEntryStatus === 'failed') {
      setSidePanelData(null);
      setSidePanelDataStatus('failed');
    }   
  }, [lineageEntry, lineageEntryStatus]);

  useEffect(() => {
    if (lineageSearchLinksStatus === 'loading') {
      setGraphData([]);
      setListData([]);
    }
    if (lineageSearchLinksStatus === 'succeeded') {
      let graph:any = [];
      let sourceGraph:any = [];
      let list:any = [];
      let sourceLinks:any = lineageSearchLinks.sourceLinks;
      let targetLinks:any = lineageSearchLinks.targetLinks;
      let count = 0;
      sourceLinks.forEach((link: any) => {
        list.push({
          id: count++,
          sourceSystem: link.source.fullyQualifiedName.split(':')[0],
          sourceProject: link.source.fullyQualifiedName.split(':')[1].split('.')[0],
          source: link.source.fullyQualifiedName.split('.').pop(),
          sourceFQN: link.source.fullyQualifiedName,
          target: link.target.fullyQualifiedName.split('.').pop(),
          targetProject: link.target.fullyQualifiedName.split(':')[1].split('.')[0],
          targetSystem: link.target.fullyQualifiedName.split(':')[0],
          targetFQN: link.target.fullyQualifiedName,
        });
        sourceGraph.push({
          name: `query-${link.target.fullyQualifiedName.split('.').pop()}`,
          linkData:link, 
          type:"queryNode",
          entryData:{},
          isSource:true,
          isRoot:false,
          children:[{
            name: link.target.fullyQualifiedName.split('.').pop(),
            linkData:link,
            entryData:{}, 
            type:"assetNode",
            isSource:true,
            isRoot:false,
            children:[]
          }],
        });
      });
      let data = {
        name: entry.fullyQualifiedName.split('.').pop(),
        linkData:null,
        entryData:entry,
        type:"assetNode",
        isSource:false,
        isRoot:true,
        children:sourceGraph.length > 0 ? sourceGraph : []
      };
      targetLinks.forEach((link: any) => {
        list.push({
          id: count++,
          sourceSystem: link.source.fullyQualifiedName.split(':')[0],
          sourceProject: link.source.fullyQualifiedName.split(':')[1].split('.')[0],
          source: link.source.fullyQualifiedName.split('.').pop(),
          sourceFQN: link.source.fullyQualifiedName,
          target: link.target.fullyQualifiedName.split('.').pop(),
          targetProject: link.target.fullyQualifiedName.split(':')[1].split('.')[0],
          targetSystem: link.target.fullyQualifiedName.split(':')[0],
          targetFQN: link.target.fullyQualifiedName,
        });
        graph.push({
          name: link.source.fullyQualifiedName.split('.').pop(),
          linkData:link, 
          type:"assetNode",
          entryData:{},
          isRoot:false,
          isSource:false,
          children:[{
            name: `query-${entry.fullyQualifiedName.split('.').pop()}`,
            linkData:link, 
            type:"queryNode",
            entryData:{},
            isSource:false,
            isRoot:false,
            children:[data],
          }]
        });
      });

      setGraphData(graph.length > 0 ? 
        (graph.length == 1 ? graph[0] : 
          {name:"Virtual Root", children:graph, type:"assetNode"}
        ) : data);
      setListData(
        list.length > 0 ? 
        list : 
        [{
          id: count++,
          sourceSystem: entry.fullyQualifiedName.split(':')[0],
          sourceProject: entry.fullyQualifiedName.split(':')[1].split('.')[0],
          source: entry.fullyQualifiedName.split('.').pop(),
          sourceFQN: entry.fullyQualifiedName,
          target: "",
          targetProject: "",
          targetSystem: "",
          targetFQN: "",
        }]
      );
      //setGraphData(data)
    }   
  }, [lineageSearchLinksStatus]);

  const handleToggleSidePanel = (data:any) => {
    console.log("node data", data);
    if(data.name === selectedNode && showSidePanel) {
      setShowSidePanel(false);
    }else{
      setShowSidePanel(true);
    }
    // Set selected node when opening side panel
    if (!showSidePanel) {
      setSelectedNode(data.name);
      setShowQueryPanel(false);
    } else {
      setSelectedNode(null);
    }
    let fqn = null;
    if(data?.isRoot === true){
      fqn = data?.entryData?.fullyQualifiedName || null;
    }
    else if(data?.isRoot === false && data?.isSource === true){
      fqn = data?.linkData?.target?.fullyQualifiedName || null;
    }
    else{
      fqn = data?.linkData?.source?.fullyQualifiedName || null;
    }
    if(!fqn) return;

    if(fqn === entry.fullyQualifiedName) {
      setSidePanelData(entry);
      setSidePanelDataStatus('succeeded');
    }else{
      dispatch(fetchLineageEntry({fqn:fqn, id_token: id_token}));
    }
  };

  const handleCloseSidePanel = () => {
    setShowSidePanel(false);
    setSelectedNode(null);
  };

  const handleToggleQueryPanel = async (queryData:any) => {
    console.log("query data", queryData);
    // Close side panel when opening query panel
    if (!showQueryPanel) {
      setQueryPanelDataStatus('loading');
      setShowSidePanel(false);
      setShowQueryPanel(true);
        try{
        const response = await axios.post(`${URLS.API_URL}${URLS.GET_PROCESS_AND_JOB_DETAILS}`, {
            process : queryData?.linkData?.process
          },{
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${id_token}`
            }
          }
        );

        const data = await response.data;
        console.log("query res : ", data);
        console.log("res : ", response);
        if (response.status>= 200 && response.status <= 210) {
          // setQueryPanelData
          setQueryPanelData(data ?? null);
          setQueryPanelDataStatus('succeeded');
        } else {
          setQueryPanelDataStatus('failed');
          throw new Error(data.error || 'Failed to submit access request');
        }
        
      }catch(error){
        console.log(error);
        setQueryPanelDataStatus('failed');
        throw new Error('Failed to submit access request');
      }
    }
    else{
      setShowQueryPanel(false);
    }
  };

  const handleCloseQueryPanel = () => {
    setShowQueryPanel(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 5, 200)); // Max zoom 200%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 5, 25)); // Min zoom 25%
  };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: 'graph' | 'list' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 200px)', 
      display: 'flex', 
      marginTop: '1.25rem', 
      gap: '0.625rem',
      minWidth: 0, // Allow shrinking below content size
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* Left Content Area */}
      <Box sx={{ 
        flex: '1 1 auto', 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0, // Allow shrinking
        overflow: 'hidden',
        // height: '40rem'
      }}>
        {/* Header */}
        <Box sx={{ 
          flex: '0 0 auto',
          padding: '0.5rem 1.25rem', 
          height: "2rem",
          border: '1px solid #e0e0e0',
          borderBottom: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
          minWidth: 0, // Allow shrinking
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            flex: '0 0 auto',
            minWidth: 0
          }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              sx={{
                borderRadius: '4px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                backgroundColor: '#ffffff',
                '& .MuiToggleButton-root': {
                  borderRadius: 0,
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 500,
                  fontFamily: 'Google Sans, sans-serif',
                  lineHeight: '1.252em',
                  minWidth: 'auto',
                  height: 'auto',
                  margin: 0,
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:first-of-type': {
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px',
                    // borderRight: 'none',
                  },
                  '&:last-of-type': {
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    // borderLeft: 'none',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#E7F0FE',
                    color: '#0B57D0',
                    borderColor: '#0B57D0',
                    '&:hover': {
                      backgroundColor: '#E7F0FE',
                    }
                  },
                  '&:not(.Mui-selected)': {
                    backgroundColor: 'transparent',
                    color: '#575757',
                    '&:hover': {
                      backgroundColor: 'rgba(231, 240, 254, 0.5)',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="graph" sx={{ typography: 'heading2Medium' }}>GRAPH</ToggleButton>
              <ToggleButton value="list" sx={{ typography: 'heading2Medium' }}>LIST</ToggleButton>
            </ToggleButtonGroup>
        </Box>
        
        {/* Zoom Controls - Only show in graph mode */}
        {viewMode === 'graph' && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            flex: '0 0 auto',
            minWidth: 0
          }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#575757',
                marginRight: '0.5rem',
                fontStyle: 'Bold',
                flexShrink: 0
              }}
            >
              {zoomLevel}%
            </Typography>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{
                width: '1.75rem',
                height: '1.75rem',
                padding: '0.25rem',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#0B57D0'
                }
              }}
            >
              <img src={zoomOutIcon} alt="Zoom Out" style={{ width: '16px', height: '16px' }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{
                width: '1.75rem',
                height: '1.75rem',
                padding: '0.25rem',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#0B57D0'
                }
              }}
            >
              <img src={zoomInIcon} alt="Zoom In" style={{ width: '16px', height: '16px' }} />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                width: '1.75rem',
                height: '1.75rem',
                padding: '0.25rem',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#0B57D0'
                }
              }}
            >
              <img src={pipIcon} alt="PIP" style={{ width: '16px', height: '16px' }} />
            </IconButton>
          </Box>
        )}
      </Box>

        {/* Main Content Area */}
        <Box sx={{ 
          flex: '1 1 auto', 
          display: 'flex',
          overflow: 'hidden',
          marginTop: 0,
          border: '1px solid #e0e0e0',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          backgroundImage: `radial-gradient(circle, #DADCE0 1px, transparent 1px)`,
          backgroundSize: '7.5px 7.5px', // Doubled density - twice as many dots
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
          minWidth: 0 // Allow shrinking
        }}>
          {/* Content based on view mode */}
          {viewMode === 'graph' ? (
            <Box sx={{ 
              flex: '1 1 auto',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              {/* Lineage Graph Placeholder */}
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                fontSize: '1rem',
                minWidth: 0,
                overflow: 'hidden'
              }}>
                {
                  (lineageSearchLinksStatus === 'succeeded' && graphData) ? (
                    <div id="lineageChartContainer">
                      <LineageChartView graphData={graphData} handleSidePanelToggle={(data:any) => handleToggleSidePanel(data)} handleQueryPanelToggle={(data:any) => handleToggleQueryPanel(data)} zoomLevel={zoomLevel} isSidePanelOpen={showSidePanel} selectedNode={selectedNode}/>
                    </div>
                  ):(
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%'
                    }}>
                      <CircularProgress/>
                    </Box>
                  )
                }
              </Box>
            </Box>
          ) : (
            <ListView listData={listData} entry={entry}/>
          )}
        </Box>
      </Box>

      {/* Right Side Panels */}
      {viewMode === 'graph' && showSidePanel && (
        <Box sx={{ 
          width: { xs: '100%', sm: '23.75rem' }, // Responsive width: full on mobile, 380px on larger screens
          maxWidth: '23.75rem',
          flex: { xs: '1 1 auto', sm: '0 0 23.75rem' },
          display: 'flex',
          flexDirection: 'column',
          borderTopRightRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          // marginBottom: '1rem'
        }}>
          <SideDetailsPanel 
            sidePanelData={sidePanelData}
            sidePanelDataStatus={sidePanelDataStatus}
            onClose={handleCloseSidePanel}
            css={{ 
              height: '100%',
              maxHeight: '100%',
              overflow: 'auto',
            }}
          />
        </Box>
      )}

      {viewMode === 'graph' && showQueryPanel && (
        <Box sx={{ 
          width: { xs: '100%', sm: '23.75rem' }, // Responsive width
          maxWidth: '23.75rem',
          flex: { xs: '1 1 auto', sm: '0 0 23.75rem' },
          display: 'flex',
          flexDirection: 'column',
          borderTopRightRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          <QueryPanel 
            onClose={handleCloseQueryPanel}
            queryPanelData={queryPanelData}
            queryPanelDataStatus={queryPanelDataStatus}
            css={{ 
              height: '100%',
              maxHeight: '100%',
              overflow: 'auto'
            }}
          />
        </Box>
      )}
    </Box>
  );
};
export default Lineage;
