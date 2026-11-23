window.bindAlboraInlineHandlers({
    "login-event-1": function(event) {
        switchForm('login')
    },
    "login-event-2": function(event) {
        handleForgot()
    },
    "login-event-3": function(event) {
        switchForm('login')
    },
    "login-event-4": function(event) {
        handleSignup()
    },
    "login-event-5": function(event) {
        switchForm('signup')
    },
    "login-event-6": function(event) {
        switchForm('forgot')
    },
    "login-event-7": function(event) {
        handleLogin()
    },
    "login-event-8": function(event) {
        this.style.display='none'; document.getElementById('fallbackLogo').style.display='block';
    }
});

        // Palitan-palitin ang forms
        function switchForm(formName) {
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
                form.querySelectorAll('.form-input').forEach(input => {
                    input.value = '';
                    input.classList.remove('invalid');
                });
                form.querySelectorAll('.error-msg').forEach(err => err.style.display = 'none');
            });
            document.getElementById('form-' + formName).classList.add('active');
        }

        function showError(inputId, errorId) {
            document.getElementById(inputId).classList.add('invalid');
            document.getElementById(errorId).style.display = 'block';
        }

        // --- PARA SA PENDING ITEM PAGKATAPOS MAG-LOGIN ---
        function processPendingItem(accountEmail) {
            const storedPendingItem = localStorage.getItem('alboraPendingItem');
            if (!storedPendingItem) return true;

            try {
                const pendingItem = JSON.parse(storedPendingItem);
                if (!pendingItem || typeof pendingItem !== 'object' || !pendingItem.name) {
                    throw new TypeError('Pending cart item is invalid.');
                }

                const cart = window.alboraCartStorage.loadForUser(accountEmail);

                const existing = cart.find(item =>
                    item.name === pendingItem.name &&
                    (item.category || 'general') === (pendingItem.category || 'general') &&
                    Number(item.price) === Number(pendingItem.price) &&
                    JSON.stringify(item.customizations || {}) === JSON.stringify(pendingItem.customizations || {}) &&
                    String(item.details || '') === String(pendingItem.details || '')
                );
                if (existing) {
                    existing.qty = (Number(existing.qty) || 0) + Math.max(1, Number(pendingItem.qty) || 1);
                } else {
                    cart.push(pendingItem);
                }

                window.alboraCartStorage.saveForUser(accountEmail, cart);
                localStorage.removeItem('alboraPendingItem');
                return true;
            } catch (error) {
                console.error('Unable to restore the pending cart item.', error);
                alert('Your pending item could not be restored. It remains saved in this browser; please try again.');
                return false;
            }
        }

        // Redirect logic (kung saan siya pupunta pagkatapos mag-login)
        function redirectAfterLogin() {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectTo = urlParams.get('redirect') || 'home';
            const destinations = {
                home: 'index.html',
                checkout: 'checkout.html',
                orders: 'orders.html'
            };
            const destination = destinations[redirectTo] || 'index.html';
            const orderNumber = redirectTo === 'orders' ? urlParams.get('order') : null;
            window.location.href = orderNumber
                ? `${destination}?order=${encodeURIComponent(orderNumber)}`
                : destination;
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        }

        // --- LOGIN LOGIC ---
        function handleLogin() {
            let email = document.getElementById('loginEmail');
            let pass = document.getElementById('loginPass');
            let isValid = true;

            email.classList.remove('invalid'); document.getElementById('err-login-email').style.display = 'none';
            pass.classList.remove('invalid'); document.getElementById('err-login-pass').style.display = 'none';

            if (!isValidEmail(email.value)) {
                showError('loginEmail', 'err-login-email'); isValid = false;
            }
            if (pass.value.length < 1) {
                showError('loginPass', 'err-login-pass'); isValid = false;
            }

            if (!isValid) return;

            const accountEmail = email.value.trim().toLowerCase();
            if (!processPendingItem(accountEmail)) return;
            try {
                window.alboraCartStorage.setUser(accountEmail);
            } catch (error) {
                console.error('Unable to activate the account cart after login.', error);
                alert('Your account cart could not be loaded. Please try again.');
                return;
            }
            
            // Lumipat sa tamang page
            redirectAfterLogin();
        }

        // --- SIGN-UP LOGIC ---
        function handleSignup() {
            let name = document.getElementById('signupName');
            let email = document.getElementById('signupEmail');
            let pass = document.getElementById('signupPass');
            let isValid = true;

            name.classList.remove('invalid'); document.getElementById('err-signup-name').style.display = 'none';
            email.classList.remove('invalid'); document.getElementById('err-signup-email').style.display = 'none';
            pass.classList.remove('invalid'); document.getElementById('err-signup-pass').style.display = 'none';

            if (name.value.trim().length < 2) {
                showError('signupName', 'err-signup-name'); isValid = false;
            }
            if (!isValidEmail(email.value)) {
                showError('signupEmail', 'err-signup-email'); isValid = false;
            }
            if (pass.value.length < 6) {
                showError('signupPass', 'err-signup-pass'); isValid = false;
            }

            if (!isValid) return;

            const accountEmail = email.value.trim().toLowerCase();
            if (!processPendingItem(accountEmail)) return;
            try {
                window.alboraCartStorage.setUser(accountEmail);
            } catch (error) {
                console.error('Unable to activate the account cart after signup.', error);
                alert('Your account cart could not be loaded. Please try again.');
                return;
            }
            
            // Lumipat sa tamang page
            redirectAfterLogin();
        }

        // --- FORGOT PASSWORD LOGIC ---
        function handleForgot() {
            let email = document.getElementById('forgotEmail');
            let isValid = true;

            email.classList.remove('invalid'); document.getElementById('err-forgot-email').style.display = 'none';

            if (!isValidEmail(email.value)) {
                showError('forgotEmail', 'err-forgot-email'); isValid = false;
            }

            if (!isValid) return;

            alert('Password reset is unavailable in this frontend-only prototype. No email was sent.');
        }

        // --- INITIALIZATION (Banner at Active Form) ---
        document.addEventListener('DOMContentLoaded', () => {
            // Ipakita yung gold banner kung galing sa add to cart
            const urlParams = new URLSearchParams(window.location.search);
            const loginNotice = document.getElementById('loginNotice');
            if (urlParams.get('redirect') && loginNotice) loginNotice.style.display = 'block';
        });
    