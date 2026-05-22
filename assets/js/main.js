import { getCart } from "./cart.js";

export function updateCartCount() {
    const cart = getCart();
    const bagCount = document.querySelectorAll(".bag-count");

    if (bagCount.length === 0) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    bagCount.forEach(el => {
        el.textContent = totalItems;
    });
}

export async function loadCategories() {
    try {
        const res = await fetch("api/categories.php");
        const data = await res.json();
        if (data.success) {
            renderCategories(data.data);
            document.dispatchEvent(new Event("categoriesLoaded"));
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}


function renderCategories(categories) {
    const dropdown = document.getElementById("categories-dropdown");
    if (!dropdown) return;

    dropdown.innerHTML = categories.map(cat => `
        <a href="shop.html?category_id=${cat.id}">${cat.name}</a>
    `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    loadCategories();

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const mainNav = document.querySelector(".main-nav");
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener("click", () => {
            mainNav.classList.toggle("active");
        });
    }
});
