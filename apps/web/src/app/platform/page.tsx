import type { Metadata } from "next";
import { PageSection } from "@/components/PageSection";
import { ButtonLink } from "@/components/ButtonLink";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "MindPress platform layers: company brain, app factory, bounded agents, and governance — the technical foundation we are building.",
};

const layers = [
  {
    name: "Applications",
    detail: "Dashboards, queues, portals, copilots — interfaces that follow the job.",
  },
  {
    name: "Agents",
    detail: "Bounded work via governed tools and approval gates — not open-ended autonomy.",
  },
  {
    name: "App factory",
    detail: "Schemas, pages, handlers, workflows — small operating apps on shared context.",
  },
  {
    name: "Company brain",
    detail: "Entities, metrics, policies, freshness — durable structured context.",
  },
  {
    name: "Governance",
    detail: "Permissions, audit, evaluations, rollback — evidence around consequential action.",
  },
  {
    name: "Connectors",
    detail: "Systems of record, events, warehouses — minimum access, not password sprawl.",
  },
];

export default function PlatformPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.brand}>MindPress</p>
        <h1>Platform</h1>
        <p className={styles.lead}>
          The technical foundation we are building — a strategic interpretation of
          the manifesto, not a claim of completed client delivery.
        </p>
      </header>

      <PageSection
        title="Company brain"
        lead="A working map of the business exposed through governed interfaces."
      >
        <p>
          Agents get the minimum access required for the task. Employees get
          applications that make the work visible. Management gets evidence of
          what happened. Models change; structured context, operating logic,
          permissions, and verified history endure.
        </p>
      </PageSection>

      <PageSection
        title="App factory"
        lead="Build when missing software is what prevents the business from operating better."
        tone="ink"
      >
        <p>
          Each app has a job: surface intervention, collect a decision, reconcile
          records, prepare an action, run a controlled workflow, measure the
          outcome, preserve evidence. Generated UI is not finished until it
          survives real users and operating pressure.
        </p>
      </PageSection>

      <PageSection
        title="Bounded agents"
        lead="Tools that correspond to real work — inside applications people understand and control."
      >
        <p>
          Consequential actions require authority, controls, and evidence. We will
          not let an agent send, pay, publish, hire, fire, or alter production
          without the controls appropriate to the action.
        </p>
      </PageSection>

      <PageSection
        title="Governance"
        lead="Permissions, approvals, audit, evaluations, and rehearsed rollback."
        tone="ink"
      >
        <p>
          Do not move sensitive data into a model because it is convenient. Do not
          automate a broken process without understanding why it fails. The client
          should own process, data access, apps, metrics, runbooks, and evals when
          we leave.
        </p>
      </PageSection>

      <section className={styles.stack} aria-labelledby="layers-title">
        <div className={styles.stackInner}>
          <h2 id="layers-title">System layers</h2>
          <p className={styles.stackLead}>
            One operating stack — applications and agents on a governed company
            brain.
          </p>
          <ol className={styles.layers}>
            {layers.map((layer) => (
              <li key={layer.name}>
                <span className={styles.layerName}>{layer.name}</span>
                <span className={styles.layerDetail}>{layer.detail}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.cta}>
        <h2>See how engagements run</h2>
        <ButtonLink href="/how-we-work">Diagnostic → Install → Operate</ButtonLink>
      </section>
    </div>
  );
}
