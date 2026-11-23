
        const ordersList = document.getElementById('ordersList');
        const currentUser = (localStorage.getItem('alboraUser') || '').trim().toLowerCase();
        const orderLookup = (new URLSearchParams(window.location.search).get('order') || '').trim().toUpperCase();
        const logoutLink = document.getElementById('logoutLink');

        function logout() {
            window.alboraCartStorage.logout();
            window.location.href = 'index.html';
        }

        if (currentUser && logoutLink) {
            logoutLink.hidden = false;
            logoutLink.addEventListener('click', event => {
                event.preventDefault();
                logout();
            });
        }

        function readOrders() {
            const storedOrders = localStorage.getItem('alboraOrders');
            if (!storedOrders) return [];

            try {
                const orders = JSON.parse(storedOrders);
                if (!Array.isArray(orders)) {
                    throw new TypeError('Saved orders must be an array.');
                }
                return orders;
            } catch (error) {
                console.error('Unable to read saved orders from localStorage.', error);
                ordersList.textContent = 'Your orders could not be loaded. Please try again later.';
                return null;
            }
        }

        function appendText(parent, tagName, className, text) {
            const element = document.createElement(tagName);
            if (className) element.className = className;
            element.textContent = text;
            parent.appendChild(element);
            return element;
        }

        function getOrderItemOptions(item) {
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
            return {
                labels,
                charges: Array.isArray(item.additionalCharges)
                    ? item.additionalCharges.filter(charge => Number(charge.amount) > 0)
                    : []
            };
        }

        function renderOrder(order, index) {
            const card = document.createElement('article');
            card.className = 'order-card';

            const top = document.createElement('div');
            top.className = 'order-top';
            const heading = document.createElement('div');
            appendText(heading, 'h2', 'order-id', order.id || 'Order');
            appendText(heading, 'div', 'order-date', order.date || 'Date unavailable');
            top.appendChild(heading);

            const statusName = String(order.status || 'Pending').trim();
            const status = appendText(top, 'span', 'status', statusName);
            const normalizedStatus = statusName.toLowerCase();
            if (['processing', 'shipped', 'completed', 'cancelled'].includes(normalizedStatus)) {
                status.classList.add(normalizedStatus);
            }
            card.appendChild(top);

            const itemContainer = document.createElement('div');
            itemContainer.className = 'order-items';
            (Array.isArray(order.items) ? order.items : []).forEach(item => {
                const row = document.createElement('div');
                row.className = 'order-item';
                const itemInfo = document.createElement('div');
                itemInfo.className = 'order-item-info';
                appendText(itemInfo, 'div', '', item.name || 'Item');
                const itemOptions = getOrderItemOptions(item);
                itemOptions.labels.forEach(label =>
                    appendText(itemInfo, 'span', 'order-item-option', label)
                );
                itemOptions.charges.forEach(charge =>
                    appendText(itemInfo, 'span', 'order-item-option order-item-charge',
                        `${charge.label} · ₱${Number(charge.amount).toLocaleString()} each`)
                );
                row.appendChild(itemInfo);
                const quantity = Number(item.qty) || 1;
                const unitPrice = Number(item.price) || 0;
                appendText(row, 'span', 'item-quantity',
                    `Qty ${quantity} · ₱${unitPrice.toLocaleString()} each`);
                itemContainer.appendChild(row);
            });
            card.appendChild(itemContainer);

            const meta = document.createElement('div');
            meta.className = 'order-meta';
            appendText(meta, 'span', '', `Payment: ${order.paymentMethod || 'Not specified'}`);
            card.appendChild(meta);

            const footer = document.createElement('div');
            footer.className = 'order-footer';
            appendText(footer, 'div', 'order-total', `Total: ${order.total || '₱0'}`);
            const detailsButton = document.createElement('button');
            detailsButton.type = 'button';
            detailsButton.className = 'details-button';
            detailsButton.textContent = 'VIEW ORDER DETAILS';
            detailsButton.setAttribute('aria-expanded', 'false');
            const details = document.createElement('div');
            details.className = 'order-details';
            details.id = `order-details-${index}`;
            details.hidden = true;
            detailsButton.setAttribute('aria-controls', details.id);
            detailsButton.addEventListener('click', () => {
                details.hidden = !details.hidden;
                detailsButton.setAttribute('aria-expanded', String(!details.hidden));
                detailsButton.textContent = details.hidden ? 'VIEW ORDER DETAILS' : 'HIDE ORDER DETAILS';
            });
            footer.appendChild(detailsButton);
            card.appendChild(footer);

            const customer = order.customer || {};
            appendText(details, 'div', '', `Customer: ${customer.name || 'Not specified'}`);
            appendText(details, 'div', '', `Phone: ${customer.phone || 'Not specified'}`);
            appendText(details, 'div', '', `Address: ${customer.address || 'Not specified'}`);
            if (customer.contactHandle) appendText(details, 'div', '', `Contact: ${customer.contactHandle}`);
            if (customer.riderNote) appendText(details, 'div', '', `Note to rider: ${customer.riderNote}`);
            appendText(details, 'div', '', `Payment reference: ${order.referenceNo || 'Not specified'}`);
            card.appendChild(details);

            ordersList.appendChild(card);
        }

        function renderOrders() {
            if (!currentUser) {
                ordersList.replaceChildren();
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.append('Please log in to view your orders. ');
                const loginLink = document.createElement('a');
                const loginParams = new URLSearchParams({ redirect: 'orders' });
                if (orderLookup) loginParams.set('order', orderLookup);
                loginLink.href = `login.html?${loginParams.toString()}`;
                loginLink.textContent = 'Log in';
                emptyState.appendChild(loginLink);
                ordersList.appendChild(emptyState);
                return;
            }

            const orders = readOrders();
            if (orders === null) return;

            const customerOrders = orders.filter(order =>
                String(order.ownerEmail || '').trim().toLowerCase() === currentUser &&
                (!orderLookup || String(order.id || '').trim().toUpperCase() === orderLookup)
            );

            if (customerOrders.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.textContent = orderLookup
                    ? `No order matching ${orderLookup} was found for this account.`
                    : 'You have no orders yet. Orders placed while signed in will appear here.';
                ordersList.replaceChildren(emptyState);
                return;
            }

            ordersList.replaceChildren();
            customerOrders.slice().reverse().forEach((order, index) => renderOrder(order, index));
        }

        renderOrders();
    