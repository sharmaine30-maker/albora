window.bindAlboraInlineHandlers({
    "jewelry-event-1": function(event) {
        toggleMenu()
    }
});

        function toggleMenu() { document.getElementById("mobileMenu").classList.toggle("active"); }
        const shopForChips = document.querySelectorAll('.sub-chip[data-shopfor]');
        const typeChips = document.querySelectorAll('.sub-chip[data-type]');
        const metalChips = document.querySelectorAll('.sub-chip[data-metal]');
        const productCards = document.querySelectorAll('#productGrid .product-card');
        let activeShopFor = 'all-shop', activeType = 'all-types', activeMetal = 'all-metals';
        shopForChips.forEach(c => c.addEventListener('click', () => {
            shopForChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeShopFor = c.dataset.shopfor; applyFilter();
        }));
        typeChips.forEach(c => c.addEventListener('click', () => {
            typeChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeType = c.dataset.type; applyFilter();
        }));
        metalChips.forEach(c => c.addEventListener('click', () => {
            metalChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeMetal = c.dataset.metal; applyFilter();
        }));
        function applyFilter() {
            productCards.forEach(card => {
                let show = true;
                if (activeShopFor !== 'all-shop' && card.dataset.shopfor !== activeShopFor) show = false;
                if (activeType !== 'all-types' && card.dataset.type !== activeType) show = false;
                if (activeMetal !== 'all-metals' && card.dataset.metal !== activeMetal) show = false;
                card.style.display = show ? '' : 'none';
            });
        }
    