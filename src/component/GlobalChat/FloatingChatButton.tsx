import React, { useState } from 'react';
import { Fab, Drawer, Box, IconButton, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLocation } from 'react-router-dom';
import AccessibleTablesPanel from './AccessibleTablesPanel';
import ChatTab from '../ConversationalAnalytics/ChatTab';

const FloatingChatButton: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTables, setSelectedTables] = useState<any[]>([]);

    // Hide on the global chat page to avoid duplication
    if (location.pathname === '/global-chat') {
        return null;
    }

    return (
        <>
            <Fab
                color="primary"
                aria-label="chat"
                onClick={() => setIsOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1200, // Above most things but below tooltips/dialogs
                    backgroundColor: '#1967D2',
                    '&:hover': {
                        backgroundColor: '#1558B0'
                    }
                }}
            >
                <ChatBubbleOutlineIcon />
            </Fab>

            <Drawer
                anchor="right"
                open={isOpen}
                onClose={() => setIsOpen(false)}
                PaperProps={{
                    sx: {
                        width: '450px', // Slightly wider for better mobile exp
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #DADCE0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleOutlineIcon color="primary" />
                        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                            Data Assistant
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setIsOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Table Selector (Collapsible) */}
                <Accordion defaultExpanded elevation={0} sx={{ borderBottom: '1px solid #DADCE0', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                            Context: {selectedTables.length} Table{selectedTables.length !== 1 ? 's' : ''} Selected
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, maxHeight: '300px', overflow: 'auto' }}>
                        <AccessibleTablesPanel
                            selectedTables={selectedTables}
                            onSelectionChange={setSelectedTables}
                            compact={true}
                        />
                    </AccordionDetails>
                </Accordion>

                {/* Chat Area */}
                <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {selectedTables.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: 'center', color: '#5F6368', mt: 4 }}>
                            <Typography variant="body1">
                                Please select at least one table above to start chatting.
                            </Typography>
                        </Box>
                    ) : (
                        // We wrap ChatTab to constrain its height properly within the drawer
                        <Box sx={{ flex: 1, overflow: 'hidden', '& > div': { height: '100%', p: '16px !important' } }}>
                            <ChatTab tables={selectedTables} />
                        </Box>
                    )}
                </Box>
            </Drawer>
        </>
    );
};

export default FloatingChatButton;
