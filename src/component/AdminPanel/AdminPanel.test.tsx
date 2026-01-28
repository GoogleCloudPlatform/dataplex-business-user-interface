import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminPanel from './AdminPanel';
import { AuthContext } from '../../auth/AuthProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../../app/store';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the MultiSelect component
vi.mock('../MultiSelect/MultiSelect', () => ({
  default: function MockMultiSelect({ label, placeholder, value, onChange, options }: any) {
    return (
      <div data-testid={`multiselect-${label.toLowerCase().replace(' ', '-')}`}>
        <label>{label}</label>
        <input 
          data-testid={`${label.toLowerCase().replace(' ', '-')}-input`}
          placeholder={placeholder}
          value={value.join(', ')}
          onChange={(e) => onChange(e.target.value.split(', ').filter(Boolean))}
        />
        <div data-testid={`${label.toLowerCase().replace(' ', '-')}-options`}>
          {options.map((option: string) => (
            <div key={option} data-testid={`option-${option}`}>
              {option}
            </div>
          ))}
        </div>
      </div>
    );
  }
}));

describe('AdminPanel', () => {
  const mockUser = {
    name: 'Test User',
    email: 'testuser@sample.com',
    picture: 'https://example.com/avatar.jpg',
    token: 'random-token',
    tokenExpiry: Math.floor(Date.now() / 1000) + 3600,
    tokenIssuedAt: Math.floor(Date.now() / 1000),
    hasRole: true,
    roles: [],
    permissions: [],
    appConfig: {
      aspects: [
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Tables',
              resource: 'table-resource-1'
            }
          }
        },
        {
          dataplexEntry: {
            entrySource: {
              displayName: 'Datasets',
              resource: 'dataset-resource-1'
            }
          }
        }
      ],
      projects: {},
      defaultSearchProduct: ['BigQuery'],
      defaultSearchAssets: { 'BigQuery': ['Tables', 'Views'] },
      browseByAspectTypes: { 'Tables': ['Schema', 'Data Quality'] },
      browseByAspectTypesLabels: ['Tables', 'Datasets'],
    }
  };

  const mockAuthContextValue = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    silentLogin: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful axios responses for initial load
    mockedAxios.post.mockResolvedValue({
      data: {
        'Tables': ['Schema', 'Data Quality', 'Lineage'],
        'Datasets': ['Schema', 'Data Quality']
      }
    });
  });

  const renderAdminPanel = () => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContextValue}>
            <AdminPanel />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders the admin panel with title and back button', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });

  it('renders default search section with products multiselect', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByText('Default Search')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('multiselect-products')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Products')).toBeInTheDocument();
  });

  it('renders default browse section with aspect type multiselect', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByText('Default Browse')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('multiselect-aspect-type')).toBeInTheDocument();
    expect(screen.getByText('Aspect Type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select Aspect Type')).toBeInTheDocument();
  });

  it('renders action buttons (Clear and Save)', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('navigates back to home when back button is clicked', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      const backButton = screen.getByLabelText('Go back');
      fireEvent.click(backButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('opens confirmation modal when save button is clicked', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure saving these configurations?')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('closes confirmation modal when No button is clicked', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    const noButton = screen.getByText('No');
    fireEvent.click(noButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });
  });

  it('clears all selections when Clear button is clicked', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    // Check that the multiselect inputs are cleared
    const productsInput = screen.getByTestId('products-input');
    const aspectTypeInput = screen.getByTestId('aspect-type-input');
    
    expect(productsInput).toHaveValue('');
    expect(aspectTypeInput).toHaveValue('');
  });

  it('shows success modal after successful save', async () => {
    // Mock both the initial load and the save call to succeed
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          'Tables': ['Schema', 'Data Quality', 'Lineage'],
          'Datasets': ['Schema', 'Data Quality']
        }
      })
      .mockResolvedValueOnce({ data: { success: true } });
    
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('shows error modal after failed save', async () => {
    // Mock the initial axios call to succeed, but the save call to fail
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          'Tables': ['Schema', 'Data Quality', 'Lineage'],
          'Datasets': ['Schema', 'Data Quality']
        }
      })
      .mockRejectedValueOnce(new Error('API Error'));
    
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Error saving configuration. Please try again.')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('navigates to home after successful save acknowledgment', async () => {
    // Mock both the initial load and the save call to succeed
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          'Tables': ['Schema', 'Data Quality', 'Lineage'],
          'Datasets': ['Schema', 'Data Quality']
        }
      })
      .mockResolvedValueOnce({ data: { success: true } });
    
    renderAdminPanel();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  it('calls updateUser after successful save', async () => {
    // Mock both the initial load and the save call to succeed
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          'Tables': ['Schema', 'Data Quality', 'Lineage'],
          'Datasets': ['Schema', 'Data Quality']
        }
      })
      .mockResolvedValueOnce({ data: { success: true } });
    
    const mockUpdateUser = vi.fn();
    const authContextWithUpdateUser = {
      ...mockAuthContextValue,
      updateUser: mockUpdateUser
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextWithUpdateUser}>
            <AdminPanel />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    const yesButton = screen.getByText('Yes');
    fireEvent.click(yesButton);
    
    await waitFor(() => {
      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);
    });
    
    expect(mockUpdateUser).toHaveBeenCalled();
  });

  it('displays loading spinner initially', () => {
    renderAdminPanel();
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('loads aspect type options from user config', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/batch-aspects'),
        { entryNames: ['table-resource-1', 'dataset-resource-1'] },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer random-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  it('handles missing user data gracefully', () => {
    const authContextWithoutUser = {
      ...mockAuthContextValue,
      user: null
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextWithoutUser}>
            <AdminPanel />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
    
    // Should still render without crashing
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles missing appConfig gracefully', () => {
    const userWithoutAppConfig = {
      ...mockUser,
      appConfig: null
    };

    const authContextWithoutAppConfig = {
      ...mockAuthContextValue,
      user: userWithoutAppConfig
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <AuthContext.Provider value={authContextWithoutAppConfig}>
            <AdminPanel />
          </AuthContext.Provider>
        </BrowserRouter>
      </Provider>
    );
    
    // Should still render without crashing
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles axios error during aspect type loading', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
    
    renderAdminPanel();
    
    // When there's an error during loading, the component stays in loading state
    // because setLoading(false) is not called in the catch block
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // The Admin Panel title should not be visible when in loading state
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('initializes with user appConfig values', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      const productsInput = screen.getByTestId('products-input');
      const aspectTypeInput = screen.getByTestId('aspect-type-input');
      
      expect(productsInput).toHaveValue('BigQuery');
      expect(aspectTypeInput).toHaveValue('Tables, Datasets');
    });
  });

  it('updates products selection when multiselect changes', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      const productsInput = screen.getByTestId('products-input');
      fireEvent.change(productsInput, { target: { value: 'BigQuery, Analytics Hub' } });
    });
    
    // The mock multiselect should handle the change
    expect(screen.getByTestId('products-input')).toHaveValue('BigQuery, Analytics Hub');
  });

  it('updates aspect type selection when multiselect changes', async () => {
    renderAdminPanel();
    
    await waitFor(() => {
      const aspectTypeInput = screen.getByTestId('aspect-type-input');
      fireEvent.change(aspectTypeInput, { target: { value: 'Tables' } });
    });
    
    // The mock multiselect should handle the change
    expect(screen.getByTestId('aspect-type-input')).toHaveValue('Tables');
  });
});
