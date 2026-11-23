window.alboraIsLoggedIn = function() {
    return Boolean((localStorage.getItem('alboraUser') || '').trim());
};

window.alboraCartStorage = (function() {
    const accountsKey = 'alboraCarts';
    const guestCartKey = 'alboraGuestCart';
    const cartOwnerKey = 'alboraCartOwner';

    function normalizeUser(email) {
        return String(email || '').trim().toLowerCase();
    }

    function readCart(key) {
        const storedCart = localStorage.getItem(key);
        if (storedCart === null) return null;
        try {
            const cart = JSON.parse(storedCart);
            if (!Array.isArray(cart)) throw new TypeError(`${key} must contain a cart array.`);
            return cart;
        } catch (error) {
            console.error(`Unable to read ${key} from localStorage.`, error);
            throw error;
        }
    }

    function readAccounts() {
        const storedAccounts = localStorage.getItem(accountsKey);
        if (storedAccounts === null) return {};
        try {
            const accounts = JSON.parse(storedAccounts);
            if (!accounts || typeof accounts !== 'object' || Array.isArray(accounts)) {
                throw new TypeError(`${accountsKey} must contain an account-to-cart map.`);
            }
            Object.keys(accounts).forEach(email => {
                if (!Array.isArray(accounts[email])) {
                    throw new TypeError(`The saved cart for ${email} is not an array.`);
                }
            });
            return accounts;
        } catch (error) {
            console.error(`Unable to read ${accountsKey} from localStorage.`, error);
            throw error;
        }
    }

    function writeAccounts(accounts) {
        localStorage.setItem(accountsKey, JSON.stringify(accounts));
    }

    function saveForUser(email, cart) {
        const user = normalizeUser(email);
        if (!user) throw new TypeError('An account email is required to save its cart.');
        if (!Array.isArray(cart)) throw new TypeError('A cart array is required.');
        const accounts = readAccounts();
        accounts[user] = cart;
        writeAccounts(accounts);
        if (normalizeUser(localStorage.getItem('alboraUser')) === user &&
            localStorage.getItem(cartOwnerKey) === user) {
            localStorage.setItem('alboraCart', JSON.stringify(cart));
        }
    }

    function loadForUser(email) {
        const user = normalizeUser(email);
        if (!user) throw new TypeError('An account email is required to load its cart.');
        const accounts = readAccounts();
        if (Object.prototype.hasOwnProperty.call(accounts, user)) return accounts[user];

        const owner = localStorage.getItem(cartOwnerKey);
        const legacyCart = readCart('alboraCart');
        const activeUser = normalizeUser(localStorage.getItem('alboraUser'));
        if (owner === user || (owner === null && (!activeUser || activeUser === user))) {
            return legacyCart || [];
        }
        return [];
    }

    function writeActiveCart(cart, owner) {
        localStorage.setItem('alboraCart', JSON.stringify(cart));
        localStorage.setItem(cartOwnerKey, owner);
    }

    function load() {
        const user = normalizeUser(localStorage.getItem('alboraUser'));
        const owner = localStorage.getItem(cartOwnerKey);
        const activeCart = readCart('alboraCart');

        if (user) {
            if (owner && owner !== user && owner !== 'guest' && activeCart) {
                saveForUser(owner, activeCart);
            } else if (owner === 'guest' && activeCart) {
                localStorage.setItem(guestCartKey, JSON.stringify(activeCart));
            }

            const accounts = readAccounts();
            let cart;
            if (Object.prototype.hasOwnProperty.call(accounts, user)) {
                cart = accounts[user];
            } else if (!owner || owner === user) {
                cart = activeCart || [];
            } else {
                cart = [];
            }
            saveForUser(user, cart);
            writeActiveCart(cart, user);
            return cart;
        }

        if (owner && owner !== 'guest' && activeCart) {
            saveForUser(owner, activeCart);
            localStorage.removeItem('alboraCart');
            localStorage.removeItem(cartOwnerKey);
        }

        const savedGuestCart = readCart(guestCartKey);
        const cart = savedGuestCart || (!owner && activeCart) || [];
        localStorage.setItem(guestCartKey, JSON.stringify(cart));
        writeActiveCart(cart, 'guest');
        return cart;
    }

    function save(cart) {
        if (!Array.isArray(cart)) throw new TypeError('A cart array is required.');
        const user = normalizeUser(localStorage.getItem('alboraUser'));
        const expectedOwner = user || 'guest';
        const owner = localStorage.getItem(cartOwnerKey);
        if (owner !== expectedOwner) {
            throw new Error('The active cart owner changed. Reload the page before saving cart changes.');
        }
        if (user) saveForUser(user, cart);
        else localStorage.setItem(guestCartKey, JSON.stringify(cart));
        writeActiveCart(cart, expectedOwner);
    }

    function setUser(email) {
        const user = normalizeUser(email);
        if (!user) throw new TypeError('A valid account email is required.');

        const previousUser = normalizeUser(localStorage.getItem('alboraUser'));
        const owner = localStorage.getItem(cartOwnerKey);
        const activeCart = readCart('alboraCart');
        if (previousUser && previousUser !== user && (!owner || owner === previousUser)) {
            saveForUser(previousUser, activeCart || []);
        } else if (owner && owner !== 'guest' && owner !== user && activeCart) {
            saveForUser(owner, activeCart);
        } else if (owner === 'guest' && activeCart) {
            localStorage.setItem(guestCartKey, JSON.stringify(activeCart));
        }

        const cart = loadForUser(user);
        saveForUser(user, cart);
        localStorage.setItem('alboraUser', user);
        writeActiveCart(cart, user);
        return cart;
    }

    function logout() {
        const user = normalizeUser(localStorage.getItem('alboraUser'));
        const owner = localStorage.getItem(cartOwnerKey);
        const activeCart = readCart('alboraCart');

        if (user && (!owner || owner === user)) {
            saveForUser(user, activeCart || loadForUser(user));
        } else if (owner && owner !== 'guest' && activeCart) {
            saveForUser(owner, activeCart);
        } else if (owner === 'guest' && activeCart) {
            localStorage.setItem(guestCartKey, JSON.stringify(activeCart));
        }

        localStorage.removeItem('alboraUser');
        localStorage.removeItem('alboraCart');
        localStorage.removeItem(cartOwnerKey);
    }

    return { load, save, loadForUser, saveForUser, setUser, logout };
})();

