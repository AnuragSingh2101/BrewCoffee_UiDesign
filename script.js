/**
 * Brew & Bloom Coffee Co. - Main Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Cart State ---
    let cart = JSON.parse(localStorage.getItem('brew_bloom_cart')) || [];

    // --- DOM Elements ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.getElementById('primary-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.menu-tab-content');
    const backToTopBtn = document.querySelector('.back-to-top');

    // Cart Elements
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountBadge = document.getElementById('cart-count');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTaxEl = document.getElementById('cart-tax');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Lightbox Elements
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeLightboxBtn = document.getElementById('close-lightbox');

    // Toast Container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // --- Toast Notification Helper ---
    function showToast(message, title = 'Brew & Bloom', icon = '☕') {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <h4 class="toast-title">${title}</h4>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3.5 seconds
        const timer = setTimeout(() => {
            removeToast(toast);
        }, 3500);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            removeToast(toast);
        });
    }

    function removeToast(toast) {
        toast.classList.add('toast-hiding');
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // --- Navigation & Mobile Menu ---
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
            navToggle.setAttribute('aria-expanded', !expanded);
            navMenu.classList.toggle('nav-menu-open');
        });

        // Close mobile menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('nav-menu-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Scroll Spy Navigation ---
    const sections = document.querySelectorAll('section[id], header[id]');

    function highlightNavOnScroll() {
        const scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');
            const correspondingNavLink = document.querySelector(`.nav-menu a[href*=${sectionId}]`);

            if (correspondingNavLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    correspondingNavLink.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', highlightNavOnScroll);

    // --- Menu Tab Functionality ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(`${btn.getAttribute('data-tab')}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // --- Back to Top Button ---
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show-back-to-top');
            } else {
                backToTopBtn.classList.remove('show-back-to-top');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Cart Functions ---
    function saveCart() {
        localStorage.setItem('brew_bloom_cart', JSON.stringify(cart));
        renderCart();
    }

    function renderCart() {
        if (!cartItemsContainer) return;

        // Calculate total count
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountBadge) {
            cartCountBadge.textContent = totalItemsCount;
            cartCountBadge.style.display = totalItemsCount > 0 ? 'flex' : 'none';
        }

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <p>Your cart is empty</p>
                    <a href="#menu" class="btn btn-primary btn-sm" id="empty-cart-explore">Explore Menu</a>
                </div>
            `;
            const exploreBtn = document.getElementById('empty-cart-explore');
            if (exploreBtn) {
                exploreBtn.addEventListener('click', () => toggleCartDrawer(false));
            }
            if (cartSubtotalEl) cartSubtotalEl.textContent = '$0.00';
            if (cartTaxEl) cartTaxEl.textContent = '$0.00';
            if (cartTotalEl) cartTotalEl.textContent = '$0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;

        let subtotal = 0;
        cartItemsContainer.innerHTML = '';

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-qty-controls">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span class="qty-count">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" data-id="${item.id}" aria-label="Remove item">&times;</button>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });

        const tax = subtotal * 0.08; // 8% estimated sales tax
        const grandTotal = subtotal + tax;

        if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (cartTaxEl) cartTaxEl.textContent = `$${tax.toFixed(2)}`;
        if (cartTotalEl) cartTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

        // Attach listeners to dynamic cart item buttons
        cartItemsContainer.querySelectorAll('.qty-btn.minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                updateItemQuantity(id, -1);
            });
        });

        cartItemsContainer.querySelectorAll('.qty-btn.plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                updateItemQuantity(id, 1);
            });
        });

        cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeItemFromCart(id);
            });
        });
    }

    function addToCart(item) {
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        saveCart();
        showToast(`Added <strong>${item.title}</strong> to your order!`, 'Order Updated', '🛒');
    }

    function updateItemQuantity(id, delta) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
        }
    }

    function removeItemFromCart(id) {
        const item = cart.find(i => i.id === id);
        if (item) {
            cart = cart.filter(i => i.id !== id);
            saveCart();
            showToast(`Removed <strong>${item.title}</strong> from cart.`, 'Item Removed', '🗑️');
        }
    }

    function toggleCartDrawer(open) {
        if (!cartDrawer || !cartOverlay) return;
        if (open) {
            cartDrawer.classList.add('open');
            cartOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        } else {
            cartDrawer.classList.remove('open');
            cartOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', () => toggleCartDrawer(true));
    }
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
    }
    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => toggleCartDrawer(false));
    }

    // Attach "Add to Cart" handlers on menu item buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.menu-item-card');
            if (!card) return;

            const id = card.getAttribute('data-id') || card.querySelector('.menu-item-title').textContent.toLowerCase().replace(/\s+/g, '-');
            const title = card.querySelector('.menu-item-title').textContent.trim();
            const rawPrice = card.querySelector('.menu-item-price').textContent;
            // Parse numerical price (e.g. "$4.75" -> 4.75, "$4.50 - $5.50" -> 4.50)
            const matchPrice = rawPrice.match(/\$?\s*([\d.]+)/);
            const price = matchPrice ? parseFloat(matchPrice[1]) : 4.50;
            const image = card.querySelector('.menu-item-img')?.src || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80';

            addToCart({ id, title, price, image });
        });
    });

    // Checkout button logic
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;

            showToast('Thank you! Your order has been placed successfully.', 'Order Placed!', '🎉');
            cart = [];
            saveCart();
            toggleCartDrawer(false);
        });
    }

    // Initial render of cart
    renderCart();

    // --- Gallery Lightbox ---
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.getAttribute('data-caption') || item.querySelector('.gallery-overlay-title')?.textContent || 'Brew & Bloom Coffee Co.';

            if (img && lightboxModal && lightboxImg) {
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt || 'Brew & Bloom Gallery Image';
                if (lightboxCaption) lightboxCaption.textContent = caption;

                lightboxModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    function closeLightbox() {
        if (lightboxModal) {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }

    // Keydown ESC listener for closing modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            toggleCartDrawer(false);
        }
    });

    // --- Newsletter & Contact Forms ---
    const newsletterForms = document.querySelectorAll('.newsletter-form, .footer-newsletter-form');
    newsletterForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            if (input && input.value) {
                showToast(`Thank you for subscribing with <strong>${input.value}</strong>!`, 'Welcome to Brew & Bloom', '💌');
                input.value = '';
            }
        });
    });

    // --- Book Table / Quick Order Modal Trigger (if present) ---
    const reserveBtns = document.querySelectorAll('.reserve-table-btn');
    reserveBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Table reservation feature coming soon! You can call us directly at (555) 123-4567.', 'Reserve a Table', '📅');
        });
    });
});
