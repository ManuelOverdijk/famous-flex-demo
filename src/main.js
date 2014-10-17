/**
 * This Source Code is licensed under the MIT license. If a copy of the
 * MIT-license was not distributed with this file, You can obtain one at:
 * http://opensource.org/licenses/mit-license.html.
 *
 * @author: Hein Rutjes (IjzerenHein)
 * @license MIT
 * @copyright Gloey Apps, 2014
 */

/*global define, Please, console*/
/*eslint no-console:0 no-use-before-define:0*/

define(function(require) {

    //<webpack>
    require('famous-polyfills');
    require('./css/bootstrap.min.css');
    require('famous/core/famous.css');
    require('./css/styles.css');
    require('./index.html');
    //</webpack>

    // please-js
    require('pleasejs/Please');

    // Fast-click
    var FastClick = require('fastclick/lib/fastclick');
    FastClick.attach(document.body);

    // import dependencies
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var Surface = require('famous/core/Surface');
    var InputSurface = require('famous/surfaces/InputSurface');
    var LayoutController = require('famous-flex/LayoutController');
    var FlowLayoutController = require('famous-flex/FlowLayoutController');
    var ScrollView = require('famous-flex/ScrollView');
    var LayoutUtility = require('famous-flex/LayoutUtility');
    var NewYork = require('./data/newyork/collection');
    var LayoutDockHelper = require('famous-flex/helpers/LayoutDockHelper');
    var BkImageSurface = require('famous-bkimagesurface/BkImageSurface');
    // layouts
    var GridLayout = require('famous-flex/layouts/GridLayout');
    var NavBarLayout = require('famous-flex/layouts/NavBarLayout');
    var ListLayout = require('famous-flex/layouts/ListLayout');
    var CollectionLayout = require('famous-flex/layouts/CollectionLayout');
    var CoverLayout = require('famous-flex/layouts/CoverLayout');
    //var CubeLayout = require('famous-flex/layouts/CubeLayout');
    // lagometer
    var Lagometer = require('famous-lagometer/Lagometer');
    var collectionItemId = 0;

    // create the main context
    var mainContext = Engine.createContext();

    // Create the shell
    var layoutListRenderables = [];
    var layoutDetailsRenderables = [];
    var collection = [];
    var layouts = [];
    var layoutDetailsView;
    var navbar = _createNavbar();
    var sidebar = _createSidebar();
    var collectionView = _createCollectionView();
    var shell = _createShell({
        navbar: navbar,
        sidebar: sidebar,
        content: collectionView
    });
    mainContext.add(shell);

    /**
     * Shell
     */
    function ShellLayout(context, options) {
        var size = context.size;
        context.set('navbar', {
            size: [size[0], options.navBarHeight]
        });
        context.set('content', {
            size: [size[0], size[1] - options.navBarHeight],
            translate: [0, options.navBarHeight, 0],
            origin: [1, 0],
            align: [1, 0],
            rotate: options.showSideBar ? [0, (Math.PI/180) * -20, 0] : [0, 0, 0]
        });
        context.set('sidebar', {
            size: [options.sideBarWidth, size[1] - options.navBarHeight],
            translate: [0, options.navBarHeight, 100],
            origin: [0, 0],
            align: [0, 0],
            rotate: options.showSideBar ? [0, (Math.PI/180) * 10, 0] : [0, (Math.PI/180) * 90, 0]
        });
    }
    function _createShell(renderables) {
        return new FlowLayoutController({
            layout: ShellLayout,
            layoutOptions: {
                navBarHeight: 58,
                sideBarWidth: 160
            },
            dataSource: renderables
        });
    }
    function _createSidebar() {
        layoutDetailsView = _createLayoutDetailsView();
        return new LayoutController({
            layout: function(context) {
                var size = context.size;
                var dock = new LayoutDockHelper(context, {
                    translateZ: 1
                });
                context.set('back', {size: size});
                if (size[0] < 300) {
                    dock.bottom('details', 140);
                }
                else {
                    dock.right('details', 200);
                }
                dock.fill('list');
            },
            dataSource: {
                'list': _createLayoutListView(),
                'details': layoutDetailsView,
                'back': new Surface({classes:['panel']})
            }
        });
    }
    function _hideSidebar() {
        shell.setLayoutOptions({
            showSideBar: false
        });
    }
    function _toggleSidebar() {
        shell.setLayoutOptions({
            showSideBar: !shell.getLayoutOptions().showSideBar
        });
    }

    /**
     * Navbar
     */
    function _createButton(content) {
        return new Surface({
            size: [50, undefined],
            content: '<button type="button" class="btn btn-default">' + content + '</button>'
        });
    }
    function _insertItem() {
        _hideSidebar.call(this);
        _addCollectionItem.call(this);
    }
    function _removeItem() {
        _hideSidebar.call(this);
        _removeCollectionItem.call(this);
    }
    function _moveNextItem() {
        _hideSidebar.call(this);
        collectionView.scroll(1);
    }
    function _movePrevItem() {
        _hideSidebar.call(this);
        collectionView.scroll(-1);
    }
    function _rotateLayout() {
        _hideSidebar.call(this);
        var direction = collectionView.getDirection(true);
        collectionView.setDirection((direction + 1) % 2);
    }
    function _reverseLayout() {
        _hideSidebar.call(this);
        var reverse = collectionView.getReverse();
        collectionView.setReverse(!reverse);
    }
    function _createNavbar() {
        var layoutController = new LayoutController({
            layout: NavBarLayout,
            layoutOptions: {
                margins: [8],
                itemSpacer: 5
            }
        });
        var background = new Surface({classes: ['navbar', 'navbar-default']});
        var title = new Surface({content: 'famous-flex', classes: ['title']});
        var addButton = _createButton('<i class="glyphicon glyphicon-plus"></i>');
        addButton.on('click', _insertItem);
        var removeButton = _createButton('<i class="glyphicon glyphicon-minus"></i>');
        removeButton.on('click', _removeItem);
        var directionButton = _createButton('<i class="glyphicon glyphicon-repeat"></i>');
        directionButton.on('click', _rotateLayout);
        var reverseButton = _createButton('<i class="glyphicon glyphicon-sort-by-attributes"></i>');
        reverseButton.on('click', _reverseLayout);
        var menuButton = _createButton('<i class="glyphicon glyphicon-tasks"></i>');
        menuButton.on('click', _toggleSidebar);

        var nextButton = _createButton('<i class="glyphicon glyphicon-forward"></i>');
        nextButton.on('click', _moveNextItem);
        var prevButton = _createButton('<i class="glyphicon glyphicon-backward"></i>');
        prevButton.on('click', _movePrevItem);

        layoutController.setDataSource({
            background: background,
            title: title,
            rightItems: [
                removeButton,
                addButton,
                //nextButton,
                //prevButton,
                //reverseButton,
                directionButton
            ],
            leftItems: [
                menuButton
            ]
        });
        return layoutController;
    }

    /**
     * Collection
     */
    function _createCollectionItem() {
        //var imageUrl = NewYork[collection.length % NewYork.length];
        /*return new BkImageSurface({
            classes: ['image-frame'],
            content: imageUrl,
            sizeMode: 'cover',
            properties: {
                backgroundColor: 'black'
            }
        });*/
        collectionItemId++;
        return new Surface({
            //content: 'Item ' + collectionItemId,
            properties: {
                backgroundColor: window.Please.make_color()
            }
        });

    }
    function _addCollectionItem() {
        if (collectionView && collectionView.insert) {
            var rightItems = navbar.getSpec('rightItems');
            var insertSpec = LayoutUtility.cloneSpec(navbar.getSpec(rightItems[1]));
            var pos = Math.floor(Math.random() * (Math.min(collection.length, 5) + 1));
            var item = _createCollectionItem();
            collectionView.insert(pos, _createCollectionItem(), insertSpec);
            if (collectionView.scrollTo) {
                collectionView.scrollTo(item);
            }
        }
        else {
            collection.unshift(_createCollectionItem());
            if (collectionView) {
                collectionView.reflowLayout();
            }
        }
    }
    function _removeCollectionItem() {
        if (collectionView && collectionView.remove) {
            var rightItems = navbar.getSpec('rightItems');
            var removeSpec = LayoutUtility.cloneSpec(navbar.getSpec(rightItems[0]));
            removeSpec.opacity = 0;
            var pos = Math.floor(Math.random() * Math.min(collection.length, 5));
            collectionView.remove(pos, removeSpec);
        }
        else if (collection.length) {
            collection.splice(0, 1);
            if (collectionView) {
                collectionView.reflowLayout();
            }
        }
    }
    function _createCollectionView() {
        for (var i = 0; i < 5; i++) {
            _addCollectionItem();
        }
        /*return new FlowLayoutController({
            dataSource: collection,
            insertSpec: {opacity: 0},
            removeSpec: {opacity: 0}
        });*/
        return new ScrollView({
            dataSource: collection,
            useContainer: true
        });
    }

    /**
     * Layouts
     */
    function _createLayoutListView() {
        return new LayoutController({
            layout: ListLayout,
            layoutOptions: { itemSize: 50 },
            dataSource: layoutListRenderables
        });
    }
    function _createLayoutDetailsView() {
        return new LayoutController({
            layout: ListLayout,
            layoutOptions: { itemSize: 40 },
            dataSource: layoutDetailsRenderables
        });
    }

    function _incrementLayoutOption(option, value, input) {
        if (Array.isArray(option.value)) {
            var newValue = [];
            for (var i = 0; i < option.value.length; i++) {
                newValue.push(Math.max(Math.min(option.value[i] + value, option.max[i]), option.min[i]));
            }
            option.value = newValue;
        }
        else {
            option.value = Math.max(Math.min(option.value + value, option.max), option.min);
        }
        input.setValue(JSON.stringify(option.value));
        var layoutOptions = {};
        layoutOptions[option.name] = option.value;
        collectionView.setLayoutOptions(layoutOptions);
    }
    function _changeLayoutOption(option, event) {
        if (Array.isArray(option.value)) {
            var val = JSON.parse(event.currentTarget.value);
            if (!Array.isArray(val) || (val.length !== option.value.length)) {
                event.currentTarget.value = JSON.stringify(option.value);
                return;
            }
        }
        option.value = JSON.parse(event.currentTarget.value);
        var layoutOptions = {};
        layoutOptions[option.name] = option.value;
        collectionView.setLayoutOptions(layoutOptions);
    }
    function _createLayoutDetailItem(option) {
        var title = new Surface({
            classes: ['layout-detail-item-title'],
            content: option.name
        });
        var valueInput = new InputSurface({
            classes: ['layout-detail-item-input'],
            value: JSON.stringify(option.value)
        });
        valueInput.on('change', function(event) {
            _changeLayoutOption(option, event);
        });
        var addButton = new Surface({
            content: '<button type="button" class="btn btn-sm btn-default"><i class="glyphicon glyphicon-plus"></i></button>'
        });
        addButton.on('click', function() {
            _incrementLayoutOption(option, 1, valueInput);
        });
        var subButton = new Surface({
            content: '<button type="button" class="btn btn-sm btn-default"><i class="glyphicon glyphicon-minus"></i></button>'
        });
        subButton.on('click', function() {
            _incrementLayoutOption(option, -1, valueInput);
        });
        return new LayoutController({
            layout: {dock: [
                ['left', 'subButton', 40],
                ['right', 'addButton', 40],
                ['top', 'title', 17],
                ['fill', 'valueInput']
            ]},
            dataSource: {
                title: title,
                subButton: subButton,
                addButton: addButton,
                valueInput: valueInput
            }
        });
    }
    function _updateLayoutDetails(name) {
        layoutDetailsRenderables = [];
        var layout = _findLayout(name);
        for (var i = 0; i < layout.options.length; i++) {
            if ((layout.options.editable === undefined) || layout.options.editable) {
                layoutDetailsRenderables.push(_createLayoutDetailItem(layout.options[i]));
            }
        }
        layoutDetailsView.setDataSource(layoutDetailsRenderables);
    }
    function _findLayout(name) {
        for (var i =0; i < layouts.length; i++) {
            if (layouts[i].name === name) {
                return layouts[i];
            }
        }
        return undefined;
    }
    function _selectLayout(name) {

        // Select the layout and options
        var layout = _findLayout(name);
        var layoutOptions = {};
        var i;
        for (i = 0; i < layout.options.length; i++) {
            layoutOptions[layout.options[i].name] = layout.options[i].value;
        }
        collectionView.setLayout(layout.layout, layoutOptions);

        // Highlight the selected layout
        for (i = 0; i < layouts.length; i++) {
            layout = layouts[i];
            if (layout.name === name) {
                layout.surface.addClass('selected');
            }
            else {
                layout.surface.removeClass('selected');
            }
        }

        // Update detail-view
        _updateLayoutDetails(name);
    }
    function _addLayout(name, layoutFn, options) {
        var layout = {
            name: name,
            layout: layoutFn,
            options: options
        };
        layouts.push(layout);
        var listRenderable = new Surface({
            classes: ['layout-list-item'],
            content: name
        });
        layout.surface = listRenderable;
        listRenderable.on('click', _selectLayout.bind(this, name));
        layoutListRenderables.push(listRenderable);
    }
    function _addLayouts() {
        _addLayout('GridLayout', GridLayout, [
            {name: 'cells',      value: [3, 3], min: [1, 1], max: [50, 50]},
            {name: 'gutter',     value: [20, 20], min: [0, 0], max: [100, 100]}
        ]);
        _addLayout('ListLayout', ListLayout, [
            {name: 'itemSize',   value: 50, min: 0, max: 1000}
        ]);
        _addLayout('CollectionLayout', CollectionLayout, [
            {name: 'itemSize',   value: [100, 100], min: [0, 0], max: [1000, 1000]},
            {name: 'justify',    value: [1, 1], min: [0, 0], max: [1, 1]},
            {name: 'gutter',     value: [10, 10], min: [0, 0], max: [100, 100]}
        ]);
        _addLayout('CoverLayout', CoverLayout, [
            {name: 'itemSize',   value: [260, 200], min: [0, 0], max: [1000, 1000]}
        ]);
        _addLayout('FullScreen', ListLayout, [
            {name: 'itemSize',   value: undefined, editable:false}
        ]);
        /*_addLayout('CubeLayout', CubeLayout, [
            {name: 'itemSize',   value: [100, 100], min: [0, 0], max: [1000, 1000]}
        ]);*/
    }
    _addLayouts();
    _selectLayout('CollectionLayout');

    /**
     * Lagometer
     */
    var lagometerModifier = new Modifier({
        size: [100, 100],
        align: [1.0, 0.0],
        origin: [1.0, 0.0],
        transform: Transform.translate(-10, 70, 1000)
    });
    var lagometer = new Lagometer({
        size: lagometerModifier.getSize()
    });
    //mainContext.add(lagometerModifier).add(lagometer);
});
