"use server";

import { redirect } from "next/navigation";
import { StartCheckout } from "@/application/use-cases/billing/StartCheckout";
import { OpenBillingPortal } from "@/application/use-cases/billing/OpenBillingPortal";
import { subscriptionGateway } from "@/infrastructure/registry";

const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function startCheckout(formData: FormData) {
  const planPriceId = formData.get("planPriceId");
  const quantityRaw = formData.get("quantity");

  if (typeof planPriceId !== "string") {
    return;
  }

  const quantity =
    typeof quantityRaw === "string" && quantityRaw
      ? parseInt(quantityRaw, 10)
      : undefined;

  let url: string;
  try {
    ({ url } = await new StartCheckout(subscriptionGateway).execute({
      planPriceId,
      ...(quantity && quantity > 0 ? { quantity } : {}),
      successUrl: `${APP_ORIGIN}/billing?status=success`,
      cancelUrl: `${APP_ORIGIN}/billing`,
    }));
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    console.error("Failed to start checkout", err);
    return;
  }
  redirect(url);
}

export async function openBillingPortal() {
  let url: string;
  try {
    ({ url } = await new OpenBillingPortal(subscriptionGateway).execute({
      returnUrl: `${APP_ORIGIN}/billing`,
    }));
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    console.error("Failed to open billing portal", err);
    return;
  }
  redirect(url);
}
