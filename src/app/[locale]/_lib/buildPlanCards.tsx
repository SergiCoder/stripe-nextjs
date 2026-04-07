import type { Plan } from "@/domain/models/Plan";
import type { PricingTableProps } from "@/presentation/components/organisms/PricingTable";

export interface PlanCardLabels {
  upgrade: string;
  downgrade: string;
  perSeat: string;
}

export interface BuildPlanCardsOptions {
  plans: Plan[];
  currentPlanId?: string;
  labels: PlanCardLabels;
  /**
   * Renders the call-to-action for a plan card. Receives metadata so callers
   * can decide between checkout, upgrade, signup, etc. Returning `null` means
   * no CTA should be shown for that plan.
   */
  renderCta: (ctx: {
    plan: Plan;
    isCurrent: boolean;
    isUpgrade: boolean;
    isTeam: boolean;
    unitPrice: number;
    ctaLabel: string;
  }) => React.ReactNode;
}

export function buildPlanCards({
  plans,
  currentPlanId,
  labels,
  renderCta,
}: BuildPlanCardsOptions): PricingTableProps["plans"] {
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const currentPrice = currentPlan?.price?.amount ?? 0;

  return plans.map((plan) => {
    const highlighted = plan.name.toLowerCase().includes("pro");
    const unitPrice = plan.price?.amount ?? 0;
    const isTeam = plan.context === "team";
    const isCurrent = Boolean(currentPlanId) && plan.id === currentPlanId;
    const isUpgrade = unitPrice > currentPrice;
    const ctaLabel = isUpgrade ? labels.upgrade : labels.downgrade;

    return {
      name: plan.name,
      price: plan.price ? `$${(unitPrice / 100).toFixed(0)}` : "$0",
      interval: isTeam ? `${labels.perSeat}/${plan.interval}` : plan.interval,
      description: plan.description,
      highlighted,
      cta: renderCta({
        plan,
        isCurrent,
        isUpgrade,
        isTeam,
        unitPrice,
        ctaLabel,
      }) ?? <span />,
    };
  });
}
