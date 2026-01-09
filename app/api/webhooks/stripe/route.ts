import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getDB } from '@/lib/supabase/database';

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

    // Verify webhook signature
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
      const db = getDB();

      for (const item of lineItems) {
        let productName = 'Unknown product';
        
        if (typeof item.price?.product === 'object' && item.price.product && !item.price.product.deleted) {
          productName = item.price.product.name || 'Unknown product';
        }
        
        // Find product by name
        const { data: product } = await db
            .from('Product')
            .select('id')
            .eq('name', productName)
            .single();

        if (product) {
          orderItems.push({
            productId: product.id,
            quantity: item.quantity || 1,
            price: (item.amount_total || 0) / 100,
          });
        }
      }

      // Create order
      const { data: order, error: orderError } = await db
        .from('Order')
        .insert({
          userId: metadata.userId,
          total: (fullSession.amount_total || 0) / 100,
          shippingName: metadata.shippingName || '',
          shippingEmail: metadata.shippingEmail || '',
          shippingAddress: metadata.shippingAddress || '',
          status: 'PROCESSING', // Paid
          stripePaymentId: session.payment_intent as string,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
          console.error("Error creating order:", orderError);
          throw orderError;
      }

      // Assign items to order
      const orderItemsWithId = orderItems.map(item => ({
          ...item,
          orderId: order.id
      }));

      const { error: itemsError } = await db
        .from('OrderItem')
        .insert(orderItemsWithId);
        
      if (itemsError) {
          console.error("Error creating order items:", itemsError);
          throw itemsError;
      }

      // Clear user's cart
      await db
        .from('CartItem')
        .delete()
        .eq('userId', metadata.userId);

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
