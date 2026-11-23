document.addEventListener('DOMContentLoaded', () => {
    const categoryLabel = document.querySelector('.page-banner .eyebrow-dark');
    const category = categoryLabel
        ? categoryLabel.textContent.split('·').pop().trim().toLowerCase()
        : '';
    const productGrid = document.getElementById('productGrid');
    const productCards = productGrid
        ? Array.from(productGrid.querySelectorAll('.product-card'))
        : [];
    const sortSelect = document.querySelector('.sort-select');
    const searchInput = document.querySelector('.search-input');
    const originalOrder = new Map(productCards.map((card, index) => [card, index]));
    function getProductPrice(card) {
        const priceText = card.querySelector('.product-price')?.textContent || '';
        const match = priceText.match(/[\d,]+/);
        return match ? Number(match[0].replace(/,/g, '')) : 0;
    }

    function getProductSales(card) {
        const salesText = card.querySelector('.product-meta span')?.textContent || '';
        const match = salesText.match(/([\d,.]+)\s*(k)?\s*sold/i);
        if (!match) return 0;
        const sales = Number(match[1].replace(/,/g, ''));
        return match[2] ? sales * 1000 : sales;
    }

    function sortProductCards() {
        if (!productGrid || !sortSelect) return;

        const sortMode = sortSelect.value.toLowerCase();
        const sortedCards = productCards.slice().sort((first, second) => {
            if (sortMode.includes('low to high')) {
                return getProductPrice(first) - getProductPrice(second) ||
                    originalOrder.get(first) - originalOrder.get(second);
            }
            if (sortMode.includes('high to low')) {
                return getProductPrice(second) - getProductPrice(first) ||
                    originalOrder.get(first) - originalOrder.get(second);
            }
            if (sortMode.includes('newest')) {
                return Number(Boolean(second.querySelector('.new-pill'))) -
                    Number(Boolean(first.querySelector('.new-pill'))) ||
                    originalOrder.get(first) - originalOrder.get(second);
            }
            return getProductSales(second) - getProductSales(first) ||
                originalOrder.get(first) - originalOrder.get(second);
        });

        const fragment = document.createDocumentFragment();
        sortedCards.forEach(card => fragment.appendChild(card));
        productGrid.appendChild(fragment);
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', sortProductCards);
        sortProductCards();
    }

    function updatePerfumeVisibility() {
        if (category !== 'perfume') return;

        const activeShopFor = document.querySelector('.sub-chip[data-shopfor].active')?.dataset.shopfor || 'all-shop';
        const searchTerm = searchInput ? searchInput.value.trim().toLocaleLowerCase() : '';

        productCards.forEach(card => {
            const name = card.querySelector('.product-name')?.textContent || '';
            const matchesShopFor = activeShopFor === 'all-shop' || card.dataset.shopfor === activeShopFor;
            card.style.display = matchesShopFor && name.toLocaleLowerCase().includes(searchTerm) ? '' : 'none';
        });
    }

    if (category === 'perfume') {
        document.querySelectorAll('.sub-chip[data-shopfor]').forEach(chip => {
            chip.addEventListener('click', updatePerfumeVisibility);
        });
        if (searchInput) searchInput.addEventListener('input', updatePerfumeVisibility);
        updatePerfumeVisibility();
    }

    function initializeProductCard(card) {
        const productName = card.querySelector('.product-name')?.textContent.trim();
        const quickAdd = card.querySelector('.quick-add');
        const productReady = Boolean(productName && getProductPrice(card) > 0);
        if (quickAdd) quickAdd.disabled = !productReady;
        if (quickAdd) quickAdd.style.pointerEvents = productReady ? '' : 'none';
        if (!productReady) {
            card.removeAttribute('href');
            card.setAttribute('aria-disabled', 'true');
            return false;
        }

        const params = new URLSearchParams({
            category: category,
            product: productName
        });
        card.href = `index.html?${params.toString()}#collection`;
        card.removeAttribute('aria-disabled');
        if (quickAdd) {
            quickAdd.setAttribute('aria-label', `Quick add ${productName} to bag`);
        }
        return true;
    }

    productCards.forEach(initializeProductCard);

    function getQuickAddCustomizations(card) {
        const customizations = category === 'flowers'
            ? {}
            : { giftPackaging: 'none', giftPackagingLabel: 'No Gift Packaging' };
        if (category === 'jewelry') {
            if (card.dataset.type === 'necklace') customizations.necklaceLength = '18 in';
            else if (card.dataset.type === 'ring') customizations.ringSize = '6';
            else customizations.finish = card.dataset.metal || 'gold';
        } else if (category === 'perfume') {
            customizations.perfumeSize = '10 ml';
            customizations.perfumeBox = 'none';
        } else if (category === 'cosmetics' && card.dataset.cos !== 'highlighter') {
            const shades = JSON.parse(card.dataset.shades || '[]');
            if (shades.length) customizations.lipstickShade = shades[0];
        } else if (category === 'accessories') {
            const colors = JSON.parse(card.dataset.colors || '[]');
            if (colors.length) customizations.color = colors[0];
        } else if (category === 'flowers') {
            const colors = JSON.parse(card.dataset.colors || '[]');
            if (colors.length) customizations.flowerColor = colors[0];
        }
        return customizations;
    }

    let quickAddToast;
    let quickAddToastTimer;
    function showQuickAddMessage(message, isError) {
        if (!quickAddToast || !quickAddToast.isConnected) {
            quickAddToast = document.createElement('div');
            quickAddToast.setAttribute('role', 'status');
            quickAddToast.setAttribute('aria-live', 'polite');
            Object.assign(quickAddToast.style, {
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                zIndex: '10000',
                padding: '12px 18px',
                background: '#191613',
                border: '1px solid #C5A253',
                color: '#E8DECB',
                fontSize: '13px'
            });
            document.body.appendChild(quickAddToast);
        }
        quickAddToast.textContent = message;
        quickAddToast.style.borderColor = isError ? '#C66' : '#C5A253';
        clearTimeout(quickAddToastTimer);
        quickAddToastTimer = window.setTimeout(() => quickAddToast.remove(), 3000);
    }

    function addProductToBag(card) {
        const name = card.querySelector('.product-name').textContent.trim();
        const basePrice = getProductPrice(card);
        const customizations = getQuickAddCustomizations(card);
        return saveProductToBag({
            name,
            price: basePrice,
            basePrice,
            category,
            image: '',
            qty: 1,
            customizations,
            additionalCharges: []
        });
    }

    function saveProductToBag(item, redirectTo = 'home') {
        const name = item.name;
        if (window.alboraQueuePendingItem(item, redirectTo)) return false;

        let cart;
        try {
            cart = window.alboraCartStorage.load();
        } catch (error) {
            console.error('Unable to read the saved cart for quick add.', error);
            showQuickAddMessage('Your bag could not be updated. Please try again.', true);
            return;
        }

        const existingItem = cart.find(savedItem =>
            savedItem.name === name &&
            (savedItem.category || 'general') === (item.category || 'general') &&
            Number(savedItem.price) === Number(item.price) &&
            JSON.stringify(savedItem.customizations || {}) ===
                JSON.stringify(item.customizations || {})
        );
        if (existingItem) existingItem.qty = (Number(existingItem.qty) || 0) + Number(item.qty || 1);
        else cart.push(item);

        try {
            window.alboraCartStorage.save(cart);
        } catch (error) {
            console.error('Unable to save the quick-added item.', error);
            showQuickAddMessage('Your item could not be saved. Please try again.', true);
            return;
        }

        const badge = document.querySelector('.bag-badge');
        if (badge) {
            badge.textContent = cart.reduce(
                (total, savedItem) => total + Math.max(0, Number(savedItem.qty) || 0),
                0
            );
        }
        showQuickAddMessage(`"${name}" Added to Bag`);
        return true;
    }

    const detailsDialog = document.createElement('dialog');
    detailsDialog.className = 'category-product-dialog';
    detailsDialog.setAttribute('aria-labelledby', 'categoryProductDialogName');
    detailsDialog.innerHTML = `
        <section class="category-product-dialog-panel" role="document">
            <header><span>Product Details</span><button type="button" data-dialog-close aria-label="Close product details">×</button></header>
            <div class="category-product-dialog-content">
                <p data-dialog-category></p>
                <h2 id="categoryProductDialogName"></h2>
                <p class="category-product-dialog-price" data-dialog-price></p>
                <p data-dialog-description></p>
                <div data-dialog-options></div>
                <label data-dialog-addon hidden><input type="checkbox" data-addon-input> <span data-addon-label></span></label>
                <label class="category-product-dialog-packaging" data-dialog-packaging>
                    Gift Packaging
                    <select data-packaging>
                        <option value="none" data-label="No Gift Packaging" data-price="0">No Gift Packaging</option>
                        <option value="gift-bag" data-label="Alborá Gift Bag" data-price="25">Alborá Gift Bag (+₱25)</option>
                        <option value="exclusive-box" data-label="Alborá Exclusive Gift Box" data-price="190">Alborá Exclusive Gift Box (+₱190)</option>
                    </select>
                </label>
                <div class="category-product-dialog-quantity">
                    <span>Quantity</span><button type="button" data-quantity="-1" aria-label="Decrease quantity">−</button>
                    <output data-quantity-value>1</output><button type="button" data-quantity="1" aria-label="Increase quantity">+</button>
                </div>
            </div>
            <footer>
                <button type="button" data-dialog-add>Add to Bag</button>
                <button type="button" data-dialog-buy>Buy Now</button>
            </footer>
        </section>`;
    document.body.appendChild(detailsDialog);

    let selectedCard = null;
    let selectedOptions = {};
    let modalQuantity = 1;
    let modalAddonKind = '';
    const dialogOptions = detailsDialog.querySelector('[data-dialog-options]');
    const dialogPrice = detailsDialog.querySelector('[data-dialog-price]');
    const packagingSelect = detailsDialog.querySelector('[data-packaging]');
    const addonInput = detailsDialog.querySelector('[data-addon-input]');
    const addonLabel = detailsDialog.querySelector('[data-addon-label]');

    function parseCardOptions(card, key, fallback) {
        return JSON.parse(card.dataset[key] || JSON.stringify(fallback));
    }

    function updateDetailsDialogPrice() {
        if (!selectedCard) return;
        const basePrice = getProductPrice(selectedCard);
        const packagingPrice = category === 'flowers' ? 0 :
            Number(packagingSelect.selectedOptions[0].dataset.price) || 0;
        const addonPrice = addonInput.checked
            ? modalAddonKind === 'jewelryBox' ? 80 : modalAddonKind === 'perfumeBox' && selectedOptions.perfumeSize === '10ml' ? 15 : 0
            : 0;
        dialogPrice.textContent = `₱${(basePrice + packagingPrice + addonPrice).toLocaleString()}`;
    }

    function renderDialogOptions(title, values, optionKey, selectedValue) {
        const group = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = title;
        group.appendChild(legend);
        values.forEach(value => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-product-option';
            button.textContent = value;
            button.setAttribute('aria-pressed', String(value === selectedValue));
            button.classList.toggle('selected', value === selectedValue);
            button.addEventListener('click', () => {
                selectedOptions[optionKey] = value;
                group.querySelectorAll('button').forEach(option => {
                    const selected = option === button;
                    option.classList.toggle('selected', selected);
                    option.setAttribute('aria-pressed', String(selected));
                });
                if (optionKey === 'perfumeSize') {
                    if (value === '10ml') {
                        addonLabel.textContent = 'Add 10 ml Box (+₱15)';
                        addonInput.checked = false;
                        addonInput.disabled = false;
                    } else {
                        addonLabel.textContent = 'Box included (free)';
                        addonInput.checked = true;
                        addonInput.disabled = true;
                    }
                }
                updateDetailsDialogPrice();
            });
            group.appendChild(button);
        });
        dialogOptions.appendChild(group);
    }

    function updateDialogActionState() {
        const needsChoice = ['jewelry', 'perfume', 'accessories', 'flowers'].includes(category) ||
            (category === 'cosmetics' && selectedCard.dataset.cos !== 'highlighter');
        const valid = !needsChoice || Boolean(Object.keys(selectedOptions).length);
        detailsDialog.querySelector('[data-dialog-add]').disabled = !valid;
        detailsDialog.querySelector('[data-dialog-buy]').disabled = !valid;
    }

    function openProductDetails(card) {
        selectedCard = card;
        selectedOptions = {};
        modalQuantity = 1;
        modalAddonKind = '';
        addonInput.checked = false;
        addonInput.disabled = false;
        packagingSelect.value = 'none';
        dialogOptions.replaceChildren();
        detailsDialog.querySelector('[data-dialog-category]').textContent = category;
        detailsDialog.querySelector('#categoryProductDialogName').textContent =
            card.querySelector('.product-name').textContent.trim();
        detailsDialog.querySelector('[data-dialog-description]').textContent =
            card.dataset.description || '';
        detailsDialog.querySelector('[data-quantity-value]').textContent = '1';

        if (category === 'jewelry') {
            const type = card.dataset.type || '';
            if (type === 'necklace') {
                renderDialogOptions('Choose Length', ['18 in'], 'necklaceLength', '18 in');
                selectedOptions.necklaceLength = '18 in';
            } else if (type === 'ring') {
                renderDialogOptions('Choose Size', ['6', '7', '8'], 'ringSize', '6');
                selectedOptions.ringSize = '6';
            } else {
                const finish = card.dataset.metal || 'gold';
                renderDialogOptions('Choose Finish', ['gold', 'silver'], 'finish', finish);
                selectedOptions.finish = finish;
            }
            modalAddonKind = 'jewelryBox';
            detailsDialog.querySelector('[data-dialog-addon]').hidden = false;
            addonLabel.textContent = type ? `Add ${type} Box (+₱80)` : 'Add Jewelry Box (+₱80)';
        } else if (category === 'perfume') {
            renderDialogOptions('Choose Size', ['10ml', '30ml', '50ml'], 'perfumeSize', '10ml');
            selectedOptions.perfumeSize = '10ml';
            modalAddonKind = 'perfumeBox';
            detailsDialog.querySelector('[data-dialog-addon]').hidden = false;
            addonLabel.textContent = 'Add 10 ml Box (+₱15)';
        } else if (category === 'cosmetics' && card.dataset.cos !== 'highlighter') {
            const shades = parseCardOptions(card, 'shades', ['Rose Nude', 'Soft Pink', 'Cherry Red']);
            if (shades.length) {
                renderDialogOptions('Choose Shade', shades, 'lipstickShade', shades[0]);
                selectedOptions.lipstickShade = shades[0];
            }
        } else if (category === 'accessories') {
            const colors = parseCardOptions(card, 'colors', ['Black', 'White', 'Brown']);
            if (colors.length) {
                renderDialogOptions('Choose Color', colors, 'color', colors[0]);
                selectedOptions.color = colors[0];
            }
        } else if (category === 'flowers') {
            const colors = parseCardOptions(card, 'colors', []);
            if (colors.length) {
                renderDialogOptions('Choose Flower Color', colors, 'flowerColor', colors[0]);
                selectedOptions.flowerColor = colors[0];
            }
        }

        detailsDialog.querySelector('[data-dialog-packaging]').hidden = category === 'flowers';
        updateDetailsDialogPrice();
        updateDialogActionState();
        detailsDialog.showModal();
    }

    function getDetailsDialogItem() {
        const packaging = packagingSelect.selectedOptions[0];
        const customizations = { ...selectedOptions };
        const additionalCharges = [];
        if (category !== 'flowers') {
            customizations.giftPackaging = packagingSelect.value;
            customizations.giftPackagingLabel = packaging.dataset.label;
            if (Number(packaging.dataset.price)) {
                additionalCharges.push({ label: packaging.dataset.label, amount: Number(packaging.dataset.price) });
            }
        }
        if (category === 'jewelry' && addonInput.checked) {
            customizations.jewelryBox = `Add ${selectedCard.dataset.type || 'Jewelry'} Box`;
            additionalCharges.push({ label: customizations.jewelryBox, amount: 80 });
        } else if (category === 'perfume') {
            customizations.perfumeBox = addonInput.checked
                ? (selectedOptions.perfumeSize === '10ml' ? 'paid' : 'included')
                : 'none';
            if (addonInput.checked && selectedOptions.perfumeSize === '10ml') {
                additionalCharges.push({ label: 'Add 10 ml Box', amount: 15 });
            }
        }
        const basePrice = getProductPrice(selectedCard);
        return {
            name: selectedCard.querySelector('.product-name').textContent.trim(),
            price: basePrice + additionalCharges.reduce((total, charge) => total + charge.amount, 0),
            basePrice,
            category,
            image: '',
            qty: modalQuantity,
            customizations,
            additionalCharges
        };
    }

    detailsDialog.querySelector('[data-dialog-close]').addEventListener('click', () => detailsDialog.close());
    detailsDialog.addEventListener('click', event => {
        if (event.target === detailsDialog) detailsDialog.close();
    });
    detailsDialog.querySelectorAll('[data-quantity]').forEach(button => {
        button.addEventListener('click', () => {
            modalQuantity = Math.max(1, modalQuantity + Number(button.dataset.quantity));
            detailsDialog.querySelector('[data-quantity-value]').textContent = String(modalQuantity);
        });
    });
    addonInput.addEventListener('change', updateDetailsDialogPrice);
    packagingSelect.addEventListener('change', updateDetailsDialogPrice);
    detailsDialog.querySelector('[data-dialog-add]').addEventListener('click', () => {
        saveProductToBag(getDetailsDialogItem());
        detailsDialog.close();
    });
    detailsDialog.querySelector('[data-dialog-buy]').addEventListener('click', () => {
        const guest = !window.alboraIsLoggedIn();
        const added = saveProductToBag(getDetailsDialogItem(), 'checkout');
        detailsDialog.close();
        if (!guest && added) window.location.href = 'checkout.html';
    });

    if (productGrid) {
        productGrid.addEventListener('click', event => {
            const card = event.target.closest('.product-card');
            if (!card || !productGrid.contains(card)) return;

            const quickAdd = event.target.closest('.quick-add');
            if (quickAdd && card.contains(quickAdd)) {
                event.preventDefault();
                event.stopPropagation();
                if (!quickAdd.disabled) addProductToBag(card);
                return;
            }

            event.preventDefault();
            if (initializeProductCard(card)) {
                openProductDetails(card);
            }
        });

        const dynamicCardObserver = new MutationObserver(records => {
            records.forEach(record => record.addedNodes.forEach(node => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                const addedCards = node.matches('.product-card')
                    ? [node]
                    : Array.from(node.querySelectorAll('.product-card'));
                addedCards.forEach(card => {
                    if (!productCards.includes(card)) {
                        productCards.push(card);
                        originalOrder.set(card, originalOrder.size);
                    }
                    initializeProductCard(card);
                });
            }));
        });
        dynamicCardObserver.observe(productGrid, { childList: true });
    }

    const findOrderInput = document.querySelector('.find-order-input');
    const findOrderButton = document.querySelector('.btn-find');
    if (findOrderInput && findOrderButton) {
        findOrderInput.required = true;
        findOrderInput.setAttribute('aria-label', 'Order number');
        findOrderButton.addEventListener('click', () => {
            const orderNumber = findOrderInput.value.trim();
            if (!orderNumber) {
                findOrderInput.focus();
                findOrderInput.setCustomValidity('Enter your order number.');
                findOrderInput.reportValidity();
                return;
            }

            findOrderInput.setCustomValidity('');
            window.location.href = `orders.html?order=${encodeURIComponent(orderNumber)}`;
        });
        findOrderInput.addEventListener('input', () => findOrderInput.setCustomValidity(''));
        findOrderInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                findOrderButton.click();
            }
        });
    }

    const bagLink = document.querySelector('.bag-btn');
    if (bagLink) bagLink.href = 'bag.html';
    const bagBadge = document.querySelector('.bag-badge');
    if (bagBadge) {
        try {
            const cart = window.alboraCartStorage.load();
            bagBadge.textContent = cart.reduce((total, item) => total + Math.max(0, Number(item.qty) || 0), 0);
        } catch (error) {
            console.error('Unable to read the saved cart badge count.', error);
            bagBadge.textContent = '!';
        }
    }

});
