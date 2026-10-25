import React, { useEffect, useRef } from "react";

interface SignInButtonProps {
  onVerified?: (userJsonUrl: string, verifiedPhone?: string) => void;
  clientId?: string;
  buttonText?: string;
}

declare global {
  interface Window {
    phoneEmailListener?: ((user_json_url: any, user_json_jwt?: string) => void) | null;
  }
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  onVerified,
  clientId = "11374656146720138530",
  buttonText = "Sign in with Phone",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    // Register global listener callback as per phone.email specification
    // Handles both phoneEmailListener(user_json_url, user_json_jwt) and phoneEmailListener(userObj)
    window.phoneEmailListener = function (user_json_url: any, user_json_jwt?: string) {
      let finalUrl = "";
      let directPhone = "";

      if (typeof user_json_url === "string") {
        finalUrl = user_json_url;
      } else if (user_json_url && typeof user_json_url === "object") {
        finalUrl = user_json_url.user_json_url || user_json_url.url || "";
        directPhone = user_json_url.user_phone_number || user_json_url.phone_no || user_json_url.phone || "";
      }

      // Check if JWT token is passed in second parameter or embedded in object
      const jwtToken = user_json_jwt || (typeof user_json_url === "object" ? (user_json_url.user_json_jwt || user_json_url.jwt) : "");
      if (jwtToken && !directPhone) {
        try {
          const parts = jwtToken.split(".");
          if (parts.length >= 2) {
            // Safe Base64URL decode
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
            const payload = JSON.parse(jsonPayload);
            directPhone = payload.user_phone_number || payload.phone_no || payload.phone || payload.user_phone || "";
          }
        } catch {}
      }

      if (directPhone) {
        const clean = directPhone.replace(/\D/g, "").slice(-10);
        if (clean.length === 10) {
          localStorage.setItem("pe_last_verified_phone", clean);
        }
      }

      if (onVerifiedRef.current && (finalUrl || directPhone)) {
        onVerifiedRef.current(finalUrl, directPhone);
      }
    };

    // Load external phone.email script
    const script = document.createElement("script");
    script.src = "https://www.phone.email/sign_in_button_v1.js";
    script.async = true;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      window.phoneEmailListener = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [clientId]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        margin: "12px 0",
      }}
    >
      {/* Official phone.email widget injection container */}
      <div
        ref={containerRef}
        className="pe_signin_button"
        data-client-id={clientId}
        style={{ display: "flex", justifyContent: "center", minHeight: "44px" }}
      ></div>

      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
        Secure 2FA verification powered by <strong>phone.email</strong>
      </div>
    </div>
  );
};
export default SignInButton;
