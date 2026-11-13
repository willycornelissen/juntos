import React, { useCallback, useEffect, useState } from 'react';
import './index.css';
import type {
  AlunoRecord,
  CreateTurmaInput,
  ParsedChamada,
  ReimportPlan,
  Turma,
  TurmaStatus,
  UpdateTurmaMetadataInput,
} from './domain/types';
import {
  type AuthUser,
  canAddTeachers,
  signInProfessor,
  signOutProfessor,
  subscribeAuthState,
} from './services/authService';
import {
  addAlunoComment,
  addTurmaComment,
  applyReimportPlan,
  createTurmaFromImport,
  deleteTurma,
  getLocalDataForMigration,
  getTurmaWithAlunos,
  inactivateAluno,
  listTurmas,
  migrateLocalDataToFirestore,
  saveLessonComment,
  setTurmaStatus,
  updateTurmaMetadata,
  type MigrationSummary,
} from './services/turmaRepo';
import { LoginView, TurmasDashboard } from './components/TurmasDashboard';
import { TurmaDetailView } from './components/TurmaDetailView';
import { ReimportModal } from './components/ReimportModal';
import { AlunoFichaDrawer } from './components/AlunoFichaDrawer';
import { AddUserModal } from './components/AddUserModal';

const SAMPLE_PAMPULHA_CHAMADA: ParsedChamada = {
  cidadePlanilha: 'Belo Horizonte',
  nomeTurmaPlanilha: 'Turma Pampulha (QUA)',
  lessons: [
    {
      dateKey: '14/10/26',
      isoDate: '2026-10-14',
      course: 'Filosofia para viver',
      theme: 'Transpasso Aula 10',
      instructor: 'Willy Garabini Cornelissen',
    },
    {
      dateKey: '07/10/26',
      isoDate: '2026-10-07',
      course: 'Filosofia para viver',
      theme: 'Transpasso Aula 9',
      instructor: 'Willy Garabini Cornelissen',
    },
    {
      dateKey: '28/01/26',
      isoDate: '2026-01-28',
      course: 'Filosofia para viver',
      theme: 'Aula de apresentação',
      instructor: 'Willy Garabini Cornelissen',
    },
  ],
  students: [
    {
      studentKey: '14820',
      externalId: '14820',
      sequencia: 1,
      nome: 'Claudia Marcia Marques (Sala Pampulha)',
      rawStatus: 'Ativo',
      presencas: { '14/10/26': 'P', '07/10/26': 'P', '28/01/26': 'P' },
    },
    {
      studentKey: '7728',
      externalId: '7728',
      sequencia: 2,
      nome: 'Lucas Selani de Melo (Sala Pampulha)',
      rawStatus: 'Ativo',
      presencas: { '14/10/26': 'P', '07/10/26': 'F', '28/01/26': 'P' },
    },
    {
      studentKey: '14779',
      externalId: '14779',
      sequencia: 3,
      nome: 'Maria Regina de Araujo Borges (Sala Pampulha)',
      rawStatus: 'Ativo',
      presencas: { '14/10/26': 'P', '07/10/26': 'P', '28/01/26': 'A' },
    },
  ],
};

