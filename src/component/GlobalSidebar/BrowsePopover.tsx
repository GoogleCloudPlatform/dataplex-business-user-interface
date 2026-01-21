import React from 'react';
import { Popover, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchGlossaries } from '../../features/glossaries/glossariesSlice';
import { useAuth } from '../../auth/AuthProvider';

interface BrowsePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const BrowsePopover: React.FC<BrowsePopoverProps> = ({
  anchorEl,
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const handleGlossariesClick = () => {
    dispatch(fetchGlossaries({ id_token: user?.token }));
    navigate('/glossaries');
    onClose();
  };

  const handleAnnotationsClick = () => {
    navigate('/browse-by-annotation');
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      sx={{
        '& .MuiPopover-paper': {
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          marginLeft: '8px',
          minWidth: '160px',
        },
      }}
    >
      <Box sx={{ py: 1 }}>
        {/* Glossaries Option */}
        <Box
          onClick={handleGlossariesClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#F8FAFD' },
          }}
        >
          <img
            src="/assets/svg/glossaries-icon.svg"
            alt="Glossaries"
            style={{ width: 20, height: 20 }}
          />
          <Typography
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '14px',
              color: '#1F1F1F',
            }}
          >
            Glossaries
          </Typography>
        </Box>

        {/* Annotations Option */}
        <Box
          onClick={handleAnnotationsClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#F8FAFD' },
          }}
        >
          <img
            src="/assets/svg/annotations-icon.svg"
            alt="Annotations"
            style={{ width: 20, height: 20 }}
          />
          <Typography
            sx={{
              fontFamily: '"Google Sans", sans-serif',
              fontSize: '14px',
              color: '#1F1F1F',
            }}
          >
            Aspects
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
};

export default BrowsePopover;
