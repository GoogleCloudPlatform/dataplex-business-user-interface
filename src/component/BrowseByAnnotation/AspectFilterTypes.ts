export type AspectFilterFieldType =
  | "name_contains"
  | "name_prefix"
  | "location"
  | "created_on"
  | "created_before"
  | "created_after";

export type AspectFilterConnector = "AND" | "OR";

export interface AspectFilterChip {
  id: string;
  field: AspectFilterFieldType;
  value: string;
  displayLabel: string;
  connector?: AspectFilterConnector;
  showFieldLabel?: boolean;
}

export const ASPECT_FILTER_FIELD_LABELS: Record<AspectFilterFieldType, string> = {
  name_contains: "Name contains",
  name_prefix: "Name prefix",
  location: "Location",
  created_on: "Created on",
  created_before: "Created before",
  created_after: "Created after",
};

export const ASPECT_VALID_FILTER_FIELDS: AspectFilterFieldType[] = [
  "name_contains",
  "name_prefix",
  "location",
  "created_on",
  "created_before",
  "created_after",
];

export const DATE_FILTER_FIELDS: AspectFilterFieldType[] = [
  "created_on",
  "created_before",
  "created_after",
];

export const isDateField = (field: AspectFilterFieldType): boolean =>
  DATE_FILTER_FIELDS.includes(field);

export const createAspectFilterChip = (
  field: AspectFilterFieldType,
  value: string
): AspectFilterChip => ({
  id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field,
  value,
  displayLabel: `${ASPECT_FILTER_FIELD_LABELS[field]}: ${value}`,
  showFieldLabel: true,
});

export const createOrConnectorChip = (): AspectFilterChip => ({
  id: `or-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field: "name_contains",
  value: "OR",
  displayLabel: "OR",
  connector: "OR",
});

export const isOrConnector = (chip: AspectFilterChip): boolean =>
  chip.connector === "OR";
