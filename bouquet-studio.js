window.bindAlboraInlineHandlers({
    "bouquet-studio-event-1": function(event) {
        handleAddToCart()
    },
    "bouquet-studio-event-2": function(event) {
        toggleDecor(this, 'Dried flowers & letter', 80)
    },
    "bouquet-studio-event-3": function(event) {
        toggleDecor(this, 'Glass vase', 350)
    },
    "bouquet-studio-event-4": function(event) {
        toggleDecor(this, 'Handwritten card', 30)
    },
    "bouquet-studio-event-5": function(event) {
        updateQty('leaf3', 50, 1, this)
    },
    "bouquet-studio-event-6": function(event) {
        updateQty('leaf3', 50, -1, this)
    },
    "bouquet-studio-event-7": function(event) {
        updateQty('leaf2', 40, 1, this)
    },
    "bouquet-studio-event-8": function(event) {
        updateQty('leaf2', 40, -1, this)
    },
    "bouquet-studio-event-9": function(event) {
        updateQty('leaf1', 30, 1, this)
    },
    "bouquet-studio-event-10": function(event) {
        updateQty('leaf1', 30, -1, this)
    },
    "bouquet-studio-event-11": function(event) {
        updateQty('daisy', 60, 1, this)
    },
    "bouquet-studio-event-12": function(event) {
        updateQty('daisy', 60, -1, this)
    },
    "bouquet-studio-event-13": function(event) {
        updateQty('hydrangea', 180, 1, this)
    },
    "bouquet-studio-event-14": function(event) {
        updateQty('hydrangea', 180, -1, this)
    },
    "bouquet-studio-event-15": function(event) {
        updateQty('rose', 100, 1, this)
    },
    "bouquet-studio-event-16": function(event) {
        updateQty('rose', 100, -1, this)
    },
    "bouquet-studio-event-17": function(event) {
        updateQty('lilies', 150, 1, this)
    },
    "bouquet-studio-event-18": function(event) {
        updateQty('lilies', 150, -1, this)
    },
    "bouquet-studio-event-19": function(event) {
        updateQty('tulip', 120, 1, this)
    },
    "bouquet-studio-event-20": function(event) {
        updateQty('tulip', 120, -1, this)
    },
    "bouquet-studio-event-21": function(event) {
        window.location.href='index.html'
    }
});

        let currentDecorTotal = 0;
        let activeDecorations = [];
        let selectedFlowers = [];
        const flowerColorSelections = new Map();
        const flowerIds = ['tulip', 'lilies', 'rose', 'hydrangea', 'daisy'];

        function renderFlowerColorSelectors(itemId, card) {
            const container = card.querySelector('.stem-color-selectors');
            if (!container) return;

            const qtyElement = document.getElementById(`qty-${itemId}`);
            const quantity = Number.parseInt(qtyElement.textContent, 10) || 0;
            const colors = container.dataset.colors.split('|').filter(Boolean);
            const previousSelections = flowerColorSelections.get(itemId) || [];
            const selections = Array.from(
                { length: quantity },
                (_, index) => previousSelections[index] || ''
            );
            flowerColorSelections.set(itemId, selections);
            container.replaceChildren();

            selections.forEach((selectedColor, stemIndex) => {
                const row = document.createElement('div');
                row.className = 'stem-color-row';
                row.setAttribute('role', 'group');
                row.setAttribute('aria-label', `${card.querySelector('.item-title').textContent.trim()} ${stemIndex + 1} color`);

                const label = document.createElement('span');
                label.className = 'stem-color-label';
                label.textContent = `${card.querySelector('.item-title').textContent.trim()} ${stemIndex + 1}`;
                row.appendChild(label);

                const options = document.createElement('div');
                options.className = 'stem-color-options';
                colors.forEach(colorName => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'stem-color-option';
                    button.textContent = colorName;
                    button.dataset.color = colorName;
                    button.setAttribute('aria-pressed', String(selectedColor === colorName));
                    if (selectedColor === colorName) button.classList.add('selected');
                    button.addEventListener('click', () => {
                        selections[stemIndex] = colorName;
                        row.classList.remove('needs-color');
                        options.querySelectorAll('.stem-color-option').forEach(option => {
                            const isSelected = option.dataset.color === colorName;
                            option.classList.toggle('selected', isSelected);
                            option.setAttribute('aria-pressed', String(isSelected));
                        });
                    });
                    options.appendChild(button);
                });
                row.appendChild(options);
                container.appendChild(row);
            });
        }

        function updateQty(itemId, price, change, btnElement) {
            const card = btnElement.closest('.item-card');
            const qtyElement = document.getElementById(`qty-${itemId}`);
            if (!qtyElement) throw new Error(`Missing bouquet quantity display for ${itemId}.`);
            const currentQty = Number.parseInt(qtyElement.textContent, 10) || 0;
            if (change < 0 && currentQty === 0) return;

            const itemName = card.querySelector('.item-title').textContent.trim();
            if (change > 0) {
                selectedFlowers.push({ id: itemId, name: itemName, price: price });
            } else {
                let indexToRemove = -1;
                for (let index = selectedFlowers.length - 1; index >= 0; index--) {
                    if (selectedFlowers[index].id === itemId) {
                        indexToRemove = index;
                        break;
                    }
                }
                if (indexToRemove !== -1) selectedFlowers.splice(indexToRemove, 1);
            }

            const newQtyValue = currentQty + change;
            qtyElement.textContent = newQtyValue;
            if (card.querySelector('.stem-color-selectors')) {
                renderFlowerColorSelectors(itemId, card);
            }
            if (newQtyValue > 0) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }

            updatePrice();
        }

        function selectSingleOption(card) {
            const group = card.dataset.choiceGroup;
            const wasSelected = card.classList.contains('active');

            document.querySelectorAll('.item-card[data-choice-group]').forEach(option => {
                if (option.dataset.choiceGroup === group) {
                    option.classList.remove('active');
                    option.setAttribute('aria-pressed', 'false');
                }
            });
            selectedFlowers = selectedFlowers.filter(item => item.choiceGroup !== group);

            if (!wasSelected) {
                card.classList.add('active');
                card.setAttribute('aria-pressed', 'true');
                selectedFlowers.push({
                    id: card.dataset.optionId,
                    name: card.querySelector('.item-title').textContent.trim(),
                    price: Number(card.dataset.price),
                    choiceGroup: group
                });
            }

            updatePrice();
        }

        document.querySelectorAll('.item-card[data-choice-group]').forEach(card => {
            card.addEventListener('click', () => selectSingleOption(card));
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectSingleOption(card);
                }
            });
        });

        function toggleDecor(element, decorName, price) {
            element.classList.toggle('active');
            
            const isActive = element.classList.contains('active');
            const check = element.querySelector('.check');

            if (isActive) {
                check.style.display = 'block';
                currentDecorTotal += price;
                activeDecorations.push(decorName);
            } else {
                check.style.display = 'none';
                currentDecorTotal -= price;
                const index = activeDecorations.indexOf(decorName);
                if (index > -1) activeDecorations.splice(index, 1);
            }

            updatePrice();
        }

        function getTotalPrice() {
            return selectedFlowers.reduce((total, item) => total + Number(item.price || 0), currentDecorTotal);
        }

        function updatePrice() {
            document.getElementById('total-price').innerText = `₱${getTotalPrice().toFixed(2)}`;
        }

        updatePrice();

        function handleAddToCart() {
            const selectedFlowerItems = selectedFlowers.filter(item => flowerIds.includes(item.id));
            if (selectedFlowerItems.length === 0) {
                alert('Please select at least one flower for your bouquet.');
                return;
            }

            const flowerStems = [];
            for (const flowerId of flowerIds) {
                const flowerItems = selectedFlowerItems.filter(item => item.id === flowerId);
                if (flowerItems.length === 0) continue;

                const card = document.getElementById(`card-${flowerId}`);
                const selector = card.querySelector('.stem-color-selectors');
                const colors = selector.dataset.colors.split('|').filter(Boolean);
                const selections = flowerColorSelections.get(flowerId) || [];
                for (let stemIndex = 0; stemIndex < flowerItems.length; stemIndex++) {
                    const color = selections[stemIndex];
                    if (!colors.includes(color)) {
                        const row = selector.querySelectorAll('.stem-color-row')[stemIndex];
                        row.classList.add('needs-color');
                        const firstOption = row.querySelector('.stem-color-option');
                        if (firstOption) firstOption.focus();
                        alert(`Please choose a color for every flower stem. Select a color for ${flowerItems[stemIndex].name} ${stemIndex + 1}.`);
                        return;
                    }
                    flowerStems.push({
                        flower: flowerItems[stemIndex].name,
                        stem: stemIndex + 1,
                        color: color
                    });
                }
            }

            const itemCounts = new Map();
            const selectedWrapping = selectedFlowers.find(item => item.choiceGroup === 'wrapping');
            const selectedRibbon = selectedFlowers.find(item => item.choiceGroup === 'ribbon');
            selectedFlowers.filter(item => !flowerIds.includes(item.id) && !item.choiceGroup).forEach(item => {
                itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + 1);
            });
            const flowerDetails = flowerStems.map(stem =>
                `${stem.flower} ${stem.stem} (${stem.color})`
            );
            const details = [
                ...flowerDetails,
                ...Array.from(itemCounts, ([name, quantity]) => `${name} x${quantity}`),
                ...(selectedWrapping ? [`Wrapping: ${selectedWrapping.name}`] : []),
                ...(selectedRibbon ? [`Ribbon: ${selectedRibbon.name}`] : []),
                ...activeDecorations
            ].join(', ');
            const bouquet = {
                name: 'Custom Bouquet',
                price: getTotalPrice(),
                category: 'Custom Gift',
                image: '',
                qty: 1,
                details: details,
                customizations: {
                    flowerStems: flowerStems,
                    wrapping: selectedWrapping ? { name: selectedWrapping.name, price: selectedWrapping.price } : null,
                    ribbon: selectedRibbon ? { name: selectedRibbon.name, price: selectedRibbon.price } : null,
                    decorations: [...activeDecorations]
                }
            };

            if (window.alboraQueuePendingItem(bouquet, 'home')) return;

            try {
                const existingCart = window.alboraCartStorage.load();
                existingCart.push(bouquet);
                window.alboraCartStorage.save(existingCart);
            } catch (error) {
                console.error('Unable to save the custom bouquet to the bag.', error);
                alert('The bouquet could not be saved. Please check browser storage and try again.');
                return;
            }

            alert('Bouquet added to your bag successfully!');
            window.location.href = 'index.html';
        }
    