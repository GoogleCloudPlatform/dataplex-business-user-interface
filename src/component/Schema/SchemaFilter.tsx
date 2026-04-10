import React, { useState, useMemo } from 'react';
import { Collapse } from '@mui/material';
import FilterBar from '../Common/FilterBar';
import type { ActiveFilter, PropertyConfig } from '../Common/FilterBar';

/**
 * @file SchemaFilter.tsx
 * @description
 * This component renders a filter bar UI specifically designed to filter the
 * columns (fields) of a data entry's schema.
 *
 * It provides two filtering mechanisms:
 * 1.  **Free-text Search**: A text input that searches across all properties
 * of the schema fields (e.g., Name, Type, Description).
 * 2.  **Property Filtering**: A "Filter" menu that allows users to select a
 * specific property (e.g., 'Type', 'Mode') and then check one or more
 * values to filter by.
 *
 * The component parses the schema from the input `entry` object. Based on the
 * applied filters, it reconstructs a new (deep-copied) `entry` object
 * where the schema aspect contains *only* the fields that match the filters.
 * This new `filteredEntry` object is then passed back to the parent component
 * via the `onFilteredEntryChange` callback.
 *
 * @param {SchemaFilterProps} props - The props for the component.
 * @param {any} props.entry - The complete data entry object containing the
 * schema aspect to be filtered.
 * @param {(filteredEntry: any) => void} props.onFilteredEntryChange - A callback
 * function that is invoked whenever the filters change, passing the new,
 * filtered `entry` object as its argument.
 * @param {any} [props.sx] - (Optional) Material-UI SX props to apply custom
 * styling to the filter bar's root `Box`.
 * @param {boolean} [props.isPreview] - (Optional) If true, this flag
 * restricts the available filter properties to a basic set ('Name', 'Type',
 * 'Mode'), matching the columns in `PreviewSchema`.
 *
 * @returns {React.ReactElement} A React fragment containing the collapsible
 * filter bar UI and the associated `Menu` component for property selection.
 */

interface SchemaFilterProps {
  entry: any;
  onFilteredEntryChange: (filteredEntry: any) => void;
  sx?: any;
  isPreview?: boolean;
}

