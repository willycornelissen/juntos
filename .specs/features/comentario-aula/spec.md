# Feature Specification: Comentários e Detalhes da Aula

## Problem Statement
Durante o acompanhamento de uma turma, os professores necessitam consultar os detalhes específicos de cada aula (data, tema e professor) diretamente na matriz de chamada e registrar anotações e comentários contextuais para aquela aula específica (por exemplo, avisos sobre aulas especiais, substituições ou ocorrências relevantes). Atualmente, a matriz exibe apenas o texto de cabeçalho sem interatividade detalhada e sem suporte a comentários por aula. Além disso, ao reimportar uma planilha atualizada da turma, quaisquer comentários registrados anteriormente para as aulas existentes não devem ser perdidos.

## Out of Scope
- Histórico versionado de edições do comentário da aula (mantém-se o comentário atual da aula).
- Múltiplos comentários concorrentes de autores distintos por aula (um comentário por aula, editável e removível).
- Comentários em lote para múltiplas aulas simultâneas.

## Assumptions & Open Questions
| Assumption | Chosen default | Rationale |
| --- | --- | --- |
| Estrutura de dados | `comentario?: string` na interface `LessonColumn` | Integra-se de forma enxuta ao modelo existente de aulas e persiste diretamente no documento da turma |
| Abertura do diálogo | Clique no cabeçalho/data da aula ou no ícone de comentário da célula na matriz | Oferece acesso natural e intuitivo aos detalhes da aula |
| Preservação na reimportação | Ao executar `computeReimportPlan`, preservar o campo `comentario` das aulas existentes (`existingLesson.comentario`) | Evita perda acidental de dados ao sincronizar nova versão da planilha |
| Edição e Remoção | Diálogo permite adicionar quando vazio, ou exibir com botões de editar e remover quando existente | Atende aos requisitos funcionais com fluxo claro de confirmação |

Open questions: none

## User Stories

### US-01: Modelo e Preservação de Comentários na Reimportação
Como professor, quero que os comentários registrados nas aulas não sejam apagados quando uma nova planilha for reimportada para a turma.

**Acceptance Criteria**:
1. When `computeReimportPlan` merges incoming lessons with existing lessons, the system shall preserve the existing lesson comment (`existingLesson.comentario`) for matching lesson date keys.
2. When a new lesson date is imported without prior comment, the system shall initialize the lesson without a comment.

### US-02: Persistência de Comentário da Aula no Repositório
Como sistema, quero salvar, atualizar e remover comentários de uma aula específica no repositório de dados.

**Acceptance Criteria**:
1. When `saveLessonComment` is invoked with valid text, the repository shall persist the comment on the corresponding lesson in the turma document.
2. When `saveLessonComment` is invoked with null or empty text, the repository shall remove the comment from the corresponding lesson.
3. When `saveLessonComment` is invoked with a non-existent `turmaId` or `dateKey`, the repository shall throw an error.

### US-03: Diálogo de Detalhes da Aula e Ícone na Matriz de Chamada
Como professor, quero visualizar os detalhes da aula (data, tema, professor) ao clicar na célula da data, ver um ícone se houver comentário e poder adicionar, editar ou remover o comentário.

**Acceptance Criteria**:
1. When a lesson column header is clicked in `TurmaDetailView`, the UI shall open a dialog showing the lesson date, theme, and instructor.
2. When a lesson has a registered comment, the UI shall render a comment indicator icon inside that lesson header cell.
3. When the user clicks the comment icon or cell of a lesson with a comment, the UI shall open the dialog allowing the user to view, edit, and remove the comment.
4. When the user confirms adding or editing a comment, the UI shall call the save handler and update the lesson cell with the indicator icon.
5. When the user confirms removing a comment, the UI shall call the removal handler and remove the indicator icon from the cell.

### US-04: Integração no Componente Principal App
Como professor, quero que as alterações de comentários da aula sejam refletidas na turma ativa e persistidas no armazenamento do usuário.

**Acceptance Criteria**:
1. When a lesson comment is saved or removed in `TurmaDetailView`, `App.tsx` shall invoke the repository method and update the active turma state.

## Requirement Traceability
| Requirement ID | User Story | Description | Status |
| --- | --- | --- | --- |
| AULA-01 | US-01 | Preservação de comentário de aula no domínio e reimportação (`syncEngine.ts`) | verified |
| AULA-02 | US-02 | Persistência e remoção de comentário de aula no repositório `turmaRepo` | verified |
| AULA-03 | US-03 | Diálogo de detalhes da aula, ícone indicador e ações em `TurmaDetailView` | verified |
| AULA-04 | US-04 | Integração dos handlers de comentário de aula em `App.tsx` | verified |
