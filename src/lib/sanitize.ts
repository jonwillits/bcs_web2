import DOMPurify from 'isomorphic-dompurify'

const SAFE_STYLE_PATTERN = /^(text-align\s*:\s*(left|center|right|justify)|width\s*:\s*\d+(px|%|em|rem)|height\s*:\s*(auto|\d+(px|%|em|rem)))(;\s*(text-align\s*:\s*(left|center|right|justify)|width\s*:\s*\d+(px|%|em|rem)|height\s*:\s*(auto|\d+(px|%|em|rem))))*;?$/

// Strip unsafe CSS properties while keeping safe ones (text-align, width, height)
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName === 'style') {
    if (!SAFE_STYLE_PATTERN.test(data.attrValue.trim())) {
      data.attrValue = ''
    }
  }
})

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark',
      'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'iframe', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'colspan', 'rowspan',
      'allowfullscreen', 'frameborder', 'allow', 'loading',
      'data-type', 'data-language', 'data-youtube-video',
      'style',
    ],
    ALLOW_DATA_ATTR: false,
  })
}
