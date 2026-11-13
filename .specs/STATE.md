# STATE

## Decisions

### AD-001
- **Decision**: Build Juntos as a static React + Vite + TypeScript SPA hosted on GitHub Pages with Firebase Authentication and Cloud Firestore, parsing `.xlsx` spreadsheets entirely in the browser via SheetJS (`xlsx`).
- **Reason**: Matches the user's proven deployment and operational workflow (`estante.willy.dev.br`), requires zero server maintenance, and keeps infrastructure costs at zero under Firebase Spark limits.
- **Trade-off**: All spreadsheet parsing, synchronization diffing, and batch persistence must run in the client browser and be protected via Firestore Security Rules (`request.auth.uid == userId`).
- **Scope**: Entire application architecture, authentication, storage, and build pipeline.
- **Date**: 2026-10-19
- **Status**: active

### AD-002
- **Decision**: Model Firestore data hierarchically per professor (`users/{uid}/turmas/{turmaId}`) with embedded `lessons[]` and `comentarios[]` on the class document and a dedicated `alunos/{studentKey}` subcollection per class containing each student's attendance map (`presencas`) and student-level `comentarios[]`.
- **Reason**: Keeps dashboard queries (`turmas`) lightweight without downloading all student histories, isolates individual student comment writes to a single student document, and enables atomic class+student spreadsheet imports via Firestore `writeBatch`.
- **Trade-off**: Opening a specific class requires two queries (`turmas/{turmaId}` and `turmas/{turmaId}/alunos`), which are fetched in parallel.
- **Scope**: Firestore schema, repository layer (`src/services/firestore.ts`), and sync engine (`src/domain/syncEngine.ts`).
- **Date**: 2026-10-19
- **Status**: active

### AD-003
- **Decision**: Implement the Closing Report (Relatório de Encerramento) with native responsive SVG charts and pure domain statistics calculations without external charting libraries.
- **Reason**: Guarantees zero peer-dependency conflicts with React 19, ultra-fast rendering, zero impact on bundle size, and seamless execution in JSDOM unit tests.
- **Trade-off**: Chart geometry (curves, donuts, bars) is maintained in-code rather than abstracted by a third-party library.
- **Scope**: Domain calculations (`src/domain/relatorioEncerramento.ts`) and UI presentation (`src/components/RelatorioEncerramentoView.tsx`).
- **Date**: 2026-10-22
- **Status**: active

### AD-004
- **Decision**: Execute class deletion as an irreversible cascade deletion: in Firestore mode, batch-delete the class document and all student documents in its `alunos` subcollection simultaneously; in local mode, remove the class and students from `userStore`. Require explicit client-side safety confirmation modals before triggering.
- **Reason**: Firestore does not automatically delete subcollections when a parent document is deleted. Batch-deleting avoids orphaned student documents, preserves data integrity, and explicit confirmation modals prevent accidental data loss without adding the complexity of a soft-delete/trash bin architecture.
- **Trade-off**: Permanent deletion is immediate and non-recoverable once confirmed.
- **Scope**: Repository layer (`src/services/turmaRepo.ts`), detail view (`src/components/TurmaDetailView.tsx`), dashboard (`src/components/TurmasDashboard.tsx`), and `src/App.tsx`.
- **Date**: 2026-11-13
- **Status**: active

## Handoff

- **Feature**: excluir-turma (`.specs/features/excluir-turma`)
- **Phase / Task**: Done (All 4 tasks completed and independently verified with PASS)
- **Completed**: Specify (`spec.md`), Tasks (`tasks.md`), T1, T2, T3, T4, Verification (`validation.md`)
- **In-progress** (file:line): none
- **Next step**: Ready for user review
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: main
