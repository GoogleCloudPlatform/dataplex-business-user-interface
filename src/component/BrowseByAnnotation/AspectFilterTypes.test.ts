import { describe, it, expect } from 'vitest';
import {
  type AspectFilterFieldType,
  type AspectFilterChip,
  ASPECT_FILTER_FIELD_LABELS,
  ASPECT_VALID_FILTER_FIELDS,
  DATE_FILTER_FIELDS,
  isDateField,
  createAspectFilterChip,
  createOrConnectorChip,
  isOrConnector,
} from './AspectFilterTypes';

describe('AspectFilterTypes', () => {
  describe('ASPECT_FILTER_FIELD_LABELS', () => {
    it('should have labels for all valid filter fields', () => {
      ASPECT_VALID_FILTER_FIELDS.forEach((field) => {
        expect(ASPECT_FILTER_FIELD_LABELS[field]).toBeDefined();
        expect(typeof ASPECT_FILTER_FIELD_LABELS[field]).toBe('string');
      });
    });

    it('should have correct label values', () => {
      expect(ASPECT_FILTER_FIELD_LABELS.name_contains).toBe('Name contains');
      expect(ASPECT_FILTER_FIELD_LABELS.name_prefix).toBe('Name prefix');
      expect(ASPECT_FILTER_FIELD_LABELS.location).toBe('Location');
      expect(ASPECT_FILTER_FIELD_LABELS.created_on).toBe('Created on');
      expect(ASPECT_FILTER_FIELD_LABELS.created_before).toBe('Created before');
      expect(ASPECT_FILTER_FIELD_LABELS.created_after).toBe('Created after');
    });
  });

  describe('ASPECT_VALID_FILTER_FIELDS', () => {
    it('should contain exactly 6 fields', () => {
      expect(ASPECT_VALID_FILTER_FIELDS).toHaveLength(6);
    });

    it('should contain all expected fields', () => {
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('name_contains');
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('name_prefix');
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('location');
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('created_on');
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('created_before');
      expect(ASPECT_VALID_FILTER_FIELDS).toContain('created_after');
    });

    it('should not contain project field', () => {
      expect(ASPECT_VALID_FILTER_FIELDS).not.toContain('project');
    });
  });

  describe('DATE_FILTER_FIELDS', () => {
    it('should contain exactly 3 date fields', () => {
      expect(DATE_FILTER_FIELDS).toHaveLength(3);
    });

    it('should contain all date-related fields', () => {
      expect(DATE_FILTER_FIELDS).toContain('created_on');
      expect(DATE_FILTER_FIELDS).toContain('created_before');
      expect(DATE_FILTER_FIELDS).toContain('created_after');
    });

    it('should not contain non-date fields', () => {
      expect(DATE_FILTER_FIELDS).not.toContain('name_contains');
      expect(DATE_FILTER_FIELDS).not.toContain('name_prefix');
      expect(DATE_FILTER_FIELDS).not.toContain('location');
    });
  });

  describe('isDateField', () => {
    it('should return true for date fields', () => {
      expect(isDateField('created_on')).toBe(true);
      expect(isDateField('created_before')).toBe(true);
      expect(isDateField('created_after')).toBe(true);
    });

    it('should return false for non-date fields', () => {
      expect(isDateField('name_contains')).toBe(false);
      expect(isDateField('name_prefix')).toBe(false);
      expect(isDateField('location')).toBe(false);
    });
  });

  describe('createAspectFilterChip', () => {
    it('should create a filter chip with correct properties', () => {
      const chip = createAspectFilterChip('name_contains', 'test');

      expect(chip.field).toBe('name_contains');
      expect(chip.value).toBe('test');
      expect(chip.displayLabel).toBe('Name contains: test');
      expect(chip.showFieldLabel).toBe(true);
      expect(chip.id).toMatch(/^filter-/);
    });

    it('should create unique IDs for each chip', () => {
      const chip1 = createAspectFilterChip('name_contains', 'test1');
      const chip2 = createAspectFilterChip('name_contains', 'test2');

      expect(chip1.id).not.toBe(chip2.id);
    });

    it('should use correct labels for different field types', () => {
      const fields: AspectFilterFieldType[] = [
        'name_contains', 'name_prefix', 'location',
        'created_on', 'created_before', 'created_after',
      ];

      fields.forEach((field) => {
        const chip = createAspectFilterChip(field, 'value');
        expect(chip.displayLabel).toBe(`${ASPECT_FILTER_FIELD_LABELS[field]}: value`);
      });
    });

    it('should not have a connector property', () => {
      const chip = createAspectFilterChip('location', 'us');
      expect(chip.connector).toBeUndefined();
    });
  });

  describe('createOrConnectorChip', () => {
    it('should create an OR connector chip', () => {
      const chip = createOrConnectorChip();

      expect(chip.value).toBe('OR');
      expect(chip.displayLabel).toBe('OR');
      expect(chip.connector).toBe('OR');
      expect(chip.id).toMatch(/^or-/);
    });

    it('should create unique IDs', () => {
      const chip1 = createOrConnectorChip();
      const chip2 = createOrConnectorChip();

      expect(chip1.id).not.toBe(chip2.id);
    });
  });

  describe('isOrConnector', () => {
    it('should return true for OR connector chips', () => {
      const orChip = createOrConnectorChip();
      expect(isOrConnector(orChip)).toBe(true);
    });

    it('should return false for regular filter chips', () => {
      const chip = createAspectFilterChip('name_contains', 'test');
      expect(isOrConnector(chip)).toBe(false);
    });

    it('should return false for chips without connector', () => {
      const chip: AspectFilterChip = {
        id: 'test',
        field: 'name_contains',
        value: 'test',
        displayLabel: 'test',
      };
      expect(isOrConnector(chip)).toBe(false);
    });

    it('should return false for chips with AND connector', () => {
      const chip: AspectFilterChip = {
        id: 'test',
        field: 'name_contains',
        value: 'test',
        displayLabel: 'test',
        connector: 'AND',
      };
      expect(isOrConnector(chip)).toBe(false);
    });
  });
});
