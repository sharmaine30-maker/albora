window.bindAlboraInlineHandlers({
    "help-event-1": function(event) {
        toggleMenu()
    }
});

        function toggleMenu() {
            const menu = document.getElementById('mobileMenu');
            const button = document.querySelector('.hamburger-btn');
            const isOpen = menu.classList.toggle('active');
            button.setAttribute('aria-expanded', String(isOpen));
        }

        document.querySelectorAll('#mobileMenu a').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('mobileMenu').classList.remove('active');
                document.querySelector('.hamburger-btn').setAttribute('aria-expanded', 'false');
            });
        });

        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const isOpen = question.getAttribute('aria-expanded') === 'true';
                question.setAttribute('aria-expanded', String(!isOpen));
                question.closest('.faq-item').classList.toggle('open', !isOpen);
            });
        });

        const backToTopButton = document.getElementById('backToTop');

        function updateBackToTop() {
            const isVisible = window.scrollY > 420;
            backToTopButton.classList.toggle('visible', isVisible);
            backToTopButton.setAttribute('aria-hidden', String(!isVisible));
            backToTopButton.tabIndex = isVisible ? 0 : -1;
        }

        window.addEventListener('scroll', updateBackToTop, { passive: true });
        updateBackToTop();
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        try {
            const storedCart = window.alboraCartStorage.load();
            const count = storedCart.reduce((total, item) => {
                const quantity = Number.parseInt(item.qty, 10);
                return total + (Number.isNaN(quantity) ? 0 : quantity);
            }, 0);
            document.querySelector('.bag-badge').textContent = count;
        } catch (error) {
            console.error('Unable to read the saved Alborá bag.', error);
        }
    