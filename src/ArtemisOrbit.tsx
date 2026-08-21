import { Banknote, Users, UserCog, Truck, Hammer, Boxes } from "lucide-react";
import RadialOrbitalTimeline, { type OrbitalItem } from "@/components/ui/radial-orbital-timeline";

/* The six operating domains that feed Artemis. Titles, assistant names and
   context lines mirror `ecosystemData` / `assistantData` in script.js so the
   orbit tells the same story as the rest of the page. */
const domains: OrbitalItem[] = [
  {
    id: 1,
    title: "Finance",
    date: "Ziba",
    category: "Margin & budget",
    content:
      "Margin, budget and committed cost, connected to the work that moves them. Ziba explains why a number changed, not just that it did.",
    icon: Banknote,
    relatedIds: [5, 4],
    status: "completed",
    energy: 96,
  },
  {
    id: 2,
    title: "Customers",
    date: "Jupiter",
    category: "Accounts & service",
    content:
      "Account timelines, estimates and open service work stay attached to the projects and invoices they created.",
    icon: Users,
    relatedIds: [5, 1],
    status: "completed",
    energy: 88,
  },
  {
    id: 3,
    title: "People",
    date: "Atoosa",
    category: "Workforce readiness",
    content:
      "Workforce records, capacity and payroll readiness, tied to the delivery commitments that depend on them.",
    icon: UserCog,
    relatedIds: [5],
    status: "in-progress",
    energy: 74,
  },
  {
    id: 4,
    title: "Vendors",
    date: "Control",
    category: "Supply & purchasing",
    content:
      "Purchase orders, lead times and supplier changes surface as delivery and margin risk before they land.",
    icon: Truck,
    relatedIds: [6, 5, 1],
    status: "in-progress",
    energy: 81,
  },
  {
    id: 5,
    title: "Projects",
    date: "Delivery",
    category: "Schedule & cost",
    content:
      "Schedule, labour and cost in one place, so project performance is read as financial performance.",
    icon: Hammer,
    relatedIds: [1, 2, 3, 4],
    status: "completed",
    energy: 92,
  },
  {
    id: 6,
    title: "Inventory",
    date: "Flow",
    category: "Stock & fulfilment",
    content:
      "Stock positions and fulfilment status, connected to vendor lead times and the deliveries waiting on them.",
    icon: Boxes,
    relatedIds: [4, 5],
    status: "pending",
    energy: 63,
  },
];

export default function ArtemisOrbit() {
  return <RadialOrbitalTimeline timelineData={domains} />;
}