const SchemaFilter: React.FC<SchemaFilterProps> = ({
  entry,
  onFilteredEntryChange,
  sx,
  isPreview
}) => {
  const [schemaFilterText, setSchemaFilterText] = useState('');
  const [isSchemaFilterExpanded, setIsSchemaFilterExpanded] = useState(true);
  const [activeSchemaFilters, setActiveSchemaFilters] = useState<ActiveFilter[]>([]);

  const number = entry?.entryType?.split('/')?.at(1) ?? 'table';

  // Schema property names for filter dropdown - based on actual table headers
  const schemaPropertyNames: PropertyConfig[] = isPreview ? [
    { name: 'Name', mode: 'both' },
    { name: 'Type', mode: 'both' },
    { name: 'Mode', mode: 'both' },
  ] : [
    { name: 'Name', mode: 'both' },
    { name: 'Type', mode: 'both' },
    { name: 'Metadata Type', mode: 'both' },
    { name: 'Mode', mode: 'both' },
    { name: 'Default Value', mode: 'both' },
    { name: 'Description', mode: 'text' },
  ];

  // Get schema data for filtering - based on actual schema structure
  const schemaData = useMemo(() => {
    if (!entry?.aspects?.[`${number}.global.schema`]?.data?.fields?.fields?.listValue?.values) {
      return [];
    }
    return entry.aspects[`${number}.global.schema`].data.fields.fields.listValue.values.map((field: any, index: number) => ({
      id: index + 1,
      name: field.structValue.fields.name?.stringValue || '',
      type: field.structValue.fields.dataType?.stringValue || '',
      metaDataType: field.structValue.fields.metadataType?.stringValue || '',
      mode: field.structValue.fields.mode?.stringValue || '',
      defaultValue: (field.structValue.fields.defaultValue && field.structValue.fields.defaultValue != null) ? field.structValue.fields.defaultValue?.stringValue : '-',
      description: (field.structValue.fields.description && field.structValue.fields.description != null) ? field.structValue.fields.description?.stringValue : '-'
    }));
  }, [entry, number]);

  // Get unique values for a schema property
  const getSchemaPropertyValues = (property: string): string[] => {
    const values = new Set<string>();

    schemaData.forEach((row: any) => {
      switch (property) {
        case 'Name':
          if (row.name) values.add(row.name);
          break;
        case 'Type':
          if (row.type) values.add(row.type);
          break;
        case 'Metadata Type':
          if (row.metaDataType) values.add(row.metaDataType);
          break;
        case 'Mode':
          if (row.mode) values.add(row.mode);
          break;
        case 'Default Value':
          if (row.defaultValue && row.defaultValue !== '-') values.add(row.defaultValue);
          break;
        case 'Description':
          if (row.description && row.description !== '-') values.add(row.description);
          break;
      }
    });

    return Array.from(values).sort();
  };

  // Filter schema data based on active filter chips only (no auto-filter on keystroke)
  const filteredSchemaData = useMemo(() => {
    if (activeSchemaFilters.length === 0) return schemaData;

    return schemaData.filter((row: any) => {
      return activeSchemaFilters.every(filter => {
        const isTextChip = Boolean(filter.id);
        const matchFn = isTextChip
          ? (value: string, filterVal: string) => value.toLowerCase().includes(filterVal.toLowerCase())
          : (value: string, filterVal: string) => value === filterVal;

        return filter.values.some(value => {
          switch (filter.property) {
            case 'Name': return matchFn(row.name, value);
            case 'Type': return matchFn(row.type, value);
            case 'Metadata Type': return matchFn(row.metaDataType, value);
            case 'Mode': return matchFn(row.mode, value);
            case 'Default Value': return matchFn(row.defaultValue, value);
            case 'Description': return matchFn(row.description, value);
            default: return matchFn(row.name, value) || matchFn(row.type, value) || matchFn(row.description, value);
          }
        });
      });
    });
  }, [schemaData, activeSchemaFilters]);

  // Create filtered entry for schema
  const filteredSchemaEntry = useMemo(() => {
    if (!entry?.aspects?.[`${number}.global.schema`] || activeSchemaFilters.length === 0) {
      return entry;
    }

    const originalFields = entry.aspects[`${number}.global.schema`].data.fields.fields.listValue.values;
    const filteredFields = originalFields.filter((field: any) => {
      const fieldData = {
        name: field.structValue.fields.name?.stringValue || '',
        type: field.structValue.fields.dataType?.stringValue || '',
        metaDataType: field.structValue.fields.metadataType?.stringValue || '',
        mode: field.structValue.fields.mode?.stringValue || '',
        defaultValue: (field.structValue.fields.defaultValue && field.structValue.fields.defaultValue != null) ? field.structValue.fields.defaultValue?.stringValue : '-',
        description: (field.structValue.fields.description && field.structValue.fields.description != null) ? field.structValue.fields.description?.stringValue : '-'
      };

      return filteredSchemaData.some((filteredField: any) =>
        filteredField.name === fieldData.name &&
        filteredField.type === fieldData.type &&
        filteredField.metaDataType === fieldData.metaDataType &&
        filteredField.mode === fieldData.mode &&
        filteredField.defaultValue === fieldData.defaultValue &&
        filteredField.description === fieldData.description
      );
    });

    const filteredEntry = {
      ...entry,
      aspects: {
        ...entry.aspects,
        [`${number}.global.schema`]: {
          ...entry.aspects[`${number}.global.schema`],
          data: {
            ...entry.aspects[`${number}.global.schema`].data,
            fields: {
              ...entry.aspects[`${number}.global.schema`].data.fields,
              fields: {
                ...entry.aspects[`${number}.global.schema`].data.fields.fields,
                listValue: {
                  ...entry.aspects[`${number}.global.schema`].data.fields.fields.listValue,
                  values: filteredFields
                }
              }
            }
          }
        }
      }
    };

    return filteredEntry;
  }, [entry, number, filteredSchemaData, activeSchemaFilters]);

  // Update parent component when filtered entry changes
  React.useEffect(() => {
    onFilteredEntryChange(filteredSchemaEntry);
  }, [filteredSchemaEntry, onFilteredEntryChange]);

  const handleClearAll = () => {
    setIsSchemaFilterExpanded(true);
  };

  return (
    <Collapse in={isSchemaFilterExpanded} timeout={300}>
      <FilterBar
        filterText={schemaFilterText}
        onFilterTextChange={setSchemaFilterText}
        propertyNames={schemaPropertyNames}
        getPropertyValues={getSchemaPropertyValues}
        activeFilters={activeSchemaFilters}
        onActiveFiltersChange={setActiveSchemaFilters}
        onClearAll={handleClearAll}
        defaultProperty="Name"
        isPreview={isPreview}
        sx={sx}
      />
    </Collapse>
  );
};

export default SchemaFilter;
