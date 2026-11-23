(function() {
    function getPricing(options) {
        const packagingPrice = Number(options.packagingPrice) || 0;
        const perfumeBoxPrice = Number(options.perfumeBoxPrice) || 0;
        const jewelryBoxPrice = Number(options.jewelryBoxPrice) || 0;
        return {
            packagingPrice,
            perfumeBoxPrice,
            jewelryBoxPrice,
            unitPrice: Number(options.basePrice) + packagingPrice + perfumeBoxPrice + jewelryBoxPrice
        };
    }

    function createCustomizations(options) {
        const customizations = {};
        const additionalCharges = [];

        if (options.category === 'cosmetics' && options.cos !== 'highlighter') {
            customizations.lipstickShade = options.lipstickShade;
        }
        if (options.category === 'jewelry') {
            if (options.jewelryOptionType === 'necklace-length') {
                customizations.necklaceLength = options.necklaceLength;
            } else if (options.jewelryOptionType === 'ring-size') {
                customizations.ringSize = options.ringSize;
            } else {
                customizations.finish = options.finish;
            }
            if (options.jewelryBoxSelected) {
                customizations.jewelryBox = options.jewelryBoxLabel;
                if (Number(options.jewelryBoxPrice) > 0) {
                    additionalCharges.push({
                        label: options.jewelryBoxLabel,
                        amount: Number(options.jewelryBoxPrice)
                    });
                }
            }
        }
        if (options.category === 'accessories' && options.color) {
            customizations.color = options.color;
        }
        if (options.category === 'flowers' && options.flowerColor) {
            customizations.flowerColor = options.flowerColor;
        }
        if (options.category === 'perfume') {
            const size = options.perfumeSize;
            if (!size) throw new TypeError('A perfume size must be selected.');
            customizations.perfumeSize = `${size.slice(0, -2)} ml`;
            customizations.perfumeBox = options.perfumeBoxChecked
                ? (size === '10ml' ? 'paid' : 'included')
                : 'none';
            if (Number(options.perfumeBoxPrice) > 0) {
                additionalCharges.push({
                    label: 'Add 10 ml Box',
                    amount: Number(options.perfumeBoxPrice)
                });
            }
        }
        if (options.packaging) {
            customizations.giftPackaging = options.packaging.value;
            customizations.giftPackagingLabel = options.packaging.label;
            if (Number(options.packaging.price) > 0) {
                additionalCharges.push({
                    label: options.packaging.label,
                    amount: Number(options.packaging.price)
                });
            }
        }

        return { customizations, additionalCharges };
    }

    window.alboraProductOptions = { getPricing, createCustomizations };
})();
