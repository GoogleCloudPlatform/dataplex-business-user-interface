/**
 * Data Product Type Definition
 * A Data Product is a grouping of multiple tables/assets that represents a business capability
 */

export interface DataProduct {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tables: DataProductTable[]; // Array of tables/assets belonging to this data product
  owner?: string;
  tags?: string[];
  status: 'active' | 'coming-soon' | 'deprecated';
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    aspectTypes?: string[];
    project?: string;
    location?: string;
  };
}

export interface DataProductTable {
  entryName: string;
  fullyQualifiedName: string;
  displayName: string;
  type: string;
  description?: string;
  system?: string;
}



