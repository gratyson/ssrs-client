export function getEndOfDay(): Date {
    const today: Date = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
}