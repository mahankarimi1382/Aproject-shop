import { getCart, saveCart } from "./cart.js";


// ========================================
// فرمت عدد قیمت به فارسی
function formatPrice(price) {
  return price.toLocaleString("fa-IR");
}


// ========================================
// گرفتن داده‌های محصولات از API
async function getProductsByIds(ids) {
  if (!ids.length) return [];

  const query = ids.join(",");
  const res = await fetch(`/shop/api/products-by-id.php?ids=${query}`);
  const data = await res.json();

  if (data.success) return data.data;
  return [];
}


// ========================================
// رندر کردن آیتم‌های سبد خرید
function renderCartItems(products, cart) {
  const cartItemsContainer = document.querySelector(".cart-items");
  const summaryRows = document.querySelectorAll(".summary-row span");
  const summaryTotal = document.querySelector(".summary-total span:last-child");
  const pageTitle = document.querySelector(".page-title span");

  if (!cartItemsContainer) return;
  cartItemsContainer.innerHTML = "";

  let totalPrice = 0;
  let totalItems = 0;

  products.forEach((product) => {
    const itemInCart = cart.find((c) => c.id === product.id);
    const quantity = itemInCart ? itemInCart.quantity : 1;
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
            <div class="item-brand">APROJECT</div>
            <div class="item-name">${product.name}</div>
            <div class="item-meta">رنگ: نامشخص</div>
            <div class="item-meta">سایز: نامشخص</div>
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
  <svg class="trash-icon" viewBox="0 0 24 24">
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

  // به‌روزرسانی خلاصه سفارش بالا
  pageTitle.textContent = `(${totalItems} آیتم)`;
  summaryRows[0].textContent = `مبلغ کالاها (${totalItems} آیتم)`;
  summaryRows[1].textContent = "رایگان"; // بسته‌بندی
  summaryRows[2].textContent = "وابسته به آدرس"; // ارسال
  summaryTotal.textContent = `${formatPrice(totalPrice)} تومان`;

  attachEventListeners();
}


// ========================================
// کنترل دکمه‌ها برای افزایش/کاهش/حذف آیتم
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


// ========================================
// تغییر تعداد آیتم
function changeQuantity(id, delta) {
  let cart = getCart();
  const item = cart.find((i) => i.id == id);

  if (!item) return;
  item.quantity += delta;
  if (item.quantity < 1) cart = cart.filter((i) => i.id != id);

  saveCart(cart);
  initCartPage(); // رفرش کامل
}


// ========================================
// حذف آیتم
function removeItem(id) {
  let cart = getCart().filter((i) => i.id != id);
  saveCart(cart);
  initCartPage();
}


// ========================================
// مقداردهی اولیه صفحه
async function initCartPage() {
  const cart = getCart();
  const ids = cart.map((c) => c.id);
  const products = await getProductsByIds(ids);
  renderCartItems(products, cart);
}


// اجرا هنگام لود صفحه
document.addEventListener("DOMContentLoaded", initCartPage);
