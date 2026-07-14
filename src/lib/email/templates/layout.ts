const BRAND = {
  burgundy: '#6b1d2a',
  burgundyDark: '#4a1220',
  cream: '#f7f0e6',
  creamDark: '#e8dcc8',
  text: '#2c1810',
  textMuted: '#5c4a42',
} as const

export function emailButton(href: string, label: string): string {
  return `
    <p style="margin:24px 0 0;text-align:center;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background-color:${BRAND.burgundy};color:${BRAND.cream};text-decoration:none;font-weight:600;padding:14px 28px;border-radius:8px;">
        ${escapeHtml(label)}
      </a>
    </p>
  `.trim()
}

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Balkan House</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Source Sans 3',Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.creamDark};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${BRAND.burgundy};padding:24px;text-align:center;">
              <h1 style="margin:0;color:${BRAND.cream};font-size:24px;font-weight:700;letter-spacing:0.02em;">Balkan House</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:${BRAND.cream};border-top:1px solid ${BRAND.creamDark};text-align:center;font-size:12px;color:${BRAND.textMuted};">
              Balkan House · Produse balcanice de calitate
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
