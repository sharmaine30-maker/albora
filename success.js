window.bindAlboraInlineHandlers({
    "success-event-1": function(event) {
        copyLink()
    }
});

        document.addEventListener('DOMContentLoaded', () => {
            const orderId = new URLSearchParams(window.location.search).get('order');
            const currentUser = (localStorage.getItem('alboraUser') || '').trim().toLowerCase();
            let orders = [];
            try {
                const storedOrders = localStorage.getItem('alboraOrders');
                orders = storedOrders ? JSON.parse(storedOrders) : [];
                if (!Array.isArray(orders)) throw new TypeError('Saved orders must be an array.');
            } catch (error) {
                console.error('Unable to read the saved order for confirmation.', error);
                document.getElementById('displayOrderId').textContent = 'Unavailable';
                document.querySelector('.link-box button').disabled = true;
                return;
            }

            const customerOrders = orders.filter(order =>
                String(order.ownerEmail || '').trim().toLowerCase() === currentUser
            );
            const latestOrder = orderId
                ? customerOrders.find(order => String(order.id).toUpperCase() === orderId.trim().toUpperCase())
                : customerOrders[customerOrders.length - 1];
            if (!latestOrder) {
                document.getElementById('displayOrderId').textContent = 'Not found';
                document.getElementById('displayItems').textContent =
                    'No saved order was found for this account in this browser.';
                document.querySelector('.link-box button').disabled = true;
                return;
            }

            document.getElementById('displayOrderId').textContent = latestOrder.id;
            const orderUrl = new URL(window.location.href);
            orderUrl.searchParams.set('order', latestOrder.id);
            document.getElementById('orderLinkInput').value = orderUrl.toString();
            document.getElementById('displayName').textContent = latestOrder.customer?.name || 'Not specified';
            document.getElementById('displayAddress').textContent = latestOrder.customer?.address || 'Not specified';
            document.getElementById('displayPhone').textContent = latestOrder.customer?.phone || 'Not specified';
            document.getElementById('displayMethod').textContent = latestOrder.paymentMethod || 'Not specified';
            document.getElementById('displayRef').textContent = latestOrder.referenceNo || 'N/A';

            const itemsContainer = document.getElementById('displayItems');
            itemsContainer.replaceChildren();
            let subtotal = 0;
            (Array.isArray(latestOrder.items) ? latestOrder.items : []).forEach(item => {
                const price = Number(item.price) || 0;
                const quantity = Math.max(1, Number(item.qty) || 1);
                subtotal += price * quantity;
                const row = document.createElement('div');
                row.className = 'item-row';
                const info = document.createElement('div');
                const name = document.createElement('div');
                name.className = 'item-name';
                name.textContent = item.name || 'Item';
                const description = document.createElement('div');
                description.className = 'item-desc';
                description.textContent = `${item.category || 'Item'} · ${quantity} x ₱${price.toLocaleString()}${item.details ? ` · ${item.details}` : ''}`;
                info.append(name, description);
                const total = document.createElement('div');
                total.textContent = `₱${(price * quantity).toLocaleString()}`;
                row.append(info, total);
                itemsContainer.appendChild(row);
            });
            document.getElementById('displaySubtotal').textContent = '₱' + subtotal.toLocaleString();
            document.getElementById('displayTotal').textContent = '₱' + subtotal.toLocaleString() + ' so far';
        });

        async function copyLink() {
            const copyText = document.getElementById('orderLinkInput');
            const button = document.querySelector('.link-box button');
            if (!copyText.value) {
                alert('No saved order link is available to copy.');
                return;
            }
            copyText.select();
            copyText.setSelectionRange(0, copyText.value.length);
            try {
                if (!navigator.clipboard) throw new Error('Clipboard access is unavailable.');
                await navigator.clipboard.writeText(copyText.value);
                button.textContent = 'COPIED!';
                setTimeout(() => button.textContent = 'COPY', 2000);
            } catch (error) {
                console.error('Unable to copy the order link automatically.', error);
                alert('Could not copy automatically. The order link is selected so you can copy it manually.');
            }
        }
    