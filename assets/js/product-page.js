import { getCart, saveCart } from "./cart.js";

function updateCartCount() {
  const cart = getCart();
  const bagCount = document.querySelector(".cart-count");

  if (!bagCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  bagCount.textContent = totalItems;
}
// گرفتن id از URL
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}


// فرمت قیمت
function formatPrice(price) {
  return Number(price).toLocaleString("fa-IR");
}


// گرفتن محصول از API
async function fetchProduct(id) {
  const res = await fetch(`/shop/api/products-by-id.php?ids=${id}`);
  const data = await res.json();

  if (data.success && data.data.length) {
    return data.data[0];
  }

  return null;
}


// نمایش اطلاعات محصول در صفحه
function renderProduct(product) {

  document.querySelector(".product-title").textContent = product.name;

  document.querySelector(".product-price").textContent =
    formatPrice(product.price) + " تومان";

  document.title = product.name + " | Aproject";

  const mainImage = document.querySelector(".main-image");

  mainImage.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
  `;
}


// افزودن به سبد
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


// دکمه افزودن به سبد
function setupAddToCart(productId) {

  const btn = document.querySelector(".add-to-cart-btn");

  btn.addEventListener("click", () => {

    const qty = Number(
      document.querySelector(".quantity-selector input").value
    );

    addToCart(productId, qty);
    updateCartCount()
    checkProductInCart(productId)
  });

}


// لود صفحه
async function initProductPage() {

  const productId = getProductIdFromUrl();
  if (!productId) return;

  const product = await fetchProduct(productId);
  if (!product) return;

  renderProduct(product);

  checkProductInCart(productId); // ✅ این خط اضافه شود

  setupAddToCart(productId);

}


function checkProductInCart(productId) {
  const cart = getCart();

  const existing = cart.find(item => item.id == productId);

  const qtySelector = document.querySelector(".quantity-selector");
  const addBtn = document.querySelector(".add-to-cart-btn");

  if (!existing) {
    qtySelector.style.display = "none";
    return;
  }

  // اگر محصول در سبد بود
  addBtn.style.display = "none";

  qtySelector.style.display = "flex";

  qtySelector.querySelector("input").value = existing.quantity;
}

document.addEventListener("DOMContentLoaded", initProductPage);
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});