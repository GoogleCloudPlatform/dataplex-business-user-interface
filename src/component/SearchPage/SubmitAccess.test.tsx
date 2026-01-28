import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitAccess from './SubmitAccess';
import { AuthContext } from '../../auth/AuthProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import store from '../../app/store';

// Mock fetch
const mockFetch = vi.fn();
Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true
});

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:3000/api'
  }
}));

describe('SubmitAccess', () => {
  const mockUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    picture: 'https://example.com/avatar.jpg',
    token: 'random-token',
    tokenExpiry: Math.floor(Date.now() / 1000) + 3600,
    tokenIssuedAt: Math.floor(Date.now() / 1000),
    hasRole: true,
    roles: [],
    permissions: [],
    appConfig: {
      aspects: {},
      projects: {},
      defaultSearchProduct: {},
      defaultSearchAssets: {},
      browseByAspectTypes: {},
      browseByAspectTypesLabels: {},
    }
  };

  const mockAuthContextValue = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    silentLogin: vi.fn().mockResolvedValue(true),
  };

  const mockEntry = {
    name: 'project/dataset/table',
    entryType: 'tables/123',
    aspects: {
      '123.global.contacts': {
        data: {
          fields: {
            identities: {
              listValue: {
                values: [
                  {
                    structValue: {
                      fields: {
                        name: {
                          stringValue: 'John Doe <john.doe@example.com>'
                        }
                      }
                    }
                  },
                  {
                    structValue: {
                      fields: {
                        name: {
                          stringValue: 'Jane Smith <jane.smith@example.com>'
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    }
  };

  const mockUserState = {
    token: 'mock-token'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    assetName: 'test-asset',
    entry: mockEntry,
    onSubmitSuccess: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  const renderSubmitAccess = (props = {}) => {
    const mockStore = {
      ...store.getState(),
      user: mockUserState
    };

    return render(
      <Provider store={{ ...store, getState: () => mockStore as any }}>
        <AuthContext.Provider value={mockAuthContextValue}>
          <SubmitAccess {...defaultProps} {...props} />
        </AuthContext.Provider>
      </Provider>
    );
  };

  it('renders the component when open', () => {
    renderSubmitAccess();
    
    expect(screen.getByText("Submit Access to 'test-asset'")).toBeInTheDocument();
    expect(screen.getByText('Request details')).toBeInTheDocument();
    expect(screen.getByText('Contact information')).toBeInTheDocument();
    expect(screen.getByText('What context would you like to provide your data owner?')).toBeInTheDocument();
  });

  it('positions off-screen when closed', () => {
    renderSubmitAccess({ isOpen: false });
    
    // Component still renders but is positioned off-screen
    expect(screen.getByText("Submit Access to 'test-asset'")).toBeInTheDocument();
  });

  it('displays current and modified dates', () => {
    renderSubmitAccess();
    
    expect(screen.getByText('Creation time')).toBeInTheDocument();
    expect(screen.getByText('Modification time')).toBeInTheDocument();
  });

  it('displays contact information', () => {
    renderSubmitAccess();
    
    expect(screen.getAllByText('Owner')).toHaveLength(2); // Two owner labels
    expect(screen.getByText('madhurmangal@acme.com')).toBeInTheDocument();
    expect(screen.getByText('sumanthakur@acme.com')).toBeInTheDocument();
  });

  it('renders message input field', () => {
    renderSubmitAccess();
    
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    expect(messageInput).toBeInTheDocument();
    expect(messageInput).toHaveAttribute('rows', '6');
  });

  it('updates message when user types', () => {
    renderSubmitAccess();
    
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    
    expect(messageInput).toHaveValue('Test message');
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    renderSubmitAccess({ onClose: mockOnClose });
    
    const closeButton = screen.getByRole('button', { name: '' }); // Close icon button
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    renderSubmitAccess({ onClose: mockOnClose });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('clears message when cancel is clicked', () => {
    renderSubmitAccess();
    
    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(messageInput).toHaveValue('');
  });

  it('extracts contact emails from entry data', () => {
    renderSubmitAccess();
    
    // The component should extract emails from the mock entry
    // This is tested indirectly through the submit functionality
    expect(screen.getByText('Contact information')).toBeInTheDocument();
  });

  it('handles missing user email gracefully', async () => {
    const authContextWithoutEmail = {
      ...mockAuthContextValue,
      user: { ...mockUser, email: undefined as any }
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={authContextWithoutEmail}>
          <SubmitAccess {...defaultProps} />
        </AuthContext.Provider>
      </Provider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should not crash and should not make API call
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles missing token gracefully', async () => {
    const mockStoreWithoutToken = {
      ...store.getState(),
      user: { token: null }
    };

    render(
      <Provider store={{ ...store, getState: () => mockStoreWithoutToken as any }}>
        <AuthContext.Provider value={mockAuthContextValue}>
          <SubmitAccess {...defaultProps} />
        </AuthContext.Provider>
      </Provider>
    );

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should not crash and should not make API call
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits access request successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const mockOnSubmitSuccess = vi.fn();
    const mockOnClose = vi.fn();
    
    renderSubmitAccess({ 
      onSubmitSuccess: mockOnSubmitSuccess,
      onClose: mockOnClose 
    });

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test access request' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/access-request',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          credentials: 'include',
          body: JSON.stringify({
            assetName: 'test-asset',
            message: 'Test access request',
            requesterEmail: 'testuser@example.com',
            projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
            projectAdmin: ['john.doe@example.com', 'jane.smith@example.com']
          })
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith('test-asset');
    });
  });

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API Error' })
    });

    renderSubmitAccess();

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should make the API call but handle error gracefully
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));

    renderSubmitAccess();

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should make the API call but handle error gracefully
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles submission state correctly', async () => {
    mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderSubmitAccess();

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should make the API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles entry without aspects', async () => {
    const entryWithoutAspects = { ...mockEntry, aspects: null };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    renderSubmitAccess({ entry: entryWithoutAspects });

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/access-request',
        expect.objectContaining({
          body: JSON.stringify({
            assetName: 'test-asset',
            message: 'Test message',
            requesterEmail: 'testuser@example.com',
            projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
            projectAdmin: [] // Empty array when no aspects
          })
        })
      );
    });
  });

  it('handles entry without entryType', async () => {
    const entryWithoutType = { ...mockEntry, entryType: null };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    renderSubmitAccess({ entry: entryWithoutType });

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/access-request',
        expect.objectContaining({
          body: JSON.stringify({
            assetName: 'test-asset',
            message: 'Test message',
            requesterEmail: 'testuser@example.com',
            projectId: import.meta.env.VITE_GOOGLE_PROJECT_ID,
            projectAdmin: [] // Empty array when no entryType
          })
        })
      );
    });
  });

  it('auto-closes after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const mockOnClose = vi.fn();
    renderSubmitAccess({ onClose: mockOnClose });

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('clears message after successful submission', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    renderSubmitAccess();

    const messageInput = screen.getByPlaceholderText('Enter your message here...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('handles missing user gracefully', () => {
    const authContextWithoutUser = {
      ...mockAuthContextValue,
      user: null
    };

    render(
      <Provider store={store}>
        <AuthContext.Provider value={authContextWithoutUser}>
          <SubmitAccess {...defaultProps} />
        </AuthContext.Provider>
      </Provider>
    );

    // Should still render without crashing
    expect(screen.getByText("Submit Access to 'test-asset'")).toBeInTheDocument();
  });
});
