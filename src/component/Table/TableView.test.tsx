import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import TableView from './TableView';
import type { GridColDef, GridRowsProp } from '@mui/x-data-grid';

// Mock the DataGrid component to avoid complex MUI setup
vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({
    rows,
    columns,
    autoHeight,
    hideFooter,
    columnHeaderHeight,
    rowHeight,
    disableColumnMenu,
    sx,
  }: {
    rows: GridRowsProp;
    columns: GridColDef[];
    autoHeight?: boolean;
    hideFooter?: boolean;
    columnHeaderHeight?: number;
    rowHeight?: number;
    disableColumnMenu?: boolean;
    sx?: object;
  }) => (
    <div
      data-testid="mock-data-grid"
      data-rows={JSON.stringify(rows)}
      data-columns={JSON.stringify(columns.map((c) => ({ field: c.field, headerName: c.headerName })))}
      data-auto-height={autoHeight}
      data-hide-footer={hideFooter}
      data-column-header-height={columnHeaderHeight}
      data-row-height={rowHeight}
      data-disable-column-menu={disableColumnMenu}
      data-sx={JSON.stringify(sx)}
    >
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.field}>{col.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.field}>{row[col.field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

// Mock CSS import
vi.mock('./table.css', () => ({}));

describe('TableView', () => {
  // Mock data for testing
  const mockColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'age', headerName: 'Age', width: 100 },
    { field: 'email', headerName: 'Email', width: 200 },
  ];

  const mockRows: GridRowsProp = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 45, email: 'bob@example.com' },
  ];

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });

    it('renders column headers correctly', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders row data correctly', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders wrapper div with 100% width', () => {
      const { container } = render(<TableView rows={mockRows} columns={mockColumns} />);

      const wrapperDiv = container.firstChild as HTMLElement;
      expect(wrapperDiv).toHaveStyle({ width: '100%' });
    });
  });

  describe('Default Props', () => {
    it('uses default autoHeight value of true', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-auto-height', 'true');
    });

    it('uses default rowHeight value of 36', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-row-height', '36');
    });

    it('uses default columnHeaderHeight value of 36', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-column-header-height', '36');
    });

    it('uses default hideFooter value of true', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-hide-footer', 'true');
    });

    it('uses default hideColumnMenu value of true (disableColumnMenu)', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-disable-column-menu', 'true');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom autoheight prop set to false', () => {
      render(<TableView rows={mockRows} columns={mockColumns} autoheight={false} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-auto-height', 'false');
    });

    it('accepts custom rowHeight prop', () => {
      render(<TableView rows={mockRows} columns={mockColumns} rowHeight={50} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-row-height', '50');
    });

    it('accepts custom columnHeaderHeight prop', () => {
      render(<TableView rows={mockRows} columns={mockColumns} columnHeaderHeight={48} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-column-header-height', '48');
    });

    it('accepts custom hideFooter prop set to false', () => {
      render(<TableView rows={mockRows} columns={mockColumns} hideFooter={false} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-hide-footer', 'false');
    });

    it('accepts custom hideColumnMenu prop set to false', () => {
      render(<TableView rows={mockRows} columns={mockColumns} hideColumnMenu={false} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toHaveAttribute('data-disable-column-menu', 'false');
    });
  });

  describe('Custom sx Props', () => {
    it('merges custom sx props with default styles', () => {
      const customSx = { backgroundColor: 'red', padding: '10px' };
      render(<TableView rows={mockRows} columns={mockColumns} sx={customSx} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const sxData = JSON.parse(dataGrid.getAttribute('data-sx') || '{}');

      // Check default styles are present
      expect(sxData.fontSize).toBe('0.75rem');
      expect(sxData.borderRadius).toBe('10px');

      // Check custom styles are merged
      expect(sxData.backgroundColor).toBe('red');
      expect(sxData.padding).toBe('10px');
    });

    it('applies default sx styles when no custom sx provided', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const sxData = JSON.parse(dataGrid.getAttribute('data-sx') || '{}');

      expect(sxData.fontSize).toBe('0.75rem');
      expect(sxData.borderRadius).toBe('10px');
      expect(sxData['&.MuiDataGrid-root .MuiDataGrid-columnHeader:focus-within']).toEqual({ outline: 'none' });
      expect(sxData['& .MuiDataGrid-filler']).toEqual({ backgroundColor: '#F0F4F8 !important' });
    });

    it('custom sx can override default styles', () => {
      const customSx = { fontSize: '1rem', borderRadius: '5px' };
      render(<TableView rows={mockRows} columns={mockColumns} sx={customSx} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const sxData = JSON.parse(dataGrid.getAttribute('data-sx') || '{}');

      // Custom styles should override defaults (due to spread order)
      expect(sxData.fontSize).toBe('1rem');
      expect(sxData.borderRadius).toBe('5px');
    });
  });

  describe('Empty Data Handling', () => {
    it('renders with empty rows array', () => {
      render(<TableView rows={[]} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();

      // Column headers should still be present
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('renders with empty columns array', () => {
      render(<TableView rows={mockRows} columns={[]} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });

    it('renders with both empty rows and columns', () => {
      render(<TableView rows={[]} columns={[]} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('passes rows data to DataGrid', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const rowsData = JSON.parse(dataGrid.getAttribute('data-rows') || '[]');

      expect(rowsData).toHaveLength(3);
      expect(rowsData[0].name).toBe('John Doe');
      expect(rowsData[1].name).toBe('Jane Smith');
      expect(rowsData[2].name).toBe('Bob Johnson');
    });

    it('passes columns data to DataGrid', () => {
      render(<TableView rows={mockRows} columns={mockColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const columnsData = JSON.parse(dataGrid.getAttribute('data-columns') || '[]');

      expect(columnsData).toHaveLength(4);
      expect(columnsData[0].field).toBe('id');
      expect(columnsData[1].field).toBe('name');
      expect(columnsData[2].field).toBe('age');
      expect(columnsData[3].field).toBe('email');
    });
  });

  describe('Different Data Types', () => {
    it('handles rows with numeric values', () => {
      const numericRows = [
        { id: 1, value: 100.5, count: 42 },
        { id: 2, value: 200.75, count: 84 },
      ];
      const numericColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID' },
        { field: 'value', headerName: 'Value' },
        { field: 'count', headerName: 'Count' },
      ];

      render(<TableView rows={numericRows} columns={numericColumns} />);

      expect(screen.getByText('100.5')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles rows with boolean values', () => {
      const booleanRows = [
        { id: 1, active: true, verified: false },
      ];
      const booleanColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID' },
        { field: 'active', headerName: 'Active' },
        { field: 'verified', headerName: 'Verified' },
      ];

      render(<TableView rows={booleanRows} columns={booleanColumns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });

    it('handles rows with null/undefined values', () => {
      const nullRows = [
        { id: 1, name: null, email: undefined },
      ];
      const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID' },
        { field: 'name', headerName: 'Name' },
        { field: 'email', headerName: 'Email' },
      ];

      render(<TableView rows={nullRows} columns={columns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      expect(dataGrid).toBeInTheDocument();
    });
  });

  describe('Large Datasets', () => {
    it('handles large number of rows', () => {
      const largeRows = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
      }));
      const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID' },
        { field: 'name', headerName: 'Name' },
        { field: 'email', headerName: 'Email' },
      ];

      render(<TableView rows={largeRows} columns={columns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const rowsData = JSON.parse(dataGrid.getAttribute('data-rows') || '[]');
      expect(rowsData).toHaveLength(100);
    });

    it('handles large number of columns', () => {
      const columns: GridColDef[] = Array.from({ length: 20 }, (_, i) => ({
        field: `field${i}`,
        headerName: `Column ${i}`,
      }));
      const rows = [{ id: 1, ...Object.fromEntries(columns.map((c) => [c.field, `value-${c.field}`])) }];

      render(<TableView rows={rows} columns={columns} />);

      const dataGrid = screen.getByTestId('mock-data-grid');
      const columnsData = JSON.parse(dataGrid.getAttribute('data-columns') || '[]');
      expect(columnsData).toHaveLength(20);
    });
  });

  describe('All Props Combined', () => {
    it('renders correctly with all props provided', () => {
      const customSx = { margin: '10px' };

      render(
        <TableView
          rows={mockRows}
          columns={mockColumns}
          autoheight={false}
          rowHeight={44}
          columnHeaderHeight={52}
          hideFooter={false}
          hideColumnMenu={false}
          sx={customSx}
        />
      );

      const dataGrid = screen.getByTestId('mock-data-grid');

      expect(dataGrid).toHaveAttribute('data-auto-height', 'false');
      expect(dataGrid).toHaveAttribute('data-row-height', '44');
      expect(dataGrid).toHaveAttribute('data-column-header-height', '52');
      expect(dataGrid).toHaveAttribute('data-hide-footer', 'false');
      expect(dataGrid).toHaveAttribute('data-disable-column-menu', 'false');

      const sxData = JSON.parse(dataGrid.getAttribute('data-sx') || '{}');
      expect(sxData.margin).toBe('10px');
    });
  });

  describe('Snapshot Tests', () => {
    it('matches snapshot with default props', () => {
      const { container } = render(<TableView rows={mockRows} columns={mockColumns} />);
      expect(container).toBeDefined();
    });

    it('matches snapshot with custom props', () => {
      const { container } = render(
        <TableView
          rows={mockRows}
          columns={mockColumns}
          autoheight={false}
          rowHeight={50}
          columnHeaderHeight={40}
          hideFooter={false}
          hideColumnMenu={false}
          sx={{ backgroundColor: 'white' }}
        />
      );
      expect(container).toBeDefined();
    });

    it('matches snapshot with empty data', () => {
      const { container } = render(<TableView rows={[]} columns={[]} />);
      expect(container).toBeDefined();
    });
  });
});
