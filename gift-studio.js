window.bindAlboraInlineHandlers({
    "gift-studio-event-1": function(event) {
        window.location.href='index.html'
    }
});

        // ==========================================
        // PRODUCT DATA
        // ==========================================

        const products = [
            { id: 1, name: "Demo Perfume", price: 100, category: "perfume", shopfor: "men", stock: 99, isDemo: true },
            { id: 2, name: "Demo Necklace", price: 100, category: "jewelry", shopfor: "men", type: "necklace", metal: "gold", stock: 99, isDemo: true },
            { id: 3, name: "Demo Accessory", price: 100, category: "accessories", shopfor: "unisex", stock: 99, isDemo: true },
            { id: 4, name: "Demo Cosmetics", price: 100, category: "cosmetics", shopfor: "women", stock: 99, isDemo: true }
        ];

        // ==========================================
        // PERFUME SIZE AND OPTIONAL BOX PRICES
        // ==========================================

       const PERFUME_SIZES = [
    { label: "10 ml", key: "10ml", surcharge: 0 },
    { label: "30 ml", key: "30ml", surcharge: 0 },
    { label: "50 ml", key: "50ml", surcharge: 0 }
];

const PERFUME_BOX_PRICE = 15;
const ADDON_PRICE = 30;
      
        let selectedPerfumeSize = "30ml";
        let is10mlBoxSelected = false;

        // ==========================================
        // CART AND SETTINGS
        // ==========================================

        let cart = [];

        let currentCategory = "perfume";
        let currentFilter = "all";
        let currentSearch = "";

        let selectedPackaging = {
            type: "bag",
            price: 25,
            title: "ALBORÁ GIFT BAG",
            desc: "A ribbon-tied gift bag for her, ready to give. Size: 12 × 5.7 × 0.16."
        };

        let isAddonSelected = false;

        // ==========================================
        // DOM ELEMENTS
        // ==========================================

        const productGrid = document.getElementById("productGrid");
        const summaryList = document.getElementById("summary-items-list");
        const summaryTotalPrice = document.getElementById("summary-total-price");
        const footerTotalPrice = document.getElementById("footer-total-price");
        const summaryPackagingPrice = document.getElementById("summary-packaging-price");
        const summaryAddonRow = document.getElementById("summary-addon-row");
        const summaryBoxRow = document.getElementById("summary-box-row");
        const toastMsg = document.getElementById("toastMsg");
        const searchInput = document.getElementById("searchInput");
        const standardFilters = document.getElementById("standard-filters");
        const jewelryFilterWrapper = document.getElementById("jewelry-filter-wrapper");
        const perfumeSizeSelect = document.getElementById("perfumeSize");
        const add10mlBoxCheckbox = document.getElementById("add10mlBox");

        // ==========================================
        // INITIALIZATION
        // ==========================================

        document.addEventListener("DOMContentLoaded", function () {
            renderProducts();
            updateUI();
            setupCategoryListeners();
            setupJewelryFilterListeners();
        });

        // ==========================================
        // PRICE HELPERS
        // ==========================================

        function formatPrice(amount) {
            return "₱" + Number(amount).toLocaleString("en-PH");
        }

        function getSelectedPerfumeSizeInfo() {
            return PERFUME_SIZES.find(size => size.key === selectedPerfumeSize)
                || PERFUME_SIZES.find(size => size.key === "30ml");
        }

        function getProductPrice(product) {
            if (product.category === "perfume") {
                const sizeInfo = getSelectedPerfumeSizeInfo();
                return Number(product.price) + Number(sizeInfo.surcharge);
            }

            return Number(product.price);
        }

        function getCartItemName(item) {
            if (item.isPerfume) {
                return `${item.name} (${getSelectedPerfumeSizeInfo().label})`;
            }

            return item.name;
        }

        // ==========================================
        // CATEGORY SWITCHING
        // ==========================================

        function setupCategoryListeners() {
            const catBtns = document.querySelectorAll(".cat-btn");

            catBtns.forEach(button => {
                button.addEventListener("click", function () {

                    catBtns.forEach(btn => btn.classList.remove("active"));
                    this.classList.add("active");

                    if (this.id === "cat-perfume") {
                        currentCategory = "perfume";
                    } else if (this.id === "cat-jewelry") {
                        currentCategory = "jewelry";
                    } else if (this.id === "cat-cosmetics") {
                        currentCategory = "cosmetics";
                    } else if (this.id === "cat-accessories") {
                        currentCategory = "accessories";
                    }

                    searchInput.placeholder = `Search ${currentCategory}...`;
                    searchInput.value = "";
                    currentSearch = "";

                    if (currentCategory === "jewelry") {
                        standardFilters.style.display = "none";
                        jewelryFilterWrapper.style.display = "block";
                    } else {
                        standardFilters.style.display = "flex";
                        jewelryFilterWrapper.style.display = "none";

                        document.querySelectorAll("#standard-filters .filter-btn").forEach(btn => {
                            btn.classList.remove("active");
                        });

                        document.querySelector('#standard-filters [data-filter="all"]').classList.add("active");

                        currentFilter = "all";
                    }

                    renderProducts();
                });
            });
        }

        // ==========================================
        // JEWELRY FILTERS
        // ==========================================

        function setupJewelryFilterListeners() {

            document.querySelectorAll(".jewelry-filter-btn").forEach(button => {

                button.addEventListener("click", function () {

                    const siblings = this.parentElement.querySelectorAll(".jewelry-filter-btn");

                    siblings.forEach(btn => btn.classList.remove("active"));

                    this.classList.add("active");

                    renderProducts();
                });
            });

            document.getElementById("clear-jewelry-filters").addEventListener("click", function () {

                document.querySelectorAll(".jewelry-filter-panel .filter-group").forEach(group => {

                    group.querySelectorAll(".jewelry-filter-btn").forEach(button => {

                        if (button.dataset.value === "all") {
                            button.classList.add("active");
                        } else {
                            button.classList.remove("active");
                        }

                    });
                });

                searchInput.value = "";
                currentSearch = "";

                renderProducts();
            });
        }

        // ==========================================
        // RENDER PRODUCTS
        // ==========================================

        function renderProducts() {

            productGrid.innerHTML = "";

            let filtered = [];

            if (currentCategory === "jewelry") {

                const activeShopFor = document.querySelector('.jewelry-filter-btn[data-filter="shopfor"].active')?.dataset.value || "all";
                const activeType = document.querySelector('.jewelry-filter-btn[data-filter="type"].active')?.dataset.value || "all";
                const activeMetal = document.querySelector('.jewelry-filter-btn[data-filter="metal"].active')?.dataset.value || "all";

                filtered = products.filter(product => {

                    if (product.category !== "jewelry") return false;

                    const matchShopFor = activeShopFor === "all" || product.shopfor === activeShopFor;
                    const matchType = activeType === "all" || product.type === activeType;
                    const matchMetal = activeMetal === "all" || product.metal === activeMetal;
                    const matchSearch = product.name.toLowerCase().includes(currentSearch.toLowerCase());

                    return matchShopFor && matchType && matchMetal && matchSearch;
                });

            } else {

                filtered = products.filter(product => {

                    if (product.category !== currentCategory) return false;

                    const matchFilter = currentFilter === "all" || product.shopfor === currentFilter;
                    const matchSearch = product.name.toLowerCase().includes(currentSearch.toLowerCase());

                    return matchFilter && matchSearch;
                });
            }

            if (filtered.length === 0) {
                productGrid.innerHTML = `
                    <p class="albora-inline-8d96bd6a8d9c">
                        No products found.
                    </p>
                `;
                return;
            }

            filtered.forEach(product => {

                const isAdded = cart.some(item => item.productId === product.id);

                const card = document.createElement("div");
                card.className = `product-card ${isAdded ? "added" : ""}`;

                const graphicHTML = `<div class="gift-product-placeholder">IMAGE PLACEHOLDER</div>`;

                card.innerHTML = `
                    ${graphicHTML}
                    <h4>${product.name}</h4>
                    <p class="stock">
                        ${formatPrice(product.price)} · ${product.isDemo ? "DEMO ONLY — NOT FOR SALE" : `${product.stock} in stock`}
                    </p>
                    <button type="button" class="add-to-gift-btn">
                        ${isAdded ? "✓ Added" : "Add to Gift"}
                    </button>
                `;

                card.querySelector(".add-to-gift-btn").addEventListener("click", function (event) {

                    event.preventDefault();
                    event.stopPropagation();

                    addToGift(product.id);
                });

                productGrid.appendChild(card);
            });
        }

        // ==========================================
        // ADD PRODUCT TO GIFT
        // ==========================================

        function addToGift(productId) {

            const product = products.find(item => item.id === productId);

            if (!product) return;

            const existingItem = cart.find(item => item.productId === productId);

            if (existingItem) {

                if (existingItem.qty >= product.stock) {
                    showToast("Maximum stock reached.");
                    return;
                }

                existingItem.qty += 1;

            } else {

                cart.push({
                    productId: productId,
                    name: product.name,
                    price: Number(product.price),
                    qty: 1,
                    isPerfume: product.category === "perfume"
                });
            }

            showToast(`${product.name} added.`);

            updateUI();
            renderProducts();
        }

        // ==========================================
        // REMOVE PRODUCT
        // ==========================================

        function removeFromGift(productId) {

            cart = cart.filter(item => item.productId !== productId);

            updateUI();
            renderProducts();
        }

        // ==========================================
        // UPDATE QUANTITY
        // ==========================================

        function updateQuantity(productId, change) {

            const item = cart.find(item => item.productId === productId);

            if (!item) return;

            const product = products.find(product => product.id === item.productId);

            if (!product) return;

            const newQuantity = item.qty + change;

            if (newQuantity < 1) {
                removeFromGift(productId);
                return;
            }

            if (newQuantity > product.stock) {
                showToast("Cannot exceed stock.");
                return;
            }

            item.qty = newQuantity;

            updateUI();
            renderProducts();
        }

        // ==========================================
        // PERFUME SIZE SELECTION
        // ==========================================

        perfumeSizeSelect.addEventListener("change", function () {

            selectedPerfumeSize = this.value;

            updateUI();
        });

        // ==========================================
        // OPTIONAL 10 ML BOX
        // ==========================================

        add10mlBoxCheckbox.addEventListener("change", function () {

            is10mlBoxSelected = this.checked;

            updateUI();
        });

        // ==========================================
        // UPDATE SUMMARY AND TOTAL
        // ==========================================

        function updateUI() {

            summaryList.innerHTML = "";

            let productsSubtotal = 0;

            if (cart.length === 0) {

                summaryList.innerHTML = `
                    <p class="albora-inline-3c77036deb3d">
                        No products added yet.
                    </p>
                `;

            } else {

                cart.forEach(item => {

                    const itemPrice = getProductPrice(
                        products.find(product => product.id === item.productId)
                    );

                    const subtotal = Number(itemPrice) * Number(item.qty);

                    productsSubtotal += subtotal;

                    const row = document.createElement("div");
                    row.className = "summary-item-row";

                    const info = document.createElement("div");
                    info.className = "item-info";

                    const name = document.createElement("span");
                    name.className = "name";
                    name.textContent = getCartItemName(item);

                    const price = document.createElement("span");
                    price.className = "price-unit";
                    price.textContent = `${formatPrice(itemPrice)} each`;

                    info.appendChild(name);
                    info.appendChild(price);

                    const controls = document.createElement("div");
                    controls.className = "qty-controls";

                    const minus = document.createElement("button");
                    minus.className = "qty-btn";
                    minus.textContent = "−";
                    minus.type = "button";
                    minus.addEventListener("click", () => updateQuantity(item.productId, -1));

                    const quantity = document.createElement("span");
                    quantity.className = "qty-display";
                    quantity.textContent = item.qty;

                    const plus = document.createElement("button");
                    plus.className = "qty-btn";
                    plus.textContent = "+";
                    plus.type = "button";
                    plus.addEventListener("click", () => updateQuantity(item.productId, 1));

                    controls.appendChild(minus);
                    controls.appendChild(quantity);
                    controls.appendChild(plus);

                    const remove = document.createElement("button");
                    remove.className = "remove-btn";
                    remove.textContent = "Remove";
                    remove.type = "button";
                    remove.addEventListener("click", () => removeFromGift(item.productId));

                    row.appendChild(info);
                    row.appendChild(controls);
                    row.appendChild(remove);

                    summaryList.appendChild(row);
                });
            }

            const packagingPrice = Number(selectedPackaging.price);
            const boxTotal = is10mlBoxSelected ? PERFUME_BOX_PRICE : 0;
            const addonTotal = isAddonSelected ? ADDON_PRICE : 0;

            const finalTotal = productsSubtotal + packagingPrice + boxTotal + addonTotal;

            summaryPackagingPrice.textContent = formatPrice(packagingPrice);

            summaryBoxRow.style.display = is10mlBoxSelected ? "flex" : "none";
            summaryAddonRow.style.display = isAddonSelected ? "flex" : "none";

            summaryTotalPrice.textContent = formatPrice(finalTotal);
            footerTotalPrice.textContent = formatPrice(finalTotal);

            document.getElementById("canvas-title").textContent = selectedPackaging.title;
        }

        // ==========================================
        // PACKAGING OPTIONS
        // ==========================================

        document.querySelectorAll(".pack-option").forEach(option => {

            option.addEventListener("click", function () {

                document.querySelectorAll(".pack-option").forEach(item => {
                    item.classList.remove("active");
                });

                this.classList.add("active");

                selectedPackaging = {
                    type: this.dataset.type,
                    price: Number(this.dataset.price),
                    title: this.dataset.title,
                    desc: this.dataset.desc
                };

                document.getElementById("pack-desc-text").textContent = selectedPackaging.desc;

                updateGiftGraphic(selectedPackaging.type);
                updateUI();
            });
        });

        // ==========================================
        // GIFT PREVIEW
        // ==========================================

        function updateGiftGraphic(type) {

            const graphic = document.getElementById("gift-graphic");

            graphic.className = "gift-display";

            if (type === "bag") {

                graphic.classList.add("gift-bag-default");

                graphic.innerHTML = `
                    <div class="bag-label">
                        <h1>Albora</h1>
                        <p>Just for you</p>
                        <br>
                        <p class="albora-inline-345374713bfd">Shine Like The Aurora</p>
                    </div>
                `;

            } else if (type === "men") {

                graphic.classList.add("gift-bag-men");

                graphic.innerHTML = `
                    <div class="bag-label">
                        <h1>ALBORÁ</h1>
                        <p>MEN</p>
                        <br>
                        <p class="albora-inline-345374713bfd">Shine Like The Aurora</p>
                    </div>
                `;

            } else if (type === "box") {

                graphic.classList.add("gift-box-exclusive");

                graphic.innerHTML = `
                    <div class="box-lid-text">Albora</div>
                    <div class="box-slot"></div>
                `;
            }
        }

        // ==========================================
        // OPTIONAL DRY FLOWER ADD-ON
        // ==========================================

        const addonCard = document.getElementById("addonCard");

        addonCard.addEventListener("click", function () {

            isAddonSelected = !isAddonSelected;

            addonCard.classList.toggle("active", isAddonSelected);

            updateUI();
        });

        // ==========================================
        // STANDARD FILTERS
        // ==========================================

        document.querySelectorAll("#standard-filters .filter-btn").forEach(button => {

            button.addEventListener("click", function () {

                document.querySelectorAll("#standard-filters .filter-btn").forEach(item => {
                    item.classList.remove("active");
                });

                this.classList.add("active");

                currentFilter = this.dataset.filter;

                renderProducts();
            });
        });

        // ==========================================
        // SEARCH
        // ==========================================

        searchInput.addEventListener("input", function () {

            currentSearch = this.value;

            renderProducts();
        });

        // ==========================================
        // TOAST MESSAGE
        // ==========================================

        let toastTimer;

        function showToast(message) {

            toastMsg.textContent = message;
            toastMsg.classList.add("show");

            clearTimeout(toastTimer);

            toastTimer = setTimeout(() => {
                toastMsg.classList.remove("show");
            }, 2500);
        }

        // ==========================================
        // ADD TO BAG
        // ==========================================

        document.getElementById("addToBagBtn").addEventListener("click", function () {

            if (cart.length === 0) {
                showToast("Please add at least one product.");
                return;
            }

            const productsSubtotal = cart.reduce((total, item) => {

                const product = products.find(product => product.id === item.productId);
                const itemPrice = getProductPrice(product);

                return total + (Number(itemPrice) * Number(item.qty));

            }, 0);

            const boxTotal = is10mlBoxSelected ? PERFUME_BOX_PRICE : 0;
            const addonTotal = isAddonSelected ? ADDON_PRICE : 0;

            const finalPrice =
                productsSubtotal +
                Number(selectedPackaging.price) +
                boxTotal +
                addonTotal;

            let giftName = `Custom Gift Set (${selectedPackaging.title})`;

            if (is10mlBoxSelected) {
                giftName += " + 10 ml Box";
            }

            if (isAddonSelected) {
                giftName += " + Dry Flower";
            }

            const itemDetails = cart.map(item => {

                const itemName = getCartItemName(item);

                return `${itemName} x${item.qty}`;

            }).join(", ");

            let extraDetails = itemDetails;

            if (is10mlBoxSelected) {
                extraDetails += ", Add 10 ml Box";
            }

            if (isAddonSelected) {
                extraDetails += ", Dry Flower with Envelope & Letter";
            }

            const giftItem = {
                name: giftName,
                price: finalPrice,
                category: "Gift Studio",
                image: "",
                qty: 1,
                details: extraDetails
            };

            if (window.alboraQueuePendingItem(giftItem, 'home')) return;

            let existingCart;
            try {
                existingCart = window.alboraCartStorage.load();
            } catch (error) {
                console.error('Unable to read the saved cart before adding a gift set.', error);
                showToast('Your saved bag could not be read. Please try again.');
                return;
            }

            existingCart.push(giftItem);

            try {
                window.alboraCartStorage.save(existingCart);
            } catch (error) {
                console.error('Unable to save the gift set to the active cart.', error);
                showToast('Your gift set could not be saved. Please try again.');
                return;
            }

            showToast("Gift set added to your bag!");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1500);
        });

    