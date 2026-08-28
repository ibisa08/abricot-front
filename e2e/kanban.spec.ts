import { expect, test, type Locator, type Page } from "@playwright/test";
import { login, SEED_PROJECT_NAME, TEST_USER } from "./helpers/auth";

/**
 * Le 15 du mois courant.
 *
 * Le Kanban privilégie les tâches échéant dans le mois et ne bascule sur
 * l'ensemble des tâches que si aucune ne correspond. Dater la tâche du mois
 * courant garantit son affichage quel que soit le contenu de la base, et fixe
 * le mode du tableau au lieu de le subir. Le 15 évite tout effet de bord aux
 * bornes du mois (la modale envoie l'échéance en UTC).
 */
function dueDateThisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
}

/**
 * Crée une tâche du mois courant assignée à l'utilisateur de test.
 *
 * Le tableau de bord ne montre que les tâches assignées
 * (`GET /dashboard/assigned-tasks`) : créer la tâche ne suffit pas.
 */
async function creerTache(page: Page, titre: string): Promise<void> {
  await page.goto("/projets");
  await page.getByRole("link", { name: `Ouvrir le projet ${SEED_PROJECT_NAME}` }).click();
  await expect(page.getByRole("heading", { name: SEED_PROJECT_NAME })).toBeVisible();

  await page.getByRole("button", { name: "Créer une tâche" }).click();

  const modale = page.getByRole("dialog", { name: "Créer une tâche" });
  await modale.getByLabel("Titre*").fill(titre);
  await modale.getByLabel("Description*").fill("Tâche créée pour le test du glisser-déposer.");
  await modale.getByLabel("Échéance*").fill(dueDateThisMonth());

  await modale.getByLabel("Assigné à :").click();
  await page.getByRole("option", { name: TEST_USER.name }).click();
  await page.keyboard.press("Escape");

  await modale.getByRole("button", { name: "Ajouter une tâche" }).click();
  await expect(modale).toBeHidden();
}

/**
 * Déplace une carte vers une colonne à la souris, depuis sa poignée.
 *
 * Le survol effectif est vérifié avant le relâchement : le surlignage de la
 * colonne est le seul signal qui atteste que `dnd-kit` a bien retenu cette
 * cible. Sans cette attente, un relâchement trop précoce déposerait la carte
 * sur la cible précédente.
 */
async function deposerALaSouris(page: Page, titre: string, colonne: Locator): Promise<void> {
  const poignee = page.getByRole("button", { name: `Déplacer la tâche « ${titre} »` });
  await poignee.scrollIntoViewIfNeeded();

  const depart = await poignee.boundingBox();
  const arrivee = await colonne.boundingBox();
  const fenetre = page.viewportSize();
  if (!depart || !arrivee || !fenetre) throw new Error(`Géométrie introuvable pour « ${titre} ».`);

  const departX = depart.x + depart.width / 2;
  const departY = depart.y + depart.height / 2;

  /*
   * Le point de dépôt est ramené dans la fenêtre visible : la grille étire les
   * colonnes à la hauteur de la plus haute, bien au-delà de l'écran, et un
   * curseur hors champ ne survolerait plus rien.
   */
  const arriveeX = arrivee.x + arrivee.width / 2;
  const arriveeY = Math.min(Math.max(arrivee.y + 100, 120), fenetre.height - 120);

  await page.mouse.move(departX, departY);
  await page.mouse.down();
  // `PointerSensor` n'arme le geste qu'au-delà de 5 px : il faut de vrais
  // déplacements intermédiaires, pas un saut unique.
  await page.mouse.move(departX + 8, departY + 8, { steps: 5 });
  await page.mouse.move(arriveeX, arriveeY, { steps: 25 });

  await expect(colonne).toHaveClass(/border-primary/);
  await page.mouse.up();
}

/** Ramène vers `destination` toutes les cartes de `source`, jusqu'à la vider. */
async function viderColonne(page: Page, source: Locator, destination: Locator): Promise<void> {
  for (let garde = 0; garde < 10; garde++) {
    const titres = await source.getByRole("heading", { level: 4 }).allInnerTexts();
    if (titres.length === 0) return;
    await deposerALaSouris(page, titres[0], destination);
    await page.reload();
  }
  throw new Error("La colonne cible n'a pas pu être vidée.");
}

