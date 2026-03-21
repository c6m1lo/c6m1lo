// Required environment variables (set in Vercel: Project → Settings → Environment Variables, and locally in `.env.local`):
// - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (client)
// - STRIPE_SECRET_KEY (server)
// - NEXT_PUBLIC_BASE_URL (client/server): https://c6m1lo.com in production, http://localhost:3000 in development

import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

const stripe =
  stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" })
    : null;

export async function POST(request) {
  if (!stripe) {
    return Response.json({ error: "Missing STRIPE_SECRET_KEY." }, { status: 500 });
  }
  if (!baseUrl) {
    return Response.json({ error: "Missing NEXT_PUBLIC_BASE_URL." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const productId = String(body?.productId || "");
  const productName = String(body?.productName || "");
  const size = String(body?.size || "");
  const price = Number(body?.price);
  const quantity = Number(body?.quantity);

  if (!productId || !productName || !size) {
    return Response.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return Response.json({ error: "Invalid price." }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return Response.json({ error: "Invalid quantity." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: `${productName} · Size ${size}`,
              description: "Camilo Valencia · Drop One · Black Aged Cream Hoodie",
            },
          },
          quantity,
        },
      ],
      success_url: `${baseUrl}/shop/success`,
      cancel_url: `${baseUrl}/shop`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      metadata: {
        productId,
        size,
      },
    });

    return Response.json({ sessionId: session.id });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Stripe error." },
      { status: 500 },
    );
  }
}

