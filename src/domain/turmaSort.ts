import type { LessonColumn, Turma } from './types';

interface DayMatcher {
  day: number; // 1 (Segunda) .. 7 (Domingo)
  matches: (token: string) => boolean;
}

const DAY_MATCHERS: DayMatcher[] = [
  {
    day: 1, // Segunda
    matches: (t) => t === 'segunda' || t === 'seg' || t === '2a' || t === '2ª',
  },
  {
    day: 2, // Terça
    matches: (t) => t === 'terca' || t === 'ter' || t === '3a' || t === '3ª',
  },
  {
    day: 3, // Quarta
    matches: (t) => t === 'quarta' || t === 'qua' || t === '4a' || t === '4ª',
  },
  {
    day: 4, // Quinta
    matches: (t) => t === 'quinta' || t === 'qui' || t === '5a' || t === '5ª',
  },
  {
    day: 5, // Sexta
    matches: (t) => t === 'sexta' || t === 'sex' || t === '6a' || t === '6ª',
  },
  {
    day: 6, // Sábado
    matches: (t) => t === 'sabado' || t === 'sab',
  },
  {
    day: 7, // Domingo
    matches: (t) => t === 'domingo' || t === 'dom',
  },
];

export function extractDayOfWeekFromText(text?: string | null): number | null {
  if (!text) {
    return null;
  }
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ªº]/g, ' ');

  const tokens = cleaned.split(/\s+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];

    if (nextToken === 'feira') {
      if (token === '2') return 1;
      if (token === '3') return 2;
      if (token === '4') return 3;
      if (token === '5') return 4;
      if (token === '6') return 5;
    }

    for (const { day, matches } of DAY_MATCHERS) {
      if (matches(token)) {
        return day;
      }
    }
  }

  return null;
}

export function extractDayOfWeekFromLessons(
  lessons?: LessonColumn[] | null
): number | null {
  if (!lessons || lessons.length === 0) {
    return null;
  }

  const dayCounts: Record<number, number> = {};

  for (const lesson of lessons) {
    if (!lesson.isoDate) {
      continue;
    }
    const parts = lesson.isoDate.split('-').map(Number);
    if (
      parts.length === 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      const date = new Date(
        Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
      );
      const jsDay = date.getUTCDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      const day = jsDay === 0 ? 7 : jsDay;
      dayCounts[day] = (dayCounts[day] ?? 0) + 1;
    }
  }

  let bestDay: number | null = null;
  let maxCount = 0;
  for (const [dayStr, count] of Object.entries(dayCounts)) {
    const day = Number(dayStr);
    if (count > maxCount) {
      maxCount = count;
      bestDay = day;
    }
  }

  return bestDay;
}

export function getTurmaDayOfWeek(turma: Turma): number {
  const fromDiaHorario = extractDayOfWeekFromText(turma.diaHorario);
  if (fromDiaHorario !== null) {
    return fromDiaHorario;
  }

  const fromNome = extractDayOfWeekFromText(turma.nome);
  if (fromNome !== null) {
    return fromNome;
  }

  const fromLessons = extractDayOfWeekFromLessons(turma.lessons);
  if (fromLessons !== null) {
    return fromLessons;
  }

  return 8; // Unknown day comes after Domingo
}

export function compareTurmasByDayAndName(a: Turma, b: Turma): number {
  const dayA = getTurmaDayOfWeek(a);
  const dayB = getTurmaDayOfWeek(b);

  if (dayA !== dayB) {
    return dayA - dayB;
  }

  const nameComparison = a.nome.localeCompare(b.nome, 'pt-BR', {
    sensitivity: 'base',
    numeric: true,
  });

  if (nameComparison !== 0) {
    return nameComparison;
  }

  return a.id.localeCompare(b.id);
}

export function sortTurmas<T extends Turma>(turmas: T[]): T[] {
  return [...turmas].sort(compareTurmasByDayAndName);
}
