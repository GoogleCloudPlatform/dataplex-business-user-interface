import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';
import ChatTab from './ChatTab';
import {
    CircularProgress, Box, Alert, Typography, TextField,
    List, ListItemButton, ListItemText, Paper, InputAdornment,
    Chip, IconButton, Switch, FormControlLabel, Tooltip, Collapse,
    Checkbox, Button, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorageIcon from '@mui/icons-material/Storage';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Table selector component when no entry is provided
const TableSelector: React.FC<{ onSelect: (entry: any) => void; user: any }> = ({ onSelect, user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [useAiSearch, setUseAiSearch] = useState(true);
    const [searchIntent, setSearchIntent] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !user?.token) return;

        setSearching(true);
        setHasSearched(true);
        setSearchIntent(null);

        try {
            if (useAiSearch) {
                // AI-powered natural language search
                const response = await axios.post(
                    `${URLS.API_URL}${URLS.AI_SEARCH}`,
                    { query: searchQuery, type: 'table' },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                setSearchResults(response.data.results || []);
                setSearchIntent(response.data.intent || null);
            } else {
                // Regular search
                const response = await axios.post(
                    `${URLS.API_URL}${URLS.SEARCH}`,
                    { query: searchQuery },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );
                // Filter to show only tables (BigQuery tables, views)
                const tables = (Array.isArray(response.data) ? response.data : response.data?.results || []).filter((item: any) => {
                    const entryType = item.entryType || item.type || '';
                    return entryType.includes('TABLE') || entryType.includes('VIEW') ||
                        item.fullyQualifiedName?.includes('bigquery');
                });
                setSearchResults(tables);
            }
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectEntry = async (result: any) => {
        // Fetch full entry details
        try {
            const entryName = result.name || result.entryName;
            const response = await axios.post(
                `${URLS.API_URL}${URLS.GET_ENTRY}`,
                { entryName },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            onSelect(response.data);
        } catch (err) {
            console.error('Error fetching entry:', err);
            // Fall back to using the search result directly
            onSelect(result);
        }
    };

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 1, color: '#1F1F1F' }}>
                Conversational Analytics
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: '#575757' }}>
                {useAiSearch
                    ? 'Describe what data you\'re looking for in natural language.'
                    : 'Search for a BigQuery table or view to start chatting with your data.'}
            </Typography>

            <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #DADCE0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Tooltip title="AI Search uses Gemini to understand your natural language queries and find relevant tables">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={useAiSearch}
                                    onChange={(e) => setUseAiSearch(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 18, color: useAiSearch ? '#1A73E8' : '#9AA0A6' }} />
                                    <Typography variant="body2" sx={{ color: useAiSearch ? '#1A73E8' : '#5F6368' }}>
                                        AI Search
                                    </Typography>
                                </Box>
                            }
                        />
                    </Tooltip>
                </Box>

                <TextField
                    fullWidth
                    placeholder={useAiSearch
                        ? "e.g., 'tables with customer information' or 'sales data from last year'"
                        : "Search for tables... (e.g., customers, orders, sales)"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                {useAiSearch ? (
                                    <AutoAwesomeIcon sx={{ color: '#1A73E8' }} />
                                ) : (
                                    <SearchIcon sx={{ color: '#9AA0A6' }} />
                                )}
                            </InputAdornment>
                        ),
                        endAdornment: searching ? (
                            <CircularProgress size={20} />
                        ) : null,
                    }}
                    sx={{ mb: 2 }}
                />

                {searchIntent && (
                    <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>AI understood:</strong> {searchIntent}
                        </Typography>
                    </Alert>
                )}

                {hasSearched && searchResults.length === 0 && !searching && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No tables found. Try {useAiSearch ? 'describing what you\'re looking for differently' : 'a different search term'}.
                    </Alert>
                )}

                {searchResults.length > 0 && (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {searchResults.map((result, index) => {
                            const displayName = result.entrySource?.displayName ||
                                result.displayName ||
                                result.name?.split('/').pop() ||
                                'Unknown';
                            const fqn = result.fullyQualifiedName || '';
                            const entryType = result.entryType || result.type || 'TABLE';
                            const isView = entryType.includes('VIEW');

                            return (
                                <ListItemButton
                                    key={index}
                                    onClick={() => handleSelectEntry(result)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 1,
                                        border: '1px solid #E8EAED',
                                        '&:hover': { backgroundColor: '#F1F3F4' }
                                    }}
                                >
                                    {isView ? (
                                        <StorageIcon sx={{ mr: 2, color: '#5F6368' }} />
                                    ) : (
                                        <TableChartIcon sx={{ mr: 2, color: '#1A73E8' }} />
                                    )}
                                    <ListItemText
                                        primary={displayName}
                                        secondary={fqn.replace('bigquery:', '')}
                                        primaryTypographyProps={{ fontWeight: 500 }}
                                        secondaryTypographyProps={{
                                            sx: {
                                                fontSize: '0.75rem',
                                                color: '#5F6368',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }
                                        }}
                                    />
                                    <Chip
                                        label={isView ? 'View' : 'Table'}
                                        size="small"
                                        sx={{
                                            backgroundColor: isView ? '#E8F0FE' : '#E6F4EA',
                                            color: isView ? '#1A73E8' : '#137333'
                                        }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </Paper>

            <Typography variant="body2" sx={{ color: '#9AA0A6', textAlign: 'center' }}>
                Tip: You can also access chat directly from the table details page
            </Typography>
        </Box>
    );
};

const ChatPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const entryName = searchParams.get('entryName');
    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Related tables state
    const [relatedTables, setRelatedTables] = useState<any[]>([]);
    const [selectedRelatedTables, setSelectedRelatedTables] = useState<any[]>([]);
    const [showRelatedTables, setShowRelatedTables] = useState(false);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        const fetchEntry = async () => {
            if (!entryName) {
                // No entry provided - show table selector
                setShowSelector(true);
                setLoading(false);
                return;
            }

            if (!user?.token) {
                // Wait for auth to be ready
                return;
            }

            try {
                setLoading(true);
                const response = await axios.post(
                    `${URLS.API_URL}${URLS.GET_ENTRY}`,
                    { entryName },
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    }
                );
                setEntry(response.data);
                // Fetch related tables for the loaded entry
                fetchRelatedTables(response.data);
            } catch (err: any) {
                console.error('Error fetching entry:', err);
                setError(err.response?.data?.message || 'Failed to load entry details');
            } finally {
                setLoading(false);
            }
        };

        fetchEntry();
    }, [entryName, user?.token]);

    const handleTableSelect = (selectedEntry: any) => {
        setEntry(selectedEntry);
        setShowSelector(false);
        // Reset related tables when selecting a new table
        setRelatedTables([]);
        setSelectedRelatedTables([]);
        // Fetch related tables for the selected entry
        fetchRelatedTables(selectedEntry);
    };

    const fetchRelatedTables = async (selectedEntry: any) => {
        if (!user?.token || !selectedEntry) return;

        setLoadingRelated(true);
        try {
            // Extract dataset/project info from the entry's fully qualified name
            const fqn = selectedEntry.fullyQualifiedName || selectedEntry.name || '';
            // Format: bigquery:{project}.{dataset}.{table}
            const parts = fqn.replace('bigquery:', '').split('.');
            if (parts.length >= 2) {
                const project = parts[0];
                const dataset = parts[1];

                // Search for tables in the same dataset
                const response = await axios.post(
                    `${URLS.API_URL}${URLS.SEARCH}`,
                    { query: `${project}.${dataset}` },
                    { headers: { Authorization: `Bearer ${user.token}` } }
                );

                // Filter results to get only tables from the same dataset, excluding the current table
                const currentTableName = parts[2] || selectedEntry.entrySource?.displayName;
                const tables = (Array.isArray(response.data) ? response.data : response.data?.results || []).filter((item: any) => {
                    const itemFqn = item.fullyQualifiedName || '';
                    const isInSameDataset = itemFqn.includes(`${project}.${dataset}`);
                    const entryType = item.entryType || item.type || '';
                    const isTable = entryType.includes('TABLE') || entryType.includes('VIEW');
                    const isNotCurrentTable = !itemFqn.includes(currentTableName);
                    return isInSameDataset && isTable && isNotCurrentTable;
                }).slice(0, 10); // Limit to 10 related tables

                setRelatedTables(tables);
            }
        } catch (err) {
            console.error('Error fetching related tables:', err);
        } finally {
            setLoadingRelated(false);
        }
    };

    const toggleRelatedTable = (table: any) => {
        const tableFqn = table.fullyQualifiedName || table.name;
        const isSelected = selectedRelatedTables.some(
            t => (t.fullyQualifiedName || t.name) === tableFqn
        );

        if (isSelected) {
            setSelectedRelatedTables(prev =>
                prev.filter(t => (t.fullyQualifiedName || t.name) !== tableFqn)
            );
        } else {
            setSelectedRelatedTables(prev => [...prev, table]);
        }
    };

    const handleBackToSelector = () => {
        setEntry(null);
        setShowSelector(true);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Show table selector if no entry is selected
    if (showSelector || !entry) {
        return (
            <Box sx={{ height: '100vh', backgroundColor: '#F8FAFD', overflow: 'auto' }}>
                <TableSelector onSelect={handleTableSelect} user={user} />
            </Box>
        );
    }

    // Combine primary table with selected related tables
    const allTables = selectedRelatedTables.length > 0
        ? [entry, ...selectedRelatedTables]
        : undefined;

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFD' }}>
            {/* Header */}
            <Box sx={{ p: 2, backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {!entryName && (
                        <IconButton onClick={handleBackToSelector} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                    <TableChartIcon sx={{ color: '#1A73E8' }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                            {entry.entrySource?.displayName || entry.displayName || entry.name?.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5F6368' }}>
                            {entry.fullyQualifiedName?.replace('bigquery:', '') || ''}
                        </Typography>
                    </Box>

                    {/* Related tables toggle */}
                    {relatedTables.length > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={showRelatedTables ? <ExpandLessIcon /> : <AddIcon />}
                            onClick={() => setShowRelatedTables(!showRelatedTables)}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                borderColor: selectedRelatedTables.length > 0 ? '#1A73E8' : '#DADCE0'
                            }}
                        >
                            {selectedRelatedTables.length > 0
                                ? `${selectedRelatedTables.length} related table${selectedRelatedTables.length > 1 ? 's' : ''} added`
                                : 'Add related tables'}
                        </Button>
                    )}
                    {loadingRelated && <CircularProgress size={20} />}
                </Box>

                {/* Related tables panel */}
                <Collapse in={showRelatedTables}>
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#F8FAFD', borderRadius: '8px', border: '1px solid #E8EAED' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#1F1F1F' }}>
                            Select related tables to include in your conversation
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5F6368', display: 'block', mb: 2 }}>
                            The AI will be able to query across all selected tables to answer your questions.
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                            {relatedTables.map((table, index) => {
                                const tableFqn = table.fullyQualifiedName || table.name;
                                const isSelected = selectedRelatedTables.some(
                                    t => (t.fullyQualifiedName || t.name) === tableFqn
                                );
                                const displayName = table.entrySource?.displayName ||
                                    table.displayName ||
                                    table.name?.split('/').pop() ||
                                    'Unknown';
                                const entryType = table.entryType || table.type || 'TABLE';
                                const isView = entryType.includes('VIEW');

                                return (
                                    <ListItemButton
                                        key={index}
                                        onClick={() => toggleRelatedTable(table)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            backgroundColor: isSelected ? '#E8F0FE' : 'transparent',
                                            '&:hover': { backgroundColor: isSelected ? '#D2E3FC' : '#F1F3F4' }
                                        }}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            size="small"
                                            sx={{ p: 0.5, mr: 1 }}
                                        />
                                        {isView ? (
                                            <StorageIcon sx={{ mr: 1, color: '#5F6368', fontSize: 18 }} />
                                        ) : (
                                            <TableChartIcon sx={{ mr: 1, color: '#1A73E8', fontSize: 18 }} />
                                        )}
                                        <ListItemText
                                            primary={displayName}
                                            secondary={tableFqn.replace('bigquery:', '')}
                                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSelected ? 500 : 400 }}
                                            secondaryTypographyProps={{ fontSize: '0.7rem', color: '#5F6368' }}
                                        />
                                        <Chip
                                            label={isView ? 'View' : 'Table'}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                backgroundColor: isView ? '#E8F0FE' : '#E6F4EA',
                                                color: isView ? '#1A73E8' : '#137333'
                                            }}
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                        {selectedRelatedTables.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => setSelectedRelatedTables([])}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Clear all
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setShowRelatedTables(false)}
                                    sx={{ textTransform: 'none', backgroundColor: '#1A73E8' }}
                                >
                                    Done
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Collapse>

                {/* Selected tables chips */}
                {selectedRelatedTables.length > 0 && !showRelatedTables && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedRelatedTables.map((table, index) => {
                            const displayName = table.entrySource?.displayName ||
                                table.displayName ||
                                table.name?.split('/').pop() ||
                                'Unknown';
                            return (
                                <Chip
                                    key={index}
                                    label={displayName}
                                    size="small"
                                    onDelete={() => toggleRelatedTable(table)}
                                    sx={{
                                        backgroundColor: '#E8F0FE',
                                        color: '#1A73E8',
                                        '& .MuiChip-deleteIcon': { color: '#1A73E8' }
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}
            </Box>

            {/* Chat component */}
            <ChatTab entry={entry} tables={allTables} />
        </Box>
    );
};

export default ChatPage;
