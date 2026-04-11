import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Typography, TextField, InputAdornment, CircularProgress,
    Checkbox, Chip, IconButton, Collapse, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TableChartIcon from '@mui/icons-material/TableChart';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';

interface TableEntry {
    name: string;
    displayName: string;
    fullyQualifiedName: string;
    entryType: string;
    description: string;
    dataset: string;
    entrySource?: {
        displayName: string;
        description: string;
        system: string;
    };
}

interface AccessibleTablesPanelProps {
    selectedTables: TableEntry[];
    onSelectionChange: (tables: TableEntry[]) => void;
    compact?: boolean;
}

const AccessibleTablesPanel: React.FC<AccessibleTablesPanelProps> = ({
    selectedTables,
    onSelectionChange,
    compact = false
}) => {
    const { user } = useAuth();
    const [tables, setTables] = useState<TableEntry[]>([]);
    const [groupedTables, setGroupedTables] = useState<Record<string, TableEntry[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [expandedDatasets, setExpandedDatasets] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchTables = async () => {
            if (!user?.token) return;

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(
                    `${URLS.API_URL}${URLS.ACCESSIBLE_TABLES}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                            'x-user-email': user.email || ''
                        }
                    }
                );
                setTables(response.data.tables || []);
                setGroupedTables(response.data.groupedByDataset || {});
                // Auto-expand first dataset
                const datasets = Object.keys(response.data.groupedByDataset || {});
                if (datasets.length > 0) {
                    setExpandedDatasets(new Set(datasets.slice(0, 3)));
                }
            } catch (err: any) {
                console.error('[AccessibleTablesPanel] Error:', err);
                setError(err.response?.data?.error || 'Failed to load tables');
            } finally {
                setLoading(false);
            }
        };

        fetchTables();
    }, [user?.token, user?.email]);

    const filteredGrouped = useMemo(() => {
        if (!searchFilter.trim()) return groupedTables;

        const filter = searchFilter.toLowerCase();
        const result: Record<string, TableEntry[]> = {};
        Object.entries(groupedTables).forEach(([dataset, tables]) => {
            const filtered = tables.filter(t =>
                t.displayName.toLowerCase().includes(filter) ||
                t.fullyQualifiedName.toLowerCase().includes(filter) ||
                t.description?.toLowerCase().includes(filter)
            );
            if (filtered.length > 0) result[dataset] = filtered;
        });
        return result;
    }, [groupedTables, searchFilter]);

    const toggleDataset = (dataset: string) => {
        setExpandedDatasets(prev => {
            const next = new Set(prev);
            if (next.has(dataset)) next.delete(dataset);
            else next.add(dataset);
            return next;
        });
    };

    const isSelected = (table: TableEntry) =>
        selectedTables.some(t => t.fullyQualifiedName === table.fullyQualifiedName);

    const toggleTable = (table: TableEntry) => {
        if (isSelected(table)) {
            onSelectionChange(selectedTables.filter(t => t.fullyQualifiedName !== table.fullyQualifiedName));
        } else {
            onSelectionChange([...selectedTables, table]);
        }
    };

    const panelWidth = compact ? '100%' : '280px';

    return (
        <Box sx={{
            width: panelWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRight: compact ? 'none' : '1px solid #DADCE0',
            backgroundColor: '#fff'
        }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #DADCE0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1F1F1F', mb: 0.5 }}>
                    Available Tables
                </Typography>
                <Typography variant="caption" sx={{ color: '#5F6368', display: 'block', mb: 1.5 }}>
                    Select tables to include in your queries
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="Filter tables..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ fontSize: 18, color: '#9AA0A6' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchFilter ? (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchFilter('')}>
                                    <CloseIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </InputAdornment>
                        ) : null
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' } }}
                />
            </Box>

            {/* Selected chips */}
            {selectedTables.length > 0 && (
                <Box sx={{ p: 1, borderBottom: '1px solid #DADCE0', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedTables.map((table) => (
                        <Chip
                            key={table.fullyQualifiedName}
                            label={table.displayName}
                            size="small"
                            onDelete={() => toggleTable(table)}
                            sx={{
                                backgroundColor: '#E8F0FE',
                                color: '#1967D2',
                                fontSize: '11px',
                                height: '24px',
                                '& .MuiChip-deleteIcon': { color: '#1967D2', fontSize: 14 }
                            }}
                        />
                    ))}
                </Box>
            )}

            {/* Tables list */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Typography variant="body2" sx={{ p: 2, color: '#D93025', textAlign: 'center' }}>
                        {error}
                    </Typography>
                ) : Object.keys(filteredGrouped).length === 0 ? (
                    <Typography variant="body2" sx={{ p: 2, color: '#5F6368', textAlign: 'center' }}>
                        {searchFilter ? 'No tables match your filter' : 'No accessible tables found'}
                    </Typography>
                ) : (
                    Object.entries(filteredGrouped).map(([dataset, datasetTables]) => (
                        <Box key={dataset} sx={{ mb: 1 }}>
                            {/* Dataset header */}
                            <Box
                                onClick={() => toggleDataset(dataset)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    p: 1,
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    '&:hover': { backgroundColor: '#F1F3F4' }
                                }}
                            >
                                {expandedDatasets.has(dataset) ? (
                                    <ExpandLessIcon sx={{ fontSize: 18, color: '#5F6368' }} />
                                ) : (
                                    <ExpandMoreIcon sx={{ fontSize: 18, color: '#5F6368' }} />
                                )}
                                <StorageIcon sx={{ fontSize: 16, color: '#5F6368' }} />
                                <Typography variant="caption" sx={{
                                    fontWeight: 600,
                                    color: '#3C4043',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: '11px'
                                }}>
                                    {dataset}
                                </Typography>
                                <Chip
                                    label={datasetTables.length}
                                    size="small"
                                    sx={{ height: 18, fontSize: '10px', backgroundColor: '#E8EAED' }}
                                />
                            </Box>

                            {/* Tables in dataset */}
                            <Collapse in={expandedDatasets.has(dataset)}>
                                <Box sx={{ pl: 1 }}>
                                    {datasetTables.map((table) => {
                                        const selected = isSelected(table);
                                        const isView = table.entryType === 'View';
                                        return (
                                            <Paper
                                                key={table.fullyQualifiedName}
                                                elevation={0}
                                                onClick={() => toggleTable(table)}
                                                sx={{
                                                    p: 1,
                                                    mb: 0.5,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    border: selected ? '2px solid #1967D2' : '1px solid #E8EAED',
                                                    backgroundColor: selected ? '#E8F0FE' : '#fff',
                                                    borderRadius: '6px',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': {
                                                        borderColor: '#1967D2',
                                                        backgroundColor: selected ? '#E8F0FE' : '#F8F9FA'
                                                    }
                                                }}
                                            >
                                                <Checkbox
                                                    checked={selected}
                                                    size="small"
                                                    sx={{ p: 0.25 }}
                                                />
                                                {isView ? (
                                                    <StorageIcon sx={{ fontSize: 16, color: '#5F6368' }} />
                                                ) : (
                                                    <TableChartIcon sx={{ fontSize: 16, color: '#1A73E8' }} />
                                                )}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{
                                                        fontSize: '12px',
                                                        fontWeight: selected ? 600 : 400,
                                                        color: selected ? '#1967D2' : '#1F1F1F',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {table.displayName}
                                                    </Typography>
                                                    {table.description && (
                                                        <Typography variant="caption" sx={{
                                                            fontSize: '10px',
                                                            color: '#5F6368',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            display: 'block'
                                                        }}>
                                                            {table.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Collapse>
                        </Box>
                    ))
                )}
            </Box>

            {/* Footer with count */}
            <Box sx={{
                p: 1.5,
                borderTop: '1px solid #DADCE0',
                backgroundColor: '#F8FAFD',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="caption" sx={{ color: '#5F6368' }}>
                    {tables.length} table{tables.length !== 1 ? 's' : ''} available
                </Typography>
                {selectedTables.length > 0 && (
                    <Typography variant="caption" sx={{ color: '#1967D2', fontWeight: 500 }}>
                        {selectedTables.length} selected
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default AccessibleTablesPanel;
