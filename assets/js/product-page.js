import { updateCartCount } from "./main.js";
import { getCart, saveCart } from "./cart.js";

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

function formatPrice(price) {
    return Number(price).toLocaleString("fa-IR");
}

async function fetchProduct(id) {
    try {
        const res = await fetch(`api/products-by-id.php?ids=${id}`);
        const data = await res.json();
        if (data.success && data.data.length) {
            return data.data[0];
        }
    } catch (error) {
        console.error("Error fetching product:", error);
    }
    return null;
}

function renderProduct(product) {
    const titleEl = document.querySelector(".product-title");
    const priceEl = document.querySelector(".product-price");
    const imageEl = document.getElementById("productImage");
    const descEl = document.getElementById("productDescription");
    const detailsEl = document.getElementById("productDetails");

    if (titleEl) titleEl.textContent = product.name;
    if (priceEl) priceEl.textContent = formatPrice(product.price) + " تومان";
    if (imageEl) {
        imageEl.src = product.image;
        imageEl.alt = product.name;
    }
    if (descEl) {
        descEl.textContent = product.description || "طراحی شده با الهام از خطوط معماری مدرن. این محصول از مواد با کیفیت برتر دوخته شده است که علاوه بر ایستایی فوق‌العاده، حس لطافت بی‌نظیری را به پوست منتقل می‌کند.";
    }
    if (detailsEl) {
        // Fallback details if product.details is not in DB
        detailsEl.innerHTML = product.details ? product.details : `
            <li>جنس: با کیفیت برتر</li>
            <li>طراحی مدرن و مینیمال</li>
            <li>شستشو با دقت در دمای ۳۰ درجه</li>
            <li>اتوکشی با دمای متوسط</li>
        `;
    }
    document.title = product.name + " | Aproject";
}

function addToCart(productId, qty) {
    let cart = getCart();
    const existing = cart.find(item => item.id == productId);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: Number(productId),
            quantity: qty
        });
    }
    saveCart(cart);
}

function updateCartItemQty(productId, qty) {
    let cart = getCart();
    const item = cart.find(item => item.id == productId);
    if (item) {
        item.quantity = qty;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id != productId);
        }
        saveCart(cart);
        updateCartCount();
        checkProductInCart(productId);
    }
}

function setupAddToCart(productId) {
    const btn = document.getElementById("addToCartBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        const qtyInput = document.getElementById("quantityInput");
        const qty = Number(qtyInput ? qtyInput.value : 1);
        addToCart(productId, qty);
        updateCartCount();
        checkProductInCart(productId);
    });

    const decreaseBtn = document.getElementById("decreaseQty");
    const increaseBtn = document.getElementById("increaseQty");
    const qtyInput = document.getElementById("quantityInput");

    if (decreaseBtn && increaseBtn && qtyInput) {
        decreaseBtn.addEventListener("click", () => {
            let qty = Number(qtyInput.value);
            if (qty > 1) {
                qty--;
                updateCartItemQty(productId, qty);
            } else {
                updateCartItemQty(productId, 0);
            }
        });

        increaseBtn.addEventListener("click", () => {
            let qty = Number(qtyInput.value);
            qty++;
            updateCartItemQty(productId, qty);
        });
    }
}

function checkProductInCart(productId) {
    const cart = getCart();
    const existing = cart.find(item => item.id == productId);

    const qtySelector = document.querySelector(".quantity-selector");
    const addBtn = document.getElementById("addToCartBtn");
    const qtyInput = document.getElementById("quantityInput");

    if (!existing) {
        if (addBtn) addBtn.style.display = "block";
        if (qtySelector) qtySelector.style.display = "none";
        return;
    }

    if (addBtn) addBtn.style.display = "none";
    if (qtySelector) {
        qtySelector.style.display = "flex";
        if (qtyInput) qtyInput.value = existing.quantity;
    }
}

async function initProductPage() {
    const productId = getProductIdFromUrl();
    if (!productId) return;

    const product = await fetchProduct(productId);
    if (!product) {
        const titleEl = document.querySelector(".product-title");
        if (titleEl) titleEl.textContent = "محصول یافت نشد";
        return;
    }

    renderProduct(product);
    checkProductInCart(productId);
    setupAddToCart(productId);
}

document.addEventListener("DOMContentLoaded", initProductPage);
