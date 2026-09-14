import { ButtonLink } from "@/components/ButtonLink";
import { OpsVisual } from "@/components/OpsVisual";
import { PageSection } from "@/components/PageSection";
import styles from "./home.module.css";

export default function HomePage() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="brand">
        <OpsVisual />
        <div className={styles.heroContent}>
          <p id="brand" className={styles.brand}>
            MindPress
          </p>
          <h1 className={styles.headline}>We put AI to work for you.</h1>
          <p className={styles.support}>
            Forward-deployed AI engineering — company brain, operating apps, and
            bounded agents that get real work done.
          </p>
          <div className={styles.ctas}>
            <ButtonLink href="/contact">Start a diagnostic</ButtonLink>
            <ButtonLink href="/manifesto" variant="ghost">
              Read the manifesto
            </ButtonLink>
          </div>
        </div>
      </section>

      <PageSection
        title="Most companies do not need another AI strategy."
        lead="They need the work to get done — researched leads, matched invoices, clean exception queues, one version of the truth. Chat on top of the same company is not enough."
      >
        <p>
          MindPress connects systems, encodes operating rules, builds the
          software people need, and installs agents that perform bounded work.
          Then we measure adoption and business impact — without inventing case
          studies or certainty we do not have.
        </p>
      </PageSection>

      <PageSection
        id="company-brain"
        eyebrow="Pillar"
        title="Company brain"
        lead="A trustworthy map of the company — not a data lake with no owner, and not a memory dump into a model."
        tone="ink"
      >
        <p>
          Systems of record, roles, metrics, workflows, policies, freshness, and
          decision history — exposed through governed interfaces so agents get
          minimum access and employees keep the work visible.
        </p>
      </PageSection>

      <PageSection
        id="app-factory"
        eyebrow="Pillar"
        title="App factory"
        lead="Small, specific operating applications on top of the company brain. The interface follows the job."
      >
        <p>
          Work queues, portals, copilots, forms, controlled workflows. We
          integrate first when existing systems already fit. Every app needs an
          owner, a source of truth, an access policy, a measurable outcome, and a
          rollback path.
        </p>
      </PageSection>

      <PageSection
        id="revenue-back-office"
        eyebrow="Pillar"
        title="Revenue and back office as engineering problems"
        lead="Fragmented data and manual cleanup are software-shaped constraints — not vibes to chat about."
        tone="ink"
      >
        <p>
          Revenue processes get encoded as measurable systems. Finance, HR, and
          operations run on evidence and exception queues. AI investigates and
          recommends; authority and payment control stay explicit.
        </p>
      </PageSection>

      <PageSection
        id="one-layer"
        eyebrow="Pillar"
        title="One operating layer"
        lead="Marketing, sales, operations, finance, and HR are not three consulting practices inside a real company."
      >
        <p>
          Shared identity for customers, products, people, and metrics.
          Departmental apps and agents on a common layer — so each workflow
          improves context for the next.
        </p>
      </PageSection>

      <PageSection
        id="proof"
        eyebrow="Pillar"
        title="Standard of proof"
        lead="A demo proves something can happen once. Production requires more."
        tone="ink"
      >
        <p>
          Permission boundaries, failure-path tests, evaluations, versioning,
          human approval for consequential actions, monitoring, rollback,
          readback, and measured impact. Facts separated from assumptions —
          missing evidence named, next test designed.
        </p>
      </PageSection>

      <PageSection
        id="refuse"
        eyebrow="Pillar"
        title="What we refuse to become"
        lead="Short and sharp — because the market is full of the opposite."
      >
        <ul>
          <li>A prompt shop or a generic chatbot left for you to configure</li>
          <li>Automators of broken processes we do not understand</li>
          <li>Movers of sensitive data into models for convenience</li>
          <li>Scorekeepers of tokens, dashboards, and generated noise</li>
          <li>Owners of mystery systems only we can operate</li>
        </ul>
      </PageSection>

      <section className={styles.close}>
        <div className={styles.closeInner}>
          <h2>Ready to put AI to work?</h2>
          <p>
            Tell us the workflow that is stuck. We will decide together whether
            software or AI can materially improve it — and when the honest answer
            is no.
          </p>
          <ButtonLink href="/contact">Talk to MindPress</ButtonLink>
        </div>
      </section>
    </>
  );
}
