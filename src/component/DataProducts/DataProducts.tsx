import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useDebounce from '../../hooks/useDebounce';
import {
  Box, Typography, Paper, Grid,
  Tooltip, Menu, MenuItem,
  TextField, Skeleton,
  Button, IconButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import {
  Search, AccessTime,
  LocationOnOutlined,
  Sort, ExpandMore
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';
import { fetchDataProductsList, getDataProductDetails } from '../../features/dataProducts/dataProductsSlice';
import { useNavigate } from 'react-router-dom';
import Tag from '../Tags/Tag';
import axios from 'axios';
import { getMimeType } from '../../utils/resourceUtils';

// Types
interface DataProduct {
  name: string;
  displayName: string;
  description?: string;
  updateTime: string;
  ownerEmails: string[];
  assetCount?: number;
  icon?: string;
}

type SortBy = 'name' | 'lastModified';
type SortOrder = 'asc' | 'desc';

// Utility function for sorting
const sortDataProducts = (
  products: DataProduct[],
  sortBy: SortBy,
  sortOrder: SortOrder
): DataProduct[] => {
  return [...products].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = a.displayName.toLowerCase();
      const nameB = b.displayName.toLowerCase();
      return sortOrder === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    } else {
      const dateA = a.updateTime ? new Date(a.updateTime).getTime() : 0;
      const dateB = b.updateTime ? new Date(b.updateTime).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });
};

// Reusable style constants
const SEARCH_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '54px',
    height: '32px',
    padding: '8px 12px',
    gap: '8px',
    fontFamily: 'Google Sans Text',
    fontSize: '12px',
    fontWeight: 500,
    letterSpacing: '0.1px',
    color: '#5E5E5E',
    '& fieldset': { borderColor: '#DADCE0' },
    '&:hover fieldset': { borderColor: '#A8A8A8' },
    '&.Mui-focused fieldset': { borderColor: '#0E4DCA', borderWidth: '1.5px' },
  },
  width: { xs: '100%', sm: '250px', md: '309px' },
  marginRight: { xs: 0, sm: '10px' },
  mb: { xs: 1, sm: 0 },
  '& .MuiInputBase-input': {
    padding: 0,
    '&::placeholder': {
      color: '#5E5E5E',
      opacity: 1,
    },
  },
  boxShadow: 'none',
};

const CARD_SX = {
  border: '1px solid #E0E0E0',
  borderRadius: '16px',
  padding: '16px',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s',
  '&:hover': {
    boxShadow: '0 4px 8px 0 rgba(60,64,67,0.15)',
  },
};

