"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  type CollisionDetection,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { format, isSameMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdateTaskStatus } from "@/lib/queries";
import {
  BOARD_STATUSES,
  COLUMN_TITLES,
  columnDroppableId,
  isBoardStatus,
  resolveDropColumn,
  type BoardStatus,
} from "./boardColumns";
import { BoardTaskCard, BoardTaskCardPreview } from "./BoardTaskCard";
import type { Task } from "@/types";

export interface TaskBoardProps {
  tasks: Task[];
}

/**
 * Aucun réordonnancement intra-colonne : `Task` n'a pas de champ de position,
 * un ordre choisi à la souris serait perdu au premier refetch. Cette stratégie
 * neutre empêche les cartes voisines de se décaler pendant le geste, ce qui
 * promettrait un classement que rien ne persiste.
 */
const NO_SORTING: SortingStrategy = () => null;

/** Identifiants des trois zones de dépôt de colonne, seules cibles retenues. */
const IDS_COLONNES = new Set<string>(BOARD_STATUSES.map(columnDroppableId));

/**
 * Détection de collision restreinte aux zones de dépôt de colonne.
 *
 * `closestCorners` classe les cibles par distance moyenne entre coins
 * homologues. Or le contexte mêle deux familles de rectangles sans commune
 * mesure : les cartes (~321 × 230) et les colonnes, que la grille étire à la
 * hauteur de la plus haute — au-delà de 2000 px dès quelques tâches. Une
 * colonne perd alors systématiquement face à n'importe quelle carte, fût-elle
 * dans une autre colonne : ses coins bas sont trop éloignés du rectangle
 * déplacé, quand une carte de gabarit voisin obtient un score bien meilleur
 * malgré plusieurs centaines de pixels d'écart horizontal.
 *
 * Sans ce filtre, une colonne vide n'était jamais sélectionnable — ni à la
 * souris ni au clavier — et pire, un dépôt sur une colonne vide écrivait le
 * statut de la colonne voisine : celle de la carte qui avait gagné le
 * classement. Le geste aboutissait donc au mauvais statut, sans le signaler.
 *
 * Ne garder que les colonnes rend la comparaison homogène : trois rectangles
 * de même géométrie, dont un seul contient le point de dépôt. `resolveDropColumn`
 * continue d'accepter les deux formes d'identifiant, ce qui laisse la voie
 * ouverte à un futur tri intra-colonne.
 */
const detectionColonnes: CollisionDetection = (args) =>
  closestCorners({
    ...args,
    droppableContainers: args.droppableContainers.filter((conteneur) =>
      IDS_COLONNES.has(String(conteneur.id)),
    ),
  });

const SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Pour déplacer une tâche, placez le focus sur sa poignée puis appuyez sur Espace ou Entrée. " +
    "Utilisez les flèches gauche et droite pour choisir une colonne. " +
    "Appuyez de nouveau sur Espace ou Entrée pour déposer la tâche, ou sur Échap pour annuler.",
};

/**
 * Vue Kanban : 3 colonnes par statut avec compteur, et déplacement des tâches
 * d'une colonne à l'autre à la souris comme au clavier.
 *
 * Règle produit « tâches du mois » : on privilégie les tâches dont l'échéance
 * tombe dans le mois courant, mais on retombe sur l'ensemble des tâches
 * assignées quand aucune n'a d'échéance ce mois-ci (sinon le tableau serait
 * vide). Le mode retenu est affiché explicitement en tête du tableau : sans cet
 * intitulé, l'utilisateur ne peut pas distinguer un tableau filtré d'un tableau
 * complet.
 */
