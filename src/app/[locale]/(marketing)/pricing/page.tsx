import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ListPlans } from "@/application/use-cases/billing/ListPlans";
import { GetSubscription } from "@/application/use-cases/billing/GetSubscription";
import { ListProducts } from "@/application/use-cases/billing/ListProducts";
import {
  planGateway,
  productGateway,
  subscriptionGateway,
} from "@/infrastructure/registry";
import { PricingTable } from "@/presentation/components/organisms/PricingTable";
import { ProductsGrid } from "@/presentation/components/organisms/ProductsGrid";
import { GetStartedButton } from "./_components/GetStartedButton";
import { CheckoutButton } from "@/app/[locale]/(app)/billing/_components/CheckoutButton";
import { TeamCheckoutButton } from "@/app/[locale]/(app)/billing/_components/TeamCheckoutButton";
import { getOptionalUser } from "../_data/getOptionalUser";
import { buildPlanCards } from "@/app/[locale]/_lib/buildPlanCards";
import type { Plan } from "@/domain/models/Plan";
import type { Product } from "@/domain/models/Product";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("title") };
}

export default async function PricingPage() {
  const plansPromise = new ListPlans(planGateway)
    .execute()
    .catch((err): Plan[] => {
      console.error("Failed to fetch plans", err);
      return [];
    });

  const [t, user, plans] = await Promise.all([
    getTranslations("billing"),
    getOptionalUser(),
    plansPromise,
  ]);

  let currentPlanId: string | undefined;
  let products: Product[] = [];
  if (user) {
    try {
      const [subscription, fetchedProducts] = await Promise.all([
        new GetSubscription(subscriptionGateway).execute(),
        new ListProducts(productGateway).execute(),
      ]);
      currentPlanId = subscription?.plan;
      products = fetchedProducts;
    } catch (err) {
      console.error("Failed to fetch subscription/products", err);
    }
  }

  const planCards = buildPlanCards({
    plans,
    currentPlanId,
    labels: {
      upgrade: t("upgrade"),
      downgrade: t("downgrade"),
      perSeat: t("perSeat"),
    },
    renderCta: ({ plan, isCurrent, isTeam, unitPrice, ctaLabel }) => {
      if (!plan.price) return null;
      const highlighted = plan.name.toLowerCase().includes("pro");
      if (!user) {
        return (
          <GetStartedButton
            planPriceId={plan.price.id}
            highlighted={highlighted}
          >
            {t("select")}
          </GetStartedButton>
        );
      }
      if (isCurrent) return null;
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

  if (planCards.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t("title")}
        </h1>
      </div>
      <div className="mt-12">
        <PricingTable plans={planCards} />
      </div>

      <ProductsGrid
        className="mt-16"
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
