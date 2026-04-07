import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GetSubscription } from "@/application/use-cases/billing/GetSubscription";
import { ListPlans } from "@/application/use-cases/billing/ListPlans";
import { ListProducts } from "@/application/use-cases/billing/ListProducts";
import {
  subscriptionGateway,
  planGateway,
  productGateway,
} from "@/infrastructure/registry";
import { getCurrentUser } from "../_data/getCurrentUser";
import { SubscriptionCard } from "@/presentation/components/organisms/SubscriptionCard";
import { PricingTable } from "@/presentation/components/organisms/PricingTable";
import { ProductsGrid } from "@/presentation/components/organisms/ProductsGrid";
import { CheckoutButton } from "./_components/CheckoutButton";
import { TeamCheckoutButton } from "./_components/TeamCheckoutButton";
import { BillingPortalButton } from "./_components/BillingPortalButton";
import { buildPlanCards } from "@/app/[locale]/_lib/buildPlanCards";
import type { Plan } from "@/domain/models/Plan";
import type { Product } from "@/domain/models/Product";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("title") };
}

export default async function BillingPage() {
  const plansPromise = new ListPlans(planGateway)
    .execute()
    .catch((err): Plan[] => {
      console.error("Failed to fetch plans", err);
      return [];
    });
  const productsPromise = new ListProducts(productGateway)
    .execute()
    .catch((err): Product[] => {
      console.error("Failed to fetch products", err);
      return [];
    });

  const [t, , subscription, plans, products] = await Promise.all([
    getTranslations("billing"),
    getCurrentUser(),
    new GetSubscription(subscriptionGateway).execute(),
    plansPromise,
    productsPromise,
  ]);

  const planName = subscription
    ? plans.find((p) => p.id === subscription.plan)?.name
    : undefined;

  const planCards = buildPlanCards({
    plans,
    currentPlanId: subscription?.plan,
    labels: {
      upgrade: t("upgrade"),
      downgrade: t("downgrade"),
      perSeat: t("perSeat"),
    },
    renderCta: ({ plan, isCurrent, isTeam, unitPrice, ctaLabel }) => {
      if (isCurrent || !plan.price) return null;
      const highlighted = plan.name.toLowerCase().includes("pro");
      if (isTeam) {
        return (
          <TeamCheckoutButton
            planPriceId={plan.price.id}
            unitPrice={unitPrice}
            interval={plan.interval}
            highlighted={highlighted}
            seatLabel={t("seat")}
            seatsLabel={t("seats")}
            perSeatLabel={t("perSeat")}
          >
            {ctaLabel}
          </TeamCheckoutButton>
        );
      }
      return (
        <CheckoutButton planPriceId={plan.price.id} highlighted={highlighted}>
          {ctaLabel}
        </CheckoutButton>
      );
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      {subscription && (
        <SubscriptionCard
          planName={planName ?? t("currentPlan")}
          status={subscription.status}
          statusLabel={subscription.status}
          interval=""
          price={`${subscription.quantity} ${subscription.quantity === 1 ? t("seat") : t("seats")}`}
          currentPeriodEnd={new Date(
            subscription.currentPeriodEnd,
          ).toLocaleDateString()}
          periodEndLabel={t("periodEnd")}
          cancelAtPeriodEnd={subscription.canceledAt !== null}
          cancelLabel={
            subscription.canceledAt !== null ? t("cancel") : undefined
          }
          actions={<BillingPortalButton>{t("portal")}</BillingPortalButton>}
        />
      )}

      {planCards.length === 0 ? (
        <p className="text-sm text-gray-500">{t("changePlan")}</p>
      ) : (
        <PricingTable plans={planCards} />
      )}

      <ProductsGrid
        title={t("products")}
        products={products}
        creditsLabel={t("credits")}
        renderCta={(product) =>
          product.price && (
            <CheckoutButton planPriceId={product.price.id}>
              {t("buy")}
            </CheckoutButton>
          )
        }
      />
    </div>
  );
}
