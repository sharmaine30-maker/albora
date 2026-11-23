window.bindAlboraInlineHandlers({
    "perfume-event-1": function(event) {
        toggleMenu()
    }
});

        function toggleMenu() { document.getElementById("mobileMenu").classList.toggle("active"); }
        const shopForChips = document.querySelectorAll('.sub-chip[data-shopfor]');
        const productCards = document.querySelectorAll('#productGrid .product-card');
        let activeShopFor = 'all-shop';
        shopForChips.forEach(c => c.addEventListener('click', () => {
            shopForChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeShopFor = c.dataset.shopfor; applyFilter();
        }));
        function applyFilter() {
            productCards.forEach(card => {
                const show = (activeShopFor === 'all-shop' || card.dataset.shopfor === activeShopFor);
                card.style.display = show ? '' : 'none';
            });
        }
    