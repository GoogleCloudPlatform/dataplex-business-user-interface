import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useDebounce from '../../hooks/useDebounce';
import {
  Box, Typography, Paper, Grid,
  Tooltip, Menu, MenuItem,
  TextField, Skeleton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';

import {
  Search, AccessTime,
  LocationOnOutlined,
  ExpandMore
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';
import { fetchDataProductsList, getDataProductDetails, setDataProductsViewMode, setDataProductsDetailTabValue } from '../../features/dataProducts/dataProductsSlice';
import { useNavigate } from 'react-router-dom';
import Tag from '../Tags/Tag';
import axios from 'axios';
import { getMimeType } from '../../utils/resourceUtils';
import DataProductsTableView from './DataProductsTableView';
import DataProductsTableViewSkeleton from './DataProductsTableViewSkeleton';
import './DataProducts.css'

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
    borderRadius: 'clamp(40px, 4vw, 54px)',
    height: 'clamp(28px, 2.5vw, 32px)',
    padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
    gap: 'clamp(6px, 0.6vw, 8px)',
    fontFamily: 'Google Sans Text',
    fontSize: 'clamp(10px, 0.9vw, 12px)',
    fontWeight: 500,
    letterSpacing: '0.1px',
    color: '#5E5E5E',
    '& fieldset': { borderColor: '#DADCE0' },
    '&:hover fieldset': { borderColor: '#A8A8A8' },
    '&.Mui-focused fieldset': { borderColor: '#0E4DCA', borderWidth: '1.5px' },
  },
  width: 'clamp(250px, 25vw, 350px)',
  marginRight: 'clamp(6px, 0.8vw, 10px)',
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
  borderRadius: 'clamp(12px, 1vw, 16px)',
  padding: 'clamp(12px, 1vw, 16px)',
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
  '&:hover': {
    boxShadow: '0 4px 8px 0 rgba(60,64,67,0.15)',
    borderColor: '#0B57D0',
    transform: 'scale(1.02)',
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
  <Box sx={CARD_SX} onClick={onClick} className='parent-container'>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <img
        src={dataProduct.icon ? `data:${getMimeType(dataProduct.icon)};base64,${dataProduct.icon}` : '/assets/images/data-product-card.png'}
        alt={dataProduct.displayName}
        style={{ width: 'clamp(30px, 3vw, 40px)', height: 'clamp(30px, 3vw, 40px)', marginBottom: 'clamp(8px, 0.8vw, 12px)' }}
      />
      <Typography variant="h6" sx={{ fontFamily: 'Google Sans', fontSize: 'clamp(14px, 1.2vw, 17px)', fontWeight: 500, color: '#1F1F1F', textWrap: 'break-word', marginLeft: 'clamp(8px, 0.8vw, 12px)', maxWidth: 'calc(100% - 150px)', lineHeight: 1.3, marginTop: '-10px' }}>
        {dataProduct.displayName}
      </Typography>
      <Box sx={{ alignSelf: "flex-end", marginLeft: 'auto', position: 'relative', top: '-25px' }}>
        <Tag text={`${dataProduct.assetCount || 0} assets`} css={{
          fontFamily: '"Google Sans Text", sans-serif',
          fontSize: 'clamp(10px, 0.9vw, 14px)',
          color: '#004A77',
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(0.15rem, 0.3vw, 0.25rem) clamp(0.3rem, 0.5vw, 0.5rem)",
          fontWeight: 500,
          borderRadius: 'clamp(8px, 0.8vw, 12px)',
          textTransform: 'capitalize',
          flexShrink: 0
        }} />
      </Box>
    </Box>
    <Box>
      <Typography variant="body2" sx={{ fontFamily: 'Google Sans Text', fontSize: 'clamp(11px, 1vw, 14px)', color: '#575757', lineHeight: 1.4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
        {dataProduct.description || 'No description available.'}
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 'clamp(12px, 1vw, 16px)', gap: 'clamp(4px, 0.5vw, 8px)' }}>
      <Tooltip title={`Owner: ${dataProduct.ownerEmails.join(', ') || 'Unknown'}`} arrow>
        <>
          <span style={{
            color: "#575757",
            fontSize: "1rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            flex: '0 1 auto',
            gap: 'clamp(0.15rem, 0.3vw, 0.25rem)',
            minWidth: 0
          }}>
            <div style={{
              width: 'clamp(1rem, 1.2vw, 1.25rem)',
              height: 'clamp(1rem, 1.2vw, 1.25rem)',
              borderRadius: '50%',
              backgroundColor: '#FFDCD2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9C3A1F',
              fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)',
              fontWeight: 500,
              flexShrink: 0
            }}>
              {dataProduct.ownerEmails.length > 0 && dataProduct.ownerEmails[0].charAt(0).toUpperCase()}
            </div>
          </span>
          <Box
            component="span"
            sx={{
              color: "#575757",
              fontSize: 'clamp(8px, 0.8vw, 12px)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {dataProduct.ownerEmails.length > 0 && dataProduct.ownerEmails[0]}
            {dataProduct.ownerEmails.length > 1 ? (`+${dataProduct.ownerEmails.length - 1}`) : ''}
          </Box>
        </>
      </Tooltip>
      <Box sx={{
        marginLeft: 'auto',
        alignSelf: 'flex-end',
        display: 'flex',
        gap: 'clamp(4px, 0.5vw, 16px)',
      }}>
        <Tooltip title={`Last Modified at ${dataProduct.updateTime.split('T')[0]}`} arrow placement='top'>
          <Box
            component="span"
            sx={{
              color: "#575757",
              fontSize: 'clamp(8px, 0.8vw, 12px)',
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: '0.25rem',
              whiteSpace: 'nowrap',
            }}
          >
            <AccessTime sx={{ fontSize: 'clamp(8px, 0.8vw, 12px)' }} />
            <span>{dataProduct.updateTime.split('T')[0]}</span>
          </Box>
        </Tooltip>
        <Tooltip title={`Location - ${dataProduct.name.split('/')[3]}`} arrow placement='top'>
          <Box
            component="span"
            sx={{
              color: "#575757",
              fontSize: 'clamp(8px, 0.8vw, 12px)',
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: '0.125rem',
              whiteSpace: 'nowrap',
            }}
          >
            <LocationOnOutlined sx={{ fontSize: 'clamp(8px, 0.8vw, 12px)', flexShrink: 0 }} />
            <span>{dataProduct.name.split('/')[3]}</span>
          </Box>
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

  const { dataProductsItems, status, error } = useSelector((state: any) => state.dataProducts);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sortBy, setSortBy] = useState<SortBy>('lastModified');
  const viewMode = (useSelector((state: any) => state.dataProducts.viewMode) || 'list') as 'table' | 'list';
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [dataProductsList, setDataProductsList] = useState<DataProduct[]>([]);
  const [searchLoader, setSearchLoader] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const handleViewModeChange = useCallback((_event: React.MouseEvent<HTMLElement>, newMode: 'list' | 'table' | null) => {
    if (newMode !== null) {
        dispatch(setDataProductsViewMode(newMode));
    }
  }, [dispatch]);



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
    dispatch(setDataProductsDetailTabValue(0)); // Reset to Overview tab on fresh navigation
    localStorage.setItem('selectedDataProduct', JSON.stringify(dataProduct));
    navigate(`/data-products-details?dataProductId=${encodeURIComponent(dataProduct.name)}`);
  }, [dispatch, navigate, user?.token]);

  // Memoize the display state for better performance
  const showNoAccess = useMemo(() => status === 'failed' && error?.type === 'PERMISSION_DENIED', [status, error]);
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
          orderBy: 'relevance',
          semanticSearch: true,
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
      backgroundColor: '#fff',
      height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 72px)' },
      width: '100%',
      overflow: 'hidden'
    }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          height: { xs: 'calc(100vh - 72px)', sm: 'calc(100vh - 88px)' },
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
                  fontSize: 'clamp(18px, 1.8vw, 24px)',
                  lineHeight: 'clamp(18px, 1.8vw, 24px)',
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
                        startAdornment: <Search sx={{ color: '#575757', fontSize: 'clamp(16px, 1.5vw, 20px)' }} />,
                    }}
                />

                <Box sx={{
                  alignSelf: { xs: 'flex-start', sm: 'flex-end' },
                  marginLeft: { xs: 0, sm: 'auto' },
                  paddingRight: { xs: 0, sm: '40px' },
                  width: { xs: '100%', sm: 'auto' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  justifyContent: { xs: 'flex-end', sm: 'flex-end' }
                }}>
                    {/* Sort Controls — hidden in table view */}
                    {viewMode !== 'table' && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography
                          component="span"
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                            color: '#1F1F1F',
                            whiteSpace: "nowrap",
                            fontFamily: '"Google Sans Text", sans-serif',
                          }}
                          onClick={handleSortMenuClick}
                        >
                          <ExpandMore
                            sx={{
                              fontSize: '20px',
                              color: '#575757',
                              transform: sortAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.3s ease',
                            }}
                          />
                          {sortBy === 'name' ? 'Name' : 'Last modified'}
                        </Typography>
                        <Tooltip title={sortOrder === 'asc' ? 'Sort large to small' : 'Sort small to large'} arrow>
                          <span
                            aria-label={sortOrder === 'asc' ? 'Sort large to small' : 'Sort small to large'}
                            role="button"
                            onClick={handleSortOrderToggle}
                            style={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0,
                              transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s ease-in-out',
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="24" height="24" rx="12" fill="#C2E7FF"/>
                              <path d="M11.168 15.4818L11.168 5.33594L12.8346 5.33594L12.8346 15.4818L17.5013 10.8151L18.668 12.0026L12.0013 18.6693L5.33464 12.0026L6.5013 10.8151L11.168 15.4818Z" fill="#004A77"/>
                            </svg>
                          </span>
                        </Tooltip>
                      </div>
                    )}
                    <Menu
                      anchorEl={sortAnchorEl}
                      open={Boolean(sortAnchorEl)}
                      onClose={handleSortMenuClose}
                      PaperProps={{
                        style: {
                          marginTop: '4px',
                          borderRadius: '8px',
                          boxShadow: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
                          minWidth: '140px',
                        }
                      }}
                    >
                      <MenuItem
                        onClick={() => handleSortOptionSelect('name')}
                        sx={{
                          fontSize: '12px',
                          fontFamily: '"Google Sans Text", sans-serif',
                          fontWeight: sortBy === 'name' ? '500' : '400',
                          color: sortBy === 'name' ? '#0B57D0' : '#1F1F1F',
                          backgroundColor: sortBy === 'name' ? '#F8FAFD' : 'transparent',
                        }}
                      >
                        Name
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleSortOptionSelect('lastModified')}
                        sx={{
                          fontSize: '12px',
                          fontFamily: '"Google Sans Text", sans-serif',
                          fontWeight: sortBy === 'lastModified' ? '500' : '400',
                          color: sortBy === 'lastModified' ? '#0B57D0' : '#1F1F1F',
                          backgroundColor: sortBy === 'lastModified' ? '#F8FAFD' : 'transparent',
                        }}
                      >
                        Last Modified
                      </MenuItem>
                    </Menu>
                        {/* View Mode Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        aria-label="view mode"
                        size="small"
                        sx={{
                          width: '5rem',
                          height: '1.5rem',
                          borderRadius: '1rem',
                          border: '1px solid #747775',
                          backgroundColor: '#FFFFFF',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                          padding: 0,
                          '& .MuiToggleButton-root': {
                            border: 'none',
                            borderRadius: 0,
                            padding: '0px',
                            fontSize: 0,
                            fontWeight: 500,
                            fontFamily: '"Google Sans Text", sans-serif',
                            lineHeight: 1,
                            minWidth: 'auto',
                            height: '1.5rem',
                            margin: 0,
                            backgroundColor: 'transparent',
                            color: '#1F1F1F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.125rem',
                            transition: 'all 0.2s ease-in-out',
                            borderRight: '1px solid #747775',
                            '&:first-of-type': {
                              borderTopLeftRadius: '1rem',
                              borderBottomLeftRadius: '1rem',
                            },
                            '&:last-of-type': {
                              borderTopRightRadius: '1rem',
                              borderBottomRightRadius: '1rem',
                              borderRight: 'none',
                            },
                            '&.Mui-selected': {
                              width: '3.125rem',
                              backgroundColor: '#E8F0FE',
                              color: '#0B57D0',
                              borderRight: '1px solid #747775',
                              padding: '0 0.25rem',
                              '& svg': {
                                fill: '#0B57D0'
                              }
                            },
                            '&.Mui-selected:last-of-type': {
                              borderRight: 'none',
                            },
                            '&:not(.Mui-selected)': {
                              width: '1.875rem',
                              backgroundColor: 'transparent',
                              color: '#1F1F1F',
                              padding: '0',
                              '& svg': {
                                fill: '#1F1F1F'
                              },
                              '&:hover': {
                                backgroundColor: '#F0F0F0',
                                color: '#1F1F1F'
                              }
                            }
                          }
                        }}
                    >
                        <ToggleButton value="list" aria-label="card view">
                          {viewMode === 'list' && (
                            <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                          )}
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask_dp_card" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                              <rect width="16" height="16" fill="#D9D9D9"/>
                            </mask>
                            <g mask="url(#mask_dp_card)">
                              <path d="M3.33333 7.33333C2.96667 7.33333 2.65278 7.20278 2.39167 6.94167C2.13056 6.68056 2 6.36667 2 6V3.33333C2 2.96667 2.13056 2.65278 2.39167 2.39167C2.65278 2.13056 2.96667 2 3.33333 2H12.6667C13.0333 2 13.3472 2.13056 13.6083 2.39167C13.8694 2.65278 14 2.96667 14 3.33333V6C14 6.36667 13.8694 6.68056 13.6083 6.94167C13.3472 7.20278 13.0333 7.33333 12.6667 7.33333H3.33333ZM3.33333 6H12.6667V3.33333H3.33333V6ZM3.33333 14C2.96667 14 2.65278 13.8694 2.39167 13.6083C2.13056 13.3472 2 13.0333 2 12.6667V10C2 9.63333 2.13056 9.31945 2.39167 9.05833C2.65278 8.79722 2.96667 8.66667 3.33333 8.66667H12.6667C13.0333 8.66667 13.3472 8.79722 13.6083 9.05833C13.8694 9.31945 14 9.63333 14 10V12.6667C14 13.0333 13.8694 13.3472 13.6083 13.6083C13.3472 13.8694 13.0333 14 12.6667 14H3.33333ZM3.33333 12.6667H12.6667V10H3.33333V12.6667Z" fill={viewMode === 'list' ? '#0B57D0' : '#1F1F1F'}/>
                            </g>
                          </svg>
                        </ToggleButton>
                        <ToggleButton value="table" aria-label="table view">
                          {viewMode === 'table' && (
                            <img src="/assets/svg/check.svg" alt="Check" style={{ width: '16px', height: '16px', marginRight: '2px' }} />
                          )}
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <mask id="mask_dp_table" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
                              <rect width="16" height="16" fill="#D9D9D9"/>
                            </mask>
                            <g mask="url(#mask_dp_table)">
                              <path d="M3.33333 14C2.96667 14 2.65278 13.8694 2.39167 13.6083C2.13056 13.3472 2 13.0333 2 12.6667V3.33333C2 2.96667 2.13056 2.65278 2.39167 2.39167C2.65278 2.13056 2.96667 2 3.33333 2H12.6667C13.0333 2 13.3472 2.13056 13.6083 2.39167C13.8694 2.65278 14 2.96667 14 3.33333V12.6667C14 13.0333 13.8694 13.3472 13.6083 13.6083C13.3472 13.8694 13.0333 14 12.6667 14H3.33333ZM7.33333 10H3.33333V12.6667H7.33333V10ZM8.66667 10V12.6667H12.6667V10H8.66667ZM7.33333 8.66667V6H3.33333V8.66667H7.33333ZM8.66667 8.66667H12.6667V6H8.66667V8.66667ZM3.33333 4.66667H12.6667V3.33333H3.33333V4.66667Z" fill={viewMode === 'table' ? '#0B57D0' : '#1F1F1F'}/>
                            </g>
                          </svg>
                        </ToggleButton>
                    </ToggleButtonGroup>
              </Box>
            </Box>
            <Box sx={{
              flexGrow: 1,
              py: { xs: 1, sm: 2 },
              px: { xs: '10px', sm: viewMode === 'table' ? '0px' : '20px' },
              position: 'relative',
              top: { xs: '30px', sm: '40px' },
              overflowY: 'auto'
            }}>
                {showNoAccess && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        minHeight: { xs: 'calc(100vh - 250px)', sm: 'calc(100vh - 300px)' },
                        gap: 2
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            You have no access to data products.
                        </Typography>
                    </Box>
                )}
                {!showNoAccess && <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                    {
                        showLoading && viewMode === 'list' &&
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
                    {
                        showLoading && viewMode === 'table' &&
                            <DataProductsTableViewSkeleton />
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
                        : (
                          <DataProductsTableView
                            dataProducts={dataProductsList}
                            onRowClick={handleCardClick}
                          />
                        ))
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
                </Grid>}
            </Box>
        </Box>
        </Paper>
    </Box>
  );
};

export default DataProducts;