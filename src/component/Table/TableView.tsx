import { DataGrid, type GridRowsProp, type GridColDef } from '@mui/x-data-grid';
import { type SxProps, type Theme } from '@mui/material/styles';
import './table.css'

/**
 * @file TableView.tsx
 * @description
 * This component is a reusable wrapper around the Material-UI `DataGrid`
 * component. It is pre-configured with sensible defaults for the application,
 * such as `autoHeight`, `hideFooter`, and `disableColumnMenu`.
 *
 * It acts as a standardized way to display tabular data by accepting `rows`
 * and `columns` props, which are passed directly to the `DataGrid`.
 *
 * @param {TableProps} props - The props for the component.
 * @param {GridRowsProp} props.rows - The data for the rows, conforming to
 * the `DataGrid`'s `GridRowsProp` type.
 * @param {GridColDef[]} props.columns - The definitions for the columns,
 * conforming to the `DataGrid`'s `GridColDef[]` type.
 * @param {boolean} [props.autoheight=true] - (Optional) If true, the
 * table's height adjusts to fit its content.
 * @param {number} [props.rowHeight=36] - (Optional) The pixel height of
 * each data row.
 * @param {number} [props.columnHeaderHeight=36] - (Optional) The pixel
 * height of the column header row.
 * @param {boolean} [props.hideFooter=true] - (Optional) If true, the
 * pagination footer of the `DataGrid` is hidden.
 * @param {boolean} [props.hideColumnMenu=true] - (Optional) If true, the
 * column menu (for sorting, filtering, etc.) is disabled.
 * @param {SxProps<Theme>} [props.sx] - (Optional) Material-UI SX props
 * to be passed to the `DataGrid` for custom styling.
 *
 * @returns {React.ReactElement} A React element (`div`) that wraps the
 * configured `DataGrid` component.
 */

interface TableProps {
  rows: GridRowsProp; 
  columns: GridColDef[];
  autoheight?: boolean; // Optional prop to control auto height
  rowHeight?: number; // Height of each row
  columnHeaderHeight?: number; // Height of the column header
  hideFooter?: boolean; // Whether to hide the footer
  hideColumnMenu?: boolean; // Whether to hide the column menu
  sx?: SxProps<Theme>;  // Optional CSS properties for the table
}

const TableView: React.FC<TableProps> = ({
    rows,
    columns,
    autoheight = true,
    rowHeight = 36,
    columnHeaderHeight = 36,
    hideFooter = true,
    hideColumnMenu = true,
    sx
}) => {

    
  return (
    <div style={{ width: '100%'}}>
      <DataGrid 
        autoHeight={autoheight}
        rows={rows} 
        columns={columns} 
        hideFooter={hideFooter}
        columnHeaderHeight={columnHeaderHeight}
        rowHeight={rowHeight}
        disableColumnMenu={hideColumnMenu}
        sx={{
          fontSize: '0.75rem',
          borderRadius: '10px',
          "&.MuiDataGrid-root .MuiDataGrid-columnHeader:focus-within": { outline: "none",},
          '& .MuiDataGrid-filler': {
            backgroundColor: '#F0F4F8 !important',
          },
          ...sx,
        }}
      />
    </div>
  );
}

export default TableView;