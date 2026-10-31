import { ImageResponse } from "next/og";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SITE_NAME } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE_NAME;

/** Social preview: brand, headline and the landing page promise, per language. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #2848c7 0%, #16286f 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 40, fontWeight: 700 }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#fff" />
          <path
            d="M14 44h10l6-14 8 20 6-12h6"
            fill="none"
            stroke="#2848c7"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {SITE_NAME}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{t("headline")}</div>
        <div style={{ fontSize: 30, opacity: 0.85 }}>{t("eyebrow")}</div>
      </div>
    </div>,
    size,
  );
}
