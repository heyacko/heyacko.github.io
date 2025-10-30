// Process shortcodes in raw markdown BEFORE parsing
export function processShortcodes(md) {
  let out = md;

  // pullquote - block element with content
  out = out.replace(
    /\{\{pullquote\}\}\s*([\s\S]*?)\s*\{\{\/pullquote\}\}/gi,
    (_, inner) => `<div class="pullquote">${inner.trim()}</div>`
  );

  // callout - block element with content (supports variants: success, warning, error, info)
  out = out.replace(
    /\{\{callout(?:\s+type="?(success|warning|error|info)"?)?\}\}\s*([\s\S]*?)\s*\{\{\/callout\}\}/gi,
    (_, type, inner) => {
      const variant = type ? ` callout--${type}` : '';
      return `<aside class="callout${variant}">${inner.trim()}</aside>`;
    }
  );

  // figure - self-closing with attributes
  out = out.replace(
    /\{\{figure\s+([^}]*?)\}\}/gi,
    (_, attrs) => {
      const src = attr(attrs, 'src') || '';
      const caption = attr(attrs, 'caption') || '';
      return `<figure><img src="${src}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`;
    }
  );

  // chart placeholder - self-closing with attributes
  out = out.replace(
    /\{\{chart\s+([^}]*?)\}\}/gi,
    () => `<div class="chart-placeholder">[Chart Placeholder]</div>`
  );

  // calculator placeholder - self-closing with attributes
  out = out.replace(
    /\{\{calculator\s+([^}]*?)\}\}/gi,
    () => `<div class="calc-placeholder">[Calculator Placeholder]</div>`
  );

  return out;
}

// Legacy function for HTML processing (kept for compatibility)
export function expandShortcodes(html) {
  return html; // Shortcodes are now processed before markdown parsing
}

function attr(str, name) {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(str);
  return m ? m[1] : '';
}

