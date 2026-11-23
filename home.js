window.bindAlboraInlineHandlers({
    "home-event-1": function(event) {
        proceedToCheckout()
    },
    "home-event-2": function(event) {
        closeCart()
    },
    "home-event-3": function(event) {
        toggleMobileFilters()
    },
    "home-event-4": function(event) {
        toggleMenu()
    },
    "home-event-5": function(event) {
        removeItem(Number(this.dataset.alboraIndex))
    },
    "home-event-6": function(event) {
        changeQty(Number(this.dataset.alboraIndex), 1)
    },
    "home-event-7": function(event) {
        changeQty(Number(this.dataset.alboraIndex), -1)
    }
});

        /* ---------- CART SYSTEM (SIDE DRAWER) ---------- */
        let cart = window.alboraCartStorage.load();

        function openCart() {
            document.getElementById('cartDrawer').classList.add('open');
            document.getElementById('cartOverlay').classList.add('active');
            renderCartItems();
        }

        function closeCart() {
            document.getElementById('cartDrawer').classList.remove('open');
            document.getElementById('cartOverlay').classList.remove('active');
        }

        function saveCart() {
            window.alboraCartStorage.save(cart);
            updateBagBadge();
        }

        function updateBagBadge() {
            const badge = document.querySelector('.bag-badge');
            if (badge) {
                let totalQty = 0;
                cart.forEach(item => {
                    let qty = parseInt(item.qty);
                    if (!isNaN(qty)) totalQty += qty;
                });
                badge.textContent = totalQty;
            }
        }

        function escapeHTML(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function getItemCustomizations(item) {
            return item.customizations && typeof item.customizations === 'object'
                ? item.customizations
                : {};
        }

        function getItemCustomizationLabels(item) {
            const options = getItemCustomizations(item);
            const labels = [];
            if (item.details) labels.push(`Gift details: ${item.details}`);
            if (options.lipstickShade) labels.push(`Shade: ${options.lipstickShade}`);
            if (options.finish) {
                labels.push(`Finish: ${options.finish.charAt(0).toUpperCase()}${options.finish.slice(1)}`);
            }
            if (options.necklaceLength) labels.push(`Length: ${options.necklaceLength}`);
            if (options.ringSize) labels.push(`Ring Size: ${options.ringSize}`);
            if (options.color) labels.push(`Color: ${options.color}`);
            if (options.flowerColor) labels.push(`Flower Color: ${options.flowerColor}`);
            if (typeof options.addEarrings === 'boolean') {
                labels.push(`Add Earrings: ${options.addEarrings ? 'Yes' : 'No'}`);
            }
            if (options.jewelryBox) labels.push(options.jewelryBox);
            if (options.giftPackaging) {
                labels.push(`Packaging: ${options.giftPackagingLabel || options.giftPackaging}`);
            }
            if (options.perfumeSize) labels.push(`Size: ${options.perfumeSize}`);
            if (options.perfumeBox === 'paid') labels.push('Add 10 ml Box (+₱15)');
            if (options.perfumeBox === 'included') labels.push('Box included (free)');
            if (options.perfumeBox === 'none') labels.push('No box selected');
            return labels;
        }

        function getItemAdditionalCharges(item) {
            return Array.isArray(item.additionalCharges) ? item.additionalCharges : [];
        }

        function renderCartItemDetails(item) {
            const details = getItemCustomizationLabels(item)
                .map(label => `<p class="albora-inline-6347a6b45f24">${escapeHTML(label)}</p>`)
                .join('');
            const charges = getItemAdditionalCharges(item)
                .filter(charge => Number(charge.amount) > 0)
                .map(charge => `<p class="albora-inline-293d3bfc9721">${escapeHTML(charge.label)} · ₱${Number(charge.amount).toLocaleString()} each</p>`)
                .join('');
            return details + charges;
        }

        function addToCart(productName, price, category, imageSource, quantity = 1, productOptions = {}, redirectAfterLogin = 'home') {
            let safePrice = Number(productOptions.unitPrice ?? price);
            if (isNaN(safePrice)) safePrice = 0;
            const safeBasePrice = Number(productOptions.basePrice ?? price) || 0;
            const safeQuantity = Math.max(1, parseInt(quantity, 10) || 1);
            const customizations = productOptions.customizations || {};
            const cartItem = {
                name: productName,
                price: safePrice,
                basePrice: safeBasePrice,
                category: category,
                image: imageSource,
                qty: safeQuantity,
                customizations: customizations,
                additionalCharges: productOptions.additionalCharges || []
            };

            if (window.alboraQueuePendingItem(cartItem, redirectAfterLogin)) return false;

            const existing = cart.find(item =>
                item.name === productName &&
                (item.category || 'general') === (category || 'general') &&
                Number(item.price) === safePrice &&
                JSON.stringify(getItemCustomizations(item)) === JSON.stringify(customizations)
            );
            if (existing) {
                existing.qty = (Number(existing.qty) || 0) + safeQuantity;
            } else {
                cart.push(cartItem);
            }
            saveCart();
            showToast(productName);
            return true;
        }

        let toastTimeout;
        function showToast(productName) {
            const toast = document.getElementById('toastNotification');
            const msg = document.getElementById('toastMessage');
            if(!toast || !msg) return;
            msg.textContent = `"${productName}" Added to Bag`;
            toast.classList.add('show');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function renderCartItems() {
            const container = document.getElementById('cartItemsContainer');
            const subtotalEl = document.getElementById('cartSubtotal');
            if (!container || !subtotalEl) return;

            container.innerHTML = '';
            let subtotal = 0;

            if (cart.length === 0) {
                container.innerHTML = '<p class="albora-inline-ecb5d3e9e8a5">Your bag is empty.</p>';
                subtotalEl.textContent = '₱0';
                return;
            }

            cart.forEach((item, index) => {
               subtotal += (Number(item.price) || 0) * (Number(item.qty) || 1);
                
                container.innerHTML += `
                    <div class="cart-item albora-inline-ad27d18d1b53">
                        <div class="cart-item-image-placeholder" data-image-src="${item.image || ''}">
                            <span>IMAGE PLACEHOLDER</span>
                        </div>
                        <div class="albora-inline-6253876a649a">
                            <h4 class="albora-inline-858a68f2a653">${escapeHTML(item.name)}</h4>
                            <p class="albora-inline-768da9ed30cb">${escapeHTML(item.category || 'Item')}</p>
                            ${renderCartItemDetails(item)}
                            <div class="albora-inline-8ba0c206b756">
                                <button class="albora-inline-9ad612b6e464" data-albora-event-id="home-event-7" data-albora-event-type="click" data-albora-index="${index}">−</button>
                                <span class="albora-inline-db929b4179a6">${item.qty}</span>
                                <button class="albora-inline-9ad612b6e464" data-albora-event-id="home-event-6" data-albora-event-type="click" data-albora-index="${index}">+</button>
                            </div>
                            <button class="albora-inline-2fbbf33d76ef" data-albora-event-id="home-event-5" data-albora-event-type="click" data-albora-index="${index}">Remove</button>
                        </div>
                        <div class="albora-inline-324f2bb4b514">₱${(item.price * item.qty).toLocaleString()}</div>
                    </div>
                `;
            });

            subtotalEl.textContent = '₱' + subtotal.toLocaleString();
        }

        function changeQty(index, change) {
            cart[index].qty += change;
            if (cart[index].qty <= 0) cart.splice(index, 1);
            saveCart();
            renderCartItems();
        }

        function removeItem(index) {
            cart.splice(index, 1);
            saveCart();
            renderCartItems();
        }

        function handleProductQuickAdd(card, button) {
            if (button.dataset.quickAddPending === 'true') return;
            button.dataset.quickAddPending = 'true';
            window.setTimeout(() => {
                delete button.dataset.quickAddPending;
            }, 350);

            const name = card.querySelector('.product-name').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent;
            const priceMatch = priceText.match(/[\d,]+/);
            const price = priceMatch ? Number(priceMatch[0].replace(/,/g, '')) : 0;
            const category = card.dataset.category || 'general';
            const commerceCategories = ['cosmetics', 'jewelry', 'accessories', 'perfume', 'flowers'];

            if (commerceCategories.includes(category)) {
                selectedProductCard = card;
                modalQuantity = 1;
                productModalQuantity.textContent = modalQuantity;
                modalBasePrice = price;
                modalPricePrefix = /^From\b/i.test(priceText.trim()) ? 'From ' : '';
                configureProductOptions(card);
                applyQuickAddDefaults(card);
                if (!modalAddButton.disabled) addSelectedProductToBag();
                selectedProductCard = null;
                return;
            }

            const imageSource = '';
            addToCart(name, price, category, imageSource);
        }

        // --- CHECKOUT GATEKEEPER ---
        function proceedToCheckout() {
            let cart = window.alboraCartStorage.load();
            if (cart.length === 0) {
                alert("Your bag is empty!");
                return;
            }

            if (!window.alboraIsLoggedIn()) {
                window.location.href = 'login.html?redirect=checkout';
                return;
            }

            window.location.href = 'checkout.html';
        }

        // --- THE COLLECTION PRODUCT DETAILS MODAL ---
        const productModal = document.getElementById('productDetailsModal');
        const productModalPanel = productModal.querySelector('.product-modal-panel');
        const productModalImage = document.getElementById('productModalImage');
        const productModalQuantity = document.getElementById('productQuantity');
        const giftPackagingInputs = document.querySelectorAll('input[name="giftPackaging"]');
        let selectedProductCard = null;
        let modalQuantity = 1;
        let modalSelectedShade = '';
        let modalRequiresShade = false;
        let modalSelectedFinish = '';
        let modalSelectedNecklaceLength = '';
        let modalSelectedRingSize = '';
        let modalJewelryOptionType = '';
        let modalSelectedColor = '';
        let modalSelectedFlowerColor = '';
        let modalPerfumeSize = '';
        let modalBasePrice = 0;
        let modalPricePrefix = '';
        let previouslyFocusedElement = null;
        let previousBodyOverflow = '';

        function setGiftPackagingSelection(input) {
            if (!input) return;
            document.querySelectorAll('.product-packaging-option').forEach(option => {
                option.classList.toggle('is-selected', option.contains(input));
            });
        }

        giftPackagingInputs.forEach(input => {
            input.addEventListener('change', () => {
                setGiftPackagingSelection(input);
                updateModalOptionTotal();
            });
        });

        const defaultProductOptions = {
            shades: ['Rose Nude', 'Soft Pink', 'Cherry Red'],
            colors: ['Black', 'White', 'Brown'],
            shadeSwatches: {
                'Rose Nude': '#C78F8A',
                'Soft Pink': '#F2A7B8',
                'Cherry Red': '#A6192E'
            },
            accessorySwatches: {
                Black: '#191613',
                White: '#F5F2EB',
                Brown: '#70452B'
            },
            flowerSwatches: {
                Red: '#A92733',
                Pink: '#E8A6B7',
                White: '#F5F2EB',
                Yellow: '#E7C34B',
                'Blush Pink': '#DDA0A5',
                Orange: '#E98439'
            }
        };

        function parseProductOptions(rawOptions) {
            if (!rawOptions) return [];
            try {
                const parsed = JSON.parse(rawOptions);
                if (Array.isArray(parsed)) {
                    return parsed.map(option => String(option).trim()).filter(Boolean);
                }
            } catch (error) {
                // Plain comma- or pipe-separated data is also supported.
            }
            return rawOptions.split(/[|,]/).map(option => option.trim()).filter(Boolean);
        }

        function getProductOptionValues(card, dataKey, defaultOptions) {
            const productOptions = parseProductOptions(card.dataset[dataKey]);
            return productOptions.length ? productOptions : defaultOptions;
        }

        function renderProductOptionButtons(container, options, optionDataKey, swatches) {
            container.replaceChildren();
            options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = swatches
                    ? 'product-option-button product-swatch'
                    : 'product-option-button';
                button.dataset[optionDataKey] = option;
                button.setAttribute('aria-pressed', 'false');
                if (swatches) {
                    const swatch = document.createElement('span');
                    swatch.className = 'product-swatch-chip';
                    swatch.style.backgroundColor = swatches[option] || '#777';
                    swatch.setAttribute('aria-hidden', 'true');
                    const label = document.createElement('span');
                    label.textContent = option;
                    button.append(swatch, label);
                } else {
                    button.textContent = option;
                }
                container.appendChild(button);
            });
        }

        function selectProductOption(container, selectedButton) {
            container.querySelectorAll('.product-option-button').forEach(button => {
                const selected = button === selectedButton;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
        }

        const lipstickShadeGroup = document.getElementById('lipstickShadeGroup');
        const lipstickShadeOptions = document.getElementById('lipstickShadeOptions');
        const lipstickShadeUnavailable = document.getElementById('lipstickShadeUnavailable');
        const accessoryColorGroup = document.getElementById('accessoryColorGroup');
        const accessoryColorOptions = document.getElementById('accessoryColorOptions');
        const accessoryColorUnavailable = document.getElementById('accessoryColorUnavailable');
        const flowerColorGroup = document.getElementById('flowerColorGroup');
        const flowerColorOptions = document.getElementById('flowerColorOptions');
        const flowerColorUnavailable = document.getElementById('flowerColorUnavailable');
        const jewelryFinishGroup = document.getElementById('jewelryFinishGroup');
        const necklaceLengthGroup = document.getElementById('necklaceLengthGroup');
        const ringSizeGroup = document.getElementById('ringSizeGroup');
        const jewelryBoxGroup = document.getElementById('jewelryBoxGroup');
        const jewelryBoxCheckbox = document.getElementById('jewelryBoxCheckbox');
        const jewelryBoxLabel = document.getElementById('jewelryBoxLabel');
        const perfumeOptionsGroup = document.getElementById('perfumeOptionsGroup');
        const addPerfumeBoxCheckbox = document.getElementById('addPerfumeBoxCheckbox');
        const perfumeBoxNote = document.getElementById('perfumeBoxNote');
        const perfumeBoxLabel = document.querySelector('#addPerfumeBoxOption span');
        const giftPackagingGroup = document.getElementById('giftPackagingGroup');
        const productModalOptionTotal = document.getElementById('productModalOptionTotal');
        const jewelryModalOptionTotal = document.getElementById('jewelryModalOptionTotal');
        const modalAddButton = document.getElementById('productModalAdd');
        const modalBuyButton = document.getElementById('productModalBuy');

        function getModalPricing() {
            if (!selectedProductCard) {
                return { packagingPrice: 0, perfumeBoxPrice: 0, jewelryBoxPrice: 0, unitPrice: 0 };
            }
            const category = selectedProductCard.dataset.category;
            const packaging = document.querySelector('input[name="giftPackaging"]:checked');
            const packagingPrice = giftPackagingGroup.hidden || !packaging
                ? 0
                : Number(packaging.dataset.price) || 0;
            const perfumeBoxPrice =
                category === 'perfume' &&
                modalPerfumeSize === '10ml' &&
                addPerfumeBoxCheckbox.checked
                    ? 15
                    : 0;
            const jewelryBoxPrice =
                category === 'jewelry' &&
                !jewelryBoxGroup.hidden &&
                jewelryBoxCheckbox.checked
                    ? 80
                    : 0;
            return window.alboraProductOptions.getPricing({
                basePrice: modalBasePrice,
                packagingPrice,
                perfumeBoxPrice,
                jewelryBoxPrice
            });
        }

        function updateModalOptionTotal() {
            if (!selectedProductCard) return;
            const category = selectedProductCard.dataset.category;
            const pricing = getModalPricing();
            const displayedPrice = document.querySelector('#productModalPrice .product-price');
            if (displayedPrice) {
                const primaryPriceText = Array.from(displayedPrice.childNodes)
                    .find(node => node.nodeType === Node.TEXT_NODE);
                const priceText = `${modalPricePrefix}₱${pricing.unitPrice.toLocaleString()}${displayedPrice.querySelector('s') ? ' ' : ''}`;
                if (primaryPriceText) {
                    primaryPriceText.nodeValue = priceText;
                } else {
                    displayedPrice.insertBefore(document.createTextNode(priceText), displayedPrice.firstChild);
                }
            }
            if (category === 'perfume') {
                productModalOptionTotal.textContent =
                    `Selected total: ₱${pricing.unitPrice.toLocaleString()}`;
            }
            if (category === 'jewelry' && !jewelryBoxGroup.hidden) {
                jewelryModalOptionTotal.textContent =
                    `Selected total: ₱${pricing.unitPrice.toLocaleString()}`;
            }
        }

        function updateModalActionState() {
            const category = selectedProductCard && selectedProductCard.dataset.category;
            const productName = selectedProductCard
                ? selectedProductCard.querySelector('.product-name')?.textContent.trim()
                : '';
            const productPrice = selectedProductCard
                ? selectedProductCard.querySelector('.product-price')?.textContent || ''
                : '';
            let canAdd = Boolean(
                selectedProductCard &&
                productName &&
                Number((productPrice.match(/[\d,]+/) || ['0'])[0].replace(/,/g, '')) > 0
            );
            if (category === 'cosmetics' && selectedProductCard.dataset.cos !== 'highlighter') {
                canAdd = canAdd && (!modalRequiresShade || Boolean(modalSelectedShade));
            } else if (category === 'perfume') {
                canAdd = canAdd && Boolean(modalPerfumeSize);
            } else if (category === 'accessories') {
                const colors = getProductOptionValues(
                    selectedProductCard,
                    'colors',
                    defaultProductOptions.colors
                );
                canAdd = canAdd && (colors.length < 2 || Boolean(modalSelectedColor));
            } else if (category === 'flowers') {
                const colors = getProductOptionValues(selectedProductCard, 'colors', []);
                canAdd = canAdd && (colors.length < 2 || Boolean(modalSelectedFlowerColor));
            } else if (category === 'jewelry') {
                if (modalJewelryOptionType === 'ring-size') {
                    canAdd = canAdd && Boolean(modalSelectedRingSize);
                } else if (modalJewelryOptionType === 'necklace-length') {
                    canAdd = canAdd && Boolean(modalSelectedNecklaceLength);
                } else {
                    canAdd = canAdd && Boolean(modalSelectedFinish);
                }
            }
            modalAddButton.disabled = !canAdd;
            modalBuyButton.disabled = !canAdd;
        }

        function configureProductOptions(card) {
            const category = card.dataset.category;
            [
                lipstickShadeGroup,
                accessoryColorGroup,
                flowerColorGroup,
                jewelryFinishGroup,
                necklaceLengthGroup,
                ringSizeGroup,
                perfumeOptionsGroup
            ]
                .forEach(group => { group.hidden = true; });
            modalSelectedShade = '';
            modalRequiresShade = false;
            modalSelectedFinish = '';
            modalSelectedNecklaceLength = '';
            modalSelectedRingSize = '';
            modalJewelryOptionType = '';
            modalSelectedColor = '';
            modalSelectedFlowerColor = '';
            modalPerfumeSize = '';
            jewelryBoxCheckbox.checked = false;
            jewelryBoxGroup.hidden = true;
            jewelryBoxLabel.textContent = '';
            jewelryModalOptionTotal.textContent = '';
            addPerfumeBoxCheckbox.checked = false;
            addPerfumeBoxCheckbox.disabled = false;
            perfumeBoxLabel.textContent = 'Add 10 ml Box (+₱15)';
            lipstickShadeOptions.replaceChildren();
            accessoryColorOptions.replaceChildren();
            flowerColorOptions.replaceChildren();

            if (category === 'cosmetics' && card.dataset.cos !== 'highlighter') {
                const shades = getProductOptionValues(card, 'shades', defaultProductOptions.shades);
                modalRequiresShade = true;
                lipstickShadeGroup.hidden = false;
                renderProductOptionButtons(
                    lipstickShadeOptions,
                    shades,
                    'shade',
                    defaultProductOptions.shadeSwatches
                );
                lipstickShadeUnavailable.hidden = shades.length > 0;
                if (shades.length === 1) {
                    const onlyShade = lipstickShadeOptions.querySelector('.product-option-button');
                    selectProductOption(lipstickShadeOptions, onlyShade);
                    modalSelectedShade = shades[0];
                }
            }

            if (category === 'accessories') {
                const colors = getProductOptionValues(card, 'colors', defaultProductOptions.colors);
                accessoryColorGroup.hidden = false;
                renderProductOptionButtons(
                    accessoryColorOptions,
                    colors,
                    'color',
                    defaultProductOptions.accessorySwatches
                );
                accessoryColorUnavailable.hidden = colors.length > 0;
                if (colors.length === 1) {
                    const onlyColor = accessoryColorOptions.querySelector('.product-option-button');
                    selectProductOption(accessoryColorOptions, onlyColor);
                    modalSelectedColor = colors[0];
                }
            }

            if (category === 'flowers') {
                const colors = getProductOptionValues(card, 'colors', []);
                flowerColorGroup.hidden = false;
                renderProductOptionButtons(
                    flowerColorOptions,
                    colors,
                    'flowerColor',
                    defaultProductOptions.flowerSwatches
                );
                flowerColorUnavailable.hidden = colors.length > 0;
                if (colors.length === 1) {
                    const onlyColor = flowerColorOptions.querySelector('.product-option-button');
                    selectProductOption(flowerColorOptions, onlyColor);
                    modalSelectedFlowerColor = colors[0];
                }
            }

            if (category === 'jewelry') {
                const initialFinish = ['gold', 'silver'].includes(card.dataset.metal)
                    ? card.dataset.metal
                    : 'gold';
                const jewelryType = card.dataset.type || '';
                const jewelryBoxLabels = {
                    earrings: 'Add Earrings Box',
                    necklace: 'Add Necklace Box',
                    ring: 'Add Ring Box',
                    bracelet: 'Add Bracelet Box'
                };
                if (jewelryType === 'necklace') {
                    modalJewelryOptionType = 'necklace-length';
                    necklaceLengthGroup.hidden = false;
                    const lengthButton = necklaceLengthGroup.querySelector('[data-necklace-length="18 in"]');
                    selectProductOption(necklaceLengthGroup, lengthButton);
                    modalSelectedNecklaceLength = '18 in';
                } else if (jewelryType === 'ring') {
                    modalJewelryOptionType = 'ring-size';
                    ringSizeGroup.hidden = false;
                } else {
                    modalJewelryOptionType = 'finish';
                    jewelryFinishGroup.hidden = false;
                    const finishButton = jewelryFinishGroup.querySelector(`[data-finish="${initialFinish}"]`);
                    selectProductOption(jewelryFinishGroup, finishButton);
                    modalSelectedFinish = initialFinish;
                }

                if (jewelryBoxLabels[jewelryType]) {
                    jewelryBoxGroup.hidden = false;
                    jewelryBoxLabel.textContent = jewelryBoxLabels[jewelryType];
                }
            }

            if (category === 'perfume') {
                perfumeOptionsGroup.hidden = false;
                perfumeBoxNote.textContent =
                    'Optional for 10 ml (+₱15); included free with 30 ml and 50 ml.';
            }

            giftPackagingGroup.hidden = category === 'flowers';
            const defaultPackaging = document.querySelector('input[name="giftPackaging"][value="none"]');
            if (defaultPackaging) {
                defaultPackaging.checked = true;
                setGiftPackagingSelection(defaultPackaging);
            }
            updateModalOptionTotal();
            updateModalActionState();
        }

        function applyQuickAddDefaults(card) {
            const category = card.dataset.category;
            if (category === 'cosmetics' && card.dataset.cos !== 'highlighter' && !modalSelectedShade) {
                const option = lipstickShadeOptions.querySelector('[data-shade]');
                if (option) {
                    selectProductOption(lipstickShadeOptions, option);
                    modalSelectedShade = option.dataset.shade;
                }
            } else if (category === 'accessories' && !modalSelectedColor) {
                const option = accessoryColorOptions.querySelector('[data-color]');
                if (option) {
                    selectProductOption(accessoryColorOptions, option);
                    modalSelectedColor = option.dataset.color;
                }
            } else if (category === 'flowers' && !modalSelectedFlowerColor) {
                const option = flowerColorOptions.querySelector('[data-flower-color]');
                if (option) {
                    selectProductOption(flowerColorOptions, option);
                    modalSelectedFlowerColor = option.dataset.flowerColor;
                }
            } else if (category === 'jewelry' && modalJewelryOptionType === 'ring-size') {
                const option = ringSizeGroup.querySelector('[data-ring-size]');
                if (option) {
                    selectProductOption(ringSizeGroup, option);
                    modalSelectedRingSize = option.dataset.ringSize;
                }
            } else if (category === 'perfume') {
                const option = perfumeOptionsGroup.querySelector('[data-perfume-size]');
                if (option) {
                    selectProductOption(perfumeOptionsGroup, option);
                    modalPerfumeSize = option.dataset.perfumeSize;
                }
            }
            updateModalOptionTotal();
            updateModalActionState();
        }

        function getProductDescription(card) {
            return card.dataset.description ? card.dataset.description.trim() : '';
        }

        function openProductModal(card) {
            const productName = card.querySelector('.product-name').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent.trim();
            const priceMatch = priceText.match(/[\d,]+/);
            if (!productName || !priceMatch || Number(priceMatch[0].replace(/,/g, '')) <= 0) {
                return false;
            }
            selectedProductCard = card;
            modalQuantity = 1;
            productModalQuantity.textContent = modalQuantity;
            const placeholder = document.createElement('div');
            placeholder.className = 'product-modal-placeholder';
            placeholder.setAttribute('role', 'img');
            placeholder.setAttribute('aria-label', `${productName} image placeholder`);
            placeholder.textContent = 'IMAGE PLACEHOLDER';
            productModalImage.replaceChildren(placeholder);
            const price = card.querySelector('.product-price');
            modalBasePrice = priceMatch ? Number(priceMatch[0].replace(/,/g, '')) : 0;
            modalPricePrefix = /^From\b/i.test(priceText) ? 'From ' : '';
            configureProductOptions(card);
            document.getElementById('productModalTitle').textContent =
                productName;
            document.getElementById('productModalCategory').textContent =
                (card.dataset.category || 'Product').replace(/-/g, ' ');

            const modalPrice = document.getElementById('productModalPrice');
            modalPrice.replaceChildren(price.cloneNode(true));
            updateModalOptionTotal();

            const meta = card.querySelector('.product-meta');
            document.getElementById('productModalMeta').textContent =
                meta && meta.children.length ? meta.children[0].textContent.trim() : '';

            document.getElementById('productModalDescription').textContent =
                getProductDescription(card);

            const stock = meta && meta.children.length > 1 ? meta.children[1] : null;
            const stockDisplay = document.getElementById('productModalStock');
            stockDisplay.textContent = stock ? stock.textContent.trim() : 'Stock availability not listed';
            stockDisplay.className = 'product-modal-stock';
            if (stock) {
                if (stock.classList.contains('stock-good')) stockDisplay.classList.add('stock-good');
                if (stock.classList.contains('stock-warn')) stockDisplay.classList.add('stock-warn');
            }

            previouslyFocusedElement = document.activeElement;
            previousBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            productModal.classList.add('open');
            productModal.setAttribute('aria-hidden', 'false');
            document.querySelector('.product-modal-close').focus();
        }

        function bindCarouselProductSlides() {
            const productCards = Array.from(
                document.querySelectorAll('#productGrid .product-card')
            );
            document.querySelectorAll('#bestsellers .slide').forEach(slide => {
                const productName = slide.dataset.productName;
                const slideButton = slide.querySelector('.slide-add-btn');
                if (!productName) {
                    slide.setAttribute('aria-disabled', 'true');
                    slide.style.cursor = 'default';
                    if (slideButton) slideButton.disabled = true;
                    if (slideButton) slideButton.style.pointerEvents = 'none';
                    return;
                }
                const productCard = productCards.find(card =>
                    card.querySelector('.product-name').textContent.trim() === productName
                );
                if (!productCard) {
                    console.error(`Carousel product is missing from The Collection: ${productName}`);
                    slide.setAttribute('aria-disabled', 'true');
                    if (slideButton) slideButton.disabled = true;
                    if (slideButton) slideButton.style.pointerEvents = 'none';
                    return;
                }

                const category = productCard.dataset.category || 'Product';
                const actualName = productCard.querySelector('.product-name').textContent.trim();
                const price = productCard.querySelector('.product-price');
                const primaryPrice = Array.from(price.childNodes)
                    .find(node => node.nodeType === Node.TEXT_NODE);
                slide.querySelector('.cc-cat').textContent =
                    category.charAt(0).toUpperCase() + category.slice(1);
                slide.querySelector('.cc-name').textContent = actualName;
                slide.querySelector('.cc-desc').textContent = getProductDescription(productCard);
                slide.querySelector('.cc-price').textContent =
                    primaryPrice ? primaryPrice.textContent.trim() : price.textContent.trim();
                if (slideButton && slideButton.dataset.quickAddBound !== 'true') {
                    slideButton.setAttribute('aria-label', `Quick add ${actualName} to bag`);
                    slideButton.addEventListener('click', event => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleProductQuickAdd(productCard, slideButton);
                    });
                    slideButton.dataset.quickAddBound = 'true';
                }
                if (slideButton) {
                    slideButton.disabled = false;
                    slideButton.style.pointerEvents = '';
                }
                slide.setAttribute('tabindex', '0');
                slide.setAttribute('role', 'group');
                slide.setAttribute('aria-label', `Open details for ${actualName}`);

                if (slide.dataset.detailsBound !== 'true') {
                    slide.addEventListener('click', () => {
                        const currentCard = productCards.find(card =>
                            card.querySelector('.product-name').textContent.trim() ===
                            slide.dataset.productName
                        );
                        if (currentCard) openProductModal(currentCard);
                    });
                    slide.addEventListener('keydown', event => {
                        if (event.target !== slide || !['Enter', ' '].includes(event.key)) return;
                        event.preventDefault();
                        const currentCard = productCards.find(card =>
                            card.querySelector('.product-name').textContent.trim() ===
                            slide.dataset.productName
                        );
                        if (currentCard) openProductModal(currentCard);
                    });
                    slide.dataset.detailsBound = 'true';
                }
            });
        }

        bindCarouselProductSlides();

        function closeProductModal() {
            if (!productModal.classList.contains('open')) return;
            productModal.classList.remove('open');
            productModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = previousBodyOverflow;
            if (previouslyFocusedElement) previouslyFocusedElement.focus();
            selectedProductCard = null;
        }

        function changeProductModalQuantity(change) {
            modalQuantity = Math.max(1, modalQuantity + change);
            productModalQuantity.textContent = modalQuantity;
        }

        function addSelectedProductToBag(redirectAfterLogin = 'home') {
            if (!selectedProductCard || modalAddButton.disabled) return false;
            const name = selectedProductCard.querySelector('.product-name').textContent.trim();
            const basePrice = modalBasePrice;
            const category = selectedProductCard.dataset.category || 'general';
            const pricing = getModalPricing();
            const selectedPackaging = document.querySelector('input[name="giftPackaging"]:checked');
            const details = window.alboraProductOptions.createCustomizations({
                category,
                cos: selectedProductCard.dataset.cos,
                lipstickShade: modalSelectedShade,
                jewelryOptionType: modalJewelryOptionType,
                necklaceLength: modalSelectedNecklaceLength,
                ringSize: modalSelectedRingSize,
                finish: modalSelectedFinish,
                jewelryBoxSelected: !jewelryBoxGroup.hidden && jewelryBoxCheckbox.checked,
                jewelryBoxLabel: jewelryBoxLabel.textContent,
                jewelryBoxPrice: pricing.jewelryBoxPrice,
                color: modalSelectedColor,
                flowerColor: modalSelectedFlowerColor,
                perfumeSize: modalPerfumeSize,
                perfumeBoxChecked: addPerfumeBoxCheckbox.checked,
                perfumeBoxPrice: pricing.perfumeBoxPrice,
                packaging: !giftPackagingGroup.hidden && selectedPackaging
                    ? {
                        value: selectedPackaging.value,
                        label: selectedPackaging.dataset.label,
                        price: pricing.packagingPrice
                    }
                    : null
            });

            return addToCart(name, basePrice, category, '', modalQuantity, {
                basePrice: basePrice,
                unitPrice: pricing.unitPrice,
                customizations: details.customizations,
                additionalCharges: details.additionalCharges
            }, redirectAfterLogin);
        }

        lipstickShadeOptions.addEventListener('click', event => {
            const button = event.target.closest('[data-shade]');
            if (!button) return;
            selectProductOption(lipstickShadeOptions, button);
            modalSelectedShade = button.dataset.shade;
            updateModalOptionTotal();
            updateModalActionState();
        });

        accessoryColorOptions.addEventListener('click', event => {
            const button = event.target.closest('[data-color]');
            if (!button) return;
            selectProductOption(accessoryColorOptions, button);
            modalSelectedColor = button.dataset.color;
            updateModalOptionTotal();
            updateModalActionState();
        });

        flowerColorOptions.addEventListener('click', event => {
            const button = event.target.closest('[data-flower-color]');
            if (!button) return;
            selectProductOption(flowerColorOptions, button);
            modalSelectedFlowerColor = button.dataset.flowerColor;
            updateModalOptionTotal();
            updateModalActionState();
        });

        jewelryFinishGroup.addEventListener('click', event => {
            const button = event.target.closest('[data-finish]');
            if (!button) return;
            selectProductOption(jewelryFinishGroup, button);
            modalSelectedFinish = button.dataset.finish;
            updateModalOptionTotal();
        });

        necklaceLengthGroup.addEventListener('click', event => {
            const button = event.target.closest('[data-necklace-length]');
            if (!button) return;
            selectProductOption(necklaceLengthGroup, button);
            modalSelectedNecklaceLength = button.dataset.necklaceLength;
            updateModalOptionTotal();
            updateModalActionState();
        });

        ringSizeGroup.addEventListener('click', event => {
            const button = event.target.closest('[data-ring-size]');
            if (!button) return;
            selectProductOption(ringSizeGroup, button);
            modalSelectedRingSize = button.dataset.ringSize;
            updateModalOptionTotal();
            updateModalActionState();
        });

        perfumeOptionsGroup.addEventListener('click', event => {
            const button = event.target.closest('[data-perfume-size]');
            if (!button) return;
            const nextSize = button.dataset.perfumeSize;
            const previousSize = modalPerfumeSize;
            modalPerfumeSize = nextSize;
            selectProductOption(perfumeOptionsGroup, button);

            if (nextSize === '10ml') {
                addPerfumeBoxCheckbox.disabled = false;
                if (previousSize && previousSize !== '10ml') addPerfumeBoxCheckbox.checked = false;
                perfumeBoxLabel.textContent = 'Add 10 ml Box (+₱15)';
                perfumeBoxNote.textContent =
                    'Add the 10 ml box for ₱15, or leave it unchecked.';
            } else {
                addPerfumeBoxCheckbox.checked = true;
                addPerfumeBoxCheckbox.disabled = true;
                perfumeBoxLabel.textContent = 'Box included (free)';
                perfumeBoxNote.textContent = 'The box is included free with this size.';
            }
            updateModalOptionTotal();
            updateModalActionState();
        });

        addPerfumeBoxCheckbox.addEventListener('change', updateModalOptionTotal);
        jewelryBoxCheckbox.addEventListener('change', updateModalOptionTotal);

        const collectionProductGrid = document.getElementById('productGrid');

        function initializeCollectionProductCard(card) {
            const button = card.querySelector('.quick-add');
            const name = card.querySelector('.product-name').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent;
            const priceMatch = priceText.match(/[\d,]+/);
            const hasProductData = Boolean(
                name && priceMatch && Number(priceMatch[0].replace(/,/g, '')) > 0
            );

            if (button) {
                button.disabled = !hasProductData;
                button.style.pointerEvents = hasProductData ? '' : 'none';
            }
            if (!hasProductData) {
                card.removeAttribute('href');
                card.setAttribute('aria-disabled', 'true');
            } else {
                card.removeAttribute('aria-disabled');
                if (button) button.setAttribute('aria-label', `Quick add ${name} to bag`);
                const params = new URLSearchParams({
                    category: card.dataset.category || 'all',
                    product: name
                });
                card.href = `index.html?${params.toString()}#collection`;
            }
        }

        collectionProductGrid.querySelectorAll('.product-card').forEach(
            initializeCollectionProductCard
        );
        const collectionProductObserver = new MutationObserver(records => {
            records.forEach(record => {
                record.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (node.matches('.product-card')) {
                        initializeCollectionProductCard(node);
                    }
                    node.querySelectorAll('.product-card').forEach(
                        initializeCollectionProductCard
                    );
                });
            });
            bindCarouselProductSlides();
        });
        collectionProductObserver.observe(collectionProductGrid, { childList: true });

        const carouselSlider = document.getElementById('slider');
        if (carouselSlider) {
            const carouselSlideObserver = new MutationObserver(() => bindCarouselProductSlides());
            carouselSlideObserver.observe(carouselSlider, { childList: true });
        }

        collectionProductGrid.addEventListener('click', event => {
            const card = event.target.closest('.product-card');
            if (!card || !collectionProductGrid.contains(card)) return;
            initializeCollectionProductCard(card);

            const button = event.target.closest('.quick-add');
            if (button && card.contains(button)) {
                event.preventDefault();
                event.stopPropagation();
                if (!button.disabled) handleProductQuickAdd(card, button);
                return;
            }

            event.preventDefault();
            if (card.getAttribute('aria-disabled') !== 'true') {
                openProductModal(card);
            }
        });

        document.querySelector('.product-modal-close').addEventListener('click', closeProductModal);
        document.getElementById('productQuantityMinus').addEventListener('click', () => changeProductModalQuantity(-1));
        document.getElementById('productQuantityPlus').addEventListener('click', () => changeProductModalQuantity(1));
        document.getElementById('productModalAdd').addEventListener('click', () => {
            addSelectedProductToBag();
            closeProductModal();
        });
        document.getElementById('productModalBuy').addEventListener('click', () => {
            if (!selectedProductCard || modalBuyButton.disabled) return;
            const guest = !window.alboraIsLoggedIn();
            const addedToCart = addSelectedProductToBag('checkout');
            closeProductModal();
            if (!guest && addedToCart) proceedToCheckout();
        });
        productModal.addEventListener('click', event => {
            if (event.target === productModal) closeProductModal();
        });
        document.addEventListener('keydown', event => {
            if (!productModal.classList.contains('open')) return;
            if (event.key === 'Escape') {
                closeProductModal();
                return;
            }

            if (event.key === 'Tab') {
                const focusableElements = productModalPanel.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        });

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            const bagBtn = document.querySelector('.bag-btn');
            if (bagBtn) {
                bagBtn.onclick = function (e){
                    e.preventDefault();
                    openCart();
                };
            }

            const overlay = document.getElementById('cartOverlay');
            if (overlay) {
                overlay.addEventListener('click', closeCart);
            }

            updateBagBadge();
            renderCartItems();
        });

        function toggleMenu() {
            document.getElementById('mobileMenu').classList.toggle('active');
        }

        function toggleMobileFilters() {
            const btn = document.getElementById('toggleFiltersBtn');
            if(btn) btn.classList.toggle('open');
            const activeCat = document.querySelector('#mainFilters .chip.active')?.dataset.filter || 'all';
            const bar = getSubFilterBar(activeCat);
            if (bar) bar.classList.toggle('show-mobile');
        }

        function getSubFilterBar(category) {
            switch (category) {
                case 'jewelry': return document.getElementById('jewelrySubFilters');
                case 'accessories': return document.getElementById('accessoriesSubFilters');
                case 'perfume': return document.getElementById('perfumeSubFilters');
                case 'cosmetics': return document.getElementById('cosmeticsSubFilters');
                default: return null;
            }
        }

        const mainChips = document.querySelectorAll('#mainFilters .chip');
        const productCards = document.querySelectorAll('#productGrid .product-card');
        const productGrid = document.getElementById('productGrid');
        const sortSelect = document.querySelector('.sort-select');
        const searchInput = document.querySelector('#perfumeSubFilters .search-input');
        const flowersLayout = document.getElementById('flowersSpecialLayout');
        const subFilterBars = document.querySelectorAll('.sub-filter-bar');
        const originalProductOrder = new Map(
            Array.from(productCards, (card, index) => [card, index])
        );

        let currentCategory = 'all';
        let currentShopFor = 'all-shop';
        let currentType = 'all-types';
        let currentMetal = 'all-metals';
        let currentAcc = 'all-acc';
        let currentCos = 'all-cos';

        function getProductPrice(card) {
            const priceText = card.querySelector('.product-price').textContent;
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
            const sortMode = sortSelect ? sortSelect.value : 'best-selling';
            const sortedCards = Array.from(productCards);

            sortedCards.sort((a, b) => {
                if (sortMode === 'price-low-high') {
                    return getProductPrice(a) - getProductPrice(b) ||
                        originalProductOrder.get(a) - originalProductOrder.get(b);
                }
                if (sortMode === 'price-high-low') {
                    return getProductPrice(b) - getProductPrice(a) ||
                        originalProductOrder.get(a) - originalProductOrder.get(b);
                }
                if (sortMode === 'newest') {
                    const newestDifference =
                        Number(Boolean(b.querySelector('.new-pill'))) -
                        Number(Boolean(a.querySelector('.new-pill')));
                    return newestDifference ||
                        originalProductOrder.get(a) - originalProductOrder.get(b);
                }
                return getProductSales(b) - getProductSales(a) ||
                    originalProductOrder.get(a) - originalProductOrder.get(b);
            });

            const fragment = document.createDocumentFragment();
            sortedCards.forEach(card => fragment.appendChild(card));
            productGrid.appendChild(fragment);
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                sortProductCards();
                updateVisibility();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', updateVisibility);
        }

        mainChips.forEach(chip => {
            chip.addEventListener('click', () => {
                mainChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentCategory = chip.dataset.filter;
                resetSubFilters();
                updateVisibility();
                updateSubFilterBars();
            });
        });

        function resetSubFilters() {
            currentShopFor = 'all-shop';
            currentType = 'all-types';
            currentMetal = 'all-metals';
            currentAcc = 'all-acc';
            currentCos = 'all-cos';
            document.querySelectorAll('.sub-chip').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.sub-chip[data-shopfor="all-shop"], .sub-chip[data-type="all-types"], .sub-chip[data-metal="all-metals"], .sub-chip[data-acc="all-acc"], .sub-chip[data-cos="all-cos"]').forEach(c => c.classList.add('active'));
        }

        function updateSubFilterBars() {
            subFilterBars.forEach(bar => {
                bar.classList.remove('visible');
                bar.classList.remove('show-mobile');
            });
            const bar = getSubFilterBar(currentCategory);
            if (bar) bar.classList.add('visible');
        }

        document.querySelectorAll('.sub-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const row = chip.closest('.filter-chips');
                row.querySelectorAll('.sub-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                if (chip.dataset.shopfor) currentShopFor = chip.dataset.shopfor;
                if (chip.dataset.type) currentType = chip.dataset.type;
                if (chip.dataset.metal) currentMetal = chip.dataset.metal;
                if (chip.dataset.acc) currentAcc = chip.dataset.acc;
                if (chip.dataset.cos) currentCos = chip.dataset.cos;

                updateVisibility();
            });
        });

        function updateVisibility() {
            const searchTerm = currentCategory === 'perfume' && searchInput
                ? searchInput.value.trim().toLocaleLowerCase()
                : '';

            productCards.forEach(card => {
                const cat = card.dataset.category;
                let show = true;

                if (currentCategory !== 'all' && cat !== currentCategory) show = false;
                if (show && searchTerm) {
                    const searchableText = [
                        card.querySelector('.product-name').textContent,
                        getProductDescription(card)
                    ].join(' ').toLocaleLowerCase();
                    if (!searchableText.includes(searchTerm)) show = false;
                }

                if (show && currentCategory === 'jewelry') {
                    if (currentShopFor !== 'all-shop' && card.dataset.shopfor !== currentShopFor) show = false;
                    if (currentType !== 'all-types' && card.dataset.type !== currentType) show = false;
                    if (currentMetal !== 'all-metals' && card.dataset.metal !== currentMetal) show = false;
                }
                if (show && currentCategory === 'accessories') {
                    if (currentAcc !== 'all-acc' && card.dataset.acc !== currentAcc) show = false;
                }
                if (show && currentCategory === 'perfume') {
                    if (currentShopFor !== 'all-shop' && card.dataset.shopfor !== currentShopFor) show = false;
                }
                if (show && currentCategory === 'cosmetics') {
                    if (currentCos !== 'all-cos' && card.dataset.cos !== currentCos) show = false;
                }

                card.style.display = show ? '' : 'none';
            });

            if (flowersLayout) {
                flowersLayout.style.display = (currentCategory === 'flowers') ? 'block' : 'none';
            }
        }

        function applyFiltersFromUrl() {
            const params = new URLSearchParams(window.location.search);
            let requestedCategory = params.get('category');
            const shopFor = params.get('shopFor');
            const requestedProduct = params.get('product');
            const requestedProductCard = requestedProduct
                ? Array.from(productCards).find(card =>
                    card.querySelector('.product-name').textContent.trim() === requestedProduct
                )
                : null;

            if (requestedProduct && !requestedProductCard) {
                console.error(`The requested product is not in The Collection: ${requestedProduct}`);
                return;
            }
            if (!requestedCategory && requestedProductCard) {
                requestedCategory = requestedProductCard.dataset.category;
            }
            if (!['jewelry', 'accessories', 'perfume', 'flowers', 'cosmetics'].includes(requestedCategory)) return;

            const categoryChip = Array.from(mainChips).find(
                chip => chip.dataset.filter === requestedCategory
            );
            const filterBar = getSubFilterBar(requestedCategory);
            const shopForChip = filterBar && shopFor
                ? filterBar.querySelector(`.sub-chip[data-shopfor="${shopFor}"]`)
                : null;

            if (!categoryChip) return;

            categoryChip.click();
            if (shopForChip) shopForChip.click();
            if (filterBar) filterBar.classList.add('show-mobile');

            const toggleFiltersButton = document.getElementById('toggleFiltersBtn');
            if (toggleFiltersButton && filterBar) toggleFiltersButton.classList.add('open');
            if (requestedProductCard) {
                if (params.get('quickAdd') === '1') {
                    const quickAddButton = requestedProductCard.querySelector('.quick-add');
                    if (quickAddButton && !quickAddButton.disabled) {
                        handleProductQuickAdd(requestedProductCard, quickAddButton, true);
                    } else {
                        openProductModal(requestedProductCard);
                    }
                } else {
                    requestedProductCard.click();
                }
            }
        }

        // --- CAROUSEL SLIDER ---
        const slider = document.getElementById('slider');
        const slides = slider ? slider.querySelectorAll('.slide') : [];
        let currentSlide = 0;

        if (slider && slides.length > 0) {
            window.goToSlide = function(index) {
                currentSlide = index;
                slider.style.transform =
                    `translateX(-${currentSlide * 100}%)`;
            };

            window.nextSlide = function() {
                window.goToSlide((currentSlide + 1) % slides.length);
            };

            window.prevSlide = function() {
                window.goToSlide((currentSlide - 1 + slides.length) % slides.length);
            };

            const prevButton = document.getElementById('prevSlide');
            const nextButton = document.getElementById('nextSlide');

            if (prevButton) {
                prevButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.prevSlide();
                });
            }

            if (nextButton) {
                nextButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.nextSlide();
                });
            }

            let touchStartX = 0;
            let touchStartY = 0;

            slider.addEventListener('touchstart', function(e) {
                const touch = e.changedTouches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }, { passive: true });

            slider.addEventListener('touchend', function(e) {
                const touch = e.changedTouches[0];
                const deltaX = touch.clientX - touchStartX;
                const deltaY = touch.clientY - touchStartY;

                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX < 0) {
                        window.nextSlide();
                    } else {
                        window.prevSlide();
                    }
                }
            }, { passive: true });
        }

        // --- INITIALIZE FILTERS ---
        sortProductCards();
        updateSubFilterBars();
        applyFiltersFromUrl();
        updateVisibility();
    