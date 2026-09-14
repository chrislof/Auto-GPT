import styles from "./OpsVisual.module.css";

/** Full-bleed atmospheric visual — industrial ops / blueprint plane (CSS only). */
export function OpsVisual() {
  return (
    <div className={styles.plane} aria-hidden="true">
      <div className={styles.wash} />
      <div className={styles.grid} />
      <div className={styles.orbit} />
      <svg className={styles.schematic} viewBox="0 0 1200 720" fill="none">
        <path
          d="M80 560 H420 L520 420 H760 L860 280 H1120"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.55"
        />
        <path
          d="M160 200 H380 L460 320 H700"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity="0.4"
          strokeDasharray="6 8"
        />
        <rect x="180" y="470" width="120" height="72" opacity="0.35" stroke="currentColor" />
        <rect x="520" y="360" width="150" height="88" opacity="0.4" stroke="currentColor" />
        <rect x="820" y="220" width="140" height="80" opacity="0.45" stroke="currentColor" />
        <circle cx="420" cy="560" r="6" fill="currentColor" opacity="0.55" />
        <circle cx="760" cy="420" r="6" fill="currentColor" opacity="0.55" />
        <circle cx="860" cy="280" r="6" fill="currentColor" opacity="0.65" />
        <text x="190" y="455" className={styles.label}>
          BRAIN
        </text>
        <text x="540" y="345" className={styles.label}>
          APPS
        </text>
        <text x="840" y="205" className={styles.label}>
          AGENTS
        </text>
      </svg>
    </div>
  );
}
