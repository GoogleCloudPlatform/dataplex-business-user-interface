import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DataProductOverview from './DataProductOverview';
import DataProductOverviewNew from './DataProductOverviewNew';

// Mock child components
vi.mock('../Schema/Schema', () => ({
  default: function MockSchema({ entry }: any) {
    return <div data-testid="schema">Schema for {entry?.name}</div>;
  }
}));

vi.mock('../Schema/SchemaFilter', () => ({
  default: function MockSchemaFilter({ entry, onFilteredEntryChange }: any) {
    return (
      <div data-testid="schema-filter">
        Schema Filter for {entry?.name}
        <button onClick={() => onFilteredEntryChange(entry)}>Apply Schema Filter</button>
      </div>
    );
  }
}));

vi.mock('../Filter/TableFilter', () => ({
  default: function MockTableFilter({ data, onFilteredDataChange }: any) {
    return (
      <div data-testid="table-filter">
        Table Filter for {data?.length} rows
        <button onClick={() => onFilteredDataChange(data)}>Apply Table Filter</button>
      </div>
    );
  }
}));

vi.mock('../Table/TableView', () => ({
  default: function MockTableView({ rows }: any) {
    return <div data-testid="table-view">Table with {rows?.length} rows</div>;
  }
}));

vi.mock('../Avatar/Avatar', () => ({
  default: function MockAvatar({ text }: any) {
    return <div data-testid="avatar">{text}</div>;
  }
}));

// Mock SVG import
vi.mock('../../assets/svg/content_copy.svg', () => ({
  default: 'content-copy-icon'
}));

// Mock NotificationContext
const mockShowNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    clearNotification: vi.fn(),
    clearAllNotifications: vi.fn()
  })
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn()
  },
  writable: true
});

// ================================================================================
// TEST DATA FIXTURES
// ================================================================================

