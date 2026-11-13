import { describe, it, expect } from 'vitest';
import {
  isSameTurmaNome,
  normalizeTurmaNome,
} from '../turmaNameValidation';

describe('turmaNameValidation domain logic', () => {
  describe('normalizeTurmaNome', () => {
    it('normalizes names by lowercasing, stripping accents, punctuation, and leading "turma "', () => {
      expect(normalizeTurmaNome('Turma Pampulha (QUA)')).toBe('pampulha qua');
      expect(normalizeTurmaNome('  PAMPULHA QUA  ')).toBe('pampulha qua');
      expect(normalizeTurmaNome('Turma Nuth LVII')).toBe('nuth lvii');
      expect(normalizeTurmaNome('Nuth LVII')).toBe('nuth lvii');
    });

    it('handles empty or null inputs gracefully', () => {
      expect(normalizeTurmaNome('')).toBe('');
      expect(normalizeTurmaNome(null)).toBe('');
      expect(normalizeTurmaNome(undefined)).toBe('');
    });
  });

  describe('isSameTurmaNome', () => {
    it('returns true for exact matches', () => {
      expect(isSameTurmaNome('Nuth LVII', 'Nuth LVII')).toBe(true);
      expect(isSameTurmaNome('Turma Pampulha (QUA)', 'Turma Pampulha (QUA)')).toBe(
        true
      );
    });

    it('returns true when one side has "Turma " prefix and the other does not', () => {
      expect(isSameTurmaNome('Nuth LVII', 'Turma Nuth LVII')).toBe(true);
      expect(isSameTurmaNome('Turma Nuth LVII', 'Nuth LVII')).toBe(true);
    });

    it('returns true when formatting variations (parentheses, casing, accents) differ', () => {
      expect(
        isSameTurmaNome('Turma Pampulha (QUA)', 'Turma Pampulha QUA')
      ).toBe(true);
      expect(isSameTurmaNome('TURMA TERÇA NOITE', 'Turma Terca Noite')).toBe(
        true
      );
    });

    it('returns false for different classes', () => {
      expect(isSameTurmaNome('Turma Pampulha', 'Turma Savassi')).toBe(false);
      expect(isSameTurmaNome('Nuth LVII', 'Nuth LVI')).toBe(false);
      expect(isSameTurmaNome('Turma A', 'Turma B')).toBe(false);
    });

    it('returns false when spreadsheet class name is missing or empty', () => {
      expect(isSameTurmaNome('Nuth LVII', '')).toBe(false);
      expect(isSameTurmaNome('Nuth LVII', '   ')).toBe(false);
      expect(isSameTurmaNome('Nuth LVII', null)).toBe(false);
      expect(isSameTurmaNome('Nuth LVII', undefined)).toBe(false);
    });
  });
});
