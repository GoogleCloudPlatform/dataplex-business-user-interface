/**
 * Mock data for Insights tab
 * Based on insights_sample.json - will be replaced with API call when backend is ready
 */

export interface InsightJob {
  name: string;
  uid: string;
  startTime: string;
  endTime: string;
  state: 'SUCCEEDED' | 'FAILED' | 'RUNNING' | 'PENDING';
  type: 'DATA_DOCUMENTATION';
  createTime: string;
  dataDocumentationSpec: {
    catalogPublishingEnabled: boolean;
  };
  dataDocumentationResult?: DataDocumentationResult;
}

export interface DataDocumentationResult {
  tableResult?: {
    name: string;
    overview: string;
    schema: {
      fields: ColumnDescription[];
    };
    queries: QueryItem[];
  };
  datasetResult?: {
    name: string;
    overview: string;
    queries: QueryItem[];
    schemaRelationships: any[];
  };
}

export interface SchemaRelationship {
  leftSchemaPath: SchemaPaths;
  rightSchemaPath: SchemaPaths;
  sqlTransformation?: string;
  sources?: string[];
  confidenceScore?: number;
  type?: 'JOIN' | 'UNION' | 'LOOKUP';
}

export interface SchemaPaths {
  tableFqn: string;
  paths: string[];
}

export interface ColumnDescription {
  name: string;
  description: string;
}

export interface QueryItem {
  sql: string;
  description: string;
}

export interface InsightsResponse {
  insights: InsightJob[];
}

