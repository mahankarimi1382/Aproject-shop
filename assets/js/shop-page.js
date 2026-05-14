document.addEventListener('DOMContentLoaded', () => {
    // انتخاب المان‌های DOM
    const productsContainer = document.getElementById('productsContainer'); 
    const searchInput = document.getElementById('searchInput'); 
    const searchBtn = document.getElementById('searchBtn'); 
    const sortRadios = document.querySelectorAll('input[name="sort"]'); 
    const searchBox = document.querySelector('.search-box'); // برای قرار دادن تگ زیر آن

    // اگر در صفحه‌ای غیر از فروشگاه هستیم، کد اجرا نشود
    if (!productsContainer) return;

    // ایجاد کانتینر برای تگ جستجو و قرار دادن آن دقیقاً زیر باکس جستجو
    const searchBadgeContainer = document.createElement('div');
    searchBadgeContainer.style.marginTop = '10px';
    if (searchBox) {
        searchBox.parentNode.insertBefore(searchBadgeContainer, searchBox.nextSibling);
    }

    // فرمت‌بندی قیمت
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
    };

    // مدیریت تگ جستجو
    const updateSearchBadge = (term) => {
        if (!term) {
            searchBadgeContainer.innerHTML = ''; // اگر کلمه‌ای نبود، تگ پاک شود
            return;
        }
        
        // ساخت تگ با دکمه ضربدر
        searchBadgeContainer.innerHTML = `
            <div style="display: inline-flex; align-items: center; background-color: #f0f0f0; border: 1px solid #ddd; border-radius: 20px; padding: 5px 12px; font-size: 13px; color: #333;">
                <span>نتیجه برای: <strong>${term}</strong></span>
                <button type="button" id="clearSearchBtn" style="background: none; border: none; cursor: pointer; margin-right: 8px; color: #ff4d4d; font-size: 18px; line-height: 1; padding: 0; outline: none;">&times;</button>
            </div>
        `;

        // رویداد کلیک روی دکمه ضربدر تگ
        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            if (searchInput) searchInput.value = ''; // پاک کردن اینپوت
            fetchProducts(); // فراخوانی مجدد محصولات (بدون سرچ)
        });
    };

    // دریافت و نمایش محصولات
    const fetchProducts = async () => {
        // خواندن مقادیر جستجو
        const q = searchInput ? searchInput.value.trim() : '';
        
        // آپدیت کردن تگ جستجو با کلمه جدید (یا پاک کردن آن اگر سرچ خالی است)
        updateSearchBadge(q);
        
        // خواندن مقدار مرتب‌سازی و تبدیل خط تیره به آندرلاین برای هماهنگی با بک‌اند
        const activeSort = document.querySelector('input[name="sort"]:checked');
        let sort = activeSort ? activeSort.value : 'newest';
        sort = sort.replace('-', '_');

        // حالت لودینگ
        productsContainer.innerHTML = '<p class="loading-text" style="text-align:center; width:100%; grid-column: 1/-1;">در حال بارگذاری محصولات...</p>';

        try {
            // ساخت آدرس API
            const apiUrl = new URL('api/shop.php', window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1));
            if (q) apiUrl.searchParams.append('q', q);
            if (sort) apiUrl.searchParams.append('sort', sort);

            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error('خطا در ارتباط با سرور');
            
            const result = await response.json();

            // بررسی موفقیت‌آمیز بودن درخواست
            if (result.success === true) {
                renderProducts(result.data);
            } else {
                productsContainer.innerHTML = `<p class="error-text" style="text-align:center; width:100%; grid-column: 1/-1;">${result.message || 'خطا در دریافت اطلاعات.'}</p>`;
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            productsContainer.innerHTML = '<p class="error-text" style="text-align:center; width:100%; grid-column: 1/-1;">خطایی در بارگذاری محصولات رخ داد.</p>';
        }
    };

    // رندر کردن محصولات در HTML
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

    // Event Listeners (رویدادها)
    
    // ۱. کلیک روی دکمه جستجو
    if (searchBtn) {
        searchBtn.addEventListener('click', fetchProducts);
    }

    // ۲. زدن دکمه Enter در فیلد جستجو
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                fetchProducts();
            }
        });
    }

    // ۳. تغییر رادیو باتن‌های مرتب‌سازی
    sortRadios.forEach(radio => {
        radio.addEventListener('change', fetchProducts);
    });

    // بارگذاری اولیه محصولات
    fetchProducts();
});
