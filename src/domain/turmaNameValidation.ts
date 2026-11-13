/**
 * Normalizes a turma name for flexible, tolerant matching:
 * - Trims whitespace
 * - Converts to lower case
 * - Strips accents/diacritics (e.g. ç -> c, á -> a)
 * - Removes non-alphanumeric characters (e.g. parentheses, dashes)
 * - Strips optional leading "turma " prefix
 * - Collapses multiple spaces
 */
export function normalizeTurmaNome(name?: string | null): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/^turma\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether the class name from a spreadsheet matches the target turma name.
 */
export function isSameTurmaNome(
  turmaNome: string,
  planilhaNome?: string | null
): boolean {
  if (!planilhaNome || !planilhaNome.trim()) {
    return false;
  }

  const normTurma = normalizeTurmaNome(turmaNome);
  const normPlanilha = normalizeTurmaNome(planilhaNome);

  if (normTurma.length > 0 && normTurma === normPlanilha) {
    return true;
  }

  if (turmaNome.trim().toLowerCase() === planilhaNome.trim().toLowerCase()) {
    return true;
  }

  return false;
}