export function App(): React.ReactElement {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [activeTurma, setActiveTurma] = useState<Turma | null>(null);
  const [activeAlunos, setActiveAlunos] = useState<AlunoRecord[]>([]);
  const [selectedStudentKey, setSelectedStudentKey] = useState<string | null>(
    null
  );
  const [isReimportOpen, setIsReimportOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isMigrationDismissed, setIsMigrationDismissed] = useState(() => {
    try {
      return localStorage.getItem('juntos:migration_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const checkLocalMigration = useCallback((targetUid?: string) => {
    try {
      const summary = getLocalDataForMigration(targetUid);
      if (summary.totalTurmas > 0) {
        setMigrationSummary(summary);
      } else {
        setMigrationSummary(null);
      }
    } catch {
      setMigrationSummary(null);
    }
  }, []);

  const refreshTurmas = useCallback(async (uid: string) => {
    const loaded = await listTurmas(uid);
    setTurmas(loaded);
  }, []);

  const refreshActiveTurma = useCallback(
    async (uid: string, turmaId: string) => {
      const { turma, alunos } = await getTurmaWithAlunos(uid, turmaId);
      setActiveTurma(turma);
      setActiveAlunos(alunos);
    },
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeAuthState((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setTurmas([]);
        setSelectedTurmaId(null);
        setActiveTurma(null);
        setActiveAlunos([]);
        setSelectedStudentKey(null);
        setIsAddUserOpen(false);
        setMigrationSummary(null);
        setMigrationMessage(null);
      } else {
        void refreshTurmas(authUser.uid);
        checkLocalMigration(authUser.uid);
      }
    });
    return unsubscribe;
  }, [refreshTurmas, checkLocalMigration]);

  const handlePerformMigration = async () => {
    if (!user) return;
    setIsMigrating(true);
    setMigrationMessage(null);
    try {
      const result = await migrateLocalDataToFirestore(user.uid);
      await refreshTurmas(user.uid);
      setMigrationMessage({
        type: 'success',
        text: `Migração concluída com sucesso! ${result.migratedTurmasCount} turma(s) e ${result.migratedAlunosCount} aluno(s) foram salvos na nuvem.`,
      });
      setMigrationSummary(null);
    } catch (err) {
      setMigrationMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Falha ao migrar dados locais para o Firebase.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismissMigration = () => {
    setIsMigrationDismissed(true);
    try {
      localStorage.setItem('juntos:migration_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    const signedIn = await signInProfessor(email, password);
    setUser(signedIn);
    await refreshTurmas(signedIn.uid);
  };

  const handleSignOut = async () => {
    await signOutProfessor();
    setUser(null);
  };

  const handleSelectTurma = async (turmaId: string) => {
    if (!user) {
      return;
    }
    setSelectedTurmaId(turmaId);
    await refreshActiveTurma(user.uid, turmaId);
  };

  const handleCreateTurma = async (
    input: CreateTurmaInput,
    parsed: ParsedChamada
  ) => {
    if (!user) {
      return;
    }
    const { turma, alunos } = await createTurmaFromImport(
      user.uid,
      input,
      parsed
    );
    await refreshTurmas(user.uid);
    setSelectedTurmaId(turma.id);
    setActiveTurma(turma);
    setActiveAlunos(alunos);
  };

  const handleLoadSampleTurma = async () => {
    if (!user) {
      return;
    }
    await handleCreateTurma(
      {
        nome: 'Turma Pampulha (QUA)',
        diaHorario: 'Quarta-feira, 19h30',
        local: 'Belo Horizonte',
        catedras: ['Filosofia para Viver', 'Transpasso'],
        cidadePlanilha: 'Belo Horizonte',
      },
      SAMPLE_PAMPULHA_CHAMADA
    );
  };

  const handleUpdateMetadata = async (patch: UpdateTurmaMetadataInput) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await updateTurmaMetadata(user.uid, selectedTurmaId, patch);
    await refreshActiveTurma(user.uid, selectedTurmaId);
    await refreshTurmas(user.uid);
  };

  const handleChangeStatus = async (
    status: TurmaStatus,
    closingComment?: string
  ) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await setTurmaStatus(user.uid, selectedTurmaId, status, closingComment);
    await refreshActiveTurma(user.uid, selectedTurmaId);
    await refreshTurmas(user.uid);
  };

  const handleAddTurmaComment = async (text: string) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await addTurmaComment(user.uid, selectedTurmaId, text);
    await refreshActiveTurma(user.uid, selectedTurmaId);
    await refreshTurmas(user.uid);
  };

  const handleConfirmReimport = async (plan: ReimportPlan) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await applyReimportPlan(user.uid, selectedTurmaId, plan);
    await refreshActiveTurma(user.uid, selectedTurmaId);
    await refreshTurmas(user.uid);
  };

  const handleAddAlunoComment = async (studentKey: string, text: string) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await addAlunoComment(user.uid, selectedTurmaId, studentKey, text);
    await refreshActiveTurma(user.uid, selectedTurmaId);
  };

  const handleInactivateAluno = async (studentKey: string) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    await inactivateAluno(user.uid, selectedTurmaId, studentKey);
    await refreshActiveTurma(user.uid, selectedTurmaId);
    await refreshTurmas(user.uid);
  };

  const handleDeleteTurma = async (turmaId?: string) => {
    if (!user) {
      return;
    }
    const targetTurmaId = turmaId ?? selectedTurmaId;
    if (!targetTurmaId) {
      return;
    }
    await deleteTurma(user.uid, targetTurmaId);
    if (selectedTurmaId === targetTurmaId) {
      setSelectedTurmaId(null);
      setActiveTurma(null);
      setActiveAlunos([]);
      setSelectedStudentKey(null);
    }
    await refreshTurmas(user.uid);
  };

  const handleSaveLessonComment = async (
    dateKey: string,
    text: string | null
  ) => {
    if (!user || !selectedTurmaId) {
      return;
    }
    const updated = await saveLessonComment(
      user.uid,
      selectedTurmaId,
      dateKey,
      text
    );
    setActiveTurma(updated);
    await refreshTurmas(user.uid);
  };

  if (!user) {
    return <LoginView onSignIn={handleSignIn} />;
  }

  const selectedAluno =
    selectedStudentKey !== null
      ? activeAlunos.find((a) => a.studentKey === selectedStudentKey) ?? null
      : null;

  return (
    <div>
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-brand">
            <div className="hero-brand-header">
              <img
                src={`${import.meta.env.BASE_URL}juntos-emblem-white.svg`}
                alt="Emblema Juntos"
                className="hero-logo"
              />
              <span className="hero-divider" aria-hidden="true" />
              <div className="hero-brand-titles">
                <h1>
                  Juntos<span className="hero-brand-dot">.</span>
                </h1>
                <p>Gestão de turmas, chamadas e acompanhamento de alunos</p>
              </div>
            </div>
          </div>
          <div className="hero-user">
            <span className="user-email-chip">{user.email}</span>
            {canAddTeachers(user) && (
              <button
                type="button"
                className="btn btn-secondary btn-header"
                onClick={() => setIsAddUserOpen(true)}
              >
                Gerenciar Professores
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-header"
              onClick={() => void handleSignOut()}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {migrationMessage && (
          <div
            className={migrationMessage.type === 'success' ? 'success-banner' : 'warning'}
            role="alert"
            style={{ marginBottom: '1.5rem' }}
          >
            {migrationMessage.text}
          </div>
        )}

        {migrationSummary && migrationSummary.totalTurmas > 0 && !isMigrationDismissed && !selectedTurmaId && (
          <div className="migration-card" role="region" aria-label="Migração de dados locais">
            <div className="migration-card-content">
              <div className="migration-card-header">
                <span className="migration-badge">📦 Dados locais encontrados</span>
                <h3>Deseja migrar seus dados para o Firebase?</h3>
              </div>
              <p className="migration-text">
                Encontramos <strong>{migrationSummary.totalTurmas} turma(s)</strong> e{' '}
                <strong>{migrationSummary.totalAlunos} aluno(s)</strong> salvos neste navegador.
                Migre para a nuvem para que os dados fiquem sincronizados e acessíveis em qualquer dispositivo.
              </p>
            </div>
            <div className="migration-card-actions">
              <button
                type="button"
                className="btn"
                onClick={() => void handlePerformMigration()}
                disabled={isMigrating}
              >
                {isMigrating ? 'Migrando para a nuvem...' : 'Migrar para o Firebase'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDismissMigration}
                disabled={isMigrating}
              >
                Dispensar
              </button>
            </div>
          </div>
        )}

        {selectedTurmaId && activeTurma ? (
          <TurmaDetailView
            turma={activeTurma}
            alunos={activeAlunos}
            onBack={() => {
              setSelectedTurmaId(null);
              setActiveTurma(null);
              setActiveAlunos([]);
              setSelectedStudentKey(null);
            }}
            onSelectStudent={(aluno) => setSelectedStudentKey(aluno.studentKey)}
            onOpenReimportModal={() => setIsReimportOpen(true)}
            onUpdateMetadata={handleUpdateMetadata}
            onChangeStatus={handleChangeStatus}
            onAddTurmaComment={handleAddTurmaComment}
            onDeleteTurma={handleDeleteTurma}
            onSaveLessonComment={handleSaveLessonComment}
          />
        ) : (
          <TurmasDashboard
            turmas={turmas}
            onSelectTurma={(id) => void handleSelectTurma(id)}
            onCreateTurma={handleCreateTurma}
            onLoadSampleTurma={handleLoadSampleTurma}
            onDeleteTurma={(id) => handleDeleteTurma(id)}
          />
        )}

        {isReimportOpen && activeTurma && (
          <ReimportModal
            turma={activeTurma}
            alunos={activeAlunos}
            onClose={() => setIsReimportOpen(false)}
            onConfirmReimport={handleConfirmReimport}
          />
        )}

        {selectedAluno && activeTurma && (
          <AlunoFichaDrawer
            aluno={selectedAluno}
            lessons={activeTurma.lessons}
            onClose={() => setSelectedStudentKey(null)}
            onAddComment={handleAddAlunoComment}
            onInactivate={handleInactivateAluno}
          />
        )}

        {isAddUserOpen && (
          <AddUserModal
            adminUser={user}
            onClose={() => setIsAddUserOpen(false)}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img
              src={`${import.meta.env.BASE_URL}juntos-emblem-teal.svg`}
              alt="Emblema Juntos"
              className="footer-logo"
            />
            <p className="footer-tagline">
              Juntos — Plataforma de Gestão Pedagógica e Acompanhamento de Turmas
            </p>
          </div>
          <p className="footer-copy">
            Juntos &copy; {new Date().getFullYear()} — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
