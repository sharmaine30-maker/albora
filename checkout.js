window.bindAlboraInlineHandlers({
    "checkout-event-1": function(event) {
        placeOrder()
    },
    "checkout-event-2": function(event) {
        selectPayment('maribank', this)
    },
    "checkout-event-3": function(event) {
        selectPayment('gcash', this)
    }
});

if (!window.alboraIsLoggedIn()) {
    window.location.replace('login.html?redirect=checkout');
}

        let cart = window.alboraCartStorage.load();

        // Render items pagka-load ng page
        document.addEventListener('DOMContentLoaded', () => {
            renderCheckoutSummary();
        });

        function escapeCheckoutText(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function getCheckoutCustomizationDetails(item) {
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

            const details = labels.map(label =>
                `<p class="summary-customization">${escapeCheckoutText(label)}</p>`
            ).join('');
            const charges = Array.isArray(item.additionalCharges)
                ? item.additionalCharges.filter(charge => Number(charge.amount) > 0).map(charge =>
                    `<p class="summary-customization summary-charge">${escapeCheckoutText(charge.label)} · ₱${Number(charge.amount).toLocaleString()} each</p>`
                ).join('')
                : '';
            return details + charges;
        }

        function renderCheckoutSummary() {
            const container = document.getElementById('checkoutItems');
            container.innerHTML = '';
            let subtotal = 0;

            if (cart.length === 0) {
                container.innerHTML = '<p class="albora-inline-d20375032c52">Your cart is empty. Add products before placing your order.</p>';
            } else {
                cart.forEach((item, index) => {
                    let safePrice = Number(item.price) || 0;
                    let safeQty = Math.max(1, Number(item.qty) || 1);
                    subtotal += safePrice * safeQty;
                    const variantText = item.selectedVariant || item.variant || '';
                    const customizationDetails = getCheckoutCustomizationDetails(item);

                    container.innerHTML += `
                        <div class="summary-item">
                            <div class="summary-item-left">
                                <div class="summary-img">
                                    ${item.image || '<svg viewBox="0 0 100 125"><circle cx="50" cy="50" r="25" fill="#C5A253" opacity="0.8"/></svg>'}
                                </div>
                                <div class="summary-info">
                                    <h4>${escapeCheckoutText(item.name)}</h4>
                                    <p>${escapeCheckoutText(item.category || 'Item')} · Qty ${safeQty}${variantText ? ` · ${escapeCheckoutText(variantText)}` : ''}</p>
                                    ${customizationDetails}
                                    <div class="summary-quantity-controls" aria-label="Quantity controls for ${item.name}">
                                        <button type="button" class="summary-quantity-button" data-action="decrease" data-index="${index}" aria-label="Decrease quantity of ${item.name}">−</button>
                                        <span class="summary-quantity-value" aria-live="polite">${safeQty}</span>
                                        <button type="button" class="summary-quantity-button" data-action="increase" data-index="${index}" aria-label="Increase quantity of ${item.name}">+</button>
                                        <button type="button" class="summary-delete-button" data-action="remove" data-index="${index}" aria-label="Delete ${item.name}">🗑</button>
                                    </div>
                                </div>
                            </div>
                            <div class="summary-price">₱${(safePrice * safeQty).toLocaleString()}</div>
                        </div>
                    `;
                });
            }

            document.getElementById('checkoutSubtotal').textContent = '₱' + subtotal.toLocaleString();
            document.getElementById('checkoutTotal').textContent = '₱' + subtotal.toLocaleString();
            document.getElementById('btnTotal').textContent = '₱' + subtotal.toLocaleString();
            document.getElementById('qrTotalAmount').textContent = '₱' + subtotal.toLocaleString();
        }

        function changeCheckoutItemQuantity(index, change) {
            const item = cart[index];
            if (!item) return;

            item.qty = Math.max(1, (Number(item.qty) || 1) + change);
            saveCheckoutCart();
            renderCheckoutSummary();
        }

        function removeCheckoutItem(index) {
            const item = cart[index];
            if (!item) return;
            if (!window.confirm(`Remove "${item.name}" from your cart?`)) return;

            cart.splice(index, 1);
            saveCheckoutCart();
            renderCheckoutSummary();
        }

        function saveCheckoutCart() {
            window.alboraCartStorage.save(cart);
            const badge = document.querySelector('.bag-badge');
            if (badge) {
                badge.textContent = cart.reduce((total, item) => total + (Number(item.qty) || 0), 0);
            }
        }

        document.getElementById('checkoutItems').addEventListener('click', event => {
            const actionButton = event.target.closest('[data-action]');
            if (!actionButton) return;

            const index = Number(actionButton.dataset.index);
            if (!Number.isInteger(index)) return;
            if (actionButton.dataset.action === 'decrease') changeCheckoutItemQuantity(index, -1);
            if (actionButton.dataset.action === 'increase') changeCheckoutItemQuantity(index, 1);
            if (actionButton.dataset.action === 'remove') removeCheckoutItem(index);
        });

        function selectPayment(method, element) {
            // Alisin active sa lahat
            document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('active'));
            // Gawing active yung pinindot
            element.classList.add('active');
            
            // Palitan yung text sa QR
            const label = document.getElementById('qrLabel');
            const qrBox = document.getElementById('qrBox');

            if (method === 'gcash') {
                label.textContent = "SCAN TO PAY WITH GCASH";
                qrBox.textContent = "Your GCash QR code goes here";
            } else {
                label.textContent = "SCAN TO PAY WITH MARIBANK";
                qrBox.textContent = "Your Maribank QR code goes here";
            }
        }
                   
                   function placeOrder() {
            const ownerEmail = (localStorage.getItem('alboraUser') || '').trim().toLowerCase();
            if (!ownerEmail) {
                window.location.href = 'login.html?redirect=checkout';
                return;
            }

            if (cart.length === 0) {
                alert("Your bag is empty!");
                return;
            }
            
            // Kunin ang mga info sa form
            const requiredFields = Array.from(document.querySelectorAll('.checkout-required'));
            const missingField = requiredFields.find(field => !field.value.trim());
            if (missingField) {
                missingField.setCustomValidity('Please complete this field.');
                missingField.reportValidity();
                missingField.focus();
                return;
            }
            requiredFields.forEach(field => field.setCustomValidity(''));

            const fullName = document.getElementById('checkoutName').value.trim();
            const mobile = document.getElementById('checkoutMobile').value.trim();
            const messenger = document.getElementById('checkoutMessenger').value.trim();
            const houseStreet = document.getElementById('checkoutStreet').value.trim();
            const barangay = document.getElementById('checkoutBarangay').value.trim();
            const city = document.getElementById('checkoutCity').value.trim();
            const province = document.getElementById('checkoutProvince').value.trim();
            const postalCode = document.getElementById('checkoutPostalCode').value.trim();
            const riderNote = document.getElementById('checkoutRiderNote').value.trim();
            const refNo = document.getElementById('paymentReferenceNo').value.trim();
            const paymentMethod = document.querySelector('input[name="payment"]:checked');
            if (!paymentMethod) {
                alert('Please select a payment method.');
                return;
            }

            const fullAddress = `${houseStreet}, ${barangay}, ${city}, ${province} ${postalCode}`;

            // I-save ang order
            const storedOrders = localStorage.getItem('alboraOrders');
            let orders = [];
            if (storedOrders) {
                try {
                    orders = JSON.parse(storedOrders);
                    if (!Array.isArray(orders)) throw new TypeError('Saved orders must be an array.');
                } catch (error) {
                    console.error('Unable to read saved orders before checkout.', error);
                    alert('Your saved orders could not be updated. Please check browser storage and try again.');
                    return;
                }
            }
            let newOrder = {
                id: "ALB-" + Math.floor(Math.random() * 1000000),
                date: new Date().toLocaleString(),
                items: cart,
                total: document.getElementById('checkoutTotal').innerText,
                ownerEmail: ownerEmail,
                status: "Pending",
                customer: {
                    name: fullName,
                    phone: mobile,
                    address: fullAddress,
                    postalCode: postalCode,
                    contactHandle: messenger,
                    riderNote: riderNote,
                    email: ownerEmail
                },
                paymentMethod: paymentMethod.value,
                referenceNo: refNo
            };
            
            orders.push(newOrder);
            localStorage.setItem('alboraOrders', JSON.stringify(orders));

            window.alboraCartStorage.save([]);

            // Lumipat sa success.html
            window.location.href = 'success.html';
        }
    