/** Curated manifesto sections for the public site — interpretive, not claimed delivery. */

export type ManifestoSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const manifestoIntro = {
  title: "We put AI to work for you",
  subtitle: "The MindPress manifesto",
  lead:
    "Most companies do not need another AI strategy. They need the work to get done.",
};

export const manifestoSections: ManifestoSection[] = [
  {
    id: "thesis",
    title: "MindPress changes the company",
    paragraphs: [
      "The lead needs to be researched. The customer needs a useful answer. The invoice needs to be matched. The store manager needs to know where margin disappeared. The recruiter needs to know who is a fit. The controller needs a clean exception queue. The CEO needs one version of the truth and a short list of decisions.",
      "Today, that work is scattered across spreadsheets, inboxes, SaaS tools, databases, meetings, and the heads of experienced employees. AI gets added as a chat window on top. The underlying company stays the same.",
      "We connect its systems, encode its operating rules, build the software its people need, and install agents that can perform bounded work. Then we measure whether revenue rose, costs fell, decisions improved, and employees actually adopted what we built.",
    ],
  },
  {
    id: "zollege",
    title: "What we learned from Zollege",
    paragraphs: [
      "Kevin Colten and the Zollege team built something more important than a collection of internal tools. They built the beginnings of an operating platform — authenticated apps, flexible tables, pages, isolated handlers, private files, workflows, and governed agent access through MCP.",
      "Those numbers are a snapshot, not a claim that every app is complete or production-ready. The lesson is the architecture: governed understanding of the business, tools that map to real work, applications employees can control, and permissions, evidence, approvals, and observability around consequential action.",
      "We are not selling Zollege’s software or data. We are carrying forward the operating idea: every company should have a secure AI-enabled layer that connects its systems, turns its rules into software, and helps its people run the business.",
    ],
  },
  {
    id: "brain",
    title: "The company brain",
    paragraphs: [
      "Every engagement starts by building a trustworthy map of the company — not a giant data lake with no owner, and not a chatbot trained on random documents.",
      "The company brain is not one model and it is not a memory dump. Models will change. The durable asset is the company’s structured context, operating logic, permissions, and verified history.",
    ],
    bullets: [
      "Systems of record; people, roles, and permissions",
      "Customers, products, locations, and transactions",
      "Metric definitions the company manages",
      "Workflows and their exceptions",
      "Policies, approval boundaries, freshness, and quality",
      "Decisions, owners, and operating history",
    ],
  },
  {
    id: "factory",
    title: "The company app factory",
    paragraphs: [
      "Generic software forces a company to change its work to fit a vendor’s product. Custom software has traditionally been too slow and expensive. AI changes that tradeoff.",
      "MindPress builds small, specific operating applications on top of the company brain. We do not create a new app when the existing system can do the work well. We integrate, simplify, or automate first.",
      "Every app must have an owner, a source of truth, an access policy, a measurable outcome, and a rollback path. A generated interface becomes a product when it survives real users, bad data, and operating pressure.",
    ],
  },
  {
    id: "revenue",
    title: "Revenue is an engineering problem",
    paragraphs: [
      "Marketing and sales are full of software-shaped problems. Data is fragmented. Follow-up is uneven. Personalization is shallow. Teams optimize activity because they cannot connect actions to gross profit.",
      "Tools such as Clay, Apollo, HubSpot, advertising platforms, email, calling systems, and customer databases are components when they fit. The product is the company’s revenue process, encoded and operated as a measurable system.",
      "AI may draft an email. It does not earn the right to send it automatically. We do not promise impressions, leads, or meetings as ends in themselves.",
    ],
  },
  {
    id: "back-office",
    title: "The back office should run on evidence",
    paragraphs: [
      "Finance, HR, and operations carry the company’s memory — and too much manual work. AI can investigate and recommend. Policy, approval authority, and payment control remain explicit.",
      "The objective is not fewer accountants or surveillance of employees. It is management by exception: leaders should not need to reconstruct the company every morning.",
    ],
  },
  {
    id: "one-layer",
    title: "One operating layer",
    paragraphs: [
      "Marketing, sales, finance, HR, and operations are not separate inside a real company. MindPress connects the chain with a shared operating layer and departmental applications and agents on top. That is how AI compounds.",
    ],
  },
  {
    id: "how",
    title: "How we work",
    paragraphs: [
      "Diagnostic — enter the workflow, follow the data, measure the baseline, and end with a buildable contract. Sometimes the answer is no. That is useful.",
      "Install — forward-deployed engineers and AI engineers build integrations, data contracts, applications, agent behavior, evaluations, and controls. We install working software, not a slide deck.",
      "Operate — production AI requires ownership. We can monitor quality, cost, latency, adoption, and outcomes when the workflow warrants it. The client retains visibility and control.",
    ],
  },
  {
    id: "proof",
    title: "Our standard of proof",
    paragraphs: [
      "A demo proves that something can happen once. Production requires permission boundaries, failure-path tests, evaluation cases, versioning, idempotency, human approval for consequential actions, cost and latency limits, monitoring, operator controls, rehearsed rollback, readback, and measured impact.",
      "We separate facts from assumptions. We do not invent customer outcomes, case studies, benchmarks, or certainty. When evidence is missing, we say so and design the next test.",
    ],
  },
  {
    id: "refuse",
    title: "What we refuse to become",
    paragraphs: [],
    bullets: [
      "A prompt shop",
      "A generic chatbot left for the customer to configure",
      "Automators of broken processes we do not understand",
      "Movers of sensitive data into models for convenience",
      "Measurers of success by tokens, agents, dashboards, or generated content",
      "Hiders of uncertainty behind polished language",
      "Operators who let agents send, pay, publish, hire, fire, or alter production without authority and controls",
      "Builders of mystery systems only we understand",
    ],
  },
  {
    id: "leave-behind",
    title: "What clients should own when we leave",
    paragraphs: [
      "A clearer operating process; governed access to data; tested applications and agents; metric definitions; an evaluation set; runbooks; documented approval rules; employees who can use and challenge the system; a backlog tied to economic value; and evidence of what improved and what did not.",
      "If only MindPress can understand it, we have not finished the job.",
    ],
  },
  {
    id: "ambition",
    title: "The company we are building",
    paragraphs: [
      "MindPress is a forward-deployed AI engineering company for operators who want the work done.",
      "Every business should be able to operate with the clarity, speed, and leverage of a great software company without having to become one first.",
      "That is the work. We put AI to work for you.",
    ],
  },
  {
    id: "evidence",
    title: "Evidence behind this manifesto",
    paragraphs: [
      "This manifesto is a strategic interpretation, not a claim that MindPress has delivered this full system to external clients. Verified inputs include the Zollege Apps architecture, MCP tool catalog, and an accessible portfolio snapshot — with clear limits: counts may include experiments and incomplete work; no confidential implementation is offered for reuse.",
    ],
  },
];