export const mockInsightsData: InsightsResponse = {
  insights: [
    {
      name: "projects/1069578231809/locations/us-central1/dataScans/a561632b5-493c-400b-86b0-80fd2e814ad2/jobs/23bd6425-787c-467d-95ed-bd75dc08e310",
      uid: "23bd6425-787c-467d-95ed-bd75dc08e310",
      startTime: "2026-02-05T12:11:36.626112533Z",
      endTime: "2026-02-05T12:12:23.122921884Z",
      state: "SUCCEEDED",
      type: "DATA_DOCUMENTATION",
      createTime: "2026-02-05T12:11:36.626050423Z",
      dataDocumentationSpec: {
        catalogPublishingEnabled: true
      },
      dataDocumentationResult: {
        tableResult: {
          name: "//bigquery.googleapis.com/projects/data-studio-459108/datasets/dataplex_test/tables/employee",
          overview: "This table stores employee information. It includes details about employees and their respective departments. The data in this table can be used for human resources management. It can also be used for organizational planning and analysis.",
          schema: {
            fields: [
              { name: "department", description: "The department the employee belongs to." },
              { name: "emp_id", description: "Unique identifier for the employee." },
              { name: "name", description: "The name of the employee." },
              { name: "salary", description: "The salary of the employee." }
            ]
          },
          queries: [
            {
              sql: "SELECT e.`emp_id`, e.`name`, e.`salary` FROM `data-studio-459108.dataplex_test.employee` e JOIN (SELECT `emp_id`, AVG(`salary`) AS avg_salary FROM `data-studio-459108.dataplex_test.employee` GROUP BY `emp_id`) a ON e.`emp_id` = a.`emp_id` WHERE e.`salary` > 1.25 * a.avg_salary;",
              description: "Find employees whose salary is more than 1.25 times the average salary of employees with the same emp_id."
            },
            {
              sql: "SELECT `department`, AVG(`salary`) AS avg_salary FROM `data-studio-459108.dataplex_test.employee` GROUP BY `department` HAVING ABS(AVG(`salary`) - (SELECT AVG(`salary`) FROM `data-studio-459108.dataplex_test.employee`)) > (SELECT STDDEV(`salary`) FROM `data-studio-459108.dataplex_test.employee`);",
              description: "Find departments where the average salary deviates significantly from the overall average salary across all departments."
            },
            {
              sql: "SELECT `department`, COUNTIF(`salary` > (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(75)] FROM `data-studio-459108.dataplex_test.employee`)) / COUNT(*) AS high_earner_ratio FROM `data-studio-459108.dataplex_test.employee` GROUP BY `department` HAVING high_earner_ratio > 0.5;",
              description: "Calculate the ratio of employees with salaries above the 75th percentile to the total number of employees in each department, highlighting departments with a disproportionately high number of high earners."
            },
            {
              sql: "SELECT `emp_id`, `name`, `department`, `salary` FROM `data-studio-459108.dataplex_test.employee` WHERE `salary` > 75000 AND `department` = 'HR';",
              description: "Identify employees whose salary is greater than 75000 but belong to the 'HR' department, which might be unusual compared to the general salary distribution."
            },
            {
              sql: "SELECT `emp_id`, `name`, `department`, `salary` FROM `data-studio-459108.dataplex_test.employee` WHERE `salary` < (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(25)] FROM `data-studio-459108.dataplex_test.employee`);",
              description: "Identify employees with salaries below the 25th percentile for the entire company, potentially indicating underpaid employees."
            },
            {
              sql: "SELECT department FROM `data-studio-459108.dataplex_test.employee` GROUP BY department HAVING MIN(salary) > (SELECT APPROX_QUANTILES(salary, 2)[OFFSET(1)] FROM `data-studio-459108.dataplex_test.employee`);",
              description: "Find the department where the minimum salary is greater than the median salary of all employees."
            },
            {
              sql: "SELECT department, SUM(CASE WHEN salary > 70000 THEN 1 ELSE 0 END) / COUNT(*) AS high_salary_ratio FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the ratio of employees with salary greater than 70000 to the total number of employees in each department."
            },
            {
              sql: "SELECT `name`, `department`, `salary`, `salary` - LEAD(`salary`, 1, 0) OVER (PARTITION BY `department` ORDER BY `salary` DESC) AS salary_difference FROM `data-studio-459108.dataplex_test.employee`;",
              description: "Calculate the difference in salary between each employee and the employee with the next highest salary in the same department."
            },
            {
              sql: "SELECT `name`, `department`, `salary`, `salary` - AVG(`salary`) OVER (PARTITION BY `department`) AS salary_difference FROM `data-studio-459108.dataplex_test.employee`;",
              description: "Calculate the difference between each employee's salary and the average salary of their department."
            },
            {
              sql: "SELECT department, AVG(salary) AS average_salary FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the average salary for each department."
            }
          ]
        }
      }
    },
    {
      name: "projects/1069578231809/locations/us-central1/dataScans/a561632b5-493c-400b-86b0-80fd2e814ad2/jobs/eb81c9c0-bdab-4c1e-bc0b-ab9247bc27f3",
      uid: "eb81c9c0-bdab-4c1e-bc0b-ab9247bc27f3",
      startTime: "2026-02-05T12:18:54.988155523Z",
      endTime: "2026-02-05T12:19:40.650005494Z",
      state: "SUCCEEDED",
      type: "DATA_DOCUMENTATION",
      createTime: "2026-02-05T12:18:54.988079889Z",
      dataDocumentationSpec: {
        catalogPublishingEnabled: true
      },
      dataDocumentationResult: {
        tableResult: {
          name: "//bigquery.googleapis.com/projects/data-studio-459108/datasets/dataplex_test/tables/employee",
          overview: "This table stores employee information. It includes details about employees' department and salary. The table can be used to analyze employee compensation across different departments. It can also be used for human resources management and reporting.",
          schema: {
            fields: [
              { name: "department", description: "The department the employee belongs to." },
              { name: "emp_id", description: "Unique identifier for the employee." },
              { name: "name", description: "Name of the employee." },
              { name: "salary", description: "The employee's salary." }
            ]
          },
          queries: [
            {
              sql: "WITH DepartmentSalaryStats AS (\n  SELECT\n    department,\n    APPROX_QUANTILES(salary, 4)[OFFSET(1)] AS q1,\n    APPROX_QUANTILES(salary, 4)[OFFSET(2)] AS median_salary,\n    APPROX_QUANTILES(salary, 4)[OFFSET(3)] AS q3\n  FROM\n    `data-studio-459108.dataplex_test.employee`\n  GROUP BY\n    department\n)\nSELECT\n  e.emp_id,\n  e.name,\n  e.department,\n  e.salary,\n  dss.median_salary\nFROM\n  `data-studio-459108.dataplex_test.employee` e\nJOIN\n  DepartmentSalaryStats dss ON e.department = dss.department\nWHERE e.salary > dss.median_salary + 1.5 * (dss.q3 - dss.q1);",
              description: "Identifies employees whose salary is significantly higher than the median salary for their department, considering a threshold based on interquartile range."
            },
            {
              sql: "WITH DepartmentSalaryRange AS (\n  SELECT\n    department,\n    MAX(salary) AS max_salary,\n    MIN(salary) AS min_salary,\n    MAX(salary) - MIN(salary) AS salary_range\n  FROM\n    `data-studio-459108.dataplex_test.employee`\n  GROUP BY\n    department\n),\nOverallMedianSalary AS (\n  SELECT APPROX_QUANTILES(salary, 2)[OFFSET(1)] AS overall_median FROM `data-studio-459108.dataplex_test.employee`\n)\nSELECT\n  dsr.department,\n  dsr.salary_range,\n  oms.overall_median\nFROM\n  DepartmentSalaryRange dsr\nCROSS JOIN OverallMedianSalary oms\nWHERE dsr.salary_range > 2 * oms.overall_median;",
              description: "Finds departments where the range of salaries (max - min) is unusually large compared to the median salary of the entire company."
            },
            {
              sql: "WITH SalaryStats AS (\n  SELECT\n    AVG(salary) AS avg_salary,\n    STDDEV(salary) AS std_dev_salary\n  FROM\n    `data-studio-459108.dataplex_test.employee`\n)\nSELECT\n  e.emp_id,\n  e.name,\n  e.salary,\n  ss.avg_salary,\n  ss.std_dev_salary\nFROM\n  `data-studio-459108.dataplex_test.employee` e\nCROSS JOIN SalaryStats ss\nWHERE ABS(e.salary - ss.avg_salary) > 2 * ss.std_dev_salary;",
              description: "Identifies employees with salaries significantly deviating from the average salary, using standard deviation as a measure of dispersion."
            },
            {
              sql: "SELECT department FROM `data-studio-459108.dataplex_test.employee` GROUP BY department HAVING MAX(salary) > 2 * AVG(salary);",
              description: "Identify departments where the employee with the highest salary earns more than twice the department's average salary."
            },
            {
              sql: "SELECT department, MAX(salary) - APPROX_QUANTILES(salary, 4)[OFFSET(3)] AS salary_difference FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the difference between the maximum salary and the 75th percentile salary for each department."
            },
            {
              sql: "SELECT department, MAX(salary) / MIN(salary) AS salary_ratio FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the ratio of the maximum salary to the minimum salary for each department."
            },
            {
              sql: "SELECT department, STDDEV_POP(salary) AS salary_stddev FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the standard deviation of salaries for each department."
            },
            {
              sql: "SELECT `name`, `department`, `salary`, RANK() OVER (PARTITION BY `department` ORDER BY `salary` DESC) AS salary_rank FROM `data-studio-459108.dataplex_test.employee`;",
              description: "Rank employees within each department based on their salary."
            },
            {
              sql: "SELECT department, MAX(salary) - MIN(salary) AS salary_range FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the salary range (max salary - min salary) for each department."
            },
            {
              sql: "SELECT department FROM `data-studio-459108.dataplex_test.employee` GROUP BY department ORDER BY AVG(salary) DESC LIMIT 1;",
              description: "Find the department with the highest average salary."
            }
          ]
        }
      }
    },
    {
      name: "projects/1069578231809/locations/us-central1/dataScans/a561632b5-493c-400b-86b0-80fd2e814ad2/jobs/112ff545-234c-4769-9eef-6f15c12ef037",
      uid: "112ff545-234c-4769-9eef-6f15c12ef037",
      startTime: "2026-02-06T12:30:53.235611525Z",
      endTime: "2026-02-06T12:31:37.272919971Z",
      state: "SUCCEEDED",
      type: "DATA_DOCUMENTATION",
      createTime: "2026-02-06T12:30:53.235571374Z",
      dataDocumentationSpec: {
        catalogPublishingEnabled: true
      },
      dataDocumentationResult: {
        tableResult: {
          name: "//bigquery.googleapis.com/projects/data-studio-459108/datasets/dataplex_test/tables/employee",
          overview: "This table stores employee information. It includes details about employees' department and salary. The table can be used to analyze employee compensation across different departments. It can also be used for human resources management and reporting.",
          schema: {
            fields: [
              { name: "salary", description: "The employee's salary." },
              { name: "department", description: "The department the employee belongs to." },
              { name: "emp_id", description: "Unique identifier for the employee." },
              { name: "name", description: "Name of the employee." }
            ]
          },
          queries: [
            {
              sql: "SELECT\n  `emp_id`,\n  `name`,\n  `department`,\n  `salary`\nFROM\n  `data-studio-459108.dataplex_test.employee`\nWHERE\n  `salary` < (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(25)] FROM `data-studio-459108.dataplex_test.employee`)\n  AND `department` IN (SELECT `department` FROM `data-studio-459108.dataplex_test.employee` GROUP BY `department` HAVING AVG(`salary`) > (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(75)] FROM `data-studio-459108.dataplex_test.employee`));",
              description: "Identifies employees whose salary is below the 25th percentile while belonging to a department where the average salary is above the 75th percentile, potentially indicating underpaid employees."
            },
            {
              sql: "SELECT\n  `department`,\n  AVG(`salary`) AS avg_salary\nFROM\n  `data-studio-459108.dataplex_test.employee`\nGROUP BY\n  `department`\nHAVING\n  ABS(AVG(`salary`) - (SELECT AVG(`salary`) FROM `data-studio-459108.dataplex_test.employee`)) > (SELECT STDDEV(`salary`) FROM `data-studio-459108.dataplex_test.employee`);",
              description: "Finds departments where the average salary deviates significantly from the overall average salary across all departments, indicating potential anomalies in departmental compensation."
            },
            {
              sql: "WITH DepartmentStats AS (\n  SELECT\n    `department`,\n    AVG(`salary`) AS avg_salary,\n    STDDEV(`salary`) AS std_salary\n  FROM\n    `data-studio-459108.dataplex_test.employee`\n  GROUP BY\n    `department`\n)\nSELECT\n  e.`emp_id`,\n  e.`name`,\n  e.`department`,\n  e.`salary`,\n  (e.`salary` - ds.avg_salary) / ds.std_salary AS z_score\nFROM\n  `data-studio-459108.dataplex_test.employee` e\nJOIN\n  DepartmentStats ds ON e.`department` = ds.`department`\nWHERE ABS((e.`salary` - ds.avg_salary) / ds.std_salary) > 2;",
              description: "Calculates the Z-score for each employee's salary within their department and flags those with a Z-score greater than 2 or less than -2 as potential outliers."
            },
            {
              sql: "SELECT\n  `emp_id`,\n  `name`,\n  `department`,\n  `salary`\nFROM\n  `data-studio-459108.dataplex_test.employee`\nWHERE\n  `salary` > (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(75)] FROM `data-studio-459108.dataplex_test.employee`) + 3 * ((SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(75)] FROM `data-studio-459108.dataplex_test.employee`) - (SELECT APPROX_QUANTILES(`salary`, 100)[OFFSET(25)] FROM `data-studio-459108.dataplex_test.employee`));",
              description: "Identifies employees whose salary exceeds three times the interquartile range (IQR) above the 75th percentile salary, marking them as extreme outliers."
            },
            {
              sql: "SELECT department, COUNTIF(salary BETWEEN 60000 AND 75000) * 100.0 / COUNT(*) AS percentage FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the percentage of employees with salaries between 60000 and 75000 within each department."
            },
            {
              sql: "SELECT department, APPROX_QUANTILES(salary, 4)[OFFSET(3)] - APPROX_QUANTILES(salary, 4)[OFFSET(1)] AS iqr FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the difference between the 75th percentile and 25th percentile of salaries for each department."
            },
            {
              sql: "SELECT department, MAX(salary) - MIN(salary) AS salary_range FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the salary range (max salary - min salary) for each department."
            },
            {
              sql: "SELECT department, STDDEV_POP(salary) AS salary_std_dev FROM `data-studio-459108.dataplex_test.employee` GROUP BY department;",
              description: "Calculate the standard deviation of salaries for each department."
            },
            {
              sql: "SELECT department FROM `data-studio-459108.dataplex_test.employee` GROUP BY department ORDER BY AVG(salary) DESC LIMIT 1;",
              description: "Find the department with the highest average salary."
            },
            {
              sql: "SELECT department, AVG(salary) AS avg_salary FROM `data-studio-459108.dataplex_test.employee` GROUP BY department ORDER BY avg_salary DESC LIMIT 1;",
              description: "Find the department with the maximum average salary."
            }
          ]
        }
      }
    }
  ]
};