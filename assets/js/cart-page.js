import { getCart, saveCart } from "./cart.js";
import { updateCartCount } from "./main.js";

function formatPrice(price) {
    return Number(price).toLocaleString("fa-IR");
}

async function getProductsByIds(ids) {
    if (!ids.length) return [];

    const query = ids.join(",");
    try {
        const res = await fetch(`api/products-by-id.php?ids=${query}`);
        const data = await res.json();
        if (data.success) return data.data;
    } catch (error) {
        console.error("Error fetching cart products:", error);
    }
    return [];
}

function renderCartItems(products, cart) {
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const subtotalPriceEl = document.getElementById("subtotalPrice");
    const totalPriceEl = document.getElementById("totalPrice");
    const cartItemCountEl = document.getElementById("cartItemCount");

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = "";

    let totalPrice = 0;
    let totalItems = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">سبد خرید شما خالی است.</p>';
        if (cartItemCountEl) cartItemCountEl.textContent = "(۰ آیتم)";
        if (subtotalPriceEl) subtotalPriceEl.textContent = "۰ تومان";
        if (totalPriceEl) totalPriceEl.textContent = "۰ تومان";
        return;
    }

    products.forEach((product) => {
        const itemInCart = cart.find((c) => Number(c.id) === Number(product.id));
        const quantity = itemInCart ? itemInCart.quantity : 0;
        if (quantity === 0) return;

        const itemTotal = product.price * quantity;
        totalPrice += itemTotal;
        totalItems += quantity;

        cartItemsContainer.innerHTML += `
      <div class="cart-item" data-id="${product.id}">
        <div class="item-image">
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="item-details">
          <div>
            <div class="item-brand">A PROJECT</div>
            <div class="item-name">${product.name}</div>
            <div class="item-meta">سایز: ${itemInCart.size || "نامشخص"}</div>
          </div>

          <div class="item-controls">
            <div class="quantity-selector">
              <button class="minus-btn" data-id="${product.id}">-</button>
              <span>${quantity}</span>
              <button class="plus-btn" data-id="${product.id}">+</button>
            </div>
            <div class="item-price">${formatPrice(itemTotal)} تومان</div>
          </div>
        </div>

        <button class="remove-btn" data-id="${product.id}" aria-label="حذف آیتم">
          <svg class="trash-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M6 6l1 14h10l1-14" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    `;
    });

    if (cartItemCountEl) cartItemCountEl.textContent = `(${totalItems} آیتم)`;
    if (subtotalPriceEl) subtotalPriceEl.textContent = `${formatPrice(totalPrice)} تومان`;
    if (totalPriceEl) totalPriceEl.textContent = `${formatPrice(totalPrice)} تومان`;

    attachEventListeners();
}

function attachEventListeners() {
    document.querySelectorAll(".minus-btn").forEach((btn) => {
        btn.addEventListener("click", () => changeQuantity(btn.dataset.id, -1));
    });
    document.querySelectorAll(".plus-btn").forEach((btn) => {
        btn.addEventListener("click", () => changeQuantity(btn.dataset.id, 1));
    });
    document.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => removeItem(btn.dataset.id));
    });
}

function changeQuantity(id, delta) {
    let cart = getCart();
    const item = cart.find((i) => i.id == id);

    if (!item) return;
    item.quantity += delta;
    if (item.quantity < 1) cart = cart.filter((i) => i.id != id);

    saveCart(cart);
    updateCartCount();
    initCartPage();
}

function removeItem(id) {
    let cart = getCart().filter((i) => i.id != id);
    saveCart(cart);
    updateCartCount();
    initCartPage();
}

async function initCartPage() {
    const cart = getCart();
    const ids = cart.map((c) => c.id);
    const products = await getProductsByIds(ids);
    renderCartItems(products, cart);
    setupCheckout(products);
}

function setupCheckout(products) {
    const modal = document.getElementById("checkoutModal");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const closeBtn = document.querySelector(".close-modal");
    const checkoutForm = document.getElementById("checkoutForm");

    if (!checkoutBtn || !modal) return;

    checkoutBtn.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) {
            alert("سبد خرید شما خالی است.");
            return;
        }
        modal.style.display = "block";
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    window.addEventListener("click", (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });

    if (checkoutForm) {
        // Remove existing listener to avoid multiple submissions
        const newForm = checkoutForm.cloneNode(true);
        checkoutForm.parentNode.replaceChild(newForm, checkoutForm);

        newForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const cart = getCart();
            const formData = new FormData(newForm);
            const customerData = {
                fullName: formData.get("fullName"),
                phone: formData.get("phone"),
                address: formData.get("address"),
            };

            const orderData = {
                customer: customerData,
                items: cart.map(item => {
                    const product = products.find(p => p.id == item.id);
                    return {
                        id: item.id,
                        quantity: item.quantity,
                        price: product ? product.price : 0,
                        size: item.size || "نامشخص"
                    };
                }),
                totalPrice: cart.reduce((total, item) => {
                    const product = products.find(p => p.id == item.id);
                    return total + (product ? product.price * item.quantity : 0);
                }, 0)
            };

            try {
                const response = await fetch("api/checkout.php", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                });

                const result = await response.json();

                if (result.success) {
                    alert("سفارش شما با موفقیت ثبت شد.");
                    saveCart([]);
                    updateCartCount();
                    window.location.href = "index.html";
                } else {
                    alert("خطا: " + result.message);
                }
            } catch (error) {
                console.error("Error submitting order:", error);
                alert("خطایی در ثبت سفارش رخ داد.");
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", initCartPage);
