/**
 * @file
 * Drupal Bootstrap object.
 */

/**
 * All Drupal Bootstrap JavaScript APIs are contained in this namespace.
 *
 * @param {underscore} _
 * @param {jQuery} $
 * @param {Drupal} Drupal
 * @param {drupalSettings} drupalSettings
 */
(function (_, $, Drupal, drupalSettings) {
  'use strict';

  /**
   * @typedef Drupal.bootstrap
   */
  var Bootstrap = {
    processedOnce: {},
    settings: drupalSettings.bootstrap || {}
  };

  /**
   * Wraps Drupal.checkPlain() to ensure value passed isn't empty.
   *
   * Encodes special characters in a plain-text string for display as HTML.
   *
   * @param {string} str
   *   The string to be encoded.
   *
   * @return {string}
   *   The encoded string.
   *
   * @ingroup sanitization
   */
  Bootstrap.checkPlain = function (str) {
    return str && Drupal.checkPlain(str) || '';
  };

  /**
   * Creates a jQuery plugin.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} plugin
   *   A constructor function used to initialize the for the jQuery plugin.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.createPlugin = function (id, plugin, noConflict) {
    // Immediately return if plugin doesn't exist.
    if ($.fn[id] !== void 0) {
      return this.fatal('Specified jQuery plugin identifier already exists: @id. Use Drupal.bootstrap.replacePlugin() instead.', {'@id': id});
    }

    // Immediately return if plugin isn't a function.
    if (typeof plugin !== 'function') {
      return this.fatal('You must provide a constructor function to create a jQuery plugin "@id": @plugin', {'@id': id, '@plugin':  plugin});
    }

    // Add a ".noConflict()" helper method.
    this.pluginNoConflict(id, plugin, noConflict);

    $.fn[id] = plugin;
  };

  /**
   * Diff object properties.
   *
   * @param {...Object} objects
   *   Two or more objects. The first object will be used to return properties
   *   values.
   *
   * @return {Object}
   *   Returns the properties of the first passed object that are not present
   *   in all other passed objects.
   */
  Bootstrap.diffObjects = function (objects) {
    var args = Array.prototype.slice.call(arguments);
    return _.pick(args[0], _.difference.apply(_, _.map(args, function (obj) {
      return Object.keys(obj);
    })));
  };

  /**
   * Map of supported events by regular expression.
   *
   * @type {Object<Event|MouseEvent|KeyboardEvent|TouchEvent,RegExp>}
   */
  Bootstrap.eventMap = {
    Event: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    MouseEvent: /^(?:click|dblclick|mouse(?:down|enter|leave|up|over|move|out))$/,
    KeyboardEvent: /^(?:key(?:down|press|up))$/,
    TouchEvent: /^(?:touch(?:start|end|move|cancel))$/
  };

  /**
   * Extends a jQuery Plugin.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} callback
   *   A constructor function used to initialize the for the jQuery plugin.
   *
   * @return {Function|Boolean}
   *   The jQuery plugin constructor or FALSE if the plugin does not exist.
   */
  Bootstrap.extendPlugin = function (id, callback) {
    // Immediately return if plugin doesn't exist.
    if (typeof $.fn[id] !== 'function') {
      return this.fatal('Specified jQuery plugin identifier does not exist: @id', {'@id':  id});
    }

    // Immediately return if callback isn't a function.
    if (typeof callback !== 'function') {
      return this.fatal('You must provide a callback function to extend the jQuery plugin "@id": @callback', {'@id': id, '@callback':  callback});
    }

    // Determine existing plugin constructor.
    var constructor = $.fn[id] && $.fn[id].Constructor || $.fn[id];
    var plugin = callback.apply(constructor, [this.settings]);
    if (!$.isPlainObject(plugin)) {
      return this.fatal('Returned value from callback is not a plain object that can be used to extend the jQuery plugin "@id": @obj', {'@obj':  plugin});
    }

    this.wrapPluginConstructor(constructor, plugin, true);

    return $.fn[id];
  };

  Bootstrap.superWrapper = function (parent, fn) {
    return function () {
      var previousSuper = this.super;
      this.super = parent;
      var ret = fn.apply(this, arguments);
      if (previousSuper) {
        this.super = previousSuper;
      }
      else {
        delete this.super;
      }
      return ret;
    };
  };

  /**
   * Provide a helper method for displaying when something is went wrong.
   *
   * @param {String} message
   *   The message to display.
   * @param {Object} [args]
   *   An arguments to use in message.
   *
   * @return {Boolean}
   *   Always returns FALSE.
   */
  Bootstrap.fatal = function (message, args) {
    if (this.settings.dev && console.warn) {
      for (var name in args) {
        if (args.hasOwnProperty(name) && typeof args[name] === 'object') {
          args[name] = JSON.stringify(args[name]);
        }
      }
      Drupal.throwError(new Error(Drupal.formatString(message, args)));
    }
    return false;
  };

  /**
   * Intersects object properties.
   *
   * @param {...Object} objects
   *   Two or more objects. The first object will be used to return properties
   *   values.
   *
   * @return {Object}
   *   Returns the properties of first passed object that intersects with all
   *   other passed objects.
   */
  Bootstrap.intersectObjects = function (objects) {
    var args = Array.prototype.slice.call(arguments);
    return _.pick(args[0], _.intersection.apply(_, _.map(args, function (obj) {
      return Object.keys(obj);
    })));
  };

  /**
   * Normalizes an object's values.
   *
   * @param {Object} obj
   *   The object to normalize.
   *
   * @return {Object}
   *   The normalized object.
   */
  Bootstrap.normalizeObject = function (obj) {
    if (!$.isPlainObject(obj)) {
      return obj;
    }

    for (var k in obj) {
      if (typeof obj[k] === 'string') {
        if (obj[k] === 'true') {
          obj[k] = true;
        }
        else if (obj[k] === 'false') {
          obj[k] = false;
        }
        else if (obj[k].match(/^[\d-.]$/)) {
          obj[k] = parseFloat(obj[k]);
        }
      }
      else if ($.isPlainObject(obj[k])) {
        obj[k] = Bootstrap.normalizeObject(obj[k]);
      }
    }

    return obj;
  };

  /**
   * An object based once plugin (similar to jquery.once, but without the DOM).
   *
   * @param {String} id
   *   A unique identifier.
   * @param {Function} callback
   *   The callback to invoke if the identifier has not yet been seen.
   *
   * @return {Bootstrap}
   */
  Bootstrap.once = function (id, callback) {
    // Immediately return if identifier has already been processed.
    if (this.processedOnce[id]) {
      return this;
    }
    callback.call(this, this.settings);
    this.processedOnce[id] = true;
    return this;
  };

  /**
   * Provide jQuery UI like ability to get/set options for Bootstrap plugins.
   *
   * @param {string|object} key
   *   A string value of the option to set, can be dot like to a nested key.
   *   An object of key/value pairs.
   * @param {*} [value]
   *   (optional) A value to set for key.
   *
   * @returns {*}
   *   - Returns nothing if key is an object or both key and value parameters
   *   were provided to set an option.
   *   - Returns the a value for a specific setting if key was provided.
   *   - Returns an object of key/value pairs of all the options if no key or
   *   value parameter was provided.
   *
   * @see https://github.com/jquery/jquery-ui/blob/master/ui/widget.js
   */
  Bootstrap.option = function (key, value) {
    var options = $.isPlainObject(key) ? $.extend({}, key) : {};

    // Get all options (clone so it doesn't reference the internal object).
    if (arguments.length === 0) {
      return $.extend({}, this.options);
    }

    // Get/set single option.
    if (typeof key === "string") {
      // Handle nested keys in dot notation.
      // e.g., "foo.bar" => { foo: { bar: true } }
      var parts = key.split('.');
      key = parts.shift();
      var obj = options;
      if (parts.length) {
        for (var i = 0; i < parts.length - 1; i++) {
          obj[parts[i]] = obj[parts[i]] || {};
          obj = obj[parts[i]];
        }
        key = parts.pop();
      }

      // Get.
      if (arguments.length === 1) {
        return obj[key] === void 0 ? null : obj[key];
      }

      // Set.
      obj[key] = value;
    }

    // Set multiple options.
    $.extend(true, this.options, options);
  };

  /**
   * Adds a ".noConflict()" helper method if needed.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} plugin
   * @param {Function} plugin
   *   A constructor function used to initialize the for the jQuery plugin.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.pluginNoConflict = function (id, plugin, noConflict) {
    if (plugin.noConflict === void 0 && (noConflict === void 0 || noConflict)) {
      var old = $.fn[id];
      plugin.noConflict = function () {
        $.fn[id] = old;
        return this;
      };
    }
  };

  /**
   * Creates a handler that relays to another event name.
   *
   * @param {HTMLElement|jQuery} target
   *   A target element.
   * @param {String} name
   *   The name of the event to trigger.
   * @param {Boolean} [stopPropagation=true]
   *   Flag indicating whether to stop the propagation of the event, defaults
   *   to true.
   *
   * @return {Function}
   *   An even handler callback function.
   */
  Bootstrap.relayEvent = function (target, name, stopPropagation) {
    return function (e) {
      if (stopPropagation === void 0 || stopPropagation) {
        e.stopPropagation();
      }
      var $target = $(target);
      var parts = name.split('.').filter(Boolean);
      var type = parts.shift();
      e.target = $target[0];
      e.currentTarget = $target[0];
      e.namespace = parts.join('.');
      e.type = type;
      $target.trigger(e);
    };
  };

  /**
   * Replaces a Bootstrap jQuery plugin definition.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} callback
   *   A callback function that is immediately invoked and must return a
   *   function that will be used as the plugin constructor.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.replacePlugin = function (id, callback, noConflict) {
    // Immediately return if plugin doesn't exist.
    if (typeof $.fn[id] !== 'function') {
      return this.fatal('Specified jQuery plugin identifier does not exist: @id', {'@id':  id});
    }

    // Immediately return if callback isn't a function.
    if (typeof callback !== 'function') {
      return this.fatal('You must provide a valid callback function to replace a jQuery plugin: @callback', {'@callback': callback});
    }

    // Determine existing plugin constructor.
    var constructor = $.fn[id] && $.fn[id].Constructor || $.fn[id];
    var plugin = callback.apply(constructor, [this.settings]);

    // Immediately return if plugin isn't a function.
    if (typeof plugin !== 'function') {
      return this.fatal('Returned value from callback is not a usable function to replace a jQuery plugin "@id": @plugin', {'@id': id, '@plugin': plugin});
    }

    this.wrapPluginConstructor(constructor, plugin);

    // Add a ".noConflict()" helper method.
    this.pluginNoConflict(id, plugin, noConflict);

    $.fn[id] = plugin;
  };

  /**
   * Simulates a native event on an element in the browser.
   *
   * Note: This is a fairly complete modern implementation. If things aren't
   * working quite the way you intend (in older browsers), you may wish to use
   * the jQuery.simulate plugin. If it's available, this method will defer to
   * that plugin.
   *
   * @see https://github.com/jquery/jquery-simulate
   *
   * @param {HTMLElement|jQuery} element
   *   A DOM element to dispatch event on. Note: this may be a jQuery object,
   *   however be aware that this will trigger the same event for each element
   *   inside the jQuery collection; use with caution.
   * @param {String|String[]} type
   *   The type(s) of event to simulate.
   * @param {Object} [options]
   *   An object of options to pass to the event constructor. Typically, if
   *   an event is being proxied, you should just pass the original event
   *   object here. This allows, if the browser supports it, to be a truly
   *   simulated event.
   *
   * @return {Boolean}
   *   The return value is false if event is cancelable and at least one of the
   *   event handlers which handled this event called Event.preventDefault().
   *   Otherwise it returns true.
   */
  Bootstrap.simulate = function (element, type, options) {
    // Handle jQuery object wrappers so it triggers on each element.
    var ret = true;
    if (element instanceof $) {
      element.each(function () {
        if (!Bootstrap.simulate(this, type, options)) {
          ret = false;
        }
      });
      return ret;
    }

    if (!(element instanceof HTMLElement)) {
      this.fatal('Passed element must be an instance of HTMLElement, got "@type" instead.', {
        '@type': typeof element,
      });
    }

    // Defer to the jQuery.simulate plugin, if it's available.
    if (typeof $.simulate === 'function') {
      new $.simulate(element, type, options);
      return true;
    }

    var event;
    var ctor;
    var types = [].concat(type);
    for (var i = 0, l = types.length; i < l; i++) {
      type = types[i];
      for (var name in this.eventMap) {
        if (this.eventMap[name].test(type)) {
          ctor = name;
          break;
        }
      }
      if (!ctor) {
        throw new SyntaxError('Only rudimentary HTMLEvents, KeyboardEvents and MouseEvents are supported: ' + type);
      }
      var opts = {bubbles: true, cancelable: true};
      if (ctor === 'KeyboardEvent' || ctor === 'MouseEvent') {
        $.extend(opts, {ctrlKey: !1, altKey: !1, shiftKey: !1, metaKey: !1});
      }
      if (ctor === 'MouseEvent') {
        $.extend(opts, {button: 0, pointerX: 0, pointerY: 0, view: window});
      }
      if (options) {
        $.extend(opts, options);
      }
      if (typeof window[ctor] === 'function') {
        event = new window[ctor](type, opts);
        if (!element.dispatchEvent(event)) {
          ret = false;
        }
      }
      else if (document.createEvent) {
        event = document.createEvent(ctor);
        event.initEvent(type, opts.bubbles, opts.cancelable);
        if (!element.dispatchEvent(event)) {
          ret = false;
        }
      }
      else if (typeof element.fireEvent === 'function') {
        event = $.extend(document.createEventObject(), opts);
        if (!element.fireEvent('on' + type, event)) {
          ret = false;
        }
      }
      else if (typeof element[type]) {
        element[type]();
      }
    }
    return ret;
  };

  /**
   * Strips HTML and returns just text.
   *
   * @param {String|Element|jQuery} html
   *   A string of HTML content, an Element DOM object or a jQuery object.
   *
   * @return {String}
   *   The text without HTML tags.
   *
   * @todo Replace with http://locutus.io/php/strings/strip_tags/
   */
  Bootstrap.stripHtml = function (html) {
    if (html instanceof $) {
      html = html.html();
    }
    else if (html instanceof Element) {
      html = html.innerHTML;
    }
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/^[\s\n\t]*|[\s\n\t]*$/, '');
  };

  /**
   * Provide a helper method for displaying when something is unsupported.
   *
   * @param {String} type
   *   The type of unsupported object, e.g. method or option.
   * @param {String} name
   *   The name of the unsupported object.
   * @param {*} [value]
   *   The value of the unsupported object.
   */
  Bootstrap.unsupported = function (type, name, value) {
    Bootstrap.warn('Unsupported by Drupal Bootstrap: (@type) @name -> @value', {
      '@type': type,
      '@name': name,
      '@value': typeof value === 'object' ? JSON.stringify(value) : value
    });
  };

  /**
   * Provide a helper method to display a warning.
   *
   * @param {String} message
   *   The message to display.
   * @param {Object} [args]
   *   Arguments to use as replacements in Drupal.formatString.
   */
  Bootstrap.warn = function (message, args) {
    if (this.settings.dev && console.warn) {
      console.warn(Drupal.formatString(message, args));
    }
  };

  /**
   * Wraps a plugin with common functionality.
   *
   * @param {Function} constructor
   *   A plugin constructor being wrapped.
   * @param {Object|Function} plugin
   *   The plugin being wrapped.
   * @param {Boolean} [extend = false]
   *   Whether to add super extensibility.
   */
  Bootstrap.wrapPluginConstructor = function (constructor, plugin, extend) {
    var proto = constructor.prototype;

    // Add a jQuery UI like option getter/setter method.
    var option = this.option;
    if (proto.option === void(0)) {
      proto.option = function () {
        return option.apply(this, arguments);
      };
    }

    if (extend) {
      // Handle prototype properties separately.
      if (plugin.prototype !== void 0) {
        for (var key in plugin.prototype) {
          if (!plugin.prototype.hasOwnProperty(key)) continue;
          var value = plugin.prototype[key];
          if (typeof value === 'function') {
            proto[key] = this.superWrapper(proto[key] || function () {}, value);
          }
          else {
            proto[key] = $.isPlainObject(value) ? $.extend(true, {}, proto[key], value) : value;
          }
        }
      }
      delete plugin.prototype;

      // Handle static properties.
      for (key in plugin) {
        if (!plugin.hasOwnProperty(key)) continue;
        value = plugin[key];
        if (typeof value === 'function') {
          constructor[key] = this.superWrapper(constructor[key] || function () {}, value);
        }
        else {
          constructor[key] = $.isPlainObject(value) ? $.extend(true, {}, constructor[key], value) : value;
        }
      }
    }
  };

  // Add Bootstrap to the global Drupal object.
  Drupal.bootstrap = Drupal.bootstrap || Bootstrap;

})(window._, window.jQuery, window.Drupal, window.drupalSettings);
;
(function ($, _) {

  /**
   * @class Attributes
   *
   * Modifies attributes.
   *
   * @param {Object|Attributes} attributes
   *   An object to initialize attributes with.
   */
  var Attributes = function (attributes) {
    this.data = {};
    this.data['class'] = [];
    this.merge(attributes);
  };

  /**
   * Renders the attributes object as a string to inject into an HTML element.
   *
   * @return {String}
   *   A rendered string suitable for inclusion in HTML markup.
   */
  Attributes.prototype.toString = function () {
    var output = '';
    var name, value;
    var checkPlain = function (str) {
      return str && str.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
    };
    var data = this.getData();
    for (name in data) {
      if (!data.hasOwnProperty(name)) continue;
      value = data[name];
      if (_.isFunction(value)) value = value();
      if (_.isObject(value)) value = _.values(value);
      if (_.isArray(value)) value = value.join(' ');
      output += ' ' + checkPlain(name) + '="' + checkPlain(value) + '"';
    }
    return output;
  };

  /**
   * Renders the Attributes object as a plain object.
   *
   * @return {Object}
   *   A plain object suitable for inclusion in DOM elements.
   */
  Attributes.prototype.toPlainObject = function () {
    var object = {};
    var name, value;
    var data = this.getData();
    for (name in data) {
      if (!data.hasOwnProperty(name)) continue;
      value = data[name];
      if (_.isFunction(value)) value = value();
      if (_.isObject(value)) value = _.values(value);
      if (_.isArray(value)) value = value.join(' ');
      object[name] = value;
    }
    return object;
  };

  /**
   * Add class(es) to the array.
   *
   * @param {string|Array} value
   *   An individual class or an array of classes to add.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.addClass = function (value) {
    var args = Array.prototype.slice.call(arguments);
    this.data['class'] = this.sanitizeClasses(this.data['class'].concat(args));
    return this;
  };

  /**
   * Returns whether the requested attribute exists.
   *
   * @param {string} name
   *   An attribute name to check.
   *
   * @return {boolean}
   *   TRUE or FALSE
   */
  Attributes.prototype.exists = function (name) {
    return this.data[name] !== void(0) && this.data[name] !== null;
  };

  /**
   * Retrieve a specific attribute from the array.
   *
   * @param {string} name
   *   The specific attribute to retrieve.
   * @param {*} defaultValue
   *   (optional) The default value to set if the attribute does not exist.
   *
   * @return {*}
   *   A specific attribute value, passed by reference.
   */
  Attributes.prototype.get = function (name, defaultValue) {
    if (!this.exists(name)) this.data[name] = defaultValue;
    return this.data[name];
  };

  /**
   * Retrieves a cloned copy of the internal attributes data object.
   *
   * @return {Object}
   */
  Attributes.prototype.getData = function () {
    return _.extend({}, this.data);
  };

  /**
   * Retrieves classes from the array.
   *
   * @return {Array}
   *   The classes array.
   */
  Attributes.prototype.getClasses = function () {
    return this.get('class', []);
  };

  /**
   * Indicates whether a class is present in the array.
   *
   * @param {string|Array} className
   *   The class(es) to search for.
   *
   * @return {boolean}
   *   TRUE or FALSE
   */
  Attributes.prototype.hasClass = function (className) {
    className = this.sanitizeClasses(Array.prototype.slice.call(arguments));
    var classes = this.getClasses();
    for (var i = 0, l = className.length; i < l; i++) {
      // If one of the classes fails, immediately return false.
      if (_.indexOf(classes, className[i]) === -1) {
        return false;
      }
    }
    return true;
  };

  /**
   * Merges multiple values into the array.
   *
   * @param {Attributes|Node|jQuery|Object} object
   *   An Attributes object with existing data, a Node DOM element, a jQuery
   *   instance or a plain object where the key is the attribute name and the
   *   value is the attribute value.
   * @param {boolean} [recursive]
   *   Flag determining whether or not to recursively merge key/value pairs.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.merge = function (object, recursive) {
    // Immediately return if there is nothing to merge.
    if (!object) {
      return this;
    }

    // Get attributes from a jQuery element.
    if (object instanceof $) {
      object = object[0];
    }

    // Get attributes from a DOM element.
    if (object instanceof Node) {
      object = Array.prototype.slice.call(object.attributes).reduce(function (attributes, attribute) {
        attributes[attribute.name] = attribute.value;
        return attributes;
      }, {});
    }
    // Get attributes from an Attributes instance.
    else if (object instanceof Attributes) {
      object = object.getData();
    }
    // Otherwise, clone the object.
    else {
      object = _.extend({}, object);
    }

    // By this point, there should be a valid plain object.
    if (!$.isPlainObject(object)) {
      setTimeout(function () {
        throw new Error('Passed object is not supported: ' + object);
      });
      return this;
    }

    // Handle classes separately.
    if (object && object['class'] !== void 0) {
      this.addClass(object['class']);
      delete object['class'];
    }

    if (recursive === void 0 || recursive) {
      this.data = $.extend(true, {}, this.data, object);
    }
    else {
      this.data = $.extend({}, this.data, object);
    }

    return this;
  };

  /**
   * Removes an attribute from the array.
   *
   * @param {string} name
   *   The name of the attribute to remove.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.remove = function (name) {
    if (this.exists(name)) delete this.data[name];
    return this;
  };

  /**
   * Removes a class from the attributes array.
   *
   * @param {...string|Array} className
   *   An individual class or an array of classes to remove.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.removeClass = function (className) {
    var remove = this.sanitizeClasses(Array.prototype.slice.apply(arguments));
    this.data['class'] = _.without(this.getClasses(), remove);
    return this;
  };

  /**
   * Replaces a class in the attributes array.
   *
   * @param {string} oldValue
   *   The old class to remove.
   * @param {string} newValue
   *   The new class. It will not be added if the old class does not exist.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.replaceClass = function (oldValue, newValue) {
    var classes = this.getClasses();
    var i = _.indexOf(this.sanitizeClasses(oldValue), classes);
    if (i >= 0) {
      classes[i] = newValue;
      this.set('class', classes);
    }
    return this;
  };

  /**
   * Ensures classes are flattened into a single is an array and sanitized.
   *
   * @param {...String|Array} classes
   *   The class or classes to sanitize.
   *
   * @return {Array}
   *   A sanitized array of classes.
   */
  Attributes.prototype.sanitizeClasses = function (classes) {
    return _.chain(Array.prototype.slice.call(arguments))
      // Flatten in case there's a mix of strings and arrays.
      .flatten()

      // Split classes that may have been added with a space as a separator.
      .map(function (string) {
        return string.split(' ');
      })

      // Flatten again since it was just split into arrays.
      .flatten()

      // Filter out empty items.
      .filter()

      // Clean the class to ensure it's a valid class name.
      .map(function (value) {
        return Attributes.cleanClass(value);
      })

      // Ensure classes are unique.
      .uniq()

      // Retrieve the final value.
      .value();
  };

  /**
   * Sets an attribute on the array.
   *
   * @param {string} name
   *   The name of the attribute to set.
   * @param {*} value
   *   The value of the attribute to set.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.set = function (name, value) {
    var obj = $.isPlainObject(name) ? name : {};
    if (typeof name === 'string') {
      obj[name] = value;
    }
    return this.merge(obj);
  };

  /**
   * Prepares a string for use as a CSS identifier (element, class, or ID name).
   *
   * Note: this is essentially a direct copy from
   * \Drupal\Component\Utility\Html::cleanCssIdentifier
   *
   * @param {string} identifier
   *   The identifier to clean.
   * @param {Object} [filter]
   *   An object of string replacements to use on the identifier.
   *
   * @return {string}
   *   The cleaned identifier.
   */
  Attributes.cleanClass = function (identifier, filter) {
    filter = filter || {
      ' ': '-',
      '_': '-',
      '/': '-',
      '[': '-',
      ']': ''
    };

    identifier = identifier.toLowerCase();

    if (filter['__'] === void 0) {
      identifier = identifier.replace('__', '#DOUBLE_UNDERSCORE#');
    }

    identifier = identifier.replace(Object.keys(filter), Object.keys(filter).map(function(key) { return filter[key]; }));

    if (filter['__'] === void 0) {
      identifier = identifier.replace('#DOUBLE_UNDERSCORE#', '__');
    }

    identifier = identifier.replace(/[^\u002D\u0030-\u0039\u0041-\u005A\u005F\u0061-\u007A\u00A1-\uFFFF]/g, '');
    identifier = identifier.replace(['/^[0-9]/', '/^(-[0-9])|^(--)/'], ['_', '__']);

    return identifier;
  };

  /**
   * Creates an Attributes instance.
   *
   * @param {object|Attributes} [attributes]
   *   An object to initialize attributes with.
   *
   * @return {Attributes}
   *   An Attributes instance.
   *
   * @constructor
   */
  Attributes.create = function (attributes) {
    return new Attributes(attributes);
  };

  window.Attributes = Attributes;

})(window.jQuery, window._);
;
/**
 * @file
 * Theme hooks for the Drupal Bootstrap base theme.
 */
