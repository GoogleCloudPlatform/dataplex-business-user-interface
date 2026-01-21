import React, { useState, useEffect} from 'react';
import { 
  Box, Typography, Paper, Grid, 
  Tooltip, Menu, MenuItem,
  TextField,
  Skeleton
} from '@mui/material';

import { 
  Search, AccessTime,
  KeyboardArrowDown,
  LocationOnOutlined
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';
import { fetchDataProductsList, getDataProductDetails } from '../../features/dataProducts/dataProductsSlice';
import { GridFilterListIcon } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import Tag from '../Tags/Tag';
import axios from 'axios';
import { getMimeType } from '../../utils/resourceUtils';

const DataProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { dataProductsItems, status } = useSelector((state: any) => state.dataProducts);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [dataProductsList, setDataProductsList] = useState<any>([]);
  const [searchLoader, setSearchLoader] = useState(false);



  useEffect(() => {
    if (dataProductsItems.length === 0 && status === 'idle' && user?.token) {
       dispatch(fetchDataProductsList({ id_token: user?.token }));
    }
    if(status=== 'succeeded'){
        localStorage.removeItem('selectedDataProduct');
        setDataProductsList(dataProductsItems);
    }
  }, [dispatch, dataProductsItems.length, status, user?.token]);

  //sorting handlers
  const handleSortMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };
  
  const handleSortOptionSelect = (option: 'name' | 'lastModified') => {
    setSortBy(option);
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
    setDataProductsList(sortItems(dataProductsList));
    handleSortMenuClose();
  };

  const sortItems = (items: any[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') {
          const nameA = a.displayName.toLowerCase();
          const nameB = b.displayName.toLowerCase();
          if (sortOrder === 'asc') return nameA.localeCompare(nameB);
          return nameB.localeCompare(nameA);
      } else {
          // Last Modified (Number)
          const dateA = a.updateTime || 0;
          const dateB = b.updateTime || 0;
          if (sortOrder === 'asc') return dateA - dateB; // Oldest first
          return dateB - dateA; // Newest first
      }
    });
  };

  useEffect(() => {
    if (dataProductsItems.length > 0 && searchTerm.length > 0) {
    //   setDataProductsList(sortItems(
    //     dataProductsItems.filter((item:any) => {
    //         // The includes() method is case-sensitive. Use .toLowerCase() for case-insensitive search.
    //         return item.displayName.toLowerCase().includes(searchTerm);
    //     })
    //   ));
        setSearchLoader(true);
      axios.post(
        `https://dataplex.googleapis.com/v1/projects/${import.meta.env.VITE_GOOGLE_PROJECT_ID}/locations/global:searchEntries`,
            {
                query: `${searchTerm} AND (type="data_product")`,
            },
            {
                headers: {
                Authorization: `Bearer ${user?.token}`,
                'Content-Type': 'application/json',
                },
            }
        ).then((response:any) => {
            console.log(response.data);
            const array2 = response?.data?.results || [];
            console.log("data products search results:", array2);
            console.log("data products items:", dataProductsItems);
            //setDataProductsAssetsList(response?.data?.result || []);
            const items = dataProductsItems.filter((obj1:any) => array2.some((obj2:any) => obj1.name.split('/').slice(2).join('/') === obj2.dataplexEntry?.entrySource?.resource.split('/').slice(2).join('/')));
            console.log("filtered items based on search:", items);
            setDataProductsList(items);
            setSearchLoader(false);
        }).catch((error:any) => {
            console.error('Error fetching data product assets details:', error);
        });
    }
    if (searchTerm.length === 0) {
        setTimeout(() => {
            setSearchLoader(false);
            setDataProductsList(dataProductsItems);
        }, 1000);
    }
  }, [searchTerm]);






  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'flex-start', 
      px: 3,
      pb: 3,
      pt: '8px',
      backgroundColor: '#F8FAFD', 
      height: 'calc(100vh - 64px)',
      width: '100%',
      overflow: 'hidden'
    }}>
      <Paper 
        elevation={0} 
        sx={{ 
          flex: 1,
          height: 'calc(100vh - 110px)',
          borderRadius: '24px', 
          backgroundColor: '#fff', 
          border: 'transparent',
          display: 'flex', 
          flexDirection: 'column', 
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <Box 
        >
            <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', top: '20px', left: '20px' }}>
                <Typography variant="h5" sx={{ fontFamily: '"Google Sans", sans-serif', fontWeight: 400, fontSize: '24px', lineHeight: '24px', color: '#1F1F1F' }}>
                    Data Products
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.1, position: 'relative', top: '40px', left: '20px' }}>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Search data products"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '54px',
                            height: '32px',
                            fontFamily: 'Google Sans Text',
                            fontSize: '12px',
                            fontWeight: 500,
                            letterSpacing: '0.1px',
                            marginRight: '10px',
                            color: '#5E5E5E',
                            '& fieldset': { borderColor: '#DADCE0' },
                            '&:hover fieldset': { borderColor: '#A8A8A8' },
                            '&.Mui-focused fieldset': { borderColor: '#0E4DCA', borderWidth: '1.5px' },
                        },
                        width: '350px',
                        '& .MuiInputBase-input': {
                            padding: '6px 12px',
                            '&::placeholder': {
                                color: '#5E5E5E',
                                opacity: 1,
                            },
                        },
                        boxShadow: 'none',
                    }}
                    InputProps={{
                        startAdornment: <Search sx={{ color: '#575757', fontSize: 20, mr: 1 }} />,
                    }}
                />

                {/* Sort Menu */}
                <>
                    <GridFilterListIcon />
                    <Typography component="span" style={{ margin: "0px 5px", fontSize: "12px", fontWeight: "500" }}>
                        Sort by:
                    </Typography>
                    <Typography 
                    component="span" 
                    style={{ 
                        margin: "0px 5px", 
                        fontSize: "12px", 
                        fontWeight: "500", 
                        display: "flex", 
                        alignItems: "center",
                        cursor: "pointer",
                        color: "#1F1F1F"
                    }}
                    onClick={handleSortMenuClick}
                    >
                        {sortBy === 'name' ? 'Name' : 'Last Modified'} 
                        <KeyboardArrowDown style={{ marginLeft: "2px" }} />
                    </Typography>
                </>

                <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={() => {console.log("closing")}}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                    }}
                    PaperProps={{
                        style: {
                            marginTop: '4px',
                            borderRadius: '8px',
                            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            minWidth: '140px'
                        }
                    }}
                >
                    <MenuItem 
                    onClick={() =>{handleSortOptionSelect('name')}}
                    style={{
                        fontSize: '12px',
                        fontWeight: sortBy === 'name' ? '500' : '400',
                        color: sortBy === 'name' ? '#0B57D0' : '#1F1F1F',
                        backgroundColor: sortBy === 'name' ? '#F8FAFD' : 'transparent'
                    }}
                    >
                    Name
                    </MenuItem>
                    <MenuItem 
                    onClick={() => {handleSortOptionSelect('lastModified')}}
                    style={{
                        fontSize: '12px',
                        fontWeight: sortBy === 'lastModified' ? '500' : '400',
                        color: sortBy === 'lastModified' ? '#0B57D0' : '#1F1F1F',
                        backgroundColor: sortBy === 'lastModified' ? '#F8FAFD' : 'transparent'
                    }}
                    >
                    Last Modified
                    </MenuItem>
                </Menu>
                

            </Box>
            <Box sx={{ flexGrow: 1, padding: 2,  position: 'relative', top: '40px', overflowY: 'auto' }}>
                {/* Grid container with spacing between items */}
                <Grid container spacing={4}>
                    {
                        (status === 'loading' || searchLoader) &&
                            Array.from(new Array(6)).map((_, index) => (
                                <Grid size={4} key={index}>
                                    <Box sx={{ 
                                        border: '1px solid #E0E0E0', 
                                        borderRadius: '16px',
                                        padding: '16px',
                                        height: '150px',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Skeleton variant="rectangular" width={40} height={40} />
                                        <Skeleton variant="text" width="80%" height={30} />
                                        <Skeleton variant="text" width="100%" height={20} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '16px', gap: 1 }}>
                                            <Skeleton variant="circular" width={20} height={20} />
                                            <Skeleton variant="text" width="40%" height={20} />
                                        </Box>
                                    </Box>
                                </Grid>
                            ))
                    }
                    { status === 'succeeded' && searchLoader === false &&
                        dataProductsList.map((dataProducts:any) => (
                            // Grid item for each card, defining its responsive width
                            <Grid
                                size={4} // One-third width (3 columns) on medium screens (4 out of 12 columns)
                                key={dataProducts.name}
                            >
                                <Box sx={{ 
                                        border: '1px solid #E0E0E0', 
                                        borderRadius: '16px',
                                        padding: '16px',
                                        height: '100%',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}
                                    onClick={() => {
                                        // Handle card click, e.g., navigate to details page
                                        dispatch(getDataProductDetails({dataProductId:dataProducts.name, id_token:user?.token}));
                                        localStorage.setItem('selectedDataProduct', JSON.stringify(dataProducts));
                                        navigate(`/data-products-details?dataProductId=${encodeURIComponent(dataProducts.name)}`);
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <img 
                                            src={dataProducts.icon ? `data:image/${getMimeType(dataProducts.icon)};base64,${dataProducts.icon}` : '/assets/images/data-product-card.png'} 
                                            alt={dataProducts.displayName} 
                                            style={{ width: '40px', height: '40px', marginBottom: '12px' }} 
                                        />
                                        <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '17px', fontWeight: 500, color: '#1F1F1F', textWrap: 'break-word', marginLeft: '12px', maxWidth: 'calc(100% - 150px)', lineHeight:1.3, marginTop: '-10px' }}>
                                            {dataProducts.displayName}
                                        </Typography>
                                        <Box sx={{ alignSelf: "flex-end", marginLeft: 'auto', position: 'relative', top: '-25px' }}>
                                            <Tag text={`${dataProducts.assetCount || 0} assets`} css={{
                                                fontFamily: '"Google Sans Text", sans-serif',
                                                color: '#004A77',
                                                margin: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                padding: "0.25rem 0.5rem",
                                                fontWeight: 500,
                                                borderRadius: '12px',
                                                textTransform:'capitalize',
                                                flexShrink: 0 // Prevent tag from shrinking
                                            }}/>
                                        </Box>
                                    </Box>
                                    <Box>
                                        
                                        <Typography variant="body2" sx={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757', lineHeight: 1.4, height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {dataProducts.description || 'No description available.'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{display: 'flex', alignItems: 'center', marginTop: '16px', gap: 1 }}>
                                        <Tooltip title={`Owner: ${dataProducts.ownerEmails.join(', ') || 'Unknown'}`} arrow>
                                            <>
                                                <span style={{ 
                                                    color: "#575757", 
                                                    fontSize: "1rem", 
                                                    fontWeight: 500, 
                                                    display: "flex", 
                                                    alignItems: "center",
                                                    flex: '0 1 auto', // Allow shrinking for owner email
                                                    gap: '0.25rem',
                                                    minWidth: 0
                                                }}>
                                                    <div style={{
                                                        width: '1.25rem',
                                                        height: '1.25rem',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#FFDCD2', // Fallback color
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#9C3A1F', // Fallback color
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        flexShrink: 0
                                                    }}>
                                                        {dataProducts.ownerEmails.length > 0 && dataProducts.ownerEmails[0].charAt(0).toUpperCase()}
                                                    </div>
                                                </span>
                                                <span style={{ 
                                                    color: "#575757", 
                                                    fontSize: "12px", 
                                                    fontWeight: 500, 
                                                    display: "flex", 
                                                    alignItems: "center",
                                                    flex: '0 0 auto', // Fixed size, don't grow or shrink
                                                    gap: '0.25rem'
                                                }}>
                                                {dataProducts.ownerEmails.length > 0 && dataProducts.ownerEmails[0]}
                                                { dataProducts.ownerEmails.length > 1 ? (`+${dataProducts.ownerEmails.length - 1}`) : '' }
                                                </span>
                                            </>
                                        </Tooltip>
                                        <Box sx={{ 
                                            marginLeft: 'auto',
                                            alignSelf: 'flex-end',
                                            display: 'flex',
                                            gap: 2
                                        }}>
                                            <Tooltip title={`Last Modified at ${dataProducts.updateTime.split('T')[0]}`} arrow placement='top'>
                                                <span style={{ 
                                                    color: "#575757", 
                                                    fontSize: "12px", 
                                                    fontWeight: 500, 
                                                    display: "flex", 
                                                    alignItems: "center",
                                                    flex: '0 0 auto', // Fixed size, don't grow or shrink
                                                    gap: '0.25rem'
                                                }}>
                                                    <AccessTime style={{fontSize: 12}}/>
                                                    <span>{dataProducts.updateTime.split('T')[0]}</span>
                                                </span>
                                            </Tooltip>
                                            <Tooltip title={`Location - ${dataProducts.name.split('/')[3]}`} arrow placement='top'>
                                            <span style={{ 
                                                color: "#575757", 
                                                fontSize: "12px", 
                                                fontWeight: 500, 
                                                display: "flex", 
                                                alignItems: "center",
                                                flex: '0 1 auto', // Allow shrinking for location text
                                                gap: '0.125rem',
                                                minWidth: 0
                                            }}>
                                                <LocationOnOutlined style={{fontSize: 12, flexShrink: 0}}/>
                                                <span style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                                }}>
                                                {dataProducts.name.split('/')[3]}
                                                </span>
                                            </span>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))
                    }
                </Grid>
            </Box>
        </Box>
        </Paper>
    </Box>
  );
};

export default DataProducts;