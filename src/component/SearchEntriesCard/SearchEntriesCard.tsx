import {Box, Tooltip, Typography} from '@mui/material';
import React, { useEffect, useState } from 'react';
import Tag from '../Tags/Tag';
import { AccessTime, LocationOnOutlined } from '@mui/icons-material';
import './SearchEntriesCard.css';
import { type SxProps, type Theme } from '@mui/material/styles';
import DatabaseIcon from '../../assets/svg/database_icon.svg';
import BucketIcon from '../../assets/svg/bucket_icon.svg';
import ClusterIcon from '../../assets/svg/cluster_icon.svg';
import CodeAssetIcon from '../../assets/svg/code_asset_icon.svg';
import ConnectionIcon from '../../assets/svg/connection_icon.svg';
import DashboardIcon from '../../assets/svg/dashboard_icon.svg';
import DashboardElementIcon from '../../assets/svg/dashboard_element_icon.svg';
import DataExchangeIcon from '../../assets/svg/data_exchange_icon.svg';
import DataStreamIcon from '../../assets/svg/data_stream_icon.svg';
import DatabaseSchemaIcon from '../../assets/svg/database_schema_icon.svg';
import DatasetIcon from '../../assets/svg/dataset_icon.svg';
import ExploreIcon from '../../assets/svg/explore_icon.svg';
import FeatureGroupIcon from '../../assets/svg/feature_group_icon.svg';
import FeatureOnlineStoreIcon from '../../assets/svg/feature_online_store_icon.svg';
import ViewIcon from '../../assets/svg/view_icon.svg';
import FilesetIcon from '../../assets/svg/fileset_icon.svg';
import FolderIcon from '../../assets/svg/folder_icon.svg';
import FunctionIcon from '../../assets/svg/function_icon.svg';
import GlossaryIcon from '../../assets/svg/glossary_icon.svg';
import GlossaryCategoryIcon from '../../assets/svg/glossary_category_icon.svg';
import ListingIcon from '../../assets/svg/listing_icon.svg';
import LookIcon from '../../assets/svg/look_icon.svg';
import ModelIcon from '../../assets/svg/model_icon.svg';
import RepositoriesIcon from '../../assets/svg/repositories_icon.svg';
import GenericIcon from '../../assets/svg/generic_icon.svg';
import SchedulerIcon from '../../assets/svg/scheduler_icon.svg';
import TableIcon from '../../assets/svg/table_icon.svg';

/**
 * @file SearchEntriesCard.tsx
 * @description
 * This component renders a single card (row) for displaying a data entry in a
 * search results list.
 *
 * It visualizes key metadata from the `entry` prop, including:
 * 1.  **Icon**: A product-specific icon (e.g., BigQuery, Dataplex) derived
 * from the entry's system name.
 * 2.  **Name**: The display name of the entry.
 * 3.  **Tags**: `Tag` components for the system (e.g., "BigQuery") and the
 * entry type (e.g., "Table").
 * 4.  **Metadata**: The last modified date and the asset's location.
 * 5.  **Description**: A truncated (2-line) description of the entry.
 *
 * The component supports visual selection (`isSelected`), a double-click
 * action (`onDoubleClick`), and various props to control its hover effects
 * and border styling.
 *
 * @param {SearchEntriesCardProps} props - The props for the component.
 * @param {any} props.entry - The data entry object containing all the
 * metadata to be displayed.
 * @param {SxProps<Theme>} [props.sx] - (Optional) Material-UI SX props to
 * apply custom styling to the root `Box` container.
 * @param {boolean} [props.isSelected=false] - (Optional) If true, the card
 * is rendered with a selected (blue) background.
 * @param {(entry: any) => void} [props.onDoubleClick] - (Optional) A callback
 * function that is triggered when the card is double-clicked.
 * @param {boolean} [props.disableHoverEffect=false] - (Optional) If true,
 * the default "lift" on hover is disabled.
 * @param {boolean} [props.hideTopBorderOnHover=false] - (Optional) If true,
 * the top border rule on hover is suppressed.
 * @param {number} [props.index] - (Optional) The index of the card in the
 * list, used to suppress the top border for the first item (index 0).
 *
 * @returns {React.ReactElement} A React element representing the search entry card.
 */

// import { useFavorite } from '../../hooks/useFavorite';
interface SearchEntriesCardProps {
  // handleClick: any | (() => void); // Function to handle search, can be any function type
  entry: any; // text to be displayed on the button
  sx?: SxProps<Theme>; // Optional CSS properties for the button
  isSelected?: boolean; // Whether this card is currently selected
  onDoubleClick?: (entry: any) => void; // Function to handle double-click
  disableHoverEffect?: boolean;
  hideTopBorderOnHover?: boolean;
  index?: number;
}

