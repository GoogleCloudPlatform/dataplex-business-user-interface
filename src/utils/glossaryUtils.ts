import {
  type GlossaryItem,
  type FilterChip,
  type FilterFieldType,
  FILTER_FIELD_LABELS,
  VALID_FILTER_FIELDS,
} from "../component/Glossaries/GlossaryDataType";

export const extractGlossaryId = (entryId: string): string | null => {
  const match = entryId.match(
    /(projects\/[^/]+\/locations\/[^/]+\/glossaries\/[^/]+)\/terms\//
  );
  return match ? match[1] : null;
};

export const normalizeId = (id: string) => {
  if (id.includes("/entries/")) {
    return id.split("/entries/")[1];
  }
  return id;
};

export const getAllAncestorIds = (
  items: GlossaryItem[],
  targetId: string
): string[] => {
  const ancestors: string[] = [];
  const findPath = (nodes: GlossaryItem[], target: string, path: string[]) => {
    for (const node of nodes) {
      if (node.id === target) {
        ancestors.push(...path);
        return true;
      }
      if (node.children) {
        if (findPath(node.children, target, [...path, node.id])) return true;
      }
    }
    return false;
  };
  findPath(items, targetId, []);
  return ancestors;
};

export const findItem = (
  items: GlossaryItem[],
  id: string
): GlossaryItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findItem(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const getBreadcrumbs = (
  items: GlossaryItem[],
  targetId: string,
  chain: GlossaryItem[] = []
): GlossaryItem[] | null => {
  for (const item of items) {
    if (item.id === targetId) return [...chain, item];
    if (item.children) {
      const found = getBreadcrumbs(item.children, targetId, [...chain, item]);
      if (found) return found;
    }
  }
  return null;
};

export const filterGlossaryTree = (
  nodes: GlossaryItem[],
  query: string
): GlossaryItem[] => {
  return nodes.reduce((acc: GlossaryItem[], node) => {
    const filteredChildren = node.children
      ? filterGlossaryTree(node.children, query)
      : [];
    const matches = node.displayName
      .toLowerCase()
      .includes(query.toLowerCase());

    if (matches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children:
          matches && filteredChildren.length === 0
            ? node.children
            : filteredChildren,
      });
    }
    return acc;
  }, []);
};

export const collectAllIds = (nodes: GlossaryItem[]): string[] => {
  let ids: string[] = [];
  nodes.forEach((node) => {
    ids.push(node.id);
    if (node.children) ids = [...ids, ...collectAllIds(node.children)];
  });
  return ids;
};

/**
 * Collects only ancestor IDs leading to filter-matched items.
 * Does NOT include the matched items themselves, allowing users to expand them manually.
 */
export const collectAncestorIdsOfMatches = (nodes: GlossaryItem[]): string[] => {
  const ancestorIds: string[] = [];

  const traverse = (node: GlossaryItem): boolean => {
    // Check if any descendant (or this node) is a filter match
    let hasMatchInSubtree = node.isFilterMatch === true;

    if (node.children) {
      for (const child of node.children) {
        if (traverse(child)) {
          hasMatchInSubtree = true;
        }
      }
    }

    // If this node has a match in its subtree but is NOT itself the match,
    // it's an ancestor that should be expanded
    if (hasMatchInSubtree && !node.isFilterMatch) {
      ancestorIds.push(node.id);
    }

    return hasMatchInSubtree;
  };

  nodes.forEach(traverse);
  return ancestorIds;
};

// --- Filter Glossaries Utilities ---

/**
 * Parses a filter input string and returns a FilterChip
 * @param input - The input string to parse (e.g., "Customer" or "name:Customer")
 * @param explicitField - If provided, the explicitly selected field from dropdown
 * @returns FilterChip object or null if invalid
 */
export const parseFilterInput = (
  input: string,
  explicitField?: FilterFieldType | null
): FilterChip | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If an explicit field was selected from dropdown
  if (explicitField) {
    return {
      id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      field: explicitField,
      value: trimmed,
      displayLabel: `${FILTER_FIELD_LABELS[explicitField]}: ${trimmed}`,
      showFieldLabel: true,
    };
  }

  // Check for "field:value" format (manual entry)
  const colonIndex = trimmed.indexOf(":");
  if (colonIndex !== -1) {
    const fieldPart = trimmed.slice(0, colonIndex).toLowerCase().trim();
    const valuePart = trimmed.slice(colonIndex + 1).trim();

    if (!valuePart) return null;

    // Check if field part is a valid filter field
    if (VALID_FILTER_FIELDS.includes(fieldPart as FilterFieldType)) {
      return {
        id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        field: fieldPart as FilterFieldType,
        value: valuePart,
        displayLabel: `${FILTER_FIELD_LABELS[fieldPart as FilterFieldType]}: ${valuePart}`,
        showFieldLabel: true,
      };
    }
  }

  // No explicit field and no valid field:value format - default to name, show only value
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    field: "name",
    value: trimmed,
    displayLabel: trimmed, // Only the value, no "Name:" prefix
    showFieldLabel: false,
  };
};

/**
 * Creates an OR connector chip
 * @returns FilterChip representing an OR connector
 */
export const createOrConnectorChip = (): FilterChip => ({
  id: `or-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field: "name",
  value: "OR",
  displayLabel: "OR",
  connector: "OR",
});

/**
 * Checks if a chip is an OR connector
 * @param chip - The filter chip to check
 * @returns true if the chip is an OR connector
 */
export const isOrConnector = (chip: FilterChip): boolean => {
  return chip.value === "OR" && chip.displayLabel === "OR";
};

/**
 * Gets the display label for a filter field
 * @param field - The filter field type
 * @returns Human-readable label
 */
export const getFilterFieldLabel = (field: FilterFieldType): string => {
  return FILTER_FIELD_LABELS[field] || field;
};

/**
 * Validates if a string is a valid filter field
 * @param field - The field string to validate
 * @returns true if valid
 */
export const isValidFilterField = (field: string): boolean => {
  return VALID_FILTER_FIELDS.includes(field.toLowerCase() as FilterFieldType);
};
