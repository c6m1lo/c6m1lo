"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const PRODUCT = {
  id: "drop-one",
  name: "THE CREATION OF ADAM",
  subtitle: "Michaelangelo · 1508–1512",
  description:
    "A heavyweight hoodie bearing the full composition of Michaelangelo's masterwork. Classical philosophy on the back. Your name beneath it.",
  price: 9500,
  displayPrice: "$95.00",
  colorway: "Black · Aged Cream Print",
  sizes: ["S", "M", "L", "XL", "XXL"],
  image: "/products/drop-one.jpg",
};

let stripePromise;
function getStripe() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export default function ShopPage() {
  const products = useMemo(() => [PRODUCT], []);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async (product) => {
    const size = selectedSizes[product.id];
    if (!size) return;

    setError("");
    setIsLoading(true);

    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          size,
          quantity: 1,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed.");
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result?.error) {
        throw new Error(result.error.message || "Redirect failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ padding: "80px 24px 48px", textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "32px",
            letterSpacing: "0.25em",
            color: "#d4c9b0",
            lineHeight: 1.05,
          }}
        >
          CAMILO
        </div>
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "32px",
            letterSpacing: "0.25em",
            color: "#d4c9b0",
            lineHeight: 1.05,
          }}
        >
          VALENCIA
        </div>
        <div style={{ width: "48px", height: "1px", background: "rgba(212, 201, 176, 0.2)", margin: "16px auto 0" }} />
        <div
          style={{
            marginTop: "16px",
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "10px",
            letterSpacing: "0.3em",
            color: "rgba(212, 201, 176, 0.3)",
          }}
        >
          COLLECTION
        </div>
      </header>

      {/* Grid */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div className="cv-shop-grid">
            {products.map((product) => {
              const selected = selectedSizes[product.id] || "";
              const disabled = !selected || isLoading;

              return (
                <div key={product.id} style={{ textAlign: "left" }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      objectFit: "cover",
                      background: "#0d0d0d",
                      display: "block",
                    }}
                  />

                  <div
                    style={{
                      marginTop: "20px",
                      fontFamily: "var(--font-valencia)",
                      fontWeight: 500,
                      fontSize: "14px",
                      letterSpacing: "0.15em",
                      color: "#d4c9b0",
                    }}
                  >
                    {product.name}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontFamily: "var(--font-valencia)",
                      fontWeight: 300,
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      color: "rgba(212, 201, 176, 0.4)",
                    }}
                  >
                    {product.subtitle}
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      fontFamily: "var(--font-valencia)",
                      fontWeight: 300,
                      fontSize: "12px",
                      color: "rgba(212, 201, 176, 0.5)",
                      lineHeight: 1.7,
                    }}
                  >
                    {product.description}
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      fontFamily: "var(--font-valencia)",
                      fontWeight: 300,
                      fontSize: "10px",
                      letterSpacing: "0.15em",
                      color: "rgba(212, 201, 176, 0.3)",
                    }}
                  >
                    {product.colorway}
                  </div>

                  {/* Size selector */}
                  <div style={{ marginTop: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.15em",
                        color: "#444444",
                      }}
                    >
                      SIZE
                    </label>
                    <div>
                      {product.sizes.map((size) => {
                        const isSelected = selected === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              setSelectedSizes((current) => ({
                                ...current,
                                [product.id]: current[product.id] === size ? "" : size,
                              }))
                            }
                            style={{
                              background: "transparent",
                              border: `1px solid ${isSelected ? "rgba(212, 201, 176, 0.6)" : "#242424"}`,
                              color: isSelected ? "#d4c9b0" : "#444444",
                              padding: "6px 12px",
                              fontSize: "10px",
                              fontFamily: "monospace",
                              cursor: "pointer",
                              marginRight: "6px",
                              marginBottom: "6px",
                              borderRadius: 0,
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (isSelected) return;
                              e.currentTarget.style.borderColor = "#333333";
                              e.currentTarget.style.color = "#666666";
                            }}
                            onMouseLeave={(e) => {
                              if (isSelected) return;
                              e.currentTarget.style.borderColor = "#242424";
                              e.currentTarget.style.color = "#444444";
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleCheckout(product)}
                    style={{
                      marginTop: "20px",
                      width: "100%",
                      padding: "14px",
                      background: "transparent",
                      border: "1px solid rgba(212, 201, 176, 0.3)",
                      color: "rgba(212, 201, 176, 0.7)",
                      fontFamily: "var(--font-valencia)",
                      fontWeight: 400,
                      fontSize: "12px",
                      letterSpacing: "0.2em",
                      cursor: disabled ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      opacity: disabled ? "0.4" : "1",
                    }}
                    onMouseEnter={(e) => {
                      if (disabled) return;
                      e.currentTarget.style.borderColor = "rgba(212, 201, 176, 0.8)";
                      e.currentTarget.style.color = "#d4c9b0";
                      e.currentTarget.style.background = "rgba(212, 201, 176, 0.07)";
                    }}
                    onMouseLeave={(e) => {
                      if (disabled) return;
                      e.currentTarget.style.borderColor = "rgba(212, 201, 176, 0.3)";
                      e.currentTarget.style.color = "rgba(212, 201, 176, 0.7)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    ORDER · {product.displayPrice}
                  </button>

                  {error ? (
                    <div
                      style={{
                        marginTop: "14px",
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        color: "#ff6b6b",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {error}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .cv-shop-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }
        @media (min-width: 860px) {
          .cv-shop-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

