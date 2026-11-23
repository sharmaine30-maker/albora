(() => {
    const catalog = {
        jewelry: [
            {
                name: 'Demo Necklace',
                description: 'Demo item only; not for sale. Use this entry to test product options and pricing.',
                price: 100,
                category: 'jewelry',
                shopFor: 'men',
                type: 'necklace',
                metal: 'gold',
                sales: 0,
                isDemo: true
            }
        ],
        perfume: [
            {
                name: 'Demo Perfume',
                description: 'Demo item only; not for sale. Use this entry to test product options and pricing.',
                price: 100,
                pricePrefix: 'From ',
                category: 'perfume',
                shopFor: 'men',
                sales: 0,
                isDemo: true
            }
        ]
    };

    const pageCategory = document.body.dataset.categoryPage;
    const products = catalog[pageCategory];
    if (!products) {
        console.error(`Unsupported men's product category: ${pageCategory}`);
        return;
    }

    const productGrid = document.getElementById('productGrid');
    const modal = document.getElementById('productDetailsModal');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartContainer = document.getElementById('cartItemsContainer');
    const sortSelect = document.getElementById('sortSelect');
    const mainFilters = document.getElementById('mainFilters');
    const searchInput = document.getElementById('searchInput');
    const packagingInputs = Array.from(document.querySelectorAll('input[name="giftPackaging"]'));

    let cart = loadCart();
    let selectedProduct = null;
    let modalQuantity = 1;
    let modalBasePrice = 0;
    let selectedFinish = '';
    let selectedNecklaceLength = '';
    let selectedRingSize = '';
    let selectedPerfumeSize = '';
    let previousBodyOverflow = '';
    let currentCategory = 'all';
    let currentType = 'all-types';
    let currentMetal = 'all-metals';
    let mobileFiltersOpen = true;
    let toastTimer;

    function loadCart() {
        return window.alboraCartStorage.load();
    }

    function formatPrice(price) {
        return `₱${Number(price || 0).toLocaleString()}`;
    }

    function normalizeSearch(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase();
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function makeCard(product) {
        const card = createElement('a', 'product-card');
        card.href = '#';
        card.dataset.category = product.category;
        card.dataset.shopfor = product.shopFor;
        if (product.description) card.dataset.description = product.description;
        if (product.type) card.dataset.type = product.type;
        if (product.metal) card.dataset.metal = product.metal;

        const art = createElement('div', 'product-art');
        art.setAttribute('aria-hidden', 'true');
        card.appendChild(art);

        if (product.isDemo) {
            card.appendChild(createElement('span', 'new-pill', 'DEMO ONLY'));
        } else if (product.saleLabel) {
            card.appendChild(createElement('span', 'sale-pill', product.saleLabel));
        }

        const info = createElement('div', 'product-info');
        info.appendChild(createElement('h2', 'product-name', product.name));

        const price = createElement('div', 'product-price');
        price.appendChild(document.createTextNode(
            `${product.pricePrefix || ''}${formatPrice(product.price)}`
        ));
        if (product.compareAt) {
            price.appendChild(createElement('s', '', formatPrice(product.compareAt)));
        }
        info.appendChild(price);

        if (product.rating || product.sales || product.stock) {
            const meta = createElement('div', 'product-meta');
            if (product.rating || product.sales) {
                const popularity = [
                    product.rating ? `★ ${product.rating}` : '',
                    product.sales ? `${formatSales(product.sales)} sold` : ''
                ].filter(Boolean).join(' · ');
                meta.appendChild(createElement('span', '', popularity));
            }
            if (product.stock) meta.appendChild(createElement('span', 'stock-good', product.stock));
            info.appendChild(meta);
        }

        const quickAdd = createElement('button', 'quick-add', '+');
        quickAdd.type = 'button';
        quickAdd.setAttribute('aria-label', `Quick add ${product.name} to bag`);
        info.appendChild(quickAdd);
        card.appendChild(info);

        card.addEventListener('click', event => {
            event.preventDefault();
            if (event.target.closest('.quick-add')) return;
            openProductModal(product);
        });
        quickAdd.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            quickAddProduct(product, quickAdd);
        });

        return card;
    }

    function formatSales(sales) {
        return sales >= 1000
            ? `${(sales / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`
            : String(sales);
    }

    products.forEach(product => productGrid.appendChild(makeCard(product)));
    const productCards = Array.from(productGrid.querySelectorAll('.product-card'));
    const originalOrder = new Map(productCards.map((card, index) => [card, index]));

    function getProductPrice(product) {
        return product.price;
    }

    function sortProducts() {
        const mode = sortSelect.value;
        const sorted = products.slice();
        sorted.sort((a, b) => {
            if (mode === 'price-low-high') {
                return getProductPrice(a) - getProductPrice(b) ||
                    originalOrder.get(productCards[products.indexOf(a)]) -
                    originalOrder.get(productCards[products.indexOf(b)]);
            }
            if (mode === 'price-high-low') {
                return getProductPrice(b) - getProductPrice(a) ||
                    originalOrder.get(productCards[products.indexOf(a)]) -
                    originalOrder.get(productCards[products.indexOf(b)]);
            }
            if (mode === 'newest') {
                return Number(Boolean(b.newest)) - Number(Boolean(a.newest)) ||
                    originalOrder.get(productCards[products.indexOf(a)]) -
                    originalOrder.get(productCards[products.indexOf(b)]);
            }
            return b.sales - a.sales ||
                originalOrder.get(productCards[products.indexOf(a)]) -
                originalOrder.get(productCards[products.indexOf(b)]);
        });

        const fragment = document.createDocumentFragment();
        sorted.forEach(product => fragment.appendChild(productCards[products.indexOf(product)]));
        productGrid.appendChild(fragment);
    }

    function updateVisibility() {
        const searchTerm = normalizeSearch(searchInput ? searchInput.value.trim() : '');
        productCards.forEach((card, index) => {
            const product = products[index];
            let visible = currentCategory === 'all' || product.category === currentCategory;

            if (visible && pageCategory === 'jewelry') {
                if (currentType !== 'all-types' && product.type !== currentType) visible = false;
                if (currentMetal !== 'all-metals' && product.metal !== currentMetal) visible = false;
            }

            if (visible && pageCategory === 'perfume' && searchTerm) {
                const searchable = normalizeSearch(
                    `${product.name} ${product.description} ${product.searchTerms || ''}`
                );
                visible = searchable.includes(searchTerm);
            }
            card.hidden = !visible;
        });

        let emptyState = productGrid.querySelector('.empty-results');
        const hasResults = productCards.some(card => !card.hidden);
        if (!hasResults && !emptyState) {
            emptyState = createElement('p', 'empty-results', 'No products match your filters.');
            productGrid.appendChild(emptyState);
        } else if (hasResults && emptyState) {
            emptyState.remove();
        }
    }

    sortSelect.addEventListener('change', () => {
        sortProducts();
        updateVisibility();
    });

    mainFilters.addEventListener('click', event => {
        const chip = event.target.closest('.chip');
        if (!chip) return;
        mainFilters.querySelectorAll('.chip').forEach(button => button.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.dataset.filter;
        if (pageCategory === 'jewelry') {
            currentType = 'all-types';
            currentMetal = 'all-metals';
            document.querySelectorAll('.sub-chip').forEach(button => button.classList.remove('active'));
            document.querySelector('[data-type="all-types"]').classList.add('active');
            document.querySelector('[data-metal="all-metals"]').classList.add('active');
        }
        updateVisibility();
    });

    document.querySelectorAll('.sub-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.closest('.filter-chips').querySelectorAll('.sub-chip')
                .forEach(button => button.classList.remove('active'));
            chip.classList.add('active');
            if (chip.dataset.type) currentType = chip.dataset.type;
            if (chip.dataset.metal) currentMetal = chip.dataset.metal;
            updateVisibility();
        });
    });

    if (searchInput) searchInput.addEventListener('input', updateVisibility);

    document.getElementById('toggleFiltersButton').addEventListener('click', event => {
        mobileFiltersOpen = !mobileFiltersOpen;
        const filters = document.querySelector('.sub-filter-bar');
        filters.classList.toggle('mobile-collapsed', !mobileFiltersOpen);
        event.currentTarget.setAttribute('aria-expanded', String(mobileFiltersOpen));
    });

    function setSelectedOption(group, button) {
        group.querySelectorAll('.product-option-button').forEach(option => {
            const selected = option === button;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', String(selected));
        });
    }

    function getPricing() {
        const packaging = document.querySelector('input[name="giftPackaging"]:checked');
        const packagingPrice = Number(packaging?.dataset.price) || 0;
        const perfumeBoxPrice =
            selectedProduct?.category === 'perfume' &&
            selectedPerfumeSize === '10ml' &&
            document.getElementById('addPerfumeBoxCheckbox').checked
                ? 15
                : 0;
        const jewelryBoxPrice =
            selectedProduct?.category === 'jewelry' &&
            document.getElementById('jewelryBoxGroup').hidden === false &&
            document.getElementById('jewelryBoxCheckbox').checked
                ? 80
                : 0;
        return {
            packagingPrice,
            perfumeBoxPrice,
            jewelryBoxPrice,
            unitPrice: modalBasePrice + packagingPrice + perfumeBoxPrice + jewelryBoxPrice
        };
    }

    function updateDisplayedPrice() {
        if (!selectedProduct) return;
        const pricing = getPricing();
        const price = document.getElementById('productModalPrice');
        price.replaceChildren(document.createTextNode(
            `${selectedProduct.pricePrefix || ''}${formatPrice(pricing.unitPrice)}`
        ));
        if (selectedProduct.compareAt) {
            price.appendChild(createElement('s', '', formatPrice(selectedProduct.compareAt)));
        }

        const perfumeTotal = document.getElementById('productModalOptionTotal');
        const jewelryTotal = document.getElementById('jewelryModalOptionTotal');
        if (selectedProduct.category === 'perfume') {
            perfumeTotal.textContent = `Selected total: ${formatPrice(pricing.unitPrice)}`;
        }
        if (selectedProduct.category === 'jewelry' && !document.getElementById('jewelryBoxGroup').hidden) {
            jewelryTotal.textContent = `Selected total: ${formatPrice(pricing.unitPrice)}`;
        }
    }

    function updateModalActionState() {
        let valid = Boolean(selectedProduct);
        if (selectedProduct?.category === 'perfume') valid = valid && Boolean(selectedPerfumeSize);
        if (selectedProduct?.category === 'jewelry') {
            if (selectedProduct.type === 'necklace') valid = valid && Boolean(selectedNecklaceLength);
            else if (selectedProduct.type === 'ring') valid = valid && Boolean(selectedRingSize);
            else valid = valid && Boolean(selectedFinish);
        }
        document.getElementById('productModalAdd').disabled = !valid;
        document.getElementById('productModalBuy').disabled = !valid;
    }

    function resetCustomizations() {
        selectedFinish = '';
        selectedNecklaceLength = '';
        selectedRingSize = '';
        selectedPerfumeSize = '';
        modalQuantity = 1;
        document.getElementById('productQuantity').textContent = '1';

        ['jewelryFinishGroup', 'necklaceLengthGroup', 'ringSizeGroup', 'perfumeOptionsGroup', 'jewelryBoxGroup']
            .forEach(id => { document.getElementById(id).hidden = true; });
        document.getElementById('jewelryBoxCheckbox').checked = false;
        document.getElementById('jewelryModalOptionTotal').textContent = '';
        const perfumeBox = document.getElementById('addPerfumeBoxCheckbox');
        perfumeBox.checked = false;
        perfumeBox.disabled = false;
        document.querySelector('#addPerfumeBoxOption span').textContent = 'Add 10 ml Box (+₱15)';
        document.getElementById('perfumeBoxNote').textContent =
            'Optional for 10 ml (+₱15); included free with 30 ml and 50 ml.';
        document.getElementById('productModalOptionTotal').textContent = '';

        document.querySelectorAll('.product-option-button').forEach(button => {
            button.classList.remove('selected');
            button.setAttribute('aria-pressed', 'false');
        });

        packagingInputs.forEach(input => {
            input.checked = input.value === 'none';
            input.closest('.product-packaging-option').classList.toggle('is-selected', input.checked);
        });
    }

    function configureProductOptions(product) {
        resetCustomizations();

        if (product.category === 'jewelry') {
            const boxLabels = {
                necklace: 'Add Necklace Box',
                ring: 'Add Ring Box',
                earrings: 'Add Earrings Box',
                bracelet: 'Add Bracelet Box'
            };
            const jewelryBoxGroup = document.getElementById('jewelryBoxGroup');
            const label = boxLabels[product.type];

            if (product.type === 'necklace') {
                const group = document.getElementById('necklaceLengthGroup');
                group.hidden = false;
                const button = group.querySelector('[data-necklace-length="18 in"]');
                setSelectedOption(group, button);
                selectedNecklaceLength = '18 in';
            } else if (product.type === 'ring') {
                document.getElementById('ringSizeGroup').hidden = false;
            } else {
                const group = document.getElementById('jewelryFinishGroup');
                group.hidden = false;
                const finish = product.metal || 'gold';
                const button = group.querySelector(`[data-finish="${finish}"]`);
                setSelectedOption(group, button);
                selectedFinish = finish;
            }

            if (label) {
                jewelryBoxGroup.hidden = false;
                document.getElementById('jewelryBoxLabel').textContent = label;
            }
        } else {
            document.getElementById('perfumeOptionsGroup').hidden = false;
        }

        updateDisplayedPrice();
        updateModalActionState();
    }

    function openProductModal(product) {
        selectedProduct = product;
        modalBasePrice = product.price;
        document.getElementById('productModalCategory').textContent =
            product.category === 'jewelry' ? 'Jewelry' : 'Perfume';
        document.getElementById('productModalTitle').textContent = product.name;
        document.getElementById('productModalDescription').textContent = product.description;
        document.getElementById('productModalMeta').textContent = product.isDemo
            ? 'DEMO ONLY — NOT FOR SALE'
            : `★ ${product.rating || '4.8'} · ${formatSales(product.sales)} sold`;
        document.getElementById('productModalStock').textContent = product.isDemo
            ? 'Demo entry; not for sale.'
            : product.stock;
        document.getElementById('productModalImage').innerHTML =
            '<div class="product-modal-placeholder" role="img" aria-label="Product image placeholder">IMAGE PLACEHOLDER</div>';
        configureProductOptions(product);
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.getElementById('closeProductModal').focus();
    }

    function closeProductModal() {
        if (!modal.classList.contains('open')) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = previousBodyOverflow;
        selectedProduct = null;
    }

    function addSelectedProductToCart(redirectAfterLogin = 'home') {
        if (!selectedProduct || document.getElementById('productModalAdd').disabled) return false;
        const pricing = getPricing();
        const customizations = {};
        const additionalCharges = [];

        if (selectedProduct.category === 'jewelry') {
            if (selectedProduct.type === 'necklace') customizations.necklaceLength = selectedNecklaceLength;
            else if (selectedProduct.type === 'ring') customizations.ringSize = selectedRingSize;
            else customizations.finish = selectedFinish;
            if (document.getElementById('jewelryBoxCheckbox').checked) {
                const boxLabel = document.getElementById('jewelryBoxLabel').textContent;
                customizations.jewelryBox = boxLabel;
                additionalCharges.push({ label: boxLabel, amount: pricing.jewelryBoxPrice });
            }
        } else {
            customizations.perfumeSize = `${selectedPerfumeSize.slice(0, -2)} ml`;
            customizations.perfumeBox = document.getElementById('addPerfumeBoxCheckbox').checked
                ? (selectedPerfumeSize === '10ml' ? 'paid' : 'included')
                : 'none';
            if (pricing.perfumeBoxPrice) {
                additionalCharges.push({ label: 'Add 10 ml Box', amount: pricing.perfumeBoxPrice });
            }
        }

        const packaging = document.querySelector('input[name="giftPackaging"]:checked');
        if (packaging) {
            customizations.giftPackaging = packaging.value;
            customizations.giftPackagingLabel = packaging.dataset.label;
            if (pricing.packagingPrice) {
                additionalCharges.push({
                    label: packaging.dataset.label,
                    amount: pricing.packagingPrice
                });
            }
        }

        return addToCart(selectedProduct, pricing, customizations, additionalCharges, redirectAfterLogin);
    }

    function quickAddProduct(product, button) {
        if (button.dataset.quickAddPending === 'true') return;
        button.dataset.quickAddPending = 'true';
        window.setTimeout(() => {
            delete button.dataset.quickAddPending;
        }, 350);

        selectedProduct = product;
        modalBasePrice = product.price;
        configureProductOptions(product);

        if (product.category === 'perfume') {
            perfumeGroup.querySelector('[data-perfume-size="10ml"]').click();
        } else if (product.type === 'ring') {
            ringGroup.querySelector('[data-ring-size="6"]').click();
        }

        addSelectedProductToCart();
        selectedProduct = null;
    }

    function addToCart(product, pricing, customizations, additionalCharges, redirectAfterLogin = 'home') {
        const cartItem = {
            name: product.name,
            price: pricing.unitPrice,
            basePrice: product.price,
            category: product.category,
            image: '',
            qty: modalQuantity,
            customizations,
            additionalCharges
        };
        if (window.alboraQueuePendingItem(cartItem, redirectAfterLogin)) return false;

        const existing = cart.find(item =>
            item.name === product.name &&
            (item.category || 'general') === product.category &&
            Number(item.price) === pricing.unitPrice &&
            JSON.stringify(item.customizations || {}) === JSON.stringify(customizations)
        );
        if (existing) {
            existing.qty = (Number(existing.qty) || 0) + modalQuantity;
        } else {
            cart.push(cartItem);
        }
        saveCart();
        showToast(product.name);
        return true;
    }

    function saveCart() {
        window.alboraCartStorage.save(cart);
        updateBagBadge();
        renderCart();
    }

    function updateBagBadge() {
        const quantity = cart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
        document.getElementById('headerCartCount').textContent = String(quantity);
    }

    function getCustomizationLabels(item) {
        const options = item.customizations && typeof item.customizations === 'object'
            ? item.customizations
            : {};
        const labels = [];
        if (item.details) labels.push(`Gift details: ${item.details}`);
        if (options.finish) labels.push(`Finish: ${options.finish[0].toUpperCase()}${options.finish.slice(1)}`);
        if (options.necklaceLength) labels.push(`Length: ${options.necklaceLength}`);
        if (options.ringSize) labels.push(`Ring Size: ${options.ringSize}`);
        if (options.jewelryBox) labels.push(options.jewelryBox);
        if (options.perfumeSize) labels.push(`Size: ${options.perfumeSize}`);
        if (options.perfumeBox === 'paid') labels.push('Add 10 ml Box (+₱15)');
        if (options.perfumeBox === 'included') labels.push('Box included (free)');
        if (options.perfumeBox === 'none') labels.push('No box selected');
        if (options.giftPackaging) {
            labels.push(`Packaging: ${options.giftPackagingLabel || options.giftPackaging}`);
        }
        return labels;
    }

    function renderCart() {
        cartContainer.replaceChildren();
        if (cart.length === 0) {
            cartContainer.appendChild(createElement('p', 'empty-results', 'Your bag is empty.'));
            document.getElementById('cartSubtotal').textContent = '₱0';
            return;
        }

        let subtotal = 0;
        cart.forEach((item, index) => {
            const quantity = Number(item.qty) || 1;
            const unitPrice = Number(item.price) || 0;
            subtotal += unitPrice * quantity;

            const row = createElement('div', 'cart-item');
            row.appendChild(createElement('div', 'cart-item-image', 'IMAGE PLACEHOLDER'));

            const info = createElement('div', 'cart-item-info');
            info.appendChild(createElement('h3', '', item.name));
            info.appendChild(createElement('p', 'cart-item-category', item.category || 'Item'));
            getCustomizationLabels(item).forEach(label =>
                info.appendChild(createElement('p', 'cart-item-detail', label))
            );
            (Array.isArray(item.additionalCharges) ? item.additionalCharges : [])
                .filter(charge => Number(charge.amount) > 0)
                .forEach(charge => info.appendChild(createElement(
                    'p',
                    'cart-item-charge',
                    `${charge.label} · ${formatPrice(charge.amount)} each`
                )));

            const quantityControl = createElement('div', 'cart-quantity');
            const decrement = createElement('button', '', '−');
            decrement.type = 'button';
            decrement.setAttribute('aria-label', `Decrease ${item.name} quantity`);
            decrement.addEventListener('click', () => changeCartQuantity(index, -1));
            const quantityText = createElement('span', '', String(quantity));
            const increment = createElement('button', '', '+');
            increment.type = 'button';
            increment.setAttribute('aria-label', `Increase ${item.name} quantity`);
            increment.addEventListener('click', () => changeCartQuantity(index, 1));
            quantityControl.append(decrement, quantityText, increment);
            info.appendChild(quantityControl);

            const remove = createElement('button', 'remove-btn', 'Remove');
            remove.type = 'button';
            remove.addEventListener('click', () => removeCartItem(index));
            info.appendChild(remove);

            row.append(info, createElement('div', 'cart-item-price', formatPrice(unitPrice * quantity)));
            cartContainer.appendChild(row);
        });
        document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
    }

    function changeCartQuantity(index, change) {
        if (!cart[index]) return;
        cart[index].qty = (Number(cart[index].qty) || 0) + change;
        if (cart[index].qty <= 0) cart.splice(index, 1);
        saveCart();
    }

    function removeCartItem(index) {
        cart.splice(index, 1);
        saveCart();
    }

    function showToast(productName) {
        const toast = document.getElementById('toastNotification');
        toast.textContent = `"${productName}" Added to Bag`;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function openCart() {
        cartDrawer.classList.add('open');
        cartDrawer.setAttribute('aria-hidden', 'false');
        cartOverlay.classList.add('active');
        renderCart();
        document.getElementById('closeCartButton').focus();
    }

    function closeCart() {
        cartDrawer.classList.remove('open');
        cartDrawer.setAttribute('aria-hidden', 'true');
        cartOverlay.classList.remove('active');
    }

    function proceedToCheckout() {
        if (cart.length === 0) {
            window.alert('Your bag is empty!');
            return;
        }
        if (!window.alboraIsLoggedIn()) {
            window.location.href = 'login.html?redirect=checkout';
            return;
        }
        window.location.href = 'checkout.html';
    }

    document.getElementById('openCartButton').addEventListener('click', event => {
        event.preventDefault();
        openCart();
    });
    document.getElementById('closeCartButton').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    document.getElementById('checkoutButton').addEventListener('click', proceedToCheckout);
    document.getElementById('toggleMenuButton').addEventListener('click', event => {
        const menu = document.getElementById('mobileMenu');
        const isOpen = menu.classList.toggle('active');
        event.currentTarget.setAttribute('aria-expanded', String(isOpen));
    });

    const finishGroup = document.getElementById('jewelryFinishGroup');
    const necklaceGroup = document.getElementById('necklaceLengthGroup');
    const ringGroup = document.getElementById('ringSizeGroup');
    const perfumeGroup = document.getElementById('perfumeOptionsGroup');

    finishGroup.addEventListener('click', event => {
        const button = event.target.closest('[data-finish]');
        if (!button) return;
        setSelectedOption(finishGroup, button);
        selectedFinish = button.dataset.finish;
        updateDisplayedPrice();
        updateModalActionState();
    });

    necklaceGroup.addEventListener('click', event => {
        const button = event.target.closest('[data-necklace-length]');
        if (!button) return;
        setSelectedOption(necklaceGroup, button);
        selectedNecklaceLength = button.dataset.necklaceLength;
        updateDisplayedPrice();
        updateModalActionState();
    });

    ringGroup.addEventListener('click', event => {
        const button = event.target.closest('[data-ring-size]');
        if (!button) return;
        setSelectedOption(ringGroup, button);
        selectedRingSize = button.dataset.ringSize;
        updateDisplayedPrice();
        updateModalActionState();
    });

    perfumeGroup.addEventListener('click', event => {
        const button = event.target.closest('[data-perfume-size]');
        if (!button) return;
        const nextSize = button.dataset.perfumeSize;
        selectedPerfumeSize = nextSize;
        setSelectedOption(perfumeGroup, button);

        const boxCheckbox = document.getElementById('addPerfumeBoxCheckbox');
        const boxLabel = document.querySelector('#addPerfumeBoxOption span');
        const boxNote = document.getElementById('perfumeBoxNote');
        if (nextSize === '10ml') {
            boxCheckbox.disabled = false;
            boxCheckbox.checked = false;
            boxLabel.textContent = 'Add 10 ml Box (+₱15)';
            boxNote.textContent = 'Add the 10 ml box for ₱15, or leave it unchecked.';
        } else {
            boxCheckbox.checked = true;
            boxCheckbox.disabled = true;
            boxLabel.textContent = 'Box included (free)';
            boxNote.textContent = 'The box is included free with this size.';
        }
        updateDisplayedPrice();
        updateModalActionState();
    });

    document.getElementById('addPerfumeBoxCheckbox').addEventListener('change', updateDisplayedPrice);
    document.getElementById('jewelryBoxCheckbox').addEventListener('change', updateDisplayedPrice);
    packagingInputs.forEach(input => {
        input.addEventListener('change', () => {
            packagingInputs.forEach(option =>
                option.closest('.product-packaging-option').classList.toggle('is-selected', option.checked)
            );
            updateDisplayedPrice();
        });
    });

    document.getElementById('productQuantityMinus').addEventListener('click', () => {
        modalQuantity = Math.max(1, modalQuantity - 1);
        document.getElementById('productQuantity').textContent = String(modalQuantity);
    });
    document.getElementById('productQuantityPlus').addEventListener('click', () => {
        modalQuantity += 1;
        document.getElementById('productQuantity').textContent = String(modalQuantity);
    });

    document.getElementById('productModalAdd').addEventListener('click', () => addSelectedProductToCart());
    document.getElementById('productModalBuy').addEventListener('click', () => {
        if (!selectedProduct || document.getElementById('productModalBuy').disabled) return;
        const guest = !window.alboraIsLoggedIn();
        const addedToCart = addSelectedProductToCart('checkout');
        closeProductModal();
        if (!guest && addedToCart) proceedToCheckout();
    });
    document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeProductModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeProductModal();
            closeCart();
        }
    });

    updateBagBadge();
    updateVisibility();

    const requestedProductName = new URLSearchParams(window.location.search).get('product');
    if (requestedProductName) {
        const requestedProduct = products.find(product => product.name === requestedProductName);
        if (requestedProduct) {
            openProductModal(requestedProduct);
        } else {
            console.error(`The requested men's product is not available: ${requestedProductName}`);
        }
    }
})();
