import type { Metadata } from "next";
import {
  manifestoIntro,
  manifestoSections,
} from "@/content/manifesto";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "The MindPress manifesto: we put AI to work for you — company brain, app factory, bounded agents, and a standard of proof.",
};

export default function ManifestoPage() {
  return (
    <article className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.brand}>MindPress</p>
        <h1>{manifestoIntro.title}</h1>
        <p className={styles.subtitle}>{manifestoIntro.subtitle}</p>
        <p className={styles.lead}>{manifestoIntro.lead}</p>
      </header>

      {manifestoSections.map((section) => (
        <section key={section.id} id={section.id} className={styles.section}>
          <div className={styles.rule} aria-hidden="true" />
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
          {section.bullets ? (
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </article>
  );
}
