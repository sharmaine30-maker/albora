window.bindAlboraInlineHandlers({
    "accessories-event-1": function(event) {
        toggleMenu()
    }
});

        function toggleMenu() { document.getElementById("mobileMenu").classList.toggle("active"); }
        const accChips = document.querySelectorAll('.sub-chip[data-acc]');
        const productCards = document.querySelectorAll('#productGrid .product-card');
        let activeAcc = 'all-acc';
        accChips.forEach(c => c.addEventListener('click', () => {
            accChips.forEach(x => x.classList.remove('active')); c.classList.add('active');
            activeAcc = c.dataset.acc; applyFilter();
        }));
        function applyFilter() {
            productCards.forEach(card => {
                const show = (activeAcc === 'all-acc' || card.dataset.acc === activeAcc);
                card.style.display = show ? '' : 'none';
            });
        }
    