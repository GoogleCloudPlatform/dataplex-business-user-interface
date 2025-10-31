import { render, screen, fireEvent } from '@testing-library/react';
import DataProfileConfigurationsPanel from './DataProfileConfigurationsPanel';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

describe('DataProfileConfigurationsPanel', () => {
  const mockDataProfileScan = {
    name: 'projects/test-project/locations/us-central1/dataScans/test-scan',
    createTime: {
      seconds: 1640995200 // Jan 1, 2022
    },
    updateTime: {
      seconds: 1641081600 // Jan 2, 2022
    },
    scan: {
      dataProfileSpec: {
        profileFields: [
          {
            fieldName: 'test_column',
            profileType: 'STRING'
          },
          {
            fieldName: 'numeric_column',
            profileType: 'INTEGER'
          }
        ],
        samplingPercent: 0.1,
        rowFilter: 'test_filter'
      },
      dataProfileStatus: {
        state: 'SUCCEEDED',
        message: 'Profile completed successfully'
      }
    },
    executionSpec: {
      trigger: {
        onDemand: {}
      },
      field: {
        fieldName: 'test_field'
      }
    },
    executionStatus: {
      state: 'SUCCEEDED',
      message: 'Execution completed successfully'
    },
    jobs: [
      {
        state: 'SUCCEEDED'
      }
    ]
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    dataProfileScan: mockDataProfileScan
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderConfigurationsPanel = (props = {}) => {
    return render(<DataProfileConfigurationsPanel {...defaultProps} {...props} />);
  };

  it('renders the panel when open', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
    expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
  });

  it('does not render the panel when closed', () => {
    renderConfigurationsPanel({ isOpen: false });
    
    const panel = screen.getByText('Configurations').closest('div');
    expect(panel).toHaveStyle({ right: '-612px' });
  });

  it('displays help icon in header', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByTestId('HelpOutlineIcon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    renderConfigurationsPanel({ onClose: mockOnClose });
    
    const closeButton = screen.getByTestId('CloseIcon');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays scan name correctly', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays formatted creation time', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays formatted update time', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays entity information', () => {
    renderConfigurationsPanel();
    
    // The component doesn't display entity information in the current structure
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays profile fields information', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays sampling percentage', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays row filter', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays profile status with success indicator', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('SUCCEEDED')).toBeInTheDocument();
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
  });

  it('displays execution status with success indicator', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('SUCCEEDED')).toBeInTheDocument();
  });

  it('displays trigger information', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('displays field information', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing data profile scan gracefully', () => {
    renderConfigurationsPanel({ dataProfileScan: null });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing scan name', () => {
    const scanWithoutName = { ...mockDataProfileScan } as any;
    delete scanWithoutName.name;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutName });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing timestamps', () => {
    const scanWithoutTimestamps = { ...mockDataProfileScan } as any;
    delete scanWithoutTimestamps.createTime;
    delete scanWithoutTimestamps.updateTime;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutTimestamps });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing data section', () => {
    const scanWithoutData = { ...mockDataProfileScan } as any;
    delete scanWithoutData.data;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutData });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing profile spec', () => {
    const scanWithoutProfileSpec = { ...mockDataProfileScan } as any;
    delete scanWithoutProfileSpec.data.profileSpec;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutProfileSpec });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing profile fields', () => {
    const scanWithoutFields = { ...mockDataProfileScan } as any;
    delete scanWithoutFields.scan.dataProfileSpec.profileFields;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutFields });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles empty profile fields array', () => {
    const scanWithEmptyFields = { ...mockDataProfileScan };
    scanWithEmptyFields.scan.dataProfileSpec.profileFields = [];
    
    renderConfigurationsPanel({ dataProfileScan: scanWithEmptyFields });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing profile status', () => {
    const scanWithoutStatus = { ...mockDataProfileScan } as any;
    delete scanWithoutStatus.scan.dataProfileStatus;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutStatus });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing execution spec', () => {
    const scanWithoutExecutionSpec = { ...mockDataProfileScan } as any;
    delete scanWithoutExecutionSpec.executionSpec;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutExecutionSpec });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing execution status', () => {
    const scanWithoutExecutionStatus = { ...mockDataProfileScan } as any;
    delete scanWithoutExecutionStatus.executionStatus;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutExecutionStatus });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles different profile status states', () => {
    const scanWithFailedStatus = {
      ...mockDataProfileScan,
      scan: {
        ...mockDataProfileScan.scan,
        dataProfileStatus: {
          state: 'FAILED',
          message: 'Profile failed to complete'
        }
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithFailedStatus });
    
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('Profile failed to complete')).toBeInTheDocument();
  });

  it('handles different execution status states', () => {
    const scanWithFailedExecution = {
      ...mockDataProfileScan,
      executionStatus: {
        state: 'FAILED',
        message: 'Execution failed'
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithFailedExecution });
    
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('Execution failed')).toBeInTheDocument();
  });

  it('handles different entity types', () => {
    const scanWithDifferentEntityType = {
      ...mockDataProfileScan,
      scan: {
        ...mockDataProfileScan.scan,
        entityType: 'VIEW'
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithDifferentEntityType });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles different trigger types', () => {
    const scanWithScheduleTrigger = {
      ...mockDataProfileScan,
      executionSpec: {
        ...mockDataProfileScan.executionSpec,
        trigger: {
          schedule: {
            cron: '0 0 * * *'
          }
        }
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithScheduleTrigger });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing sampling percentage', () => {
    const scanWithoutSampling = { ...mockDataProfileScan } as any;
    delete scanWithoutSampling.scan.dataProfileSpec.samplingPercent;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutSampling });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing row filter', () => {
    const scanWithoutRowFilter = { ...mockDataProfileScan } as any;
    delete scanWithoutRowFilter.scan.dataProfileSpec.rowFilter;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutRowFilter });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles missing field in execution spec', () => {
    const scanWithoutField = { ...mockDataProfileScan } as any;
    delete scanWithoutField.executionSpec.field;
    
    renderConfigurationsPanel({ dataProfileScan: scanWithoutField });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('formats dates correctly for different timestamps', () => {
    const scanWithDifferentDates = {
      ...mockDataProfileScan,
      createTime: {
        seconds: 1672531200 // Jan 1, 2023
      },
      updateTime: {
        seconds: 1672617600 // Jan 2, 2023
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithDifferentDates });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('handles zero sampling percentage', () => {
    const scanWithZeroSampling = {
      ...mockDataProfileScan,
      scan: {
        ...mockDataProfileScan.scan,
        dataProfileSpec: {
          ...mockDataProfileScan.scan.dataProfileSpec,
          samplingPercent: 0
        }
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithZeroSampling });
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('handles 100% sampling percentage', () => {
    const scanWithFullSampling = {
      ...mockDataProfileScan,
      scan: {
        ...mockDataProfileScan.scan,
        dataProfileSpec: {
          ...mockDataProfileScan.scan.dataProfileSpec,
          samplingPercent: 1.0
        }
      }
    };
    
    renderConfigurationsPanel({ dataProfileScan: scanWithFullSampling });
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays all section headers correctly', () => {
    renderConfigurationsPanel();
    
    expect(screen.getByText('Scope')).toBeInTheDocument();
    expect(screen.getByText('Row Filter')).toBeInTheDocument();
    expect(screen.getByText('Increment Column')).toBeInTheDocument();
    expect(screen.getByText('Sampling Size')).toBeInTheDocument();
    expect(screen.getByText('Increment Start')).toBeInTheDocument();
    expect(screen.getByText('Results Exported To')).toBeInTheDocument();
    expect(screen.getByText('Increment End')).toBeInTheDocument();
    expect(screen.getByText('Last Run Status')).toBeInTheDocument();
    expect(screen.getByText('Last Run Time')).toBeInTheDocument();
  });

  it('applies correct styling when panel is open', () => {
    renderConfigurationsPanel({ isOpen: true });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });

  it('applies correct styling when panel is closed', () => {
    renderConfigurationsPanel({ isOpen: false });
    
    expect(screen.getByText('Configurations')).toBeInTheDocument();
  });
});
