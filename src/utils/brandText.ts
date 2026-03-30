const BRAND_LOWER_REGEX = /\bkhilonfast\b/gi
const BRAND_UPPER_TURKISH_REGEX = /KHİLONFAST/g
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'])

function normalizeBrandText(value: string, forceUppercaseBrand: boolean) {
  let next = value.replace(BRAND_UPPER_TURKISH_REGEX, 'KHILONFAST')

  if (forceUppercaseBrand) {
    next = next.replace(BRAND_LOWER_REGEX, 'KHILONFAST')
  }

  return next
}

function shouldSkipElement(element: Element | null) {
  if (!(element instanceof HTMLElement)) return true
  if (SKIP_TAGS.has(element.tagName)) return true
  if (element.closest('script, style, textarea, input, noscript')) return true
  return false
}

export function normalizeBrandTextNodes(root: ParentNode = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  let currentNode = walker.nextNode()
  while (currentNode) {
    textNodes.push(currentNode as Text)
    currentNode = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement
    if (!parent || shouldSkipElement(parent)) continue

    const original = textNode.nodeValue || ''
    if (!original || (!original.includes('hilonfast') && !original.includes('HİLONFAST'))) continue

    const forceUppercaseBrand = getComputedStyle(parent).textTransform === 'uppercase'
    const normalized = normalizeBrandText(original, forceUppercaseBrand)

    if (normalized !== original) {
      textNode.nodeValue = normalized
    }
  }
}