// const getProductIcon = (productName: string) => {
//   switch (productName) {
//     case 'ANALYTICS_HUB':
//       return AnalyticsHubIcon;
//     case 'BIGQUERY':
//       return BigQueryIcon;
//     case 'CLOUD_BIGTABLE':
//       return CloudBigTableIcon;
//     case 'CLOUD_PUBSUB':
//       return CloudPubSubIcon;
//     case 'CLOUD_SPANNER':
//       return CloudSpannerIcon;
//     case 'CLOUD_STORAGE':
//       return CloudStorageIcon;
//     case 'CLOUD_SQL':
//       return CloudSQLIcon;
//     case 'DATAFORM':
//       return DataformIcon;
//     case 'DATAPLEX':
//       return DataplexIcon;
//     case 'DATAPLEX_UNIVERSAL_CATALOG':
//       return DataplexIcon;
//     case 'DATAPROC_METASTORE':
//       return DataprocIcon;
//     case 'VERTEX_AI':
//       return VertexIcon;
//     default:
//       return OthersIcon;
//   }
// };

const getAssetIcon = (assetName: string) => {
  switch (assetName) {
    case 'Bucket':
      return BucketIcon;
    case 'Cluster':
      return ClusterIcon;
    case 'Code asset':
      return CodeAssetIcon;
    case 'Connection':
      return ConnectionIcon;
    case 'Dashboard':
      return DashboardIcon;
    case 'Dashboard element':
      return DashboardElementIcon;
    case 'Data exchange':
      return DataExchangeIcon;
    case 'Data source connection':
      return ConnectionIcon;
    case 'Data stream':
      return DataStreamIcon;
    case 'Database':
      return DatabaseIcon;
    case 'Database schema':
      return DatabaseSchemaIcon;
    case 'Dataset':
      return DatasetIcon;
    case 'Explore':
      return ExploreIcon;
    case 'Feature group':
      return FeatureGroupIcon;
    case 'Feature online store':
      return FeatureOnlineStoreIcon;
    case 'Feature view':
      return ViewIcon;
    case 'Fileset':
      return FilesetIcon;
    case 'Folder':
      return FolderIcon;
    case 'Function':
      return FunctionIcon;
    case 'Glossary':
      return GlossaryIcon;
    case 'Glossary Category':
      return GlossaryCategoryIcon;
    case 'Glossary Term':
      return GlossaryIcon;
    case 'Listing':
      return ListingIcon;
    case 'Look':
      return LookIcon;
    case 'Model':
      return ModelIcon;
    case 'Repository':
      return RepositoriesIcon;
    case 'View':
      return ViewIcon;
    case 'Resource':
      return GenericIcon;
    case 'Routine':
      return SchedulerIcon;
    case 'Table':
      return TableIcon;
    default:
      return GenericIcon;
  }
};
const SearchEntriesCard: React.FC<SearchEntriesCardProps> = ({ entry, sx, isSelected = false, onDoubleClick, disableHoverEffect = false, hideTopBorderOnHover = false, index}) => {
  const entryData = entry;//useState<any>(entry);
  //const [parentName, setParentName] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [entryType, setEntryType] = useState<string>('');
  const [modifiedDate, setModifiedDate] = useState<string>('');
  const [systemName, setSystemName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Use shared favorite state
  // const { isFavorite, toggleFavorite } = useFavorite(entry.name);
  //const [avatarColors, setAvatarColors] = useState<{bg: string, text: string}>({bg: '#E3F2FD', text: '#1976D2'});

  // Function to generate random theme colors
  // const generateRandomColors = () => {
  //   const themeColors = [
  //     { bg: '#E3F2FD', text: '#1976D2' }, // Blue theme
  //     { bg: '#E8F5E8', text: '#388E3C' }, // Green theme
  //     { bg: '#FFF3E0', text: '#F57C00' }, // Orange theme
  //     { bg: '#F3E5F5', text: '#7B1FA2' }, // Purple theme
  //     { bg: '#FCE4EC', text: '#C2185B' }, // Pink theme
  //     { bg: '#E0F2F1', text: '#00796B' }, // Teal theme
  //     { bg: '#FFF8E1', text: '#F9A825' }, // Amber theme
  //     { bg: '#FFEBEE', text: '#D32F2F' }, // Red theme
  //     { bg: '#E1F5FE', text: '#0288D1' }, // Light Blue theme
  //     { bg: '#F1F8E9', text: '#689F38' }, // Light Green theme
  //     { bg: '#FFF2CC', text: '#F57F17' }, // Yellow theme
  //     { bg: '#EFEBE9', text: '#5D4037' }, // Brown theme
  //   ];
    
  //   const randomIndex = Math.floor(Math.random() * themeColors.length);
  //   return themeColors[randomIndex];
  // };


//   const getNames = (namePath: string = '' , separator: string = '' ) => {
//     const segments: string[] = namePath.split(separator);
//     //let eType = segments[segments.length - 2];
//     return segments[segments.length - 1];
//     //setParentName(segments[segments.length - 3] !== import.meta.env.VITE_GCP_PROJECT_ID ? segments[segments.length - 3] : '');
//   };

  // const handleFavoriteClick = (event: React.MouseEvent) => {
  //   event.stopPropagation(); // Prevent triggering the parent onClick
  //   const newStatus = toggleFavorite();
  //   console.log('Favorite toggled for:', name, 'New state:', newStatus);
  // };
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  useEffect(() => {
    // getNames(entry.name, '/');
    // setName(entry.entrySource.displayName.length > 0 ? entry.entrySource.displayName : getNames(entry.name || '', '/'));
    let calculatedName = '';
    if (entry.entrySource.displayName && entry.entrySource.displayName.length > 0) {
      calculatedName = entry.entrySource.displayName;
    } else if (entry.name) {
      const segments = entry.name.split('/');
      calculatedName = segments[segments.length - 1];
    }
    setName(calculatedName);
    setSystemName(entry.entrySource.system);
    setEntryType(entry.entryType.split('-').length > 1 ? entry.entryType.split('-').pop() : entry.name.split('/').at(-2).charAt(0).toUpperCase() + entry.name.split('/').at(-2).slice(1));
    const myDate = (typeof entry.updateTime !== 'string') ? new Date(entry.updateTime.seconds * 1000) : new Date(entry.updateTime);
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: "short" , day: "numeric", year: "numeric" }).format(myDate);
    setModifiedDate(formattedDate);
    setDescription(entry.entrySource.description ?? '');
    
    // Generate random avatar colors for this card
    //setAvatarColors(generateRandomColors());
  }, [entry]);

  return (
    <>
      <Box sx={{ 
        flex: '1 1 auto',
        minWidth: 0, // Allow shrinking below content size
        ...sx,
        paddingTop: isSelected ? '1px' : '0px',
        paddingBottom: isSelected ? '2px' : '0px',
        ...(!disableHoverEffect && {
          '&:hover': {
            marginTop: '-1px',
            paddingTop: '1px',
          }
        })
      }}>
        <Box 
          onDoubleClick={() => onDoubleClick?.(entry)}
          sx={{
            padding: "1.25rem 0.5rem 1.25rem 0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: '0.75rem',
            marginRight: '1.25rem',
            backgroundColor: isSelected ? '#EDF2FC' : 'transparent',
            borderRadius: isSelected ? "0.625rem" : 0,
            paddingTop: 'calc(1.25rem + 1px)',
            '&:hover': {
              borderBottomColor: 'transparent',
              paddingTop: 'calc(1.25rem + 1px)',
              '&::before': {
                backgroundColor: 'transparent',
              },
              '&::after': {
                backgroundColor: 'transparent',
              }
            },
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '97.5%',
              height: '1px',
              backgroundColor: (isSelected || disableHoverEffect || index === 0 || hideTopBorderOnHover) ? 'transparent' : '#DADCE0',
            },
          }}
          className="entriesHoverEffect"
          
          >
          <div style={{
            width: "100%",
            flex: '1 1 auto',
            minWidth: 0, // Allow content to shrink
            marginLeft: '0.5rem'
          }}>
            <div style={{
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              flex: '1 1 auto',
              minWidth: 0
            }}>
              <div style={{
                display: "flex", 
                alignItems: "center", 
                flex: '1 1 auto',
                minWidth: 0, // Allow content to shrink and wrap
                gap: '0.75rem' // Uniform spacing between title, tags, dates, location
              }}>
                {getAssetIcon(capitalizeFirstLetter(entryType)) && (
                        <img 
                          src={getAssetIcon(capitalizeFirstLetter(entryType))!} 
                          alt={capitalizeFirstLetter(entryType)} 
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            flex: '0 0 auto'
                          }}
                />)}
                <Tooltip title={name} arrow placement='top'>
                <Typography component="span" 
                variant="heading2Medium"
                sx={{ 
                  color: "#0B57D0", 
                  fontSize: "1.125rem", 
                  fontWeight: 400,
                  flex: '0 1 auto', // Allow shrinking but don't grow
                  minWidth: 0, // Allow text truncation
                  overflow: 'hidden',
                  maxWidth: '300px',
                  textOverflow: 'ellipsis',
                  // textTransform:'capitalize',
                  whiteSpace: 'nowrap'
                }}>
                  {name}
                </Typography>
                </Tooltip>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Tag text={(() => {
                    return systemName.toLowerCase() === 'bigquery' ? 'BigQuery' : systemName.replace("_", " ").replace("-", " ").toLowerCase();
                  })()} css={{
                    fontFamily: '"Google Sans Text", sans-serif',
                    color: '#004A77',
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem 0.5rem",
                    fontWeight: 500,
                    borderRadius: '8px',
                    textTransform:"capitalize",
                    flexShrink: 0 // Prevent tag from shrinking
                  }}/>
                  <Tag text={entryType} css={{
                    fontFamily: '"Google Sans Text", sans-serif',
                    color: '#004A77',
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.25rem 0.5rem",
                    fontWeight: 500,
                    borderRadius: '8px',
                    textTransform:'capitalize',
                    flexShrink: 0 // Prevent tag from shrinking
                  }}/>
                </div>
                <Tooltip title={`Last Modified at ${modifiedDate}`} arrow placement='top'>
                <span style={{ 
                  color: "#575757", 
                  fontSize: "0.875rem", 
                  fontWeight: 500, 
                  display: "flex", 
                  alignItems: "center",
                  flex: '0 0 auto', // Fixed size, don't grow or shrink
                  gap: '0.25rem'
                }}>
                  <AccessTime style={{fontSize: 14}}/>
                  <span>{modifiedDate}</span>
                </span>
                </Tooltip>
                <Tooltip title={`Location - ${entryData.entrySource.location}`} arrow placement='top'>
                <span style={{ 
                  color: "#575757", 
                  fontSize: "0.875rem", 
                  fontWeight: 500, 
                  display: "flex", 
                  alignItems: "center",
                  flex: '0 1 auto', // Allow shrinking for location text
                  gap: '0.125rem',
                  minWidth: 0
                }}>
                  <LocationOnOutlined style={{fontSize: 14, flexShrink: 0}}/>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {entryData.entrySource.location}
                  </span>
                </span>
                </Tooltip>
                <span style={{ 
                  color: "#575757", 
                  fontSize: "0.875rem", 
                  fontWeight: 500, 
                  display: "flex", 
                  alignItems: "center",
                  flex: '0 1 auto', // Allow shrinking for owner email
                  gap: '0.25rem',
                  minWidth: 0
                }}>
                  {/* <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '50%',
                    backgroundColor: avatarColors.bg || '#E3F2FD', // Fallback color
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: avatarColors.text || '#1976D2', // Fallback color
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    flexShrink: 0
                  }}>
                    R
                  </div>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    romansmith@acme.com
                  </span> */}
                </span>
              </div>
              <div style={{
                display: "flex", 
                alignItems: "center",
                flex: '0 0 auto' // Fixed size for favorite button
              }}>
                {/* <svg 
                    width="1.25rem" 
                    height="1.25rem" 
                    viewBox="0 0 18 18" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        cursor: "pointer",
                        flexShrink: 0 // Prevent icon from shrinking
                    }}
                    onClick={handleFavoriteClick}
                >
                   {isFavorite ? (
                        // Filled star when favorited
                        <path 
                            d="M9 1.5L11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5Z" 
                            fill="#F4B400"
                        />
                    ) : (
                        // Outlined star when not favorited
                        <path 
                            fillRule="evenodd" 
                            clipRule="evenodd" 
                            d="M11.1075 6.465L16.5 6.93L12.4125 10.4775L13.635 15.75L9 12.9525L4.365 15.75L5.595 10.4775L1.5 6.93L6.8925 6.4725L9 1.5L11.1075 6.465ZM6.18 13.2525L9 11.55L11.8275 13.26L11.0775 10.05L13.5675 7.89L10.2825 7.605L9 4.575L7.725 7.5975L4.44 7.8825L6.93 10.0425L6.18 13.2525Z" 
                            fill="#575757"
                            opacity="0.4"
                        />
                    )}
                </svg> */}
              </div>
            </div>
            <div style={{
              flex: '1 1 auto',
              minWidth: 0 // Allow content to shrink
            }}>
              {/* <label>Parent : {parentName} </label><br/> */}
              <p style={{
                padding: 0, 
                margin: 0,
                marginTop: "0.3125rem",
                fontSize: "0.875rem",
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontWeight: 400
              }}>
                {description.length > 0 ? description : "No Description Available"}
              </p>
            </div>
          </div>
        </Box>
      </Box>
    </>
  )
};
export default SearchEntriesCard;