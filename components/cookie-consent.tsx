// ─── DO NOT REMOVE ──────────────────────────────────────────────────────────
// GDPR cookie consent banner + Google Consent Mode v2 wiring.
// Banner UI lives in ./cookie-consent-banner.tsx (must keep both files).
// Rendered at the top of <body> in app/layout.tsx — that ordering is required
// so the `default_consent` push lands on window.dataLayer before any GTM /
// Meta Pixel / Google Ads script. Do not move it below other scripts.
// ────────────────────────────────────────────────────────────────────────────
import { cookies } from "next/headers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

// Must match CONSENT_COOKIE in ./cookie-consent-banner.tsx
const CONSENT_COOKIE = "yns-cookie-consent";

const ConsentScript = ({ state }: { state: "denied" | "granted" }) => (
	<script
		dangerouslySetInnerHTML={{
			__html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'default_consent',ad_storage:'${state}',ad_user_data:'${state}',ad_personalization:'${state}',analytics_storage:'${state}'});`,
		}}
	/>
);

export async function CookieConsent() {
	const consent = (await cookies()).get(CONSENT_COOKIE)?.value;
	return (
		<>
			<ConsentScript state={consent === "accepted" ? "granted" : "denied"} />
			{!consent && <CookieConsentBanner />}
		</>
	);
}
