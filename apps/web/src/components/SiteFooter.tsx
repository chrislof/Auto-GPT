import Link from "next/link";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.name}>MindPress</p>
          <p className={styles.tag}>We put AI to work for you.</p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <Link href="/how-we-work">How we work</Link>
          <Link href="/platform">Platform</Link>
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className={styles.note}>
          Forward-deployed AI engineering. Evidence over demos. Clients own what
          we leave behind.
        </p>
      </div>
    </footer>
  );
}
