export function parseLocalizedPrice(input: string): number {
    const cleaned = String(input || '')
        .replace(/[^\d.,-]/g, '')
        .trim();

    if (!cleaned) return 0;

    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(',');
        const lastDot = cleaned.lastIndexOf('.');
        const decimalSep = lastComma > lastDot ? ',' : '.';
        const thousandSep = decimalSep === ',' ? '.' : ',';
        const normalized = cleaned
            .split(thousandSep).join('')
            .replace(decimalSep, '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (hasComma || hasDot) {
        const sep = hasComma ? ',' : '.';
        const parts = cleaned.split(sep);
        const last = parts[parts.length - 1] || '';

        // Prices on cards are mostly integers with thousand separators.
        if (parts.length > 1 && last.length === 3) {
            const parsed = Number(parts.join(''));
            return Number.isFinite(parsed) ? parsed : 0;
        }

        const normalized = `${parts.slice(0, -1).join('')}.${last}`;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}
