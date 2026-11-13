# Feature Specification: Exclusão de Turma

## Problem Statement
Atualmente o sistema Juntos permite criar turmas a partir de planilhas e alternar seu status entre "Ativa" e "Encerrada", mas não oferece aos professores e administradores uma maneira de excluir permanentemente turmas de teste, turmas criadas por engano ou turmas antigas descartadas. Como consequência, turmas indesejadas continuam ocupando espaço nas listas e no banco de dados. É necessário implementar a funcionalidade de exclusão permanente com confirmação explícita de segurança contra exclusões acidentais.

## Out of Scope
- Lixeira temporária com recuperação de turmas após a confirmação de exclusão (soft-delete).
- Exclusão em lote de múltiplas turmas em uma única seleção.
- Exportação automática de backup em arquivo antes da exclusão.

## Assumptions & Open Questions
| Assumption | Chosen default | Rationale |
| --- | --- | --- |
| Confirmação de segurança | Diálogo/modal com botão de confirmação explícita ("Confirmar Exclusão") e opção de cancelar | Previne perda acidental irreversível de dados de alunos e histórico de presenças |
| Limpeza em cascata | A exclusão da turma no Firestore apaga o documento da turma e todos os documentos da subcoleção `alunos` | Garante integridade referencial e evita documentos órfãos no Cloud Firestore |
| Acesso à exclusão | Disponível na tela de detalhes da turma (`TurmaDetailView`) e opcionalmente no card do dashboard (`TurmasDashboard`) | Oferece flexibilidade de remoção tanto durante a inspeção da turma quanto na listagem |

Open questions: none

## User Stories

### US-01: Exclusão no Repositório de Dados
Como sistema, quero uma função no repositório de dados capaz de remover atomicamente a turma e seus alunos tanto no armazenamento local quanto no Firestore.

**Acceptance Criteria**:
1. When `deleteTurma` is invoked with an existing `uid` and `turmaId` in local storage, the repository shall delete the class record and its students from storage.
2. When `deleteTurma` is invoked with a non-existent `turmaId`, the repository shall throw an error stating "Turma não encontrada.".
3. When `deleteTurma` is invoked in Firestore mode, the repository shall delete the turma document and all documents in its `alunos` subcollection in a batch.

### US-02: Exclusão de Turma pela Tela de Detalhes
Como professor, quero um botão "Excluir turma" na visualização detalhada da turma com confirmação de segurança para apagar a turma com segurança.

**Acceptance Criteria**:
1. When viewing a class in `TurmaDetailView`, the UI shall display an "Excluir turma" button.
2. When the user clicks "Excluir turma", the UI shall display a confirmation modal detailing the irreversible loss of class history and student records.
3. When the user confirms deletion, the UI shall invoke the deletion handler and disable action buttons during processing.
4. When the user cancels the confirmation, the UI shall close the confirmation modal without performing any deletion.

### US-03: Exclusão de Turma pelo Painel de Turmas
Como professor, quero poder excluir turmas indesejadas diretamente a partir dos cards do painel principal de turmas.

**Acceptance Criteria**:
1. When viewing class cards in `TurmasDashboard`, the UI shall display an option to delete the class with confirmation.
2. When deletion is confirmed from `TurmasDashboard`, the UI shall call the deletion handler and refresh the class list.

## Requirement Traceability
| Requirement ID | User Story | Description | Status |
| --- | --- | --- | --- |
| EXCLUIR-01 | US-01 | Função de exclusão atômica no repositório `turmaRepo` (local e Firestore) | verified |
| EXCLUIR-02 | US-02 | Botão e modal de confirmação de exclusão em `TurmaDetailView` | planned |
| EXCLUIR-03 | US-03 | Integração da exclusão em `App.tsx` e opção no painel `TurmasDashboard` | planned |