window.alboraQueuePendingItem = function(item, redirectTo = 'home') {
    if (window.alboraIsLoggedIn()) return false;
    if (!item || typeof item !== 'object' || Array.isArray(item) || !String(item.name || '').trim()) {
        throw new TypeError('A valid cart item is required before login.');
    }

    try {
        localStorage.setItem('alboraPendingItem', JSON.stringify(item));
    } catch (error) {
        console.error('Unable to save the pending cart item.', error);
        window.alert('Your item could not be saved for after login. Please check browser storage and try again.');
        return true;
    }

    const destination = redirectTo === 'checkout' ? 'checkout' : 'home';
    window.location.href = `login.html?redirect=${destination}`;
    return true;
};

window.bindAlboraInlineHandlers = function(handlers) {
    const selector = '[data-albora-event-id]';
    const boundElements = new WeakSet();

    function bindElement(element) {
        if (boundElements.has(element)) return;

        const handler = handlers[element.dataset.alboraEventId];
        if (typeof handler !== 'function') return;

        const eventName = element.dataset.alboraEventType;
        element.addEventListener(eventName, function(event) {
            handler.call(element, event);
        });
        boundElements.add(element);

        if (eventName === 'error' && element.tagName === 'IMG' &&
            element.complete && element.naturalWidth === 0) {
            handler.call(element, new Event('error'));
        }
    }

    function bindWithin(root) {
        if (root.nodeType === 1 && root.matches(selector)) bindElement(root);
        root.querySelectorAll(selector).forEach(bindElement);
    }

    bindWithin(document);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            bindWithin(document);
        }, { once: true });
    }

    const observer = new MutationObserver(function(records) {
        records.forEach(function(record) {
            record.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) bindWithin(node);
            });
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
};
