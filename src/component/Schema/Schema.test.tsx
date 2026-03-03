import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Schema from "./Schema";

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
  default: ({
    rows,
    columns,
    rowHeight,
    columnHeaderHeight,
    sx,
  }: any) => (
    <div
      data-testid="table-view"
      data-rows={JSON.stringify(rows)}
      data-columns={JSON.stringify(columns.map((c: any) => c.field))}
      data-row-height={rowHeight}
      data-column-header-height={columnHeaderHeight}
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
              <td>{row.metaDataType}</td>
              <td>{row.mode}</td>
              <td>{row.defaultValue}</td>
              <td>{row.description}</td>
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
  name: string,
  dataType: string,
  metadataType: string,
  mode: string,
  defaultValue?: string | null,
  description?: string | null
) => ({
  structValue: {
    fields: {
      name: { stringValue: name },
      dataType: { stringValue: dataType },
      metadataType: { stringValue: metadataType },
      mode: { stringValue: mode },
      ...(defaultValue !== undefined && {
        defaultValue: defaultValue === null ? null : { stringValue: defaultValue },
      }),
      ...(description !== undefined && {
        description: description === null ? null : { stringValue: description },
      }),
    },
  },
});

const createMockEntry = (
  projectNumber: string,
  schemaFields: any[]
) => ({
  entryType: `projects/${projectNumber}/locations/us/entryTypes/bigquery.table`,
  aspects: {
    [`${projectNumber}.global.schema`]: {
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
  },
});

// ============================================================================
// Test Suite
// ============================================================================

describe("Schema", () => {
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
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("renders TableView with correct rows", () => {
      const entry = createMockEntry("456", [
        createSchemaField("user_id", "INT64", "PRIMITIVE", "REQUIRED", "0", "User identifier"),
        createSchemaField("username", "STRING", "PRIMITIVE", "NULLABLE", null, "Username"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        id: 1,
        name: "user_id",
        type: "INT64",
        metaDataType: "PRIMITIVE",
        mode: "REQUIRED",
        defaultValue: "0",
        description: "User identifier",
      });
    });

    it("renders TableView with correct columns", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const columns = JSON.parse(tableView.getAttribute("data-columns") || "[]");

      expect(columns).toEqual([
        "name",
        "type",
        "metaDataType",
        "mode",
        "defaultValue",
        "description",
      ]);
    });

    it("displays column headers correctly", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Metadata Type")).toBeInTheDocument();
      expect(screen.getByText("Mode")).toBeInTheDocument();
      expect(screen.getByText("Default Value")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("passes rowHeight to TableView", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-row-height", "36");
    });

    it("passes columnHeaderHeight to TableView", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-column-header-height", "36.5");
    });
  });

  // ==========================================================================
  // Empty Schema Tests
  // ==========================================================================

  describe("Empty Schema", () => {
    it("shows fallback message when schema is empty", () => {
      const entry = createMockEntry("123", []);

      render(<Schema entry={entry} />);

      expect(
        screen.getByText("No Schema Data available for this table")
      ).toBeInTheDocument();
    });

    it("does not render TableView when schema is empty", () => {
      const entry = createMockEntry("123", []);

      render(<Schema entry={entry} />);

      expect(screen.queryByTestId("table-view")).not.toBeInTheDocument();
    });

    it("applies correct styling to fallback message", () => {
      const entry = createMockEntry("123", []);

      render(<Schema entry={entry} />);

      const fallbackDiv = screen.getByText("No Schema Data available for this table");
      expect(fallbackDiv).toHaveStyle({
        padding: "48px",
        textAlign: "center",
        fontSize: "14px",
        color: "#575757",
      });
    });
  });

  // ==========================================================================
  // Default Value Handling Tests
  // ==========================================================================

  describe("Default Value Handling", () => {
    it("displays actual default value when provided", () => {
      const entry = createMockEntry("123", [
        createSchemaField("status", "STRING", "PRIMITIVE", "NULLABLE", "active", null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].defaultValue).toBe("active");
    });

    it("displays '-' when defaultValue is null", () => {
      const entry = createMockEntry("123", [
        createSchemaField("count", "INTEGER", "PRIMITIVE", "NULLABLE", null, null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].defaultValue).toBe("-");
    });

    it("displays '-' when defaultValue is missing", () => {
      const entry = createMockEntry("123", [
        createSchemaField("age", "INTEGER", "PRIMITIVE", "NULLABLE", undefined, null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].defaultValue).toBe("-");
    });

    it("displays empty string default value", () => {
      const entry = createMockEntry("123", [
        createSchemaField("notes", "STRING", "PRIMITIVE", "NULLABLE", "", null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].defaultValue).toBe("");
    });
  });

  // ==========================================================================
  // Description Handling Tests
  // ==========================================================================

  describe("Description Handling", () => {
    it("displays actual description when provided", () => {
      const entry = createMockEntry("123", [
        createSchemaField("email", "STRING", "PRIMITIVE", "REQUIRED", null, "User email address"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].description).toBe("User email address");
    });

    it("displays '-' when description is null", () => {
      const entry = createMockEntry("123", [
        createSchemaField("phone", "STRING", "PRIMITIVE", "NULLABLE", null, null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].description).toBe("-");
    });

    it("displays '-' when description is missing", () => {
      const entry = createMockEntry("123", [
        createSchemaField("address", "STRING", "PRIMITIVE", "NULLABLE", null, undefined),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].description).toBe("-");
    });

    it("displays empty string description", () => {
      const entry = createMockEntry("123", [
        createSchemaField("comment", "STRING", "PRIMITIVE", "NULLABLE", null, ""),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].description).toBe("");
    });
  });

  // ==========================================================================
  // Entry Type Parsing Tests
  // ==========================================================================

  describe("Entry Type Parsing", () => {
    it("extracts project number from standard entryType format", () => {
      const entry = createMockEntry("789", [
        createSchemaField("field1", "STRING", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
      expect(screen.getByText("field1")).toBeInTheDocument();
    });

    it("handles numeric project ID", () => {
      const entry = createMockEntry("9876543210", [
        createSchemaField("data", "BYTES", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });

    it("handles alphanumeric project ID", () => {
      const entry = createMockEntry("my-project-123", [
        createSchemaField("column", "STRING", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByTestId("table-view")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Multiple Schema Fields Tests
  // ==========================================================================

  describe("Multiple Schema Fields", () => {
    it("handles multiple schema fields", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INT64", "PRIMITIVE", "REQUIRED", "0", "Primary key"),
        createSchemaField("name", "STRING", "PRIMITIVE", "REQUIRED", null, "User name"),
        createSchemaField("email", "STRING", "PRIMITIVE", "NULLABLE", null, "Email address"),
        createSchemaField("age", "INT64", "PRIMITIVE", "NULLABLE", "18", null),
        createSchemaField("is_active", "BOOLEAN", "PRIMITIVE", "NULLABLE", "true", "Active status"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(5);
    });

    it("assigns sequential IDs starting from 1", () => {
      const entry = createMockEntry("123", [
        createSchemaField("col1", "STRING", "PRIMITIVE", "NULLABLE"),
        createSchemaField("col2", "INTEGER", "PRIMITIVE", "NULLABLE"),
        createSchemaField("col3", "BOOLEAN", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows.map((r: any) => r.id)).toEqual([1, 2, 3]);
    });
  });

  // ==========================================================================
  // SX Props Tests
  // ==========================================================================

  describe("SX Props", () => {
    it("passes sx prop to TableView", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);
      const customSx = { backgroundColor: "red" };

      render(<Schema entry={entry} sx={customSx} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-has-sx", "true");
    });

    it("works without sx prop", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      expect(tableView).toHaveAttribute("data-has-sx", "true"); // Default sx is always provided
    });

    it("applies sx to root div", () => {
      const entry = createMockEntry("123", [
        createSchemaField("id", "INTEGER", "PRIMITIVE", "REQUIRED"),
      ]);
      const customSx = { marginTop: "10px" };

      const { container } = render(<Schema entry={entry} sx={customSx} />);

      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveStyle({ width: "100%" });
    });
  });

  // ==========================================================================
  // Row Data Rendering Tests
  // ==========================================================================

  describe("Row Data Rendering", () => {
    it("displays field values in table cells", () => {
      const entry = createMockEntry("123", [
        createSchemaField("user_id", "INT64", "PRIMITIVE", "REQUIRED", "1", "User ID"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText("user_id")).toBeInTheDocument();
      expect(screen.getByText("INT64")).toBeInTheDocument();
      expect(screen.getByText("PRIMITIVE")).toBeInTheDocument();
      expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("User ID")).toBeInTheDocument();
    });

    it("renders all data types correctly", () => {
      const entry = createMockEntry("123", [
        createSchemaField("string_col", "STRING", "PRIMITIVE", "NULLABLE"),
        createSchemaField("int_col", "INT64", "PRIMITIVE", "NULLABLE"),
        createSchemaField("float_col", "FLOAT64", "PRIMITIVE", "NULLABLE"),
        createSchemaField("bool_col", "BOOLEAN", "PRIMITIVE", "NULLABLE"),
        createSchemaField("timestamp_col", "TIMESTAMP", "PRIMITIVE", "NULLABLE"),
        createSchemaField("date_col", "DATE", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText("STRING")).toBeInTheDocument();
      expect(screen.getByText("INT64")).toBeInTheDocument();
      expect(screen.getByText("FLOAT64")).toBeInTheDocument();
      expect(screen.getByText("BOOLEAN")).toBeInTheDocument();
      expect(screen.getByText("TIMESTAMP")).toBeInTheDocument();
      expect(screen.getByText("DATE")).toBeInTheDocument();
    });

    it("renders different modes correctly", () => {
      const entry = createMockEntry("123", [
        createSchemaField("required_col", "STRING", "PRIMITIVE", "REQUIRED"),
        createSchemaField("nullable_col", "STRING", "PRIMITIVE", "NULLABLE"),
        createSchemaField("repeated_col", "STRING", "PRIMITIVE", "REPEATED"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText("REQUIRED")).toBeInTheDocument();
      expect(screen.getByText("NULLABLE")).toBeInTheDocument();
      expect(screen.getByText("REPEATED")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe("Edge Cases", () => {
    it("handles very long field names", () => {
      const longName = "a".repeat(500);
      const entry = createMockEntry("123", [
        createSchemaField(longName, "STRING", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].name).toBe(longName);
    });

    it("handles special characters in field names", () => {
      const specialName = "field_with-special.chars@123";
      const entry = createMockEntry("123", [
        createSchemaField(specialName, "STRING", "PRIMITIVE", "NULLABLE"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it("handles unicode characters in description", () => {
      const unicodeDesc = "Description with unicode: \u00e9\u00e8\u00ea \u4e2d\u6587";
      const entry = createMockEntry("123", [
        createSchemaField("field", "STRING", "PRIMITIVE", "NULLABLE", null, unicodeDesc),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].description).toBe(unicodeDesc);
    });

    it("handles different metadata types", () => {
      const entry = createMockEntry("123", [
        createSchemaField("col1", "STRING", "PRIMITIVE", "NULLABLE"),
        createSchemaField("col2", "RECORD", "COMPLEX", "NULLABLE"),
        createSchemaField("col3", "ARRAY", "COLLECTION", "REPEATED"),
      ]);

      render(<Schema entry={entry} />);

      expect(screen.getByText("PRIMITIVE")).toBeInTheDocument();
      expect(screen.getByText("COMPLEX")).toBeInTheDocument();
      expect(screen.getByText("COLLECTION")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe("Integration Tests", () => {
    it("renders complete schema table with all field properties", () => {
      const entry = createMockEntry("production-project", [
        createSchemaField("id", "INT64", "PRIMITIVE", "REQUIRED", "0", "Primary key"),
        createSchemaField("username", "STRING", "PRIMITIVE", "REQUIRED", null, "Username"),
        createSchemaField("email", "STRING", "PRIMITIVE", "NULLABLE", null, "User email"),
        createSchemaField("age", "INT64", "PRIMITIVE", "NULLABLE", "18", null),
        createSchemaField("is_active", "BOOLEAN", "PRIMITIVE", "NULLABLE", "true", "Active flag"),
        createSchemaField("created_at", "TIMESTAMP", "PRIMITIVE", "REQUIRED", null, "Creation time"),
        createSchemaField("tags", "STRING", "COLLECTION", "REPEATED", null, "User tags"),
        createSchemaField("metadata", "JSON", "COMPLEX", "NULLABLE", "{}", "Extra data"),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows).toHaveLength(8);
      expect(screen.getByText("id")).toBeInTheDocument();
      expect(screen.getByText("username")).toBeInTheDocument();
      expect(screen.getByText("email")).toBeInTheDocument();
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
                            metadataType: { stringValue: "PRIMITIVE" },
                            mode: { stringValue: "REQUIRED" },
                            defaultValue: null,
                            description: { stringValue: "Unique event identifier" },
                          },
                        },
                      },
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "event_timestamp" },
                            dataType: { stringValue: "TIMESTAMP" },
                            metadataType: { stringValue: "PRIMITIVE" },
                            mode: { stringValue: "REQUIRED" },
                            description: { stringValue: "When the event occurred" },
                          },
                        },
                      },
                      {
                        structValue: {
                          fields: {
                            name: { stringValue: "user_pseudo_id" },
                            dataType: { stringValue: "STRING" },
                            metadataType: { stringValue: "PRIMITIVE" },
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

      render(<Schema entry={entry} />);

      expect(screen.getByText("event_id")).toBeInTheDocument();
      expect(screen.getByText("event_timestamp")).toBeInTheDocument();
      expect(screen.getByText("user_pseudo_id")).toBeInTheDocument();
    });

    it("schema with mixed default values and descriptions", () => {
      const entry = createMockEntry("123", [
        createSchemaField("col1", "STRING", "PRIMITIVE", "REQUIRED", "default1", "desc1"),
        createSchemaField("col2", "STRING", "PRIMITIVE", "REQUIRED", null, "desc2"),
        createSchemaField("col3", "STRING", "PRIMITIVE", "REQUIRED", "default3", null),
        createSchemaField("col4", "STRING", "PRIMITIVE", "REQUIRED", null, null),
      ]);

      render(<Schema entry={entry} />);

      const tableView = screen.getByTestId("table-view");
      const rows = JSON.parse(tableView.getAttribute("data-rows") || "[]");

      expect(rows[0].defaultValue).toBe("default1");
      expect(rows[0].description).toBe("desc1");
      expect(rows[1].defaultValue).toBe("-");
      expect(rows[1].description).toBe("desc2");
      expect(rows[2].defaultValue).toBe("default3");
      expect(rows[2].description).toBe("-");
      expect(rows[3].defaultValue).toBe("-");
      expect(rows[3].description).toBe("-");
    });
  });
});
