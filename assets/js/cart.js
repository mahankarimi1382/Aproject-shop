export function getCart() {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
}

export function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}