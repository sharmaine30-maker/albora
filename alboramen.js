window.bindAlboraInlineHandlers({
    "alboramen-event-1": function(event) {
        proceedToCheckout()
    },
    "alboramen-event-2": function(event) {
        toggleCart()
    },
    "alboramen-event-3": function(event) {
        toggleCart()
    },
    "alboramen-event-4": function(event) {
        addToBag(event)
    },
    "alboramen-event-5": function(event) {
        addToBag(event)
    },
    "alboramen-event-6": function(event) {
        addToBag(event)
    },
    "alboramen-event-7": function(event) {
        addToBag(event)
    },
    "alboramen-event-8": function(event) {
        toggleMenu()
    },
    "alboramen-event-9": function(event) {
        removeItem(Number(this.dataset.alboraIndex))
    },
    "alboramen-event-10": function(event) {
        changeQty(Number(this.dataset.alboraIndex), 1)
    },
    "alboramen-event-11": function(event) {
        changeQty(Number(this.dataset.alboraIndex), -1)
    }
});

        let cart = window.alboraCartStorage.load();

        function saveCart() {
            window.alboraCartStorage.save(cart);
            updateHeaderCount();
        }

        function updateHeaderCount() {
            let totalQty = cart.reduce((sum, item) => {
                return sum + Number(item.qty || 0);
            }, 0);

            document.getElementById('headerCartCount').innerText = totalQty;
        }

        function toggleCart() {
            const drawer = document.getElementById('cartDrawer');
            const overlay = document.getElementById('cartOverlay');

            drawer.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        function toggleMenu() {
            document.getElementById('mobileMenu').classList.toggle('active');
        }

        document.querySelector('.bag-btn').addEventListener('click', event => {
            event.preventDefault();
            toggleCart();
        });

        function showToast(productName) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');

            toast.className = 'toast';

            toast.innerHTML = `
                <div class="toast-icon">✓</div>
                <div class="toast-message">"${productName}" Added to Bag</div>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('show');

                setTimeout(() => {
                    toast.remove();
                }, 400);

            }, 3000);
        }

        function addToBag(event) {
            const addButton = event.currentTarget;
            if (addButton.dataset.quickAddPending === 'true') return;
            addButton.dataset.quickAddPending = 'true';
            window.setTimeout(() => {
                delete addButton.dataset.quickAddPending;
            }, 350);
            event.stopPropagation();
            const card = event.currentTarget.closest('.product-card');
            const name = card.querySelector('.product-title').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent;
            const priceMatch = priceText.match(/[\d,]+/);
            const price = priceMatch ? Number(priceMatch[0].replace(/,/g, '')) : 0;
            if (!name || price <= 0) return;
            const details = window.alboraProductOptions.createCustomizations({
                category: card.dataset.category,
                jewelryOptionType: card.dataset.type === 'necklace' ? 'necklace-length' :
                    card.dataset.type === 'ring' ? 'ring-size' : 'finish',
                necklaceLength: '18 in',
                ringSize: '6',
                finish: card.dataset.metal || 'gold',
                jewelryBoxSelected: false,
                jewelryBoxPrice: 0,
                perfumeSize: card.dataset.category === 'perfume' ? '10ml' : '',
                perfumeBoxChecked: false,
                perfumeBoxPrice: 0,
                packaging: {
                    value: 'none',
                    label: 'No Gift Packaging',
                    price: 0
                }
            });
            addProductToCart({
                name,
                price,
                basePrice: price,
                category: card.dataset.category,
                qty: 1,
                image: '',
                customizations: details.customizations,
                additionalCharges: details.additionalCharges
            });
        }

        function addProductToCart(item, redirectTo = 'home') {
            if (window.alboraQueuePendingItem(item, redirectTo)) return false;
            const existingItem = cart.find(savedItem =>
                savedItem.name === item.name &&
                (savedItem.category || 'general') === item.category &&
                Number(savedItem.price) === Number(item.price) &&
                JSON.stringify(savedItem.customizations || {}) ===
                    JSON.stringify(item.customizations || {})
            );
            if (existingItem) existingItem.qty = (Number(existingItem.qty) || 0) + Number(item.qty || 1);
            else cart.push(item);
            saveCart();
            renderCart();
            showToast(item.name);
            return true;
        }

        const productDialog = document.getElementById('bestSellerProductDialog');
        const dialogName = document.getElementById('bestSellerDialogName');
        const dialogPrice = document.getElementById('bestSellerDialogPrice');
        const giftPackagingGroup = document.getElementById('bestSellerGiftPackagingGroup');
        const giftPackagingInputs = productDialog.querySelectorAll('input[name="bestSellerPackaging"]');
        let selectedBestSeller = null;
        let dialogQuantity = 1;
        let dialogPricePrefix = '';
        let previouslyFocusedElement = null;

        function setGiftPackagingSelection(input) {
            if (!input) return;
            productDialog.querySelectorAll('.product-packaging-option').forEach(option => {
                option.classList.toggle('is-selected', option.contains(input));
            });
        }

        giftPackagingInputs.forEach(input => {
            input.addEventListener('change', () => {
                setGiftPackagingSelection(input);
                updateModalOptionTotal();
            });
        });

        function updateModalOptionTotal() {
            if (!selectedBestSeller) return;
            const isPerfume = selectedBestSeller.dataset.category === 'perfume';
            const boxCharge = selectedBestSeller.dataset.category === 'jewelry' &&
                document.getElementById('bestSellerJewelryBox').checked ? 80 : 0;
            const perfumeSize = document.querySelector('[data-best-seller-option="perfume-size"]:checked')?.value;
            const perfumeBoxCharge = isPerfume &&
                perfumeSize === '10ml' && document.getElementById('bestSellerPerfumeBox').checked ? 15 : 0;
            const selectedPackaging = productDialog.querySelector('input[name="bestSellerPackaging"]:checked');
            const packagingCharge = !giftPackagingGroup.hidden && selectedPackaging
                ? Number(selectedPackaging.dataset.price) || 0
                : 0;
            const basePrice = Number(selectedBestSeller.dataset.basePrice);
            const pricing = window.alboraProductOptions.getPricing({
                basePrice,
                packagingPrice: packagingCharge,
                perfumeBoxPrice: perfumeBoxCharge,
                jewelryBoxPrice: boxCharge
            });
            dialogPrice.textContent = `${dialogPricePrefix}₱${pricing.unitPrice.toLocaleString()}`;

            const perfumeTotal = document.getElementById('bestSellerPerfumeOptionTotal');
            const jewelryTotal = document.getElementById('bestSellerJewelryOptionTotal');
            perfumeTotal.hidden = !isPerfume;
            jewelryTotal.hidden = isPerfume;
            const totalText = `Selected total: ₱${pricing.unitPrice.toLocaleString()}`;
            perfumeTotal.textContent = isPerfume ? totalText : '';
            jewelryTotal.textContent = isPerfume ? '' : totalText;
            const sizeSelected = Boolean(perfumeSize);
            document.getElementById('bestSellerDialogAdd').disabled = isPerfume && !sizeSelected;
            document.getElementById('bestSellerDialogBuy').disabled = isPerfume && !sizeSelected;
        }

        function updateBestSellerPerfumeBox() {
            const size = document.querySelector('[data-best-seller-option="perfume-size"]:checked')?.value;
            const perfumeBox = document.getElementById('bestSellerPerfumeBox');
            const label = document.getElementById('bestSellerPerfumeBoxLabel');
            const note = document.getElementById('bestSellerPerfumeBoxNote');
            if (size === '10ml') {
                perfumeBox.checked = false;
                perfumeBox.disabled = false;
                label.textContent = 'Add 10 ml Box (+₱15)';
                note.textContent = 'Optional for 10 ml (+₱15); included free with 30 ml and 50 ml.';
            } else if (size) {
                perfumeBox.checked = true;
                perfumeBox.disabled = true;
                label.textContent = 'Box included (free)';
                note.textContent = 'A box is included free with 30 ml and 50 ml.';
            } else {
                perfumeBox.checked = false;
                perfumeBox.disabled = false;
                label.textContent = 'Add 10 ml Box (+₱15)';
                note.textContent = 'Optional for 10 ml (+₱15); included free with 30 ml and 50 ml.';
            }
            updateModalOptionTotal();
        }

        function configureProductOptions(card) {
            const isPerfume = card.dataset.category === 'perfume';
            const isNecklace = card.dataset.type === 'necklace';
            const isRing = card.dataset.type === 'ring';
            giftPackagingGroup.hidden = card.dataset.category === 'flowers';
            document.getElementById('bestSellerPerfumeOptions').hidden = !isPerfume;
            document.getElementById('bestSellerJewelryOptions').hidden = isPerfume;
            document.getElementById('bestSellerPerfumeBoxNote').hidden = !isPerfume;
            document.getElementById('bestSellerJewelryLegend').textContent =
                isNecklace ? 'Choose Length' : isRing ? 'Choose Size' : 'Choose Finish';
            document.querySelectorAll('[data-best-seller-type]').forEach(label => {
                label.hidden = label.dataset.bestSellerType === 'necklace'
                    ? !isNecklace
                    : label.dataset.bestSellerType === 'ring' ? !isRing : isNecklace || isRing;
            });
            document.getElementById('bestSellerJewelryBoxGroup').hidden = isPerfume;
            document.getElementById('bestSellerPerfumeBoxGroup').hidden = !isPerfume;
            document.getElementById('bestSellerPerfumeBox').checked = false;
            document.getElementById('bestSellerPerfumeBox').disabled = false;
            document.getElementById('bestSellerPerfumeBoxLabel').textContent = 'Add 10 ml Box (+₱15)';
            document.getElementById('bestSellerJewelryBox').checked = false;
            document.getElementById('bestSellerJewelryBoxLabel').textContent =
                card.dataset.type === 'necklace' ? 'Add Necklace Box' :
                    card.dataset.type === 'ring' ? 'Add Ring Box' :
                        card.dataset.type === 'bracelet' ? 'Add Bracelet Box' : 'Add Earrings Box';
            const defaultPackaging = productDialog.querySelector('input[name="bestSellerPackaging"][value="none"]');
            giftPackagingInputs.forEach(input => {
                input.checked = input === defaultPackaging;
            });
            setGiftPackagingSelection(defaultPackaging);
            document.querySelectorAll('[data-best-seller-option]').forEach(option => {
                const isDefault = isPerfume
                    ? false
                    : isNecklace
                        ? option.dataset.bestSellerOption === 'necklace-length' && option.value === '18 in'
                        : isRing
                            ? option.dataset.bestSellerOption === 'ring-size' && option.value === '6'
                        : option.dataset.bestSellerOption === 'finish' &&
                            option.value === (card.dataset.metal || 'gold');
                option.checked = isDefault;
            });
            if (isPerfume) updateBestSellerPerfumeBox();
            else updateModalOptionTotal();
        }

        function openProductModal(card) {
            selectedBestSeller = card;
            previouslyFocusedElement = document.activeElement;
            dialogQuantity = 1;
            const name = card.querySelector('.product-title').textContent.trim();
            const priceText = card.querySelector('.product-price').textContent;
            const price = Number((priceText.match(/[\d,]+/) || ['0'])[0].replace(/,/g, ''));
            card.dataset.basePrice = String(price);
            dialogPricePrefix = /^From\b/i.test(priceText.trim()) ? 'From ' : '';
            dialogName.textContent = name;
            document.getElementById('bestSellerDialogCategory').textContent =
                (card.dataset.category || 'Product').replace(/-/g, ' ');
            document.getElementById('bestSellerDialogDescription').textContent =
                card.dataset.description || '';
            document.getElementById('bestSellerDialogMeta').textContent =
                card.querySelector('.product-rating')?.textContent.trim() || '';
            document.getElementById('bestSellerDialogStock').textContent =
                card.querySelector('.product-stock')?.textContent.trim() || 'Stock availability not listed';
            document.getElementById('bestSellerDialogQuantity').textContent = '1';
            configureProductOptions(card);
            productDialog.showModal();
        }

        productDialog.addEventListener('close', () => {
            selectedBestSeller = null;
            if (previouslyFocusedElement && previouslyFocusedElement.isConnected) {
                previouslyFocusedElement.focus();
            }
            previouslyFocusedElement = null;
        });

        function closeProductModal() {
            if (productDialog.open) productDialog.close();
        }

        function getBestSellerDialogItem() {
            if (!selectedBestSeller) return null;
            const category = selectedBestSeller.dataset.category;
            const name = dialogName.textContent;
            const basePrice = Number(selectedBestSeller.dataset.basePrice);
            const selectedPackaging = productDialog.querySelector('input[name="bestSellerPackaging"]:checked');
            const isPerfume = category === 'perfume';
            const jewelryBoxSelected = !isPerfume && document.getElementById('bestSellerJewelryBox').checked;
            const perfumeSize = isPerfume
                ? document.querySelector('[data-best-seller-option="perfume-size"]:checked')?.value
                : '';
            if (isPerfume && !perfumeSize) return null;
            const perfumeBoxChecked = isPerfume && document.getElementById('bestSellerPerfumeBox').checked;
            const packagingPrice = !giftPackagingGroup.hidden && selectedPackaging
                ? Number(selectedPackaging.dataset.price) || 0
                : 0;
            const perfumeBoxPrice = isPerfume && perfumeSize === '10ml' && perfumeBoxChecked ? 15 : 0;
            const jewelryBoxPrice = jewelryBoxSelected ? 80 : 0;
            const pricing = window.alboraProductOptions.getPricing({
                basePrice,
                packagingPrice,
                perfumeBoxPrice,
                jewelryBoxPrice
            });
            const details = window.alboraProductOptions.createCustomizations({
                category,
                jewelryOptionType: selectedBestSeller.dataset.type === 'necklace' ? 'necklace-length' :
                    selectedBestSeller.dataset.type === 'ring' ? 'ring-size' : 'finish',
                necklaceLength: document.querySelector('[data-best-seller-option="necklace-length"]:checked')?.value,
                ringSize: document.querySelector('[data-best-seller-option="ring-size"]:checked')?.value,
                finish: document.querySelector('[data-best-seller-option="finish"]:checked')?.value,
                jewelryBoxSelected,
                jewelryBoxLabel: document.getElementById('bestSellerJewelryBoxLabel').textContent,
                jewelryBoxPrice,
                perfumeSize,
                perfumeBoxChecked,
                perfumeBoxPrice,
                packaging: !giftPackagingGroup.hidden && selectedPackaging
                    ? {
                        value: selectedPackaging.value,
                        label: selectedPackaging.dataset.label,
                        price: packagingPrice
                    }
                    : null
            });

            return {
                name,
                price: pricing.unitPrice,
                basePrice,
                category,
                qty: dialogQuantity,
                image: '',
                customizations: details.customizations,
                additionalCharges: details.additionalCharges
            };
        }

        document.querySelectorAll('[data-best-seller-option]').forEach(option => {
            option.addEventListener('change', () => {
                if (option.dataset.bestSellerOption === 'perfume-size') updateBestSellerPerfumeBox();
                else updateModalOptionTotal();
            });
        });
        ['bestSellerJewelryBox', 'bestSellerPerfumeBox'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateModalOptionTotal);
        });
        document.getElementById('bestSellerQuantityMinus').addEventListener('click', () => {
            dialogQuantity = Math.max(1, dialogQuantity - 1);
            document.getElementById('bestSellerDialogQuantity').textContent = String(dialogQuantity);
        });
        document.getElementById('bestSellerQuantityPlus').addEventListener('click', () => {
            dialogQuantity += 1;
            document.getElementById('bestSellerDialogQuantity').textContent = String(dialogQuantity);
        });
        document.getElementById('bestSellerDialogClose').addEventListener('click', closeProductModal);
        productDialog.addEventListener('click', event => {
            if (event.target === productDialog) closeProductModal();
        });
        document.addEventListener('keydown', event => {
            if (!productDialog.open || event.key !== 'Escape') return;
            event.preventDefault();
            closeProductModal();
        });
        document.getElementById('bestSellerDialogAdd').addEventListener('click', () => {
            const item = getBestSellerDialogItem();
            if (!item) return;
            addProductToCart(item);
            closeProductModal();
        });
        document.getElementById('bestSellerDialogBuy').addEventListener('click', () => {
            const item = getBestSellerDialogItem();
            if (!item) return;
            const guest = !window.alboraIsLoggedIn();
            const addedToCart = addProductToCart(item, 'checkout');
            closeProductModal();
            if (!guest && addedToCart) window.location.href = 'checkout.html';
        });

        const bestSellerGrid = document.querySelector('.best-sellers .product-grid');
        function initializeBestSellerCard(card) {
            const title = card.querySelector('.product-title');
            const price = card.querySelector('.product-price');
            const name = title ? title.textContent.trim() : '';
            const priceText = price ? price.textContent : '';
            const priceMatch = priceText.match(/[\d,]+/);
            const addButton = card.querySelector('.add-btn');
            const productReady = Boolean(name && priceMatch && Number(priceMatch[0].replace(/,/g, '')) > 0);
            if (addButton) addButton.disabled = !productReady;
            if (addButton) addButton.style.pointerEvents = productReady ? '' : 'none';
            if (addButton && productReady) addButton.setAttribute('aria-label', `Quick add ${name} to bag`);
            if (!productReady) {
                card.setAttribute('aria-disabled', 'true');
                return false;
            }
            card.removeAttribute('aria-disabled');
            card.style.cursor = 'pointer';
            return true;
        }

        bestSellerGrid.querySelectorAll('.product-card').forEach(initializeBestSellerCard);
        bestSellerGrid.addEventListener('click', event => {
            const card = event.target.closest('.product-card');
            if (!card || !bestSellerGrid.contains(card) || event.target.closest('.add-btn')) return;
            event.preventDefault();
            if (initializeBestSellerCard(card)) openProductModal(card);
        });
        const bestSellerObserver = new MutationObserver(records => {
            records.forEach(record => {
                const targetElement = record.target.nodeType === Node.ELEMENT_NODE
                    ? record.target
                    : record.target.parentElement;
                const parentCard = targetElement && targetElement.closest('.product-card');
                if (parentCard && bestSellerGrid.contains(parentCard)) initializeBestSellerCard(parentCard);
                record.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    if (node.matches('.product-card')) initializeBestSellerCard(node);
                    node.querySelectorAll('.product-card').forEach(initializeBestSellerCard);
                });
            });
        });
        bestSellerObserver.observe(bestSellerGrid, { childList: true, subtree: true });

        function escapeCartHtml(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function getCartItemDetails(item) {
            const options = item.customizations && typeof item.customizations === 'object'
                ? item.customizations
                : {};
            const labels = [];
            if (item.details) labels.push(`Gift details: ${item.details}`);
            if (options.necklaceLength) labels.push(`Length: ${options.necklaceLength}`);
            if (options.finish) labels.push(`Finish: ${options.finish}`);
            if (options.jewelryBox) labels.push(options.jewelryBox);
            if (options.perfumeSize) labels.push(`Size: ${options.perfumeSize}`);
            if (options.perfumeBox === 'paid') labels.push('Add 10 ml Box (+₱15)');
            if (options.perfumeBox === 'included') labels.push('Box included (free)');
            if (options.perfumeBox === 'none') labels.push('No box selected');
            if (options.giftPackaging) {
                labels.push(`Packaging: ${options.giftPackagingLabel || options.giftPackaging}`);
            }
            const details = labels.map(label =>
                `<p class="albora-inline-6347a6b45f24">${escapeCartHtml(label)}</p>`
            ).join('');
            const charges = (Array.isArray(item.additionalCharges) ? item.additionalCharges : [])
                .filter(charge => Number(charge.amount) > 0)
                .map(charge => `<p class="albora-inline-293d3bfc9721">${escapeCartHtml(charge.label)} · ₱${Number(charge.amount).toLocaleString()} each</p>`)
                .join('');
            return details + charges;
        }

        function renderCart() {

            const container = document.getElementById('cartContent');
            const footer = document.getElementById('cartFooter');

            updateHeaderCount();

            if (cart.length === 0) {

                container.innerHTML = `
                    <p class="albora-inline-4a6fee92025b">
                        Your bag is empty.
                    </p>
                `;

                footer.style.display = 'none';
                return;
            }

            let itemsHTML = '';
            let subtotal = 0;

            cart.forEach((item, index) => {

                let safePrice = Number(item.price) || 0;
                let safeQty = Number(item.qty) || 1;
                let safeCat = item.category || 'Item';

                subtotal += safePrice * safeQty;

                itemsHTML += `
                    <div class="cart-item">

                        <div class="cart-item-art">
                            ${item.image || ''}
                        </div>

                        <div class="cart-item-info">

                            <h3>${escapeCartHtml(item.name)}</h3>

                            <div class="cart-item-cat">
                                ${escapeCartHtml(safeCat)}
                            </div>

                            ${getCartItemDetails(item)}

                            <div class="cart-qty">
                                <button data-albora-event-id="alboramen-event-11" data-albora-event-type="click" data-albora-index="${index}">−</button>

                                <span>${safeQty}</span>

                                <button data-albora-event-id="alboramen-event-10" data-albora-event-type="click" data-albora-index="${index}">+</button>
                            </div>

                            <button class="remove-btn"
                                data-albora-event-id="alboramen-event-9" data-albora-event-type="click" data-albora-index="${index}">
                                Remove
                            </button>

                        </div>

                        <div class="cart-item-price-col">
                            ₱${(safePrice * safeQty).toLocaleString()}
                        </div>

                    </div>
                `;
            });

            container.innerHTML = itemsHTML;

            footer.style.display = 'block';

            document.getElementById('cartSubtotal').innerText =
                `₱${subtotal.toLocaleString()}`;
        }

        function changeQty(index, change) {

            cart[index].qty = Number(cart[index].qty || 0) + change;

            if (cart[index].qty <= 0) {
                cart.splice(index, 1);
            }

            saveCart();
            renderCart();
        }

        function removeItem(index) {

            cart.splice(index, 1);

            saveCart();
            renderCart();
        }

        function proceedToCheckout() {

            if (cart.length === 0) {
                alert("Your bag is empty!");
                return;
            }

            if (window.alboraIsLoggedIn()) {

                window.location.href = 'checkout.html';

            } else {

                alert("Please log in or create an account to proceed to checkout.");

                window.location.href = 'login.html?redirect=checkout';
            }
        }

        renderCart();
    