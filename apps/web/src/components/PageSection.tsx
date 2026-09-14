import type { ReactNode } from "react";
import styles from "./PageSection.module.css";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  tone?: "default" | "ink";
};

export function PageSection({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "default",
}: Props) {
  return (
    <section
      id={id}
      className={`${styles.section} ${tone === "ink" ? styles.ink : ""}`}
    >
      <div className={styles.rule} aria-hidden="true" />
      <div className={styles.inner}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={styles.title}>{title}</h2>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
      </div>
    </section>
  );
}
