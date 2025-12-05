import { useEffect, useState } from 'react';
import SideNav from './SideNav';
import MainComponent from './MainComponent';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../auth/AuthProvider';
import { useDispatch } from 'react-redux';
import { browseResourcesByAspects } from '../../features/resources/resourcesSlice';
import type { AppDispatch } from '../../app/store';

/**
 * @file BrowseByAnnotation.tsx
 * @summary Orchestrates the "Browse by Aspect" (Annotation) page.
 *
 * @description
 * This component serves as the main controller for the "Browse by Aspect"
 * experience. It renders a `SideNav` and a `MainComponent`.
 *
 * On initialization, it:
 * 1.  Reads the administrator-configured "Browse by Aspect" settings from the
 * `useAuth` context (`user.appConfig.browseByAspectTypes`).
 * 2.  Constructs the initial `dynamicAnnotationsData` state based on this
 * configuration. This data populates the `SideNav` and `MainComponent`.
 * 3.  Displays a `CircularProgress` loader while this initial data is processed.
 * 4.  Displays a "No Aspects" message if no browse-by-aspects are configured
 * in the `appConfig`.
 *
 * It manages the UI state for:
 * -   `selectedItem`: The top-level aspect category clicked by the user.
 * -   `selectedSubItem`: The nested sub-item clicked by the user.
 *
 * When a `selectedItem` is chosen (and no `selectedSubItem` is active), it
 * triggers a `useEffect` to *lazily load* the resource counts for all
 * sub-items under that category. It does this by dispatching the
 * `browseResourcesByAspects` Redux action for each sub-item and updating
 * the state with the results.
 *
 * @param {object} props - This component accepts no props. It derives all
 * state and configuration from React hooks (`useState`, `useEffect`) and
 * context (`useAuth`, `useDispatch`).
 *
 * @returns {JSX.Element} The rendered React component.
 * - If `loader` is true, it returns a `CircularProgress` spinner.
 * - If `loader` is false and no aspects are configured, it returns a
 * "No Aspects" message.
 * - Otherwise, it returns the `SideNav` and `MainComponent` layout.
 */

const BrowseByAnnotation = () => {

  const { user } = useAuth();
  const id_token = user?.token || '';
  const dispatch = useDispatch<AppDispatch>();

  const [loader, setLoader] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<any | null>(null);
  const [dynamicAnnotationsData, setDynamicAnnotationsData] = useState<any>([]);

  useEffect(() => {
    const fetchSubItemCounts = async (item: any) => {
      if (!item || !item.subItems || item.countsFetched) {
        return;
      }

      try {
        console.log(`Fetching fieldValues for ${item.title}...`);
        const promises = item.subItems.map((subItem: any) =>
          dispatch(
            browseResourcesByAspects({
              id_token,
              annotationName: item.title,
              subAnnotationName: subItem.title,
            })
          ).unwrap()
        );

        const results = await Promise.all(promises);

        const updatedSubItems = item.subItems.map((subItem: any, index: number) => ({
          ...subItem,
          fieldValues: results[index]?.results?.totalSize ?? 0,
        }));
        
        setDynamicAnnotationsData((prevData:any) =>
          prevData.map((annotation:any) =>
            annotation.title === item.title
              ? { ...annotation, subItems: updatedSubItems, countsFetched: true }
              : annotation
          )
        );

        setSelectedItem((prevItem: any) => ({ 
            ...prevItem, 
            subItems: updatedSubItems, 
            countsFetched: true 
        }));

      } catch (error) {
        console.error("Failed to fetch sub-item fieldValues:", error);
      }
    };

    if (selectedItem && !selectedSubItem) {
      fetchSubItemCounts(selectedItem);
    }

  }, [selectedItem, selectedSubItem, dispatch, id_token]);

  useEffect(()=> {
    if(user?.appConfig && user?.appConfig?.browseByAspectTypes){
      let fullAspectList = user?.appConfig?.aspects || [];
      let aspectList:any = user?.appConfig?.browseByAspectTypes;
      let generatedData:any[] = [];
      if(!aspectList || Object.keys(aspectList).length === 0){
        console.log('No aspect types configured for browsing.');
        setDynamicAnnotationsData([]);
      }else{
        Object.keys(aspectList).forEach((a:string)=>{
          let aspectInfo = fullAspectList.find((fa:any) => fa.dataplexEntry.name === a);
          let subItems = aspectList[a].map((f:string) => {
            return { title: f, fieldValues: 0, assets: 0 };
          });
          generatedData.push({
            title: aspectInfo?.dataplexEntry.entrySource.displayName || (aspectInfo?.dataplexEntry.name ? aspectInfo.dataplexEntry.name.split('/').pop() : 'Unknown Aspect'),
            fieldValues: subItems.length || 0,
            assets: 0,
            name:a,
            subItems: subItems
          })
        });
        setDynamicAnnotationsData(generatedData);
      }

      setLoader(false);
      
      // setBrowseByAspectType(annotationsData);

      // let q = `name=${n.join('|')}`;

      // axios.post(URLS.API_URL+ URLS.BATCH_ASPECTS, {
      //     entryNames: n
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${id_token}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // ).then(response => {
      //   console.log('name options:', response.data);
      //   setaspectTypeEditOptions(response.data);//.map((aspect:any) => (aspect.entry.entrySource.displayName));
      //   setloading(false);
      // }).catch(error => {
      //   console.error('Error saving configuration:', error);
      // });

    }
  }, []);

  const handleItemClick = (item:any) => {
    setSelectedItem(item);
  };
  const handleSubItemClick = (subItem:any) => {
    setSelectedSubItem(subItem);
  };

  return !loader ? (
    dynamicAnnotationsData.length > 0 ? (
      <Box sx={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#F8FAFD' }}>
        {/* Side Navigation */}
        <SideNav
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          selectedSubItem={selectedSubItem}
          onSubItemClick={handleSubItemClick}
          annotationsData={dynamicAnnotationsData}
        />
        <MainComponent
          selectedCard={selectedItem}
          onItemClick={handleItemClick}
          selectedSubItem={selectedSubItem}
          onSubItemClick={handleSubItemClick}
          annotationsData={dynamicAnnotationsData} 
        />
      </Box>
    ) : (<Box sx={{ display: 'flex', height: '85vh', width: '100%', backgroundColor: '#F8FAFD', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
          <Typography 
            sx={{ 
              margin: 'auto',
              fontSize: '16px',
              fontWeight: 500,
              color: '#575757',
              fontFamily: '"Google Sans Text", sans-serif' 
          }}>
            No Aspects for browse by experience selected
          </Typography>
        </Box>
    )
  ):(<Box sx={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: '#F8FAFD' }}>
      <CircularProgress sx={{ margin: 'auto' }} />
    </Box>
  );
};

export default BrowseByAnnotation;
