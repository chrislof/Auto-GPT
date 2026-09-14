import type { Metadata } from "next";
import { PageSection } from "@/components/PageSection";
import { ButtonLink } from "@/components/ButtonLink";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "MindPress engagements: Diagnostic, Install, and Operate — buildable contracts, working software, and owned production.",
};

export default function HowWeWorkPage() {
  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.brand}>MindPress</p>
        <h1>How we work</h1>
        <p className={styles.lead}>
          Diagnostic. Install. Operate. We enter the workflow — we do not hand
          over a slide deck and call it transformation.
        </p>
      </header>

      <PageSection
        eyebrow="01"
        title="Diagnostic"
        lead="Enter the workflow, follow the data, watch the work happen, and identify the constraint."
      >
        <p>
          We measure the baseline and decide whether software or AI can
          materially improve it. Sometimes the answer is no. That is useful.
        </p>
        <p>
          The diagnostic ends with a buildable contract: the operator, job,
          inputs, systems, exceptions, permissions, outcome, tests, economics,
          and rollout plan.
        </p>
      </PageSection>

      <PageSection
        eyebrow="02"
        title="Install"
        lead="Forward-deployed engineers and AI engineers work together."
        tone="ink"
      >
        <p>
          They build the integrations, data contracts, application, agent
          behavior, evaluations, controls, and operating workflow. We test with
          synthetic or approved data before consequential use.
        </p>
        <p>
          We install working software and exercise it against the conditions it
          will face.
        </p>
      </PageSection>

      <PageSection
        eyebrow="03"
        title="Operate"
        lead="Production AI requires ownership. Models drift. Vendors change. Data breaks. Employees find edge cases."
      >
        <p>
          MindPress can monitor quality, cost, latency, adoption, and business
          outcomes; investigate failures; improve the system; and train the team.
        </p>
        <p>
          The client retains visibility and control. Ongoing operation is
          available when the workflow warrants it — not as an automatic retainer.
        </p>
      </PageSection>

      <section className={styles.cta}>
        <h2>Begin with the constraint</h2>
        <p>Bring the stuck workflow. Leave with a contract — or a clear no.</p>
        <ButtonLink href="/contact">Request a diagnostic</ButtonLink>
      </section>
    </div>
  );
}
