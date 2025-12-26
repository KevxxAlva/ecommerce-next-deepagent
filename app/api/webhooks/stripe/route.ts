import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    // Verify webhook signature (if webhook secret is configured)
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      // For development without webhook secret
      event = JSON.parse(body);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price.product'],
      });

      const metadata = fullSession.metadata;
      const lineItems = fullSession.line_items?.data || [];

      if (!metadata?.userId) {
        console.error('No userId in metadata');
        return NextResponse.json({ received: true });
      }

      // Create order items from line items
      const orderItems = [];
      for (const item of lineItems) {
        let productName = 'Unknown product';
        
        if (typeof item.price?.product === 'object' && item.price.product && !item.price.product.deleted) {
          productName = item.price.product.name || 'Unknown product';
        }
        
        // Try to find product by name
        const product = await prisma.product.findFirst({
          where: { name: productName },
        });

        if (product) {
          orderItems.push({
            productId: product.id,
            quantity: item.quantity || 1,
            price: (item.amount_total || 0) / 100,
          });
        }
      }

      // Create order in database
      await prisma.order.create({
        data: {
          userId: metadata.userId,
          total: (fullSession.amount_total || 0) / 100,
          shippingName: metadata.shippingName || '',
          shippingEmail: metadata.shippingEmail || '',
          shippingAddress: metadata.shippingAddress || '',
          status: 'PROCESSING',
          stripePaymentId: session.payment_intent as string,
          items: {
            create: orderItems,
          },
        },
      });

      // Clear user's cart
      await prisma.cartItem.deleteMany({
        where: { userId: metadata.userId },
      });

      console.log('Order created successfully for session:', session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}
