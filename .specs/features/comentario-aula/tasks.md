# Tasks: Comentários e Detalhes da Aula

## Test Coverage Matrix
| Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain (`src/domain/*`) | unit | Preservação de comentário na reimportação | `src/domain/__tests__/syncEngine.test.ts` | `npm run test:run` |
| Services (`src/services/*`) | unit | Salvar, atualizar e remover comentário da aula no repositório | `src/services/__tests__/turmaRepo.test.ts` | `npm run test:run` |
| UI Components (`src/components/*`) | component | Abertura do modal, ícone indicador na célula e ações de salvar/editar/remover | `src/components/__tests__/TurmaDetailView.test.tsx` | `npm run test:run` |

## Gate Check Commands
| Gate Level | When to Use | Command |
| --- | --- | --- |
| Domain | Após T1 | `npm run test:run` |
| Repository | Após T2 | `npm run test:run` |
| UI | Após T3 | `npm run test:run` |
| Full | Após T4 | `npm run test:run` |

## Execution Plan
### Phase 1: Implementation Pipeline
```
T1 -> T2 -> T3 -> T4
```

## Task Breakdown

### T1: Suportar comentário na aula e preservação na reimportação
**What**: Adicionar campo opcional `comentario?: string` em `LessonColumn` e atualizar `computeReimportPlan` para preservar `existingLesson.comentario` ao mesclar aulas na reimportação de planilha.
**Where**: `src/domain/syncEngine.ts`
**Depends on**: None
**Tests**: `src/domain/__tests__/syncEngine.test.ts`
**Gate**: `npm run test:run`

### T2: Implementar persistência de comentário de aula no repositório
**What**: Implementar e exportar função `saveLessonComment(uid: string, turmaId: string, dateKey: string, text: string | null): Promise<Turma>` em `turmaRepo.ts` para salvar ou remover comentário de aula no Firestore e no armazenamento local.
**Where**: `src/services/turmaRepo.ts`
**Depends on**: T1
**Tests**: `src/services/__tests__/turmaRepo.test.ts`
**Gate**: `npm run test:run`

### T3: Implementar diálogo de detalhes da aula e ícone de comentário em TurmaDetailView
**What**: Atualizar `TurmaDetailView.tsx` para tornar a célula/data da aula clicável, exibir ícone de comentário nas aulas com anotação, e renderizar diálogo com data, tema, professor e ações de adicionar, editar e remover comentário.
**Where**: `src/components/TurmaDetailView.tsx`
**Depends on**: T2
**Tests**: `src/components/__tests__/TurmaDetailView.test.tsx`
**Gate**: `npm run test:run`

### T4: Integrar persistência de comentários de aula em App
**What**: Implementar `handleSaveLessonComment` em `App.tsx`, chamando `saveLessonComment` e atualizando `activeTurma` e a listagem de turmas, repassando o callback para `TurmaDetailView`.
**Where**: `src/App.tsx`
**Depends on**: T3
**Tests**: `src/components/__tests__/TurmaDetailView.test.tsx`
**Gate**: `npm run test:run`
