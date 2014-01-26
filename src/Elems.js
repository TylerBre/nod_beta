function Elems (selectors) {
    var items = [],
        initItemsFromSelectors = compose(each(initItem), $, invoke('join'));

    function initItem (elem) {
        items.push({
            el: elem,                       // Original element
            isValid: null,                  // Boolean flag
            checks: [],                     // List of functions to check value
            validText: '',                  // Only one valid text per element
            // Empty container to put (in)valid texts into
            textHolder: $("<span/>", {'class':'help-block nodText'}).hide(),
            group: null,                    // Parent group of the element
            getValue: makeGetValue(elem),   // Function that gets the value
            validates: [],                  // List of original texts from user
            valiateElement: null,       // Function that runs each fn in checks
            getResults: null                // Gets the (in)valid text msg
        });
    }

    // "Copies" over attributes from extended metrics to the item
    function attach (metrics, item) {
        // Checker (the function to check vaues)
        item.checks.push(function (value) {
            return metrics.check(value) ? true : metrics.errorText;
        });

        // Valid text
        item.validText = metrics.validText;

        // Group
        item.group = $(item.el).parents(".form-group");

        // Text holder
        // (The empty element we used to insert (in)valid texts)
        insertEmptyTextHolder(item, item.group, item.textHolder);

        // Original text from the user (used by listeners to determine if this
        // elements needs to listen to other elements for instance)
        item.validates.push(metrics.validate);

        // Create a function to validate the item
        item.valiateElement = valiateElement.bind(null, item);

        item.getResults = getResults.bind(null, item);

        // Settings it's initial state (`null` if it's not valid, as if it was
        // untested)
        item.isValid = item.valiateElement() || null;

    }

    function attachCheck (metrics) {
        // For each $el in the expanded metrics...
        metrics.elems.each(function () {
            // Find its correspondent element(s) in items here
            var sameItems = filter(compose(eq(this), dot('el')), items);
            // Attach the attributes from the metrics to the element(s)
            each(attach.bind(this, metrics), sameItems);
        });
    }

    function insertEmptyTextHolder(item, group, textHolder) {
        // First check if it's a radio button, and if we already have a
        // textHolder we can use
        var previousTextHolder  = $(group).find('.nodText'),
            type                = $(item.el).attr('type');
        if (type === 'radio' && previousTextHolder.length) {
            item.textHolder = previousTextHolder;
            return;
        }

        if (type === 'checkbox' || type === 'radio') {
            $(group).append(textHolder);
        } else {
            $(item.el).after(textHolder);
        }
    }

    function valiateElement (item) {
        // Fetches the elments' value and returns `true` if it passes all its
        // checkers
        return all(eq(true), map(fnOf(item.getValue()), item.checks));
    }

    function getResults (item) {
        return map(fnOf(item.getValue()), item.checks);
    }

    function makeGetValue (elem) {
        var $el = $(elem);
        if ($el.attr('type') === 'checkbox') {
            return function() { return $el.is(':checked'); };
        } else {
            return function() { return $.trim($el.val()); };
        }
    }


    // Checks if all elements are valid
    function allAreValid () {
        return all(compose(eq(true), dot('isValid')), items);
    }


    // Initialize items
    initItemsFromSelectors(selectors);

    return {
        items       : items,
        attachCheck : attachCheck,
        allAreValid : allAreValid,
    };
}
