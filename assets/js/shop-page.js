import { updateCartCount } from "./main.js";

document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer'); 
    const searchInput = document.getElementById('searchInput'); 
    const searchBtn = document.getElementById('searchBtn'); 
    const sortRadios = document.querySelectorAll('input[name="sort"]'); 
    const categoryFilter = document.getElementById('categoryFilter');
    const searchBox = document.querySelector('.search-box');

    if (!productsContainer) return;

    const searchBadgeContainer = document.createElement('div');
    searchBadgeContainer.style.marginTop = '10px';
    if (searchBox) {
        searchBox.parentNode.insertBefore(searchBadgeContainer, searchBox.nextSibling);
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    const updateSearchBadge = (term) => {
        if (!term) {
            searchBadgeContainer.innerHTML = '';
            return;
        }
        
        searchBadgeContainer.innerHTML = `
            <div style="display: inline-flex; align-items: center; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 20px; padding: 5px 12px; font-size: 13px; color: #333;">
                <span>نتیجه برای: <strong>${term}</strong></span>
                <button type="button" id="clearSearchBtn" style="background: none; border: none; cursor: pointer; margin-right: 8px; color: #ff4d4d; font-size: 18px; line-height: 1; padding: 0; outline: none;">&times;</button>
            </div>
        `;

        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            fetchProducts();
        });
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('api/categories.php');
            const data = await res.json();
            if (data.success) {
                renderCategoryFilters(data.data);

                // Check if there is a category_id in URL
                const urlParams = new URLSearchParams(window.location.search);
                const catId = urlParams.get('category_id');
                if (catId) {
                    const radio = document.querySelector(`input[name="category"][value="${catId}"]`);
                    if (radio) {
                        radio.checked = true;
                    }
                }
                fetchProducts();
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const renderCategoryFilters = (categories) => {
        if (!categoryFilter) return;

        const currentSelected = document.querySelector('input[name="category"]:checked')?.value || "0";

        categoryFilter.innerHTML = `
            <li><label><input type="radio" name="category" value="0" ${currentSelected === "0" ? 'checked' : ''}> همه</label></li>
        ` + categories.map(cat => `
            <li><label><input type="radio" name="category" value="${cat.id}" ${currentSelected == cat.id ? 'checked' : ''}> ${cat.name}</label></li>
        `).join("");

        // Re-attach listeners
        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', fetchProducts);
        });
    };

    const fetchProducts = async () => {
        const q = searchInput ? searchInput.value.trim() : '';
        updateSearchBadge(q);
        
        const activeSort = document.querySelector('input[name="sort"]:checked');
        let sort = activeSort ? activeSort.value : 'newest';

        const activeCategory = document.querySelector('input[name="category"]:checked');
        const category_id = activeCategory ? activeCategory.value : '0';

        productsContainer.innerHTML = '<p class="loading-text" style="text-align:center; width:100%; grid-column: 1/-1;">در حال بارگذاری محصولات...</p>';

        try {
            const apiUrl = new URL('api/shop.php', window.location.href);
            if (q) apiUrl.searchParams.append('q', q);
            if (sort) apiUrl.searchParams.append('sort', sort);
            if (category_id !== '0') apiUrl.searchParams.append('category_id', category_id);

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('خطا در ارتباط با سرور');
            
            const result = await response.json();

            if (result.success) {
                renderProducts(result.data);
            } else {
                productsContainer.innerHTML = `<p class="error-text" style="text-align:center; width:100%; grid-column: 1/-1;">${result.message || 'خطا در دریافت اطلاعات.'}</p>`;
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            productsContainer.innerHTML = '<p class="error-text" style="text-align:center; width:100%; grid-column: 1/-1;">خطایی در بارگذاری محصولات رخ داد.</p>';
        }
    };

    const renderProducts = (products) => {
        productsContainer.innerHTML = ''; 

        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products" style="text-align:center; width:100%; grid-column: 1/-1;">محصولی یافت نشد.</p>';
            return;
        }

        products.forEach(product => {
            const imageUrl = product.image ? product.image : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" fill="%23ddd"><rect width="100%" height="100%"/><text x="50%" y="50%" fill="%23999" font-family="sans-serif" font-size="16" text-anchor="middle" dy=".3em">بدون تصویر</text></svg>';

            const productCard = document.createElement('a');
            productCard.href = `product.html?id=${product.id}`;
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                </div>
                <div class="product-info">
                    <h2 class="product-title">${product.name}</h2>
                    <span class="product-price">${formatPrice(product.price)}</span>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', fetchProducts);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchProducts();
            }
        });
    }

    sortRadios.forEach(radio => {
        radio.addEventListener('change', fetchProducts);
    });

    fetchCategories();
});
