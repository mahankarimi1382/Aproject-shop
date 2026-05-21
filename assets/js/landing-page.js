import { updateCartCount } from "./main.js";

async function loadFeaturedProducts() {
    try {
        const res = await fetch("api/product_featured.php");
        const data = await res.json();

        if (data.success) {
            renderProducts(data.data);
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function formatPrice(price) {
    return Number(price).toLocaleString("fa-IR");
}

function renderProducts(products) {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    grid.innerHTML = products
        .map(
            (product) => `
        <a href="product.html?id=${product.id}"  class="product-card" data-id="${product.id}">

            <div class="product-img-box">
                <img
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                />
            </div>

            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>

                <span class="product-price">
                    ${formatPrice(product.price)} تومان
                </span>

                <button class="add-to-bag" type="button">
                    مشاهده جزییات
                </button>
            </div>

        </a>
    `
        )
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedProducts();
});