test.describe("Kanban", () => {
  test("déplace une tâche d'une colonne à l'autre au clavier", async ({ page }) => {
    await login(page);

    // Titre unique : le test reste rejouable sans réinitialiser la base.
    const taskTitle = `Tâche Kanban E2E ${Date.now()}`;
    await creerTache(page, taskTitle);

    /* ---- La tâche démarre dans « À faire » ------------------------------- */
    await page.goto("/dashboard?view=kanban");

    const todoColumn = page.getByRole("region", { name: /^À faire/ });
    const doingColumn = page.getByRole("region", { name: /^En cours/ });

    await expect(todoColumn.getByRole("heading", { name: taskTitle })).toBeVisible();

    /* ---- Déplacement au clavier depuis la poignée ------------------------ */
    // Espace saisit la carte, flèche droite vise la colonne suivante, Espace
    // dépose. Aucun recours à la souris : c'est le chemin clavier qui est testé.
    //
    // Le surlignage de la colonne courante sert de point de synchronisation :
    // `dnd-kit` mesure les zones de dépôt après le début du geste, et trois
    // appuis enchaînés sans attente arriveraient avant cette mesure.
    await page.getByRole("button", { name: `Déplacer la tâche « ${taskTitle} »` }).focus();

    await page.keyboard.press("Space");
    await expect(todoColumn).toHaveClass(/border-primary/);

    await page.keyboard.press("ArrowRight");
    await expect(doingColumn).toHaveClass(/border-primary/);

    await page.keyboard.press("Space");

    /* ---- La tâche a changé de colonne ------------------------------------ */
    await expect(doingColumn.getByRole("heading", { name: taskTitle })).toBeVisible();
    await expect(todoColumn.getByRole("heading", { name: taskTitle })).toHaveCount(0);

    // Le changement est persisté : il survit à un rechargement complet.
    await page.reload();
    await expect(doingColumn.getByRole("heading", { name: taskTitle })).toBeVisible();
  });

  /*
   * Régression : un dépôt sur une colonne VIDE, depuis une colonne bien
   * remplie, écrivait le statut d'une colonne voisine — la carte partait
   * ailleurs sans que rien ne le signale.
   *
   * La détection de collision classait les cibles par distance entre coins.
   * Les colonnes, étirées par la grille à la hauteur de la plus haute,
   * perdaient face à n'importe quelle carte de gabarit voisin. Il faut donc
   * une colonne source assez chargée pour creuser cet écart : sous cinq
   * cartes, le tableau reste trop court et le défaut ne se reproduit pas.
   */
  test("dépose une tâche dans une colonne vide sans se tromper de colonne", async ({ page }) => {
    test.slow();
    await login(page);

    const suffixe = Date.now();
    for (let i = 1; i <= 5; i++) {
      await creerTache(page, `Tâche Souris E2E ${suffixe}-${i}`);
    }

    await page.goto("/dashboard?view=kanban");

    const todoColumn = page.getByRole("region", { name: /^À faire/ });
    const doingColumn = page.getByRole("region", { name: /^En cours/ });
    const doneColumn = page.getByRole("region", { name: /^Terminées/ });

    // Une exécution précédente a pu laisser des cartes dans la colonne visée ;
    // or c'est bien son caractère vide qui déclenchait le défaut.
    await viderColonne(page, doneColumn, todoColumn);
    await expect(doneColumn.getByRole("heading", { level: 4 })).toHaveCount(0);

    const cible = `Tâche Souris E2E ${suffixe}-5`;
    await expect(todoColumn.getByRole("heading", { name: cible })).toBeVisible();

    await deposerALaSouris(page, cible, doneColumn);

    /* ---- La carte atterrit dans la colonne visée, et nulle part ailleurs -- */
    await expect(doneColumn.getByRole("heading", { name: cible })).toBeVisible();
    await expect(todoColumn.getByRole("heading", { name: cible })).toHaveCount(0);
    await expect(doingColumn.getByRole("heading", { name: cible })).toHaveCount(0);

    // Le statut réellement persisté est bien celui de la colonne visée.
    await page.reload();
    await expect(doneColumn.getByRole("heading", { name: cible })).toBeVisible();
  });
});
