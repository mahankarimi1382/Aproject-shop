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

let selectedSize = null;

function renderProduct(product) {
    const titleEl = document.querySelector(".product-title");
    const priceEl = document.querySelector(".product-price");
    const imageEl = document.getElementById("productImage");
    const descEl = document.getElementById("productDescription");
    const detailsEl = document.getElementById("productDetails");
    const sizeOptionsEl = document.getElementById("sizeOptions");

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

    const sizeSelectorGroup = sizeOptionsEl ? sizeOptionsEl.closest('.selector-group') : null;

    if (sizeOptionsEl && product.sizes && product.sizes.length > 0) {
        if (sizeSelectorGroup) sizeSelectorGroup.style.display = "block";

        sizeOptionsEl.innerHTML = product.sizes.map((s, index) => `
            <label>
                <input type="radio" name="size" value="${s.size_name}" ${s.stock === 0 ? 'disabled' : ''} ${selectedSize === s.size_name ? 'checked' : ''}>
                <span class="size-box">${s.size_name}</span>
            </label>
        `).join("");

        // Set initial selectedSize if not set or if current selectedSize is not available for this product
        const availableSize = product.sizes.find(s => s.stock > 0);
        const currentSizeValid = product.sizes.find(s => s.size_name === selectedSize && s.stock > 0);

        if (!currentSizeValid && availableSize) {
            selectedSize = availableSize.size_name;
            const input = sizeOptionsEl.querySelector(`input[value="${selectedSize}"]`);
            if (input) input.checked = true;
        }

        sizeOptionsEl.querySelectorAll('input[name="size"]').forEach(input => {
            input.addEventListener('change', (e) => {
                selectedSize = e.target.value;
                checkProductInCart(product.id);
            });
        });
    } else {
        if (sizeSelectorGroup) sizeSelectorGroup.style.display = "none";
        selectedSize = "Free Size"; // Default fallback if no sizes specified
    }

    document.title = product.name + " | Aproject";
}

function addToCart(productId, qty, size) {
    if (!size) {
        alert("لطفا ابتدا سایز مورد نظر خود را انتخاب کنید.");
        return;
    }
    let cart = getCart();
    const existing = cart.find(item => item.id == productId && item.size == size);

    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({
            id: Number(productId),
            quantity: qty,
            size: size
        });
    }
    saveCart(cart);
}

function updateCartItemQty(productId, qty, size) {
    let cart = getCart();
    const item = cart.find(item => item.id == productId && item.size == size);
    if (item) {
        item.quantity = qty;
        if (item.quantity <= 0) {
            cart = cart.filter(i => !(i.id == productId && i.size == size));
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
        addToCart(productId, qty, selectedSize);
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
                updateCartItemQty(productId, qty, selectedSize);
            } else {
                updateCartItemQty(productId, 0, selectedSize);
            }
        });

        increaseBtn.addEventListener("click", () => {
            let qty = Number(qtyInput.value);
            qty++;
            updateCartItemQty(productId, qty, selectedSize);
        });
    }
}

function checkProductInCart(productId) {
    const cart = getCart();
    const existing = cart.find(item => item.id == productId && item.size == selectedSize);

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
