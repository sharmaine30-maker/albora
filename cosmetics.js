window.bindAlboraInlineHandlers({
    "cosmetics-event-1": function(event) {
        toggleMenu()
    }
});

        function toggleMenu() { document.getElementById("mobileMenu").classList.toggle("active"); }

        const cosChips = document.querySelectorAll('.sub-chip[data-cos]');
        const productCards = document.querySelectorAll('#productGrid .product-card');
        let activeCos = 'all-cos';

        cosChips.forEach(c => c.addEventListener('click', () => {
            cosChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeCos = c.dataset.cos; applyFilter();
        }));

        function applyFilter() {
            productCards.forEach(card => {
                const show = (activeCos === 'all-cos' || card.dataset.cos === activeCos);
                card.style.display = show ? '' : 'none';
            });
        }
    