import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VegaEmbed } from 'react-vega';
import { URLS } from '../../constants/urls';
import { useAuth } from '../../auth/AuthProvider';

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

interface ChatTabProps {
  entry?: any; // Optional for Global Chat mode
  tables?: any[]; // Optional list of tables for Data Products/Datasets
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chart?: any; // Vega-Lite spec object from API
  data?: any[]; // Raw data rows from API
}

interface RelatedTable {
  name: string;
  displayName: string;
  fullyQualifiedName: string;
  entryType?: string;
  description?: string;
}

const ChatTab: React.FC<ChatTabProps> = ({ entry, tables }) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null); // For stateful conversations
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Related Tables state
  const [showRelatedTables, setShowRelatedTables] = useState(false);
  const [relatedTables, setRelatedTables] = useState<RelatedTable[]>([]);
  const [selectedRelatedTables, setSelectedRelatedTables] = useState<RelatedTable[]>([]);
  const [loadingRelatedTables, setLoadingRelatedTables] = useState(false);

  // Fetch related tables from the same dataset when panel opens
  useEffect(() => {
    const fetchRelatedTables = async () => {
      if (!showRelatedTables || !entry || !user?.token) return;
      if (relatedTables.length > 0) return; // Already fetched

      setLoadingRelatedTables(true);
      try {
        // Extract dataset info from entry's FQN
        const fqn = entry.fullyQualifiedName || entry.name || '';
        let datasetPath = '';

        // Parse FQN to get project and dataset
        if (fqn.includes('bigquery:')) {
          // Format: bigquery:project.dataset.table
          const parts = fqn.replace('bigquery:', '').split('.');
          if (parts.length >= 2) {
            datasetPath = `${parts[0]}.${parts[1]}`;
          }
        }

        if (!datasetPath) {
          console.log('[ChatTab] Could not extract dataset from FQN:', fqn);
          setLoadingRelatedTables(false);
          return;
        }

        // Search for tables in the same dataset
        const response = await axios.post(`${URLS.API_URL}${URLS.SEARCH}`, {
          query: datasetPath,
          pageSize: 50
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        // Filter to only tables and exclude current entry
        const currentName = entry?.name || '';
        const tableResults = (response.data?.results || [])
          .filter((r: any) => {
            const isTable = r.dataplexEntry?.entryType?.toLowerCase().includes('table');
            const isDifferent = r.dataplexEntry?.name !== currentName;
            return isTable && isDifferent;
          })
          .map((r: any) => ({
            name: r.dataplexEntry?.name || '',
            displayName: r.dataplexEntry?.entrySource?.displayName || r.dataplexEntry?.name?.split('/').pop() || 'Unknown',
            fullyQualifiedName: r.dataplexEntry?.fullyQualifiedName || '',
            entryType: r.dataplexEntry?.entryType,
            description: r.dataplexEntry?.entrySource?.description || ''
          }));

        setRelatedTables(tableResults);
        console.log('[ChatTab] Found related tables:', tableResults.length);
      } catch (err) {
        console.error('[ChatTab] Error fetching related tables:', err);
      } finally {
        setLoadingRelatedTables(false);
      }
    };

    fetchRelatedTables();
  }, [showRelatedTables, entry, user?.token, relatedTables.length]);

  const toggleRelatedTable = (table: RelatedTable) => {
    setSelectedRelatedTables(prev => {
      const isSelected = prev.some(t => t.name === table.name);
      if (isSelected) {
        return prev.filter(t => t.name !== table.name);
      } else {
        return [...prev, table];
      }
    });
  };

  // Combine entry with selected related tables for multi-table chat
  const effectiveTables = useMemo(() => {
    if (tables && tables.length > 0) return tables; // Use provided tables if available

    const baseTables = entry ? [entry] : [];
    if (selectedRelatedTables.length > 0) {
      return [...baseTables, ...selectedRelatedTables.map(t => ({
        entrySource: { displayName: t.displayName, description: t.description },
        fullyQualifiedName: t.fullyQualifiedName,
        name: t.name,
        entryType: t.entryType
      }))];
    }
    return baseTables.length > 0 ? baseTables : undefined; // Single table mode
  }, [entry, tables, selectedRelatedTables]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // Check if this is a Data Product or if multiple tables are selected (including related tables)
      const activeTables = effectiveTables || tables;
      const hasMultipleTables = activeTables && activeTables.length > 1;
      // Global Chat mode: tables provided without entry — always use multi-table path
      const isGlobalChat = !entry && activeTables && activeTables.length > 0;
      const isDataProduct = entry?._isDataProduct || entry?.entryType === 'DATA_PRODUCT' || hasMultipleTables || isGlobalChat;

      let contextData: any;

      if (isDataProduct || hasMultipleTables || isGlobalChat) {
        // Prepare context for all tables
        // Use effectiveTables (which includes selected related tables) or tables prop
        const tableList = activeTables || (entry?._dataProduct?.tables) || (entry ? [entry] : []);

        const tablesContext = tableList.map((t: any) => {
          // Handle structure from resourcesEntryList (dataplexEntry) or direct table object
          const tableObj = t.dataplexEntry || t;
          return {
            name: tableObj.entrySource?.displayName || tableObj.displayName || tableObj.entryName || tableObj.name?.split('/').pop() || 'Unknown Table',
            fullyQualifiedName: tableObj.fullyQualifiedName || tableObj.name || '',
            // If it's from resourcesEntryList, it might be nested
            type: tableObj.entryType || tableObj.type || 'Table',
            description: tableObj.entrySource?.description || tableObj.description || ''
          };
        });

        // For multi-table chat, use the first table as the primary context
        const primaryTable = tableList[0];
        const primaryName = primaryTable.entrySource?.displayName || primaryTable.displayName || primaryTable.name?.split('/').pop() || 'Selected Tables';
        // Use the first table's FQN when entry is not available (Global Chat mode)
        const primaryFqn = entry?.fullyQualifiedName || entry?.name || primaryTable.fullyQualifiedName || primaryTable.name || '';

        contextData = {
          name: hasMultipleTables ? `${primaryName} + ${tableList.length - 1} related tables` : primaryName,
          description: entry?.entrySource?.description || entry?.description || "Multi-table conversation",
          isDataProduct: true, // Enable multi-table handling in backend
          tables: tablesContext,
          fullyQualifiedName: primaryFqn,
          entryType: isDataProduct ? 'DATA_PRODUCT' : 'MULTI_TABLE',
          conversationId: conversationId // Stateful mode - Google manages history
        };
      } else {
        // For regular tables/entries, extract schema as before
        let schema: any[] = [];

        // Try to extract schema from aspects
        if (entry?.aspects) {
          const aspectKeys = Object.keys(entry.aspects);
          const schemaKey = aspectKeys.find(key => key.includes('schema') || key.includes('Schema'));

          if (schemaKey) {
            const schemaAspect = entry.aspects[schemaKey];
            // Handle different schema formats
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
          conversationId: conversationId // Stateful mode - Google manages history
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

      // Build reply content — append table suggestions if permission was denied
      let replyContent = res.data.reply || 'No response received.';
      if (res.data.permissionDenied && res.data.suggestions?.length > 0) {
        replyContent += '\n\n**Suggested tables you may have access to:**\n';
        res.data.suggestions.forEach((s: any) => {
          replyContent += `\n- **${s.displayName || s.name}**${s.description ? ': ' + s.description : ''}`;
        });
      }

      // Add assistant response to UI
      const assistantMsg: Message = {
        role: 'assistant',
        content: replyContent,
        timestamp: new Date(),
        chart: res.data.chart || null,
        data: res.data.data || null
      };
      setMessages(prev => [...prev, assistantMsg]);

    } catch (e: any) {
      console.error('Chat error:', e);
      const errorMessage = e?.response?.data?.error || e?.message || "Error communicating with Conversational Analytics API. Please check if the API is enabled and permissions are granted.";
      setError(errorMessage);

      // Add error message to chat
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
    setConversationId(null); // Reset for new conversation
    setError(null);
  };

  return (
    <Box sx={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'row', gap: 2 }}>
      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: '#1F1F1F' }}>
              Conversational Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: '#575757' }}>
              {effectiveTables && effectiveTables.length > 1
                ? `Querying ${effectiveTables.length} tables. The AI can analyze data across all selected tables.`
                : 'Ask natural language questions about this table\'s data. Powered by Google Cloud Conversational Analytics API.'}
            </Typography>
          </Box>
          {/* Toggle Related Tables Button */}
          {!tables && (
            <Button
              variant={showRelatedTables ? "contained" : "outlined"}
              size="small"
              onClick={() => setShowRelatedTables(!showRelatedTables)}
              sx={{
                minWidth: 'auto',
                textTransform: 'none',
                backgroundColor: showRelatedTables ? '#E8F0FE' : 'transparent',
                color: showRelatedTables ? '#1967D2' : '#5F6368',
                border: '1px solid #DADCE0',
                '&:hover': {
                  backgroundColor: '#E8F0FE'
                }
              }}
            >
              {showRelatedTables ? 'Hide' : 'Add'} Related Tables
            </Button>
          )}
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
            minHeight: '400px',
            maxHeight: '600px'
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#575757' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {tables && tables.length > 1
                  ? 'Start a conversation by asking a question about your selected tables.'
                  : 'Start a conversation by asking a question about this table.'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#9AA0A6' }}>
                {tables && tables.length > 1
                  ? 'Example: "Join customers and orders to show total orders per customer" or "Compare sales across both tables"'
                  : 'Example: "What columns does this table have?" or "Show me the top 10 rows"'}
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
                      maxWidth: '80%',
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

                        {/* Render Vega-Lite Chart if present */}
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
              placeholder={tables && tables.length > 1
                ? "e.g., Join these tables to show..., Compare data across tables..."
                : "e.g., What columns does this table have? Show me sample data."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && !loading && handleAsk()}
              disabled={loading}
              multiline
              maxRows={3}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleAsk}
                disabled={loading || !input.trim()}
                startIcon={!loading && <SendIcon />}
                sx={{ backgroundColor: '#0E4DCA', minWidth: '120px' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearChat}
                disabled={loading}
                size="small"
                sx={{ minWidth: '120px' }}
              >
                Clear Chat
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Related Tables Sidebar */}
      {showRelatedTables && !tables && (
        <Box sx={{
          width: '280px',
          flexShrink: 0,
          borderLeft: '1px solid #DADCE0',
          backgroundColor: '#F8FAFD',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #DADCE0', backgroundColor: '#fff' }}>
            <Typography variant="subtitle2" sx={{ color: '#1F1F1F', fontWeight: 600 }}>
              Related Tables
            </Typography>
            <Typography variant="caption" sx={{ color: '#5F6368' }}>
              Select tables to include in your queries
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {loadingRelatedTables ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : relatedTables.length === 0 ? (
              <Typography variant="body2" sx={{ p: 2, color: '#5F6368', textAlign: 'center' }}>
                No other tables found in this dataset
              </Typography>
            ) : (
              relatedTables.map((table, idx) => {
                const isSelected = selectedRelatedTables.some(t => t.name === table.name);
                return (
                  <Paper
                    key={idx}
                    elevation={0}
                    onClick={() => toggleRelatedTable(table)}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #1967D2' : '1px solid #DADCE0',
                      backgroundColor: isSelected ? '#E8F0FE' : '#fff',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#1967D2',
                        backgroundColor: isSelected ? '#E8F0FE' : '#F1F3F4'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#1967D2' : '#1F1F1F',
                      fontSize: '13px'
                    }}>
                      {table.displayName}
                    </Typography>
                    {table.description && (
                      <Typography variant="caption" sx={{
                        color: '#5F6368',
                        display: 'block',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {table.description}
                      </Typography>
                    )}
                  </Paper>
                );
              })
            )}
          </Box>
          {selectedRelatedTables.length > 0 && (
            <Box sx={{ p: 1.5, borderTop: '1px solid #DADCE0', backgroundColor: '#fff' }}>
              <Typography variant="caption" sx={{ color: '#1967D2', fontWeight: 500 }}>
                {selectedRelatedTables.length} table{selectedRelatedTables.length > 1 ? 's' : ''} selected
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ChatTab;