(function ($, Drupal, Bootstrap, Attributes) {

  /**
   * Fallback for theming an icon if the Icon API module is not installed.
   */
  if (!Drupal.icon) Drupal.icon = { bundles: {} };
  if (!Drupal.theme.icon || Drupal.theme.prototype.icon) {
    $.extend(Drupal.theme, /** @lends Drupal.theme */ {
      /**
       * Renders an icon.
       *
       * @param {string} bundle
       *   The bundle which the icon belongs to.
       * @param {string} icon
       *   The name of the icon to render.
       * @param {object|Attributes} [attributes]
       *   An object of attributes to also apply to the icon.
       *
       * @returns {string}
       */
      icon: function (bundle, icon, attributes) {
        if (!Drupal.icon.bundles[bundle]) return '';
        attributes = Attributes.create(attributes).addClass('icon').set('aria-hidden', 'true');
        icon = Drupal.icon.bundles[bundle](icon, attributes);
        return '<span' + attributes + '></span>';
      }
    });
  }

  /**
   * Callback for modifying an icon in the "bootstrap" icon bundle.
   *
   * @param {string} icon
   *   The icon being rendered.
   * @param {Attributes} attributes
   *   Attributes object for the icon.
   */
  Drupal.icon.bundles.bootstrap = function (icon, attributes) {
    attributes.addClass(['glyphicon', 'glyphicon-' + icon]);
  };

  /**
   * Add necessary theming hooks.
   */
  $.extend(Drupal.theme, /** @lends Drupal.theme */ {

    /**
     * Renders a Bootstrap AJAX glyphicon throbber.
     *
     * @returns {string}
     */
    ajaxThrobber: function () {
      return Drupal.theme('bootstrapIcon', 'refresh', {'class': ['ajax-throbber', 'glyphicon-spin'] });
    },

    /**
     * Renders a button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button. If it contains one of:
     *   - value: The label of the button.
     *   - context: The context type of Bootstrap button, can be one of:
     *     - default
     *     - primary
     *     - success
     *     - info
     *     - warning
     *     - danger
     *     - link
     *
     * @returns {string}
     */
    button: function (attributes) {
      attributes = Attributes.create(attributes).addClass('btn');
      var context = attributes.get('context', 'default');
      var label = attributes.get('value', '');
      attributes.remove('context').remove('value');
      if (!attributes.hasClass(['btn-default', 'btn-primary', 'btn-success', 'btn-info', 'btn-warning', 'btn-danger', 'btn-link'])) {
        attributes.addClass('btn-' + Bootstrap.checkPlain(context));
      }

      // Attempt to, intelligently, provide a default button "type".
      if (!attributes.exists('type')) {
        attributes.set('type', attributes.hasClass('form-submit') ? 'submit' : 'button');
      }

      return '<button' + attributes + '>' + label + '</button>';
    },

    /**
     * Alias for "button" theme hook.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    btn: function (attributes) {
      return Drupal.theme('button', attributes);
    },

    /**
     * Renders a button block element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-block': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-block'));
    },

    /**
     * Renders a large button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-lg': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-lg'));
    },

    /**
     * Renders a small button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-sm': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-sm'));
    },

    /**
     * Renders an extra small button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-xs': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-xs'));
    },

    /**
     * Renders a glyphicon.
     *
     * @param {string} name
     *   The name of the glyphicon.
     * @param {object|Attributes} [attributes]
     *   An object of attributes to apply to the icon.
     *
     * @returns {string}
     */
    bootstrapIcon: function (name, attributes) {
      return Drupal.theme('icon', 'bootstrap', name, attributes);
    }

  });

})(window.jQuery, window.Drupal, window.Drupal.bootstrap, window.Attributes);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function (Drupal, drupalSettings) {
  Drupal.behaviors.activeLinks = {
    attach: function attach(context) {
      var path = drupalSettings.path;
      var queryString = JSON.stringify(path.currentQuery);
      var querySelector = path.currentQuery ? '[data-drupal-link-query=\'' + queryString + '\']' : ':not([data-drupal-link-query])';
      var originalSelectors = ['[data-drupal-link-system-path="' + path.currentPath + '"]'];
      var selectors = void 0;

      if (path.isFront) {
        originalSelectors.push('[data-drupal-link-system-path="<front>"]');
      }

      selectors = [].concat(originalSelectors.map(function (selector) {
        return selector + ':not([hreflang])';
      }), originalSelectors.map(function (selector) {
        return selector + '[hreflang="' + path.currentLanguage + '"]';
      }));

      selectors = selectors.map(function (current) {
        return current + querySelector;
      });

      var activeLinks = context.querySelectorAll(selectors.join(','));
      var il = activeLinks.length;
      for (var i = 0; i < il; i++) {
        activeLinks[i].classList.add('is-active');
      }
    },
    detach: function detach(context, settings, trigger) {
      if (trigger === 'unload') {
        var activeLinks = context.querySelectorAll('[data-drupal-link-system-path].is-active');
        var il = activeLinks.length;
        for (var i = 0; i < il; i++) {
          activeLinks[i].classList.remove('is-active');
        }
      }
    }
  };
})(Drupal, drupalSettings);;
/**
 * @file
 * Bootstrap Popovers.
 */

var Drupal = Drupal || {};

(function ($, Drupal, Bootstrap) {
  "use strict";

  var $document = $(document);

  /**
   * Extend the Bootstrap Popover plugin constructor class.
   */
  Bootstrap.extendPlugin('popover', function (settings) {
    return {
      DEFAULTS: {
        animation: !!settings.popover_animation,
        autoClose: !!settings.popover_auto_close,
        enabled: settings.popover_enabled,
        html: !!settings.popover_html,
        placement: settings.popover_placement,
        selector: settings.popover_selector,
        trigger: settings.popover_trigger,
        title: settings.popover_title,
        content: settings.popover_content,
        delay: parseInt(settings.popover_delay, 10),
        container: settings.popover_container
      }
    };
  });

  /**
   * Bootstrap Popovers.
   *
   * @todo This should really be properly delegated if selector option is set.
   */
  Drupal.behaviors.bootstrapPopovers = {
    $activePopover: null,
    attach: function (context) {
      // Immediately return if popovers are not available.
      if (!$.fn.popover || !$.fn.popover.Constructor.DEFAULTS.enabled) {
        return;
      }

      var _this = this;

      $document
        .on('show.bs.popover', '[data-toggle=popover]', function () {
          var $trigger = $(this);
          var popover = $trigger.data('bs.popover');

          // Only keep track of clicked triggers that we're manually handling.
          if (popover.options.originalTrigger === 'click') {
            if (_this.$activePopover && _this.getOption('autoClose') && !_this.$activePopover.is($trigger)) {
              _this.$activePopover.popover('hide');
            }
            _this.$activePopover = $trigger;
          }
        })
        // Unfortunately, :focusable is only made available when using jQuery
        // UI. While this would be the most semantic pseudo selector to use
        // here, jQuery UI may not always be loaded. Instead, just use :visible
        // here as this just needs some sort of selector here. This activates
        // delegate binding to elements in jQuery so it can work it's bubbling
        // focus magic since elements don't really propagate their focus events.
        // @see https://www.drupal.org/project/bootstrap/issues/3013236
        .on('focus.bs.popover', ':visible', function (e) {
          var $target = $(e.target);
          if (_this.$activePopover && _this.getOption('autoClose') && !_this.$activePopover.is($target) && !$target.closest('.popover.in')[0]) {
            _this.$activePopover.popover('hide');
            _this.$activePopover = null;
          }
        })
        .on('click.bs.popover', function (e) {
          var $target = $(e.target);
          if (_this.$activePopover && _this.getOption('autoClose') && !$target.is('[data-toggle=popover]') && !$target.closest('.popover.in')[0]) {
            _this.$activePopover.popover('hide');
            _this.$activePopover = null;
          }
        })
        .on('keyup.bs.popover', function (e) {
          if (_this.$activePopover && _this.getOption('autoClose') && e.which === 27) {
            _this.$activePopover.popover('hide');
            _this.$activePopover = null;
          }
        })
      ;

      var elements = $(context).find('[data-toggle=popover]').toArray();
      for (var i = 0; i < elements.length; i++) {
        var $element = $(elements[i]);
        var options = $.extend({}, $.fn.popover.Constructor.DEFAULTS, $element.data());

        // Store the original trigger.
        options.originalTrigger = options.trigger;

        // If the trigger is "click", then we'll handle it manually here.
        if (options.trigger === 'click') {
          options.trigger = 'manual';
        }

        // Retrieve content from a target element.
        var target = options.target || $element.is('a[href^="#"]') && $element.attr('href');
        var $target = $document.find(target).clone();
        if (!options.content && $target[0]) {
          $target.removeClass('visually-hidden hidden').removeAttr('aria-hidden');
          options.content = $target.wrap('<div/>').parent()[options.html ? 'html' : 'text']() || '';
        }

        // Initialize the popover.
        $element.popover(options);

        // Handle clicks manually.
        if (options.originalTrigger === 'click') {
          // To ensure the element is bound multiple times, remove any
          // previously set event handler before adding another one.
          $element
            .off('click.drupal.bootstrap.popover')
            .on('click.drupal.bootstrap.popover', function (e) {
              $(this).popover('toggle');
              e.preventDefault();
              e.stopPropagation();
            })
          ;
        }
      }
    },
    detach: function (context) {
      // Immediately return if popovers are not available.
      if (!$.fn.popover || !$.fn.popover.Constructor.DEFAULTS.enabled) {
        return;
      }

      // Destroy all popovers.
      $(context).find('[data-toggle="popover"]')
        .off('click.drupal.bootstrap.popover')
        .popover('destroy')
      ;
    },
    getOption: function(name, defaultValue, element) {
      var $element = element ? $(element) : this.$activePopover;
      var options = $.extend(true, {}, $.fn.popover.Constructor.DEFAULTS, ($element && $element.data('bs.popover') || {}).options);
      if (options[name] !== void 0) {
        return options[name];
      }
      return defaultValue !== void 0 ? defaultValue : void 0;
    }
  };

})(window.jQuery, window.Drupal, window.Drupal.bootstrap);
;
/**
 * @file
 * Bootstrap Tooltips.
 */

var Drupal = Drupal || {};

(function ($, Drupal, Bootstrap) {
  "use strict";

  /**
   * Extend the Bootstrap Tooltip plugin constructor class.
   */
  Bootstrap.extendPlugin('tooltip', function (settings) {
    return {
      DEFAULTS: {
        animation: !!settings.tooltip_animation,
        enabled: settings.tooltip_enabled,
        html: !!settings.tooltip_html,
        placement: settings.tooltip_placement,
        selector: settings.tooltip_selector,
        trigger: settings.tooltip_trigger,
        delay: parseInt(settings.tooltip_delay, 10),
        container: settings.tooltip_container
      }
    };
  });

  /**
   * Bootstrap Tooltips.
   *
   * @todo This should really be properly delegated if selector option is set.
   */
  Drupal.behaviors.bootstrapTooltips = {
    attach: function (context) {
      // Immediately return if tooltips are not available.
      if (!$.fn.tooltip || !$.fn.tooltip.Constructor.DEFAULTS.enabled) {
        return;
      }

      var elements = $(context).find('[data-toggle="tooltip"]').toArray();
      for (var i = 0; i < elements.length; i++) {
        var $element = $(elements[i]);
        var options = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, $element.data());
        $element.tooltip(options);
      }
    },
    detach: function (context) {
      // Immediately return if tooltips are not available.
      if (!$.fn.tooltip || !$.fn.tooltip.Constructor.DEFAULTS.enabled) {
        return;
      }

      // Destroy all tooltips.
      $(context).find('[data-toggle="tooltip"]').tooltip('destroy');
    }
  };

})(window.jQuery, window.Drupal, window.Drupal.bootstrap);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

Drupal.debounce = function (func, wait, immediate) {
  var timeout = void 0;
  var result = void 0;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;
    var later = function later() {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
    }
    return result;
  };
};;
/*! jquery.cookie v1.4.1 | MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?a(require("jquery")):a(jQuery)}(function(a){function b(a){return h.raw?a:encodeURIComponent(a)}function c(a){return h.raw?a:decodeURIComponent(a)}function d(a){return b(h.json?JSON.stringify(a):String(a))}function e(a){0===a.indexOf('"')&&(a=a.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{return a=decodeURIComponent(a.replace(g," ")),h.json?JSON.parse(a):a}catch(b){}}function f(b,c){var d=h.raw?b:e(b);return a.isFunction(c)?c(d):d}var g=/\+/g,h=a.cookie=function(e,g,i){if(void 0!==g&&!a.isFunction(g)){if(i=a.extend({},h.defaults,i),"number"==typeof i.expires){var j=i.expires,k=i.expires=new Date;k.setTime(+k+864e5*j)}return document.cookie=[b(e),"=",d(g),i.expires?"; expires="+i.expires.toUTCString():"",i.path?"; path="+i.path:"",i.domain?"; domain="+i.domain:"",i.secure?"; secure":""].join("")}for(var l=e?void 0:{},m=document.cookie?document.cookie.split("; "):[],n=0,o=m.length;o>n;n++){var p=m[n].split("="),q=c(p.shift()),r=p.join("=");if(e&&e===q){l=f(r,g);break}e||void 0===(r=f(r))||(l[q]=r)}return l};h.defaults={},a.removeCookie=function(b,c){return void 0===a.cookie(b)?!1:(a.cookie(b,"",a.extend({},c,{expires:-1})),!a.cookie(b))}});;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, debounce) {
  $.fn.drupalGetSummary = function () {
    var callback = this.data('summaryCallback');
    return this[0] && callback ? $.trim(callback(this[0])) : '';
  };

  $.fn.drupalSetSummary = function (callback) {
    var self = this;

    if (typeof callback !== 'function') {
      var val = callback;
      callback = function callback() {
        return val;
      };
    }

    return this.data('summaryCallback', callback).off('formUpdated.summary').on('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    }).trigger('summaryUpdated');
  };

  Drupal.behaviors.formSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        var formValues = $form.serialize();
        var previousValues = $form.attr('data-drupal-form-submit-last');
        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }

      $('body').once('form-single-submit').on('submit.singleSubmit', 'form:not([method~="GET"])', onFormSubmit);
    }
  };

  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }

  function fieldsList(form) {
    var $fieldList = $(form).find('[name]').map(function (index, element) {
      return element.getAttribute('id');
    });

    return $.makeArray($fieldList);
  }

  Drupal.behaviors.formUpdated = {
    attach: function attach(context) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      var $forms = (contextIsForm ? $context : $context.find('form')).once('form-updated');
      var formFields = void 0;

      if ($forms.length) {
        $.makeArray($forms).forEach(function (form) {
          var events = 'change.formUpdated input.formUpdated ';
          var eventHandler = debounce(function (event) {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');

          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }

      if (contextIsForm) {
        formFields = fieldsList(context).join(',');

        var currentFields = $(context).attr('data-drupal-form-fields');

        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach: function detach(context, settings, trigger) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      if (trigger === 'unload') {
        var $forms = (contextIsForm ? $context : $context.find('form')).removeOnce('form-updated');
        if ($forms.length) {
          $.makeArray($forms).forEach(function (form) {
            form.removeAttribute('data-drupal-form-fields');
            $(form).off('.formUpdated');
          });
        }
      }
    }
  };

  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach: function attach(context, settings) {
      var userInfo = ['name', 'mail', 'homepage'];
      var $forms = $('[data-user-info-from-browser]').once('user-info-from-browser');
      if ($forms.length) {
        userInfo.forEach(function (info) {
          var $element = $forms.find('[name=' + info + ']');
          var browserData = localStorage.getItem('Drupal.visitor.' + info);
          var emptyOrDefault = $element.val() === '' || $element.attr('data-drupal-default-value') === $element.val();
          if ($element.length && emptyOrDefault && browserData) {
            $element.val(browserData);
          }
        });
      }
      $forms.on('submit', function () {
        userInfo.forEach(function (info) {
          var $element = $forms.find('[name=' + info + ']');
          if ($element.length) {
            localStorage.setItem('Drupal.visitor.' + info, $element.val());
          }
        });
      });
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e) {
    var url = void 0;
    if (e.type === 'click') {
      url = e.currentTarget.location ? e.currentTarget.location : e.currentTarget;
    } else {
      url = window.location;
    }
    var hash = url.hash.substr(1);
    if (hash) {
      var $target = $('#' + hash);
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);

      setTimeout(function () {
        return $target.trigger('focus');
      }, 300);
    }
  };

  var debouncedHandleFragmentLinkClickOrHashChange = debounce(handleFragmentLinkClickOrHashChange, 300, true);

  $(window).on('hashchange.form-fragment', debouncedHandleFragmentLinkClickOrHashChange);

  $(document).on('click.form-fragment', 'a[href*="#"]', debouncedHandleFragmentLinkClickOrHashChange);
})(jQuery, Drupal, Drupal.debounce);;
/**
 * @file
 * Extends methods from core/misc/form.js.
 */

(function ($, window, Drupal, drupalSettings) {

  /**
   * Behavior for "forms_has_error_value_toggle" theme setting.
   */
  Drupal.behaviors.bootstrapForm = {
    attach: function (context) {
      if (drupalSettings.bootstrap && drupalSettings.bootstrap.forms_has_error_value_toggle) {
        var $context = $(context);
        $context.find('.form-item.has-error:not(.form-type-password.has-feedback)').once('error').each(function () {
          var $formItem = $(this);
          var $input = $formItem.find(':input');
          $input.on('keyup focus blur', function () {
            if (this.defaultValue !== void 0) {
              $formItem[this.defaultValue !== this.value ? 'removeClass' : 'addClass']('has-error');
              $input[this.defaultValue !== this.value ? 'removeClass' : 'addClass']('error');
            }
          });
        });
      }
    }
  };


})(jQuery, this, Drupal, drupalSettings);
;
window.matchMedia||(window.matchMedia=function(){"use strict";var e=window.styleMedia||window.media;if(!e){var t=document.createElement("style"),i=document.getElementsByTagName("script")[0],n=null;t.type="text/css";t.id="matchmediajs-test";i.parentNode.insertBefore(t,i);n="getComputedStyle"in window&&window.getComputedStyle(t,null)||t.currentStyle;e={matchMedium:function(e){var i="@media "+e+"{ #matchmediajs-test { width: 1px; } }";if(t.styleSheet){t.styleSheet.cssText=i}else{t.textContent=i}return n.width==="1px"}}}return function(t){return{matches:e.matchMedium(t||"all"),media:t||"all"}}}());
;
/**
 * @file
 * Overrides core/misc/vertical-tabs.js.
 */

