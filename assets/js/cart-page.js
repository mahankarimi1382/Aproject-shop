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

  attachEventListeners(products);
}


// ========================================
// کنترل دکمه‌ها برای افزایش/کاهش/حذف آیتم
function attachEventListeners(products) {
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
  setupCheckout(products);
}

// ========================================
// مدیریت مودال و فرم پرداخت
function setupCheckout(products) {
  const modal = document.getElementById("checkoutModal");
  const checkoutBtn = document.querySelector(".checkout-btn");
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

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });

  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cart = getCart();
    const formData = new FormData(checkoutForm);
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
        saveCart([]); // خالی کردن سبد خرید
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


// اجرا هنگام لود صفحه
document.addEventListener("DOMContentLoaded", initCartPage);
