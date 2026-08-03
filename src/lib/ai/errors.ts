/**
 * Erreurs typées de la pipeline RAG + helpers serveur.
 *
 * Chaque étape lève une erreur DÉDIÉE ; la route (src/app/api/ai/generate-tasks)
 * les mappe 1:1 vers un code + un status HTTP (exigence OC : « chacune son code »).
 * Aucune de ces erreurs ne doit laisser fuiter de stack trace vers le client :
 * la route ne renvoie que le `message` générique porté ici.
 */

/** Backend Express injoignable / réponse invalide pendant le « load ». → 502 AI_CONTEXT_ERROR */
export class ContextError extends Error {
  constructor(message = "Contexte projet indisponible.") {
    super(message);
    this.name = "ContextError";
  }
}

/** Clé Mistral absente côté serveur. → 500 AI_CONFIG_ERROR */
export class AiConfigError extends Error {
  constructor(message = "Configuration IA manquante côté serveur.") {
    super(message);
    this.name = "AiConfigError";
  }
}

/** Quota / rate-limit Mistral (HTTP 429). → 429 AI_QUOTA_EXCEEDED */
export class AiQuotaError extends Error {
  constructor(message = "Quota IA atteint.") {
    super(message);
    this.name = "AiQuotaError";
  }
}

/** Timeout, coupure réseau ou 5xx Mistral. → 503 AI_UNAVAILABLE */
export class AiUnavailableError extends Error {
  constructor(message = "Service IA momentanément indisponible.") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/** Sortie LLM non parsable / non conforme au schéma attendu. → 502 AI_BAD_OUTPUT */
export class AiBadOutputError extends Error {
  constructor(message = "Réponse IA illisible.") {
    super(message);
    this.name = "AiBadOutputError";
  }
}

/**
 * Lit la clé Mistral CÔTÉ SERVEUR uniquement. Jamais de préfixe NEXT_PUBLIC :
 * la clé ne doit exister que dans l'environnement serveur.
 * Lève AiConfigError si absente/vide (→ 500 AI_CONFIG_ERROR).
 */
export function getMistralApiKey(): string {
  const key = process.env.MISTRAL_API_KEY;
  if (!key || key.trim() === "") {
    throw new AiConfigError("MISTRAL_API_KEY absente de l'environnement serveur.");
  }
  return key;
}

/**
 * Traduit une erreur remontée par le SDK Mistral (@mistralai/mistralai, via
 * LlamaIndex) en erreur typée de la pipeline. Le SDK expose `statusCode` sur
 * ses `MistralError` ; les erreurs réseau/timeout n'en ont pas.
 * On duck-type pour ne pas coupler la pipeline aux classes internes du SDK.
 */
export function classifyMistralError(err: unknown): Error {
  // Nos propres erreurs traversent sans réécriture.
  if (
    err instanceof AiConfigError ||
    err instanceof AiQuotaError ||
    err instanceof AiUnavailableError ||
    err instanceof AiBadOutputError ||
    err instanceof ContextError
  ) {
    return err;
  }

  const status =
    typeof (err as { statusCode?: unknown })?.statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : undefined;

  if (status === 429) return new AiQuotaError();
  if (status !== undefined && status >= 500) return new AiUnavailableError();

  // Erreurs réseau/timeout du client HTTP (ConnectionError, RequestTimeoutError,
  // RequestAbortedError…) ou AbortError de notre withTimeout.
  const name = (err as { name?: unknown })?.name;
  if (
    name === "AbortError" ||
    name === "ConnectionError" ||
    name === "RequestTimeoutError" ||
    name === "RequestAbortedError"
  ) {
    return new AiUnavailableError();
  }

  // Par défaut : service IA indisponible (plus prudent qu'un 500 opaque).
  return new AiUnavailableError();
}

/**
 * Timeout dur autour d'une promesse (appels Mistral). Rejette avec
 * AiUnavailableError si `ms` est dépassé. Le travail sous-jacent n'est pas
 * réellement annulé (le SDK LlamaIndex n'expose pas de signal), mais le client
 * n'attend jamais au-delà de la limite.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AiUnavailableError(`Délai dépassé (${label}, ${ms}ms).`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
