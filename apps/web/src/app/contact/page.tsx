import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact MindPress to start a diagnostic conversation about the workflow that needs to get done.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.brand}>MindPress</p>
        <h1>Contact</h1>
        <p className={styles.lead}>
          Tell us the work that needs to get done. We will reply about whether a
          diagnostic makes sense — no invented promises.
        </p>
      </header>

      <div className={styles.grid}>
        <ContactForm />
        <aside className={styles.aside}>
          <h2>Direct</h2>
          <p>
            <a href="mailto:hello@mindpress.ca">hello@mindpress.ca</a>
          </p>
          <p className={styles.meta}>
            Forward-deployed AI engineering. Company brain. App factory. Bounded
            agents. Measured outcomes.
          </p>
        </aside>
      </div>
    </div>
  );
}
