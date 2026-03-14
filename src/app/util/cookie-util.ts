export function getCookieValue(cookieName: string): string {
    const decodedCookieStr = decodeURIComponent(document.cookie);
    for (let cookie of decodedCookieStr.split(";")) {
        const trimmedCookie = cookie.trim();

        if (trimmedCookie.startsWith(cookieName + "=")) {
            return trimmedCookie.substring(cookieName.length + 1, trimmedCookie.length);
        } 
    }

    return "";
}