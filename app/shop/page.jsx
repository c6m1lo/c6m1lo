"use client";

import { useMemo, useState } from "react";

const PRODUCTS = [
  {
    id: "cherub-hat",
    name: "CHERUB HAT",
    subtitle: "Cherub · MMXXVI",
    description: "A minimal black hat featuring the cherub mark.",
    price: 0,
    displayPrice: "TBD",
    colorway: "Black",
    image: "/cherubHat.png",
    paymentLink: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_CHERUB_HAT,
  },
  {
    id: "assumption-of-the-virgin",
    name: "ASSUMPTION OF THE VIRGIN",
    subtitle: "Titian · 1516–1518",
    description:
      "A heavyweight hoodie featuring Titian’s monumental altarpiece—radiant color, ascending motion, and devotional intensity.",
    price: 9900,
    displayPrice: "$99.00",
    colorway: "Black · Aged Cream Print",
    image: "/AssumptionOfTheVirgin.png",
    paymentLink: "https://buy.stripe.com/cNi8wP9Ax7g80Tx2XJ9oc0c",
  },
];

export default function ShopPage() {
  const products = useMemo(() => PRODUCTS, []);
  const [error, setError] = useState("");

  const handleCheckout = async (product) => {
    setError("");

    try {
      const paymentLink = product.paymentLink;
      if (!paymentLink) {
        throw new Error("This item is not available yet.");
      }

      const url = new URL(paymentLink);
      url.searchParams.set("client_reference_id", product.id);
      window.location.assign(url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    }
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>
      {/* Header */}
      <header className="cv-shop-header">
        <div
          style={{
            fontFamily: "var(--font-valencia)",
            fontWeight: 300,
            fontSize: "clamp(24px, 7vw, 32px)",
            letterSpacing: "clamp(0.14em, 1.4vw, 0.25em)",
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
            fontSize: "clamp(24px, 7vw, 32px)",
            letterSpacing: "clamp(0.14em, 1.4vw, 0.25em)",
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
      <section className="cv-shop-section">
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div className="cv-shop-grid">
            {products.map((product) => {
              return (
                <div key={product.id} style={{ textAlign: "left" }}>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      background: "#d4c9b0",
                      display: "block",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={product.image}
                      alt={`${product.name} hoodie`}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 1,
                        filter: "none",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  </div>

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

                  <button
                    type="button"
                    disabled={!product.paymentLink}
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
                      cursor: product.paymentLink ? "pointer" : "not-allowed",
                      opacity: product.paymentLink ? 1 : 0.55,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!product.paymentLink) return;
                      e.currentTarget.style.borderColor = "rgba(212, 201, 176, 0.8)";
                      e.currentTarget.style.color = "#d4c9b0";
                      e.currentTarget.style.background = "rgba(212, 201, 176, 0.07)";
                    }}
                    onMouseLeave={(e) => {
                      if (!product.paymentLink) return;
                      e.currentTarget.style.borderColor = "rgba(212, 201, 176, 0.3)";
                      e.currentTarget.style.color = "rgba(212, 201, 176, 0.7)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {product.paymentLink ? `ORDER · ${product.displayPrice}` : "COMING SOON"}
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
        .cv-shop-header {
          padding: 80px 24px 48px;
          text-align: center;
        }

        .cv-shop-section {
          padding: 0 24px 120px;
        }

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
        @media (max-width: 480px) {
          .cv-shop-header {
            padding: 64px 18px 36px;
          }

          .cv-shop-section {
            padding: 0 18px 96px;
          }

          .cv-shop-grid {
            gap: 36px;
          }
        }
      `}</style>
    </div>
  );
}