// Memoized DataProduct Card Component
const DataProductCard = React.memo(({
  dataProduct,
  onClick
}: {
  dataProduct: DataProduct;
  onClick: () => void;
}) => (
  <Box sx={CARD_SX} onClick={onClick}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={dataProduct.icon ? `data:image/${getMimeType(dataProduct.icon)};base64,${dataProduct.icon}` : '/assets/images/data-product-card.png'}
        alt={dataProduct.displayName}
        style={{ width: '40px', height: '40px', marginBottom: '12px' }}
      />
      <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: '17px', fontWeight: 500, color: '#1F1F1F', textWrap: 'break-word', marginLeft: '12px', maxWidth: 'calc(100% - 150px)', lineHeight: 1.3, marginTop: '-10px' }}>
        {dataProduct.displayName}
      </Typography>
      <Box sx={{ alignSelf: "flex-end", marginLeft: 'auto', position: 'relative', top: '-25px' }}>
        <Tag text={`${dataProduct.assetCount || 0} assets`} css={{
          fontFamily: '"Google Sans Text", sans-serif',
          color: '#004A77',
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.25rem 0.5rem",
          fontWeight: 500,
          borderRadius: '12px',
          textTransform: 'capitalize',
          flexShrink: 0
        }} />
      </Box>
    </Box>
    <Box>
      <Typography variant="body2" sx={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757', lineHeight: 1.4, height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {dataProduct.description || 'No description available.'}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '16px', gap: 1 }}>
      <Tooltip title={`Owner: ${dataProduct.ownerEmails.join(', ') || 'Unknown'}`} arrow>
        <>
          <span style={{
            color: "#575757",
            fontSize: "1rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            flex: '0 1 auto',
            gap: '0.25rem',
            minWidth: 0
          }}>
            <div style={{
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              backgroundColor: '#FFDCD2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9C3A1F',
              fontSize: '0.75rem',
              fontWeight: 500,
              flexShrink: 0
            }}>
              {dataProduct.ownerEmails.length > 0 && dataProduct.ownerEmails[0].charAt(0).toUpperCase()}
            </div>
          </span>
          <span style={{
            color: "#575757",
            fontSize: "12px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            flex: '0 0 auto',
            gap: '0.25rem'
          }}>
            {dataProduct.ownerEmails.length > 0 && dataProduct.ownerEmails[0]}
            {dataProduct.ownerEmails.length > 1 ? (`+${dataProduct.ownerEmails.length - 1}`) : ''}
          </span>
        </>
      </Tooltip>
      <Box sx={{
        marginLeft: 'auto',
        alignSelf: 'flex-end',
        display: 'flex',
        gap: 2
      }}>
        <Tooltip title={`Last Modified at ${dataProduct.updateTime.split('T')[0]}`} arrow placement='top'>
          <span style={{
            color: "#575757",
            fontSize: "12px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            flex: '0 0 auto',
            gap: '0.25rem'
          }}>
            <AccessTime style={{ fontSize: 12 }} />
            <span>{dataProduct.updateTime.split('T')[0]}</span>
          </span>
        </Tooltip>
        <Tooltip title={`Location - ${dataProduct.name.split('/')[3]}`} arrow placement='top'>
          <span style={{
            color: "#575757",
            fontSize: "12px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            flex: '0 1 auto',
            gap: '0.125rem',
            minWidth: 0
          }}>
            <LocationOnOutlined style={{ fontSize: 12, flexShrink: 0 }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {dataProduct.name.split('/')[3]}
            </span>
          </span>
        </Tooltip>
      </Box>
    </Box>
  </Box>
));

DataProductCard.displayName = 'DataProductCard';

const DataProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { dataProductsItems, status } = useSelector((state: any) => state.dataProducts);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortBy, setSortBy] = useState<SortBy>('lastModified');
  const [viewMode, setViewMode] = useState<'table' | 'list'>('list');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [dataProductsList, setDataProductsList] = useState<DataProduct[]>([]);
  const [searchLoader, setSearchLoader] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'table' | null) => {
    if (newMode !== null) {
        setViewMode(newMode);
    }
  }, []);



  useEffect(() => {
    if (dataProductsItems.length === 0 && status === 'idle' && user?.token) {
       dispatch(fetchDataProductsList({ id_token: user?.token }));
    }
    if(status=== 'succeeded'){
        localStorage.removeItem('selectedDataProduct');
        const sortedData = sortDataProducts(dataProductsItems, 'lastModified', 'desc');
        setDataProductsList(sortedData);
    }
  }, [dispatch, dataProductsItems, status, user?.token]);

  //sorting handlers
  const handleSortMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  }, []);

  const handleSortMenuClose = useCallback(() => {
    setSortAnchorEl(null);
  }, []);

  const handleSortOrderToggle = useCallback(() => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = sortDataProducts(dataProductsList, sortBy, newOrder);
    setDataProductsList(sorted);
  }, [sortOrder, sortBy, dataProductsList]);

  const handleSortOptionSelect = useCallback((option: SortBy) => {
    const newOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(option);
    setSortOrder(newOrder);
    const sorted = sortDataProducts(dataProductsList, option, newOrder);
    setDataProductsList(sorted);
    handleSortMenuClose();
  }, [sortOrder, dataProductsList, handleSortMenuClose]);

  const handleCardClick = useCallback((dataProduct: DataProduct) => {
    dispatch(getDataProductDetails({ dataProductId: dataProduct.name, id_token: user?.token }));
    localStorage.setItem('selectedDataProduct', JSON.stringify(dataProduct));
    navigate(`/data-products-details?dataProductId=${encodeURIComponent(dataProduct.name)}`);
  }, [dispatch, navigate, user?.token]);

  // Memoize the display state for better performance
  const showLoading = useMemo(() => status === 'loading' || searchLoader, [status, searchLoader]);
  const showEmptyState = useMemo(() =>
    status === 'succeeded' &&
    !searchLoader &&
    dataProductsList.length === 0 &&
    (dataProductsItems.length === 0 || (debouncedSearchTerm.length > 0 && searchTerm.length > 0)),
    [status, searchLoader, dataProductsList.length, dataProductsItems.length, debouncedSearchTerm.length, searchTerm.length]
  );
  const emptyStateMessage = useMemo(() =>
    dataProductsItems.length === 0
      ? 'No data products available'
      : 'No data products found matching your search',
    [dataProductsItems.length]
  );


  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();

    if (dataProductsItems.length > 0 && debouncedSearchTerm.length > 0) {
      setSearchLoader(true);
      axios.post(
        `https://dataplex.googleapis.com/v1/projects/${import.meta.env.VITE_GOOGLE_PROJECT_ID}/locations/global:searchEntries`,
        {
          query: `${debouncedSearchTerm} AND (type="data_product")`,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
          cancelToken: cancelTokenSource.token,
        }
      ).then((response: any) => {
        const array2 = response?.data?.results || [];
        const items = dataProductsItems.filter((obj1: DataProduct) =>
          array2.some((obj2: any) =>
            obj1.name.split('/').slice(2).join('/') === obj2.dataplexEntry?.entrySource?.resource.split('/').slice(2).join('/')
          )
        );
        setDataProductsList(items);
        setSearchLoader(false);
      }).catch((error: any) => {
        if (!axios.isCancel(error)) {
          console.error('Error fetching data product assets details:', error);
          setSearchLoader(false);
        }
      });
    } else if (debouncedSearchTerm.length === 0) {
      setSearchLoader(false);
      setDataProductsList(dataProductsItems);
    }

    return () => {
      cancelTokenSource.cancel('Component unmounted or search term changed');
    };
  }, [debouncedSearchTerm, dataProductsItems, user?.token]);






  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      px: { xs: 0, sm: 0 },
      pb: { xs: 1, sm: 2 },
      pt: 0,
      backgroundColor: '#F8FAFD',
      height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
      width: '100%',
      overflow: 'hidden'
    }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          height: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 80px)' },
          borderRadius: { xs: '16px', sm: '24px' },
          backgroundColor: '#fff',
          border: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        <Box>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              top: { xs: '12px', sm: '20px' },
              left: { xs: '10px', sm: '20px' },
              px: { xs: 1, sm: 0 }
            }}>
                <Typography variant="h5" sx={{
                  fontFamily: '"Google Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '20px', sm: '24px' },
                  lineHeight: { xs: '20px', sm: '24px' },
                  color: '#1F1F1F'
                }}>
                    Data Products
                </Typography>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 0.1 },
              position: 'relative',
              top: '40px',
              left: { xs: '10px', sm: '20px' },
              right: { xs: '10px', sm: 'auto' },
              px: { xs: 1, sm: 0 }
            }}>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Search data products"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={SEARCH_FIELD_SX}
                    InputProps={{
                        startAdornment: <Search sx={{ color: '#575757', fontSize: 20 }} />,
                    }}
                />

                {/* Sort Controls */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    {/* Sort Order Toggle Button */}
                    <IconButton
                        onClick={handleSortOrderToggle}
                        sx={{ p: 0.5, mr: 0.5, color: "#1F1F1F" }}
                    >
                        <Sort
                            sx={{
                                fontSize: 16,
                                transform: sortOrder === "asc" ? "scaleY(-1)" : "none",
                            }}
                        />
                    </IconButton>

                    {/* Sort By Dropdown */}
                    <Button
                        onClick={handleSortMenuClick}
                        endIcon={
                            <ExpandMore
                                sx={{
                                    color: "#1F1F1F",
                                    fontSize: 20,
                                    transform: sortAnchorEl ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s",
                                }}
                            />
                        }
                        sx={{
                            textTransform: "none",
                            color: "#1F1F1F",
                            fontFamily: "Product Sans",
                            fontSize: "12px",
                            fontWeight: 400,
                            padding: 0,
                            minWidth: "auto",
                            "&:hover": { background: "transparent" },
                        }}
                    >
                        Sort by: {sortBy === 'name' ? 'Name' : 'Last Modified'}
                    </Button>
                </Box>

                <Menu
                    anchorEl={sortAnchorEl}
                    open={Boolean(sortAnchorEl)}
                    onClose={handleSortMenuClose}
                    MenuListProps={{ dense: true, sx: { py: 0.5 } }}
                    PaperProps={{
                        sx: {
                            borderRadius: "8px",
                            boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                        },
                    }}
                >
                    <MenuItem
                        onClick={() => handleSortOptionSelect('name')}
                        sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
                    >
                        Name
                    </MenuItem>
                    <MenuItem
                        onClick={() => handleSortOptionSelect('lastModified')}
                        sx={{ fontSize: "13px", fontFamily: "Google Sans" }}
                    >
                        Last Modified
                    </MenuItem>
                </Menu>
                <Box sx={{
                  alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                  marginLeft: { xs: 0, sm: 'auto' },
                  paddingRight: { xs: 0, sm: '40px' },
                  width: { xs: '100%', sm: 'auto' },
                  display: 'flex',
                  justifyContent: { xs: 'flex-end', sm: 'flex-end' }
                }}>
                        {/* View Mode Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="view mode"
                        size="small"
                        sx={{
                        width: '5rem', // 80px total width as per Figma
                        height: '1.5rem', // 24px height as per Figma
                        borderRadius: '1rem', // 16px - fully rounded
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        padding: 0,
                        '& .MuiToggleButton-root': {
                            border: 'none',
                            borderRadius: '1rem', // 16px - fully rounded
                            padding: '0px', // No padding as per Figma
                            fontSize: 0, // Hide text, only show icons
                            fontWeight: 500,
                            fontFamily: '"Google Sans Text", sans-serif',
                            lineHeight: 1,
                            minWidth: 'auto',
                            height: '1.5rem', // 24px
                            margin: 0,
                            backgroundColor: 'transparent',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.125rem', // 2px gap between check and icon
                            transition: 'all 0.2s ease-in-out',
                            '&:first-of-type': {
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            },
                            '&:last-of-type': {
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            },
                            '&.Mui-selected': {
                            width: '3.125rem', // 50px when selected (fits check + icon)
                            backgroundColor: '#E8F0FE',
                            color: '#0B57D0',
                            borderColor: 'transparent',
                            padding: '0 0.25rem', // 4px horizontal padding when selected
                            '& svg': {
                                fill: '#0B57D0'
                            }
                            },
                            '&:not(.Mui-selected)': {
                            width: '1.875rem', // 30px when not selected (icon only)
                            backgroundColor: 'transparent',
                            color: '#64748B',
                            borderColor: 'transparent',
                            padding: '0', // No padding when not selected
                            '& svg': {
                                fill: '#64748B'
                            },
                            '&:hover': {
                                backgroundColor: '#F8FAFC',
                                color: '#475569'
                            }
                            }
                        }
                        }}
                    >
                        <ToggleButton value="table" aria-label="table view">
                        {viewMode === 'table' && (
                            <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                        )}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.1368 13.1369V10.4486H2.86285V13.1369H13.1368ZM13.1368 9.42119V6.57872H2.86285V9.42119H13.1368ZM13.1368 5.55132V2.86297H2.86285V5.55132H13.1368ZM2.86285 14.1643C2.58887 14.1643 2.34915 14.0616 2.14367 13.8561C1.93819 13.6506 1.83545 13.4109 1.83545 13.1369V2.86297C1.83545 2.589 1.93819 2.34927 2.14367 2.14379C2.34915 1.93831 2.58887 1.83557 2.86285 1.83557H13.1368C13.4108 1.83557 13.6505 1.93831 13.856 2.14379C14.0615 2.34927 14.1642 2.589 14.1642 2.86297V13.1369C14.1642 13.4109 14.0615 13.6506 13.856 13.8561C13.6505 14.0616 13.4108 14.1643 13.1368 14.1643H2.86285Z" fill={viewMode === 'table' ? '#0B57D0' : '#64748B'}/>
                            <rect x="5" y="2" width="1" height="12" fill={viewMode === 'table' ? '#0B57D0' : '#64748B'}/>
                        </svg>
                        </ToggleButton>
                        <ToggleButton value="list" aria-label="list view">
                        {viewMode === 'list' && (
                            <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                        )}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 13V11H14V13H2ZM2 9V7H14V9H2ZM2 5V3H14V5H2Z" fill={viewMode === 'list' ? '#0B57D0' : '#64748B'}/>
                        </svg>
                        </ToggleButton>
                    </ToggleButtonGroup>
              </Box>
            </Box>
            <Box sx={{
              flexGrow: 1,
              py: { xs: 1, sm: 2 },
              px: { xs: '10px', sm: '20px' },
              position: 'relative',
              top: { xs: '30px', sm: '40px' },
              overflowY: 'auto'
            }}>
                <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                    {
                        showLoading &&
                            Array.from(new Array(6)).map((_, index) => (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
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
                    { !showLoading && !showEmptyState &&
                        ( viewMode === 'list' ?
                        (dataProductsList.map((dataProducts: DataProduct) => (
                            <Grid
                                size={{ xs: 12, sm: 6, md: 4 }}
                                key={dataProducts.name}
                            >
                                <DataProductCard
                                    dataProduct={dataProducts}
                                    onClick={() => handleCardClick(dataProducts)}
                                />
                            </Grid>
                        )))
                        : (<>
                            <Box sx={{ width: '100%', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F' }}>Name</th>
                                            <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F' }}>Description</th>
                                            <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F' }}>Owner</th>
                                            <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F' }}>Last Modified</th>
                                            <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'Google Sans', fontSize: '14px', fontWeight: 500, color: '#1F1F1F' }}>Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            dataProductsList.map((dataProducts: DataProduct) => (
                                            <tr
                                                key={dataProducts.name}
                                                onClick={() => handleCardClick(dataProducts)}
                                                style={{
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.2s',
                                                    borderBottom: '1px solid #E0E0E0',
                                                    height: '72px'
                                                }}
                                            >
                                                <td style={{height: '72px'}}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={dataProducts.icon ? `data:image/${getMimeType(dataProducts.icon)};base64,${dataProducts.icon}` : '/assets/images/data-product-card.png'}
                                                        alt={dataProducts.displayName}
                                                        style={{ width: '32px', height: '32px' }}
                                                    />
                                                    <span style={{ fontFamily: 'Google Sans', fontSize: '15px', fontWeight: 500, color: '#1F1F1F', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {dataProducts.displayName}
                                                    </span>
                                                    </div>
                                                </td>
                                                <td style={{height: '72px' }}>
                                                    <span style={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757', maxWidth:'350px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                        {dataProducts.description || 'No description available.'}
                                                    </span>
                                                </td>
                                                <td style={{ height: '72px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '1.5rem',
                                                        height: '1.5rem',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#FFDCD2', // Fallback color
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#9C3A1F', // Fallback color
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        flexShrink: 0
                                                    }}>
                                                        {dataProducts.ownerEmails.length > 0 && dataProducts.ownerEmails[0].charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757' }}>
                                                        {dataProducts.ownerEmails.length > 0 && dataProducts.ownerEmails[0]}
                                                        { dataProducts.ownerEmails.length > 1 ? (`+${dataProducts.ownerEmails.length - 1}`) : '' }
                                                    </span>
                                                    </div>
                                                </td>
                                                <td style={{ height: '72px'}}>
                                                    <span style={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <AccessTime style={{fontSize: 14}}/>
                                                        {dataProducts.updateTime.split('T')[0]}
                                                    </span>
                                                </td>
                                                <td style={{ height: '72px'  }}>
                                                    <span style={{ fontFamily: 'Google Sans Text', fontSize: '14px', color: '#575757', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <LocationOnOutlined style={{fontSize: 14}}/>
                                                        {dataProducts.name.split('/')[3]}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                                
                            </Box>
                        </>))
                    }
                    { showEmptyState && (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            minHeight: { xs: 'calc(100vh - 250px)', sm: 'calc(100vh - 300px)' },
                            opacity: 1,
                            gap: 2
                        }}>
                            <Typography variant="body1" color="text.secondary">
                                {emptyStateMessage}
                            </Typography>
                        </Box>
                    )}
                </Grid>
            </Box>
        </Box>
        </Paper>
    </Box>
  );
};

export default DataProducts;