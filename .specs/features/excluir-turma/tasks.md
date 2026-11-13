# Tasks: Exclusão de Turma

## Test Coverage Matrix
| Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Services (`src/services/*`) | unit | Exclusão atômica em memória/localStorage e Firestore | `src/services/__tests__/turmaRepo.test.ts` | `npm run test:run` |
| UI Components (`src/components/*`) | component | Botões de exclusão, modais de confirmação e disparo de callbacks | `src/components/__tests__/*.test.tsx` | `npm run test:run` |

## Gate Check Commands
| Gate Level | When to Use | Command |
| --- | --- | --- |
| Unit | Após tarefa do repositório | `npm run test:run` |
| Full | Após tarefas de componentes e integração | `npm run test:run` |

## Execution Plan
### Phase 1: Implementation Pipeline
```
T1 -> T2 -> T3 -> T4
```

## Task Breakdown

### T1: Implementar exclusão de turma no repositório turmaRepo
**What**: Adicionar e exportar `deleteTurma(uid: string, turmaId: string): Promise<void>` em `src/services/turmaRepo.ts`:
- Remover a turma e todos os alunos associados do repositório local (`localStorage` / `memoryStore`).
- Se executando em modo Firestore, excluir o documento da turma e todos os documentos da subcoleção `alunos` utilizando `writeBatch`.
- Lançar erro `Turma não encontrada.` caso a turma especificada não exista.
**Where**: `src/services/turmaRepo.ts`
**Depends on**: None
**Tests**: `src/services/__tests__/turmaRepo.test.ts`
**Gate**: `npm run test:run`

### T2: Adicionar botão e confirmação de exclusão na tela de detalhes da turma
**What**: Atualizar `src/components/TurmaDetailView.tsx`:
- Adicionar prop opcional `onDeleteTurma?: () => Promise<void>`.
- Exibir botão "Excluir turma" com estilo de ação destrutiva (`btn btn-danger` ou secundário com alerta).
- Abrir modal de confirmação ao clicar no botão, com mensagem clara sobre a perda permanente dos dados.
- Conter botões "Confirmar Exclusão" e "Cancelar", com estado de carregamento durante a exclusão.
**Where**: `src/components/TurmaDetailView.tsx`
**Depends on**: T1
**Tests**: `src/components/__tests__/TurmaDetailView.test.tsx`
**Gate**: `npm run test:run`

### T3: Adicionar opção de exclusão no painel TurmasDashboard
**What**: Atualizar `src/components/TurmasDashboard.tsx`:
- Adicionar prop opcional `onDeleteTurma?: (turmaId: string) => Promise<void>`.
- Adicionar botão de exclusão nos cards de turmas (com diálogo/modal de confirmação de segurança).
- Conectar callback de exclusão atualizando o estado do componente.
**Where**: `src/components/TurmasDashboard.tsx`
**Depends on**: T2
**Tests**: `src/components/__tests__/TurmasDashboard.test.tsx`
**Gate**: `npm run test:run`

### T4: Integrar exclusão no componente principal App
**What**: Integrar handlers no fluxo do aplicativo em `src/App.tsx`:
- Implementar `handleDeleteTurma` que executa `deleteTurma`, desativa seleção atual, atualiza a lista de turmas e exibe aviso de sucesso.
- Passar `handleDeleteTurma` para `TurmaDetailView` e `TurmasDashboard`.
**Where**: `src/App.tsx`
**Depends on**: T3
**Tests**: `src/components/__tests__/TurmasDashboard.test.tsx`
**Gate**: `npm run test:run`
