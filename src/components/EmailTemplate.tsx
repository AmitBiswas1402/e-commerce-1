import * as React from 'react';

export interface EmailOrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface EmailTemplateProps {
  type?: 'ORDER_CONFIRMATION' | 'WELCOME' | 'VENDOR_ALERT';
  customerName?: string;
  orderId?: string;
  items?: EmailOrderItem[];
  totalAmount?: number;
  shippingAddress?: string;
  date?: string;
}

export function EmailTemplate({
  type = 'ORDER_CONFIRMATION',
  customerName = 'Valued Customer',
  orderId = '',
  items = [],
  totalAmount = 0,
  shippingAddress = '123 Market Street, Suite 400',
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
}: EmailTemplateProps) {
  if (type === 'WELCOME') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f7', padding: '40px 20px', color: '#1f2937' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '32px 24px', textAlign: 'center' }}>
            <h1 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
              Velora Market
            </h1>
            <p style={{ color: '#e0e7ff', margin: '8px 0 0 0', fontSize: '14px' }}>
              Your Premium E-Commerce Experience
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '32px 24px' }}>
            <h2 style={{ fontSize: '20px', color: '#111827', marginTop: 0 }}>Welcome to Velora, {customerName}! 🎉</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#4b5563' }}>
              We&apos;re thrilled to have you join our community! Explore thousands of handpicked products across electronics, fashion, home, fitness, and more.
            </p>

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '20px', margin: '24px 0', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Special Welcome Discount</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>WELCOME10</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563' }}>Use code at checkout for 10% off your first order!</p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <a
                href="http://localhost:3000"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '30px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Start Shopping Now →
              </a>
            </div>
          </div>

          {/* Footer */}
          <div style={{ backgroundColor: '#f9fafb', padding: '20px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
              © {new Date().getFullYear()} Velora Market. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ORDER_CONFIRMATION / VENDOR_ALERT
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f7', padding: '40px 20px', color: '#1f2937' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '32px 24px', textAlign: 'center' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '26px', fontWeight: 'bold' }}>
            Velora Market
          </h1>
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '6px 14px', borderRadius: '20px', marginTop: '12px' }}>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>
              ✓ Order Confirmed #{orderId}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          <h2 style={{ fontSize: '18px', color: '#111827', marginTop: 0 }}>
            Thank you for your order, {customerName}!
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#4b5563' }}>
            We&apos;re preparing your items for shipment. Below is a summary of your receipt.
          </p>

          {/* Order Details Banner */}
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '16px', margin: '20px 0', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', paddingBottom: '6px' }}>Order Number:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right', color: '#111827' }}>#{orderId}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', paddingBottom: '6px' }}>Order Date:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right', color: '#111827' }}>{date}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280' }}>Delivery Address:</td>
                  <td style={{ fontWeight: 'bold', textAlign: 'right', color: '#111827' }}>{shippingAddress}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Order Items Table */}
          <h3 style={{ fontSize: '15px', color: '#111827', marginBottom: '12px' }}>Items Summary</h3>
          {items.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '8px 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#111827', fontWeight: 'bold' }}>{item.name}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#4b5563', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#111827', textAlign: 'right', fontWeight: 'bold' }}>₹{item.price.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Order details will be updated upon dispatch.</p>
          )}

          {/* Total Row */}
          <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>Total Amount Paid</td>
                  <td style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5', textAlign: 'right' }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <a
              href="http://localhost:3000"
              style={{
                display: 'inline-block',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '24px',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Track Your Order
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: '#f9fafb', padding: '20px 24px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            Need help with your order? Reply directly to this email or visit our Help Center.
          </p>
        </div>
      </div>
    </div>
  );
}