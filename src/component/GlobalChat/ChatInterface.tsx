import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VegaEmbed } from 'react-vega';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

// Markdown styles for tables and code blocks
const markdownStyles = {
    '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        marginTop: '12px',
        marginBottom: '12px',
        fontSize: '14px',
    },
    '& th, & td': {
        border: '1px solid #DADCE0',
        padding: '8px 12px',
        textAlign: 'left',
    },
    '& th': {
        backgroundColor: '#F1F3F4',
        fontWeight: 600,
    },
    '& tr:nth-of-type(even)': {
        backgroundColor: '#F8F9FA',
    },
    '& code': {
        backgroundColor: '#F1F3F4',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '13px',
    },
    '& pre': {
        backgroundColor: '#1E1E1E',
        color: '#D4D4D4',
        padding: '12px',
        borderRadius: '8px',
        overflowX: 'auto',
        '& code': {
            backgroundColor: 'transparent',
            padding: 0,
            color: 'inherit',
        },
    },
    '& p': {
        margin: '8px 0',
    },
    '& ul, & ol': {
        paddingLeft: '20px',
    },
};

interface ChatInterfaceProps {
    entry?: any; // The primary table/entry context
    mode?: 'embedded' | 'global'; // 'embedded' hides sidebar/extra controls, 'global' allows multi-table
    initialTables?: any[]; // For global chat initial selection
    headerAction?: React.ReactNode;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    chart?: any; // Vega-Lite spec object from API
    data?: any[]; // Raw data rows from API
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ entry, mode = 'global', headerAction, initialTables }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleOpenGlobalChat = () => {
        // Navigate to global chat with this entry pre-selected
        // This might require updating GlobalChatPage to handle state/URL params
        // For now, we can pass it via state or just navigate
        navigate('/global-chat', { state: { selectedTable: entry } });
    };

    const handleAsk = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);
        setError(null);

        // Add user message to UI immediately
        const userMsg: Message = {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            let contextData: any;

            // Determine if we're in multi-table mode (Global Chat with initialTables)
            const activeTables = initialTables && initialTables.length > 0 ? initialTables : null;
            const isMultiTable = activeTables && activeTables.length > 0;

            if (isMultiTable) {
                // Multi-table mode: build context from selected tables
                const tablesContext = activeTables.map((t: any) => ({
                    name: t.entrySource?.displayName || t.displayName || t.name?.split('/').pop() || 'Unknown Table',
                    fullyQualifiedName: t.fullyQualifiedName || t.name || '',
                    type: t.entryType || t.type || 'Table',
                    description: t.entrySource?.description || t.description || ''
                }));

                const primaryTable = activeTables[0];
                const primaryName = primaryTable.entrySource?.displayName || primaryTable.displayName || primaryTable.name?.split('/').pop() || 'Selected Tables';
                const primaryFqn = primaryTable.fullyQualifiedName || primaryTable.name || '';

                contextData = {
                    name: activeTables.length > 1 ? `${primaryName} + ${activeTables.length - 1} related tables` : primaryName,
                    description: primaryTable.entrySource?.description || primaryTable.description || "Multi-table conversation",
                    isDataProduct: true, // Enable multi-table handling in backend
                    tables: tablesContext,
                    fullyQualifiedName: primaryFqn,
                    entryType: 'MULTI_TABLE',
                    conversationId: conversationId
                };
            } else {
                // Single table context extraction
                let schema: any[] = [];

                // Try to extract schema from aspects
                if (entry?.aspects) {
                    const aspectKeys = Object.keys(entry.aspects);
                    const schemaKey = aspectKeys.find(key => key.includes('schema') || key.includes('Schema'));

                    if (schemaKey) {
                        const schemaAspect = entry.aspects[schemaKey];
                        if (schemaAspect?.data?.fields) {
                            if (schemaAspect.data.fields.fields?.listValue?.values) {
                                schema = schemaAspect.data.fields.fields.listValue.values;
                            } else if (Array.isArray(schemaAspect.data.fields)) {
                                schema = schemaAspect.data.fields;
                            } else if (schemaAspect.data.fields.fields) {
                                schema = Array.isArray(schemaAspect.data.fields.fields)
                                    ? schemaAspect.data.fields.fields
                                    : Object.values(schemaAspect.data.fields.fields);
                            }
                        }
                    }
                }

                // Format schema for better AI understanding
                const formattedSchema = schema.map((field: any) => {
                    if (typeof field === 'string') return field;
                    return {
                        name: field.name || field.stringValue || field.displayName || 'unknown',
                        type: field.type || field.dataType || 'unknown',
                        description: field.description || ''
                    };
                });

                contextData = {
                    name: entry?.entrySource?.displayName || entry?.displayName || entry?.name || 'Unknown',
                    description: entry?.entrySource?.description || entry?.description || "No description available.",
                    schema: formattedSchema,
                    fullyQualifiedName: entry?.fullyQualifiedName || entry?.name || '',
                    entryType: entry?.entryType || entry?.entrySource?.system || 'Unknown',
                    conversationId: conversationId
                };
            }

            // 2. Call the Backend
            const res = await axios.post(`${URLS.API_URL}${URLS.CHAT}`, {
                message: userMessage,
                context: contextData
            }, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });

            // Update conversation ID for stateful mode
            if (res.data.conversationId) {
                setConversationId(res.data.conversationId);
            }

            // Add assistant response to UI
            const assistantMsg: Message = {
                role: 'assistant',
                content: res.data.reply || 'No response received.',
                timestamp: new Date(),
                chart: res.data.chart || null,
                data: res.data.data || null
            };
            setMessages(prev => [...prev, assistantMsg]);

        } catch (e: any) {
            console.error('Chat error:', e);
            const errorMessage = e?.response?.data?.error || e?.message || "Error communicating with Conversational Analytics API.";
            setError(errorMessage);

            const errorMsg: Message = {
                role: 'assistant',
                content: `Error: ${errorMessage}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        setConversationId(null);
        setError(null);
    };

    return (
        <Box sx={{
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #DADCE0'
        }}>
            {/* Header Area */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ color: '#1F1F1F', fontSize: '1.rem', fontWeight: 500 }}>
                            Chat with {entry?.entrySource?.displayName || 'Table'}
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#575757', mt: 0.5 }}>
                        Ask natural language questions about this table's data.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {mode === 'embedded' && (
                        <Button
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            onClick={handleOpenGlobalChat}
                            size="small"
                            sx={{ color: '#0B57D0', borderColor: '#0B57D0', textTransform: 'none' }}
                        >
                            Open in Global Chat
                        </Button>
                    )}
                    {headerAction}
                </Box>
            </Box>

            {/* Chat Messages Area */}
            <Box
                ref={chatContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    mb: 2,
                    p: 2,
                    backgroundColor: '#F8FAFD',
                    borderRadius: '8px',
                    border: '1px solid #DADCE0',
                    minHeight: '300px',
                    maxHeight: '600px'
                }}
            >
                {messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, color: '#575757' }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Start a conversation by asking a question about this table.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
                            Example: "What columns does this table have?" or "Show me the top 10 rows"
                        </Typography>
                    </Box>
                ) : (
                    messages.map((msg, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    mb: 1
                                }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        maxWidth: '85%',
                                        backgroundColor: msg.role === 'user' ? '#0E4DCA' : '#ffffff',
                                        color: msg.role === 'user' ? '#ffffff' : '#1F1F1F',
                                        borderRadius: '8px',
                                        border: msg.role === 'assistant' ? '1px solid #DADCE0' : 'none',
                                        ...(msg.role === 'assistant' ? markdownStyles : {})
                                    }}
                                >
                                    {msg.role === 'assistant' ? (
                                        <>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                            {msg.chart && (
                                                <Box sx={{ mt: 2, width: '100%', minHeight: 100, backgroundColor: '#fff', p: 1, borderRadius: 1, border: '1px solid #eee' }}>
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#5F6368', fontSize: '0.75rem', fontWeight: 600 }}>
                                                        Visual Analysis
                                                    </Typography>
                                                    <Box sx={{ width: '100%', overflow: 'auto' }}>
                                                        <VegaEmbed spec={msg.chart} />
                                                    </Box>
                                                </Box>
                                            )}
                                        </>
                                    ) : (
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                            {msg.content}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: 'block',
                                            mt: 1,
                                            opacity: 0.7,
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        {msg.timestamp.toLocaleTimeString()}
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    ))
                )}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                border: '1px solid #DADCE0'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" sx={{ color: '#575757' }}>
                                    Thinking...
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Ask a question..."
                        placeholder="e.g., What columns does this table have? Show me sample data."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !loading && handleAsk()}
                        disabled={loading}
                        multiline
                        maxRows={3}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#fff'
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                            variant="contained"
                            onClick={handleAsk}
                            disabled={loading || !input.trim()}
                            startIcon={!loading && <SendIcon />}
                            sx={{ backgroundColor: '#0E4DCA', minWidth: '100px' }}
                        >
                            Send
                        </Button>
                        <Button
                            variant="text"
                            onClick={handleClearChat}
                            disabled={loading}
                            size="small"
                            sx={{ minWidth: '100px', color: '#5F6368' }}
                        >
                            Clear
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ChatInterface;
