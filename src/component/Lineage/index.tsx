import React, { useEffect, useState } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, CircularProgress, Tooltip } from '@mui/material';
import SideDetailsPanel from './SideDetailsPanel';
import QueryPanel from './QueryPanel';
import ListView from './ListView.tsx';
// import LineageChartView from './LineageChartView.tsx';
// import zoomInIcon from '../../assets/svg/zoomIn.svg';
// import zoomOutIcon from '../../assets/svg/zoomOut.svg';
// import pipIcon from '../../assets/svg/pip.svg';
//import lineageGraphBg from '../../assets/svg/Lineage Graph.svg';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../auth/AuthProvider.tsx';
import type { AppDispatch } from '../../app/store.ts';
import { fetchLineageSearchLinks } from '../../features/lineage/lineageSlice.ts';
import { fetchLineageEntry } from '../../features/entry/entrySlice.ts';
import { URLS } from '../../constants/urls.ts';
import axios, { AxiosError } from 'axios';
import LineageChartViewNew from './LineageChartViewNew.tsx';
import { OpenInFull } from '@mui/icons-material';
import useFullScreenStatus from '../../hooks/useFullScreenStatus';

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

  const { elementRef, isFullscreen, toggleFullscreen } = useFullScreenStatus();

  const [showSidePanel, setShowSidePanel] = useState(false);
  const [openSchemaInSidePanel, setOpenSchemaInSidePanel] = useState(false);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  //const [zoomLevel, setZoomLevel] = useState(100);
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
      let levelCounter = 1;

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
          id: `node-asset-${link.source.fullyQualifiedName.split('.').pop()}${count}`,
          name: link.source.fullyQualifiedName.split('.').pop(),
          fqn: link.source.fullyQualifiedName,
          linkData:link, 
          type:"assetNode",
          entryData:{},
          isRoot:false,
          isSource:false,
          level:0,
          count:levelCounter,
          showUpStreamIcon:false,
          showDownStreamIcon:true,
          isDownStreamFetched:false,
          isUpStreamFetched:true,
        });
        graph.push({
          name: `query-${entry.fullyQualifiedName.split('.').pop()}`,
          linkData:link, 
          source:`node-asset-${link.source.fullyQualifiedName.split('.').pop()}${count}`,
          target:`node-asset-${entry.fullyQualifiedName.split('.').pop()}`,
          id: `node-query-${entry.fullyQualifiedName.split('.').pop()}${count}`,
          type:"queryNode",
          entryData:{},
          isSource:false,
          isRoot:false,
          level:1,
          count:levelCounter,
        });
        levelCounter += 1;
      });

      let data = {
        id: `node-asset-${entry.fullyQualifiedName.split('.').pop()}`,
        name: entry.fullyQualifiedName.split('.').pop(),
        fqn: entry.fullyQualifiedName,
        linkData:null,
        entryData:entry,
        type:"assetNode",
        isSource:false,
        isRoot:true,
        level:2,
        count:1,
        showUpStreamIcon:true,
        showDownStreamIcon:true,
        isDownStreamFetched:true,
        isUpStreamFetched:true,
      };

      // Reset level counter for source links to start from 1 again so the graph of source links is balanced
      levelCounter=1;

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
          id: `node-query-${link.target.fullyQualifiedName.split('.').pop()}${count}`,
          name: `query-${link.target.fullyQualifiedName.split('.').pop()}`,
          source:`node-asset-${entry.fullyQualifiedName.split('.').pop()}`,
          target:`node-asset-${link.target.fullyQualifiedName.split('.').pop()}${count}`,
          linkData:link, 
          type:"queryNode",
          entryData:{},
          isSource:true,
          isRoot:false,
          level:3,
          count:levelCounter,
        });
        sourceGraph.push({
          id: `node-asset-${link.target.fullyQualifiedName.split('.').pop()}${count}`,
          name: link.target.fullyQualifiedName.split('.').pop(),
          fqn: link.target.fullyQualifiedName,
          linkData:link,
          entryData:{}, 
          type:"assetNode",
          isSource:true,
          isRoot:false,
          children:[],
          level:4,
          count:levelCounter,
          showUpStreamIcon:true,
          showDownStreamIcon:false,
          isDownStreamFetched:true,
          isUpStreamFetched:false,
        });
        levelCounter += 1;
      });
      

      graph = [...graph, ...[data], ...sourceGraph];

      setGraphData(graph);
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

  const handleToggleSidePanel = (data:any, showSchema:boolean = false) => {
    console.log("node data", data);
    if(data.id === selectedNode && showSidePanel) {
      setShowSidePanel(false);
    }else{
      setShowSidePanel(true);
    }
    setSelectedNode(data.id);
    // Set selected node when opening side panel
    if (!showSidePanel) {
      setShowQueryPanel(false);
    }
    setOpenSchemaInSidePanel(showSchema);
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

  // const handleZoomIn = () => {
  //   setZoomLevel(prev => Math.min(prev + 5, 200)); // Max zoom 200%
  // };

  // const handleZoomOut = () => {
  //   setZoomLevel(prev => Math.max(prev - 5, 25)); // Min zoom 25%
  // };

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newViewMode: 'graph' | 'list' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const fetchLineageDownStream = async (nodeData:any) => {
    console.log("Fetch Downstream for node:", nodeData);
    // Implement downstream fetching logic here
    let graph:any = [];
    let gData = graphData;
    setSelectedNode(nodeData.id);
    try {
      // search from your API endpoint 
      axios.defaults.headers.common['Authorization'] = id_token ? `Bearer ${id_token}` : '';
      let parent = nodeData.linkData.name.split('/').slice(0,4).join("/");
      let fqn = nodeData.fqn;
      
      const response = await axios.post(URLS.API_URL + URLS.LINEAGE_SEARCH, {
        parent: parent,
        fqn:fqn
      });
      const data = await response.data;
      console.log(data.targetLinks);
      const index = gData.findIndex((obj:any) => obj.id === nodeData.id);

      if (index !== -1) {
        gData[index].isUpStreamFetched = true; // Directly modify the property
      }

      if(data.targetLinks.length === 0){
        if(index !== -1) {gData[index].showDownStreamIcon = false;}
        setGraphData(gData);
        return;
      }
      let levelCounter = nodeData.level;

      data.targetLinks.forEach((link: any, index:number) => {
        let n_id = link.source.fullyQualifiedName === nodeData.fqn ? link.source.fullyQualifiedName + 'n1' : link.source.fullyQualifiedName;
        graph.push({
          id: `node-asset-${n_id}-downstream-${index}`,
          name: link.source.fullyQualifiedName.split('.').pop(),
          fqn: link.source.fullyQualifiedName,
          linkData:link,
          type:"assetNode",
          entryData:{},
          isRoot:false,
          isSource:false,
          level:levelCounter - 2,
          count:index+1,
          showUpStreamIcon:false,
          showDownStreamIcon:link.source.fullyQualifiedName === nodeData.fqn ? false : true,
          isDownStreamFetched:false,
          isUpStreamFetched:true,
        });
        graph.push({
          name: `node-query-${n_id}-downstream-${index}`,
          linkData:link,
          source:`node-asset-${n_id}-downstream-${index}`,
          target:nodeData.id,
          id: `node-query-${n_id}-downstream-${index}`,
          type:"queryNode",
          entryData:{},
          isSource:false,
          isRoot:false,
          level:levelCounter - 1,
          count:index+1,
        });
      });

      graph = [...graph, ...gData];
      setGraphData(graph);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data || error.message);
      }
      console.log('An unknown error occurred');
    }
  };

  const fetchLineageUpStream = async (nodeData:any) => {
    console.log("Fetch Upstream for node:", nodeData);
    // Implement upstream fetching logic here
    let graph:any = [];
    let gData = graphData;
    setSelectedNode(nodeData.id);
    try {
      // search from your API endpoint 
      axios.defaults.headers.common['Authorization'] = id_token ? `Bearer ${id_token}` : '';
      let parent = nodeData.linkData.name.split('/').slice(0,4).join("/");
      let fqn = nodeData.fqn;
      
      const response = await axios.post(URLS.API_URL + URLS.LINEAGE_SEARCH, {
        parent: parent,
        fqn:fqn
      });
      const data = await response.data;
      console.log(data.sourceLinks);
      const index = gData.findIndex((obj:any) => obj.id === nodeData.id);

      if (index !== -1) {
        gData[index].isUpStreamFetched = true; // Directly modify the property
      }
      if(data.sourceLinks.length === 0){
        if(index !== -1) {gData[index].showUpStreamIcon = false;}
        setGraphData(gData);
        return;
      }
      let levelCounter = nodeData.level;

      data.sourceLinks.forEach((link: any, index:number) => {
        let n_id = link.target.fullyQualifiedName === nodeData.fqn ? link.target.fullyQualifiedName+ 'n1' : link.target.fullyQualifiedName;
        graph.push({
          name: `node-query-${n_id}-upstream-${index}`,
          linkData:link,
          source:nodeData.id,
          target:`node-asset-${n_id}-upstream-${index}`,
          id: `node-query-${n_id}-upstream-${index}`,
          type:"queryNode",
          entryData:{},
          isSource:false,
          isRoot:false,
          level:levelCounter + 1,
          count:index+1,
        });
        graph.push({
          id: `node-asset-${n_id}-upstream-${index}`,
          name: link.target.fullyQualifiedName.split('.').pop(),
          fqn: link.target.fullyQualifiedName,
          linkData:link,
          type:"assetNode",
          entryData:{},
          isRoot:false,
          isSource:false,
          level:levelCounter + 2,
          count:index+1,
          showUpStreamIcon:link.target.fullyQualifiedName === nodeData.fqn ? false : true,
          showDownStreamIcon:false,
          isDownStreamFetched:true,
          isUpStreamFetched:false,
        });
      });

      graph = [...gData, ...graph];
      setGraphData(graph);

    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data || error.message);
      }
      console.log('An unknown error occurred');
    }
  };

  return (
    <Box>
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
        
        
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            flex: '0 0 auto',
            minWidth: 0
          }}>
            <Tooltip title={"View Fullscreen"}>
            <OpenInFull sx={{ 
                fontSize: '1.25rem', 
                color: '#575757', 
                cursor: 'pointer', 
                backgroundColor: '#F5F5F5',
                borderRadius: '4px',
                padding: '0.125rem',
              }}
              onClick={toggleFullscreen}
            />
            </Tooltip>
          </Box>
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
          // backgroundImage: `radial-gradient(circle, #DADCE0 1px, transparent 1px)`,
          // backgroundSize: '7.5px 7.5px', // Doubled density - twice as many dots
          // backgroundPosition: '0 0',
          // backgroundRepeat: 'repeat',
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
                    <div id="lineageChartContainer" ref={elementRef} style={{
                        minHeight: "calc(100vh - 220px)",
                        // Fullscreen style: take up the entire viewport
                        ...(isFullscreen && {
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100vw', // 100% of viewport width
                          height: '100vh', // 100% of viewport height
                          minHeight:'100vh',
                          zIndex: 9999,
                          backgroundColor: '#fff',
                        })
                      }}>
                      {/* <LineageChartView graphData={graphData} handleSidePanelToggle={(data:any) => handleToggleSidePanel(data)} handleQueryPanelToggle={(data:any) => handleToggleQueryPanel(data)} zoomLevel={zoomLevel} isSidePanelOpen={showSidePanel} selectedNode={selectedNode}/> */}
                      <LineageChartViewNew 
                        graphData={graphData} 
                        handleSidePanelToggle={(data:any, showSchema:boolean) => handleToggleSidePanel(data, showSchema)} 
                        handleQueryPanelToggle={(data:any) => handleToggleQueryPanel(data)} 
                        fetchLineageDownStream={(nodeData:any) => fetchLineageDownStream(nodeData)} 
                        fetchLineageUpStream={(nodeData:any) => fetchLineageUpStream(nodeData)}  
                        isSidePanelOpen={showSidePanel} 
                        selectedNode={selectedNode} 
                        isFullScreen={isFullscreen} 
                        toggleFullScreen={toggleFullscreen}
                      /> 
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
            openSchemaInSidePanel={openSchemaInSidePanel}
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
    </Box>
  );
};
export default Lineage;
