import { describe, expect, it } from 'vitest';
import {
  compareTurmasByDayAndName,
  extractDayOfWeekFromLessons,
  extractDayOfWeekFromText,
  getTurmaDayOfWeek,
  sortTurmas,
} from '../turmaSort';
import type { LessonColumn, Turma } from '../types';

function createDummyTurma(partial: Partial<Turma>): Turma {
  return {
    id: partial.id ?? 'turma-id',
    nome: partial.nome ?? 'Turma Teste',
    diaHorario: partial.diaHorario ?? 'Quarta-feira, 19h30',
    local: partial.local ?? 'Pampulha',
    catedras: partial.catedras ?? [],
    status: partial.status ?? 'Ativa',
    lessons: partial.lessons ?? [],
    comentarios: partial.comentarios ?? [],
    activeStudentsCount: partial.activeStudentsCount ?? 0,
    droppedStudentsCount: partial.droppedStudentsCount ?? 0,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00Z',
    updatedAt: partial.updatedAt ?? '2026-01-01T00:00:00Z',
  };
}

describe('turmaSort domain logic', () => {
  describe('extractDayOfWeekFromText', () => {
    it('detects all standard Portuguese day names', () => {
      expect(extractDayOfWeekFromText('Segunda-feira, 19h30')).toBe(1);
      expect(extractDayOfWeekFromText('Terça-feira, 20h00')).toBe(2);
      expect(extractDayOfWeekFromText('Quarta-feira, 19h00')).toBe(3);
      expect(extractDayOfWeekFromText('Quinta-feira, 19h30')).toBe(4);
      expect(extractDayOfWeekFromText('Sexta-feira, 18h30')).toBe(5);
      expect(extractDayOfWeekFromText('Sábado, 09h00')).toBe(6);
      expect(extractDayOfWeekFromText('Domingo, 10h00')).toBe(7);
    });

    it('detects short and unaccented variations', () => {
      expect(extractDayOfWeekFromText('Segunda 19h')).toBe(1);
      expect(extractDayOfWeekFromText('terca 20h')).toBe(2);
      expect(extractDayOfWeekFromText('quarta 19h')).toBe(3);
      expect(extractDayOfWeekFromText('quinta 19h')).toBe(4);
      expect(extractDayOfWeekFromText('sexta 19h')).toBe(5);
      expect(extractDayOfWeekFromText('sabado 09h')).toBe(6);
      expect(extractDayOfWeekFromText('domingo 10h')).toBe(7);
    });

    it('detects abbreviations (SEG, TER, QUA, QUI, SEX, SAB, DOM)', () => {
      expect(extractDayOfWeekFromText('Pampulha SEG')).toBe(1);
      expect(extractDayOfWeekFromText('Turma (TER)')).toBe(2);
      expect(extractDayOfWeekFromText('Turma Pampulha QUA')).toBe(3);
      expect(extractDayOfWeekFromText('Unidade Savassi QUI')).toBe(4);
      expect(extractDayOfWeekFromText('Filosofia (SEX)')).toBe(5);
      expect(extractDayOfWeekFromText('Manhã SAB')).toBe(6);
      expect(extractDayOfWeekFromText('Tarde DOM')).toBe(7);
    });

    it('detects ordinals (2ª feira, 2a, 3ª, 4ª, 5ª, 6ª)', () => {
      expect(extractDayOfWeekFromText('2ª feira, 19h')).toBe(1);
      expect(extractDayOfWeekFromText('2a feira, 19h')).toBe(1);
      expect(extractDayOfWeekFromText('2 feira, 19h')).toBe(1);
      expect(extractDayOfWeekFromText('3ª, 20h')).toBe(2);
      expect(extractDayOfWeekFromText('4ª feira')).toBe(3);
      expect(extractDayOfWeekFromText('5ª feira')).toBe(4);
      expect(extractDayOfWeekFromText('6ª feira')).toBe(5);
    });

    it('returns null for null, empty or text without day mentions', () => {
      expect(extractDayOfWeekFromText(null)).toBeNull();
      expect(extractDayOfWeekFromText('')).toBeNull();
      expect(extractDayOfWeekFromText('19h30 - Sala 3')).toBeNull();
    });
  });

  describe('extractDayOfWeekFromLessons', () => {
    it('infers day of the week from majority lesson dates', () => {
      const lessons: LessonColumn[] = [
        {
          dateKey: '14/10/26',
          isoDate: '2026-10-14', // Wednesday = 3
          course: 'Filosofia',
          theme: 'Tema 1',
          instructor: 'Professor',
        },
        {
          dateKey: '21/10/26',
          isoDate: '2026-10-21', // Wednesday = 3
          course: 'Filosofia',
          theme: 'Tema 2',
          instructor: 'Professor',
        },
      ];
      expect(extractDayOfWeekFromLessons(lessons)).toBe(3);
    });

    it('returns null if lessons array is empty or lacks isoDates', () => {
      expect(extractDayOfWeekFromLessons([])).toBeNull();
      expect(extractDayOfWeekFromLessons(null)).toBeNull();
    });
  });

  describe('getTurmaDayOfWeek', () => {
    it('prioritizes diaHorario over nome and lessons', () => {
      const turma = createDummyTurma({
        diaHorario: 'Terça-feira, 19h30',
        nome: 'Turma Quarta',
      });
      expect(getTurmaDayOfWeek(turma)).toBe(2);
    });

    it('falls back to nome if diaHorario has no day', () => {
      const turma = createDummyTurma({
        diaHorario: '19h30',
        nome: 'Turma Savassi (SAB)',
      });
      expect(getTurmaDayOfWeek(turma)).toBe(6);
    });

    it('falls back to lessons if neither diaHorario nor nome has day', () => {
      const turma = createDummyTurma({
        diaHorario: '19h30',
        nome: 'Turma Filosofia',
        lessons: [
          {
            dateKey: '16/10/26',
            isoDate: '2026-10-16', // Friday = 5
            course: 'Filosofia',
            theme: 'Tema 1',
            instructor: 'Professor',
          },
        ],
      });
      expect(getTurmaDayOfWeek(turma)).toBe(5);
    });

    it('defaults to 8 for unknown day of week', () => {
      const turma = createDummyTurma({
        diaHorario: '19h30',
        nome: 'Turma Filosofia',
        lessons: [],
      });
      expect(getTurmaDayOfWeek(turma)).toBe(8);
    });
  });

  describe('sortTurmas and compareTurmasByDayAndName', () => {
    it('orders classes by day of week (Monday to Sunday, then unknown)', () => {
      const tDom = createDummyTurma({ id: '7', nome: 'Turma Domingo', diaHorario: 'Domingo, 10h' });
      const tTer = createDummyTurma({ id: '2', nome: 'Turma Terça', diaHorario: 'Terça-feira, 20h' });
      const tSeg = createDummyTurma({ id: '1', nome: 'Turma Segunda', diaHorario: 'Segunda-feira, 19h' });
      const tSab = createDummyTurma({ id: '6', nome: 'Turma Sábado', diaHorario: 'Sábado, 09h' });
      const tQua = createDummyTurma({ id: '3', nome: 'Turma Quarta', diaHorario: 'Quarta-feira, 19h30' });
      const tSex = createDummyTurma({ id: '5', nome: 'Turma Sexta', diaHorario: 'Sexta-feira, 18h' });
      const tQui = createDummyTurma({ id: '4', nome: 'Turma Quinta', diaHorario: 'Quinta-feira, 19h30' });
      const tUnknown = createDummyTurma({ id: '8', nome: 'Turma Sem Dia', diaHorario: 'Horário a definir' });

      const sorted = sortTurmas([tDom, tSab, tUnknown, tSex, tTer, tQui, tSeg, tQua]);

      expect(sorted.map((t) => t.id)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    });

    it('orders classes on the same day in alphabetical order by name', () => {
      const tPampulha = createDummyTurma({
        id: 'pampulha',
        nome: 'Turma Pampulha',
        diaHorario: 'Quarta-feira, 19h30',
      });
      const tAfonso = createDummyTurma({
        id: 'afonso',
        nome: 'Turma Afonso Pena',
        diaHorario: 'Quarta-feira, 19h30',
      });
      const tCidade = createDummyTurma({
        id: 'cidade',
        nome: 'Turma Cidade Nova',
        diaHorario: 'Quarta-feira, 19h30',
      });

      const sorted = sortTurmas([tPampulha, tCidade, tAfonso]);

      expect(sorted.map((t) => t.nome)).toEqual([
        'Turma Afonso Pena',
        'Turma Cidade Nova',
        'Turma Pampulha',
      ]);
    });

    it('handles accents in alphabetical order correctly', () => {
      const tB = createDummyTurma({ id: 'b', nome: 'Bernardo', diaHorario: 'Quarta' });
      const tA = createDummyTurma({ id: 'a', nome: 'Álvaro', diaHorario: 'Quarta' });
      const tC = createDummyTurma({ id: 'c', nome: 'Carlos', diaHorario: 'Quarta' });

      const sorted = sortTurmas([tB, tC, tA]);
      expect(sorted.map((t) => t.nome)).toEqual(['Álvaro', 'Bernardo', 'Carlos']);
    });

    it('does not mutate the original array', () => {
      const t1 = createDummyTurma({ id: '1', nome: 'B', diaHorario: 'Quarta' });
      const t2 = createDummyTurma({ id: '2', nome: 'A', diaHorario: 'Quarta' });
      const original = [t1, t2];
      const result = sortTurmas(original);

      expect(result).not.toBe(original);
      expect(original[0].id).toBe('1');
    });
  });
});
