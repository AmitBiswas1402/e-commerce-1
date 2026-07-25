import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { EmailTemplate, EmailTemplateProps } from '@/components/EmailTemplate';

export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      type = 'ORDER_CONFIRMATION',
      to = 'delivered@resend.dev',
      customerName = 'Valued Customer',
      orderId,
      items = [],
      totalAmount = 0,
      shippingAddress,
    }: EmailTemplateProps & { to?: string } = body;

    const subject =
      type === 'WELCOME'
        ? `Welcome to Velora Market, ${customerName}! 🎉`
        : `Order Confirmation #${orderId || 'RECEIPT'} - Velora Market`;

    const htmlContent = await render(
      EmailTemplate({
        type,
        customerName,
        orderId,
        items,
        totalAmount,
        shippingAddress,
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'Velora Market <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}