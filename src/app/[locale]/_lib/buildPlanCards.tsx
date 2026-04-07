import type { Plan, PlanTier } from "@/domain/models/Plan";

export interface PlanCardLabels {
  upgrade: string;
  downgrade: string;
  perSeat: string;
}

export interface PlanVariantView {
  /** Display price for the card header (e.g. "$19"). */
  price: string;
  /** Interval-suffix label after the price (e.g. "month", "per seat/month"). */
  intervalLabel: string;
  /**
   * Optional sub-label shown below the price (e.g. "$19/month billed yearly").
   * Only set when it adds information beyond the headline price.
   */
  priceSubLabel?: string;
  /** Pre-rendered CTA for this variant. `null` when no CTA should be shown. */
  cta: React.ReactNode | null;
}

export interface PlanCardGroup {
  /** Stable key, e.g. "personal-pro". */
  key: string;
  /** Tier display name, e.g. "Pro". */
  name: string;
  description: string;
  highlighted: boolean;
  context: "personal" | "team";
  tier: PlanTier;
  monthly?: PlanVariantView;
  yearly?: PlanVariantView;
  /**
   * Discount percentage of the yearly variant compared to 12x monthly,
   * rounded to the nearest integer. Only set when both variants exist
   * and yearly < monthly * 12.
   */
  yearlySavingsPct?: number;
}

export interface BuildPlanCardGroupsOptions {
  plans: Plan[];
  currentPlanId?: string;
  labels: PlanCardLabels;
  /**
   * Renders the call-to-action for a single plan variant. Returning `null`
   * means no CTA should be shown for that variant (e.g. it's the current plan).
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

const TIER_ORDER: PlanTier[] = ["free", "basic", "pro"];

function tierDisplayName(tier: PlanTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function formatPrice(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(0)}`;
}

/** Monthly-equivalent price in cents, used to compare across intervals. */
function monthlyEquivalent(plan: Plan): number {
  const amount = plan.price?.amount ?? 0;
  return plan.interval === "year" ? amount / 12 : amount;
}

export function buildPlanCardGroups({
  plans,
  currentPlanId,
  labels,
  renderCta,
}: BuildPlanCardGroupsOptions): PlanCardGroup[] {
  const currentPlan = plans.find((p) => p.id === currentPlanId);
  const currentMonthlyEq = currentPlan ? monthlyEquivalent(currentPlan) : 0;

  // Group by (context, tier).
  const groups = new Map<
    string,
    { context: Plan["context"]; tier: PlanTier; plans: Plan[] }
  >();
  for (const plan of plans) {
    const key = `${plan.context}-${plan.tier}`;
    let group = groups.get(key);
    if (!group) {
      group = { context: plan.context, tier: plan.tier, plans: [] };
      groups.set(key, group);
    }
    group.plans.push(plan);
  }

  const buildVariant = (plan: Plan): PlanVariantView => {
    const unitPrice = plan.price?.amount ?? 0;
    const isTeam = plan.context === "team";
    const isCurrent = Boolean(currentPlanId) && plan.id === currentPlanId;
    const monthlyEq = monthlyEquivalent(plan);
    const isUpgrade = monthlyEq > currentMonthlyEq;
    const ctaLabel = isUpgrade ? labels.upgrade : labels.downgrade;

    const intervalLabel = isTeam
      ? `${labels.perSeat}/${plan.interval}`
      : plan.interval;

    let priceSubLabel: string | undefined;
    if (plan.interval === "year" && unitPrice > 0) {
      const monthlyEqDollars = unitPrice / 12 / 100;
      const formatted = `$${monthlyEqDollars.toFixed(monthlyEqDollars % 1 === 0 ? 0 : 2)}`;
      priceSubLabel = isTeam
        ? `${formatted}/${labels.perSeat}/month billed yearly`
        : `${formatted}/month billed yearly`;
    }

    return {
      price: plan.price ? formatPrice(unitPrice) : "$0",
      intervalLabel,
      priceSubLabel,
      cta:
        renderCta({
          plan,
          isCurrent,
          isUpgrade,
          isTeam,
          unitPrice,
          ctaLabel,
        }) ?? null,
    };
  };

  const result: PlanCardGroup[] = [];
  for (const group of groups.values()) {
    const monthlyPlan = group.plans.find((p) => p.interval === "month");
    const yearlyPlan = group.plans.find((p) => p.interval === "year");

    const monthly = monthlyPlan ? buildVariant(monthlyPlan) : undefined;
    const yearly = yearlyPlan ? buildVariant(yearlyPlan) : undefined;

    let yearlySavingsPct: number | undefined;
    if (
      monthlyPlan?.price &&
      yearlyPlan?.price &&
      monthlyPlan.price.amount > 0 &&
      yearlyPlan.price.amount < monthlyPlan.price.amount * 12
    ) {
      const fullYear = monthlyPlan.price.amount * 12;
      yearlySavingsPct = Math.round(
        (1 - yearlyPlan.price.amount / fullYear) * 100,
      );
    }

    // Description: prefer the monthly variant's (yearly often has " Billed annually..." appended).
    const description =
      monthlyPlan?.description ?? yearlyPlan?.description ?? "";

    result.push({
      key: `${group.context}-${group.tier}`,
      name: tierDisplayName(group.tier),
      description,
      highlighted: group.tier === "pro",
      context: group.context,
      tier: group.tier,
      monthly,
      yearly,
      yearlySavingsPct,
    });
  }

  // Sort by tier order so Free → Basic → Pro.
  result.sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );

  return result;
}
