/**
 * A short orientation note shown at the top of the admin dashboard.
 * Server component with inline styles (no global admin CSS dependency),
 * using the storefront's burgundy/cream palette.
 */
export function DashboardWelcome() {
  return (
    <div
      style={{
        border: '1px solid #e8dcc8',
        borderLeft: '4px solid #6b1d2a',
        background: '#f7f0e6',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
      }}
    >
      <h2
        style={{
          margin: '0 0 4px',
          fontSize: '1.1rem',
          color: '#6b1d2a',
        }}
      >
        Balkan House — admin
      </h2>
      <p style={{ margin: 0, color: '#5c4a42', lineHeight: 1.5 }}>
        Manage your shop from the sections in the sidebar. <strong>Sales → Orders</strong> is where
        new orders arrive — confirm them, send the payment link, then mark as shipped.{' '}
        <strong>Catalog</strong> holds products, categories, promotions and images.
      </p>
    </div>
  )
}
