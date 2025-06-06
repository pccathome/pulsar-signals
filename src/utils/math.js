export function map(value, x1, y1, x2, y2) {
    return ((value - x1) * (y2 - x2)) / (y1 - x1) + x2
}

export function lerp(a, b, t) {
    return a * (1 - t) + b * t
}
