import type { IPlanGateway } from "@/application/ports/IPlanGateway";
import type { Plan } from "@/domain/models/Plan";
import { publicApiFetch } from "./apiClient";
import { keysToCamel } from "./caseTransform";

export class DjangoApiPlanGateway implements IPlanGateway {
  async listPlans(currency?: string): Promise<Plan[]> {
    const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
    const raw = await publicApiFetch<Record<string, unknown>[]>(
      `/billing/plans/${query}`,
    );
    return raw.map((p) => {
      const plan = keysToCamel<Plan>(p);
      if (p.price && typeof p.price === "object") {
        plan.price = keysToCamel(p.price as Record<string, unknown>);
      }
      return plan;
    });
  }
}
