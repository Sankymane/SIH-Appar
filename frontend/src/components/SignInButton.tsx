import React, { useEffect } from "react";

interface SignInButtonProps {
  onVerified?: (userJsonUrl: string) => void;
  clientId?: string;
}

declare global {
  interface Window {
    phoneEmailListener?: ((userObj: { user_json_url: string }) => void) | null;
  }
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  onVerified,
  clientId = "15695407177920574360",
}) => {
  useEffect(() => {
    // Load the external script provided by phone.email
    const script = document.createElement("script");
    script.src = "https://www.phone.email/sign_in_button_v1.js";
    script.async = true;

    const container = document.querySelector(".pe_signin_button");
    if (container) {
      container.appendChild(script);
    }

    // Define the listener function as per user instructions
    window.phoneEmailListener = function (userObj: { user_json_url: string }) {
      const user_json_url = userObj.user_json_url;
      if (onVerified) {
        onVerified(user_json_url);
      }
    };

    return () => {
      // Cleanup listener on unmount
      window.phoneEmailListener = null;
    };
  }, [onVerified]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0" }}>
      <div className="pe_signin_button" data-client-id={clientId}></div>
      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
        Instant 1-Tap OTP Verification via phone.email
      </div>
    </div>
  );
};
