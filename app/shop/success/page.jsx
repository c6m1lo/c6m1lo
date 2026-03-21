"use client";

export default function ShopSuccessPage() {
  return (
    <div
      style={{
        background: "#080808",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-valencia)",
          fontWeight: 300,
          fontSize: "18px",
          letterSpacing: "0.25em",
          color: "#d4c9b0",
          marginBottom: "24px",
        }}
      >
        CAMILO VALENCIA
      </div>
      <div style={{ width: "48px", height: "1px", background: "rgba(212, 201, 176, 0.2)" }} />
      <div
        style={{
          marginTop: "24px",
          fontFamily: "var(--font-valencia)",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.3em",
          color: "rgba(212, 201, 176, 0.4)",
        }}
      >
        ORDER CONFIRMED
      </div>
      <p
        style={{
          marginTop: "18px",
          fontFamily: "var(--font-valencia)",
          fontWeight: 300,
          fontSize: "12px",
          color: "rgba(212, 201, 176, 0.5)",
          lineHeight: 1.8,
          maxWidth: "52ch",
        }}
      >
        Thank you. Your order has been received. You will receive a confirmation email shortly.
      </p>
      <a
        href="/shop"
        style={{
          marginTop: "32px",
          fontFamily: "var(--font-valencia)",
          fontWeight: 300,
          fontSize: "10px",
          letterSpacing: "0.25em",
          color: "rgba(212, 201, 176, 0.3)",
          transition: "opacity 0.3s ease",
          opacity: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.7";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
      >
        RETURN TO COLLECTION
      </a>
    </div>
  );
}
