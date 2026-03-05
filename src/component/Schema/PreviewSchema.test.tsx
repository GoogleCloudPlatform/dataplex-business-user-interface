import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PreviewSchema from "./PreviewSchema";

// ============================================================================
// Mock @mui/x-data-grid to avoid CSS import error
// ============================================================================

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: () => null,
}));

// ============================================================================
// Mock TableView Component
// ============================================================================

vi.mock("../Table/TableView", () => ({
  default: ({ rows, columns, sx }: any) => (
    <div
      data-testid="table-view"
      data-rows={JSON.stringify(rows)}
      data-columns={JSON.stringify(columns.map((c: any) => c.field))}
      data-has-sx={sx ? "true" : "false"}
    >
      <table>
        <thead>
          <tr>
            {columns.map((col: any) => (
              <th key={col.field}>{col.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.type}</td>
              <td>{row.mode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

// ============================================================================
// Mock Data Generators
// ============================================================================

const createSchemaField = (
  name?: string,
  dataType?: string,
  mode?: string
) => ({
  structValue: {
    fields: {
      ...(name !== undefined && { name: { stringValue: name } }),
      ...(dataType !== undefined && { dataType: { stringValue: dataType } }),
      ...(mode !== undefined && { mode: { stringValue: mode } }),
    },
  },
});

const createMockEntry = (
  entryType?: string,
  schemaKey?: string,
  schemaFields?: any[]
) => ({
  entryType,
  aspects: schemaKey
    ? {
        [schemaKey]: {
          data: {
            fields: {
              fields: {
                listValue: {
                  values: schemaFields,
                },
              },
            },
          },
        },
      }
    : undefined,
});

// ============================================================================
// Test Suite
// ============================================================================

describe("PreviewSchema", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================

  describe("Basic Rendering", () => {
    it("renders without crashing with valid entry", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("id", "INTEGER", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("renders TableView with correct rows", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [
          createSchemaField("id", "INTEGER", "REQUIRED"),
          createSchemaField("name", "STRING", "NULLABLE"),
        ]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        id: 1,
        name: "id",
        type: "INTEGER",
        mode: "REQUIRED",
      });
      expect(rows[1]).toEqual({
        id: 2,
        name: "name",
        type: "STRING",
        mode: "NULLABLE",
      });
    });

    it("renders TableView with correct columns", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("id", "INTEGER", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const columns = JSON.parse(tableView.getAttribute("data-columns") || "[]");

      expect(columns).toEqual(["name", "type", "mode"]);
    });

    it("displays column headers Name, Type, Mode", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("id", "INTEGER", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Mode")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // No Schema Data Tests
  // ==========================================================================

  describe("No Schema Data Available", () => {
    it("shows message when entry is undefined", () => {
      render(<PreviewSchema entry={undefined as any} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when entry has no entryType", () => {
      const entry = { aspects: {} };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when entryType is empty string", () => {
      const entry = { entryType: "" };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when entry has no aspects", () => {
      const entry = { entryType: "projects/1/locations/us/entryTypes/table" };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when schema key does not exist in aspects", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "wrong.key": {},
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when schema has no data property", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {},
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when schema data has no fields property", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {},
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when schema fields has no nested fields", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {},
            },
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when listValue is missing", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {},
              },
            },
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("shows message when values array is missing", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {},
                },
              },
            },
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Entry Type Parsing Tests
  // ==========================================================================

  describe("Entry Type Parsing", () => {
    it("extracts schema key from standard entryType format", () => {
      const entry = createMockEntry(
        "projects/123/locations/us/entryTypes/bigquery.table",
        "123.global.schema",
        [createSchemaField("column1", "STRING", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
      expect(screen.getByText("column1")).toBeInTheDocument();
    });

    it("handles entryType with different project numbers", () => {
      const entry = createMockEntry(
        "projects/456/locations/eu/entryTypes/custom.type",
        "456.global.schema",
        [createSchemaField("field1", "BOOLEAN", "REQUIRED")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("uses 'table' as default when entryType has no slash", () => {
      const entry = createMockEntry(
        "singleSegment",
        "table.global.schema",
        [createSchemaField("col", "INT", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("handles entryType with only one segment before slash", () => {
      const entry = createMockEntry(
        "projects/",
        ".global.schema",
        [createSchemaField("test", "STRING", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      // With "projects/" split gives ["projects", ""], so number = ""
      // Schema key becomes ".global.schema"
      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Schema Field Handling Tests
  // ==========================================================================

  describe("Schema Field Handling", () => {
    it("handles field with missing name", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField(undefined, "INTEGER", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].name).toBe("");
    });

    it("handles field with missing dataType", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("column1", undefined, "REQUIRED")]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].type).toBe("");
    });

    it("handles field with missing mode", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("column1", "STRING", undefined)]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].mode).toBe("");
    });

    it("handles field with all properties missing", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [{ structValue: { fields: {} } }]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0]).toEqual({
        id: 1,
        name: "",
        type: "",
        mode: "",
      });
    });

    it("handles multiple schema fields", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [
          createSchemaField("id", "INTEGER", "REQUIRED"),
          createSchemaField("name", "STRING", "NULLABLE"),
          createSchemaField("email", "STRING", "NULLABLE"),
          createSchemaField("created_at", "TIMESTAMP", "REQUIRED"),
        ]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(4);
      expect(rows[0].id).toBe(1);
      expect(rows[1].id).toBe(2);
      expect(rows[2].id).toBe(3);
      expect(rows[3].id).toBe(4);
    });

    it("handles empty schema fields array", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        []
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(0);
    });

    it("handles field with missing structValue", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [{}]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0]).toEqual({
        id: 1,
        name: "",
        type: "",
        mode: "",
      });
    });

    it("handles field with missing fields in structValue", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [{ structValue: {} }]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0]).toEqual({
        id: 1,
        name: "",
        type: "",
        mode: "",
      });
    });
  });

  // ==========================================================================
  // SX Props Tests
  // ==========================================================================

  describe("SX Props", () => {
    it("passes sx prop to TableView", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("id", "INTEGER", "NULLABLE")]
      );
      const customSx = { backgroundColor: "red" };

      render(<PreviewSchema entry={entry} sx={customSx} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-has-sx", "true");
    });

    it("works without sx prop", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("id", "INTEGER", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-has-sx", "false");
    });
  });

  // ==========================================================================
  // Row Data Rendering Tests
  // ==========================================================================

  describe("Row Data Rendering", () => {
    it("displays field values in table cells", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField("user_id", "INT64", "REQUIRED")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("user_id")).toBeInTheDocument();
      expect(screen.getByText("INT64")).toBeInTheDocument();
      expect(screen.getByText("REQUIRED")).toBeInTheDocument();
    });

    it("assigns sequential IDs starting from 1", () => {
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [
          createSchemaField("col1", "STRING", "NULLABLE"),
          createSchemaField("col2", "INTEGER", "NULLABLE"),
          createSchemaField("col3", "BOOLEAN", "NULLABLE"),
        ]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows.map((r: any) => r.id)).toEqual([1, 2, 3]);
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles entry with null entryType", () => {
      const entry = { entryType: null as any, aspects: {} };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("handles entry with undefined aspects", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: undefined,
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("No schema data available")).toBeInTheDocument();
    });

    it("handles very long field names", () => {
      const longName = "a".repeat(1000);
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField(longName, "STRING", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].name).toBe(longName);
    });

    it("handles special characters in field names", () => {
      const specialName = "field_with-special.chars@123";
      const entry = createMockEntry(
        "projects/1/locations/us/entryTypes/table",
        "1.global.schema",
        [createSchemaField(specialName, "STRING", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it("handles numeric project ID in entryType", () => {
      const entry = createMockEntry(
        "projects/9876543210/locations/us-central1/entryTypes/bigquery.table",
        "9876543210.global.schema",
        [createSchemaField("data", "BYTES", "NULLABLE")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("handles alphanumeric project ID in entryType", () => {
      const entry = createMockEntry(
        "projects/my-project-123/locations/asia-east1/entryTypes/custom.entry",
        "my-project-123.global.schema",
        [createSchemaField("field", "STRING", "REQUIRED")]
      );

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("handles field with name containing only stringValue key", () => {
      const entry = {
        entryType: "projects/1/locations/us/entryTypes/table",
        aspects: {
          "1.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "test_field" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].name).toBe("test_field");
      expect(rows[0].type).toBe("");
      expect(rows[0].mode).toBe("");
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("renders complete schema table with multiple fields", () => {
      const entry = createMockEntry(
        "projects/production-project/locations/us/entryTypes/bigquery.table",
        "production-project.global.schema",
        [
          createSchemaField("id", "INT64", "REQUIRED"),
          createSchemaField("username", "STRING", "REQUIRED"),
          createSchemaField("email", "STRING", "NULLABLE"),
          createSchemaField("age", "INT64", "NULLABLE"),
          createSchemaField("is_active", "BOOLEAN", "NULLABLE"),
          createSchemaField("created_at", "TIMESTAMP", "REQUIRED"),
          createSchemaField("updated_at", "TIMESTAMP", "NULLABLE"),
          createSchemaField("metadata", "JSON", "NULLABLE"),
        ]
      );

      render(<PreviewSchema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(8);
      expect(screen.getByText("id")).toBeInTheDocument();
      expect(screen.getByText("username")).toBeInTheDocument();
      expect(screen.getByText("email")).toBeInTheDocument();
      // INT64 appears twice (id and age columns)
      expect(screen.getAllByText("INT64")).toHaveLength(2);
      expect(screen.getByText("BOOLEAN")).toBeInTheDocument();
      // TIMESTAMP appears twice (created_at and updated_at columns)
      expect(screen.getAllByText("TIMESTAMP")).toHaveLength(2);
    });

    it("handles realistic BigQuery schema", () => {
      const entry = {
        entryType: "projects/analytics-prod/locations/US/entryTypes/bigquery.table",
        aspects: {
          "analytics-prod.global.schema": {
            data: {
              fields: {
                fields: {
                  listValue: {
                    values: [
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "event_id" },
                            dataType: { stringValue: "STRING" },
                            mode: { stringValue: "REQUIRED" },
                          },
                        },
                      },
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "event_timestamp" },
                            dataType: { stringValue: "TIMESTAMP" },
                            mode: { stringValue: "REQUIRED" },
                          },
                        },
                      },
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "user_pseudo_id" },
                            dataType: { stringValue: "STRING" },
                            mode: { stringValue: "NULLABLE" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      };

      render(<PreviewSchema entry={entry} />);

      expect(screen.getByText("event_id")).toBeInTheDocument();
      expect(screen.getByText("event_timestamp")).toBeInTheDocument();
      expect(screen.getByText("user_pseudo_id")).toBeInTheDocument();
    });
  });
});
