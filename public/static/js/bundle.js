
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        for (const key in attributes) {
            if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key in node) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    /**
     * Derived value store by synchronizing one or more readable stores and
     * applying an aggregation function over its input values.
     * @param {Stores} stores input stores
     * @param {function(Stores=, function(*)=):*}fn function callback that aggregates the values
     * @param {*=}initial_value when used asynchronously
     */
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.7.0 */
    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = ctx.component;

    	function switch_props(ctx) {
    		return {
    			props: { params: ctx.componentParams },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switch_instance_changes = {};
    			if (changed.componentParams) switch_instance_changes.params = ctx.componentParams;

    			if (switch_value !== (switch_value = ctx.component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}

    			else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    const hashPosition = window.location.href.indexOf('#/');
    let location = (hashPosition > -1) ? window.location.href.substr(hashPosition + 1) : '/';

    // Check if there's a querystring
    const qsPosition = location.indexOf('?');
    let querystring = '';
    if (qsPosition > -1) {
        querystring = location.substr(qsPosition + 1);
        location = location.substr(0, qsPosition);
    }

    return {location, querystring}
    }

    /**
     * Readable store that returns the current full location (incl. querystring)
     */
    const loc = readable(
    getLocation(),
    // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
        const update = () => {
            set(getLocation());
        };
        window.addEventListener('hashchange', update, false);

        return function stop() {
            window.removeEventListener('hashchange', update, false);
        }
    }
    );

    /**
     * Readable store that returns the current location
     */
    const location = derived(
    loc,
    ($loc) => $loc.location
    );

    /**
     * Readable store that returns the current querystring
     */
    const querystring = derived(
    loc,
    ($loc) => $loc.querystring
    );

    /**
     * Navigates to a new page programmatically.
     *
     * @param {string} location - Path to navigate to (must start with `/`)
     */
    function push(location) {
    if (!location || location.length < 1 || location.charAt(0) != '/') {
        throw Error('Invalid parameter location')
    }

    // Execute this code when the current call stack is complete
    setTimeout(() => {
        window.location.hash = '#' + location;
    }, 0);
    }

    /**
     * Svelte Action that enables a link element (`<a>`) to use our history management.
     *
     * For example:
     *
     * ````html
     * <a href="/books" use:link>View books</a>
     * ````
     *
     * @param {HTMLElement} node - The target node (automatically set by Svelte). Must be an anchor tag (`<a>`) with a href attribute starting in `/`
     */
    function link(node) {
    // Only apply to <a> tags
    if (!node || !node.tagName || node.tagName.toLowerCase() != 'a') {
        throw Error('Action "link" can only be used with <a> tags')
    }

    // Destination must start with '/'
    const href = node.getAttribute('href');
    if (!href || href.length < 1 || href.charAt(0) != '/') {
        throw Error('Invalid value for "href" attribute')
    }

    // onclick event handler
    node.addEventListener('click', (event) => {
        // Disable normal click event
        event.preventDefault();

        // Push link or link children click
        let href;
        let target = event.target;
        while ((href = target.getAttribute('href')) === null) {
            target = target.parentElement;
            if (target === null) {
                throw Error('Could not find corresponding href value')
            }
        }
        push(href);

        return false
    });
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc;

    	validate_store(loc, 'loc');
    	component_subscribe($$self, loc, $$value => { $loc = $$value; $$invalidate('$loc', $loc); });

    	/**
     * Dictionary of all routes, in the format `'/path': component`.
     *
     * For example:
     * ````js
     * import HomeRoute from './routes/HomeRoute.svelte'
     * import BooksRoute from './routes/BooksRoute.svelte'
     * import NotFoundRoute from './routes/NotFoundRoute.svelte'
     * routes = {
     *     '/': HomeRoute,
     *     '/books': BooksRoute,
     *     '*': NotFoundRoute
     * }
     * ````
     */
    let { routes = {} } = $$props;

    /**
     * Container for a route: path, component
     */
    class RouteItem {
        /**
         * Initializes the object and creates a regular expression from the path, using regexparam.
         *
         * @param {string} path - Path to the route (must start with '/' or '*')
         * @param {SvelteComponent} component - Svelte component for the route
         */
        constructor(path, component) {
            // Path must be a regular or expression, or a string starting with '/' or '*'
            if (!path || 
                (typeof path == 'string' && (path.length < 1 || (path.charAt(0) != '/' && path.charAt(0) != '*'))) ||
                (typeof path == 'object' && !(path instanceof RegExp))
            ) {
                throw Error('Invalid value for "path" argument')
            }

            const {pattern, keys} = regexparam(path);

            this.path = path;
            this.component = component;

            this._pattern = pattern;
            this._keys = keys;
        }

        /**
         * Checks if `path` matches the current route.
         * If there's a match, will return the list of parameters from the URL (if any).
         * In case of no match, the method will return `null`.
         *
         * @param {string} path - Path to test
         * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
         */
        match(path) {
            const matches = this._pattern.exec(path);
            if (matches === null) {
                return null
            }

            // If the input was a regular expression, this._keys would be false, so return matches as is
            if (this._keys === false) {
                return matches
            }

            const out = {};
            let i = 0;
            while (i < this._keys.length) {
                out[this._keys[i]] = matches[++i] || null;
            }
            return out
        }
    }

    // We need an iterable: if it's not a Map, use Object.entries
    const routesIterable = (routes instanceof Map) ? routes : Object.entries(routes);

    // Set up all routes
    const routesList = [];
    for (const [path, route] of routesIterable) {
        routesList.push(new RouteItem(path, route));
    }

    // Props for the component to render
    let component = null;
    let componentParams = {};

    	const writable_props = ['routes'];
    	Object_1.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('routes' in $$props) $$invalidate('routes', routes = $$props.routes);
    	};

    	$$self.$$.update = ($$dirty = { component: 1, $loc: 1 }) => {
    		if ($$dirty.component || $$dirty.$loc) { {
                // Find a route matching the location
                $$invalidate('component', component = null);
                let i = 0;
                while (!component && i < routesList.length) {
                    const match = routesList[i].match($loc.location);
                    if (match) {
                        $$invalidate('component', component = routesList[i].component);
                        $$invalidate('componentParams', componentParams = match);
                    }
                    i++;
                }
            } }
    	};

    	return { routes, component, componentParams };
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["routes"]);
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/MainPage.svelte generated by Svelte v3.7.0 */

    const file = "src/routes/MainPage.svelte";

    function create_fragment$1(ctx) {
    	var a0, link_action, t1, br, t2, a1, link_action_1;

    	return {
    		c: function create() {
    			a0 = element("a");
    			a0.textContent = "Error example using \"import (Button) from 'svelma'\"";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "Success example using \"import Button from 'svelma/src/components/Button.svelte'\"";
    			attr(a0, "href", "/problem/123");
    			add_location(a0, file, 5, 0, 67);
    			add_location(br, file, 6, 0, 155);
    			attr(a1, "href", "/ok/123");
    			add_location(a1, file, 8, 0, 161);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, a0, anchor);
    			link_action = link.call(null, a0) || {};
    			insert(target, t1, anchor);
    			insert(target, br, anchor);
    			insert(target, t2, anchor);
    			insert(target, a1, anchor);
    			link_action_1 = link.call(null, a1) || {};
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a0);
    			}

    			if (link_action && typeof link_action.destroy === 'function') link_action.destroy();

    			if (detaching) {
    				detach(t1);
    				detach(br);
    				detach(t2);
    				detach(a1);
    			}

    			if (link_action_1 && typeof link_action_1.destroy === 'function') link_action_1.destroy();
    		}
    	};
    }

    class MainPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    function e(){}function n(e,t){for(const n in t)e[n]=t[n];return e}function s(e){return e()}function i(){return Object.create(null)}function o(e){e.forEach(s);}function a(e){return "function"==typeof e}function c(e,t){return e!=e?t==t:e!==t||e&&"object"==typeof e||"function"==typeof e}function l(e,t,n){if(e){const s=r(e,t,n);return e[0](s)}}function r(e,t,s){return e[1]?n({},n(t.$$scope.ctx,e[1](s?s(t):{}))):t.$$scope.ctx}function u(e,t,s,i){return e[1]?n({},n(t.$$scope.changed||{},e[1](i?i(s):{}))):t.$$scope.changed||{}}function d(e){const t={};for(const n in e)"$"!==n[0]&&(t[n]=e[n]);return t}function b(e,t){e.appendChild(t);}function y(e,t,n){e.insertBefore(t,n||null);}function w(e){e.parentNode.removeChild(e);}function k(e){return document.createElement(e)}function x(e){return document.createTextNode(e)}function z(){return x(" ")}function T(){return x("")}function C(e,t,n,s){return e.addEventListener(t,n,s),()=>e.removeEventListener(t,n,s)}function _(e,t,n){null==n?e.removeAttribute(t):e.setAttribute(t,n);}function P(e,t){for(const n in t)"style"===n?e.style.cssText=t[n]:n in e?e[n]=t[n]:_(e,n,t[n]);}function E(e){return Array.from(e.childNodes)}function I(e,t,n,s){for(let s=0;s<e.length;s+=1){const i=e[s];if(i.nodeName===t){for(let e=0;e<i.attributes.length;e+=1){const t=i.attributes[e];n[t.name]||i.removeAttribute(t.name);}return e.splice(s,1)[0]}}return s?function(e){return document.createElementNS("http://www.w3.org/2000/svg",e)}(t):k(t)}function S(e,t){for(let n=0;n<e.length;n+=1){const s=e[n];if(3===s.nodeType)return s.data=t,e.splice(n,1)[0]}return x(t)}function B(e,t,n){e.classList[n?"add":"remove"](t);}let O;function N(e){O=e;}function F(){if(!O)throw new Error("Function called outside component initialization");return O}function M(e){F().$$.on_mount.push(e);}function Y(e,t){const n=e.$$.callbacks[t.type];n&&n.slice().forEach(e=>e(t));}const K=[],W=[],G=[],X=[],J=Promise.resolve();let Z=!1;function ee(){Z||(Z=!0,J.then(se));}function ne(e){G.push(e);}function se(){const e=new Set;do{for(;K.length;){const e=K.shift();N(e),ie(e.$$);}for(;W.length;)W.pop()();for(let t=0;t<G.length;t+=1){const n=G[t];e.has(n)||(n(),e.add(n));}G.length=0;}while(K.length);for(;X.length;)X.pop()();Z=!1;}function ie(e){e.fragment&&(e.update(e.dirty),o(e.before_update),e.fragment.p(e.dirty,e.ctx),e.dirty=null,e.after_update.forEach(ne));}const ce=new Set;let le;function re(){le={remaining:0,callbacks:[]};}function ue(){le.remaining||o(le.callbacks);}function de(e,t){e&&e.i&&(ce.delete(e),e.i(t));}function pe(e,t,n){if(e&&e.o){if(ce.has(e))return;ce.add(e),le.callbacks.push(()=>{ce.delete(e),n&&(e.d(1),n());}),e.o(t);}}function he(e,t){const n={},s={},i={$$scope:1};let o=e.length;for(;o--;){const a=e[o],c=t[o];if(c){for(const e in a)e in c||(s[e]=1);for(const e in c)i[e]||(n[e]=c[e],i[e]=1);e[o]=c;}else for(const e in a)i[e]=1;}for(const e in s)e in n||(n[e]=void 0);return n}function ve(e,t,n){const{fragment:i,on_mount:c,on_destroy:l,after_update:r}=e.$$;i.m(t,n),ne(()=>{const t=c.map(s).filter(a);l?l.push(...t):o(t),e.$$.on_mount=[];}),r.forEach(ne);}function $e(e,t){e.$$.fragment&&(o(e.$$.on_destroy),e.$$.fragment.d(t),e.$$.on_destroy=e.$$.fragment=null,e.$$.ctx={});}function be(t,n,s,a,c,l){const r=O;N(t);const u=n.props||{},d=t.$$={fragment:null,ctx:null,props:l,update:e,not_equal:c,bound:i(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(r?r.$$.context:[]),callbacks:i(),dirty:null};let p=!1;d.ctx=s?s(t,u,(e,n)=>{d.ctx&&c(d.ctx[e],d.ctx[e]=n)&&(d.bound[e]&&d.bound[e](n),p&&function(e,t){e.$$.dirty||(K.push(e),ee(),e.$$.dirty=i()),e.$$.dirty[t]=!0;}(t,e));}):u,d.update(),p=!0,o(d.before_update),d.fragment=a(d.ctx),n.target&&(n.hydrate?d.fragment.l(E(n.target)):d.fragment.c(),n.intro&&de(t.$$.fragment),ve(t,n.target,n.anchor),se()),N(r);}class ye{$destroy(){$e(this,1),this.$destroy=e;}$on(e,t){const n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),()=>{const e=n.indexOf(t);-1!==e&&n.splice(e,1);}}$set(){}}function we(t){var n,s,i,o,a;return {c(){n=k("span"),s=k("i"),this.h();},l(e){var t=E(n=I(e,"SPAN",{class:!0},!1));E(s=I(t,"I",{class:!0},!1)).forEach(w),t.forEach(w),this.h();},h(){_(s,"class",i=t.newPack+" fa-"+t.icon+" "+t.customClass+" "+t.newCustomSize),_(n,"class",o="icon "+t.size+" "+t.newType+" "+(t.isRight?"is-right":"")),B(n,"is-clickable",t.isClickable),a=C(n,"click",t.click_handler);},m(e,t){y(e,n,t),b(n,s);},p(e,t){(e.newPack||e.icon||e.customClass||e.newCustomSize)&&i!==(i=t.newPack+" fa-"+t.icon+" "+t.customClass+" "+t.newCustomSize)&&_(s,"class",i),(e.size||e.newType||e.isRight)&&o!==(o="icon "+t.size+" "+t.newType+" "+(t.isRight?"is-right":""))&&_(n,"class",o),(e.size||e.newType||e.isRight||e.isClickable)&&B(n,"is-clickable",t.isClickable);},i:e,o:e,d(e){e&&w(n),a();}}}function ke(e,t,n){let s,{type:i="",pack:o="fas",icon:a,size:c="",customClass:l="",customSize:r="",isClickable:u=!1,isRight:d=!1}=t,p="",m="";return e.$set=(e=>{"type"in e&&n("type",i=e.type),"pack"in e&&n("pack",o=e.pack),"icon"in e&&n("icon",a=e.icon),"size"in e&&n("size",c=e.size),"customClass"in e&&n("customClass",l=e.customClass),"customSize"in e&&n("customSize",r=e.customSize),"isClickable"in e&&n("isClickable",u=e.isClickable),"isRight"in e&&n("isRight",d=e.isRight);}),e.$$.update=((e={pack:1,customSize:1,size:1,type:1})=>{if(e.pack&&n("newPack",s=o||"fas"),e.customSize||e.size)if(r)n("newCustomSize",p=r);else switch(c){case"is-small":break;case"is-medium":n("newCustomSize",p="fa-lg");break;case"is-large":n("newCustomSize",p="fa-3x");break;default:n("newCustomSize",p="");}if(e.type){i||n("newType",m="");let e=[];if("string"==typeof i)e=i.split("-");else for(let t in i)if(i[t]){e=t.split("-");break}e.length<=1?n("newType",m=""):n("newType",m=`has-text-${e[1]}`);}}),{type:i,pack:o,icon:a,size:c,customClass:l,customSize:r,isClickable:u,isRight:d,newCustomSize:p,newType:m,newPack:s,click_handler:function(t){Y(e,t);}}}class xe extends ye{constructor(e){super(),be(this,e,ke,we,c,["type","pack","icon","size","customClass","customSize","isClickable","isRight"]);}}function ze(e){return e<.5?4*e*e*e:.5*Math.pow(2*e-2,3)+1}function Te(e){const t=e-1;return t*t*t+1}function Ce(e,{delay:t=0,duration:n=400}){const s=+getComputedStyle(e).opacity;return {delay:t,duration:n,css:e=>`opacity: ${e*s}`}}function _e(e,{delay:t=0,duration:n=400,easing:s=Te,x:i=0,y:o=0,opacity:a=0}){const c=getComputedStyle(e),l=+c.opacity,r="none"===c.transform?"":c.transform,u=l*(1-a);return {delay:t,duration:n,easing:s,css:(e,t)=>`\n\t\t\ttransform: ${r} translate(${(1-e)*i}px, ${(1-e)*o}px);\n\t\t\topacity: ${l-u*t}`}}var Pe=Object.freeze({crossfade:function(e){var{fallback:t}=e,s=function(e,t){var n={};for(var s in e)Object.prototype.hasOwnProperty.call(e,s)&&t.indexOf(s)<0&&(n[s]=e[s]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(s=Object.getOwnPropertySymbols(e);i<s.length;i++)t.indexOf(s[i])<0&&Object.prototype.propertyIsEnumerable.call(e,s[i])&&(n[s[i]]=e[s[i]]);}return n}(e,["fallback"]);const i=new Map,o=new Map;function c(e,i,o){return (c,l)=>(e.set(l.key,{rect:c.getBoundingClientRect()}),()=>{if(i.has(l.key)){const{rect:e}=i.get(l.key);return i.delete(l.key),function(e,t,i){const{delay:o=0,duration:c=(e=>30*Math.sqrt(e)),easing:l=Te}=n(n({},s),i),r=t.getBoundingClientRect(),u=e.left-r.left,d=e.top-r.top,p=e.width/r.width,m=e.height/r.height,f=Math.sqrt(u*u+d*d),h=getComputedStyle(t),g="none"===h.transform?"":h.transform,v=+h.opacity;return {delay:o,duration:a(c)?c(f):c,easing:l,css:(e,t)=>`\n\t\t\t\topacity: ${e*v};\n\t\t\t\ttransform-origin: top left;\n\t\t\t\ttransform: ${g} translate(${t*u}px,${t*d}px) scale(${e+(1-e)*p}, ${e+(1-e)*m});\n\t\t\t`}}(e,c,l)}return e.delete(l.key),t&&t(c,l,o)})}return [c(o,i,!1),c(i,o,!0)]},draw:function(e,{delay:t=0,speed:n,duration:s,easing:i=ze}){const o=e.getTotalLength();return void 0===s?s=void 0===n?800:o/n:"function"==typeof s&&(s=s(o)),{delay:t,duration:s,easing:i,css:(e,t)=>`stroke-dasharray: ${e*o} ${t*o}`}},fade:Ce,fly:_e,scale:function(e,{delay:t=0,duration:n=400,easing:s=Te,start:i=0,opacity:o=0}){const a=getComputedStyle(e),c=+a.opacity,l="none"===a.transform?"":a.transform,r=1-i,u=c*(1-o);return {delay:t,duration:n,easing:s,css:(e,t)=>`\n\t\t\ttransform: ${l} scale(${1-r*t});\n\t\t\topacity: ${c-u*t}\n\t\t`}},slide:function(e,{delay:t=0,duration:n=400,easing:s=Te}){const i=getComputedStyle(e),o=+i.opacity,a=parseFloat(i.height),c=parseFloat(i.paddingTop),l=parseFloat(i.paddingBottom),r=parseFloat(i.marginTop),u=parseFloat(i.marginBottom),d=parseFloat(i.borderTopWidth),p=parseFloat(i.borderBottomWidth);return {delay:t,duration:n,easing:s,css:e=>"overflow: hidden;"+`opacity: ${Math.min(20*e,1)*o};`+`height: ${e*a}px;`+`padding-top: ${e*c}px;`+`padding-bottom: ${e*l}px;`+`margin-top: ${e*r}px;`+`margin-bottom: ${e*u}px;`+`border-top-width: ${e*d}px;`+`border-bottom-width: ${e*p}px;`}}});function Se(e,...t){return Object.keys(e).reduce((n,s)=>(-1===t.indexOf(s)&&(n[s]=e[s]),n),{})}function je(e){var t,s,i,o,a,c,d=e.iconLeft&&Re(e);const p=e.$$slots.default,m=l(p,e,null);for(var f=e.iconRight&&Oe(e),h=[{href:e.href},e.props],g={},v=0;v<h.length;v+=1)g=n(g,h[v]);return {c(){t=k("a"),d&&d.c(),s=z(),i=k("span"),m&&m.c(),o=z(),f&&f.c(),this.h();},l(e){var n=E(t=I(e,"A",{href:!0},!1));d&&d.l(n),s=S(n,"\n    ");var a=E(i=I(n,"SPAN",{},!1));m&&m.l(a),a.forEach(w),o=S(n,"\n    "),f&&f.l(n),n.forEach(w),this.h();},h(){P(t,g),B(t,"is-inverted",e.inverted),B(t,"is-loading",e.loading),B(t,"is-outlined",e.outlined),B(t,"is-rounded",e.rounded),c=C(t,"click",e.click_handler_1);},m(e,n){y(e,t,n),d&&d.m(t,null),b(t,s),b(t,i),m&&m.m(i,null),b(t,o),f&&f.m(t,null),a=!0;},p(e,n){n.iconLeft?d?(d.p(e,n),de(d,1)):((d=Re(n)).c(),de(d,1),d.m(t,s)):d&&(re(),pe(d,1,()=>{d=null;}),ue()),m&&m.p&&e.$$scope&&m.p(u(p,n,e,null),r(p,n,null)),n.iconRight?f?(f.p(e,n),de(f,1)):((f=Oe(n)).c(),de(f,1),f.m(t,null)):f&&(re(),pe(f,1,()=>{f=null;}),ue()),P(t,he(h,[e.href&&{href:n.href},e.props&&n.props])),e.inverted&&B(t,"is-inverted",n.inverted),e.loading&&B(t,"is-loading",n.loading),e.outlined&&B(t,"is-outlined",n.outlined),e.rounded&&B(t,"is-rounded",n.rounded);},i(e){a||(de(d),de(m,e),de(f),a=!0);},o(e){pe(d),pe(m,e),pe(f),a=!1;},d(e){e&&w(t),d&&d.d(),m&&m.d(e),f&&f.d(),c();}}}function Be(e){var t,s,i,o,a,c,d=e.iconLeft&&Le(e);const p=e.$$slots.default,m=l(p,e,null);for(var f=e.iconRight&&Ae(e),h=[e.props],g={},v=0;v<h.length;v+=1)g=n(g,h[v]);return {c(){t=k("button"),d&&d.c(),s=z(),i=k("span"),m&&m.c(),o=z(),f&&f.c(),this.h();},l(e){var n=E(t=I(e,"BUTTON",{},!1));d&&d.l(n),s=S(n,"\n    ");var a=E(i=I(n,"SPAN",{},!1));m&&m.l(a),a.forEach(w),o=S(n,"\n    "),f&&f.l(n),n.forEach(w),this.h();},h(){P(t,g),B(t,"is-inverted",e.inverted),B(t,"is-loading",e.loading),B(t,"is-outlined",e.outlined),B(t,"is-rounded",e.rounded),c=C(t,"click",e.click_handler);},m(e,n){y(e,t,n),d&&d.m(t,null),b(t,s),b(t,i),m&&m.m(i,null),b(t,o),f&&f.m(t,null),a=!0;},p(e,n){n.iconLeft?d?(d.p(e,n),de(d,1)):((d=Le(n)).c(),de(d,1),d.m(t,s)):d&&(re(),pe(d,1,()=>{d=null;}),ue()),m&&m.p&&e.$$scope&&m.p(u(p,n,e,null),r(p,n,null)),n.iconRight?f?(f.p(e,n),de(f,1)):((f=Ae(n)).c(),de(f,1),f.m(t,null)):f&&(re(),pe(f,1,()=>{f=null;}),ue()),P(t,he(h,[e.props&&n.props])),e.inverted&&B(t,"is-inverted",n.inverted),e.loading&&B(t,"is-loading",n.loading),e.outlined&&B(t,"is-outlined",n.outlined),e.rounded&&B(t,"is-rounded",n.rounded);},i(e){a||(de(d),de(m,e),de(f),a=!0);},o(e){pe(d),pe(m,e),pe(f),a=!1;},d(e){e&&w(t),d&&d.d(),m&&m.d(e),f&&f.d(),c();}}}function Re(e){var t,n=new xe({props:{pack:e.iconPack,icon:e.iconLeft,size:e.iconSize}});return {c(){n.$$.fragment.c();},l(e){n.$$.fragment.l(e);},m(e,s){ve(n,e,s),t=!0;},p(e,t){var s={};e.iconPack&&(s.pack=t.iconPack),e.iconLeft&&(s.icon=t.iconLeft),e.iconSize&&(s.size=t.iconSize),n.$set(s);},i(e){t||(de(n.$$.fragment,e),t=!0);},o(e){pe(n.$$.fragment,e),t=!1;},d(e){$e(n,e);}}}function Oe(e){var t,n=new xe({props:{pack:e.iconPack,icon:e.iconRight,size:e.iconSize}});return {c(){n.$$.fragment.c();},l(e){n.$$.fragment.l(e);},m(e,s){ve(n,e,s),t=!0;},p(e,t){var s={};e.iconPack&&(s.pack=t.iconPack),e.iconRight&&(s.icon=t.iconRight),e.iconSize&&(s.size=t.iconSize),n.$set(s);},i(e){t||(de(n.$$.fragment,e),t=!0);},o(e){pe(n.$$.fragment,e),t=!1;},d(e){$e(n,e);}}}function Le(e){var t,n=new xe({props:{pack:e.iconPack,icon:e.iconLeft,size:e.iconSize}});return {c(){n.$$.fragment.c();},l(e){n.$$.fragment.l(e);},m(e,s){ve(n,e,s),t=!0;},p(e,t){var s={};e.iconPack&&(s.pack=t.iconPack),e.iconLeft&&(s.icon=t.iconLeft),e.iconSize&&(s.size=t.iconSize),n.$set(s);},i(e){t||(de(n.$$.fragment,e),t=!0);},o(e){pe(n.$$.fragment,e),t=!1;},d(e){$e(n,e);}}}function Ae(e){var t,n=new xe({props:{pack:e.iconPack,icon:e.iconRight,size:e.iconSize}});return {c(){n.$$.fragment.c();},l(e){n.$$.fragment.l(e);},m(e,s){ve(n,e,s),t=!0;},p(e,t){var s={};e.iconPack&&(s.pack=t.iconPack),e.iconRight&&(s.icon=t.iconRight),e.iconSize&&(s.size=t.iconSize),n.$set(s);},i(e){t||(de(n.$$.fragment,e),t=!0);},o(e){pe(n.$$.fragment,e),t=!1;},d(e){$e(n,e);}}}function Ve(e){var t,n,s,i,o=[Be,je],a=[];function c(e){return "button"===e.tag?0:"a"===e.tag?1:-1}return ~(t=c(e))&&(n=a[t]=o[t](e)),{c(){n&&n.c(),s=T();},l(e){n&&n.l(e),s=T();},m(e,n){~t&&a[t].m(e,n),y(e,s,n),i=!0;},p(e,i){var l=t;(t=c(i))===l?~t&&a[t].p(e,i):(n&&(re(),pe(a[l],1,()=>{a[l]=null;}),ue()),~t?((n=a[t])||(n=a[t]=o[t](i)).c(),de(n,1),n.m(s.parentNode,s)):n=null);},i(e){i||(de(n),i=!0);},o(e){pe(n),i=!1;},d(e){~t&&a[t].d(e),e&&w(s);}}}function De(e,t,s){let{tag:i="button",type:o="",size:a="",href:c="",loading:l=!1,inverted:r=!1,outlined:u=!1,rounded:p=!1,iconLeft:m=null,iconRight:f=null,iconPack:h=null}=t,g="";M(()=>{if(!["button","a"].includes(i))throw new Error(`'${i}' cannot be used as a tag for a Bulma button`)});let v,{$$slots:$={},$$scope:b}=t;return e.$set=(e=>{s("$$props",t=n(n({},t),e)),"tag"in e&&s("tag",i=e.tag),"type"in e&&s("type",o=e.type),"size"in e&&s("size",a=e.size),"href"in e&&s("href",c=e.href),"loading"in e&&s("loading",l=e.loading),"inverted"in e&&s("inverted",r=e.inverted),"outlined"in e&&s("outlined",u=e.outlined),"rounded"in e&&s("rounded",p=e.rounded),"iconLeft"in e&&s("iconLeft",m=e.iconLeft),"iconRight"in e&&s("iconRight",f=e.iconRight),"iconPack"in e&&s("iconPack",h=e.iconPack),"$$scope"in e&&s("$$scope",b=e.$$scope);}),e.$$.update=((e={$$props:1,type:1,size:1})=>{(e.type||e.size)&&s("props",v={...Se(t,"loading","inverted","outlined","rounded"),class:`button ${o} ${a} ${t.class||""}`}),e.size&&s("iconSize",g=a&&"is-medium"!==a?"is-large"===a?"is-medium":a:"is-small");}),{tag:i,type:o,size:a,href:c,loading:l,inverted:r,outlined:u,rounded:p,iconLeft:m,iconRight:f,iconPack:h,iconSize:g,props:v,click_handler:function(t){Y(e,t);},click_handler_1:function(t){Y(e,t);},$$props:t=d(t),$$slots:$,$$scope:b}}class Ne extends ye{constructor(e){super(),be(this,e,De,Ve,c,["tag","type","size","href","loading","inverted","outlined","rounded","iconLeft","iconRight","iconPack"]);}}

    /* src/routes/TheErrorRoute.svelte generated by Svelte v3.7.0 */

    const file$1 = "src/routes/TheErrorRoute.svelte";

    // (9:0) <Button>
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("A button that does nothing");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var t, a, link_action, current;

    	var button = new Ne({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			button.$$.fragment.c();
    			t = space();
    			a = element("a");
    			a.textContent = "This will error";
    			attr(a, "href", "/");
    			add_location(a, file$1, 10, 0, 164);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert(target, t, anchor);
    			insert(target, a, anchor);
    			link_action = link.call(null, a) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);

    			if (detaching) {
    				detach(t);
    				detach(a);
    			}

    			if (link_action && typeof link_action.destroy === 'function') link_action.destroy();
    		}
    	};
    }

    function instance$1($$self) {
    	

    console.log(Ne);

    	return {};
    }

    class TheErrorRoute extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* node_modules/svelma/src/components/Icon.svelte generated by Svelte v3.7.0 */

    const file$2 = "node_modules/svelma/src/components/Icon.svelte";

    function create_fragment$3(ctx) {
    	var span, i, i_class_value, span_class_value, dispose;

    	return {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr(i, "class", i_class_value = "" + ctx.newPack + " fa-" + ctx.icon + " " + ctx.customClass + " " + ctx.newCustomSize);
    			add_location(i, file$2, 52, 2, 1131);
    			attr(span, "class", span_class_value = "icon " + ctx.size + " " + ctx.newType + " " + ((ctx.isRight && 'is-right') || ''));
    			toggle_class(span, "is-clickable", ctx.isClickable);
    			add_location(span, file$2, 51, 0, 1018);
    			dispose = listen(span, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, i);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.newPack || changed.icon || changed.customClass || changed.newCustomSize) && i_class_value !== (i_class_value = "" + ctx.newPack + " fa-" + ctx.icon + " " + ctx.customClass + " " + ctx.newCustomSize)) {
    				attr(i, "class", i_class_value);
    			}

    			if ((changed.size || changed.newType || changed.isRight) && span_class_value !== (span_class_value = "icon " + ctx.size + " " + ctx.newType + " " + ((ctx.isRight && 'is-right') || ''))) {
    				attr(span, "class", span_class_value);
    			}

    			if ((changed.size || changed.newType || changed.isRight || changed.isClickable)) {
    				toggle_class(span, "is-clickable", ctx.isClickable);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { type = '', pack = 'fas', icon, size = '', customClass = '', customSize = '', isClickable = false, isRight = false } = $$props;

      let newCustomSize = '';
      let newType = '';

    	const writable_props = ['type', 'pack', 'icon', 'size', 'customClass', 'customSize', 'isClickable', 'isRight'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('pack' in $$props) $$invalidate('pack', pack = $$props.pack);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('size' in $$props) $$invalidate('size', size = $$props.size);
    		if ('customClass' in $$props) $$invalidate('customClass', customClass = $$props.customClass);
    		if ('customSize' in $$props) $$invalidate('customSize', customSize = $$props.customSize);
    		if ('isClickable' in $$props) $$invalidate('isClickable', isClickable = $$props.isClickable);
    		if ('isRight' in $$props) $$invalidate('isRight', isRight = $$props.isRight);
    	};

    	let newPack;

    	$$self.$$.update = ($$dirty = { pack: 1, customSize: 1, size: 1, type: 1 }) => {
    		if ($$dirty.pack) { $$invalidate('newPack', newPack = pack || 'fas'); }
    		if ($$dirty.customSize || $$dirty.size) { {
            if (customSize) $$invalidate('newCustomSize', newCustomSize = customSize);
            else {
              switch (size) {
                case 'is-small':
                  break
                case 'is-medium':
                  $$invalidate('newCustomSize', newCustomSize = 'fa-lg');
                  break
                case 'is-large':
                  $$invalidate('newCustomSize', newCustomSize = 'fa-3x');
                  break
                default:
                  $$invalidate('newCustomSize', newCustomSize = '');
              }
            }
          } }
    		if ($$dirty.type) { {
            if (!type) $$invalidate('newType', newType = '');
            let splitType = [];
            if (typeof type === 'string') {
              splitType = type.split('-');
            } else {
              for (let key in type) {
                if (type[key]) {
                  splitType = key.split('-');
                  break
                }
              }
            }
            if (splitType.length <= 1) $$invalidate('newType', newType = '');
            else $$invalidate('newType', newType = `has-text-${splitType[1]}`);
          } }
    	};

    	return {
    		type,
    		pack,
    		icon,
    		size,
    		customClass,
    		customSize,
    		isClickable,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack,
    		click_handler
    	};
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, ["type", "pack", "icon", "size", "customClass", "customSize", "isClickable", "isRight"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.icon === undefined && !('icon' in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get type() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pack() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pack(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customClass() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customClass(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customSize() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customSize(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isClickable() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isClickable(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRight() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRight(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function omit(obj, ...keysToOmit) {
      return Object.keys(obj).reduce((acc, key) => {
        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
        return acc
      }, {})
    }

    /* node_modules/svelma/src/components/Button.svelte generated by Svelte v3.7.0 */
    const { Error: Error_1$1 } = globals;

    const file$3 = "node_modules/svelma/src/components/Button.svelte";

    // (78:22) 
    function create_if_block_3(ctx) {
    	var a, t0, span, t1, current, dispose;

    	var if_block0 = (ctx.iconLeft) && create_if_block_5(ctx);

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	var if_block1 = (ctx.iconRight) && create_if_block_4(ctx);

    	var a_levels = [
    		{ href: ctx.href },
    		ctx.props
    	];

    	var a_data = {};
    	for (var i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	return {
    		c: function create() {
    			a = element("a");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");

    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();

    			add_location(span, file$3, 89, 4, 2094);
    			set_attributes(a, a_data);
    			toggle_class(a, "is-inverted", ctx.inverted);
    			toggle_class(a, "is-loading", ctx.loading);
    			toggle_class(a, "is-outlined", ctx.outlined);
    			toggle_class(a, "is-rounded", ctx.rounded);
    			add_location(a, file$3, 78, 2, 1827);
    			dispose = listen(a, "click", ctx.click_handler_1);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			if (if_block0) if_block0.m(a, null);
    			append(a, t0);
    			append(a, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append(a, t1);
    			if (if_block1) if_block1.m(a, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.iconLeft) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(a, t0);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (ctx.iconRight) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(a, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			set_attributes(a, get_spread_update(a_levels, [
    				(changed.href) && { href: ctx.href },
    				(changed.props) && ctx.props
    			]));

    			if (changed.inverted) {
    				toggle_class(a, "is-inverted", ctx.inverted);
    			}

    			if (changed.loading) {
    				toggle_class(a, "is-loading", ctx.loading);
    			}

    			if (changed.outlined) {
    				toggle_class(a, "is-outlined", ctx.outlined);
    			}

    			if (changed.rounded) {
    				toggle_class(a, "is-rounded", ctx.rounded);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (if_block0) if_block0.d();

    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};
    }

    // (60:0) {#if tag === 'button'}
    function create_if_block(ctx) {
    	var button, t0, span, t1, current, dispose;

    	var if_block0 = (ctx.iconLeft) && create_if_block_2(ctx);

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	var if_block1 = (ctx.iconRight) && create_if_block_1(ctx);

    	var button_levels = [
    		ctx.props
    	];

    	var button_data = {};
    	for (var i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	return {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");

    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();

    			add_location(span, file$3, 70, 4, 1662);
    			set_attributes(button, button_data);
    			toggle_class(button, "is-inverted", ctx.inverted);
    			toggle_class(button, "is-loading", ctx.loading);
    			toggle_class(button, "is-outlined", ctx.outlined);
    			toggle_class(button, "is-rounded", ctx.rounded);
    			add_location(button, file$3, 60, 2, 1401);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(span_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append(button, t0);
    			append(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.iconLeft) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (ctx.iconRight) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				(changed.props) && ctx.props
    			]));

    			if (changed.inverted) {
    				toggle_class(button, "is-inverted", ctx.inverted);
    			}

    			if (changed.loading) {
    				toggle_class(button, "is-loading", ctx.loading);
    			}

    			if (changed.outlined) {
    				toggle_class(button, "is-outlined", ctx.outlined);
    			}

    			if (changed.rounded) {
    				toggle_class(button, "is-rounded", ctx.rounded);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (if_block0) if_block0.d();

    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};
    }

    // (87:4) {#if iconLeft}
    function create_if_block_5(ctx) {
    	var current;

    	var icon = new Icon({
    		props: {
    		pack: ctx.iconPack,
    		icon: ctx.iconLeft,
    		size: ctx.iconSize
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			icon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.iconPack) icon_changes.pack = ctx.iconPack;
    			if (changed.iconLeft) icon_changes.icon = ctx.iconLeft;
    			if (changed.iconSize) icon_changes.size = ctx.iconSize;
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};
    }

    // (93:4) {#if iconRight}
    function create_if_block_4(ctx) {
    	var current;

    	var icon = new Icon({
    		props: {
    		pack: ctx.iconPack,
    		icon: ctx.iconRight,
    		size: ctx.iconSize
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			icon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.iconPack) icon_changes.pack = ctx.iconPack;
    			if (changed.iconRight) icon_changes.icon = ctx.iconRight;
    			if (changed.iconSize) icon_changes.size = ctx.iconSize;
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};
    }

    // (68:4) {#if iconLeft}
    function create_if_block_2(ctx) {
    	var current;

    	var icon = new Icon({
    		props: {
    		pack: ctx.iconPack,
    		icon: ctx.iconLeft,
    		size: ctx.iconSize
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			icon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.iconPack) icon_changes.pack = ctx.iconPack;
    			if (changed.iconLeft) icon_changes.icon = ctx.iconLeft;
    			if (changed.iconSize) icon_changes.size = ctx.iconSize;
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};
    }

    // (74:4) {#if iconRight}
    function create_if_block_1(ctx) {
    	var current;

    	var icon = new Icon({
    		props: {
    		pack: ctx.iconPack,
    		icon: ctx.iconRight,
    		size: ctx.iconSize
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			icon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_changes = {};
    			if (changed.iconPack) icon_changes.pack = ctx.iconPack;
    			if (changed.iconRight) icon_changes.icon = ctx.iconRight;
    			if (changed.iconSize) icon_changes.size = ctx.iconSize;
    			icon.$set(icon_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_if_block_3
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.tag === 'button') return 0;
    		if (ctx.tag === 'a') return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				if (if_block) {
    					group_outros();
    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});
    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];
    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (~current_block_type_index) if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      /** HTML tag to use for button (either 'a' or 'button')
       * @svelte-prop {String} tag=button
       * @values <code>button</code>, <code>a</code>
       * */
      let { tag = 'button', type = '', size = '', href = '', loading = false, inverted = false, outlined = false, rounded = false, iconLeft = null, iconRight = null, iconPack = null } = $$props;

      let iconSize = '';

      onMount(() => {
        if (!['button', 'a'].includes(tag)) throw new Error(`'${tag}' cannot be used as a tag for a Bulma button`)
      });

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('tag' in $$new_props) $$invalidate('tag', tag = $$new_props.tag);
    		if ('type' in $$new_props) $$invalidate('type', type = $$new_props.type);
    		if ('size' in $$new_props) $$invalidate('size', size = $$new_props.size);
    		if ('href' in $$new_props) $$invalidate('href', href = $$new_props.href);
    		if ('loading' in $$new_props) $$invalidate('loading', loading = $$new_props.loading);
    		if ('inverted' in $$new_props) $$invalidate('inverted', inverted = $$new_props.inverted);
    		if ('outlined' in $$new_props) $$invalidate('outlined', outlined = $$new_props.outlined);
    		if ('rounded' in $$new_props) $$invalidate('rounded', rounded = $$new_props.rounded);
    		if ('iconLeft' in $$new_props) $$invalidate('iconLeft', iconLeft = $$new_props.iconLeft);
    		if ('iconRight' in $$new_props) $$invalidate('iconRight', iconRight = $$new_props.iconRight);
    		if ('iconPack' in $$new_props) $$invalidate('iconPack', iconPack = $$new_props.iconPack);
    		if ('$$scope' in $$new_props) $$invalidate('$$scope', $$scope = $$new_props.$$scope);
    	};

    	let props;

    	$$self.$$.update = ($$dirty = { $$props: 1, type: 1, size: 1 }) => {
    		$$invalidate('props', props = {
            ...omit($$props, 'loading', 'inverted', 'outlined', 'rounded'),
            class: `button ${type} ${size} ${$$props.class || ''}`,
          });
    		if ($$dirty.size) { {
            if (!size || size === 'is-medium') {
              $$invalidate('iconSize', iconSize = 'is-small');
            } else if (size === 'is-large') {
              $$invalidate('iconSize', iconSize = 'is-medium');
            } else {
              $$invalidate('iconSize', iconSize = size);
            }
          } }
    	};

    	return {
    		tag,
    		type,
    		size,
    		href,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props,
    		click_handler,
    		click_handler_1,
    		$$props: $$props = exclude_internal_props($$props),
    		$$slots,
    		$$scope
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["tag", "type", "size", "href", "loading", "inverted", "outlined", "rounded", "iconLeft", "iconRight", "iconPack"]);
    	}

    	get tag() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverted() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverted(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconLeft() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconLeft(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconRight() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconRight(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error_1$1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error_1$1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/TheSuccessRoute.svelte generated by Svelte v3.7.0 */

    const file$4 = "src/routes/TheSuccessRoute.svelte";

    // (10:0) <Button>
    function create_default_slot$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("A button that does nothing");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	var t, a, link_action, current;

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			button.$$.fragment.c();
    			t = space();
    			a = element("a");
    			a.textContent = "This will succeed";
    			attr(a, "href", "/");
    			add_location(a, file$4, 11, 0, 190);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			insert(target, t, anchor);
    			insert(target, a, anchor);
    			link_action = link.call(null, a) || {};
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);

    			if (detaching) {
    				detach(t);
    				detach(a);
    			}

    			if (link_action && typeof link_action.destroy === 'function') link_action.destroy();
    		}
    	};
    }

    function instance$4($$self) {
    	

    console.log(Button);

    	return {};
    }

    class TheSuccessRoute extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src/routes/NotFound.svelte generated by Svelte v3.7.0 */

    const file$5 = "src/routes/NotFound.svelte";

    function create_fragment$6(ctx) {
    	var h2, t_1, p;

    	return {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "NotFound";
    			t_1 = space();
    			p = element("p");
    			p.textContent = "Oops, this route doesn't exist!";
    			attr(h2, "class", "routetitle");
    			add_location(h2, file$5, 0, 0, 0);
    			add_location(p, file$5, 1, 0, 37);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, h2, anchor);
    			insert(target, t_1, anchor);
    			insert(target, p, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h2);
    				detach(t_1);
    				detach(p);
    			}
    		}
    	};
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, []);
    	}
    }

    var routes = {
        // Exact path
        '/': MainPage,
        '/problem/:id': TheErrorRoute,
        '/ok/:id': TheSuccessRoute,
        // Catch-all, must be last
        '*': NotFound,
    };

    /* src/App.svelte generated by Svelte v3.7.0 */

    function create_fragment$7(ctx) {
    	var current;

    	var router = new Router({
    		props: { routes: routes },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			router.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var router_changes = {};
    			if (changed.routes) router_changes.routes = routes;
    			router.$set(router_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$7, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
