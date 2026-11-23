window.bindAlboraInlineHandlers({
    "bag-event-1": function(event) {
        proceedToCheckout()
    },
    "bag-event-2": function(event) {
        removeItem(Number(this.dataset.alboraIndex))
    },
    "bag-event-3": function(event) {
        changeQty(Number(this.dataset.alboraIndex), 1)
    },
    "bag-event-4": function(event) {
        changeQty(Number(this.dataset.alboraIndex), -1)
    }
});

        let cart = window.alboraCartStorage.load();

        function saveCart() {
            window.alboraCartStorage.save(cart);
        }

        function escapeCartText(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function getCartCustomizationDetails(item) {
            const options = item.customizations && typeof item.customizations === 'object'
                ? item.customizations
                : {};
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
            if (options.perfumeSize) labels.push(`Size: ${options.perfumeSize}`);
            if (options.perfumeBox === 'paid') labels.push('Add 10 ml Box (+₱15)');
            if (options.perfumeBox === 'included') labels.push('Box included (free)');
            if (options.perfumeBox === 'none') labels.push('No box selected');
            if (options.giftPackaging) {
                labels.push(`Packaging: ${options.giftPackagingLabel || options.giftPackaging}`);
            }

            const detailLines = labels.map(label =>
                `<p class="cart-customization">${escapeCartText(label)}</p>`
            ).join('');
            const chargeLines = Array.isArray(item.additionalCharges)
                ? item.additionalCharges.filter(charge => Number(charge.amount) > 0).map(charge =>
                    `<p class="cart-customization cart-charge">${escapeCartText(charge.label)} · ₱${Number(charge.amount).toLocaleString()} each</p>`
                ).join('')
                : '';
            return detailLines + chargeLines;
        }

        function renderCart() {
            const container = document.getElementById('cartContent');

            if (cart.length === 0) {
                container.innerHTML = `<p class="albora-inline-1857452b483b">Your bag is empty. <a class="empty-cart-link" href="index.html#collection">Continue shopping</a></p>`;
                return;
            }

            let itemsHTML = '';
            let subtotal = 0;

            cart.forEach((item, index) => {
                let safePrice = Number(item.price) || 0;
                let safeQty = Number(item.qty) || 1;
                let safeCat = item.category || 'Item';
                
                subtotal += safePrice * safeQty;
                const customizationDetails = getCartCustomizationDetails(item);

                itemsHTML += `
                    <div class="cart-item">
                        <div class="cart-item-art">${item.image || ''}</div>
                        <div class="cart-item-info">
                            <div class="cart-item-cat">${escapeCartText(safeCat)}</div>
                            <h3>${escapeCartText(item.name)}</h3>
                            ${customizationDetails}
                            <div class="cart-item-price">₱${safePrice.toLocaleString()}</div>
                        </div>
                        <div class="cart-qty">
                            <button data-albora-event-id="bag-event-4" data-albora-event-type="click" data-albora-index="${index}">−</button>
                            <span>${safeQty}</span>
                            <button data-albora-event-id="bag-event-3" data-albora-event-type="click" data-albora-index="${index}">+</button>
                        </div>
                        <button class="remove-btn" data-albora-event-id="bag-event-2" data-albora-event-type="click" data-albora-index="${index}">✖</button>
                    </div>
                `;
            });

            container.innerHTML = `
                ${itemsHTML}
                <div class="cart-summary">
                    <div class="summary-row"><span>Subtotal</span><span>₱${subtotal.toLocaleString()}</span></div>
                    <div class="summary-row"><span>Shipping</span><span>Added after payment verification</span></div>
                    <div class="summary-row total">
                        <span>Pay now</span><span>₱${subtotal.toLocaleString()}</span>
                    </div>
                    <button class="checkout-btn" data-albora-event-id="bag-event-1" data-albora-event-type="click">Proceed to Checkout</button>
                </div>
            `;
        }

        function changeQty(index, change) {
            cart[index].qty += change;
            if (cart[index].qty <= 0) cart.splice(index, 1);
            saveCart();
            renderCart();
        }

        function removeItem(index) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
        }

        renderCart();
            function proceedToCheckout() {
            // 1. I-check kung may laman yung cart
            let cart = window.alboraCartStorage.load();
            if (cart.length === 0) {
                alert("Your bag is empty!");
                return;
            }

            // 2. I-check kung naka-login na ba (may 'alboraUser' ba sa localStorage?)
            if (window.alboraIsLoggedIn()) {
                // Kung naka-login na, diretso checkout
                window.location.href = 'checkout.html';
            } else {
                // Kung hindi pa, ipadala sa login page
                alert("Please log in or create an account to proceed to checkout.");
                window.location.href = 'login.html?redirect=checkout';
            }
        }
    