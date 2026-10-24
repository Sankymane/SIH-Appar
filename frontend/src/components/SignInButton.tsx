import React, { useEffect, useRef } from "react";

interface SignInButtonProps {
  onVerified?: (userJsonUrl: string) => void;
  clientId?: string;
  buttonText?: string;
}

declare global {
  interface Window {
    phoneEmailListener?: ((userObj: { user_json_url: string }) => void) | null;
  }
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  onVerified,
  clientId = "11374656146720138530",
  buttonText = "Sign in with Phone",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register global listener callback as per phone.email specification
    window.phoneEmailListener = function (userObj: { user_json_url: string }) {
      if (userObj && userObj.user_json_url && onVerified) {
        onVerified(userObj.user_json_url);
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
  }, [onVerified, clientId]);

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