const createMockEntry = (overrides: any = {}) => ({
  name: 'project/tables/my-table',
  entryType: 'tables/123',
  fullyQualifiedName: 'project:dataset.table',
  createTime: { seconds: 1640995200 }, // Jan 1, 2022
  updateTime: { seconds: 1641081600 }, // Jan 2, 2022
  entrySource: {
    description: 'Test table description',
    system: 'BigQuery',
    location: 'US',
    resource: 'projects/test-project/datasets/test-dataset/tables/test-table',
    labels: {
      'environment': 'production',
      'team': 'data-engineering'
    }
  },
  aspects: {
    '123.global.schema': {
      data: {
        fields: {
          fields: {
            listValue: {
              values: [
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'id' },
                      type: { stringValue: 'INTEGER' }
                    }
                  }
                },
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'name' },
                      type: { stringValue: 'STRING' }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    '123.global.contacts': {
      data: {
        fields: {
          identities: {
            listValue: {
              values: [
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'John Doe <john.doe@example.com>' },
                      role: { stringValue: 'Owner' }
                    }
                  }
                },
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'Jane Smith <jane.smith@example.com>' },
                      role: { stringValue: 'Admin' }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    '123.global.usage': {
      data: {
        fields: {
          metrics: {
            listValue: {
              values: [
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'execution_time' },
                      timeSeries: {
                        listValue: {
                          values: [
                            {
                              structValue: {
                                fields: {
                                  value: { numberValue: 150 }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                },
                {
                  structValue: {
                    fields: {
                      name: { stringValue: 'total_queries' },
                      timeSeries: {
                        listValue: {
                          values: [
                            {
                              structValue: {
                                fields: {
                                  value: { numberValue: 42 }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              ]
            }
          },
          refreshTime: { stringValue: '2022-01-01T00:00:00Z' }
        }
      }
    },
    '123.global.overview': {
      data: {
        fields: {
          content: { stringValue: '<p>Test documentation content</p>' }
        }
      }
    }
  },
  ...overrides
});

const createDataProductEntry = (overrides: any = {}) => ({
  name: 'project/data-products/my-product',
  entryType: 'data-products/456',
  fullyQualifiedName: 'project:data-product.product',
  createTime: '2022-01-01T10:30:00Z',
  updateTime: '2022-01-02T15:45:30Z',
  entrySource: {
    description: 'Test data product description',
    system: 'Dataplex',
    location: 'US',
    resource: 'projects/test-project/data-products/test-product',
    labels: {}
  },
  aspects: {
    '456.global.contacts': {
      data: {
        identities: [
          { name: 'Alice Brown', role: 'Product Owner' },
          { name: 'Bob Green', role: 'Data Steward' }
        ]
      }
    },
    '456.global.overview': {
      data: {
        content: '<h1>Data Product Documentation</h1>'
      }
    },
    '456.global.schema': {
      data: {
        fields: {
          fields: {
            listValue: {
              values: []
            }
          }
        }
      }
    },
    '456.global.usage': {
      data: {
        fields: {}
      }
    }
  },
  ...overrides
});

const mockSampleData = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 }
];

// ================================================================================
// DataProductOverview TESTS
// ================================================================================

describe('DataProductOverview', () => {
  const mockEntry = {
    name: 'project/data-products/test',
    entryType: 'data-products/789',
    entrySource: {
      description: 'A test data product'
    },
    aspects: {
      '789.global.contacts': {
        data: {
          identities: [
            { name: 'John Doe <john@example.com>', role: 'Owner' },
            { name: 'Jane Smith', role: 'Admin' }
          ]
        }
      },
      '789.global.overview': {
        data: {
          content: '<p>Documentation content</p>'
        }
      }
    }
  };

  const defaultProps = {
    entry: mockEntry,
    css: { width: '100%' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDataProductOverview = (props = {}) => {
    return render(<DataProductOverview {...defaultProps} {...props} />);
  };

  describe('rendering', () => {
    it('renders the component with documentation section', () => {
      renderDataProductOverview();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('renders the information section', () => {
      renderDataProductOverview();
      expect(screen.getByText('Information')).toBeInTheDocument();
    });

    it('renders description section', () => {
      renderDataProductOverview();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('displays entry description', () => {
      renderDataProductOverview();
      expect(screen.getByText('A test data product')).toBeInTheDocument();
    });

    it('displays documentation content as HTML', () => {
      renderDataProductOverview();
      expect(screen.getByText('Documentation content')).toBeInTheDocument();
    });

    it('applies custom CSS styles', () => {
      const customCss = { width: '50%', margin: '10px' };
      expect(() => renderDataProductOverview({ css: customCss })).not.toThrow();
    });
  });

  describe('contacts rendering', () => {
    it('renders contacts with avatars', () => {
      renderDataProductOverview();
      expect(screen.getAllByTestId('avatar').length).toBeGreaterThan(0);
    });

    it('displays contact roles', () => {
      renderDataProductOverview();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('extracts email from contact name with angle brackets', () => {
      renderDataProductOverview();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays plain name when no email in angle brackets', () => {
      renderDataProductOverview();
      // Name appears in both avatar and contact text
      expect(screen.getAllByText('Jane Smith').length).toBeGreaterThan(0);
    });

    it('displays no contacts message when contacts array is empty', () => {
      const entryWithoutContacts = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '789.global.contacts': {
            data: {
              identities: []
            }
          }
        }
      };
      renderDataProductOverview({ entry: entryWithoutContacts });
      expect(screen.getByText('No Contacts Available')).toBeInTheDocument();
    });

    it('handles contact with empty name', () => {
      const entryWithEmptyContactName = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '789.global.contacts': {
            data: {
              identities: [
                { name: '', role: 'Owner' }
              ]
            }
          }
        }
      };
      renderDataProductOverview({ entry: entryWithEmptyContactName });
      expect(screen.getByText('--')).toBeInTheDocument();
    });
  });

  describe('documentation handling', () => {
    it('displays No Documentation Available when no documentation', () => {
      const entryWithoutDoc = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '789.global.overview': {
            data: {
              content: 'No Documentation Available'
            }
          }
        }
      };
      renderDataProductOverview({ entry: entryWithoutDoc });
      expect(screen.getByText('No Documentation Available')).toBeInTheDocument();
    });

    it('handles missing overview aspect gracefully', () => {
      const entryWithoutOverview = {
        ...mockEntry,
        aspects: {
          '789.global.contacts': mockEntry.aspects['789.global.contacts']
        }
      };
      renderDataProductOverview({ entry: entryWithoutOverview });
      expect(screen.getByText('No Documentation Available')).toBeInTheDocument();
    });
  });

  describe('description handling', () => {
    it('displays No Description Available when description is missing', () => {
      const entryWithoutDescription = {
        ...mockEntry,
        entrySource: {
          ...mockEntry.entrySource,
          description: undefined
        }
      };
      renderDataProductOverview({ entry: entryWithoutDescription });
      expect(screen.getByText('No Description Available')).toBeInTheDocument();
    });
  });

  describe('entryType handling', () => {
    it('handles undefined entryType gracefully', () => {
      const entryWithUndefinedType = {
        ...mockEntry,
        entryType: undefined
      };
      expect(() => renderDataProductOverview({ entry: entryWithUndefinedType })).not.toThrow();
    });
  });
});

// ================================================================================
// DataProductOverviewNew TESTS
// ================================================================================

describe('DataProductOverviewNew', () => {
  const mockEntry = createMockEntry();
  const mockDataProductEntry = createDataProductEntry();

  const defaultProps = {
    entry: mockEntry,
    sampleTableData: mockSampleData,
    css: { width: '100%' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDataProductOverviewNew = (props = {}) => {
    return render(<DataProductOverviewNew {...defaultProps} {...props} />);
  };

  describe('main sections rendering', () => {
    it('renders Details accordion', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('renders Table Info section for Tables entry type', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Table Info')).toBeInTheDocument();
    });

    it('renders Documentation section', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('renders Contacts section', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });

    it('renders Info section', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('renders Usage Metrics section when entryType is set and not data-product', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Usage Metrics')).toBeInTheDocument();
    });

    it('renders Labels section when entryType is set and not data-product', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('does not render Table Info for non-Tables entry type', () => {
      const datasetEntry = { ...mockEntry, name: 'project/datasets/my-dataset' };
      renderDataProductOverviewNew({ entry: datasetEntry });
      expect(screen.queryByText('Table Info')).not.toBeInTheDocument();
    });

    it('does not render Usage Metrics for data-product type', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      expect(screen.queryByText('Usage Metrics')).not.toBeInTheDocument();
    });

    it('does not render Labels for data-product type', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      expect(screen.queryByText('Labels')).not.toBeInTheDocument();
    });

    it('does not render Last Run Time for data-product type', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      expect(screen.queryByText('Last Run Time')).not.toBeInTheDocument();
    });
  });

  describe('Details section', () => {
    it('displays entry description', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Test table description')).toBeInTheDocument();
    });

    it('displays No Description Available when description is missing', () => {
      const entryWithoutDescription = {
        ...mockEntry,
        entrySource: { ...mockEntry.entrySource, description: undefined }
      };
      renderDataProductOverviewNew({ entry: entryWithoutDescription });
      expect(screen.getByText('No Description Available')).toBeInTheDocument();
    });

    it('displays system information', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('BigQuery')).toBeInTheDocument();
    });

    it('displays status as Active', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays location information', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });

    it('displays identifiers section', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Identifiers')).toBeInTheDocument();
      expect(screen.getByText('Resource')).toBeInTheDocument();
      expect(screen.getByText('FQN')).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copies resource to clipboard when clicked', () => {
      renderDataProductOverviewNew();
      const resourceButton = screen.getByText('Resource');
      fireEvent.click(resourceButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'projects/test-project/datasets/test-dataset/tables/test-table'
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied to clipboard.',
        'success',
        3000,
        undefined
      );
    });

    it('copies FQN to clipboard when clicked', () => {
      renderDataProductOverviewNew();
      const fqnButton = screen.getByText('FQN');
      fireEvent.click(fqnButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('project:dataset.table');
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Copied to clipboard.',
        'success',
        3000,
        undefined
      );
    });
  });

  describe('Table Info section', () => {
    it('shows Schema tab by default', () => {
      renderDataProductOverviewNew();
      expect(screen.getByTestId('schema')).toBeInTheDocument();
    });

    it('switches to Sample Data tab when clicked', () => {
      renderDataProductOverviewNew();
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('switches back to Schema tab when clicked', () => {
      renderDataProductOverviewNew();
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);

      const schemaTab = screen.getByText('Schema');
      fireEvent.click(schemaTab);
      expect(screen.getByTestId('schema')).toBeInTheDocument();
    });

    it('renders schema filter when Schema tab is active and schema data exists', () => {
      renderDataProductOverviewNew();
      expect(screen.getByTestId('schema-filter')).toBeInTheDocument();
    });

    it('does not render schema filter when schema data is empty', () => {
      const entryWithEmptySchema = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.schema': {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: []
                  }
                }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithEmptySchema });
      expect(screen.queryByTestId('schema-filter')).not.toBeInTheDocument();
    });

    it('renders table filter when Sample Data tab is active', () => {
      renderDataProductOverviewNew();
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByTestId('table-filter')).toBeInTheDocument();
    });

    it('handles filtered schema entry changes', () => {
      renderDataProductOverviewNew();
      const applyFilterButton = screen.getByText('Apply Schema Filter');
      fireEvent.click(applyFilterButton);
      expect(screen.getByTestId('schema')).toBeInTheDocument();
    });

    it('handles filtered sample data changes', async () => {
      renderDataProductOverviewNew();
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);

      const applyFilterButton = screen.getByText('Apply Table Filter');
      fireEvent.click(applyFilterButton);

      await waitFor(() => {
        expect(screen.getByTestId('table-view')).toBeInTheDocument();
      });
    });
  });

  describe('sample data handling', () => {
    it('displays sample data when available', () => {
      renderDataProductOverviewNew();
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByText('Table with 2 rows')).toBeInTheDocument();
    });

    it('displays no data message when sample data is empty array', () => {
      renderDataProductOverviewNew({ sampleTableData: [] });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByText('No Data available for this table')).toBeInTheDocument();
    });

    it('displays no data message when sample data is undefined', () => {
      renderDataProductOverviewNew({ sampleTableData: undefined });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByText('No Data available for this table')).toBeInTheDocument();
    });

    it('handles sample data with nested value objects', () => {
      const nestedSampleData = [
        { id: { value: 1 }, name: { value: 'Test' } },
        { id: { value: 2 }, name: { value: 'Test2' } }
      ];
      renderDataProductOverviewNew({ sampleTableData: nestedSampleData });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('handles sample data with single-key objects', () => {
      const singleKeySampleData = [
        { id: { singleKey: 'value1' }, name: 'Test' },
        { id: { singleKey: 'value2' }, name: 'Test2' }
      ];
      renderDataProductOverviewNew({ sampleTableData: singleKeySampleData });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('handles sample data with multi-key objects by stringifying', () => {
      const multiKeySampleData = [
        { id: { key1: 'value1', key2: 'value2' }, name: 'Test' }
      ];
      renderDataProductOverviewNew({ sampleTableData: multiKeySampleData });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByTestId('table-view')).toBeInTheDocument();
    });

    it('handles sample data with invalid first row', () => {
      const invalidSampleData = [null, { id: 1 }];
      renderDataProductOverviewNew({ sampleTableData: invalidSampleData });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      // Should display error message for invalid data structure
      expect(screen.getByText(/Error loading sample data/)).toBeInTheDocument();
    });

    it('handles sample data with empty first row object', () => {
      const emptySampleData = [{}];
      renderDataProductOverviewNew({ sampleTableData: emptySampleData });
      const sampleDataTab = screen.getByText('Sample Data');
      fireEvent.click(sampleDataTab);
      expect(screen.getByText(/Error loading sample data/)).toBeInTheDocument();
    });
  });

  describe('Documentation section', () => {
    it('renders documentation content as HTML', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Test documentation content')).toBeInTheDocument();
    });

    it('displays No Documentation Available when missing', () => {
      const entryWithoutDoc = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.overview': {
            data: {
              fields: {
                content: { stringValue: 'No Documentation Available' }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutDoc });
      expect(screen.getByText('No Documentation Available')).toBeInTheDocument();
    });

    it('handles missing overview aspect gracefully', () => {
      const entryWithoutOverview = {
        ...mockEntry,
        aspects: {
          '123.global.schema': mockEntry.aspects['123.global.schema'],
          '123.global.contacts': mockEntry.aspects['123.global.contacts'],
          '123.global.usage': mockEntry.aspects['123.global.usage']
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutOverview });
      expect(screen.getByText('No Documentation Available')).toBeInTheDocument();
    });
  });

  describe('Contacts section', () => {
    it('renders contacts with avatars', () => {
      renderDataProductOverviewNew();
      expect(screen.getAllByTestId('avatar').length).toBeGreaterThan(0);
    });

    it('displays contact roles', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Owner')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('extracts email from contact name with angle brackets', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('displays no contacts message when empty', () => {
      const entryWithoutContacts = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.contacts': {
            data: {
              fields: {
                identities: {
                  listValue: {
                    values: []
                  }
                }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutContacts });
      expect(screen.getByText('No Contacts Available')).toBeInTheDocument();
    });

    it('handles contact without email format', () => {
      const entryWithPlainContact = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.contacts': {
            data: {
              fields: {
                identities: {
                  listValue: {
                    values: [
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: 'Bob Wilson' },
                            role: { stringValue: 'Viewer' }
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
      renderDataProductOverviewNew({ entry: entryWithPlainContact });
      // Name appears in both avatar and contact text
      expect(screen.getAllByText('Bob Wilson').length).toBeGreaterThan(0);
    });

    it('handles contact with empty name showing dashes', () => {
      const entryWithEmptyContact = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.contacts': {
            data: {
              fields: {
                identities: {
                  listValue: {
                    values: [
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: '' },
                            role: { stringValue: 'Owner' }
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
      renderDataProductOverviewNew({ entry: entryWithEmptyContact });
      expect(screen.getByText('--')).toBeInTheDocument();
    });
  });

  describe('Info section', () => {
    it('displays Creation Time', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Creation Time')).toBeInTheDocument();
    });

    it('displays Last Modified Time', () => {
      renderDataProductOverviewNew();
      expect(screen.getByText('Last Modified Time')).toBeInTheDocument();
    });

    it('displays Last Run Time when entryType is set and not data-product', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Last Run Time')).toBeInTheDocument();
    });

    it('formats dates correctly for regular entry', () => {
      renderDataProductOverviewNew();
      // Check that the Creation Time section contains a date
      const creationTimeSection = screen.getByText('Creation Time').closest('div')?.parentElement;
      expect(creationTimeSection?.textContent).toMatch(/2022/);
    });

    it('handles missing timestamp', () => {
      const entryWithMissingTimestamp = {
        ...mockEntry,
        createTime: undefined,
        updateTime: undefined
      };
      renderDataProductOverviewNew({ entry: entryWithMissingTimestamp });
      // Should show "-" for missing timestamps
      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThan(0);
    });
  });

  describe('Usage Metrics section', () => {
    it('displays execution time', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Execution Time')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('displays total queries', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Total Queries')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays refresh time', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Refresh Time')).toBeInTheDocument();
    });

    it('shows dashes when usage metrics are empty', () => {
      const entryWithEmptyUsage = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.usage': {
            data: {
              fields: {}
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithEmptyUsage, entryType: 'table' });
      const executionTimeSection = screen.getByText('Execution Time').closest('div')?.parentElement;
      expect(executionTimeSection?.textContent).toContain('-');
    });

    it('handles missing refresh time', () => {
      const entryWithoutRefreshTime = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.usage': {
            data: {
              fields: {
                metrics: mockEntry.aspects['123.global.usage'].data.fields.metrics
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutRefreshTime, entryType: 'table' });
      expect(screen.getByText('Refresh Time')).toBeInTheDocument();
    });

    it('handles missing metrics data gracefully', () => {
      const entryWithNoMetrics = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.usage': {
            data: {
              fields: {
                refreshTime: { stringValue: '2022-01-01T00:00:00Z' }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithNoMetrics, entryType: 'table' });
      expect(screen.getByText('Usage Metrics')).toBeInTheDocument();
    });
  });

  describe('Labels section', () => {
    it('displays labels as chips', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('environment: production')).toBeInTheDocument();
      expect(screen.getByText('team: data-engineering')).toBeInTheDocument();
    });

    it('displays no labels message when empty', () => {
      const entryWithoutLabels = {
        ...mockEntry,
        entrySource: {
          ...mockEntry.entrySource,
          labels: {}
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutLabels, entryType: 'table' });
      expect(screen.getByText('No Labels available')).toBeInTheDocument();
    });

    it('handles missing labels property', () => {
      const entryWithMissingLabels = {
        ...mockEntry,
        entrySource: {
          ...mockEntry.entrySource,
          labels: undefined
        }
      };
      renderDataProductOverviewNew({ entry: entryWithMissingLabels, entryType: 'table' });
      expect(screen.getByText('No Labels available')).toBeInTheDocument();
    });
  });

  describe('data-product entryType handling', () => {
    it('uses ISO date format for data-product type', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      // For data-product, the date is split from ISO format: '2022-01-01T10:30:00Z' -> '2022-01-01'
      const creationTimeSection = screen.getByText('Creation Time').closest('div')?.parentElement;
      expect(creationTimeSection?.textContent).toContain('2022-01-01');
    });

    it('renders contacts differently for data-product type', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      // Name appears in both avatar and contact text
      expect(screen.getAllByText('Alice Brown').length).toBeGreaterThan(0);
      expect(screen.getByText('Product Owner')).toBeInTheDocument();
    });

    it('uses data-product documentation format', () => {
      renderDataProductOverviewNew({ entry: mockDataProductEntry, entryType: 'data-product' });
      expect(screen.getByText('Data Product Documentation')).toBeInTheDocument();
    });
  });

  describe('accordion states', () => {
    it('Details accordion is expanded by default', () => {
      renderDataProductOverviewNew();
      const detailsAccordion = screen.getByText('Details').closest('button');
      expect(detailsAccordion).toHaveAttribute('aria-expanded', 'true');
    });

    it('Info accordion is expanded by default', () => {
      renderDataProductOverviewNew();
      const infoAccordion = screen.getByText('Info').closest('button');
      expect(infoAccordion).toHaveAttribute('aria-expanded', 'true');
    });

    it('Documentation accordion expands based on hasData', () => {
      renderDataProductOverviewNew();
      const docAccordion = screen.getByText('Documentation').closest('button');
      expect(docAccordion).toHaveAttribute('aria-expanded', 'true');
    });

    it('Contacts accordion collapses when no contacts', () => {
      const entryWithoutContacts = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.contacts': {
            data: {
              fields: {
                identities: {
                  listValue: {
                    values: []
                  }
                }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithoutContacts });
      const contactsAccordion = screen.getByText('Contacts').closest('button');
      expect(contactsAccordion).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('hasData helper function coverage', () => {
    it('handles empty string documentation', () => {
      const entryWithEmptyDoc = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.overview': {
            data: {
              fields: {
                content: { stringValue: '' }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithEmptyDoc });
      const docAccordion = screen.getByText('Documentation').closest('button');
      expect(docAccordion).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles whitespace-only documentation as false', () => {
      const entryWithWhitespaceDoc = {
        ...mockEntry,
        aspects: {
          ...mockEntry.aspects,
          '123.global.overview': {
            data: {
              fields: {
                content: { stringValue: '   ' }
              }
            }
          }
        }
      };
      renderDataProductOverviewNew({ entry: entryWithWhitespaceDoc });
      const docAccordion = screen.getByText('Documentation').closest('button');
      expect(docAccordion).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles labels accordion with empty labels object', () => {
      const entryWithEmptyLabels = {
        ...mockEntry,
        entrySource: {
          ...mockEntry.entrySource,
          labels: {}
        }
      };
      renderDataProductOverviewNew({ entry: entryWithEmptyLabels, entryType: 'table' });
      const labelsAccordion = screen.getByText('Labels').closest('button');
      expect(labelsAccordion).toHaveAttribute('aria-expanded', 'false');
    });

    it('handles labels accordion with labels present', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      const labelsAccordion = screen.getByText('Labels').closest('button');
      expect(labelsAccordion).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('getFormattedDateTimeParts function', () => {
    it('returns dash for null timestamp', () => {
      const entryWithNoTime = {
        ...mockEntry,
        createTime: null,
        updateTime: null
      };
      renderDataProductOverviewNew({ entry: entryWithNoTime });
      const creationTimeSection = screen.getByText('Creation Time').closest('div')?.parentElement;
      expect(creationTimeSection?.textContent).toContain('-');
    });

    it('formats time with AM/PM', () => {
      renderDataProductOverviewNew();
      // Check that time format includes AM/PM indicator
      const infoSection = screen.getByText('Creation Time').closest('div')?.parentElement;
      expect(infoSection?.textContent).toMatch(/AM|PM/);
    });
  });

  describe('getEntryType function', () => {
    it('correctly identifies Tables from path', () => {
      renderDataProductOverviewNew();
      // Table Info section should be rendered for entry with 'tables' in name
      expect(screen.getByText('Table Info')).toBeInTheDocument();
    });

    it('does not show Table Info for Datasets', () => {
      const datasetEntry = { ...mockEntry, name: 'project/datasets/my-dataset' };
      renderDataProductOverviewNew({ entry: datasetEntry });
      expect(screen.queryByText('Table Info')).not.toBeInTheDocument();
    });
  });

  describe('tooltip rendering', () => {
    it('renders help icons in accordions', () => {
      renderDataProductOverviewNew();
      const helpIcons = screen.getAllByTestId('InfoOutlineIcon');
      expect(helpIcons.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles entry without aspects', () => {
      const entryWithoutAspects = { ...mockEntry, aspects: {} };
      renderDataProductOverviewNew({ entry: entryWithoutAspects });
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('applies custom CSS styles', () => {
      const customCss = { width: '50%', margin: '10px' };
      expect(() => renderDataProductOverviewNew({ css: customCss })).not.toThrow();
    });
  });

  describe('entryType prop handling', () => {
    it('handles null entryType prop', () => {
      renderDataProductOverviewNew({ entryType: null });
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('handles undefined entryType prop', () => {
      renderDataProductOverviewNew({ entryType: undefined });
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('shows all sections when entryType is not data-product', () => {
      renderDataProductOverviewNew({ entryType: 'table' });
      expect(screen.getByText('Usage Metrics')).toBeInTheDocument();
      expect(screen.getByText('Labels')).toBeInTheDocument();
      expect(screen.getByText('Last Run Time')).toBeInTheDocument();
    });
  });
});

// ================================================================================
// FIELD RENDERER TESTS (Exported from DataProductOverview but internal components)
// ================================================================================

describe('Field Renderers (internal components)', () => {
  // Since these are not exported, we test them through DataProductOverview component
  // The renderers are: StringRenderer, NumberRenderer, BooleanRenderer, ListRenderer, StructRenderer, FieldRenderer

  describe('Testing renderers through DataProductOverviewNew contacts', () => {
    // The field renderers are used internally but we can't directly import them
    // They're tested indirectly through the component's behavior

    it('component renders without errors', () => {
      const mockEntry = createMockEntry();
      expect(() => render(
        <DataProductOverviewNew
          entry={mockEntry}
          css={{ width: '100%' }}
        />
      )).not.toThrow();
    });
  });
});

// ================================================================================
// INTEGRATION TESTS
// ================================================================================

describe('Integration Tests', () => {
  describe('DataProductOverview and DataProductOverviewNew consistency', () => {
    const sharedEntry = {
      name: 'project/data-products/shared',
      entryType: 'data-products/999',
      entrySource: {
        description: 'Shared description'
      },
      aspects: {
        '999.global.contacts': {
          data: {
            identities: [
              { name: 'Test User', role: 'Owner' }
            ]
          }
        },
        '999.global.overview': {
          data: {
            content: 'Shared documentation'
          }
        }
      }
    };

    it('both components render documentation', () => {
      const { unmount: unmount1 } = render(
        <DataProductOverview entry={sharedEntry} css={{ width: '100%' }} />
      );
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      unmount1();

      const fullEntry = {
        ...sharedEntry,
        fullyQualifiedName: 'test',
        createTime: { seconds: 1640995200 },
        updateTime: { seconds: 1640995200 },
        entrySource: {
          ...sharedEntry.entrySource,
          system: 'Test',
          location: 'US',
          resource: 'test-resource',
          labels: {}
        },
        aspects: {
          ...sharedEntry.aspects,
          '999.global.contacts': {
            data: {
              fields: {
                identities: {
                  listValue: {
                    values: []
                  }
                }
              }
            }
          },
          '999.global.overview': {
            data: {
              fields: {
                content: { stringValue: 'Shared documentation' }
              }
            }
          },
          '999.global.usage': {
            data: {
              fields: {}
            }
          },
          '999.global.schema': {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: []
                  }
                }
              }
            }
          }
        }
      };

      render(
        <DataProductOverviewNew entry={fullEntry} css={{ width: '100%' }} />
      );
      // DataProductOverviewNew also has Documentation section
      const docs = screen.getAllByText('Documentation');
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe('full user workflow', () => {
    it('user can navigate through all tabs and copy identifiers', async () => {
      const mockEntry = createMockEntry();
      render(
        <DataProductOverviewNew
          entry={mockEntry}
          sampleTableData={mockSampleData}
          css={{ width: '100%' }}
        />
      );

      // Verify main sections are visible
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Table Info')).toBeInTheDocument();
      expect(screen.getByText('Documentation')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();

      // Switch to Sample Data tab
      fireEvent.click(screen.getByText('Sample Data'));
      expect(screen.getByTestId('table-view')).toBeInTheDocument();

      // Switch back to Schema tab
      fireEvent.click(screen.getByText('Schema'));
      expect(screen.getByTestId('schema')).toBeInTheDocument();

      // Copy resource identifier
      fireEvent.click(screen.getByText('Resource'));
      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      // Copy FQN identifier
      fireEvent.click(screen.getByText('FQN'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2);
    });
  });
});