export function TaskBoard({ tasks }: TaskBoardProps) {
  /**
   * Date de référence figée au montage. Elle était auparavant recalculée à
   * chaque changement de `tasks` sans figurer dans les dépendances du useMemo :
   * un passage de minuit ou de fin de mois pouvait reclasser le tableau (voire
   * le faire basculer de mode) au milieu d'une interaction.
   */
  const [referenceDate] = useState(() => new Date());

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [targetColumn, setTargetColumn] = useState<BoardStatus | null>(null);
  /** Confirmation du résultat de la mutation, lue par la région `aria-live`. */
  const [statusMessage, setStatusMessage] = useState("");

  const updateStatus = useUpdateTaskStatus();

  const { grouped, isMonthScoped } = useMemo(() => {
    const inMonth = tasks.filter(
      (t) => t.dueDate && isSameMonth(parseISO(t.dueDate), referenceDate),
    );
    const monthScoped = inMonth.length > 0;
    const scoped = monthScoped ? inMonth : tasks;

    return {
      isMonthScoped: monthScoped,
      grouped: {
        TODO: scoped.filter((t) => t.status === "TODO"),
        IN_PROGRESS: scoped.filter((t) => t.status === "IN_PROGRESS"),
        DONE: scoped.filter((t) => t.status === "DONE"),
      } satisfies Record<BoardStatus, Task[]>,
    };
  }, [tasks, referenceDate]);

  // « août 2026 » — la forme « du mois : <mois> » évite l'élision (d'août/de mars).
  const monthLabel = format(referenceDate, "MMMM yyyy", { locale: fr });

  const sensors = useSensors(
    // Un seuil de 5 px distingue un clic d'un début de glissement : sans lui,
    // un simple clic sur la poignée amorcerait un déplacement.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const accessibility = useMemo(() => {
    const titleOf = (id: UniqueIdentifier) =>
      tasks.find((task) => task.id === id)?.title ?? "sans titre";
    const columnOf = (id: UniqueIdentifier | undefined) =>
      id === undefined ? null : resolveDropColumn(String(id), tasks);

    const announcements: Announcements = {
      onDragStart: ({ active }) =>
        `Déplacement de la tâche « ${titleOf(active.id)} » commencé. ` +
        "Utilisez les flèches gauche et droite pour choisir une colonne.",
      onDragOver: ({ active, over }) => {
        const column = columnOf(over?.id);
        return column
          ? `La tâche « ${titleOf(active.id)} » est au-dessus de la colonne ${COLUMN_TITLES[column]}.`
          : `La tâche « ${titleOf(active.id)} » n’est au-dessus d’aucune colonne.`;
      },
      onDragEnd: ({ active, over }) => {
        const column = columnOf(over?.id);
        return column
          ? `La tâche « ${titleOf(active.id)} » a été déposée dans la colonne ${COLUMN_TITLES[column]}.`
          : `La tâche « ${titleOf(active.id)} » a été reposée dans sa colonne d’origine.`;
      },
      onDragCancel: ({ active }) =>
        `Déplacement annulé. La tâche « ${titleOf(active.id)} » reste dans sa colonne.`,
    };

    return { announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS };
  }, [tasks]);

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setActiveTask(tasks.find((task) => task.id === active.id) ?? null);
    },
    [tasks],
  );

  const handleDragOver = useCallback(
    ({ over }: DragOverEvent) => {
      setTargetColumn(over ? resolveDropColumn(String(over.id), tasks) : null);
    },
    [tasks],
  );

  const resetDragState = useCallback(() => {
    setActiveTask(null);
    setTargetColumn(null);
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      resetDragState();
      if (!over) return;

      const task = tasks.find((candidate) => candidate.id === active.id);
      if (!task || !isBoardStatus(task.status)) return;

      const column = resolveDropColumn(String(over.id), tasks);
      // Dépôt dans la colonne d'origine : rien à persister (pas d'ordre en base).
      if (!column || column === task.status) return;

      const origin = task.status;
      updateStatus.mutate(
        { taskId: task.id, projectId: task.projectId, status: column },
        {
          onSuccess: () =>
            setStatusMessage(
              `Tâche « ${task.title} » déplacée vers ${COLUMN_TITLES[column]}.`,
            ),
          onError: () =>
            setStatusMessage(
              `Échec du déplacement de la tâche « ${task.title} ». ` +
                `Elle reste dans ${COLUMN_TITLES[origin]}.`,
            ),
        },
      );
    },
    [tasks, updateStatus, resetDragState],
  );

  return (
    <div>
      {/* h1 « Tableau de bord » → h2 (mode) → h3 (colonnes) → h4 (tâches). */}
      <header className="mb-5">
        <h2 className="font-heading text-lg font-semibold text-text">
          {isMonthScoped ? `Tâches du mois : ${monthLabel}` : "Toutes vos tâches"}
        </h2>
        {!isMonthScoped && (
          <p className="mt-0.5 text-sm text-text-muted">
            Aucune tâche n’arrive à échéance en {monthLabel} : l’ensemble de vos tâches assignées
            est affiché.
          </p>
        )}
      </header>

      {/*
        Région persistante : elle reste montée en permanence pour que le lecteur
        d'écran en observe les changements. Elle confirme le résultat de la
        mutation, là où les annonces de dnd-kit ne décrivent que le geste.
      */}
      <p aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <DndContext
        id="kanban-tableau-de-bord"
        sensors={sensors}
        collisionDetection={detectionColonnes}
        accessibility={accessibility}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={resetDragState}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BOARD_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={grouped[status]}
              isDropTarget={activeTask !== null && targetColumn === status}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <BoardTaskCardPreview task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Colonne                                                            */
/* ------------------------------------------------------------------ */

function BoardColumn({
  status,
  tasks,
  isDropTarget,
}: {
  status: BoardStatus;
  tasks: Task[];
  isDropTarget: boolean;
}) {
  /*
   * La zone de dépôt est la colonne entière, pas la pile de cartes : une
   * colonne vide (réduite au placeholder « Aucune tâche ») doit rester une
   * cible valide, sinon on ne pourrait jamais y ramener une tâche.
   */
  const { setNodeRef } = useDroppable({ id: columnDroppableId(status) });
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const title = COLUMN_TITLES[status];

  return (
    <section
      ref={setNodeRef}
      aria-label={`${title} (${tasks.length})`}
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        isDropTarget ? "border-primary bg-primary-soft" : "border-border bg-surface/60",
      )}
    >
      <header className="mb-4 flex items-center gap-2 px-1">
        <h3 className="font-heading text-base font-semibold text-text">{title}</h3>
        <span
          className="inline-flex min-w-6 items-center justify-center rounded-full bg-status-cancel-bg px-2 py-0.5 text-xs font-medium text-text-muted"
          aria-hidden="true"
        >
          {tasks.length}
        </span>
      </header>

      <SortableContext items={taskIds} strategy={NO_SORTING}>
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => <BoardTaskCard key={task.id} task={task} />)
          ) : (
            <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
              Aucune tâche
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}
