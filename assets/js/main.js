// ===============================
import { getCart } from "./cart.js";

// ===============================
// Fetch Products From API
// ===============================
function updateCartCount() {
  const cart = getCart();
  const bagCount = document.querySelector(".bag-count");

  if (!bagCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  bagCount.textContent = totalItems;
}

async function loadProducts() {
  try {
    const res = await fetch("/shop/api/products.php");
    const data = await res.json();

    if (data.success) {
      renderProducts(data.data);
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// ===============================
// Price Formatter
// ===============================
function formatPrice(price) {
  return Number(price).toLocaleString("fa-IR");
}

// ===============================
// Add To Cart
// ===============================

// برای اینکه در HTML قابل دسترسی باشد

// ===============================
// Render Products
// ===============================
function renderProducts(products) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = products
    .map(
      (product) => `
        <a href="product.html?id=${
          product.id
        }"  class="product-card" data-id="${product.id}">
            
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
                    ${formatPrice(product.price)} T
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
  loadProducts();
  updateCartCount();
});
// ===============================
// Init
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
