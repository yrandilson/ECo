/**
 * Rastreamento de ações que desbloqueiam badges (researcher, analyst).
 * Usa localStorage pois essas métricas são locais ao navegador.
 */
const STORAGE_KEYS = {
  VIEWS_3D: "ecomonitor_3d_views",
  SCENARIO_COMPARISONS: "ecomonitor_scenario_comparisons",
} as const;

function getStoredCount(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function setStoredCount(key: string, count: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(count));
  } catch {
    /* ignore */
  }
}

export function get3DViewsCount(): number {
  return getStoredCount(STORAGE_KEYS.VIEWS_3D);
}

export function getScenarioComparisonsCount(): number {
  return getStoredCount(STORAGE_KEYS.SCENARIO_COMPARISONS);
}

/** Incrementa contador de visualizações 3D (chamar ao abrir a aba 3D) */
export function increment3DViews(): void {
  const next = get3DViewsCount() + 1;
  setStoredCount(STORAGE_KEYS.VIEWS_3D, next);
  window.dispatchEvent(new CustomEvent("ecomonitor_3d_views_updated", { detail: next }));
}

/** Incrementa contador de comparações de cenários */
export function incrementScenarioComparisons(): void {
  const next = getScenarioComparisonsCount() + 1;
  setStoredCount(STORAGE_KEYS.SCENARIO_COMPARISONS, next);
  window.dispatchEvent(new CustomEvent("ecomonitor_scenario_comparisons_updated", { detail: next }));
}
