import { type GridRowsProp, type GridColDef } from '@mui/x-data-grid';
import TableView from '../Table/TableView';
import { type SxProps, type Theme } from '@mui/material/styles';

/**
 * @file PreviewSchema.tsx
 * @description
 * This component is responsible for extracting and displaying the schema of a
 * data entry in a tabular format.
 *
 * It takes a complex `entry` object, finds the schema aspect by parsing the
 * `entry.entryType` (e.g., "table.global.schema"), and transforms the nested
 * schema field data into a flat array of `rows`. It then defines the `columns`
 * (Name, Type, Mode) and passes this data to the reusable `TableView`
 * component for rendering.
 *
 * If no schema data is found in the `entry` prop, it displays a
 * "No schema data available" message.
 *
 * @param {PreviewSchemaProps} props - The props for the component.
 * @param {object} props.entry - The data entry object, which must contain
 * `entryType` and the corresponding schema aspect data within `entry.aspects`.
 * @param {SxProps<Theme>} [props.sx] - (Optional) Material-UI SX props
 * to be passed down to the `TableView` component for custom styling.
 *
 * @returns {React.ReactElement} A React element displaying the schema in a
 * `TableView` or a fallback message if no schema data is found.
 */

interface SchemaField {
  structValue: {
    fields: {
      name?: { stringValue?: string };
      dataType?: { stringValue?: string };
      mode?: { stringValue?: string };
    };
  };
}

interface PreviewSchemaProps {
  entry: {
    entryType?: string;
    aspects?: {
      [key: string]: {
        data?: {
          fields?: {
            fields?: {
              listValue?: {
                values?: SchemaField[];
              };
            };
          };
        };
      };
    };
  };
  sx?: SxProps<Theme>; 
}

const PreviewSchema: React.FC<PreviewSchemaProps> = ({entry, sx}) => {
    if (!entry?.entryType) {
        return <div>No schema data available</div>;
    }

    const splitType = entry.entryType?.split('/');
    const number = splitType && splitType.length > 1 ? splitType[1] : 'table';
    const schemaData = entry.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values;

    if (!schemaData) {
        return <div>No schema data available</div>;
    }

    const rows: GridRowsProp = schemaData.map((field: SchemaField, index: number) => ({
        id: index + 1,
        name: field.structValue?.fields?.name?.stringValue ?? '',
        type: field.structValue?.fields?.dataType?.stringValue ?? '',
        mode: field.structValue?.fields?.mode?.stringValue ?? ''
    }));


    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Name', flex: 1, headerClassName:'table-bg' },
        { field: 'type', headerName: 'Type', headerClassName:'table-bg' },
        { field: 'mode', headerName: 'Mode', headerClassName:'table-bg'},
    ];
  return (
    <div style={{ width: '100%' }}>
      <TableView 
        rows={rows} 
        columns={columns}
        sx={sx}
      />
    </div>
  );
}

export default PreviewSchema;