(function ($, window, Drupal, drupalSettings) {
  "use strict";

  /**
   * Show the parent vertical tab pane of a targeted page fragment.
   *
   * In order to make sure a targeted element inside a vertical tab pane is
   * visible on a hash change or fragment link click, show all parent panes.
   *
   * @param {jQuery.Event} e
   *   The event triggered.
   * @param {jQuery} $target
   *   The targeted node as a jQuery object.
   */
  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e, $target) {
    $target.parents('.vertical-tabs-pane').each(function (index, pane) {
      $(pane).data('verticalTab').focus();
    });
  };

  /**
   * This script transforms a set of details into a stack of vertical
   * tabs. Another tab pane can be selected by clicking on the respective
   * tab.
   *
   * Each tab may have a summary which can be updated by another
   * script. For that to work, each details element has an associated
   * 'verticalTabCallback' (with jQuery.data() attached to the details),
   * which is called every time the user performs an update to a form
   * element inside the tab pane.
   */
  Drupal.behaviors.verticalTabs = {
    attach: function (context) {
      var width = drupalSettings.widthBreakpoint || 640;
      var mq = '(max-width: ' + width + 'px)';

      if (window.matchMedia(mq).matches) {
        return;
      }

      /**
       * Binds a listener to handle fragment link clicks and URL hash changes.
       */
      $('body').once('vertical-tabs-fragments').on('formFragmentLinkClickOrHashChange.verticalTabs', handleFragmentLinkClickOrHashChange);

      $(context).find('[data-vertical-tabs-panes]').once('vertical-tabs').each(function () {
        var $this = $(this).addClass('tab-content vertical-tabs-panes');

        var focusID = $(':hidden.vertical-tabs__active-tab', this).val();
        if (typeof focusID === 'undefined' || !focusID.length) {
          focusID = false;
        }
        var tab_focus;

        // Check if there are some details that can be converted to vertical-tabs
        var $details = $this.find('> .panel');
        if ($details.length === 0) {
          return;
        }

        // Create the tab column.
        var tab_list = $('<ul class="nav nav-tabs vertical-tabs-list"></ul>');
        $this.wrap('<div class="tabbable tabs-left vertical-tabs clearfix"></div>').before(tab_list);

        // Transform each details into a tab.
        $details.each(function () {
          var $that = $(this);
          var vertical_tab = new Drupal.verticalTab({
            title: $that.find('> .panel-heading > .panel-title, > .panel-heading').last().html(),
            details: $that
          });
          tab_list.append(vertical_tab.item);
          $that
            .removeClass('collapsed')
            // prop() can't be used on browsers not supporting details element,
            // the style won't apply to them if prop() is used.
            .attr('open', true)
            .removeClass('collapsible collapsed panel panel-default')
            .addClass('tab-pane vertical-tabs-pane')
            .data('verticalTab', vertical_tab)
            .find('> .panel-heading').remove();
          if (this.id === focusID) {
            tab_focus = $that;
          }
        });

        $(tab_list).find('> li:first').addClass('first');
        $(tab_list).find('> li:last').addClass('last');

        if (!tab_focus) {
          // If the current URL has a fragment and one of the tabs contains an
          // element that matches the URL fragment, activate that tab.
          var $locationHash = $this.find(window.location.hash);
          if (window.location.hash && $locationHash.length) {
            tab_focus = $locationHash.closest('.vertical-tabs-pane');
          }
          else {
            tab_focus = $this.find('> .vertical-tabs-pane:first');
          }
        }
        if (tab_focus.length) {
          tab_focus.data('verticalTab').focus();
        }
      });

      // Provide some Bootstrap tab/Drupal integration.
      // @todo merge this into the above code from core.
      $(context).find('.tabbable').once('bootstrap-tabs').each(function () {
        var $wrapper = $(this);
        var $tabs = $wrapper.find('.nav-tabs');
        var $content = $wrapper.find('.tab-content');
        var borderRadius = parseInt($content.css('borderBottomRightRadius'), 10);
        var bootstrapTabResize = function() {
          if ($wrapper.hasClass('tabs-left') || $wrapper.hasClass('tabs-right')) {
            $content.css('min-height', $tabs.outerHeight());
          }
        };
        // Add min-height on content for left and right tabs.
        bootstrapTabResize();
        // Detect tab switch.
        if ($wrapper.hasClass('tabs-left') || $wrapper.hasClass('tabs-right')) {
          $tabs.on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
            bootstrapTabResize();
            if ($wrapper.hasClass('tabs-left')) {
              if ($(e.target).parent().is(':first-child')) {
                $content.css('borderTopLeftRadius', '0');
              }
              else {
                $content.css('borderTopLeftRadius', borderRadius + 'px');
              }
            }
            else {
              if ($(e.target).parent().is(':first-child')) {
                $content.css('borderTopRightRadius', '0');
              }
              else {
                $content.css('borderTopRightRadius', borderRadius + 'px');
              }
            }
          });
        }
      });
    }
  };

  /**
   * The vertical tab object represents a single tab within a tab group.
   *
   * @param settings
   *   An object with the following keys:
   *   - title: The name of the tab.
   *   - details: The jQuery object of the details element that is the tab pane.
   */
  Drupal.verticalTab = function (settings) {
    var self = this;
    $.extend(this, settings, Drupal.theme('verticalTab', settings));

    this.link.attr('href', '#' + settings.details.attr('id'));

    this.link.on('click', function (e) {
      e.preventDefault();
      self.focus();
    });

    // Keyboard events added:
    // Pressing the Enter key will open the tab pane.
    this.link.on('keydown', function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        self.focus();
        // Set focus on the first input field of the visible details/tab pane.
        $(".vertical-tabs-pane :input:visible:enabled:first").trigger('focus');
      }
    });

    this.details
      .on('summaryUpdated', function () {
        self.updateSummary();
      })
      .trigger('summaryUpdated');
  };

  Drupal.verticalTab.prototype = {
    /**
     * Displays the tab's content pane.
     */
    focus: function () {
      this.details
        .siblings('.vertical-tabs-pane')
        .each(function () {
          $(this).removeClass('active').find('> div').removeClass('in');
          var tab = $(this).data('verticalTab');
          tab.item.removeClass('selected');
        })
        .end()
        .addClass('active')
        .siblings(':hidden.vertical-tabs-active-tab')
        .val(this.details.attr('id'));
      this.details.find('> div').addClass('in');
      this.details.data('verticalTab').item.find('a').tab('show');
      this.item.addClass('selected');
      // Mark the active tab for screen readers.
      $('#active-vertical-tab').remove();
      this.link.append('<span id="active-vertical-tab" class="visually-hidden">' + Drupal.t('(active tab)') + '</span>');
    },

    /**
     * Updates the tab's summary.
     */
    updateSummary: function () {
      this.summary.html(this.details.drupalGetSummary());
    },

    /**
     * Shows a vertical tab pane.
     */
    tabShow: function () {
      // Display the tab.
      this.item.show();
      // Show the vertical tabs.
      this.item.closest('.form-type-vertical-tabs').show();
      // Update .first marker for items. We need recurse from parent to retain the
      // actual DOM element order as jQuery implements sortOrder, but not as public
      // method.
      this.item.parent().children('.vertical-tab-button').removeClass('first')
        .filter(':visible:first').addClass('first');
      // Display the details element.
      this.details.removeClass('vertical-tab-hidden').show();
      // Focus this tab.
      this.focus();
      return this;
    },

    /**
     * Hides a vertical tab pane.
     */
    tabHide: function () {
      // Hide this tab.
      this.item.hide();
      // Update .first marker for items. We need recurse from parent to retain the
      // actual DOM element order as jQuery implements sortOrder, but not as public
      // method.
      this.item.parent().children('.vertical-tab-button').removeClass('first')
        .filter(':visible:first').addClass('first');
      // Hide the details element.
      this.details.addClass('vertical-tab-hidden').hide();
      // Focus the first visible tab (if there is one).
      var $firstTab = this.details.siblings('.vertical-tabs-pane:not(.vertical-tab-hidden):first');
      if ($firstTab.length) {
        $firstTab.data('verticalTab').focus();
      }
      // Hide the vertical tabs (if no tabs remain).
      else {
        this.item.closest('.form-type-vertical-tabs').hide();
      }
      return this;
    }
  };

  /**
   * Theme function for a vertical tab.
   *
   * @param settings
   *   An object with the following keys:
   *   - title: The name of the tab.
   * @return
   *   This function has to return an object with at least these keys:
   *   - item: The root tab jQuery element
   *   - link: The anchor tag that acts as the clickable area of the tab
   *       (jQuery version)
   *   - summary: The jQuery element that contains the tab summary
   */
  Drupal.theme.verticalTab = function (settings) {
    var tab = {};
    tab.item = $('<li class="vertical-tab-button" tabindex="-1"></li>')
      .append(tab.link = $('<a href="#' + settings.details[0].id + '" data-toggle="tab"></a>')
        .append(tab.title = $('<span></span>').html(settings.title))
        .append(tab.summary = $('<div class="summary"></div>')
      )
    );
    return tab;
  };

})(jQuery, this, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.detailsAria = {
    attach: function attach() {
      $('body').once('detailsAria').on('click.detailsAria', 'summary', function (event) {
        var $summary = $(event.currentTarget);
        var open = $(event.currentTarget.parentNode).attr('open') === 'open' ? 'false' : 'true';

        $summary.attr({
          'aria-expanded': open,
          'aria-pressed': open
        });
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Modernizr, Drupal) {
  function CollapsibleDetails(node) {
    this.$node = $(node);
    this.$node.data('details', this);

    var anchor = window.location.hash && window.location.hash !== '#' ? ', ' + window.location.hash : '';
    if (this.$node.find('.error' + anchor).length) {
      this.$node.attr('open', true);
    }

    this.setupSummary();

    this.setupLegend();
  }

  $.extend(CollapsibleDetails, {
    instances: []
  });

  $.extend(CollapsibleDetails.prototype, {
    setupSummary: function setupSummary() {
      this.$summary = $('<span class="summary"></span>');
      this.$node.on('summaryUpdated', $.proxy(this.onSummaryUpdated, this)).trigger('summaryUpdated');
    },
    setupLegend: function setupLegend() {
      var $legend = this.$node.find('> summary');

      $('<span class="details-summary-prefix visually-hidden"></span>').append(this.$node.attr('open') ? Drupal.t('Hide') : Drupal.t('Show')).prependTo($legend).after(document.createTextNode(' '));

      $('<a class="details-title"></a>').attr('href', '#' + this.$node.attr('id')).prepend($legend.contents()).appendTo($legend);

      $legend.append(this.$summary).on('click', $.proxy(this.onLegendClick, this));
    },
    onLegendClick: function onLegendClick(e) {
      this.toggle();
      e.preventDefault();
    },
    onSummaryUpdated: function onSummaryUpdated() {
      var text = $.trim(this.$node.drupalGetSummary());
      this.$summary.html(text ? ' (' + text + ')' : '');
    },
    toggle: function toggle() {
      var _this = this;

      var isOpen = !!this.$node.attr('open');
      var $summaryPrefix = this.$node.find('> summary span.details-summary-prefix');
      if (isOpen) {
        $summaryPrefix.html(Drupal.t('Show'));
      } else {
        $summaryPrefix.html(Drupal.t('Hide'));
      }

      setTimeout(function () {
        _this.$node.attr('open', !isOpen);
      }, 0);
    }
  });

  Drupal.behaviors.collapse = {
    attach: function attach(context) {
      if (Modernizr.details) {
        return;
      }
      var $collapsibleDetails = $(context).find('details').once('collapse').addClass('collapse-processed');
      if ($collapsibleDetails.length) {
        for (var i = 0; i < $collapsibleDetails.length; i++) {
          CollapsibleDetails.instances.push(new CollapsibleDetails($collapsibleDetails[i]));
        }
      }
    }
  };

  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e, $target) {
    $target.parents('details').not('[open]').find('> summary').trigger('click');
  };

  $('body').on('formFragmentLinkClickOrHashChange.details', handleFragmentLinkClickOrHashChange);

  Drupal.CollapsibleDetails = CollapsibleDetails;
})(jQuery, Modernizr, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.behaviors.entityContentDetailsSummaries = {
    attach: function attach(context) {
      var $context = $(context);
      $context.find('.entity-content-form-revision-information').drupalSetSummary(function (context) {
        var $revisionContext = $(context);
        var revisionCheckbox = $revisionContext.find('.js-form-item-revision input');

        if (revisionCheckbox.is(':checked') || !revisionCheckbox.length && $revisionContext.find('.js-form-item-revision-log textarea').length) {
          return Drupal.t('New revision');
        }

        return Drupal.t('No revision');
      });

      $context.find('details.entity-translation-options').drupalSetSummary(function (context) {
        var $translationContext = $(context);
        var translate = void 0;
        var $checkbox = $translationContext.find('.js-form-item-translation-translate input');

        if ($checkbox.length) {
          translate = $checkbox.is(':checked') ? Drupal.t('Needs to be updated') : Drupal.t('Does not need to be updated');
        } else {
          $checkbox = $translationContext.find('.js-form-item-translation-retranslate input');
          translate = $checkbox.is(':checked') ? Drupal.t('Flag other translations as outdated') : Drupal.t('Do not flag other translations as outdated');
        }

        return translate;
      });
    }
  };
})(jQuery, Drupal);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.nodeDetailsSummaries = {
    attach: function attach(context) {
      var $context = $(context);

      $context.find('.node-form-author').drupalSetSummary(function (context) {
        var $authorContext = $(context);
        var name = $authorContext.find('.field--name-uid input').val();
        var date = $authorContext.find('.field--name-created input').val();

        if (name && date) {
          return Drupal.t('By @name on @date', {
            '@name': name,
            '@date': date
          });
        }
        if (name) {
          return Drupal.t('By @name', { '@name': name });
        }
        if (date) {
          return Drupal.t('Authored on @date', { '@date': date });
        }
      });

      $context.find('.node-form-options').drupalSetSummary(function (context) {
        var $optionsContext = $(context);
        var vals = [];

        if ($optionsContext.find('input').is(':checked')) {
          $optionsContext.find('input:checked').next('label').each(function () {
            vals.push(Drupal.checkPlain($.trim($(this).text())));
          });
          return vals.join(', ');
        }

        return Drupal.t('Not promoted');
      });
    }
  };
})(jQuery, Drupal, drupalSettings);;
/*! jQuery UI - v1.12.1 - 2017-03-31
* http://jqueryui.com
* Copyright jQuery Foundation and other contributors; Licensed  */
!function(a){"function"==typeof define&&define.amd?define(["jquery","../version","../keycode"],a):a(jQuery)}(function(a){function b(a){for(var b,c;a.length&&a[0]!==document;){if(b=a.css("position"),("absolute"===b||"relative"===b||"fixed"===b)&&(c=parseInt(a.css("zIndex"),10),!isNaN(c)&&0!==c))return c;a=a.parent()}return 0}function c(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},a.extend(this._defaults,this.regional[""]),this.regional.en=a.extend(!0,{},this.regional[""]),this.regional["en-US"]=a.extend(!0,{},this.regional.en),this.dpDiv=d(a("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function d(b){var c="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return b.on("mouseout",c,function(){a(this).removeClass("ui-state-hover"),this.className.indexOf("ui-datepicker-prev")!==-1&&a(this).removeClass("ui-datepicker-prev-hover"),this.className.indexOf("ui-datepicker-next")!==-1&&a(this).removeClass("ui-datepicker-next-hover")}).on("mouseover",c,e)}function e(){a.datepicker._isDisabledDatepicker(g.inline?g.dpDiv.parent()[0]:g.input[0])||(a(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),a(this).addClass("ui-state-hover"),this.className.indexOf("ui-datepicker-prev")!==-1&&a(this).addClass("ui-datepicker-prev-hover"),this.className.indexOf("ui-datepicker-next")!==-1&&a(this).addClass("ui-datepicker-next-hover"))}function f(b,c){a.extend(b,c);for(var d in c)null==c[d]&&(b[d]=c[d]);return b}a.extend(a.ui,{datepicker:{version:"1.12.1"}});var g;return a.extend(c.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(a){return f(this._defaults,a||{}),this},_attachDatepicker:function(b,c){var d,e,f;d=b.nodeName.toLowerCase(),e="div"===d||"span"===d,b.id||(this.uuid+=1,b.id="dp"+this.uuid),f=this._newInst(a(b),e),f.settings=a.extend({},c||{}),"input"===d?this._connectDatepicker(b,f):e&&this._inlineDatepicker(b,f)},_newInst:function(b,c){var e=b[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1");return{id:e,input:b,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:c,dpDiv:c?d(a("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(b,c){var d=a(b);c.append=a([]),c.trigger=a([]),d.hasClass(this.markerClassName)||(this._attachments(d,c),d.addClass(this.markerClassName).on("keydown",this._doKeyDown).on("keypress",this._doKeyPress).on("keyup",this._doKeyUp),this._autoSize(c),a.data(b,"datepicker",c),c.settings.disabled&&this._disableDatepicker(b))},_attachments:function(b,c){var d,e,f,g=this._get(c,"appendText"),h=this._get(c,"isRTL");c.append&&c.append.remove(),g&&(c.append=a("<span class='"+this._appendClass+"'>"+g+"</span>"),b[h?"before":"after"](c.append)),b.off("focus",this._showDatepicker),c.trigger&&c.trigger.remove(),d=this._get(c,"showOn"),"focus"!==d&&"both"!==d||b.on("focus",this._showDatepicker),"button"!==d&&"both"!==d||(e=this._get(c,"buttonText"),f=this._get(c,"buttonImage"),c.trigger=a(this._get(c,"buttonImageOnly")?a("<img/>").addClass(this._triggerClass).attr({src:f,alt:e,title:e}):a("<button type='button'></button>").addClass(this._triggerClass).html(f?a("<img/>").attr({src:f,alt:e,title:e}):e)),b[h?"before":"after"](c.trigger),c.trigger.on("click",function(){return a.datepicker._datepickerShowing&&a.datepicker._lastInput===b[0]?a.datepicker._hideDatepicker():a.datepicker._datepickerShowing&&a.datepicker._lastInput!==b[0]?(a.datepicker._hideDatepicker(),a.datepicker._showDatepicker(b[0])):a.datepicker._showDatepicker(b[0]),!1}))},_autoSize:function(a){if(this._get(a,"autoSize")&&!a.inline){var b,c,d,e,f=new Date(2009,11,20),g=this._get(a,"dateFormat");g.match(/[DM]/)&&(b=function(a){for(c=0,d=0,e=0;e<a.length;e++)a[e].length>c&&(c=a[e].length,d=e);return d},f.setMonth(b(this._get(a,g.match(/MM/)?"monthNames":"monthNamesShort"))),f.setDate(b(this._get(a,g.match(/DD/)?"dayNames":"dayNamesShort"))+20-f.getDay())),a.input.attr("size",this._formatDate(a,f).length)}},_inlineDatepicker:function(b,c){var d=a(b);d.hasClass(this.markerClassName)||(d.addClass(this.markerClassName).append(c.dpDiv),a.data(b,"datepicker",c),this._setDate(c,this._getDefaultDate(c),!0),this._updateDatepicker(c),this._updateAlternate(c),c.settings.disabled&&this._disableDatepicker(b),c.dpDiv.css("display","block"))},_dialogDatepicker:function(b,c,d,e,g){var h,i,j,k,l,m=this._dialogInst;return m||(this.uuid+=1,h="dp"+this.uuid,this._dialogInput=a("<input type='text' id='"+h+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.on("keydown",this._doKeyDown),a("body").append(this._dialogInput),m=this._dialogInst=this._newInst(this._dialogInput,!1),m.settings={},a.data(this._dialogInput[0],"datepicker",m)),f(m.settings,e||{}),c=c&&c.constructor===Date?this._formatDate(m,c):c,this._dialogInput.val(c),this._pos=g?g.length?g:[g.pageX,g.pageY]:null,this._pos||(i=document.documentElement.clientWidth,j=document.documentElement.clientHeight,k=document.documentElement.scrollLeft||document.body.scrollLeft,l=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[i/2-100+k,j/2-150+l]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),m.settings.onSelect=d,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),a.blockUI&&a.blockUI(this.dpDiv),a.data(this._dialogInput[0],"datepicker",m),this},_destroyDatepicker:function(b){var c,d=a(b),e=a.data(b,"datepicker");d.hasClass(this.markerClassName)&&(c=b.nodeName.toLowerCase(),a.removeData(b,"datepicker"),"input"===c?(e.append.remove(),e.trigger.remove(),d.removeClass(this.markerClassName).off("focus",this._showDatepicker).off("keydown",this._doKeyDown).off("keypress",this._doKeyPress).off("keyup",this._doKeyUp)):"div"!==c&&"span"!==c||d.removeClass(this.markerClassName).empty(),g===e&&(g=null))},_enableDatepicker:function(b){var c,d,e=a(b),f=a.data(b,"datepicker");e.hasClass(this.markerClassName)&&(c=b.nodeName.toLowerCase(),"input"===c?(b.disabled=!1,f.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):"div"!==c&&"span"!==c||(d=e.children("."+this._inlineClass),d.children().removeClass("ui-state-disabled"),d.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=a.map(this._disabledInputs,function(a){return a===b?null:a}))},_disableDatepicker:function(b){var c,d,e=a(b),f=a.data(b,"datepicker");e.hasClass(this.markerClassName)&&(c=b.nodeName.toLowerCase(),"input"===c?(b.disabled=!0,f.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):"div"!==c&&"span"!==c||(d=e.children("."+this._inlineClass),d.children().addClass("ui-state-disabled"),d.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=a.map(this._disabledInputs,function(a){return a===b?null:a}),this._disabledInputs[this._disabledInputs.length]=b)},_isDisabledDatepicker:function(a){if(!a)return!1;for(var b=0;b<this._disabledInputs.length;b++)if(this._disabledInputs[b]===a)return!0;return!1},_getInst:function(b){try{return a.data(b,"datepicker")}catch(c){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(b,c,d){var e,g,h,i,j=this._getInst(b);return 2===arguments.length&&"string"==typeof c?"defaults"===c?a.extend({},a.datepicker._defaults):j?"all"===c?a.extend({},j.settings):this._get(j,c):null:(e=c||{},"string"==typeof c&&(e={},e[c]=d),void(j&&(this._curInst===j&&this._hideDatepicker(),g=this._getDateDatepicker(b,!0),h=this._getMinMaxDate(j,"min"),i=this._getMinMaxDate(j,"max"),f(j.settings,e),null!==h&&void 0!==e.dateFormat&&void 0===e.minDate&&(j.settings.minDate=this._formatDate(j,h)),null!==i&&void 0!==e.dateFormat&&void 0===e.maxDate&&(j.settings.maxDate=this._formatDate(j,i)),"disabled"in e&&(e.disabled?this._disableDatepicker(b):this._enableDatepicker(b)),this._attachments(a(b),j),this._autoSize(j),this._setDate(j,g),this._updateAlternate(j),this._updateDatepicker(j))))},_changeDatepicker:function(a,b,c){this._optionDatepicker(a,b,c)},_refreshDatepicker:function(a){var b=this._getInst(a);b&&this._updateDatepicker(b)},_setDateDatepicker:function(a,b){var c=this._getInst(a);c&&(this._setDate(c,b),this._updateDatepicker(c),this._updateAlternate(c))},_getDateDatepicker:function(a,b){var c=this._getInst(a);return c&&!c.inline&&this._setDateFromField(c,b),c?this._getDate(c):null},_doKeyDown:function(b){var c,d,e,f=a.datepicker._getInst(b.target),g=!0,h=f.dpDiv.is(".ui-datepicker-rtl");if(f._keyEvent=!0,a.datepicker._datepickerShowing)switch(b.keyCode){case 9:a.datepicker._hideDatepicker(),g=!1;break;case 13:return e=a("td."+a.datepicker._dayOverClass+":not(."+a.datepicker._currentClass+")",f.dpDiv),e[0]&&a.datepicker._selectDay(b.target,f.selectedMonth,f.selectedYear,e[0]),c=a.datepicker._get(f,"onSelect"),c?(d=a.datepicker._formatDate(f),c.apply(f.input?f.input[0]:null,[d,f])):a.datepicker._hideDatepicker(),!1;case 27:a.datepicker._hideDatepicker();break;case 33:a.datepicker._adjustDate(b.target,b.ctrlKey?-a.datepicker._get(f,"stepBigMonths"):-a.datepicker._get(f,"stepMonths"),"M");break;case 34:a.datepicker._adjustDate(b.target,b.ctrlKey?+a.datepicker._get(f,"stepBigMonths"):+a.datepicker._get(f,"stepMonths"),"M");break;case 35:(b.ctrlKey||b.metaKey)&&a.datepicker._clearDate(b.target),g=b.ctrlKey||b.metaKey;break;case 36:(b.ctrlKey||b.metaKey)&&a.datepicker._gotoToday(b.target),g=b.ctrlKey||b.metaKey;break;case 37:(b.ctrlKey||b.metaKey)&&a.datepicker._adjustDate(b.target,h?1:-1,"D"),g=b.ctrlKey||b.metaKey,b.originalEvent.altKey&&a.datepicker._adjustDate(b.target,b.ctrlKey?-a.datepicker._get(f,"stepBigMonths"):-a.datepicker._get(f,"stepMonths"),"M");break;case 38:(b.ctrlKey||b.metaKey)&&a.datepicker._adjustDate(b.target,-7,"D"),g=b.ctrlKey||b.metaKey;break;case 39:(b.ctrlKey||b.metaKey)&&a.datepicker._adjustDate(b.target,h?-1:1,"D"),g=b.ctrlKey||b.metaKey,b.originalEvent.altKey&&a.datepicker._adjustDate(b.target,b.ctrlKey?+a.datepicker._get(f,"stepBigMonths"):+a.datepicker._get(f,"stepMonths"),"M");break;case 40:(b.ctrlKey||b.metaKey)&&a.datepicker._adjustDate(b.target,7,"D"),g=b.ctrlKey||b.metaKey;break;default:g=!1}else 36===b.keyCode&&b.ctrlKey?a.datepicker._showDatepicker(this):g=!1;g&&(b.preventDefault(),b.stopPropagation())},_doKeyPress:function(b){var c,d,e=a.datepicker._getInst(b.target);if(a.datepicker._get(e,"constrainInput"))return c=a.datepicker._possibleChars(a.datepicker._get(e,"dateFormat")),d=String.fromCharCode(null==b.charCode?b.keyCode:b.charCode),b.ctrlKey||b.metaKey||d<" "||!c||c.indexOf(d)>-1},_doKeyUp:function(b){var c,d=a.datepicker._getInst(b.target);if(d.input.val()!==d.lastVal)try{c=a.datepicker.parseDate(a.datepicker._get(d,"dateFormat"),d.input?d.input.val():null,a.datepicker._getFormatConfig(d)),c&&(a.datepicker._setDateFromField(d),a.datepicker._updateAlternate(d),a.datepicker._updateDatepicker(d))}catch(e){}return!0},_showDatepicker:function(c){if(c=c.target||c,"input"!==c.nodeName.toLowerCase()&&(c=a("input",c.parentNode)[0]),!a.datepicker._isDisabledDatepicker(c)&&a.datepicker._lastInput!==c){var d,e,g,h,i,j,k;d=a.datepicker._getInst(c),a.datepicker._curInst&&a.datepicker._curInst!==d&&(a.datepicker._curInst.dpDiv.stop(!0,!0),d&&a.datepicker._datepickerShowing&&a.datepicker._hideDatepicker(a.datepicker._curInst.input[0])),e=a.datepicker._get(d,"beforeShow"),g=e?e.apply(c,[c,d]):{},g!==!1&&(f(d.settings,g),d.lastVal=null,a.datepicker._lastInput=c,a.datepicker._setDateFromField(d),a.datepicker._inDialog&&(c.value=""),a.datepicker._pos||(a.datepicker._pos=a.datepicker._findPos(c),a.datepicker._pos[1]+=c.offsetHeight),h=!1,a(c).parents().each(function(){return h|="fixed"===a(this).css("position"),!h}),i={left:a.datepicker._pos[0],top:a.datepicker._pos[1]},a.datepicker._pos=null,d.dpDiv.empty(),d.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),a.datepicker._updateDatepicker(d),i=a.datepicker._checkOffset(d,i,h),d.dpDiv.css({position:a.datepicker._inDialog&&a.blockUI?"static":h?"fixed":"absolute",display:"none",left:i.left+"px",top:i.top+"px"}),d.inline||(j=a.datepicker._get(d,"showAnim"),k=a.datepicker._get(d,"duration"),d.dpDiv.css("z-index",b(a(c))+1),a.datepicker._datepickerShowing=!0,a.effects&&a.effects.effect[j]?d.dpDiv.show(j,a.datepicker._get(d,"showOptions"),k):d.dpDiv[j||"show"](j?k:null),a.datepicker._shouldFocusInput(d)&&d.input.trigger("focus"),a.datepicker._curInst=d))}},_updateDatepicker:function(b){this.maxRows=4,g=b,b.dpDiv.empty().append(this._generateHTML(b)),this._attachHandlers(b);var c,d=this._getNumberOfMonths(b),f=d[1],h=17,i=b.dpDiv.find("."+this._dayOverClass+" a");i.length>0&&e.apply(i.get(0)),b.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),f>1&&b.dpDiv.addClass("ui-datepicker-multi-"+f).css("width",h*f+"em"),b.dpDiv[(1!==d[0]||1!==d[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),b.dpDiv[(this._get(b,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),b===a.datepicker._curInst&&a.datepicker._datepickerShowing&&a.datepicker._shouldFocusInput(b)&&b.input.trigger("focus"),b.yearshtml&&(c=b.yearshtml,setTimeout(function(){c===b.yearshtml&&b.yearshtml&&b.dpDiv.find("select.ui-datepicker-year:first").replaceWith(b.yearshtml),c=b.yearshtml=null},0))},_shouldFocusInput:function(a){return a.input&&a.input.is(":visible")&&!a.input.is(":disabled")&&!a.input.is(":focus")},_checkOffset:function(b,c,d){var e=b.dpDiv.outerWidth(),f=b.dpDiv.outerHeight(),g=b.input?b.input.outerWidth():0,h=b.input?b.input.outerHeight():0,i=document.documentElement.clientWidth+(d?0:a(document).scrollLeft()),j=document.documentElement.clientHeight+(d?0:a(document).scrollTop());return c.left-=this._get(b,"isRTL")?e-g:0,c.left-=d&&c.left===b.input.offset().left?a(document).scrollLeft():0,c.top-=d&&c.top===b.input.offset().top+h?a(document).scrollTop():0,c.left-=Math.min(c.left,c.left+e>i&&i>e?Math.abs(c.left+e-i):0),c.top-=Math.min(c.top,c.top+f>j&&j>f?Math.abs(f+h):0),c},_findPos:function(b){for(var c,d=this._getInst(b),e=this._get(d,"isRTL");b&&("hidden"===b.type||1!==b.nodeType||a.expr.filters.hidden(b));)b=b[e?"previousSibling":"nextSibling"];return c=a(b).offset(),[c.left,c.top]},_hideDatepicker:function(b){var c,d,e,f,g=this._curInst;!g||b&&g!==a.data(b,"datepicker")||this._datepickerShowing&&(c=this._get(g,"showAnim"),d=this._get(g,"duration"),e=function(){a.datepicker._tidyDialog(g)},a.effects&&(a.effects.effect[c]||a.effects[c])?g.dpDiv.hide(c,a.datepicker._get(g,"showOptions"),d,e):g.dpDiv["slideDown"===c?"slideUp":"fadeIn"===c?"fadeOut":"hide"](c?d:null,e),c||e(),this._datepickerShowing=!1,f=this._get(g,"onClose"),f&&f.apply(g.input?g.input[0]:null,[g.input?g.input.val():"",g]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),a.blockUI&&(a.unblockUI(),a("body").append(this.dpDiv))),this._inDialog=!1)},_tidyDialog:function(a){a.dpDiv.removeClass(this._dialogClass).off(".ui-datepicker-calendar")},_checkExternalClick:function(b){if(a.datepicker._curInst){var c=a(b.target),d=a.datepicker._getInst(c[0]);(c[0].id===a.datepicker._mainDivId||0!==c.parents("#"+a.datepicker._mainDivId).length||c.hasClass(a.datepicker.markerClassName)||c.closest("."+a.datepicker._triggerClass).length||!a.datepicker._datepickerShowing||a.datepicker._inDialog&&a.blockUI)&&(!c.hasClass(a.datepicker.markerClassName)||a.datepicker._curInst===d)||a.datepicker._hideDatepicker()}},_adjustDate:function(b,c,d){var e=a(b),f=this._getInst(e[0]);this._isDisabledDatepicker(e[0])||(this._adjustInstDate(f,c+("M"===d?this._get(f,"showCurrentAtPos"):0),d),this._updateDatepicker(f))},_gotoToday:function(b){var c,d=a(b),e=this._getInst(d[0]);this._get(e,"gotoCurrent")&&e.currentDay?(e.selectedDay=e.currentDay,e.drawMonth=e.selectedMonth=e.currentMonth,e.drawYear=e.selectedYear=e.currentYear):(c=new Date,e.selectedDay=c.getDate(),e.drawMonth=e.selectedMonth=c.getMonth(),e.drawYear=e.selectedYear=c.getFullYear()),this._notifyChange(e),this._adjustDate(d)},_selectMonthYear:function(b,c,d){var e=a(b),f=this._getInst(e[0]);f["selected"+("M"===d?"Month":"Year")]=f["draw"+("M"===d?"Month":"Year")]=parseInt(c.options[c.selectedIndex].value,10),this._notifyChange(f),this._adjustDate(e)},_selectDay:function(b,c,d,e){var f,g=a(b);a(e).hasClass(this._unselectableClass)||this._isDisabledDatepicker(g[0])||(f=this._getInst(g[0]),f.selectedDay=f.currentDay=a("a",e).html(),f.selectedMonth=f.currentMonth=c,f.selectedYear=f.currentYear=d,this._selectDate(b,this._formatDate(f,f.currentDay,f.currentMonth,f.currentYear)))},_clearDate:function(b){var c=a(b);this._selectDate(c,"")},_selectDate:function(b,c){var d,e=a(b),f=this._getInst(e[0]);c=null!=c?c:this._formatDate(f),f.input&&f.input.val(c),this._updateAlternate(f),d=this._get(f,"onSelect"),d?d.apply(f.input?f.input[0]:null,[c,f]):f.input&&f.input.trigger("change"),f.inline?this._updateDatepicker(f):(this._hideDatepicker(),this._lastInput=f.input[0],"object"!=typeof f.input[0]&&f.input.trigger("focus"),this._lastInput=null)},_updateAlternate:function(b){var c,d,e,f=this._get(b,"altField");f&&(c=this._get(b,"altFormat")||this._get(b,"dateFormat"),d=this._getDate(b),e=this.formatDate(c,d,this._getFormatConfig(b)),a(f).val(e))},noWeekends:function(a){var b=a.getDay();return[b>0&&b<6,""]},iso8601Week:function(a){var b,c=new Date(a.getTime());return c.setDate(c.getDate()+4-(c.getDay()||7)),b=c.getTime(),c.setMonth(0),c.setDate(1),Math.floor(Math.round((b-c)/864e5)/7)+1},parseDate:function(b,c,d){if(null==b||null==c)throw"Invalid arguments";if(c="object"==typeof c?c.toString():c+"",""===c)return null;var e,f,g,h,i=0,j=(d?d.shortYearCutoff:null)||this._defaults.shortYearCutoff,k="string"!=typeof j?j:(new Date).getFullYear()%100+parseInt(j,10),l=(d?d.dayNamesShort:null)||this._defaults.dayNamesShort,m=(d?d.dayNames:null)||this._defaults.dayNames,n=(d?d.monthNamesShort:null)||this._defaults.monthNamesShort,o=(d?d.monthNames:null)||this._defaults.monthNames,p=-1,q=-1,r=-1,s=-1,t=!1,u=function(a){var c=e+1<b.length&&b.charAt(e+1)===a;return c&&e++,c},v=function(a){var b=u(a),d="@"===a?14:"!"===a?20:"y"===a&&b?4:"o"===a?3:2,e="y"===a?d:1,f=new RegExp("^\\d{"+e+","+d+"}"),g=c.substring(i).match(f);if(!g)throw"Missing number at position "+i;return i+=g[0].length,parseInt(g[0],10)},w=function(b,d,e){var f=-1,g=a.map(u(b)?e:d,function(a,b){return[[b,a]]}).sort(function(a,b){return-(a[1].length-b[1].length)});if(a.each(g,function(a,b){var d=b[1];if(c.substr(i,d.length).toLowerCase()===d.toLowerCase())return f=b[0],i+=d.length,!1}),f!==-1)return f+1;throw"Unknown name at position "+i},x=function(){if(c.charAt(i)!==b.charAt(e))throw"Unexpected literal at position "+i;i++};for(e=0;e<b.length;e++)if(t)"'"!==b.charAt(e)||u("'")?x():t=!1;else switch(b.charAt(e)){case"d":r=v("d");break;case"D":w("D",l,m);break;case"o":s=v("o");break;case"m":q=v("m");break;case"M":q=w("M",n,o);break;case"y":p=v("y");break;case"@":h=new Date(v("@")),p=h.getFullYear(),q=h.getMonth()+1,r=h.getDate();break;case"!":h=new Date((v("!")-this._ticksTo1970)/1e4),p=h.getFullYear(),q=h.getMonth()+1,r=h.getDate();break;case"'":u("'")?x():t=!0;break;default:x()}if(i<c.length&&(g=c.substr(i),!/^\s+/.test(g)))throw"Extra/unparsed characters found in date: "+g;if(p===-1?p=(new Date).getFullYear():p<100&&(p+=(new Date).getFullYear()-(new Date).getFullYear()%100+(p<=k?0:-100)),s>-1)for(q=1,r=s;;){if(f=this._getDaysInMonth(p,q-1),r<=f)break;q++,r-=f}if(h=this._daylightSavingAdjust(new Date(p,q-1,r)),h.getFullYear()!==p||h.getMonth()+1!==q||h.getDate()!==r)throw"Invalid date";return h},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925))*60*60*1e7,formatDate:function(a,b,c){if(!b)return"";var d,e=(c?c.dayNamesShort:null)||this._defaults.dayNamesShort,f=(c?c.dayNames:null)||this._defaults.dayNames,g=(c?c.monthNamesShort:null)||this._defaults.monthNamesShort,h=(c?c.monthNames:null)||this._defaults.monthNames,i=function(b){var c=d+1<a.length&&a.charAt(d+1)===b;return c&&d++,c},j=function(a,b,c){var d=""+b;if(i(a))for(;d.length<c;)d="0"+d;return d},k=function(a,b,c,d){return i(a)?d[b]:c[b]},l="",m=!1;if(b)for(d=0;d<a.length;d++)if(m)"'"!==a.charAt(d)||i("'")?l+=a.charAt(d):m=!1;else switch(a.charAt(d)){case"d":l+=j("d",b.getDate(),2);break;case"D":l+=k("D",b.getDay(),e,f);break;case"o":l+=j("o",Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate()).getTime()-new Date(b.getFullYear(),0,0).getTime())/864e5),3);break;case"m":l+=j("m",b.getMonth()+1,2);break;case"M":l+=k("M",b.getMonth(),g,h);break;case"y":l+=i("y")?b.getFullYear():(b.getFullYear()%100<10?"0":"")+b.getFullYear()%100;break;case"@":l+=b.getTime();break;case"!":l+=1e4*b.getTime()+this._ticksTo1970;break;case"'":i("'")?l+="'":m=!0;break;default:l+=a.charAt(d)}return l},_possibleChars:function(a){var b,c="",d=!1,e=function(c){var d=b+1<a.length&&a.charAt(b+1)===c;return d&&b++,d};for(b=0;b<a.length;b++)if(d)"'"!==a.charAt(b)||e("'")?c+=a.charAt(b):d=!1;else switch(a.charAt(b)){case"d":case"m":case"y":case"@":c+="0123456789";break;case"D":case"M":return null;case"'":e("'")?c+="'":d=!0;break;default:c+=a.charAt(b)}return c},_get:function(a,b){return void 0!==a.settings[b]?a.settings[b]:this._defaults[b]},_setDateFromField:function(a,b){if(a.input.val()!==a.lastVal){var c=this._get(a,"dateFormat"),d=a.lastVal=a.input?a.input.val():null,e=this._getDefaultDate(a),f=e,g=this._getFormatConfig(a);try{f=this.parseDate(c,d,g)||e}catch(h){d=b?"":d}a.selectedDay=f.getDate(),a.drawMonth=a.selectedMonth=f.getMonth(),a.drawYear=a.selectedYear=f.getFullYear(),a.currentDay=d?f.getDate():0,a.currentMonth=d?f.getMonth():0,a.currentYear=d?f.getFullYear():0,this._adjustInstDate(a)}},_getDefaultDate:function(a){return this._restrictMinMax(a,this._determineDate(a,this._get(a,"defaultDate"),new Date))},_determineDate:function(b,c,d){var e=function(a){var b=new Date;return b.setDate(b.getDate()+a),b},f=function(c){try{return a.datepicker.parseDate(a.datepicker._get(b,"dateFormat"),c,a.datepicker._getFormatConfig(b))}catch(d){}for(var e=(c.toLowerCase().match(/^c/)?a.datepicker._getDate(b):null)||new Date,f=e.getFullYear(),g=e.getMonth(),h=e.getDate(),i=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,j=i.exec(c);j;){switch(j[2]||"d"){case"d":case"D":h+=parseInt(j[1],10);break;case"w":case"W":h+=7*parseInt(j[1],10);break;case"m":case"M":g+=parseInt(j[1],10),h=Math.min(h,a.datepicker._getDaysInMonth(f,g));break;case"y":case"Y":f+=parseInt(j[1],10),h=Math.min(h,a.datepicker._getDaysInMonth(f,g))}j=i.exec(c)}return new Date(f,g,h)},g=null==c||""===c?d:"string"==typeof c?f(c):"number"==typeof c?isNaN(c)?d:e(c):new Date(c.getTime());return g=g&&"Invalid Date"===g.toString()?d:g,g&&(g.setHours(0),g.setMinutes(0),g.setSeconds(0),g.setMilliseconds(0)),this._daylightSavingAdjust(g)},_daylightSavingAdjust:function(a){return a?(a.setHours(a.getHours()>12?a.getHours()+2:0),a):null},_setDate:function(a,b,c){var d=!b,e=a.selectedMonth,f=a.selectedYear,g=this._restrictMinMax(a,this._determineDate(a,b,new Date));a.selectedDay=a.currentDay=g.getDate(),a.drawMonth=a.selectedMonth=a.currentMonth=g.getMonth(),a.drawYear=a.selectedYear=a.currentYear=g.getFullYear(),e===a.selectedMonth&&f===a.selectedYear||c||this._notifyChange(a),this._adjustInstDate(a),a.input&&a.input.val(d?"":this._formatDate(a))},_getDate:function(a){var b=!a.currentYear||a.input&&""===a.input.val()?null:this._daylightSavingAdjust(new Date(a.currentYear,a.currentMonth,a.currentDay));return b},_attachHandlers:function(b){var c=this._get(b,"stepMonths"),d="#"+b.id.replace(/\\\\/g,"\\");b.dpDiv.find("[data-handler]").map(function(){var b={prev:function(){a.datepicker._adjustDate(d,-c,"M")},next:function(){a.datepicker._adjustDate(d,+c,"M")},hide:function(){a.datepicker._hideDatepicker()},today:function(){a.datepicker._gotoToday(d)},selectDay:function(){return a.datepicker._selectDay(d,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return a.datepicker._selectMonthYear(d,this,"M"),!1},selectYear:function(){return a.datepicker._selectMonthYear(d,this,"Y"),!1}};a(this).on(this.getAttribute("data-event"),b[this.getAttribute("data-handler")])})},_generateHTML:function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O=new Date,P=this._daylightSavingAdjust(new Date(O.getFullYear(),O.getMonth(),O.getDate())),Q=this._get(a,"isRTL"),R=this._get(a,"showButtonPanel"),S=this._get(a,"hideIfNoPrevNext"),T=this._get(a,"navigationAsDateFormat"),U=this._getNumberOfMonths(a),V=this._get(a,"showCurrentAtPos"),W=this._get(a,"stepMonths"),X=1!==U[0]||1!==U[1],Y=this._daylightSavingAdjust(a.currentDay?new Date(a.currentYear,a.currentMonth,a.currentDay):new Date(9999,9,9)),Z=this._getMinMaxDate(a,"min"),$=this._getMinMaxDate(a,"max"),_=a.drawMonth-V,aa=a.drawYear;if(_<0&&(_+=12,aa--),$)for(b=this._daylightSavingAdjust(new Date($.getFullYear(),$.getMonth()-U[0]*U[1]+1,$.getDate())),b=Z&&b<Z?Z:b;this._daylightSavingAdjust(new Date(aa,_,1))>b;)_--,_<0&&(_=11,aa--);for(a.drawMonth=_,a.drawYear=aa,c=this._get(a,"prevText"),c=T?this.formatDate(c,this._daylightSavingAdjust(new Date(aa,_-W,1)),this._getFormatConfig(a)):c,d=this._canAdjustMonth(a,-1,aa,_)?"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click' title='"+c+"'><span class='ui-icon ui-icon-circle-triangle-"+(Q?"e":"w")+"'>"+c+"</span></a>":S?"":"<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+c+"'><span class='ui-icon ui-icon-circle-triangle-"+(Q?"e":"w")+"'>"+c+"</span></a>",e=this._get(a,"nextText"),e=T?this.formatDate(e,this._daylightSavingAdjust(new Date(aa,_+W,1)),this._getFormatConfig(a)):e,f=this._canAdjustMonth(a,1,aa,_)?"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click' title='"+e+"'><span class='ui-icon ui-icon-circle-triangle-"+(Q?"w":"e")+"'>"+e+"</span></a>":S?"":"<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+e+"'><span class='ui-icon ui-icon-circle-triangle-"+(Q?"w":"e")+"'>"+e+"</span></a>",g=this._get(a,"currentText"),h=this._get(a,"gotoCurrent")&&a.currentDay?Y:P,g=T?this.formatDate(g,h,this._getFormatConfig(a)):g,i=a.inline?"":"<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>"+this._get(a,"closeText")+"</button>",j=R?"<div class='ui-datepicker-buttonpane ui-widget-content'>"+(Q?i:"")+(this._isInRange(a,h)?"<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'>"+g+"</button>":"")+(Q?"":i)+"</div>":"",k=parseInt(this._get(a,"firstDay"),10),k=isNaN(k)?0:k,l=this._get(a,"showWeek"),m=this._get(a,"dayNames"),n=this._get(a,"dayNamesMin"),o=this._get(a,"monthNames"),p=this._get(a,"monthNamesShort"),q=this._get(a,"beforeShowDay"),r=this._get(a,"showOtherMonths"),s=this._get(a,"selectOtherMonths"),t=this._getDefaultDate(a),u="",w=0;w<U[0];w++){for(x="",this.maxRows=4,y=0;y<U[1];y++){if(z=this._daylightSavingAdjust(new Date(aa,_,a.selectedDay)),A=" ui-corner-all",B="",X){if(B+="<div class='ui-datepicker-group",U[1]>1)switch(y){case 0:B+=" ui-datepicker-group-first",A=" ui-corner-"+(Q?"right":"left");break;case U[1]-1:B+=" ui-datepicker-group-last",A=" ui-corner-"+(Q?"left":"right");break;default:B+=" ui-datepicker-group-middle",A=""}B+="'>"}for(B+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+A+"'>"+(/all|left/.test(A)&&0===w?Q?f:d:"")+(/all|right/.test(A)&&0===w?Q?d:f:"")+this._generateMonthYearHeader(a,_,aa,Z,$,w>0||y>0,o,p)+"</div><table class='ui-datepicker-calendar'><thead><tr>",C=l?"<th class='ui-datepicker-week-col'>"+this._get(a,"weekHeader")+"</th>":"",v=0;v<7;v++)D=(v+k)%7,C+="<th scope='col'"+((v+k+6)%7>=5?" class='ui-datepicker-week-end'":"")+"><span title='"+m[D]+"'>"+n[D]+"</span></th>";for(B+=C+"</tr></thead><tbody>",E=this._getDaysInMonth(aa,_),aa===a.selectedYear&&_===a.selectedMonth&&(a.selectedDay=Math.min(a.selectedDay,E)),F=(this._getFirstDayOfMonth(aa,_)-k+7)%7,G=Math.ceil((F+E)/7),H=X&&this.maxRows>G?this.maxRows:G,this.maxRows=H,I=this._daylightSavingAdjust(new Date(aa,_,1-F)),J=0;J<H;J++){for(B+="<tr>",K=l?"<td class='ui-datepicker-week-col'>"+this._get(a,"calculateWeek")(I)+"</td>":"",v=0;v<7;v++)L=q?q.apply(a.input?a.input[0]:null,[I]):[!0,""],M=I.getMonth()!==_,N=M&&!s||!L[0]||Z&&I<Z||$&&I>$,K+="<td class='"+((v+k+6)%7>=5?" ui-datepicker-week-end":"")+(M?" ui-datepicker-other-month":"")+(I.getTime()===z.getTime()&&_===a.selectedMonth&&a._keyEvent||t.getTime()===I.getTime()&&t.getTime()===z.getTime()?" "+this._dayOverClass:"")+(N?" "+this._unselectableClass+" ui-state-disabled":"")+(M&&!r?"":" "+L[1]+(I.getTime()===Y.getTime()?" "+this._currentClass:"")+(I.getTime()===P.getTime()?" ui-datepicker-today":""))+"'"+(M&&!r||!L[2]?"":" title='"+L[2].replace(/'/g,"&#39;")+"'")+(N?"":" data-handler='selectDay' data-event='click' data-month='"+I.getMonth()+"' data-year='"+I.getFullYear()+"'")+">"+(M&&!r?"&#xa0;":N?"<span class='ui-state-default'>"+I.getDate()+"</span>":"<a class='ui-state-default"+(I.getTime()===P.getTime()?" ui-state-highlight":"")+(I.getTime()===Y.getTime()?" ui-state-active":"")+(M?" ui-priority-secondary":"")+"' href='#'>"+I.getDate()+"</a>")+"</td>",I.setDate(I.getDate()+1),I=this._daylightSavingAdjust(I);B+=K+"</tr>"}_++,_>11&&(_=0,aa++),B+="</tbody></table>"+(X?"</div>"+(U[0]>0&&y===U[1]-1?"<div class='ui-datepicker-row-break'></div>":""):""),x+=B}u+=x}return u+=j,a._keyEvent=!1,u},_generateMonthYearHeader:function(a,b,c,d,e,f,g,h){var i,j,k,l,m,n,o,p,q=this._get(a,"changeMonth"),r=this._get(a,"changeYear"),s=this._get(a,"showMonthAfterYear"),t="<div class='ui-datepicker-title'>",u="";if(f||!q)u+="<span class='ui-datepicker-month'>"+g[b]+"</span>";else{
for(i=d&&d.getFullYear()===c,j=e&&e.getFullYear()===c,u+="<select class='ui-datepicker-month' data-handler='selectMonth' data-event='change'>",k=0;k<12;k++)(!i||k>=d.getMonth())&&(!j||k<=e.getMonth())&&(u+="<option value='"+k+"'"+(k===b?" selected='selected'":"")+">"+h[k]+"</option>");u+="</select>"}if(s||(t+=u+(!f&&q&&r?"":"&#xa0;")),!a.yearshtml)if(a.yearshtml="",f||!r)t+="<span class='ui-datepicker-year'>"+c+"</span>";else{for(l=this._get(a,"yearRange").split(":"),m=(new Date).getFullYear(),n=function(a){var b=a.match(/c[+\-].*/)?c+parseInt(a.substring(1),10):a.match(/[+\-].*/)?m+parseInt(a,10):parseInt(a,10);return isNaN(b)?m:b},o=n(l[0]),p=Math.max(o,n(l[1]||"")),o=d?Math.max(o,d.getFullYear()):o,p=e?Math.min(p,e.getFullYear()):p,a.yearshtml+="<select class='ui-datepicker-year' data-handler='selectYear' data-event='change'>";o<=p;o++)a.yearshtml+="<option value='"+o+"'"+(o===c?" selected='selected'":"")+">"+o+"</option>";a.yearshtml+="</select>",t+=a.yearshtml,a.yearshtml=null}return t+=this._get(a,"yearSuffix"),s&&(t+=(!f&&q&&r?"":"&#xa0;")+u),t+="</div>"},_adjustInstDate:function(a,b,c){var d=a.selectedYear+("Y"===c?b:0),e=a.selectedMonth+("M"===c?b:0),f=Math.min(a.selectedDay,this._getDaysInMonth(d,e))+("D"===c?b:0),g=this._restrictMinMax(a,this._daylightSavingAdjust(new Date(d,e,f)));a.selectedDay=g.getDate(),a.drawMonth=a.selectedMonth=g.getMonth(),a.drawYear=a.selectedYear=g.getFullYear(),"M"!==c&&"Y"!==c||this._notifyChange(a)},_restrictMinMax:function(a,b){var c=this._getMinMaxDate(a,"min"),d=this._getMinMaxDate(a,"max"),e=c&&b<c?c:b;return d&&e>d?d:e},_notifyChange:function(a){var b=this._get(a,"onChangeMonthYear");b&&b.apply(a.input?a.input[0]:null,[a.selectedYear,a.selectedMonth+1,a])},_getNumberOfMonths:function(a){var b=this._get(a,"numberOfMonths");return null==b?[1,1]:"number"==typeof b?[1,b]:b},_getMinMaxDate:function(a,b){return this._determineDate(a,this._get(a,b+"Date"),null)},_getDaysInMonth:function(a,b){return 32-this._daylightSavingAdjust(new Date(a,b,32)).getDate()},_getFirstDayOfMonth:function(a,b){return new Date(a,b,1).getDay()},_canAdjustMonth:function(a,b,c,d){var e=this._getNumberOfMonths(a),f=this._daylightSavingAdjust(new Date(c,d+(b<0?b:e[0]*e[1]),1));return b<0&&f.setDate(this._getDaysInMonth(f.getFullYear(),f.getMonth())),this._isInRange(a,f)},_isInRange:function(a,b){var c,d,e=this._getMinMaxDate(a,"min"),f=this._getMinMaxDate(a,"max"),g=null,h=null,i=this._get(a,"yearRange");return i&&(c=i.split(":"),d=(new Date).getFullYear(),g=parseInt(c[0],10),h=parseInt(c[1],10),c[0].match(/[+\-].*/)&&(g+=d),c[1].match(/[+\-].*/)&&(h+=d)),(!e||b.getTime()>=e.getTime())&&(!f||b.getTime()<=f.getTime())&&(!g||b.getFullYear()>=g)&&(!h||b.getFullYear()<=h)},_getFormatConfig:function(a){var b=this._get(a,"shortYearCutoff");return b="string"!=typeof b?b:(new Date).getFullYear()%100+parseInt(b,10),{shortYearCutoff:b,dayNamesShort:this._get(a,"dayNamesShort"),dayNames:this._get(a,"dayNames"),monthNamesShort:this._get(a,"monthNamesShort"),monthNames:this._get(a,"monthNames")}},_formatDate:function(a,b,c,d){b||(a.currentDay=a.selectedDay,a.currentMonth=a.selectedMonth,a.currentYear=a.selectedYear);var e=b?"object"==typeof b?b:this._daylightSavingAdjust(new Date(d,c,b)):this._daylightSavingAdjust(new Date(a.currentYear,a.currentMonth,a.currentDay));return this.formatDate(this._get(a,"dateFormat"),e,this._getFormatConfig(a))}}),a.fn.datepicker=function(b){if(!this.length)return this;a.datepicker.initialized||(a(document).on("mousedown",a.datepicker._checkExternalClick),a.datepicker.initialized=!0),0===a("#"+a.datepicker._mainDivId).length&&a("body").append(a.datepicker.dpDiv);var c=Array.prototype.slice.call(arguments,1);return"string"!=typeof b||"isDisabled"!==b&&"getDate"!==b&&"widget"!==b?"option"===b&&2===arguments.length&&"string"==typeof arguments[1]?a.datepicker["_"+b+"Datepicker"].apply(a.datepicker,[this[0]].concat(c)):this.each(function(){"string"==typeof b?a.datepicker["_"+b+"Datepicker"].apply(a.datepicker,[this].concat(c)):a.datepicker._attachDatepicker(this,b)}):a.datepicker["_"+b+"Datepicker"].apply(a.datepicker,[this[0]].concat(c))},a.datepicker=new c,a.datepicker.initialized=!1,a.datepicker.uuid=(new Date).getTime(),a.datepicker.version="1.12.1",a.datepicker});;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Modernizr, Drupal) {
  Drupal.behaviors.date = {
    attach: function attach(context, settings) {
      var $context = $(context);

      if (Modernizr.inputtypes.date === true) {
        return;
      }
      $context.find('input[data-drupal-date-format]').once('datePicker').each(function () {
        var $input = $(this);
        var datepickerSettings = {};
        var dateFormat = $input.data('drupalDateFormat');

        datepickerSettings.dateFormat = dateFormat.replace('Y', 'yy').replace('m', 'mm').replace('d', 'dd');

        if ($input.attr('min')) {
          datepickerSettings.minDate = $input.attr('min');
        }
        if ($input.attr('max')) {
          datepickerSettings.maxDate = $input.attr('max');
        }
        $input.datepicker(datepickerSettings);
      });
    },
    detach: function detach(context, settings, trigger) {
      if (trigger === 'unload') {
        $(context).find('input[data-drupal-date-format]').findOnce('datePicker').datepicker('destroy');
      }
    }
  };
})(jQuery, Modernizr, Drupal);;
jQuery(function() {
jQuery('#idproofother-js').hide();
jQuery('body').on('change', '#idproof-js', function (event) {
var idproof = jQuery('#idproof-js').val();
if(idproof == "Other") {
  jQuery('#idproofother-js').show();
}
else {
  jQuery('#idproofother-js').hide();
  jQuery('#idproofother-js').val('');
}
jQuery('#iddetails-js').val('');
var idproofother = jQuery('#idproofother-js').val();
if(idproof == "Other" && idproofother != "")
{
  jQuery('#idproofother-js').show();
}
});
});

;
;
/*!
 * jQuery Cycle Plugin (with Transition Definitions)
 * Examples and documentation at: http://jquery.malsup.com/cycle/
 * Copyright (c) 2007-2013 M. Alsup
 * Version: 3.0.3 (11-JUL-2013)
 * Dual licensed under the MIT and GPL licenses.
 * http://jquery.malsup.com/license.html
 * Requires: jQuery v1.7.1 or later
 */
;(function($, undefined) {
"use strict";

var ver = '3.0.3';

function debug(s) {
	if ($.fn.cycle.debug)
		log(s);
}		
function log() {
	/*global console */
	if (window.console && console.log)
		console.log('[cycle] ' + Array.prototype.join.call(arguments,' '));
}
$.expr[':'].paused = function(el) {
	return el.cyclePause;
};


// the options arg can be...
//   a number  - indicates an immediate transition should occur to the given slide index
//   a string  - 'pause', 'resume', 'toggle', 'next', 'prev', 'stop', 'destroy' or the name of a transition effect (ie, 'fade', 'zoom', etc)
//   an object - properties to control the slideshow
//
// the arg2 arg can be...
//   the name of an fx (only used in conjunction with a numeric value for 'options')
//   the value true (only used in first arg == 'resume') and indicates
//	 that the resume should occur immediately (not wait for next timeout)

$.fn.cycle = function(options, arg2) {
	var o = { s: this.selector, c: this.context };

	// in 1.3+ we can fix mistakes with the ready state
	if (this.length === 0 && options != 'stop') {
		if (!$.isReady && o.s) {
			log('DOM not ready, queuing slideshow');
			$(function() {
				$(o.s,o.c).cycle(options,arg2);
			});
			return this;
		}
		// is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
		log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
		return this;
	}

	// iterate the matched nodeset
	return this.each(function() {
		var opts = handleArguments(this, options, arg2);
		if (opts === false)
			return;

		opts.updateActivePagerLink = opts.updateActivePagerLink || $.fn.cycle.updateActivePagerLink;
		
		// stop existing slideshow for this container (if there is one)
		if (this.cycleTimeout)
			clearTimeout(this.cycleTimeout);
		this.cycleTimeout = this.cyclePause = 0;
		this.cycleStop = 0; // issue #108

		var $cont = $(this);
		var $slides = opts.slideExpr ? $(opts.slideExpr, this) : $cont.children();
		var els = $slides.get();

		if (els.length < 2) {
			log('terminating; too few slides: ' + els.length);
			return;
		}

		var opts2 = buildOptions($cont, $slides, els, opts, o);
		if (opts2 === false)
			return;

		var startTime = opts2.continuous ? 10 : getTimeout(els[opts2.currSlide], els[opts2.nextSlide], opts2, !opts2.backwards);

		// if it's an auto slideshow, kick it off
		if (startTime) {
			startTime += (opts2.delay || 0);
			if (startTime < 10)
				startTime = 10;
			debug('first timeout: ' + startTime);
			this.cycleTimeout = setTimeout(function(){go(els,opts2,0,!opts.backwards);}, startTime);
		}
	});
};

function triggerPause(cont, byHover, onPager) {
	var opts = $(cont).data('cycle.opts');
	if (!opts)
		return;
	var paused = !!cont.cyclePause;
	if (paused && opts.paused)
		opts.paused(cont, opts, byHover, onPager);
	else if (!paused && opts.resumed)
		opts.resumed(cont, opts, byHover, onPager);
}

// process the args that were passed to the plugin fn
function handleArguments(cont, options, arg2) {
	if (cont.cycleStop === undefined)
		cont.cycleStop = 0;
	if (options === undefined || options === null)
		options = {};
	if (options.constructor == String) {
		switch(options) {
		case 'destroy':
		case 'stop':
			var opts = $(cont).data('cycle.opts');
			if (!opts)
				return false;
			cont.cycleStop++; // callbacks look for change
			if (cont.cycleTimeout)
				clearTimeout(cont.cycleTimeout);
			cont.cycleTimeout = 0;
			if (opts.elements)
				$(opts.elements).stop();
			$(cont).removeData('cycle.opts');
			if (options == 'destroy')
				destroy(cont, opts);
			return false;
		case 'toggle':
			cont.cyclePause = (cont.cyclePause === 1) ? 0 : 1;
			checkInstantResume(cont.cyclePause, arg2, cont);
			triggerPause(cont);
			return false;
		case 'pause':
			cont.cyclePause = 1;
			triggerPause(cont);
			return false;
		case 'resume':
			cont.cyclePause = 0;
			checkInstantResume(false, arg2, cont);
			triggerPause(cont);
			return false;
		case 'prev':
		case 'next':
			opts = $(cont).data('cycle.opts');
			if (!opts) {
				log('options not found, "prev/next" ignored');
				return false;
			}
			if (typeof arg2 == 'string') 
				opts.oneTimeFx = arg2;
			$.fn.cycle[options](opts);
			return false;
		default:
			options = { fx: options };
		}
		return options;
	}
	else if (options.constructor == Number) {
		// go to the requested slide
		var num = options;
		options = $(cont).data('cycle.opts');
		if (!options) {
			log('options not found, can not advance slide');
			return false;
		}
		if (num < 0 || num >= options.elements.length) {
			log('invalid slide index: ' + num);
			return false;
		}
		options.nextSlide = num;
		if (cont.cycleTimeout) {
			clearTimeout(cont.cycleTimeout);
			cont.cycleTimeout = 0;
		}
		if (typeof arg2 == 'string')
			options.oneTimeFx = arg2;
		go(options.elements, options, 1, num >= options.currSlide);
		return false;
	}
	return options;
	
	function checkInstantResume(isPaused, arg2, cont) {
		if (!isPaused && arg2 === true) { // resume now!
			var options = $(cont).data('cycle.opts');
			if (!options) {
				log('options not found, can not resume');
				return false;
			}
			if (cont.cycleTimeout) {
				clearTimeout(cont.cycleTimeout);
				cont.cycleTimeout = 0;
			}
			go(options.elements, options, 1, !options.backwards);
		}
	}
}

function removeFilter(el, opts) {
	if (!$.support.opacity && opts.cleartype && el.style.filter) {
		try { el.style.removeAttribute('filter'); }
		catch(smother) {} // handle old opera versions
	}
}

// unbind event handlers
function destroy(cont, opts) {
	if (opts.next)
		$(opts.next).unbind(opts.prevNextEvent);
	if (opts.prev)
		$(opts.prev).unbind(opts.prevNextEvent);
	
	if (opts.pager || opts.pagerAnchorBuilder)
		$.each(opts.pagerAnchors || [], function() {
			this.unbind().remove();
		});
	opts.pagerAnchors = null;
	$(cont).unbind('mouseenter.cycle mouseleave.cycle');
	if (opts.destroy) // callback
		opts.destroy(opts);
}

// one-time initialization
function buildOptions($cont, $slides, els, options, o) {
	var startingSlideSpecified;
	// support metadata plugin (v1.0 and v2.0)
	var opts = $.extend({}, $.fn.cycle.defaults, options || {}, $.metadata ? $cont.metadata() : $.meta ? $cont.data() : {});
	var meta = $.isFunction($cont.data) ? $cont.data(opts.metaAttr) : null;
	if (meta)
		opts = $.extend(opts, meta);
	if (opts.autostop)
		opts.countdown = opts.autostopCount || els.length;

	var cont = $cont[0];
	$cont.data('cycle.opts', opts);
	opts.$cont = $cont;
	opts.stopCount = cont.cycleStop;
	opts.elements = els;
	opts.before = opts.before ? [opts.before] : [];
	opts.after = opts.after ? [opts.after] : [];

	// push some after callbacks
	if (!$.support.opacity && opts.cleartype)
		opts.after.push(function() { removeFilter(this, opts); });
	if (opts.continuous)
		opts.after.push(function() { go(els,opts,0,!opts.backwards); });

	saveOriginalOpts(opts);

	// clearType corrections
	if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
		clearTypeFix($slides);

	// container requires non-static position so that slides can be position within
	if ($cont.css('position') == 'static')
		$cont.css('position', 'relative');
	if (opts.width)
		$cont.width(opts.width);
	if (opts.height && opts.height != 'auto')
		$cont.height(opts.height);

	if (opts.startingSlide !== undefined) {
		opts.startingSlide = parseInt(opts.startingSlide,10);
		if (opts.startingSlide >= els.length || opts.startSlide < 0)
			opts.startingSlide = 0; // catch bogus input
		else 
			startingSlideSpecified = true;
	}
	else if (opts.backwards)
		opts.startingSlide = els.length - 1;
	else
		opts.startingSlide = 0;

	// if random, mix up the slide array
	if (opts.random) {
		opts.randomMap = [];
		for (var i = 0; i < els.length; i++)
			opts.randomMap.push(i);
		opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
		if (startingSlideSpecified) {
			// try to find the specified starting slide and if found set start slide index in the map accordingly
			for ( var cnt = 0; cnt < els.length; cnt++ ) {
				if ( opts.startingSlide == opts.randomMap[cnt] ) {
					opts.randomIndex = cnt;
				}
			}
		}
		else {
			opts.randomIndex = 1;
			opts.startingSlide = opts.randomMap[1];
		}
	}
	else if (opts.startingSlide >= els.length)
		opts.startingSlide = 0; // catch bogus input
	opts.currSlide = opts.startingSlide || 0;
	var first = opts.startingSlide;

	// set position and zIndex on all the slides
	$slides.css({position: 'absolute', top:0, left:0}).hide().each(function(i) {
		var z;
		if (opts.backwards)
			z = first ? i <= first ? els.length + (i-first) : first-i : els.length-i;
		else
			z = first ? i >= first ? els.length - (i-first) : first-i : els.length-i;
		$(this).css('z-index', z);
	});

	// make sure first slide is visible
	$(els[first]).css('opacity',1).show(); // opacity bit needed to handle restart use case
	removeFilter(els[first], opts);

	// stretch slides
	if (opts.fit) {
		if (!opts.aspect) {
	        if (opts.width)
	            $slides.width(opts.width);
	        if (opts.height && opts.height != 'auto')
	            $slides.height(opts.height);
		} else {
			$slides.each(function(){
				var $slide = $(this);
				var ratio = (opts.aspect === true) ? $slide.width()/$slide.height() : opts.aspect;
				if( opts.width && $slide.width() != opts.width ) {
					$slide.width( opts.width );
					$slide.height( opts.width / ratio );
				}

				if( opts.height && $slide.height() < opts.height ) {
					$slide.height( opts.height );
					$slide.width( opts.height * ratio );
				}
			});
		}
	}

	if (opts.center && ((!opts.fit) || opts.aspect)) {
		$slides.each(function(){
			var $slide = $(this);
			$slide.css({
				"margin-left": opts.width ?
					((opts.width - $slide.width()) / 2) + "px" :
					0,
				"margin-top": opts.height ?
					((opts.height - $slide.height()) / 2) + "px" :
					0
			});
		});
	}

	if (opts.center && !opts.fit && !opts.slideResize) {
		$slides.each(function(){
			var $slide = $(this);
			$slide.css({
				"margin-left": opts.width ? ((opts.width - $slide.width()) / 2) + "px" : 0,
				"margin-top": opts.height ? ((opts.height - $slide.height()) / 2) + "px" : 0
			});
		});
	}
		
	// stretch container
	var reshape = (opts.containerResize || opts.containerResizeHeight) && $cont.innerHeight() < 1;
	if (reshape) { // do this only if container has no size http://tinyurl.com/da2oa9
		var maxw = 0, maxh = 0;
		for(var j=0; j < els.length; j++) {
			var $e = $(els[j]), e = $e[0], w = $e.outerWidth(), h = $e.outerHeight();
			if (!w) w = e.offsetWidth || e.width || $e.attr('width');
			if (!h) h = e.offsetHeight || e.height || $e.attr('height');
			maxw = w > maxw ? w : maxw;
			maxh = h > maxh ? h : maxh;
		}
		if (opts.containerResize && maxw > 0 && maxh > 0)
			$cont.css({width:maxw+'px',height:maxh+'px'});
		if (opts.containerResizeHeight && maxh > 0)
			$cont.css({height:maxh+'px'});
	}

	var pauseFlag = false;  // https://github.com/malsup/cycle/issues/44
	if (opts.pause)
		$cont.bind('mouseenter.cycle', function(){
			pauseFlag = true;
			this.cyclePause++;
			triggerPause(cont, true);
		}).bind('mouseleave.cycle', function(){
				if (pauseFlag)
					this.cyclePause--;
				triggerPause(cont, true);
		});

	if (supportMultiTransitions(opts) === false)
		return false;

	// apparently a lot of people use image slideshows without height/width attributes on the images.
	// Cycle 2.50+ requires the sizing info for every slide; this block tries to deal with that.
	var requeue = false;
	options.requeueAttempts = options.requeueAttempts || 0;
	$slides.each(function() {
		// try to get height/width of each slide
		var $el = $(this);
		this.cycleH = (opts.fit && opts.height) ? opts.height : ($el.height() || this.offsetHeight || this.height || $el.attr('height') || 0);
		this.cycleW = (opts.fit && opts.width) ? opts.width : ($el.width() || this.offsetWidth || this.width || $el.attr('width') || 0);

		if ( $el.is('img') ) {
			var loading = (this.cycleH === 0 && this.cycleW === 0 && !this.complete);
			// don't requeue for images that are still loading but have a valid size
			if (loading) {
				if (o.s && opts.requeueOnImageNotLoaded && ++options.requeueAttempts < 100) { // track retry count so we don't loop forever
					log(options.requeueAttempts,' - img slide not loaded, requeuing slideshow: ', this.src, this.cycleW, this.cycleH);
					setTimeout(function() {$(o.s,o.c).cycle(options);}, opts.requeueTimeout);
					requeue = true;
					return false; // break each loop
				}
				else {
					log('could not determine size of image: '+this.src, this.cycleW, this.cycleH);
				}
			}
		}
		return true;
	});

	if (requeue)
		return false;

	opts.cssBefore = opts.cssBefore || {};
	opts.cssAfter = opts.cssAfter || {};
	opts.cssFirst = opts.cssFirst || {};
	opts.animIn = opts.animIn || {};
	opts.animOut = opts.animOut || {};

	$slides.not(':eq('+first+')').css(opts.cssBefore);
	$($slides[first]).css(opts.cssFirst);

	if (opts.timeout) {
		opts.timeout = parseInt(opts.timeout,10);
		// ensure that timeout and speed settings are sane
		if (opts.speed.constructor == String)
			opts.speed = $.fx.speeds[opts.speed] || parseInt(opts.speed,10);
		if (!opts.sync)
			opts.speed = opts.speed / 2;
		
		var buffer = opts.fx == 'none' ? 0 : opts.fx == 'shuffle' ? 500 : 250;
		while((opts.timeout - opts.speed) < buffer) // sanitize timeout
			opts.timeout += opts.speed;
	}
	if (opts.easing)
		opts.easeIn = opts.easeOut = opts.easing;
	if (!opts.speedIn)
		opts.speedIn = opts.speed;
	if (!opts.speedOut)
		opts.speedOut = opts.speed;

	opts.slideCount = els.length;
	opts.currSlide = opts.lastSlide = first;
	if (opts.random) {
		if (++opts.randomIndex == els.length)
			opts.randomIndex = 0;
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else if (opts.backwards)
		opts.nextSlide = opts.startingSlide === 0 ? (els.length-1) : opts.startingSlide-1;
	else
		opts.nextSlide = opts.startingSlide >= (els.length-1) ? 0 : opts.startingSlide+1;

	// run transition init fn
	if (!opts.multiFx) {
		var init = $.fn.cycle.transitions[opts.fx];
		if ($.isFunction(init))
			init($cont, $slides, opts);
		else if (opts.fx != 'custom' && !opts.multiFx) {
			log('unknown transition: ' + opts.fx,'; slideshow terminating');
			return false;
		}
	}

	// fire artificial events
	var e0 = $slides[first];
	if (!opts.skipInitializationCallbacks) {
		if (opts.before.length)
			opts.before[0].apply(e0, [e0, e0, opts, true]);
		if (opts.after.length)
			opts.after[0].apply(e0, [e0, e0, opts, true]);
	}
	if (opts.next)
		$(opts.next).bind(opts.prevNextEvent,function(){return advance(opts,1);});
	if (opts.prev)
		$(opts.prev).bind(opts.prevNextEvent,function(){return advance(opts,0);});
	if (opts.pager || opts.pagerAnchorBuilder)
		buildPager(els,opts);

	exposeAddSlide(opts, els);

	return opts;
}

// save off original opts so we can restore after clearing state
function saveOriginalOpts(opts) {
	opts.original = { before: [], after: [] };
	opts.original.cssBefore = $.extend({}, opts.cssBefore);
	opts.original.cssAfter  = $.extend({}, opts.cssAfter);
	opts.original.animIn	= $.extend({}, opts.animIn);
	opts.original.animOut   = $.extend({}, opts.animOut);
	$.each(opts.before, function() { opts.original.before.push(this); });
	$.each(opts.after,  function() { opts.original.after.push(this); });
}

function supportMultiTransitions(opts) {
	var i, tx, txs = $.fn.cycle.transitions;
	// look for multiple effects
	if (opts.fx.indexOf(',') > 0) {
		opts.multiFx = true;
		opts.fxs = opts.fx.replace(/\s*/g,'').split(',');
		// discard any bogus effect names
		for (i=0; i < opts.fxs.length; i++) {
			var fx = opts.fxs[i];
			tx = txs[fx];
			if (!tx || !txs.hasOwnProperty(fx) || !$.isFunction(tx)) {
				log('discarding unknown transition: ',fx);
				opts.fxs.splice(i,1);
				i--;
			}
		}
		// if we have an empty list then we threw everything away!
		if (!opts.fxs.length) {
			log('No valid transitions named; slideshow terminating.');
			return false;
		}
	}
	else if (opts.fx == 'all') {  // auto-gen the list of transitions
		opts.multiFx = true;
		opts.fxs = [];
		for (var p in txs) {
			if (txs.hasOwnProperty(p)) {
				tx = txs[p];
				if (txs.hasOwnProperty(p) && $.isFunction(tx))
					opts.fxs.push(p);
			}
		}
	}
	if (opts.multiFx && opts.randomizeEffects) {
		// munge the fxs array to make effect selection random
		var r1 = Math.floor(Math.random() * 20) + 30;
		for (i = 0; i < r1; i++) {
			var r2 = Math.floor(Math.random() * opts.fxs.length);
			opts.fxs.push(opts.fxs.splice(r2,1)[0]);
		}
		debug('randomized fx sequence: ',opts.fxs);
	}
	return true;
}

// provide a mechanism for adding slides after the slideshow has started
function exposeAddSlide(opts, els) {
	opts.addSlide = function(newSlide, prepend) {
		var $s = $(newSlide), s = $s[0];
		if (!opts.autostopCount)
			opts.countdown++;
		els[prepend?'unshift':'push'](s);
		if (opts.els)
			opts.els[prepend?'unshift':'push'](s); // shuffle needs this
		opts.slideCount = els.length;

		// add the slide to the random map and resort
		if (opts.random) {
			opts.randomMap.push(opts.slideCount-1);
			opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
		}

		$s.css('position','absolute');
		$s[prepend?'prependTo':'appendTo'](opts.$cont);

		if (prepend) {
			opts.currSlide++;
			opts.nextSlide++;
		}

		if (!$.support.opacity && opts.cleartype && !opts.cleartypeNoBg)
			clearTypeFix($s);

		if (opts.fit && opts.width)
			$s.width(opts.width);
		if (opts.fit && opts.height && opts.height != 'auto')
			$s.height(opts.height);
		s.cycleH = (opts.fit && opts.height) ? opts.height : $s.height();
		s.cycleW = (opts.fit && opts.width) ? opts.width : $s.width();

		$s.css(opts.cssBefore);

		if (opts.pager || opts.pagerAnchorBuilder)
			$.fn.cycle.createPagerAnchor(els.length-1, s, $(opts.pager), els, opts);

		if ($.isFunction(opts.onAddSlide))
			opts.onAddSlide($s);
		else
			$s.hide(); // default behavior
	};
}

// reset internal state; we do this on every pass in order to support multiple effects
$.fn.cycle.resetState = function(opts, fx) {
	fx = fx || opts.fx;
	opts.before = []; opts.after = [];
	opts.cssBefore = $.extend({}, opts.original.cssBefore);
	opts.cssAfter  = $.extend({}, opts.original.cssAfter);
	opts.animIn	= $.extend({}, opts.original.animIn);
	opts.animOut   = $.extend({}, opts.original.animOut);
	opts.fxFn = null;
	$.each(opts.original.before, function() { opts.before.push(this); });
	$.each(opts.original.after,  function() { opts.after.push(this); });

	// re-init
	var init = $.fn.cycle.transitions[fx];
	if ($.isFunction(init))
		init(opts.$cont, $(opts.elements), opts);
};

// this is the main engine fn, it handles the timeouts, callbacks and slide index mgmt
function go(els, opts, manual, fwd) {
	var p = opts.$cont[0], curr = els[opts.currSlide], next = els[opts.nextSlide];

	// opts.busy is true if we're in the middle of an animation
	if (manual && opts.busy && opts.manualTrump) {
		// let manual transitions requests trump active ones
		debug('manualTrump in go(), stopping active transition');
		$(els).stop(true,true);
		opts.busy = 0;
		clearTimeout(p.cycleTimeout);
	}

	// don't begin another timeout-based transition if there is one active
	if (opts.busy) {
		debug('transition active, ignoring new tx request');
		return;
	}


	// stop cycling if we have an outstanding stop request
	if (p.cycleStop != opts.stopCount || p.cycleTimeout === 0 && !manual)
		return;

	// check to see if we should stop cycling based on autostop options
	if (!manual && !p.cyclePause && !opts.bounce &&
		((opts.autostop && (--opts.countdown <= 0)) ||
		(opts.nowrap && !opts.random && opts.nextSlide < opts.currSlide))) {
		if (opts.end)
			opts.end(opts);
		return;
	}

	// if slideshow is paused, only transition on a manual trigger
	var changed = false;
	if ((manual || !p.cyclePause) && (opts.nextSlide != opts.currSlide)) {
		changed = true;
		var fx = opts.fx;
		// keep trying to get the slide size if we don't have it yet
		curr.cycleH = curr.cycleH || $(curr).height();
		curr.cycleW = curr.cycleW || $(curr).width();
		next.cycleH = next.cycleH || $(next).height();
		next.cycleW = next.cycleW || $(next).width();

		// support multiple transition types
		if (opts.multiFx) {
			if (fwd && (opts.lastFx === undefined || ++opts.lastFx >= opts.fxs.length))
				opts.lastFx = 0;
			else if (!fwd && (opts.lastFx === undefined || --opts.lastFx < 0))
				opts.lastFx = opts.fxs.length - 1;
			fx = opts.fxs[opts.lastFx];
		}

		// one-time fx overrides apply to:  $('div').cycle(3,'zoom');
		if (opts.oneTimeFx) {
			fx = opts.oneTimeFx;
			opts.oneTimeFx = null;
		}

		$.fn.cycle.resetState(opts, fx);

		// run the before callbacks
		if (opts.before.length)
			$.each(opts.before, function(i,o) {
				if (p.cycleStop != opts.stopCount) return;
				o.apply(next, [curr, next, opts, fwd]);
			});

		// stage the after callacks
		var after = function() {
			opts.busy = 0;
			$.each(opts.after, function(i,o) {
				if (p.cycleStop != opts.stopCount) return;
				o.apply(next, [curr, next, opts, fwd]);
			});
			if (!p.cycleStop) {
				// queue next transition
				queueNext();
			}
		};

		debug('tx firing('+fx+'); currSlide: ' + opts.currSlide + '; nextSlide: ' + opts.nextSlide);
		
		// get ready to perform the transition
		opts.busy = 1;
		if (opts.fxFn) // fx function provided?
			opts.fxFn(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
		else if ($.isFunction($.fn.cycle[opts.fx])) // fx plugin ?
			$.fn.cycle[opts.fx](curr, next, opts, after, fwd, manual && opts.fastOnEvent);
		else
			$.fn.cycle.custom(curr, next, opts, after, fwd, manual && opts.fastOnEvent);
	}
	else {
		queueNext();
	}

	if (changed || opts.nextSlide == opts.currSlide) {
		// calculate the next slide
		var roll;
		opts.lastSlide = opts.currSlide;
		if (opts.random) {
			opts.currSlide = opts.nextSlide;
			if (++opts.randomIndex == els.length) {
				opts.randomIndex = 0;
				opts.randomMap.sort(function(a,b) {return Math.random() - 0.5;});
			}
			opts.nextSlide = opts.randomMap[opts.randomIndex];
			if (opts.nextSlide == opts.currSlide)
				opts.nextSlide = (opts.currSlide == opts.slideCount - 1) ? 0 : opts.currSlide + 1;
		}
		else if (opts.backwards) {
			roll = (opts.nextSlide - 1) < 0;
			if (roll && opts.bounce) {
				opts.backwards = !opts.backwards;
				opts.nextSlide = 1;
				opts.currSlide = 0;
			}
			else {
				opts.nextSlide = roll ? (els.length-1) : opts.nextSlide-1;
				opts.currSlide = roll ? 0 : opts.nextSlide+1;
			}
		}
		else { // sequence
			roll = (opts.nextSlide + 1) == els.length;
			if (roll && opts.bounce) {
				opts.backwards = !opts.backwards;
				opts.nextSlide = els.length-2;
				opts.currSlide = els.length-1;
			}
			else {
				opts.nextSlide = roll ? 0 : opts.nextSlide+1;
				opts.currSlide = roll ? els.length-1 : opts.nextSlide-1;
			}
		}
	}
	if (changed && opts.pager)
		opts.updateActivePagerLink(opts.pager, opts.currSlide, opts.activePagerClass);
	
	function queueNext() {
		// stage the next transition
		var ms = 0, timeout = opts.timeout;
		if (opts.timeout && !opts.continuous) {
			ms = getTimeout(els[opts.currSlide], els[opts.nextSlide], opts, fwd);
         if (opts.fx == 'shuffle')
            ms -= opts.speedOut;
      }
		else if (opts.continuous && p.cyclePause) // continuous shows work off an after callback, not this timer logic
			ms = 10;
		if (ms > 0)
			p.cycleTimeout = setTimeout(function(){ go(els, opts, 0, !opts.backwards); }, ms);
	}
}

// invoked after transition
$.fn.cycle.updateActivePagerLink = function(pager, currSlide, clsName) {
   $(pager).each(function() {
       $(this).children().removeClass(clsName).eq(currSlide).addClass(clsName);
   });
};

// calculate timeout value for current transition
function getTimeout(curr, next, opts, fwd) {
	if (opts.timeoutFn) {
		// call user provided calc fn
		var t = opts.timeoutFn.call(curr,curr,next,opts,fwd);
		while (opts.fx != 'none' && (t - opts.speed) < 250) // sanitize timeout
			t += opts.speed;
		debug('calculated timeout: ' + t + '; speed: ' + opts.speed);
		if (t !== false)
			return t;
	}
	return opts.timeout;
}

// expose next/prev function, caller must pass in state
$.fn.cycle.next = function(opts) { advance(opts,1); };
$.fn.cycle.prev = function(opts) { advance(opts,0);};

// advance slide forward or back
function advance(opts, moveForward) {
	var val = moveForward ? 1 : -1;
	var els = opts.elements;
	var p = opts.$cont[0], timeout = p.cycleTimeout;
	if (timeout) {
		clearTimeout(timeout);
		p.cycleTimeout = 0;
	}
	if (opts.random && val < 0) {
		// move back to the previously display slide
		opts.randomIndex--;
		if (--opts.randomIndex == -2)
			opts.randomIndex = els.length-2;
		else if (opts.randomIndex == -1)
			opts.randomIndex = els.length-1;
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else if (opts.random) {
		opts.nextSlide = opts.randomMap[opts.randomIndex];
	}
	else {
		opts.nextSlide = opts.currSlide + val;
		if (opts.nextSlide < 0) {
			if (opts.nowrap) return false;
			opts.nextSlide = els.length - 1;
		}
		else if (opts.nextSlide >= els.length) {
			if (opts.nowrap) return false;
			opts.nextSlide = 0;
		}
	}

	var cb = opts.onPrevNextEvent || opts.prevNextClick; // prevNextClick is deprecated
	if ($.isFunction(cb))
		cb(val > 0, opts.nextSlide, els[opts.nextSlide]);
	go(els, opts, 1, moveForward);
	return false;
}

function buildPager(els, opts) {
	var $p = $(opts.pager);
	$.each(els, function(i,o) {
		$.fn.cycle.createPagerAnchor(i,o,$p,els,opts);
	});
	opts.updateActivePagerLink(opts.pager, opts.startingSlide, opts.activePagerClass);
}

$.fn.cycle.createPagerAnchor = function(i, el, $p, els, opts) {
	var a;
	if ($.isFunction(opts.pagerAnchorBuilder)) {
		a = opts.pagerAnchorBuilder(i,el);
		debug('pagerAnchorBuilder('+i+', el) returned: ' + a);
	}
	else
		a = '<a href="#">'+(i+1)+'</a>';
		
	if (!a)
		return;
	var $a = $(a);
	// don't reparent if anchor is in the dom
	if ($a.parents('body').length === 0) {
		var arr = [];
		if ($p.length > 1) {
			$p.each(function() {
				var $clone = $a.clone(true);
				$(this).append($clone);
				arr.push($clone[0]);
			});
			$a = $(arr);
		}
		else {
			$a.appendTo($p);
		}
	}

	opts.pagerAnchors =  opts.pagerAnchors || [];
	opts.pagerAnchors.push($a);
	
	var pagerFn = function(e) {
		e.preventDefault();
		opts.nextSlide = i;
		var p = opts.$cont[0], timeout = p.cycleTimeout;
		if (timeout) {
			clearTimeout(timeout);
			p.cycleTimeout = 0;
		}
		var cb = opts.onPagerEvent || opts.pagerClick; // pagerClick is deprecated
		if ($.isFunction(cb))
			cb(opts.nextSlide, els[opts.nextSlide]);
		go(els,opts,1,opts.currSlide < i); // trigger the trans
//		return false; // <== allow bubble
	};
	
	if ( /mouseenter|mouseover/i.test(opts.pagerEvent) ) {
		$a.hover(pagerFn, function(){/* no-op */} );
	}
	else {
		$a.bind(opts.pagerEvent, pagerFn);
	}
	
	if ( ! /^click/.test(opts.pagerEvent) && !opts.allowPagerClickBubble)
		$a.bind('click.cycle', function(){return false;}); // suppress click
	
	var cont = opts.$cont[0];
	var pauseFlag = false; // https://github.com/malsup/cycle/issues/44
	if (opts.pauseOnPagerHover) {
		$a.hover(
			function() { 
				pauseFlag = true;
				cont.cyclePause++; 
				triggerPause(cont,true,true);
			}, function() { 
				if (pauseFlag)
					cont.cyclePause--; 
				triggerPause(cont,true,true);
			} 
		);
	}
};

// helper fn to calculate the number of slides between the current and the next
$.fn.cycle.hopsFromLast = function(opts, fwd) {
	var hops, l = opts.lastSlide, c = opts.currSlide;
	if (fwd)
		hops = c > l ? c - l : opts.slideCount - l;
	else
		hops = c < l ? l - c : l + opts.slideCount - c;
	return hops;
};

// fix clearType problems in ie6 by setting an explicit bg color
// (otherwise text slides look horrible during a fade transition)
function clearTypeFix($slides) {
	debug('applying clearType background-color hack');
	function hex(s) {
		s = parseInt(s,10).toString(16);
		return s.length < 2 ? '0'+s : s;
	}
	function getBg(e) {
		for ( ; e && e.nodeName.toLowerCase() != 'html'; e = e.parentNode) {
			var v = $.css(e,'background-color');
			if (v && v.indexOf('rgb') >= 0 ) {
				var rgb = v.match(/\d+/g);
				return '#'+ hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
			}
			if (v && v != 'transparent')
				return v;
		}
		return '#ffffff';
	}
	$slides.each(function() { $(this).css('background-color', getBg(this)); });
}

// reset common props before the next transition
$.fn.cycle.commonReset = function(curr,next,opts,w,h,rev) {
	$(opts.elements).not(curr).hide();
	if (typeof opts.cssBefore.opacity == 'undefined')
		opts.cssBefore.opacity = 1;
	opts.cssBefore.display = 'block';
	if (opts.slideResize && w !== false && next.cycleW > 0)
		opts.cssBefore.width = next.cycleW;
	if (opts.slideResize && h !== false && next.cycleH > 0)
		opts.cssBefore.height = next.cycleH;
	opts.cssAfter = opts.cssAfter || {};
	opts.cssAfter.display = 'none';
	$(curr).css('zIndex',opts.slideCount + (rev === true ? 1 : 0));
	$(next).css('zIndex',opts.slideCount + (rev === true ? 0 : 1));
};

// the actual fn for effecting a transition
$.fn.cycle.custom = function(curr, next, opts, cb, fwd, speedOverride) {
	var $l = $(curr), $n = $(next);
	var speedIn = opts.speedIn, speedOut = opts.speedOut, easeIn = opts.easeIn, easeOut = opts.easeOut, animInDelay = opts.animInDelay, animOutDelay = opts.animOutDelay;
	$n.css(opts.cssBefore);
	if (speedOverride) {
		if (typeof speedOverride == 'number')
			speedIn = speedOut = speedOverride;
		else
			speedIn = speedOut = 1;
		easeIn = easeOut = null;
	}
	var fn = function() {
		$n.delay(animInDelay).animate(opts.animIn, speedIn, easeIn, function() {
			cb();
		});
	};
	$l.delay(animOutDelay).animate(opts.animOut, speedOut, easeOut, function() {
		$l.css(opts.cssAfter);
		if (!opts.sync) 
			fn();
	});
	if (opts.sync) fn();
};

// transition definitions - only fade is defined here, transition pack defines the rest
$.fn.cycle.transitions = {
	fade: function($cont, $slides, opts) {
		$slides.not(':eq('+opts.currSlide+')').css('opacity',0);
		opts.before.push(function(curr,next,opts) {
			$.fn.cycle.commonReset(curr,next,opts);
			opts.cssBefore.opacity = 0;
		});
		opts.animIn	   = { opacity: 1 };
		opts.animOut   = { opacity: 0 };
		opts.cssBefore = { top: 0, left: 0 };
	}
};

$.fn.cycle.ver = function() { return ver; };

// override these globally if you like (they are all optional)
$.fn.cycle.defaults = {
    activePagerClass: 'activeSlide', // class name used for the active pager link
    after:            null,     // transition callback (scope set to element that was shown):  function(currSlideElement, nextSlideElement, options, forwardFlag)
    allowPagerClickBubble: false, // allows or prevents click event on pager anchors from bubbling
    animIn:           null,     // properties that define how the slide animates in
    animInDelay:      0,        // allows delay before next slide transitions in	
    animOut:          null,     // properties that define how the slide animates out
    animOutDelay:     0,        // allows delay before current slide transitions out
    aspect:           false,    // preserve aspect ratio during fit resizing, cropping if necessary (must be used with fit option)
    autostop:         0,        // true to end slideshow after X transitions (where X == slide count)
    autostopCount:    0,        // number of transitions (optionally used with autostop to define X)
    backwards:        false,    // true to start slideshow at last slide and move backwards through the stack
    before:           null,     // transition callback (scope set to element to be shown):     function(currSlideElement, nextSlideElement, options, forwardFlag)
    center:           null,     // set to true to have cycle add top/left margin to each slide (use with width and height options)
    cleartype:        !$.support.opacity,  // true if clearType corrections should be applied (for IE)
    cleartypeNoBg:    false,    // set to true to disable extra cleartype fixing (leave false to force background color setting on slides)
    containerResize:  1,        // resize container to fit largest slide
    containerResizeHeight:  0,  // resize containers height to fit the largest slide but leave the width dynamic
    continuous:       0,        // true to start next transition immediately after current one completes
    cssAfter:         null,     // properties that defined the state of the slide after transitioning out
    cssBefore:        null,     // properties that define the initial state of the slide before transitioning in
    delay:            0,        // additional delay (in ms) for first transition (hint: can be negative)
    easeIn:           null,     // easing for "in" transition
    easeOut:          null,     // easing for "out" transition
    easing:           null,     // easing method for both in and out transitions
    end:              null,     // callback invoked when the slideshow terminates (use with autostop or nowrap options): function(options)
    fastOnEvent:      0,        // force fast transitions when triggered manually (via pager or prev/next); value == time in ms
    fit:              0,        // force slides to fit container
    fx:               'fade',   // name of transition effect (or comma separated names, ex: 'fade,scrollUp,shuffle')
    fxFn:             null,     // function used to control the transition: function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag)
    height:           'auto',   // container height (if the 'fit' option is true, the slides will be set to this height as well)
    manualTrump:      true,     // causes manual transition to stop an active transition instead of being ignored
    metaAttr:         'cycle',  // data- attribute that holds the option data for the slideshow
    next:             null,     // element, jQuery object, or jQuery selector string for the element to use as event trigger for next slide
    nowrap:           0,        // true to prevent slideshow from wrapping
    onPagerEvent:     null,     // callback fn for pager events: function(zeroBasedSlideIndex, slideElement)
    onPrevNextEvent:  null,     // callback fn for prev/next events: function(isNext, zeroBasedSlideIndex, slideElement)
    pager:            null,     // element, jQuery object, or jQuery selector string for the element to use as pager container
    pagerAnchorBuilder: null,   // callback fn for building anchor links:  function(index, DOMelement)
    pagerEvent:       'click.cycle', // name of event which drives the pager navigation
    pause:            0,        // true to enable "pause on hover"
    pauseOnPagerHover: 0,       // true to pause when hovering over pager link
    prev:             null,     // element, jQuery object, or jQuery selector string for the element to use as event trigger for previous slide
    prevNextEvent:    'click.cycle',// event which drives the manual transition to the previous or next slide
    random:           0,        // true for random, false for sequence (not applicable to shuffle fx)
    randomizeEffects: 1,        // valid when multiple effects are used; true to make the effect sequence random
    requeueOnImageNotLoaded: true, // requeue the slideshow if any image slides are not yet loaded
    requeueTimeout:   250,      // ms delay for requeue
    rev:              0,        // causes animations to transition in reverse (for effects that support it such as scrollHorz/scrollVert/shuffle)
    shuffle:          null,     // coords for shuffle animation, ex: { top:15, left: 200 }
    skipInitializationCallbacks: false, // set to true to disable the first before/after callback that occurs prior to any transition
    slideExpr:        null,     // expression for selecting slides (if something other than all children is required)
    slideResize:      1,        // force slide width/height to fixed size before every transition
    speed:            1000,     // speed of the transition (any valid fx speed value)
    speedIn:          null,     // speed of the 'in' transition
    speedOut:         null,     // speed of the 'out' transition
    startingSlide:    undefined,// zero-based index of the first slide to be displayed
    sync:             1,        // true if in/out transitions should occur simultaneously
    timeout:          4000,     // milliseconds between slide transitions (0 to disable auto advance)
    timeoutFn:        null,     // callback for determining per-slide timeout value:  function(currSlideElement, nextSlideElement, options, forwardFlag)
    updateActivePagerLink: null,// callback fn invoked to update the active pager link (adds/removes activePagerClass style)
    width:            null      // container width (if the 'fit' option is true, the slides will be set to this width as well)
};

})(jQuery);


/*!
 * jQuery Cycle Plugin Transition Definitions
 * This script is a plugin for the jQuery Cycle Plugin
 * Examples and documentation at: http://malsup.com/jquery/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version:	 2.73
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($) {
"use strict";

//
// These functions define slide initialization and properties for the named
// transitions. To save file size feel free to remove any of these that you
// don't need.
//
$.fn.cycle.transitions.none = function($cont, $slides, opts) {
	opts.fxFn = function(curr,next,opts,after){
		$(next).show();
		$(curr).hide();
		after();
	};
};

// not a cross-fade, fadeout only fades out the top slide
$.fn.cycle.transitions.fadeout = function($cont, $slides, opts) {
	$slides.not(':eq('+opts.currSlide+')').css({ display: 'block', 'opacity': 1 });
	opts.before.push(function(curr,next,opts,w,h,rev) {
		$(curr).css('zIndex',opts.slideCount + (rev !== true ? 1 : 0));
		$(next).css('zIndex',opts.slideCount + (rev !== true ? 0 : 1));
	});
	opts.animIn.opacity = 1;
	opts.animOut.opacity = 0;
	opts.cssBefore.opacity = 1;
	opts.cssBefore.display = 'block';
	opts.cssAfter.zIndex = 0;
};

// scrollUp/Down/Left/Right
$.fn.cycle.transitions.scrollUp = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var h = $cont.height();
	opts.cssBefore.top = h;
	opts.cssBefore.left = 0;
	opts.cssFirst.top = 0;
	opts.animIn.top = 0;
	opts.animOut.top = -h;
};
$.fn.cycle.transitions.scrollDown = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var h = $cont.height();
	opts.cssFirst.top = 0;
	opts.cssBefore.top = -h;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.top = h;
};
$.fn.cycle.transitions.scrollLeft = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var w = $cont.width();
	opts.cssFirst.left = 0;
	opts.cssBefore.left = w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = 0-w;
};
$.fn.cycle.transitions.scrollRight = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push($.fn.cycle.commonReset);
	var w = $cont.width();
	opts.cssFirst.left = 0;
	opts.cssBefore.left = -w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = w;
};
$.fn.cycle.transitions.scrollHorz = function($cont, $slides, opts) {
	$cont.css('overflow','hidden').width();
	opts.before.push(function(curr, next, opts, fwd) {
		if (opts.rev)
			fwd = !fwd;
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssBefore.left = fwd ? (next.cycleW-1) : (1-next.cycleW);
		opts.animOut.left = fwd ? -curr.cycleW : curr.cycleW;
	});
	opts.cssFirst.left = 0;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.top = 0;
};
$.fn.cycle.transitions.scrollVert = function($cont, $slides, opts) {
	$cont.css('overflow','hidden');
	opts.before.push(function(curr, next, opts, fwd) {
		if (opts.rev)
			fwd = !fwd;
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssBefore.top = fwd ? (1-next.cycleH) : (next.cycleH-1);
		opts.animOut.top = fwd ? curr.cycleH : -curr.cycleH;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.left = 0;
};

// slideX/slideY
$.fn.cycle.transitions.slideX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$(opts.elements).not(curr).hide();
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.animIn.width = next.cycleW;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
	opts.animIn.width = 'show';
	opts.animOut.width = 0;
};
$.fn.cycle.transitions.slideY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$(opts.elements).not(curr).hide();
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.animIn.height = next.cycleH;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.height = 0;
	opts.animIn.height = 'show';
	opts.animOut.height = 0;
};

// shuffle
$.fn.cycle.transitions.shuffle = function($cont, $slides, opts) {
	var i, w = $cont.css('overflow', 'visible').width();
	$slides.css({left: 0, top: 0});
	opts.before.push(function(curr,next,opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
	});
	// only adjust speed once!
	if (!opts.speedAdjusted) {
		opts.speed = opts.speed / 2; // shuffle has 2 transitions
		opts.speedAdjusted = true;
	}
	opts.random = 0;
	opts.shuffle = opts.shuffle || {left:-w, top:15};
	opts.els = [];
	for (i=0; i < $slides.length; i++)
		opts.els.push($slides[i]);

	for (i=0; i < opts.currSlide; i++)
		opts.els.push(opts.els.shift());

	// custom transition fn (hat tip to Benjamin Sterling for this bit of sweetness!)
	opts.fxFn = function(curr, next, opts, cb, fwd) {
		if (opts.rev)
			fwd = !fwd;
		var $el = fwd ? $(curr) : $(next);
		$(next).css(opts.cssBefore);
		var count = opts.slideCount;
		$el.animate(opts.shuffle, opts.speedIn, opts.easeIn, function() {
			var hops = $.fn.cycle.hopsFromLast(opts, fwd);
			for (var k=0; k < hops; k++) {
				if (fwd)
					opts.els.push(opts.els.shift());
				else
					opts.els.unshift(opts.els.pop());
			}
			if (fwd) {
				for (var i=0, len=opts.els.length; i < len; i++)
					$(opts.els[i]).css('z-index', len-i+count);
			}
			else {
				var z = $(curr).css('z-index');
				$el.css('z-index', parseInt(z,10)+1+count);
			}
			$el.animate({left:0, top:0}, opts.speedOut, opts.easeOut, function() {
				$(fwd ? this : curr).hide();
				if (cb) cb();
			});
		});
	};
	$.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
};

// turnUp/Down/Left/Right
$.fn.cycle.transitions.turnUp = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.cssBefore.top = next.cycleH;
		opts.animIn.height = next.cycleH;
		opts.animOut.width = next.cycleW;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.cssBefore.height = 0;
	opts.animIn.top = 0;
	opts.animOut.height = 0;
};
$.fn.cycle.transitions.turnDown = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssFirst.top = 0;
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.height = 0;
	opts.animOut.height = 0;
};
$.fn.cycle.transitions.turnLeft = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.cssBefore.left = next.cycleW;
		opts.animIn.width = next.cycleW;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
	opts.animIn.left = 0;
	opts.animOut.width = 0;
};
$.fn.cycle.transitions.turnRight = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.animIn.width = next.cycleW;
		opts.animOut.left = curr.cycleW;
	});
	$.extend(opts.cssBefore, { top: 0, left: 0, width: 0 });
	opts.animIn.left = 0;
	opts.animOut.width = 0;
};

// zoom
$.fn.cycle.transitions.zoom = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,false,true);
		opts.cssBefore.top = next.cycleH/2;
		opts.cssBefore.left = next.cycleW/2;
		$.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
		$.extend(opts.animOut, { width: 0, height: 0, top: curr.cycleH/2, left: curr.cycleW/2 });
	});
	opts.cssFirst.top = 0;
	opts.cssFirst.left = 0;
	opts.cssBefore.width = 0;
	opts.cssBefore.height = 0;
};

// fadeZoom
$.fn.cycle.transitions.fadeZoom = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,false);
		opts.cssBefore.left = next.cycleW/2;
		opts.cssBefore.top = next.cycleH/2;
		$.extend(opts.animIn, { top: 0, left: 0, width: next.cycleW, height: next.cycleH });
	});
	opts.cssBefore.width = 0;
	opts.cssBefore.height = 0;
	opts.animOut.opacity = 0;
};

// blindX
$.fn.cycle.transitions.blindX = function($cont, $slides, opts) {
	var w = $cont.css('overflow','hidden').width();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.width = next.cycleW;
		opts.animOut.left   = curr.cycleW;
	});
	opts.cssBefore.left = w;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
	opts.animOut.left = w;
};
// blindY
$.fn.cycle.transitions.blindY = function($cont, $slides, opts) {
	var h = $cont.css('overflow','hidden').height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssBefore.top = h;
	opts.cssBefore.left = 0;
	opts.animIn.top = 0;
	opts.animOut.top = h;
};
// blindZ
$.fn.cycle.transitions.blindZ = function($cont, $slides, opts) {
	var h = $cont.css('overflow','hidden').height();
	var w = $cont.width();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.animIn.height = next.cycleH;
		opts.animOut.top   = curr.cycleH;
	});
	opts.cssBefore.top = h;
	opts.cssBefore.left = w;
	opts.animIn.top = 0;
	opts.animIn.left = 0;
	opts.animOut.top = h;
	opts.animOut.left = w;
};

// growX - grow horizontally from centered 0 width
$.fn.cycle.transitions.growX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true);
		opts.cssBefore.left = this.cycleW/2;
		opts.animIn.left = 0;
		opts.animIn.width = this.cycleW;
		opts.animOut.left = 0;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
};
// growY - grow vertically from centered 0 height
$.fn.cycle.transitions.growY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false);
		opts.cssBefore.top = this.cycleH/2;
		opts.animIn.top = 0;
		opts.animIn.height = this.cycleH;
		opts.animOut.top = 0;
	});
	opts.cssBefore.height = 0;
	opts.cssBefore.left = 0;
};

// curtainX - squeeze in both edges horizontally
$.fn.cycle.transitions.curtainX = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,false,true,true);
		opts.cssBefore.left = next.cycleW/2;
		opts.animIn.left = 0;
		opts.animIn.width = this.cycleW;
		opts.animOut.left = curr.cycleW/2;
		opts.animOut.width = 0;
	});
	opts.cssBefore.top = 0;
	opts.cssBefore.width = 0;
};
// curtainY - squeeze in both edges vertically
$.fn.cycle.transitions.curtainY = function($cont, $slides, opts) {
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,false,true);
		opts.cssBefore.top = next.cycleH/2;
		opts.animIn.top = 0;
		opts.animIn.height = next.cycleH;
		opts.animOut.top = curr.cycleH/2;
		opts.animOut.height = 0;
	});
	opts.cssBefore.height = 0;
	opts.cssBefore.left = 0;
};

// cover - curr slide covered by next slide
$.fn.cycle.transitions.cover = function($cont, $slides, opts) {
	var d = opts.direction || 'left';
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts);
		opts.cssAfter.display = '';
		if (d == 'right')
			opts.cssBefore.left = -w;
		else if (d == 'up')
			opts.cssBefore.top = h;
		else if (d == 'down')
			opts.cssBefore.top = -h;
		else
			opts.cssBefore.left = w;
	});
	opts.animIn.left = 0;
	opts.animIn.top = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.left = 0;
};

// uncover - curr slide moves off next slide
$.fn.cycle.transitions.uncover = function($cont, $slides, opts) {
	var d = opts.direction || 'left';
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
		if (d == 'right')
			opts.animOut.left = w;
		else if (d == 'up')
			opts.animOut.top = -h;
		else if (d == 'down')
			opts.animOut.top = h;
		else
			opts.animOut.left = -w;
	});
	opts.animIn.left = 0;
	opts.animIn.top = 0;
	opts.cssBefore.top = 0;
	opts.cssBefore.left = 0;
};

// toss - move top slide and fade away
$.fn.cycle.transitions.toss = function($cont, $slides, opts) {
	var w = $cont.css('overflow','visible').width();
	var h = $cont.height();
	opts.before.push(function(curr, next, opts) {
		$.fn.cycle.commonReset(curr,next,opts,true,true,true);
		// provide default toss settings if animOut not provided
		if (!opts.animOut.left && !opts.animOut.top)
			$.extend(opts.animOut, { left: w*2, top: -h/2, opacity: 0 });
		else
			opts.animOut.opacity = 0;
	});
	opts.cssBefore.left = 0;
	opts.cssBefore.top = 0;
	opts.animIn.left = 0;
};

// wipe - clip animation
$.fn.cycle.transitions.wipe = function($cont, $slides, opts) {
	var w = $cont.css('overflow','hidden').width();
	var h = $cont.height();
	opts.cssBefore = opts.cssBefore || {};
	var clip;
	if (opts.clip) {
		if (/l2r/.test(opts.clip))
			clip = 'rect(0px 0px '+h+'px 0px)';
		else if (/r2l/.test(opts.clip))
			clip = 'rect(0px '+w+'px '+h+'px '+w+'px)';
		else if (/t2b/.test(opts.clip))
			clip = 'rect(0px '+w+'px 0px 0px)';
		else if (/b2t/.test(opts.clip))
			clip = 'rect('+h+'px '+w+'px '+h+'px 0px)';
		else if (/zoom/.test(opts.clip)) {
			var top = parseInt(h/2,10);
			var left = parseInt(w/2,10);
			clip = 'rect('+top+'px '+left+'px '+top+'px '+left+'px)';
		}
	}

	opts.cssBefore.clip = opts.cssBefore.clip || clip || 'rect(0px 0px 0px 0px)';

	var d = opts.cssBefore.clip.match(/(\d+)/g);
	var t = parseInt(d[0],10), r = parseInt(d[1],10), b = parseInt(d[2],10), l = parseInt(d[3],10);

	opts.before.push(function(curr, next, opts) {
		if (curr == next) return;
		var $curr = $(curr), $next = $(next);
		$.fn.cycle.commonReset(curr,next,opts,true,true,false);
		opts.cssAfter.display = 'block';

		var step = 1, count = parseInt((opts.speedIn / 13),10) - 1;
		(function f() {
			var tt = t ? t - parseInt(step * (t/count),10) : 0;
			var ll = l ? l - parseInt(step * (l/count),10) : 0;
			var bb = b < h ? b + parseInt(step * ((h-b)/count || 1),10) : h;
			var rr = r < w ? r + parseInt(step * ((w-r)/count || 1),10) : w;
			$next.css({ clip: 'rect('+tt+'px '+rr+'px '+bb+'px '+ll+'px)' });
			(step++ <= count) ? setTimeout(f, 13) : $curr.css('display', 'none');
		})();
	});
	$.extend(opts.cssBefore, { display: 'block', opacity: 1, top: 0, left: 0 });
	opts.animIn	   = { left: 0 };
	opts.animOut   = { left: 0 };
};

})(jQuery);
;

/**
 *  @file
 *  A simple jQuery Cycle Div Slideshow Rotator.
 */

/**
 * This will set our initial behavior, by starting up each individual slideshow.
 */
(function ($, Drupal, drupalSettings) {
    Drupal.behaviors.viewsSlideshowCycle = {
        attach: function (context) {
            $('.views_slideshow_cycle_main:not(.viewsSlideshowCycle-processed)', context).addClass('viewsSlideshowCycle-processed').each(function() {
                var fullId = '#' + $(this).attr('id');
                var settings = drupalSettings.viewsSlideshowCycle[fullId];
                settings.targetId = '#' + $(fullId + " :first").attr('id');

                settings.slideshowId = settings.targetId.replace('#views_slideshow_cycle_teaser_section_', '');
                // Pager after function.
                var pager_after_fn = function(curr, next, opts) {
                    // Need to do some special handling on first load.
                    var slideNum = opts.currSlide;
                    if (typeof settings.processedAfter == 'undefined' || !settings.processedAfter) {
                        settings.processedAfter = 1;
                        slideNum = (typeof settings.opts.startingSlide == 'undefined') ? 0 : settings.opts.startingSlide;
                    }
                    Drupal.viewsSlideshow.action({ "action": 'transitionEnd', "slideshowID": settings.slideshowId, "slideNum": slideNum });
                }
                // Pager before function.
                var pager_before_fn = function(curr, next, opts) {
                    var slideNum = opts.nextSlide;

                    // Remember last slide.
                    if (settings.remember_slide) {
                        createCookie(settings.vss_id, slideNum, settings.remember_slide_days);
                    }

                    // Make variable height.
                    if (!settings.fixed_height) {
                        //get the height of the current slide
                        var $ht = $(next).height();
                        //set the container's height to that of the current slide
                        $(next).parent().animate({height: $ht});
                    }

                    // Need to do some special handling on first load.
                    if (typeof settings.processedBefore == 'undefined' || !settings.processedBefore) {
                        settings.processedBefore = 1;
                        slideNum = (typeof opts.startingSlide == 'undefined') ? 0 : opts.startingSlide;
                    }

                    Drupal.viewsSlideshow.action({ "action": 'transitionBegin', "slideshowID": settings.slideshowId, "slideNum": slideNum });
                }
                settings.loaded = false;

                settings.opts = {
                    speed:settings.speed,
                    timeout:settings.timeout,
                    delay:settings.delay,
                    sync:settings.sync,
                    random:settings.random,
                    nowrap:settings.nowrap,
                    after:pager_after_fn,
                    before:pager_before_fn,
                    cleartype:(settings.cleartype)? true : false,
                    cleartypeNoBg:(settings.cleartypenobg)? true : false
                }

                // Set the starting slide if we are supposed to remember the slide
                if (settings.remember_slide) {
                    var startSlide = readCookie(settings.vss_id);
                    if (startSlide == null) {
                        startSlide = 0;
                    }
                    settings.opts.startingSlide = parseInt(startSlide);
                }

                if (settings.effect == 'none') {
                    settings.opts.speed = 1;
                }
                else {
                    settings.opts.fx = settings.effect;
                }

                // Take starting item from fragment.
                var hash = location.hash;
                if (hash) {
                    var hash = hash.replace('#', '');
                    var aHash = hash.split(';');
                    var aHashLen = aHash.length;

                    // Loop through all the possible starting points.
                    for (var i = 0; i < aHashLen; i++) {
                        // Split the hash into two parts. One part is the slideshow id the
                        // other is the slide number.
                        var initialInfo = aHash[i].split(':');
                        // The id in the hash should match our slideshow.
                        // The slide number chosen shouldn't be larger than the number of
                        // slides we have.
                        if (settings.slideshowId == initialInfo[0] && settings.num_divs > initialInfo[1]) {
                            settings.opts.startingSlide = parseInt(initialInfo[1]);
                        }
                    }
                }

                // Pause on hover.
                if (settings.pause) {
                    var mouseIn = function() {
                        Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": settings.slideshowId });
                    }

                    var mouseOut = function() {
                        Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": settings.slideshowId });
                    }

                    if (jQuery.fn.hoverIntent) {
                        $('#views_slideshow_cycle_teaser_section_' + settings.vss_id).hoverIntent(mouseIn, mouseOut);
                    }
                    else {
                        $('#views_slideshow_cycle_teaser_section_' + settings.vss_id).hover(mouseIn, mouseOut);
                    }
                }

                // Pause on clicking of the slide.
                if (settings.pause_on_click) {
                    $('#views_slideshow_cycle_teaser_section_' + settings.vss_id).click(function() {
                        Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": settings.slideshowId, "force": true });
                    });
                }

                if (typeof JSON != 'undefined' && typeof settings.advanced_options != 'undefined') {
                    var advancedOptions = JSON.parse(settings.advanced_options);
                    for (var option in advancedOptions) {
                        switch(option) {

                            // Standard Options
                            case "activePagerClass":
                            case "allowPagerClickBubble":
                            case "autostop":
                            case "autostopCount":
                            case "backwards":
                            case "bounce":
                            case "cleartype":
                            case "cleartypeNoBg":
                            case "containerResize":
                            case "continuous":
                            case "delay":
                            case "easeIn":
                            case "easeOut":
                            case "easing":
                            case "fastOnEvent":
                            case "fit":
                            case "fx":
                            case "height":
                            case "manualTrump":
                            case "metaAttr":
                            case "next":
                            case "nowrap":
                            case "pager":
                            case "pagerEvent":
                            case "pause":
                            case "pauseOnPagerHover":
                            case "prev":
                            case "prevNextEvent":
                            case "random":
                            case "randomizeEffects":
                            case "requeueOnImageNotLoaded":
                            case "requeueTimeout":
                            case "rev":
                            case "slideExpr":
                            case "slideResize":
                            case "speed":
                            case "speedIn":
                            case "speedOut":
                            case "startingSlide":
                            case "sync":
                            case "timeout":
                            case "width":
                                var optionValue = advancedOptions[option];
                                optionValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(optionValue);
                                settings.opts[option] = optionValue;
                                break;

                            // These process options that look like {top:50, bottom:20}
                            case "animIn":
                            case "animOut":
                            case "cssBefore":
                            case "cssAfter":
                            case "shuffle":
                                var cssValue = advancedOptions[option];
                                cssValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(cssValue);
                                settings.opts[option] = eval('(' + cssValue + ')');
                                break;

                            // These options have their own functions.
                            case "after":
                                var afterValue = advancedOptions[option];
                                afterValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(afterValue);
                                // transition callback (scope set to element that was shown): function(currSlideElement, nextSlideElement, options, forwardFlag)
                                settings.opts[option] = function(currSlideElement, nextSlideElement, options, forwardFlag) {
                                    pager_after_fn(currSlideElement, nextSlideElement, options);
                                    eval(afterValue);
                                }
                                break;

                            case "before":
                                var beforeValue = advancedOptions[option];
                                beforeValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(beforeValue);
                                // transition callback (scope set to element to be shown):     function(currSlideElement, nextSlideElement, options, forwardFlag)
                                settings.opts[option] = function(currSlideElement, nextSlideElement, options, forwardFlag) {
                                    pager_before_fn(currSlideElement, nextSlideElement, options);
                                    eval(beforeValue);
                                }
                                break;

                            case "end":
                                var endValue = advancedOptions[option];
                                endValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(endValue);
                                // callback invoked when the slideshow terminates (use with autostop or nowrap options): function(options)
                                settings.opts[option] = function(options) {
                                    eval(endValue);
                                }
                                break;

                            case "fxFn":
                                var fxFnValue = advancedOptions[option];
                                fxFnValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(fxFnValue);
                                // function used to control the transition: function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag)
                                settings.opts[option] = function(currSlideElement, nextSlideElement, options, afterCalback, forwardFlag) {
                                    eval(fxFnValue);
                                }
                                break;

                            case "onPagerEvent":
                                var onPagerEventValue = advancedOptions[option];
                                onPagerEventValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(onPagerEventValue);
                                settings.opts[option] = function(zeroBasedSlideIndex, slideElement) {
                                    eval(onPagerEventValue);
                                }
                                break;

                            case "onPrevNextEvent":
                                var onPrevNextEventValue = advancedOptions[option];
                                onPrevNextEventValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(onPrevNextEventValue);
                                settings.opts[option] = function(isNext, zeroBasedSlideIndex, slideElement) {
                                    eval(onPrevNextEventValue);
                                }
                                break;

                            case "pagerAnchorBuilder":
                                var pagerAnchorBuilderValue = advancedOptions[option];
                                pagerAnchorBuilderValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(pagerAnchorBuilderValue);
                                // callback fn for building anchor links:  function(index, DOMelement)
                                settings.opts[option] = function(index, DOMelement) {
                                    var returnVal = '';
                                    eval(pagerAnchorBuilderValue);
                                    return returnVal;
                                }
                                break;

                            case "pagerClick":
                                var pagerClickValue = advancedOptions[option];
                                pagerClickValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(pagerClickValue);
                                // callback fn for pager clicks:    function(zeroBasedSlideIndex, slideElement)
                                settings.opts[option] = function(zeroBasedSlideIndex, slideElement) {
                                    eval(pagerClickValue);
                                }
                                break;

                            case "paused":
                                var pausedValue = advancedOptions[option];
                                pausedValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(pausedValue);
                                // undocumented callback when slideshow is paused:    function(cont, opts, byHover)
                                settings.opts[option] = function(cont, opts, byHover) {
                                    eval(pausedValue);
                                }
                                break;

                            case "resumed":
                                var resumedValue = advancedOptions[option];
                                resumedValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(resumedValue);
                                // undocumented callback when slideshow is resumed:    function(cont, opts, byHover)
                                settings.opts[option] = function(cont, opts, byHover) {
                                    eval(resumedValue);
                                }
                                break;

                            case "timeoutFn":
                                var timeoutFnValue = advancedOptions[option];
                                timeoutFnValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(timeoutFnValue);
                                settings.opts[option] = function(currSlideElement, nextSlideElement, options, forwardFlag) {
                                    eval(timeoutFnValue);
                                }
                                break;

                            case "updateActivePagerLink":
                                var updateActivePagerLinkValue = advancedOptions[option];
                                updateActivePagerLinkValue = Drupal.viewsSlideshowCycle.advancedOptionCleanup(updateActivePagerLinkValue);
                                // callback fn invoked to update the active pager link (adds/removes activePagerClass style)
                                settings.opts[option] = function(pager, currSlideIndex) {
                                    eval(updateActivePagerLinkValue);
                                }
                                break;
                        }
                    }
                }

                // If selected wait for the images to be loaded.
                // otherwise just load the slideshow.
                if (settings.wait_for_image_load) {
                    // For IE/Chrome/Opera we if there are images then we need to make
                    // sure the images are loaded before starting the slideshow.
                    settings.totalImages = $(settings.targetId + ' img').length;
                    if (settings.totalImages) {
                        settings.loadedImages = 0;

                        // Add a load event for each image.
                        $(settings.targetId + ' img').each(function() {
                            var $imageElement = $(this);
                            $imageElement.bind('load', function () {
                                Drupal.viewsSlideshowCycle.imageWait(fullId);
                            });

                            // Removing the source and adding it again will fire the load event.
                            var imgSrc = $imageElement.attr('src');
                            $imageElement.attr('src', '');
                            $imageElement.attr('src', imgSrc);
                        });

                        // We need to set a timeout so that the slideshow doesn't wait
                        // indefinitely for all images to load.
                        setTimeout("Drupal.viewsSlideshowCycle.load('" + fullId + "')", settings.wait_for_image_load_timeout);
                    }
                    else {
                        Drupal.viewsSlideshowCycle.load(fullId);
                    }
                }
                else {
                    Drupal.viewsSlideshowCycle.load(fullId);
                }
            });
        }
    };

    Drupal.viewsSlideshowCycle = Drupal.viewsSlideshowCycle || {};

    // Cleanup the values of advanced options.
    Drupal.viewsSlideshowCycle.advancedOptionCleanup = function(value) {
        value = $.trim(value);
        value = value.replace(/\n/g, '');
        if (!isNaN(parseInt(value))) {
            value = parseInt(value);
        }
        else if (value.toLowerCase() == 'true') {
            value = true;
        }
        else if (value.toLowerCase() == 'false') {
            value = false;
        }

        return value;
    }

    // This checks to see if all the images have been loaded.
    // If they have then it starts the slideshow.
    Drupal.viewsSlideshowCycle.imageWait = function(fullId) {
        if (++drupalSettings.viewsSlideshowCycle[fullId].loadedImages == drupalSettings.viewsSlideshowCycle[fullId].totalImages) {
            Drupal.viewsSlideshowCycle.load(fullId);
        }
    };

    // Start the slideshow.
    Drupal.viewsSlideshowCycle.load = function (fullId) {
        var settings = drupalSettings.viewsSlideshowCycle[fullId];

        // Make sure the slideshow isn't already loaded.
        if (!settings.loaded) {
            $(settings.targetId).cycle(settings.opts);
            settings.loaded = true;

            // Start Paused
            if (settings.start_paused) {
                Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": settings.slideshowId, "force": true });
            }

            // Pause if hidden.
            if (settings.pause_when_hidden) {
                var checkPause = function(settings) {
                    // If the slideshow is visible and it is paused then resume.
                    // otherwise if the slideshow is not visible and it is not paused then
                    // pause it.
                    var visible = viewsSlideshowCycleIsVisible(settings.targetId, settings.pause_when_hidden_type, settings.amount_allowed_visible);
                    if (visible) {
                        Drupal.viewsSlideshow.action({ "action": 'play', "slideshowID": settings.slideshowId });
                    }
                    else {
                        Drupal.viewsSlideshow.action({ "action": 'pause', "slideshowID": settings.slideshowId });
                    }
                }

                // Check when scrolled.
                $(window).scroll(function() {
                    checkPause(settings);
                });

                // Check when the window is resized.
                $(window).resize(function() {
                    checkPause(settings);
                });
            }
        }
    };

    Drupal.viewsSlideshowCycle.pause = function (options) {
        //Eat TypeError, cycle doesn't handle pause well if options isn't defined.
        try{
            if (options.pause_in_middle && $.fn.pause) {
                $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).pause();
            }
            else {
                $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).cycle('pause');
            }
        }
        catch(e){
            if(!e instanceof TypeError){
                throw e;
            }
        }
    };

    Drupal.viewsSlideshowCycle.play = function (options) {
        drupalSettings.viewsSlideshowCycle['#views_slideshow_cycle_main_' + options.slideshowID].paused = false;
        if (options.pause_in_middle && $.fn.resume) {
            $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).resume();
        }
        else {
            $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).cycle('resume');
        }
    };

    Drupal.viewsSlideshowCycle.previousSlide = function (options) {
        $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).cycle('prev');
    };

    Drupal.viewsSlideshowCycle.nextSlide = function (options) {
        $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).cycle('next');
    };

    Drupal.viewsSlideshowCycle.goToSlide = function (options) {
        $('#views_slideshow_cycle_teaser_section_' + options.slideshowID).cycle(options.slideNum);
    };

    // Verify that the value is a number.
    function IsNumeric(sText) {
        var ValidChars = "0123456789";
        var IsNumber=true;
        var Char;

        for (var i=0; i < sText.length && IsNumber == true; i++) {
            Char = sText.charAt(i);
            if (ValidChars.indexOf(Char) == -1) {
                IsNumber = false;
            }
        }
        return IsNumber;
    }

    /**
     * Cookie Handling Functions
     */
    function createCookie(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else {
            var expires = "";
        }
        document.cookie = name+"="+value+expires+"; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) {
                return c.substring(nameEQ.length,c.length);
            }
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name,"",-1);
    }

    /**
     * Checks to see if the slide is visible enough.
     * elem = element to check.
     * type = The way to calculate how much is visible.
     * amountVisible = amount that should be visible. Either in percent or px. If
     *                it's not defined then all of the slide must be visible.
     *
     * Returns true or false
     */
    function viewsSlideshowCycleIsVisible(elem, type, amountVisible) {
        // Get the top and bottom of the window;
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();
        var docViewLeft = $(window).scrollLeft();
        var docViewRight = docViewLeft + $(window).width();

        // Get the top, bottom, and height of the slide;
        var elemTop = $(elem).offset().top;
        var elemHeight = $(elem).height();
        var elemBottom = elemTop + elemHeight;
        var elemLeft = $(elem).offset().left;
        var elemWidth = $(elem).width();
        var elemRight = elemLeft + elemWidth;
        var elemArea = elemHeight * elemWidth;

        // Calculate what's hiding in the slide.
        var missingLeft = 0;
        var missingRight = 0;
        var missingTop = 0;
        var missingBottom = 0;

        // Find out how much of the slide is missing from the left.
        if (elemLeft < docViewLeft) {
            missingLeft = docViewLeft - elemLeft;
        }

        // Find out how much of the slide is missing from the right.
        if (elemRight > docViewRight) {
            missingRight = elemRight - docViewRight;
        }

        // Find out how much of the slide is missing from the top.
        if (elemTop < docViewTop) {
            missingTop = docViewTop - elemTop;
        }

        // Find out how much of the slide is missing from the bottom.
        if (elemBottom > docViewBottom) {
            missingBottom = elemBottom - docViewBottom;
        }

        // If there is no amountVisible defined then check to see if the whole slide
        // is visible.
        if (type == 'full') {
            return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
            && (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop)
            && (elemLeft >= docViewLeft) && (elemRight <= docViewRight)
            && (elemLeft <= docViewRight) && (elemRight >= docViewLeft));
        }
        else if(type == 'vertical') {
            var verticalShowing = elemHeight - missingTop - missingBottom;

            // If user specified a percentage then find out if the current shown percent
            // is larger than the allowed percent.
            // Otherwise check to see if the amount of px shown is larger than the
            // allotted amount.
            if (amountVisible.indexOf('%')) {
                return (((verticalShowing/elemHeight)*100) >= parseInt(amountVisible));
            }
            else {
                return (verticalShowing >= parseInt(amountVisible));
            }
        }
        else if(type == 'horizontal') {
            var horizontalShowing = elemWidth - missingLeft - missingRight;

            // If user specified a percentage then find out if the current shown percent
            // is larger than the allowed percent.
            // Otherwise check to see if the amount of px shown is larger than the
            // allotted amount.
            if (amountVisible.indexOf('%')) {
                return (((horizontalShowing/elemWidth)*100) >= parseInt(amountVisible));
            }
            else {
                return (horizontalShowing >= parseInt(amountVisible));
            }
        }
        else if(type == 'area') {
            var areaShowing = (elemWidth - missingLeft - missingRight) * (elemHeight - missingTop - missingBottom);

            // If user specified a percentage then find out if the current shown percent
            // is larger than the allowed percent.
            // Otherwise check to see if the amount of px shown is larger than the
            // allotted amount.
            if (amountVisible.indexOf('%')) {
                return (((areaShowing/elemArea)*100) >= parseInt(amountVisible));
            }
            else {
                return (areaShowing >= parseInt(amountVisible));
            }
        }
    }
})(jQuery, Drupal, drupalSettings);
;
;
(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.viewsSlideshow = Drupal.viewsSlideshow || {};
  var pagerLocation;
  var slideNum;
  var error;
  var excludeMethods;
  /**
   * Views Slideshow Controls
   */
  Drupal.viewsSlideshowControls = Drupal.viewsSlideshowControls || {};

  /**
   * Implement the play hook for controls.
   */
  Drupal.viewsSlideshowControls.play = function (options) {
    // Route the control call to the correct control type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowControls[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].top.type].play == 'function') {
        Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].top.type].play(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type].play == 'function') {
        Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type].play(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };

  /**
   * Implement the pause hook for controls.
   */
  Drupal.viewsSlideshowControls.pause = function (options) {
    // Route the control call to the correct control type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowControls[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].top.type].pause == 'function') {
        Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].top.type].pause(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type].pause == 'function') {
        Drupal[drupalSettings.viewsSlideshowControls[options.slideshowID].bottom.type].pause(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };


  /**
   * Views Slideshow Text Controls
   */

  // Add views slieshow api calls for views slideshow text controls.
  Drupal.behaviors.viewsSlideshowControlsText = {
    attach: function (context) {

      // Process previous link
      $('.views_slideshow_controls_text_previous:not(.views-slideshow-controls-text-previous-processed)', context).addClass('views-slideshow-controls-text-previous-processed').each(function () {
        var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_previous_', '');
        $(this).click(function () {
          Drupal.viewsSlideshow.action({"action": 'previousSlide', "slideshowID": uniqueID});
          return false;
        });
      });

      // Process next link
      $('.views_slideshow_controls_text_next:not(.views-slideshow-controls-text-next-processed)', context).addClass('views-slideshow-controls-text-next-processed').each(function () {
        var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_next_', '');
        $(this).click(function () {
          Drupal.viewsSlideshow.action({"action": 'nextSlide', "slideshowID": uniqueID});
          return false;
        });
      });

      // Process pause link
      $('.views_slideshow_controls_text_pause:not(.views-slideshow-controls-text-pause-processed)', context).addClass('views-slideshow-controls-text-pause-processed').each(function () {
        var uniqueID = $(this).attr('id').replace('views_slideshow_controls_text_pause_', '');
        $(this).click(function () {
          if (drupalSettings.viewsSlideshow[uniqueID].paused) {
            Drupal.viewsSlideshow.action({"action": 'play', "slideshowID": uniqueID, "force": true});
          }
          else {
            Drupal.viewsSlideshow.action({"action": 'pause', "slideshowID": uniqueID, "force": true});
          }
          return false;
        });
      });
    }
  };

  Drupal.viewsSlideshowControlsText = Drupal.viewsSlideshowControlsText || {};

  /**
   * Implement the pause hook for text controls.
   */
  Drupal.viewsSlideshowControlsText.pause = function (options) {
    var pauseText = Drupal.theme.viewsSlideshowControlsPause ? Drupal.theme('viewsSlideshowControlsPause') : '';
    var $element = $('#views_slideshow_controls_text_pause_' + options.slideshowID);
    $element.find('a').text(pauseText);
    $element.removeClass('views-slideshow-controls-text-status-play');
    $element.addClass('views-slideshow-controls-text-status-pause');
  };

  /**
   * Implement the play hook for text controls.
   */
  Drupal.viewsSlideshowControlsText.play = function (options) {
    var playText = Drupal.theme.viewsSlideshowControlsPlay ? Drupal.theme('viewsSlideshowControlsPlay') : '';
    var $element = $('#views_slideshow_controls_text_pause_' + options.slideshowID);
    $element.find('a').text(playText);
    $element.removeClass('views-slideshow-controls-text-status-pause');
    $element.addClass('views-slideshow-controls-text-status-play');
  };

  // Theme the resume control.
  Drupal.theme.viewsSlideshowControlsPause = function () {
    return Drupal.t('Resume');
  };

  // Theme the pause control.
  Drupal.theme.viewsSlideshowControlsPlay = function () {
    return Drupal.t('Pause');
  };

  /**
   * Views Slideshow Pager
   */
  Drupal.viewsSlideshowPager = Drupal.viewsSlideshowPager || {};

  /**
   * Implement the transitionBegin hook for pagers.
   */
  Drupal.viewsSlideshowPager.transitionBegin = function (options) {
    // Route the pager call to the correct pager type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowPager != "undefined" && typeof drupalSettings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].transitionBegin == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].transitionBegin(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowPager != "undefined" && typeof drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].transitionBegin == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].transitionBegin(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };

  /**
   * Implement the goToSlide hook for pagers.
   */
  Drupal.viewsSlideshowPager.goToSlide = function (options) {
    // Route the pager call to the correct pager type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].goToSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].goToSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].goToSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].goToSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };

  /**
   * Implement the previousSlide hook for pagers.
   */
  Drupal.viewsSlideshowPager.previousSlide = function (options) {
    // Route the pager call to the correct pager type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].previousSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].previousSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].previousSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].previousSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };

  /**
   * Implement the nextSlide hook for pagers.
   */
  Drupal.viewsSlideshowPager.nextSlide = function (options) {
    // Route the pager call to the correct pager type.
    // Need to use try catch so we don't have to check to make sure every part
    // of the object is defined.
    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].top.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].nextSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].top.type].nextSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }

    try {
      if (typeof drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type != "undefined" && typeof Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].nextSlide == 'function') {
        Drupal[drupalSettings.viewsSlideshowPager[options.slideshowID].bottom.type].nextSlide(options);
      }
    }
    catch(err) {
      // Don't need to do anything on error.
    }
  };


  /**
   * Views Slideshow Pager Fields
   */

  // Add views slieshow api calls for views slideshow pager fields.
  Drupal.behaviors.viewsSlideshowPagerFields = {
    attach: function (context) {
      // Process pause on hover.
      $('.views_slideshow_pager_field:not(.views-slideshow-pager-field-processed)', context).addClass('views-slideshow-pager-field-processed').each(function () {
        // Parse out the location and unique id from the full id.
        var pagerInfo = $(this).attr('id').split('_');
        var location = pagerInfo[2];
        pagerInfo.splice(0, 3);
        var uniqueID = pagerInfo.join('_');

        // Add the activate and pause on pager hover event to each pager item.
        if (drupalSettings.viewsSlideshowPagerFields[uniqueID][location].activatePauseOnHover) {
          $(this).children().each(function (index, pagerItem) {
            var mouseIn = function () {
              Drupal.viewsSlideshow.action({"action": 'goToSlide', "slideshowID": uniqueID, "slideNum": index});
              Drupal.viewsSlideshow.action({"action": 'pause', "slideshowID": uniqueID});
            };

            var mouseOut = function () {
              Drupal.viewsSlideshow.action({"action": 'play', "slideshowID": uniqueID});
            };

            if (jQuery.fn.hoverIntent) {
              $(pagerItem).hoverIntent(mouseIn, mouseOut);
            }
            else {
              $(pagerItem).hover(mouseIn, mouseOut);
            }
          });
        }
        else {
          $(this).children().each(function (index, pagerItem) {
            $(pagerItem).click(function () {
              Drupal.viewsSlideshow.action({"action": 'goToSlide', "slideshowID": uniqueID, "slideNum": index});
            });
          });
        }
      });
    }
  };

  Drupal.viewsSlideshowPagerFields = Drupal.viewsSlideshowPagerFields || {};

  /**
   * Implement the transitionBegin hook for pager fields pager.
   */
  Drupal.viewsSlideshowPagerFields.transitionBegin = function (options) {
    for (pagerLocation in drupalSettings.viewsSlideshowPager[options.slideshowID]) {
      if (drupalSettings.viewsSlideshowPager[options.slideshowID]) {
        // Remove active class from pagers
        $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

        // Add active class to active pager.
        $('#views_slideshow_pager_field_item_'+ pagerLocation + '_' + options.slideshowID + '_' + options.slideNum).addClass('active');
      }
    }
  };

  /**
   * Implement the goToSlide hook for pager fields pager.
   */
  Drupal.viewsSlideshowPagerFields.goToSlide = function (options) {
    for (pagerLocation in drupalSettings.viewsSlideshowPager[options.slideshowID]) {
      if (drupalSettings.viewsSlideshowPager[options.slideshowID]) {
        // Remove active class from pagers
        $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

        // Add active class to active pager.
        $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + options.slideNum).addClass('active');
      }
    }
  };

  /**
   * Implement the previousSlide hook for pager fields pager.
   */
  Drupal.viewsSlideshowPagerFields.previousSlide = function (options) {
    for (pagerLocation in drupalSettings.viewsSlideshowPager[options.slideshowID]) {
      if (drupalSettings.viewsSlideshowPager[options.slideshowID]) {
        // Get the current active pager.
        var pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"].active').attr('id').replace('views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_', '');

        // If we are on the first pager then activate the last pager.
        // Otherwise activate the previous pager.
        if (pagerNum === 0) {
          pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').length() - 1;
        }
        else {
          pagerNum--;
        }

        // Remove active class from pagers
        $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

        // Add active class to active pager.
        $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + pagerNum).addClass('active');
      }
    }
  };

  /**
   * Implement the nextSlide hook for pager fields pager.
   */
  Drupal.viewsSlideshowPagerFields.nextSlide = function (options) {
    for (pagerLocation in drupalSettings.viewsSlideshowPager[options.slideshowID]) {
      if (drupalSettings.viewsSlideshowPager[options.slideshowID]) {
        // Get the current active pager.
        var pagerNum = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"].active').attr('id').replace('views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_', '');
        var totalPagers = $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').length();

        // If we are on the last pager then activate the first pager.
        // Otherwise activate the next pager.
        pagerNum++;
        if (pagerNum === totalPagers) {
          pagerNum = 0;
        }

        // Remove active class from pagers
        $('[id^="views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '"]').removeClass('active');

        // Add active class to active pager.
        $('#views_slideshow_pager_field_item_' + pagerLocation + '_' + options.slideshowID + '_' + slideNum).addClass('active');
      }
    }
  };

  // Copy the pager hooks from fields pager to the bullets one.
  Drupal.viewsSlideshowPagerBullets = Drupal.viewsSlideshowPagerFields || {};

  /**
   * Views Slideshow Slide Counter
   */

  Drupal.viewsSlideshowSlideCounter = Drupal.viewsSlideshowSlideCounter || {};

  /**
   * Implement the transitionBegin for the slide counter.
   */
  Drupal.viewsSlideshowSlideCounter.transitionBegin = function (options) {
    $('#views_slideshow_slide_counter_' + options.slideshowID + ' .num').text(options.slideNum + 1);
  };

  /**
   * This is used as a router to process actions for the slideshow.
   */
  Drupal.viewsSlideshow.action = function (options) {
    // Set default values for our return status.
    var status = {
      'value': true,
      'text': ''
    };

    // If an action isn't specified return false.
    if (typeof options.action == 'undefined' || options.action === '') {
      status.value = false;
      status.text =  Drupal.t('There was no action specified.');
      return error;
    }

    // If we are using pause or play switch paused state accordingly.
    if (options.action === 'pause') {
      drupalSettings.viewsSlideshow[options.slideshowID].paused = 1;
      // If the calling method is forcing a pause then mark it as such.
      if (options.force) {
        drupalSettings.viewsSlideshow[options.slideshowID].pausedForce = 1;
      }
    }
    else if (options.action === 'play') {
      // If the slideshow isn't forced pause or we are forcing a play then play
      // the slideshow.
      // Otherwise return telling the calling method that it was forced paused.
      if (!drupalSettings.viewsSlideshow[options.slideshowID].pausedForce || options.force) {
        drupalSettings.viewsSlideshow[options.slideshowID].paused = 0;
        drupalSettings.viewsSlideshow[options.slideshowID].pausedForce = 0;
      }
      else {
        status.value = false;
        status.text += ' ' + Drupal.t('This slideshow is forced paused.');
        return status;
      }
    }

    // We use a switch statement here mainly just to limit the type of actions
    // that are available.
    switch (options.action) {
      case "goToSlide":
      case "transitionBegin":
      case "transitionEnd":
        // The three methods above require a slide number. Checking if it is
        // defined and it is a number that is an integer.
        if (typeof options.slideNum == 'undefined' || typeof options.slideNum !== 'number' || parseInt(options.slideNum) !== (options.slideNum - 0)) {
          status.value = false;
          status.text = Drupal.t('An invalid integer was specified for slideNum.');
        }
      case "pause":
      case "play":
      case "nextSlide":
      case "previousSlide":
        // Grab our list of methods.
        var methods = drupalSettings.viewsSlideshow[options.slideshowID]['methods'];

        // if the calling method specified methods that shouldn't be called then
        // exclude calling them.
        var excludeMethodsObj = {};
        if (typeof options.excludeMethods !== 'undefined') {
          // We need to turn the excludeMethods array into an object so we can use the in
          // function.
          for (var i=0; i < excludeMethods.length; i++) {
            excludeMethodsObj[excludeMethods[i]] = '';
          }
        }

        // Call every registered method and don't call excluded ones.
        for (var i = 0; i < methods[options.action].length; i++) {
          if (Drupal[methods[options.action][i]] !== 'undefined' && typeof Drupal[methods[options.action][i]][options.action] == 'function' && !(methods[options.action][i] in excludeMethodsObj)) {
            Drupal[methods[options.action][i]][options.action](options);
          }
        }
        break;

      // If it gets here it's because it's an invalid action.
      default:
        status.value = false;
        status.text = Drupal.t('An invalid action "@action" was specified.', {"@action": options.action});
    }
    return status;
  };
})(jQuery, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal) {
  Drupal.theme.progressBar = function (id) {
    return '<div id="' + id + '" class="progress" aria-live="polite">' + '<div class="progress__label">&nbsp;</div>' + '<div class="progress__track"><div class="progress__bar"></div></div>' + '<div class="progress__percentage"></div>' + '<div class="progress__description">&nbsp;</div>' + '</div>';
  };

  Drupal.ProgressBar = function (id, updateCallback, method, errorCallback) {
    this.id = id;
    this.method = method || 'GET';
    this.updateCallback = updateCallback;
    this.errorCallback = errorCallback;

    this.element = $(Drupal.theme('progressBar', id));
  };

  $.extend(Drupal.ProgressBar.prototype, {
    setProgress: function setProgress(percentage, message, label) {
      if (percentage >= 0 && percentage <= 100) {
        $(this.element).find('div.progress__bar').css('width', percentage + '%');
        $(this.element).find('div.progress__percentage').html(percentage + '%');
      }
      $('div.progress__description', this.element).html(message);
      $('div.progress__label', this.element).html(label);
      if (this.updateCallback) {
        this.updateCallback(percentage, message, this);
      }
    },
    startMonitoring: function startMonitoring(uri, delay) {
      this.delay = delay;
      this.uri = uri;
      this.sendPing();
    },
    stopMonitoring: function stopMonitoring() {
      clearTimeout(this.timer);

      this.uri = null;
    },
    sendPing: function sendPing() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (this.uri) {
        var pb = this;

        var uri = this.uri;
        if (uri.indexOf('?') === -1) {
          uri += '?';
        } else {
          uri += '&';
        }
        uri += '_format=json';
        $.ajax({
          type: this.method,
          url: uri,
          data: '',
          dataType: 'json',
          success: function success(progress) {
            if (progress.status === 0) {
              pb.displayError(progress.data);
              return;
            }

            pb.setProgress(progress.percentage, progress.message, progress.label);

            pb.timer = setTimeout(function () {
              pb.sendPing();
            }, pb.delay);
          },
          error: function error(xmlhttp) {
            var e = new Drupal.AjaxError(xmlhttp, pb.uri);
            pb.displayError('<pre>' + e.message + '</pre>');
          }
        });
      }
    },
    displayError: function displayError(string) {
      var error = $('<div class="messages messages--error"></div>').html(string);
      $(this.element).before(error).hide();

      if (this.errorCallback) {
        this.errorCallback(this);
      }
    }
  });
})(jQuery, Drupal);;
/**
 * @file
 * Extends methods from core/misc/progress.js.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Theme function for the progress bar.
   *
   * @param {string} id
   *
   * @return {string}
   *   The HTML for the progress bar.
   */
  Drupal.theme.progressBar = function (id) {
    return '<div class="progress-wrapper" aria-live="polite">' +
             '<div class="message"></div>'+
             '<div id ="' + id + '" class="progress progress-striped active">' +
               '<div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                 '<span class="percentage"></span>' +
               '</div>' +
             '</div>' +
             '<div class="progress-label"></div>' +
           '</div>';
  };

  $.extend(Drupal.ProgressBar.prototype, /** @lends Drupal.ProgressBar */{

    /**
     * Set the percentage and status message for the progressbar.
     *
     * @param {number} percentage
     * @param {string} message
     * @param {string} label
     */
    setProgress: function (percentage, message, label) {
      if (percentage >= 0 && percentage <= 100) {
        $(this.element).find('.progress-bar').css('width', percentage + '%').attr('aria-valuenow', percentage);
        $(this.element).find('.percentage').html(percentage + '%');
      }
      if (message) {
        // Remove the unnecessary whitespace at the end of the message.
        message = message.replace(/<br\/>&nbsp;|\s*$/, '');

        $('.message', this.element).html(message);
      }
      if (label) {
        $('.progress-label', this.element).html(label);
      }
      if (this.updateCallback) {
        this.updateCallback(percentage, message, this);
      }
    },

    /**
     * Display errors on the page.
     *
     * @param {string} string
     */
    displayError: function (string) {
      var error = $('<div class="alert alert-block alert-error"><button class="close" data-dismiss="alert">&times;</button><h4>' + Drupal.t('Error message') + '</h4></div>').append(string);
      $(this.element).before(error).hide();

      if (this.errorCallback) {
        this.errorCallback(this);
      }
    }
  });

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function ($, window, Drupal, drupalSettings) {
  Drupal.behaviors.AJAX = {
    attach: function attach(context, settings) {
      function loadAjaxBehavior(base) {
        var elementSettings = settings.ajax[base];
        if (typeof elementSettings.selector === 'undefined') {
          elementSettings.selector = '#' + base;
        }
        $(elementSettings.selector).once('drupal-ajax').each(function () {
          elementSettings.element = this;
          elementSettings.base = base;
          Drupal.ajax(elementSettings);
        });
      }

      Object.keys(settings.ajax || {}).forEach(function (base) {
        return loadAjaxBehavior(base);
      });

      Drupal.ajax.bindAjaxLinks(document.body);

      $('.use-ajax-submit').once('ajax').each(function () {
        var elementSettings = {};

        elementSettings.url = $(this.form).attr('action');

        elementSettings.setClick = true;

        elementSettings.event = 'click';

        elementSettings.progress = { type: 'throbber' };
        elementSettings.base = $(this).attr('id');
        elementSettings.element = this;

        Drupal.ajax(elementSettings);
      });
    },
    detach: function detach(context, settings, trigger) {
      if (trigger === 'unload') {
        Drupal.ajax.expired().forEach(function (instance) {
          Drupal.ajax.instances[instance.instanceIndex] = null;
        });
      }
    }
  };

  Drupal.AjaxError = function (xmlhttp, uri, customMessage) {
    var statusCode = void 0;
    var statusText = void 0;
    var responseText = void 0;
    if (xmlhttp.status) {
      statusCode = '\n' + Drupal.t('An AJAX HTTP error occurred.') + '\n' + Drupal.t('HTTP Result Code: !status', { '!status': xmlhttp.status });
    } else {
      statusCode = '\n' + Drupal.t('An AJAX HTTP request terminated abnormally.');
    }
    statusCode += '\n' + Drupal.t('Debugging information follows.');
    var pathText = '\n' + Drupal.t('Path: !uri', { '!uri': uri });
    statusText = '';

    try {
      statusText = '\n' + Drupal.t('StatusText: !statusText', {
        '!statusText': $.trim(xmlhttp.statusText)
      });
    } catch (e) {}

    responseText = '';

    try {
      responseText = '\n' + Drupal.t('ResponseText: !responseText', {
        '!responseText': $.trim(xmlhttp.responseText)
      });
    } catch (e) {}

    responseText = responseText.replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi, '');
    responseText = responseText.replace(/[\n]+\s+/g, '\n');

    var readyStateText = xmlhttp.status === 0 ? '\n' + Drupal.t('ReadyState: !readyState', {
      '!readyState': xmlhttp.readyState
    }) : '';

    customMessage = customMessage ? '\n' + Drupal.t('CustomMessage: !customMessage', {
      '!customMessage': customMessage
    }) : '';

    this.message = statusCode + pathText + statusText + customMessage + responseText + readyStateText;

    this.name = 'AjaxError';
  };

  Drupal.AjaxError.prototype = new Error();
  Drupal.AjaxError.prototype.constructor = Drupal.AjaxError;

  Drupal.ajax = function (settings) {
    if (arguments.length !== 1) {
      throw new Error('Drupal.ajax() function must be called with one configuration object only');
    }

    var base = settings.base || false;
    var element = settings.element || false;
    delete settings.base;
    delete settings.element;

    if (!settings.progress && !element) {
      settings.progress = false;
    }

    var ajax = new Drupal.Ajax(base, element, settings);
    ajax.instanceIndex = Drupal.ajax.instances.length;
    Drupal.ajax.instances.push(ajax);

    return ajax;
  };

  Drupal.ajax.instances = [];

  Drupal.ajax.expired = function () {
    return Drupal.ajax.instances.filter(function (instance) {
      return instance && instance.element !== false && !document.body.contains(instance.element);
    });
  };

  Drupal.ajax.bindAjaxLinks = function (element) {
    $(element).find('.use-ajax').once('ajax').each(function (i, ajaxLink) {
      var $linkElement = $(ajaxLink);

      var elementSettings = {
        progress: { type: 'throbber' },
        dialogType: $linkElement.data('dialog-type'),
        dialog: $linkElement.data('dialog-options'),
        dialogRenderer: $linkElement.data('dialog-renderer'),
        base: $linkElement.attr('id'),
        element: ajaxLink
      };
      var href = $linkElement.attr('href');

      if (href) {
        elementSettings.url = href;
        elementSettings.event = 'click';
      }
      Drupal.ajax(elementSettings);
    });
  };

  Drupal.Ajax = function (base, element, elementSettings) {
    var defaults = {
      event: element ? 'mousedown' : null,
      keypress: true,
      selector: base ? '#' + base : null,
      effect: 'none',
      speed: 'none',
      method: 'replaceWith',
      progress: {
        type: 'throbber',
        message: Drupal.t('Please wait...')
      },
      submit: {
        js: true
      }
    };

    $.extend(this, defaults, elementSettings);

    this.commands = new Drupal.AjaxCommands();

    this.instanceIndex = false;

    if (this.wrapper) {
      this.wrapper = '#' + this.wrapper;
    }

    this.element = element;

    this.element_settings = elementSettings;

    this.elementSettings = elementSettings;

    if (this.element && this.element.form) {
      this.$form = $(this.element.form);
    }

    if (!this.url) {
      var $element = $(this.element);
      if ($element.is('a')) {
        this.url = $element.attr('href');
      } else if (this.element && element.form) {
        this.url = this.$form.attr('action');
      }
    }

    var originalUrl = this.url;

    this.url = this.url.replace(/\/nojs(\/|$|\?|#)/, '/ajax$1');

    if (drupalSettings.ajaxTrustedUrl[originalUrl]) {
      drupalSettings.ajaxTrustedUrl[this.url] = true;
    }

    var ajax = this;

    ajax.options = {
      url: ajax.url,
      data: ajax.submit,
      beforeSerialize: function beforeSerialize(elementSettings, options) {
        return ajax.beforeSerialize(elementSettings, options);
      },
      beforeSubmit: function beforeSubmit(formValues, elementSettings, options) {
        ajax.ajaxing = true;
        return ajax.beforeSubmit(formValues, elementSettings, options);
      },
      beforeSend: function beforeSend(xmlhttprequest, options) {
        ajax.ajaxing = true;
        return ajax.beforeSend(xmlhttprequest, options);
      },
      success: function success(response, status, xmlhttprequest) {
        if (typeof response === 'string') {
          response = $.parseJSON(response);
        }

        if (response !== null && !drupalSettings.ajaxTrustedUrl[ajax.url]) {
          if (xmlhttprequest.getResponseHeader('X-Drupal-Ajax-Token') !== '1') {
            var customMessage = Drupal.t('The response failed verification so will not be processed.');
            return ajax.error(xmlhttprequest, ajax.url, customMessage);
          }
        }

        return ajax.success(response, status);
      },
      complete: function complete(xmlhttprequest, status) {
        ajax.ajaxing = false;
        if (status === 'error' || status === 'parsererror') {
          return ajax.error(xmlhttprequest, ajax.url);
        }
      },

      dataType: 'json',
      type: 'POST'
    };

    if (elementSettings.dialog) {
      ajax.options.data.dialogOptions = elementSettings.dialog;
    }

    if (ajax.options.url.indexOf('?') === -1) {
      ajax.options.url += '?';
    } else {
      ajax.options.url += '&';
    }

    var wrapper = 'drupal_' + (elementSettings.dialogType || 'ajax');
    if (elementSettings.dialogRenderer) {
      wrapper += '.' + elementSettings.dialogRenderer;
    }
    ajax.options.url += Drupal.ajax.WRAPPER_FORMAT + '=' + wrapper;

    $(ajax.element).on(elementSettings.event, function (event) {
      if (!drupalSettings.ajaxTrustedUrl[ajax.url] && !Drupal.url.isLocal(ajax.url)) {
        throw new Error(Drupal.t('The callback URL is not local and not trusted: !url', {
          '!url': ajax.url
        }));
      }
      return ajax.eventResponse(this, event);
    });

    if (elementSettings.keypress) {
      $(ajax.element).on('keypress', function (event) {
        return ajax.keypressResponse(this, event);
      });
    }

    if (elementSettings.prevent) {
      $(ajax.element).on(elementSettings.prevent, false);
    }
  };

  Drupal.ajax.WRAPPER_FORMAT = '_wrapper_format';

  Drupal.Ajax.AJAX_REQUEST_PARAMETER = '_drupal_ajax';

  Drupal.Ajax.prototype.execute = function () {
    if (this.ajaxing) {
      return;
    }

    try {
      this.beforeSerialize(this.element, this.options);

      return $.ajax(this.options);
    } catch (e) {
      this.ajaxing = false;
      window.alert('An error occurred while attempting to process ' + this.options.url + ': ' + e.message);

      return $.Deferred().reject();
    }
  };

  Drupal.Ajax.prototype.keypressResponse = function (element, event) {
    var ajax = this;

    if (event.which === 13 || event.which === 32 && element.type !== 'text' && element.type !== 'textarea' && element.type !== 'tel' && element.type !== 'number') {
      event.preventDefault();
      event.stopPropagation();
      $(element).trigger(ajax.elementSettings.event);
    }
  };

  Drupal.Ajax.prototype.eventResponse = function (element, event) {
    event.preventDefault();
    event.stopPropagation();

    var ajax = this;

    if (ajax.ajaxing) {
      return;
    }

    try {
      if (ajax.$form) {
        if (ajax.setClick) {
          element.form.clk = element;
        }

        ajax.$form.ajaxSubmit(ajax.options);
      } else {
        ajax.beforeSerialize(ajax.element, ajax.options);
        $.ajax(ajax.options);
      }
    } catch (e) {
      ajax.ajaxing = false;
      window.alert('An error occurred while attempting to process ' + ajax.options.url + ': ' + e.message);
    }
  };

  Drupal.Ajax.prototype.beforeSerialize = function (element, options) {
    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.detachBehaviors(this.$form.get(0), settings, 'serialize');
    }

    options.data[Drupal.Ajax.AJAX_REQUEST_PARAMETER] = 1;

    var pageState = drupalSettings.ajaxPageState;
    options.data['ajax_page_state[theme]'] = pageState.theme;
    options.data['ajax_page_state[theme_token]'] = pageState.theme_token;
    options.data['ajax_page_state[libraries]'] = pageState.libraries;
  };

  Drupal.Ajax.prototype.beforeSubmit = function (formValues, element, options) {};

  Drupal.Ajax.prototype.beforeSend = function (xmlhttprequest, options) {
    if (this.$form) {
      options.extraData = options.extraData || {};

      options.extraData.ajax_iframe_upload = '1';

      var v = $.fieldValue(this.element);
      if (v !== null) {
        options.extraData[this.element.name] = v;
      }
    }

    $(this.element).prop('disabled', true);

    if (!this.progress || !this.progress.type) {
      return;
    }

    var progressIndicatorMethod = 'setProgressIndicator' + this.progress.type.slice(0, 1).toUpperCase() + this.progress.type.slice(1).toLowerCase();
    if (progressIndicatorMethod in this && typeof this[progressIndicatorMethod] === 'function') {
      this[progressIndicatorMethod].call(this);
    }
  };

  Drupal.theme.ajaxProgressThrobber = function (message) {
    var messageMarkup = typeof message === 'string' ? Drupal.theme('ajaxProgressMessage', message) : '';
    var throbber = '<div class="throbber">&nbsp;</div>';

    return '<div class="ajax-progress ajax-progress-throbber">' + throbber + messageMarkup + '</div>';
  };

  Drupal.theme.ajaxProgressIndicatorFullscreen = function () {
    return '<div class="ajax-progress ajax-progress-fullscreen">&nbsp;</div>';
  };

  Drupal.theme.ajaxProgressMessage = function (message) {
    return '<div class="message">' + message + '</div>';
  };

  Drupal.Ajax.prototype.setProgressIndicatorBar = function () {
    var progressBar = new Drupal.ProgressBar('ajax-progress-' + this.element.id, $.noop, this.progress.method, $.noop);
    if (this.progress.message) {
      progressBar.setProgress(-1, this.progress.message);
    }
    if (this.progress.url) {
      progressBar.startMonitoring(this.progress.url, this.progress.interval || 1500);
    }
    this.progress.element = $(progressBar.element).addClass('ajax-progress ajax-progress-bar');
    this.progress.object = progressBar;
    $(this.element).after(this.progress.element);
  };

  Drupal.Ajax.prototype.setProgressIndicatorThrobber = function () {
    this.progress.element = $(Drupal.theme('ajaxProgressThrobber', this.progress.message));
    $(this.element).after(this.progress.element);
  };

  Drupal.Ajax.prototype.setProgressIndicatorFullscreen = function () {
    this.progress.element = $(Drupal.theme('ajaxProgressIndicatorFullscreen'));
    $('body').after(this.progress.element);
  };

  Drupal.Ajax.prototype.success = function (response, status) {
    var _this = this;

    if (this.progress.element) {
      $(this.progress.element).remove();
    }
    if (this.progress.object) {
      this.progress.object.stopMonitoring();
    }
    $(this.element).prop('disabled', false);

    var elementParents = $(this.element).parents('[data-drupal-selector]').addBack().toArray();

    var focusChanged = false;
    Object.keys(response || {}).forEach(function (i) {
      if (response[i].command && _this.commands[response[i].command]) {
        _this.commands[response[i].command](_this, response[i], status);
        if (response[i].command === 'invoke' && response[i].method === 'focus') {
          focusChanged = true;
        }
      }
    });

    if (!focusChanged && this.element && !$(this.element).data('disable-refocus')) {
      var target = false;

      for (var n = elementParents.length - 1; !target && n >= 0; n--) {
        target = document.querySelector('[data-drupal-selector="' + elementParents[n].getAttribute('data-drupal-selector') + '"]');
      }

      if (target) {
        $(target).trigger('focus');
      }
    }

    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.attachBehaviors(this.$form.get(0), settings);
    }

    this.settings = null;
  };

  Drupal.Ajax.prototype.getEffect = function (response) {
    var type = response.effect || this.effect;
    var speed = response.speed || this.speed;

    var effect = {};
    if (type === 'none') {
      effect.showEffect = 'show';
      effect.hideEffect = 'hide';
      effect.showSpeed = '';
    } else if (type === 'fade') {
      effect.showEffect = 'fadeIn';
      effect.hideEffect = 'fadeOut';
      effect.showSpeed = speed;
    } else {
      effect.showEffect = type + 'Toggle';
      effect.hideEffect = type + 'Toggle';
      effect.showSpeed = speed;
    }

    return effect;
  };

  Drupal.Ajax.prototype.error = function (xmlhttprequest, uri, customMessage) {
    if (this.progress.element) {
      $(this.progress.element).remove();
    }
    if (this.progress.object) {
      this.progress.object.stopMonitoring();
    }

    $(this.wrapper).show();

    $(this.element).prop('disabled', false);

    if (this.$form && document.body.contains(this.$form.get(0))) {
      var settings = this.settings || drupalSettings;
      Drupal.attachBehaviors(this.$form.get(0), settings);
    }
    throw new Drupal.AjaxError(xmlhttprequest, uri, customMessage);
  };

  Drupal.theme.ajaxWrapperNewContent = function ($newContent, ajax, response) {
    return (response.effect || ajax.effect) !== 'none' && $newContent.filter(function (i) {
      return !($newContent[i].nodeName === '#comment' || $newContent[i].nodeName === '#text' && /^(\s|\n|\r)*$/.test($newContent[i].textContent));
    }).length > 1 ? Drupal.theme('ajaxWrapperMultipleRootElements', $newContent) : $newContent;
  };

  Drupal.theme.ajaxWrapperMultipleRootElements = function ($elements) {
    return $('<div></div>').append($elements);
  };

  Drupal.AjaxCommands = function () {};
  Drupal.AjaxCommands.prototype = {
    insert: function insert(ajax, response) {
      var $wrapper = response.selector ? $(response.selector) : $(ajax.wrapper);
      var method = response.method || ajax.method;
      var effect = ajax.getEffect(response);

      var settings = response.settings || ajax.settings || drupalSettings;

      var $newContent = $($.parseHTML(response.data, document, true));

      $newContent = Drupal.theme('ajaxWrapperNewContent', $newContent, ajax, response);

      switch (method) {
        case 'html':
        case 'replaceWith':
        case 'replaceAll':
        case 'empty':
        case 'remove':
          Drupal.detachBehaviors($wrapper.get(0), settings);
          break;
        default:
          break;
      }

      $wrapper[method]($newContent);

      if (effect.showEffect !== 'show') {
        $newContent.hide();
      }

      var $ajaxNewContent = $newContent.find('.ajax-new-content');
      if ($ajaxNewContent.length) {
        $ajaxNewContent.hide();
        $newContent.show();
        $ajaxNewContent[effect.showEffect](effect.showSpeed);
      } else if (effect.showEffect !== 'show') {
        $newContent[effect.showEffect](effect.showSpeed);
      }

      if ($newContent.parents('html').length) {
        $newContent.each(function (index, element) {
          if (element.nodeType === Node.ELEMENT_NODE) {
            Drupal.attachBehaviors(element, settings);
          }
        });
      }
    },
    remove: function remove(ajax, response, status) {
      var settings = response.settings || ajax.settings || drupalSettings;
      $(response.selector).each(function () {
        Drupal.detachBehaviors(this, settings);
      }).remove();
    },
    changed: function changed(ajax, response, status) {
      var $element = $(response.selector);
      if (!$element.hasClass('ajax-changed')) {
        $element.addClass('ajax-changed');
        if (response.asterisk) {
          $element.find(response.asterisk).append(' <abbr class="ajax-changed" title="' + Drupal.t('Changed') + '">*</abbr> ');
        }
      }
    },
    alert: function alert(ajax, response, status) {
      window.alert(response.text, response.title);
    },
    announce: function announce(ajax, response) {
      if (response.priority) {
        Drupal.announce(response.text, response.priority);
      } else {
        Drupal.announce(response.text);
      }
    },
    redirect: function redirect(ajax, response, status) {
      window.location = response.url;
    },
    css: function css(ajax, response, status) {
      $(response.selector).css(response.argument);
    },
    settings: function settings(ajax, response, status) {
      var ajaxSettings = drupalSettings.ajax;

      if (ajaxSettings) {
        Drupal.ajax.expired().forEach(function (instance) {

          if (instance.selector) {
            var selector = instance.selector.replace('#', '');
            if (selector in ajaxSettings) {
              delete ajaxSettings[selector];
            }
          }
        });
      }

      if (response.merge) {
        $.extend(true, drupalSettings, response.settings);
      } else {
        ajax.settings = response.settings;
      }
    },
    data: function data(ajax, response, status) {
      $(response.selector).data(response.name, response.value);
    },
    invoke: function invoke(ajax, response, status) {
      var $element = $(response.selector);
      $element[response.method].apply($element, _toConsumableArray(response.args));
    },
    restripe: function restripe(ajax, response, status) {
      $(response.selector).find('> tbody > tr:visible, > tr:visible').removeClass('odd even').filter(':even').addClass('odd').end().filter(':odd').addClass('even');
    },
    update_build_id: function update_build_id(ajax, response, status) {
      $('input[name="form_build_id"][value="' + response.old + '"]').val(response.new);
    },
    add_css: function add_css(ajax, response, status) {
      $('head').prepend(response.data);

      var match = void 0;
      var importMatch = /^@import url\("(.*)"\);$/gim;
      if (document.styleSheets[0].addImport && importMatch.test(response.data)) {
        importMatch.lastIndex = 0;
        do {
          match = importMatch.exec(response.data);
          document.styleSheets[0].addImport(match[1]);
        } while (match);
      }
    }
  };
})(jQuery, window, Drupal, drupalSettings);;
/**
 * @file
 * Extends methods from core/misc/ajax.js.
 */

