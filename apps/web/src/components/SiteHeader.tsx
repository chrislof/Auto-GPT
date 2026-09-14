import Link from "next/link";
import styles from "./SiteHeader.module.css";

const links = [
  { href: "/how-we-work", label: "How we work" },
  { href: "/platform", label: "Platform" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.mark} aria-label="MindPress home">
          MindPress
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
