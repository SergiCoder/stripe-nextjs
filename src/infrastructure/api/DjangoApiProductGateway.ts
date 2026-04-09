import type { IProductGateway } from "@/application/ports/IProductGateway";
import type { Product } from "@/domain/models/Product";
import { apiFetch } from "./apiClient";
import { keysToCamel } from "./caseTransform";

export class DjangoApiProductGateway implements IProductGateway {
  async listProducts(currency?: string): Promise<Product[]> {
    const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
    const raw = await apiFetch<Record<string, unknown>[]>(
      `/billing/products/${query}`,
    );
    return raw.map((p) => {
      const product = keysToCamel<Product>(p);
      if (p.price && typeof p.price === "object") {
        product.price = keysToCamel(p.price as Record<string, unknown>);
      }
      return product;
    });
  }
}
