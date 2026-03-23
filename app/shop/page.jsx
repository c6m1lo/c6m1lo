"use client";

import { useMemo, useState } from "react";

const PRODUCTS = [
  {
    id: "creation-of-adam",
    name: "CREATION OF ADAM",
    subtitle: "Michelangelo · 1508–1512",
    description:
      "A heavyweight hoodie bearing the full composition of Michelangelo's masterwork. Classical philosophy on the back.",
    price: 9900,
    displayPrice: "$99.00",
    colorway: "Black · Aged Cream Print",
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "/CreationOfAdam.png",
    paymentLink: "https://buy.stripe.com/9B600j4gdcAs8lZ8i39oc0b",
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
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "/AssumptionOfTheVirgin.png",
    paymentLink: "https://buy.stripe.com/cNi8wP9Ax7g80Tx2XJ9oc0c",
  },
  {
    id: "the-last-supper",
    name: "THE LAST SUPPER",
    subtitle: "Leonardo da Vinci · 1495–1498",
    description:
      "A heavyweight hoodie carrying Leonardo’s most iconic scene—stillness and shock held in perfect geometry.",
    price: 9900,
    displayPrice: "$99.00",
    colorway: "Black · Aged Cream Print",
    sizes: ["S", "M", "L", "XL", "XXL"],
    image: "/TheLastSupper.png",
    paymentLink: "https://buy.stripe.com/aFacN5h2ZfME45JeGr9oc0d",
  },
];

export default function ShopPage() {
  const products = useMemo(() => PRODUCTS, []);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [error, setError] = useState("");

  const handleCheckout = async (product) => {
    const size = selectedSizes[product.id];
    if (!size) return;

    setError("");

    try {
      const paymentLink =
        product.paymentLink ||
        process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_URL ||
        "https://buy.stripe.com/9B600j4gdcAs8lZ8i39oc0b";

      const url = new URL(paymentLink);
      url.searchParams.set("client_reference_id", `${product.id}:${size}`);
      window.location.assign(url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
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
              const disabled = !selected;

              return (
                <div key={product.id} style={{ textAlign: "left" }}>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4 / 5",
                      background: "#0d0d0d",
                      display: "block",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={product.image}
                      alt={`${product.name} artwork overlay`}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.22,
                        filter: "saturate(160%) contrast(110%) brightness(1.08)",
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