(function ($, window, Drupal, drupalSettings) {

  /**
   * Attempts to find the closest glyphicon progress indicator.
   *
   * @param {jQuery|Element} element
   *   A DOM element.
   *
   * @returns {jQuery}
   *   A jQuery object.
   */
  Drupal.Ajax.prototype.findGlyphicon = function (element) {
    return $(element).closest('.form-item').find('.ajax-progress.glyphicon')
  };

  /**
   * Starts the spinning of the glyphicon progress indicator.
   *
   * @param {jQuery|Element} element
   *   A DOM element.
   * @param {string} [message]
   *   An optional message to display (tooltip) for the progress.
   *
   * @returns {jQuery}
   *   A jQuery object.
   */
  Drupal.Ajax.prototype.glyphiconStart = function (element, message) {
    var $glyphicon = this.findGlyphicon(element);
    if ($glyphicon[0]) {
      $glyphicon.addClass('glyphicon-spin');

      // Add any message as a tooltip to the glyphicon.
      if ($.fn.tooltip && drupalSettings.bootstrap.tooltip_enabled) {
        $glyphicon
          .removeAttr('data-toggle')
          .removeAttr('data-original-title')
          .removeAttr('title')
          .tooltip('destroy')
        ;

        if (message) {
          $glyphicon.attr('data-toggle', 'tooltip').attr('title', message).tooltip();
        }
      }

      // Append a message for screen readers.
      if (message) {
        $glyphicon.parent().append('<div class="sr-only message">' + message + '</div>');
      }
    }
    return $glyphicon;
  };

  /**
   * Stop the spinning of a glyphicon progress indicator.
   *
   * @param {jQuery|Element} element
   *   A DOM element.
   */
  Drupal.Ajax.prototype.glyphiconStop = function (element) {
    var $glyphicon = this.findGlyphicon(element);
    if ($glyphicon[0]) {
      $glyphicon.removeClass('glyphicon-spin');
      if ($.fn.tooltip && drupalSettings.bootstrap.tooltip_enabled) {
        $glyphicon
          .removeAttr('data-toggle')
          .removeAttr('data-original-title')
          .removeAttr('title')
          .tooltip('destroy')
        ;
      }
    }
  };

  /**
   * Sets the throbber progress indicator.
   */
  Drupal.Ajax.prototype.setProgressIndicatorThrobber = function () {
    var $element = $(this.element);

    // Find an existing glyphicon progress indicator.
    var $glyphicon = this.glyphiconStart($element, this.progress.message);
    if ($glyphicon[0]) {
      this.progress.element = $glyphicon.parent();
      this.progress.glyphicon = true;
      return;
    }

    // Otherwise, add a glyphicon throbber after the element.
    if (!this.progress.element) {
      this.progress.element = $(Drupal.theme('ajaxThrobber'));
    }
    if (this.progress.message) {
      this.progress.element.after('<div class="message">' + this.progress.message + '</div>');
    }

    // If element is an input DOM element type (not :input), append after.
    if ($element.is('input')) {
      $element.after(this.progress.element);
    }
    // Otherwise append the throbber inside the element.
    else {
      $element.append(this.progress.element);
    }
  };


  /**
   * Handler for the form redirection completion.
   *
   * @param {Array.<Drupal.AjaxCommands~commandDefinition>} response
   * @param {number} status
   */
  Drupal.Ajax.prototype.success = function (response, status) {
    if (this.progress.element) {

      // Stop a glyphicon throbber.
      if (this.progress.glyphicon) {
        this.glyphiconStop(this.progress.element);
      }
      // Remove the progress element.
      else {
        this.progress.element.remove();
      }

      // Remove any message set.
      this.progress.element.parent().find('.message').remove();
    }

    // --------------------------------------------------------
    // Everything below is from core/misc/ajax.js.
    // --------------------------------------------------------

    if (this.progress.object) {
      this.progress.object.stopMonitoring();
    }
    $(this.element).prop('disabled', false);

    // Save element's ancestors tree so if the element is removed from the dom
    // we can try to refocus one of its parents. Using addBack reverse the
    // result array, meaning that index 0 is the highest parent in the hierarchy
    // in this situation it is usually a <form> element.
    var elementParents = $(this.element).parents('[data-drupal-selector]').addBack().toArray();

    // Track if any command is altering the focus so we can avoid changing the
    // focus set by the Ajax command.
    var focusChanged = false;
    for (var i in response) {
      if (response.hasOwnProperty(i) && response[i].command && this.commands[response[i].command]) {
        this.commands[response[i].command](this, response[i], status);
        if (response[i].command === 'invoke' && response[i].method === 'focus') {
          focusChanged = true;
        }
      }
    }

    // If the focus hasn't be changed by the ajax commands, try to refocus the
    // triggering element or one of its parents if that element does not exist
    // anymore.
    if (!focusChanged && this.element && !$(this.element).data('disable-refocus')) {
      var target = false;

      for (var n = elementParents.length - 1; !target && n > 0; n--) {
        target = document.querySelector('[data-drupal-selector="' + elementParents[n].getAttribute('data-drupal-selector') + '"]');
      }

      if (target) {
        $(target).trigger('focus');
      }
    }

    // Reattach behaviors, if they were detached in beforeSerialize(). The
    // attachBehaviors() called on the new content from processing the response
    // commands is not sufficient, because behaviors from the entire form need
    // to be reattached.
    if (this.$form) {
      var settings = this.settings || drupalSettings;
      Drupal.attachBehaviors(this.$form.get(0), settings);
    }

    // Remove any response-specific settings so they don't get used on the next
    // call by mistake.
    this.settings = null;
  };

})(jQuery, this, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  function mapTextContentToAjaxResponse(content) {
    if (content === '') {
      return false;
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      return false;
    }
  }

  function bigPipeProcessPlaceholderReplacement(index, placeholderReplacement) {
    var placeholderId = placeholderReplacement.getAttribute('data-big-pipe-replacement-for-placeholder-with-id');
    var content = this.textContent.trim();

    if (typeof drupalSettings.bigPipePlaceholderIds[placeholderId] !== 'undefined') {
      var response = mapTextContentToAjaxResponse(content);

      if (response === false) {
        $(this).removeOnce('big-pipe');
      } else {
        var ajaxObject = Drupal.ajax({
          url: '',
          base: false,
          element: false,
          progress: false
        });

        ajaxObject.success(response, 'success');
      }
    }
  }

  var interval = drupalSettings.bigPipeInterval || 50;

  var timeoutID = void 0;

  function bigPipeProcessDocument(context) {
    if (!context.querySelector('script[data-big-pipe-event="start"]')) {
      return false;
    }

    $(context).find('script[data-big-pipe-replacement-for-placeholder-with-id]').once('big-pipe').each(bigPipeProcessPlaceholderReplacement);

    if (context.querySelector('script[data-big-pipe-event="stop"]')) {
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
      return true;
    }

    return false;
  }

  function bigPipeProcess() {
    timeoutID = setTimeout(function () {
      if (!bigPipeProcessDocument(document)) {
        bigPipeProcess();
      }
    }, interval);
  }

  bigPipeProcess();

  $(window).on('load', function () {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
    bigPipeProcessDocument(document);
  });
})(jQuery, Drupal, drupalSettings);;
