import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const apiHostname = apiUrl ? new URL(apiUrl).hostname : "";

const config: NextConfig = {
  images: {
    remotePatterns: apiHostname
      ? [{ protocol: "https", hostname: apiHostname }]
      : [],
  },
};

export default withNextIntl(config);
