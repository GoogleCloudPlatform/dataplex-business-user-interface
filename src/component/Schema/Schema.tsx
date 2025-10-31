import {type GridRowsProp, type GridColDef } from '@mui/x-data-grid';
import TableView from '../Table/TableView';

/**
 * @file Schema.tsx
 * @description
 * This component renders a detailed view of the schema for a given data entry.
 *
 * It performs the following functions:
 * 1.  Parses the `entry.entryType` to determine the correct key for the
 * schema aspect (e.g., 'table.global.schema').
 * 2.  Accesses the deeply nested schema data within `entry.aspects`.
 * 3.  Transforms the raw schema data into `rows` by mapping fields like
 * `name`, `type`, `metaDataType`, `mode`, `defaultValue`, and `description`.
 * 4.  Defines the `columns` for the table.
 * 5.  Renders the schema data using the reusable `TableView` component, applying
 * specific styling overrides (e.g., removing cell borders, setting height).
 * 6.  Displays a fallback message ("No Schema Data available") if the
 * entry contains no schema rows.
 *
 * @param {SchemaProps} props - The props for the component.
 * @param {any} props.entry - The data entry object. This object is expected
 * to have `entryType` and `aspects` properties containing the schema data.
 * @param {any} [props.sx] - (Optional) Material-UI SX props to be applied
 * to the root `div` and passed down to the `TableView` for custom styling.
 *
 * @returns {React.ReactElement} A React element displaying the schema in a
 * `TableView` or a fallback message if the schema is empty.
 */

interface SchemaProps {
  // handleClick: any | (() => void); // Function to handle search, can be any function type
  entry: any; // text to be displayed on the button
  sx?: any; // Optional CSS properties for the button
}

const Schema: React.FC<SchemaProps> = ({entry, sx}) => {

    const number = entry.entryType.split('/')[1];
    const schema = entry.aspects[`${number}.global.schema`].data.fields.fields.listValue.values;
    const rows: GridRowsProp = schema.map((field: any, index: number) => ({
        id: index + 1,
        name: field.structValue.fields.name.stringValue,
        type: field.structValue.fields.dataType.stringValue,
        metaDataType: field.structValue.fields.metadataType.stringValue,
        mode: field.structValue.fields.mode.stringValue,
        defaultValue: (field.structValue.fields.defaultValue && field.structValue.fields.defaultValue != null) ? field.structValue.fields.defaultValue?.stringValue : '-',
        description: (field.structValue.fields.description && field.structValue.fields.description != null) ? field.structValue.fields.description.stringValue : '-',
    }));


    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', headerClassName:'table-bg', flex: 1, minWidth: 120 },
        { field: 'type', headerName: 'Type', headerClassName:'table-bg',minWidth: 120},
        { field: 'metaDataType', headerName: 'Metadata Type', headerClassName:'table-bg',minWidth: 150 },
        { field: 'mode', headerName: 'Mode', headerClassName:'table-bg',minWidth: 120 },
        { field: 'defaultValue', headerName: 'Default Value', headerClassName:'table-bg',minWidth: 120},
        { field: 'description', headerName: 'Description', headerClassName:'table-bg', flex: 1, minWidth: 120 },
    ];
  return (
    <div style={{ width: '100%', ...sx }}>
      {rows.length > 0 ? (
        <TableView 
          rows={rows} 
          columns={columns}
          rowHeight={36}
          columnHeaderHeight={36.5}
          sx={{
            fontSize: '0.75rem',
            '& .MuiDataGrid-columnHeaders .MuiDataGrid-columnHeader': {
              borderRight: 'none !important',
            },
            '& .MuiDataGrid-columnHeaders .MuiDataGrid-columnHeader:not(:last-child)': {
              borderRight: 'none !important',
            },
            '& .MuiDataGrid-cell': {
              borderRight: 'none !important',
            },
            '& .MuiDataGrid-cell:not(:last-child)': {
              borderRight: 'none !important',
            },
            '& .MuiDataGrid-columnHeader .MuiDataGrid-columnSeparator': {
              opacity: 0,
              '&:hover': {
                  opacity: 10,
              }
            },
            ...sx
          }}
        />
      ) : (
        <div style={{padding:"48px", textAlign: "center", fontSize: "14px", color: "#575757"}}>No Schema Data available for this table</div>
      )}
    </div>
  );
}

export default Schema;