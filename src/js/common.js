(function() {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/

	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;

		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;

		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;

		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;

		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;

		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;

		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;

		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if(FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() {
				return method.apply(context, arguments);
			};
		}

		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for(var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if(deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if(!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if(type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if(type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if(!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if(typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	 * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	 *
	 * @type boolean
	 */
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;

	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;

	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);

	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch(target.nodeName.toLowerCase()) {

			// Don't send a synthetic click to disabled inputs (issue #62)
			case 'button':
			case 'select':
			case 'textarea':
				if(target.disabled) {
					return true;
				}

				break;
			case 'input':

				// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
				// if((deviceIsIOS && target.type === 'file') || target.disabled) {
				if((deviceIsIOS) || target.disabled) {
					return true;
				}

				break;
			case 'label':
			case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
			case 'video':
				return true;
		}

		return(/\bneedsclick\b/).test(target.className);
	};

	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch(target.nodeName.toLowerCase()) {
			case 'textarea':
				return true;
			case 'select':
				return !deviceIsAndroid;
			case 'input':
				switch(target.type) {
					case 'text':
					case 'password':
					case 'search':
					case 'button':
					case 'checkbox':
					case 'file':
					case 'image':
					case 'radio':
					case 'submit':
						return false;
				}

				// No point in attempting to focus disabled inputs
				return !target.disabled && !target.readOnly;
			default:
				return(/\bneedsfocus\b/).test(target.className);
		}
	};

	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if(document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if(deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};

	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if(deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month' && targetElement.type !== 'email') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};

	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if(!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if(parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if(scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};

	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if(eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};

	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if(event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if(deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if(selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if(!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if(touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};

	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0],
			boundary = this.touchBoundary;

		if(Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};

	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if(!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if(this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};

	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if(labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if(labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};

	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if(!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if(deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if(targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if(forElement) {
				this.focus(targetElement);
				if(deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if(this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if(!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if(deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if(scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if(!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};

	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};

	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if(!this.targetElement) {
			return true;
		}

		if(event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if(!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if(!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if(event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};

	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if(this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if(event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if(!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};

	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if(deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};

	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if(typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

		if(chromeVersion) {

			if(deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if(metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if(metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if(chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

				// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if(deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if(blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if(metaViewport) {
					// user-scalable=no eliminates click delay.
					if(metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if(document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if(layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1];

		if(firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if(metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if(layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};

	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};

	if(typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if(typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

Array.prototype.find || (Array.prototype.find = function(fn) {
	var item;
	if(fn && this.some(function(_item, _index) {
			if(fn(_item, _index)) {
				item = _item;
				return true
			}
		})) {
		return item;
	}
});

Array.prototype.fill || (Array.prototype.fill = function(_item) {
	var _list = [];
	for(var _i = 0; _i < this.length; _i++)
		_list.push(_item);
	return _list;
});

Array.prototype.findIndex || (Array.prototype.findIndex = function(fn) {
	var index = -1;
	if(fn && this.some(function(_item, _index) {
			if(fn(_item, _index)) {
				index = _index;
				return true;
			}
		})) {
		return index;
	}
});

var app = angular.module("MdTong", []);

app.config(function($sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
		// Allow same origin resource loads.
		'self',
		// Allow loading from our assets domain.  Notice the difference between * and **.
		'http://api.map.baidu.com/**'
	]);
});

//点击事件300毫秒延迟问题
app.run(function() {
	FastClick.attach(document.body);
	mui.os.ios && angular.element(document.querySelector("head")).append(angular.element("<style type='text/css'>").html("*{ -webkit-user-select:auto !important; }"));
});

var localPath = getRootPath();
var actionSheet = null;
//获取系统根路径
function getRootPath() {
	return [].map.call(document.getElementsByTagName("script"), function(_script) {
		return _script.src;
	}).find(function(_url) {
		return !!_url && (/js\/common\.js$/g).test(_url);
	}).replace("/js/common.js", "");
}

app.service("ApiService", [function() {
	var url = {};
	var init = function(isTest) {
		var host = location.host;
				var _server = "https://www.maidiyun.com";
        		var origin_url = {
        			Api30: _server + "/30",
        			Api31: _server + "/31",
        			Api40: _server + "/40",
        			Api42: _server + "/42",
        			Api43: _server + "/43",
        			Api45: _server + "/45",
        			Api47: _server + "/47",
        			Api50: _server + "/50",
        			Api52: _server + "/50",
        			Api64: _server + "/64",
        			ApiJ: "http://apij.maidiyun.com",
        			Tools: "https://tools.maidiyun.com",
        			Img: "https://image.maidiyun.com",
        			Pic: "https://pic.maidiyun.com",
        			Down: "https://down.maidiyun.com",
        			CRM: "http://apicrm.maidiyun.com",
        			M: "http://m.maidiyun.com",
        			MdBox: "http://mdbox.maidiyun.com",
        			Boiler: "http://st.iot.maidiyun.com/sitong",
        			Pan: "http://api63.maidiyun.com",
        			Mall:"http://www.giftmall.top"
        		};

		var _url = angular.extend({}, origin_url);
		angular.extend(url, _url);
	};
	init();
	url.setTest = init;
	return url;
}]);
app.factory('CacheService', [
	function() {
		return {
			get: function(key, _isfull) {
				var _data;
				_data = window.sessionStorage.getItem(key);
				if(_data !== null) {
					return JSON.parse(_data);
				}
				_data = window.localStorage.getItem(key);
				if(_data === null) {
					return undefined;
				} else {
					return _isfull ? JSON.parse(_data) : JSON.parse(_data)["data"];
				}
			},
			set: function(key, data, local) {
				if(local) {
					var temp_data = {
						"data": data,
						"timestamp": Date.now()
					};
					window.localStorage.setItem(key, JSON.stringify(temp_data));
				} else {
					window.sessionStorage.setItem(key, JSON.stringify(data));
				}
			},
			remove: function(key) {
				window.sessionStorage.removeItem(key);
				window.localStorage.removeItem(key);
			}
		}
	}
]);

app.factory('DataService', ['CacheService', '$http', '$q', 'ApiService', "Loading", function(CacheService, $http, $q, ApiService, Loading) {
	function $ajax(_type, _url, _data, options) {
		var defer = $q.defer();
		if(isNetWorkCanUse()) {
			var successFn = function(data) {
				var _data = data.data;
				if(_data) {
					if(options && typeof options.adapter === "function") {
						_data = options.adapter(_data);
					}
					if(_url.indexOf('CheckMdCode') >= 0) {
						defer.resolve(_data);
					} else {
						if(_data.State === 1) {
							defer.resolve(_data.Data);
						} else {
							errorFn(_data);
						}
					}
				} else {
					errorFn("发生未知错误");
				}
			};

			var errorFn = function(error) {
				error.State == 0 && mui.toast(error.ErrorMessage, {
					duration: 1300,
					type: 'div'
				});
				error.status == -1 && (error.State = error.status);
				Loading.hide();
				if((defer.promise.$$state.pending || []).some(function(_pending) {
						return !!_pending[2];
					})) {
					defer.reject(error);
				}
			};
			var token;
			var userinfo = CacheService.get("user");
			if(userinfo) {
				token = userinfo.Token;
			}
			var params = {
				method: _type,
				url: _url,
				data: _data,
				timeout: 60000
			};
			token && (params.headers = {
				"Authorization": "Bearer " + token
			});
			$http(params).then(successFn, errorFn);
		} else {
			Loading.hide();
			defer.reject({
				State: -1
			});
		}
		return defer.promise;
	}

	return {
		jsonp: function(url) {
			var defer = $q.defer();
			$http.jsonp(url, {
				callback: "JSON_CALLBACK"
			}).then(function(response) {
				if(response && response.data) {
					defer.resolve(response.data);
				}
			});
			return defer.promise;
		},
		get: function(_url, options) {
			return $ajax("get", _url, null, options)
		},
		post: function(_url, _data, options) {
			return $ajax("post", _url, _data, options)
		},
		listToTree: function(_list, primary_field, parent_field) {
			_list.forEach(function(_node) {
				_node.children = _list.filter(function(_children) {
					return _children[parent_field || "parent_id"] === _node[primary_field || "id"]
				});
				(_node.is_leaf = _node.children.length === 0) && (delete _node.children);
			});
			return _list.filter(function(_node) {
				return !_node[parent_field || "parent_id"]
			});
		}
	}
}]);

app.factory('AuthService', ['ApiService', 'DataService', 'CacheService', '$q', "$compile", "$rootScope", "$Modal",
	function(ApiService, DataService, CacheService, $q, $compile, $rootScope, $Modal) {
		return {
			getAuth: function(loginUser) {
				var defer = $q.defer();
				var userinfo = CacheService.get("user");
				if(!userinfo) {
					$Modal.modal({
							template: "<md-login data-callback='loginSuccess' data-ismodal='true' login-user=" + JSON.stringify(loginUser) + "></md-login>",
							controller: ['$scope',
								function($scope) {
									$scope.loginSuccess = function(user) {
										$scope.$modal.resolve(user);
										$scope.$modal.close();
									};
								}
							]
						}).footer(false).show()
						.then(function(userinfo) {
							if(!userinfo)
								defer.reject("");
							else {
								RpcClient.invoke("message.html", "RPC_Login", userinfo);
								defer.resolve(userinfo);
							}
						});
				} else {
					defer.resolve(userinfo);
				}
				return defer.promise;
			},
			login: function(username, password) {
				var loginType = mui.os.android ? "2" : "3";
				return DataService.get(ApiService.Api50 + '/api/v1/User/Login?loginType=' + loginType + '&userId=' + username + '&password=' + encodeURIComponent(password.trim()));
			},
			logout: function() {
				var defer = $q.defer();
				CacheService.remove('user');
				RpcClient.invoke("message.html", "RPC_Logout", null);
				defer.resolve();
				return defer.promise;
			},
			getVerifyCode: function(phone) {
				return DataService.get(ApiService.Api50 + '/api/v1/User/SendCode?phone=' + phone);
			},
			loginUserByPhone: function(phone, code, type) {
				var loginType = mui.os.android ? "2" : "3";
				return DataService.get(ApiService.Api50 + '/api/v1/User/LoginUserByPhone?loginType=' + loginType + '&phone=' + phone + '&code=' + code + "&codeType=" + type || "");
			},
			updateLoginDate: function() {
				return DataService.get(ApiService.Api50 + '/api/v1/User/UpdateLoginDate');
			},
			getOrgList: function(parentId) {
				return DataService.get(ApiService.Api50 + '/api/v1/Org/GetOrgList?parentId=' + parentId);
			},
			getUserListByOrgId: function(orgId) {
				return DataService.get(ApiService.Api50 + '/api/v1/Org/GetUserListByOrgId?orgId=' + orgId);
			},
			getUserSwitchList: function() {
				var loginType = mui.os.android ? "2" : "3";
				return DataService.get(ApiService.Api50 + '/api/v1/User/UserSwitchList?loginType=' + loginType);
			},
			getUserAuth: function() {
				return DataService.get(ApiService.Api50 + '/api/v1/User/GetUserAuth');
			},
			getMenuAuth: function() {
				return DataService.get(ApiService.Api50 + '/api/v1/YunModule/MdtGetModuleAuthority?isMdt=1');
			},
			getYunModuleAuthority: function() {
				return DataService.get(ApiService.Api52 + '/api/v1/YunModule/GetCompModuleList');
			}
		}
	}
]);

app.factory('ProdService', ['ApiService', 'DataService', 'CacheService', '$q', "$compile", "$rootScope",
	function(ApiService, DataService, CacheService, $q, $compile, $rootScope) {
		return {
			getPkgList: function(prodName, sid, pageIndex, pageSize) {
				return DataService.get(ApiService.Api45 + '/api/v1.1/Prod/GetPkgList?ProdName=' + prodName + '&SID=' + '&SortType=1&isDescending=true&page=' + pageIndex + '&pageSize=' + pageSize);
			},
			getProdSelectParams: function(prodId) {
				return DataService.get(ApiService.Api45 + '/api/v1.1/Prod/GetProdSelectParams?ProdID=' + prodId);
			},
			FilterSkuByParams: function(prodId, postData) {
				return DataService.post(ApiService.Api45 + '/api/v1.1/Prod/FilterSkuByParams?prodId=' + prodId, postData);
			}
		}
	}
]);

app.factory('BillService', ['ApiService', 'DataService', 'CacheService', '$q', "$compile", "$rootScope", "UtilsService", "$filter",
	function(ApiService, DataService, CacheService, $q, $compile, $rootScope, UtilsService, $filter) {
		var user = CacheService.get("user");

		return {
			dataDirLevel: function(billkey, pid) {
				return DataService.get(ApiService.Api47 + '/api/v1/Data/DataDirLevel?billKey=' + billkey + "&pid=" + pid);
			},
			openView: function(funckey, dataId, params, options) {
				DataService.get(ApiService.Api47 + '/api/v1/Bill/GetBillSkinInfoByFuncKey?funcKey=' + funckey + '&compId=' + user.CompID + '&client=2').then(function(_ret) {
					var viewAction = _ret.Actions.find(function(_action) {
						return _action.ActionKey.indexOf('View.') >= 0;
					});
					if(viewAction) {
						var skinkey = viewAction.ActionKey.split('.').slice(-1)[0];
						//跳转
						var billUrl = localPath + "/pages/common/bill-view.html?skinkey=" + skinkey + "&dataid=" + dataId + "&funckey=" + funckey;
						(!options || options.hasOperateAuth) && (billUrl += "&srchkey=" + _ret.SkinKey);
						params && Object.keys(params).forEach(function(prop) {
							params[prop] && (billUrl = $filter('addUrlParam')(billUrl, prop, params[prop]));
						});

						UtilsService.openWindow({
							needLogin: true,
							url: billUrl,
							id: "bill-view.html"
						});
					} else {
						mui.toast('配置错误');
					}
				});
			},
			openEdit: function(funckey, params, extras) {
				DataService.get(ApiService.Api47 + '/api/v1/Bill/GetBillSkinInfoByFuncKey?funcKey=' + funckey + '&compId=' + user.CompID + '&client=2').then(function(_ret) {
					var addAction = _ret.Actions.find(function(_action) {
						return _action.ActionKey.indexOf('Add.') >= 0;
					});
					if(addAction) {
						var skinkey = addAction.ActionKey.split('.').slice(-1)[0];
						//跳转
						var billUrl = localPath + "/pages/common/bill-edit.html?skinkey=" + skinkey + "&funckey=" + funckey;
						params && Object.keys(params).forEach(function(prop) {
							params[prop] && (billUrl = $filter('addUrlParam')(billUrl, prop, params[prop]));
						});

						var options = {
							needLogin: true,
							url: billUrl,
							id: "bill-edit.html"
						};
						extras && (options.extras = extras);
						UtilsService.openWindow(options);
					} else {
						mui.toast('配置错误');
					}
				});
			}
		}
	}
]);

app.factory("UtilsService", ["$q", "ApiService", "AuthService", "$Modal", "Loading", "MapService", "LocationService", "$filter", "$rootScope", "DataService", "CacheService",
	function($q, ApiService, AuthService, $Modal, Loading, MapService, LocationService, $filter, $rootScope, DataService, CacheService) {
		//拍照
		var captureImage = function() {
			if(!checkPermission("CAMERA")) {
				return false;
			}
			var defer = $q.defer();

			var camera = plus.camera.getCamera();
			camera.captureImage(function(e) {
				defer.resolve("file://" + plus.io.convertLocalFileSystemURL(e));
			}, function(error) {
				defer.reject(error);
			});

			return defer.promise;
		};

		var MIN_SOUND_TIME = 800; //最少录音时长
		var recorder = null; //录音对象
		var startTimestamp = null; //开始时间
		var stopTimestamp = null; //结束时间
		var audioLength = 0; //录音时长
		var currentfile = null; //当前播放文件路径

		var isCreatedEle = false; //是否已经创建录音节点
		var soundAlert; //录音弹出框
		var audioTips; //录音弹出框提示

		var player = null;
		var timeoutid = 0;
		var audioDir = "_doc/audio/";
		var _mask;

		//开始录音
		function startRecordAudio(callbackFun) {
			if(!checkPermission("RECORD")) {
				return false;
			}
			// 获取当前设备的录音对象
			recorder = plus.audio.getRecorder();

			if(recorder == null) {
				alert("录音对象未获取");
				return;
			}

			//创建录音效果
			if(isCreatedEle == false) {
				createRecordWindow();
				isCreatedEle = true;
			}

			$rootScope.$broadcast("stop_audio");

			_mask.show();
			//弹出显示录音
			soundAlert.style.display = 'block';
			soundAlert.style.opacity = 1;

			//记录开始时间
			startTimestamp = (new Date()).getTime();

			//超时自动停止
			timeoutid = setTimeout(function() {
				mui.toast("最长只能录制60秒！");
				stopRecordAudio();
			}, 60000);

			//录音设置
			recorder.record({
				format: "amr",
				filename: audioDir
			}, function(path) {
				//录音成功
				stopTimestamp = (new Date()).getTime();

				if((stopTimestamp - startTimestamp) < 1000) {
					mui.toast("录音时长太短，请长按录音！");
					return;
				}
				audioLength = Math.ceil((stopTimestamp - startTimestamp) / 1000);
				currentfile = path.replace(audioDir, "");
				if(audioLength > 60) {
					audioLength = 60;
				}
				return callbackFun(audioLength, currentfile, path);
			}, function(e) {
				//录音失败
				//alert("录音出现异常: " + e.message);
				console.log(e.message);
			});
		}
		//停止录音
		function stopRecordAudio() {
			clearTimeout(timeoutid);
			//移除录音效果
			hideRecordWindow();
			//停止录音
			recorder.stop();
		}
		//创建弹出窗口
		function createRecordWindow() {

			if(!_mask) {
				_mask = mui.createMask(); //callback为用户点击蒙版时自动执行的回调；
				_mask[0].classList.add("mui-backdrop-transparency");
			}

			var divRecord = document.createElement("div");
			divRecord.setAttribute("id", "sound-alert");
			divRecord.setAttribute("class", "rprogress");

			var divChedule = document.createElement("div");
			divChedule.setAttribute("class", "rschedule");
			divRecord.appendChild(divChedule);

			var divSigh = document.createElement("div");
			divSigh.setAttribute("class", "r-sigh");
			divSigh.innerHTML = "!";
			divRecord.appendChild(divSigh);

			var divSigh = document.createElement("div");
			divSigh.setAttribute("id", "audio-tips");
			divSigh.setAttribute("class", "rsalert");
			divSigh.innerHTML = "正在录音，请讲话";
			divRecord.appendChild(divSigh);

			document.body.appendChild(divRecord);

			soundAlert = document.getElementById("sound-alert"); //录音弹出框
			audioTips = document.getElementById("audio-tips"); //录音弹出框提示
		}
		//移除录音效果窗口
		function hideRecordWindow() {
			if(!soundAlert) {
				return;
			}
			soundAlert.style.opacity = 0;
			soundAlert.style.display = "none";

			_mask.close();
		}
		//播放本地录音
		function playLocalAudio(path) {
			var defer = $q.defer();

			//如果当前有播放的录音，则要暂停
			if(player) {
				player.stop();
				player = null;
			}
			player = plus.audio.createPlayer(path);
			player.play(function() {
				player.stop();
				player = null;
				defer.resolve();
			}, function(e) {
				player.stop();
				player = null;
				defer.reject(e);
			});
			return defer.promise;
		}

		//停止播放录音
		function stopLocalAudio() {
			//如果当前有播放的录音，则要暂停
			if(player) {
				player.stop();
				player = null;
			}
		}

		function startVideoCapture() {
			if(!checkPermission("CAMERA")) {
				return false;
			}
			var defer = $q.defer();
			setTimeout(function() {
				plus.nativeUI.toast("视频拍摄长度请控制在20秒以内", {
					duration: "long",
					verticalAlign: "top"
				});
			}, 500);
			var cmr = plus.camera.getCamera();
			var res = cmr.supportedVideoResolutions[0];
			var fmt = cmr.supportedVideoFormats[0];
			cmr.startVideoCapture(function(path) {
					defer.resolve(path);
				},
				function(error) {
					defer.reject(error);
				}, {
					resolution: res,
					format: fmt
				}
			);
			return defer.promise;
		}

		var _view = null;

		function openWindow(win, user) {

			if(_view) {
				return null;
			}

			if(win.createNew == false) {
				var _win = plus.webview.getWebviewById(win.id);
				if(_win) {
					mui.openWindow(_win);
					return;
				}
			}

			var _aniShow = "pop-in",
				_duration = 160;
			if(mui.os.android) {
				if(parseFloat(mui.os.version) < 4.4) {
					_aniShow = "slide-in-right";
				} else {
					_duration = 250;
				}
			} else {
				_duration = 300;
			}
			win.needLogin && (win.url = win.url.replace(/{(.+?)}/g, function($0, $1) {
				return user.hasOwnProperty($1) ? user[$1] : "";
			}));

			win.extras && (win.extras.needLogin = win.needLogin);
			!win.extras && (win.extras = {
				needLogin: win.needLogin
			})

			var options = {
				id: win.id,
				url: win.url,
				show: {
					aniShow: _aniShow,
					duration: _duration
				},
				styles: {
					popGesture: "none"
				},
				waiting: {
					autoShow: false
				},
				extras: win.extras,
				createNew: true
			};
			if(mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0 && (win.url.indexOf("chat.html") < 0 || win.url.indexOf("chat-group.html") < 0)) {
				options.styles.hardwareAccelerated = false;
			}
			_view = mui.openWindow(options);

			_view.addEventListener("close", function() {
				_view = null;
			});

			return _view;
		}

		function clearCurView() {
			_view = null;
		}

		function downloadFile(serverPath, loacalPath, domId) {

			var processContainer;
			if(domId) {
				processContainer = mui("#" + domId + " .attach-process");
				processContainer.length == 0 && (processContainer = null);
			}

			if(processContainer) {
				processContainer.progressbar({
					progress: 0
				}).show()
			}

			var defer = $q.defer();
			var _url = ApiService.Api50 + "/api/v1/File/DownLoadFile?filePath=" + serverPath;
			var _task = plus.downloader.createDownload(_url, {
				filename: loacalPath
			}, function(d, status) {
				if(processContainer) {
					processContainer.progressbar({
						progress: 100
					}).hide();
				}

				if(status === 200) {
					defer.resolve(d);
				} else {
					if((defer.promise.$$state.pending || []).some(function(_pending) {
							return !!_pending[2];
						})) {
						defer.reject("文件下载失败，请重试");
					}
				}
			});
			_task.start();
			if(processContainer) {
				_task.addEventListener("statechanged", function(download, status) {
					if(download.state == 3) {
						var progress = download.downloadedSize / download.totalSize * 100;
						progress = Math.round(progress);
						processContainer.progressbar().setProgress(progress);
					}
				}, false);
			}
			return defer.promise;
		}

		function getVideoPath(path) {
			var defer = $q.defer();
			// 获取原始文件大小
			plus.io.resolveLocalFileSystemURL(path, function(entry) {
				// 限制上传视频文件大小不能超过50M
				entry.file(function(file) {
					var fsize = file.size / Math.pow(2, 20);
					if(fsize > 30) {
						mui.alert("所选视频文件大小不能超过30M");
						defer.reject("所选视频文件大小不能超过30M");
					} else {
						var tempPath = plus.io.convertLocalFileSystemURL(path).replace('file://', '');
						defer.resolve({
							FileGuid: "",
							FileName: path.substring(path.lastIndexOf('/') + 1, path.indexOf('.')),
							FilePath: tempPath,
							FileExt: tempPath.substr(tempPath.lastIndexOf('.') + 1, tempPath.length - tempPath.lastIndexOf('.')),
							FileSize: 0,
							FileType: 3
						});
					}
				});
			}, function(error) {
				defer.reject(error);
			});

			return defer.promise;
		}

		function getFileSize(path) {
			var defer = $q.defer();
			plus.io.resolveLocalFileSystemURL(path, function(entry) {
				entry.file(function(file) {
					defer.resolve({
						path: path,
						size: file.size
					});
				});
			}, function(e) {
				defer.reject(e);
			});

			return defer.promise;
		}

		function zipImage(src) {
			var reg = new RegExp('(.{' + src.lastIndexOf('.') + '})');
			var zipFile = src.replace(reg, '$1_zip');
			var zipExt = zipFile.substr(zipFile.lastIndexOf('.') + 1, zipFile.length - zipFile.lastIndexOf('.'));
			var zipPath = zipFile.substr(0, zipFile.lastIndexOf('/') + 1) + $filter("uuid")() + "." + zipExt;
			//				zipPath = plus.io.PUBLIC_DOWNLOADS+"/_zipImages/"+ $filter("uuid")() + "." + zipExt;
			var defer = $q.defer();
			plus.zip.compressImage({
				src: src,
				dst: zipPath,
				overwrite: true,
				width: "20%",
				quality: 60
			}, function(e) {
				defer.resolve({
					src: src,
					zip_src: zipPath
				});
			}, function(e) {
				defer.reject(e);
			});
			return defer.promise;
		}

		return {
			init: function() {

			},
			getLocation: function() {
				var defer = $q.defer();
				// 如果本地定位不可取,则通过定位模块重新定位
				if(mui.os.ios) {
					plus.geolocation.getCurrentPosition(function(p) {
						var location = {};
						if(JSON.stringify(p.address) !== "{}") {
							location.lat = p.coords.latitude;
							location.lng = p.coords.longitude;
							MapService.geoLngLatToBaidu(location.lng, location.lat, p.coordsType).then(function(bdres) {
								MapService.geoDeCoder(location.lat, location.lng, p.coordsType).then(function(res) {
									location.province = res.province;
									location.city = res.city;
									location.district = res.district;
									location.address = res.address;
									location.street = res.street;
									defer.resolve(location);
								}, function() {
									defer.reject();
								});
							})
						} else {
							defer.reject();
						}
					}, function(e) {
						defer.reject(e);
					});
				} else {
					plus.geolocation.getCurrentPosition(function(p) {
						var location = {};
						if(JSON.stringify(p.address) !== "{}") {
							location.lat = p.coords.latitude;
							location.lng = p.coords.longitude;
							MapService.geoDeCoder(location.lat, location.lng, p.coordsType).then(function(res) {
								location.province = res.province;
								location.city = res.city;
								location.district = res.district;
								location.address = res.address;
								location.street = res.street;
								defer.resolve(location);
							}, function() {
								defer.reject();
							});
						} else {
							defer.reject();
						}
					}, function(e) {
						defer.reject(e);
					}, {
						coordsType: "bd09ll",
						provider: 'baidu'
					});
				}
				return defer.promise;
			},
			uploadImage: function(localFile, extName) {
				var fileName = localFile.substr(localFile.lastIndexOf('/') + 1, localFile.length - localFile.lastIndexOf('/'));
				var defer = $q.defer();
				var url = ApiService.Api50 + "/api/v1/File/UploadTempPic?ext=" + extName;
				var task = plus.uploader.createUpload(url, {
					method: "post"
				}, function(t, status) {
					if(status == 200 && JSON.parse(t.responseText).State == 1) {
						defer.resolve(t);
					} else {
						defer.reject(t);
					}
				});
				task.addFile(localFile, {
					key: fileName
				});
				task.start();

				return defer.promise;
			},
			chooseImage: function(isMulti, length, onlycamera, isSys) {
				var defer = $q.defer();
				if(isMulti == undefined) {
					isMulti = true;
				}
				var UserCompID = CacheService.get("user") ? CacheService.get("user").CompID : 0;
				var buttons = onlycamera && UserCompID == 266 ? [{
					title: "拍照"
				}] : [{
					title: "拍照"
				}, {
					title: "从相册选择照片"
				}];
				actionSheet = plus.nativeUI.actionSheet({
					title: "添加照片",
					cancel: "取消",
					buttons: buttons
				}, function(e) {
					switch(e.index) {
						case 1:
							//拍摄照片
							captureImage().then(function(imgPath) {
								//获取图片大小
								getFileSize(imgPath).then(function(file) {
									//压缩图片
									zipImage(imgPath).then(function(zipImg) {
										defer.resolve([{
											FileGuid: "",
											FileName: imgPath.substr(imgPath.lastIndexOf('/') + 1, imgPath.lastIndexOf('.')),
											FilePath: imgPath,
											FileExt: imgPath.substr(imgPath.lastIndexOf('.') + 1, imgPath.length - imgPath.lastIndexOf('.')),
											FileSize: file.size,
											FileType: 1,
											FileSmall: zipImg.zip_src
										}]);
									}, function(error) {
										defer.reject(error);
									});
								}, function(error) {
									defer.reject(error);
								})
							}, function(error) {
								defer.reject(error);
							});
							break;
						case 2:
							//相册选取
							pickImage(function(res) {
								if(res) {
									var temp = [];
									var _promise = [];
									//先获取图片大小
									res.forEach(function(img) {
										_promise.push(getFileSize(img));
									});
									$q.all(_promise).then(function(files) {
										Loading.show();
										//图片压缩
										var _prom = [];
										files.forEach(function(file) {
											temp.push({
												FileGuid: "",
												FileName: file.path.substr(file.path.lastIndexOf('/') + 1, file.path.lastIndexOf('.')),
												FilePath: file.path,
												FileExt: file.path.substr(file.path.lastIndexOf('.') + 1, file.path.length - file.path.lastIndexOf('.')),
												FileSize: file.size,
												FileType: 1,
											});
											_prom.push(zipImage(file.path));
										});

										$q.all(_prom).then(function(zipImgs) {
											zipImgs.forEach(function(zImg) {
												temp.every(function(t, idx) {
													if(zImg.src === t.FilePath) {
														t.FileSmall = zImg.zip_src;
														return false;
													} else
														return true;
												});
											});
											Loading.hide();
											defer.resolve(temp);
										}, function(error) {
											Loading.hide();
											defer.reject(error);
										})
									}, function(error) {
										defer.reject(error);
									});
								} else
									defer.reject();
							}, isMulti, length, isSys);
							break;
					}
				});

				//选择照片
				function pickImage(callback, isMulti, length, isSys) {
					if(plus.os.name == "Android") {
						if(isMulti == undefined) {
							isMulti = true;
						}
						plus.gallery.pick(function(e) {
							if(typeof callback == "function") {
								var ret = isMulti ? e.files : [].concat(e);
								callback(ret);
							}
						}, function(e) {
							if(typeof callback == "function") {
								callback(false);
							}
						}, {
							filter: "image",
							multiple: isMulti,
							maximum: length || 30,
							system: isSys ? true : false,
							onmaxed: function(e) {
								plus.nativeUI.toast('最多只能选择' + (length || 30) + '张图片');
							}
						});
					} else {
						plus.Push.pickImage(isMulti, function(data) {
							var ret = data.split(",") || [];
							if(typeof callback == "function") {
								callback(ret);
							}
						});
					}
				}

				return defer.promise;
			},
			captureImage: captureImage,
			previewImage: function(_obj) {
				//{urls:[],current:""}
			},
			scanQRCode: function() {
				var defer = $q.defer();
				$Modal.modal({
						controller: ['$scope',
							function($scope) {
								var scan = "";
								setTimeout(function() {
									scan = new plus.barcode.Barcode('bcid');
									scan.onmarked = onmarked;
									scan.start();
								}, 100);

								//二维码扫描成功
								function onmarked(type, result, file) {
									if(file && type == "QR_CODE" && plus.os.name == "Android") {
										type = 0;
										result = result.substring(1, (result.length - 1));
									}
									switch(type) {
										case plus.barcode.QR:
											type = "QR";
											break;
										case plus.barcode.EAN13:
											type = "EAN13";
											break;
										case plus.barcode.EAN8:
											type = "EAN8";
											break;
										default:
											type = "其它" + type;
											break;
									}
									result = result.replace(/\n/g, '');

									scan.close();
									$scope.$modal.resolve({
										type: type,
										result: result
									});
									$scope.$modal.close();
								}
								$scope.cancel = function() {
									scan.close();
									$scope.$modal.close();
								};

								$scope.scanImage = function() {
									var time = new Date().getTime();
									plus.gallery.pick(function(path) {
										var newTime = new Date().getTime();

										if((newTime - time) > 1200) {
											plus.barcode.scan(path, onmarked, function(error) {
												plus.nativeUI.alert("无法识别此图片");
											});
										} else {
											plus.nativeUI.alert("请返回重新选择相册");
										}

									}, function(err) {
										//		plus.nativeUI.alert("Failed: " + err.message);
									}, {
										filter: "image"
									});
								};
							}
						],
						template: '<div class="scan">' +
							'<div id="bcid"></div>' +
							'<div class="btns"><span class="font-15" ng-click="cancel()">取消</span><span class="font-15" ng-click="scanImage()">从相册选择二维码</span></div>' +
							'</div>'
					})
					.footer(false)
					.show()
					.then(function(res) {
						defer.resolve(res);
					});

				return defer.promise;
			},
			getNetworkType: function() {
				var defer = $q.defer();
				var netStateStr = '未知';
				var types = {};
				types[plus.networkinfo.CONNECTION_UNKNOW] = "未知";
				types[plus.networkinfo.CONNECTION_NONE] = "未连接网络";
				types[plus.networkinfo.CONNECTION_ETHERNET] = "有线网络";
				types[plus.networkinfo.CONNECTION_WIFI] = "WiFi网络";
				types[plus.networkinfo.CONNECTION_CELL2G] = "2G蜂窝网络";
				types[plus.networkinfo.CONNECTION_CELL3G] = "3G蜂窝网络";
				types[plus.networkinfo.CONNECTION_CELL4G] = "4G蜂窝网络";
				netStateStr = types[plus.networkinfo.getCurrentType()];
				defer.resolve(netStateStr);
				return defer.promise;
			},
			startRecordAudio: function(callbackFun) {
				startRecordAudio(callbackFun);
			},
			stopRecordAudio: function() {
				stopRecordAudio();
			},
			playLocalAudio: function(localName) {
				var defer = $q.defer();
				//文件是否存在，存在则直接播放
				plus.io.resolveLocalFileSystemURL(audioDir + localName, function(e) {
					playLocalAudio(audioDir + localName).then(function() {
						defer.resolve();
					});
				}, function(error) {
					defer.reject(error);
				});

				return defer.promise;
			},

			//停止播放录音
			stopLocalAudio: stopLocalAudio,

			//添加视频
			recordVideo: function() {
				if(!checkPermission("CAMERA")) {
					return false;
				}
				var defer = $q.defer();
				//现场录制						
				setTimeout(function() {
					plus.nativeUI.toast("视频拍摄长度最长20秒", {
						duration: "long",
						verticalAlign: "top"
					});
				}, 500);
				if(mui.os.android) {
					plus.Push.videoAndPhotoCapture(function(path) {
						var tempPath = plus.io.convertLocalFileSystemURL(path);
						defer.resolve({
							FileGuid: "",
							FileName: tempPath.substring(tempPath.lastIndexOf('/') + 1, tempPath.lastIndexOf('.')),
							FilePath: "file://" + tempPath,
							FileExt: tempPath.substr(tempPath.lastIndexOf('.') + 1, tempPath.length - tempPath.lastIndexOf('.')),
							FileSize: 0,
							FileType: 3
						});
					});
				} else {
					plus.Push.recordVideo(function(path) {
						var tempPath = plus.io.convertLocalFileSystemURL(path);
						defer.resolve({
							FileGuid: "",
							FileName: tempPath.substring(tempPath.lastIndexOf('/') + 1, tempPath.lastIndexOf('.')),
							FilePath: "file://" + tempPath,
							FileExt: tempPath.substr(tempPath.lastIndexOf('.') + 1, tempPath.length - tempPath.lastIndexOf('.')),
							FileSize: 0,
							FileType: 3
						});
					});
				}
				return defer.promise;

			},
			//开始录像
			startVideoCapture: function() {
				startVideoCapture();
			},
			//停止
			stopVideoCapture: function() {
				// cmr.stopVideoCapture();
			},
			//获取视频长度
			getVideoTime: function(videoId) {
				var defer = $q.defer();

				var flag = 0;
				var i = setInterval(function() {
					if(flag == 100) {
						clearInterval(i);
						defer.resolve(0);
						return;
					}

					var vDom = document.getElementById(videoId);
					// 这里注意, 必须判断视频的 readyState。
					// 如果有可能没加载完，则获取到的视频时长信息是不正确的。
					if(vDom && vDom.readyState > 0) {
						if(vDom.duration == Infinity) {
							return;
						}

						//						// 计算,10进制，以及取模
						//						var minutes = parseInt(vDom.duration / 60, 10);
						//						var seconds = Math.round(vDom.duration % 60);
						//						minutes = minutes < 10 ? '0' + minutes : minutes;
						//						seconds = seconds < 10 ? '0' + seconds : seconds;
						//						var length = minutes + ":" + seconds;
						// 将循环定时器清除
						clearInterval(i);
						defer.resolve(vDom.duration.toFixed(0));
					}

					flag++;
				}, 200);
				return defer.promise;
			},
			//获取视频截图
			getVideoImg: function(videoId) {
				var defer = $q.defer();
				var video = document.getElementById(videoId);
				var i = setInterval(function() {
					// 这里注意, 必须判断视频的 readyState。
					// 如果有可能没加载完，则获取到的视频时长信息是不正确的。
					if(video && video.readyState > 0) {
						if(video.duration == Infinity) {
							return;
						}

						var scale = 0.25;
						var canvas = document.createElement("canvas");
						canvas.width = video.videoWidth * scale;
						canvas.height = video.videoHeight * scale;
						canvas.getContext('2d')
							.drawImage(video, 0, 0, canvas.width, canvas.height);

						defer.resolve(canvas.toDataURL("image/png"));
						// 将循环定时器清除
						clearInterval(i);
					}
				}, 200);
				return defer.promise;
			},
			playVideo: function(videoId, videoPath) {
				Loading.show();
				var v = document.getElementById(videoId);
				if(!v && videoPath) {
					v = {};
					v.src = videoPath;
				}
				var scale = 0.25;
				Loading.hide();
				plus.Push.playVideo(v.src, videoId);

				//					});
				//					//					v.play();
				//					//					v.addEventListener('playing', function () {
				//					//						Loading.hide();
				//					//						//视频缩略图
				//					//						var canvas = document.createElement("canvas");
				//					//						canvas.width = v.videoWidth * scale;
				//					//						canvas.height = v.videoHeight * scale;
				//					//						canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
				//					//					}, true);
				//				}
			},
			openWindow: function(options) {
				if(options.needLogin) {
					AuthService.getAuth().then(function(res) {
						return openWindow(options, res);
					});
				} else {
					return openWindow(options);
				}
			},
			clearWindow: function() {
				return clearCurView();
			},
			uploadFileBill: function(localFile, fileType) {
				var defer = $q.defer();
				if(!isNetWorkCanUse()) {
					defer.resolve(null);
					return defer.promise;
				}
				var fileName = localFile.substr(localFile.lastIndexOf('/') + 1, localFile.length - localFile.lastIndexOf('/'));
				var fileExt = localFile.substr(localFile.lastIndexOf('.'), localFile.length);
				var url = ApiService.Api47 + '/api/v1/BillFile/FileUpload?fileType=' + fileType;
				var task = plus.uploader.createUpload(url, {
					method: "post"
				}, function(t, status) {
					if(status == 200) {
						var temp = JSON.parse(t.responseText);
						if(temp.State == 1 && temp.Data.length) {
							//返回原文件名
							if(temp.Data[0].FileName && encodeURI(fileName).indexOf(temp.Data[0].FileName >= 0)) {
								temp.Data[0].FileName = fileName;
							}
							defer.resolve(temp.Data[0]);
						} else {
							defer.resolve(null);
						}
					} else {
						defer.resolve(null);
					}
				});
				task.addFile(localFile, {
					key: $filter("uuid")() + fileExt,
					name: $filter("uuid")() + fileExt
				});
				task.start();
				return defer.promise;
			},
			uploadFileTemp: function(localFile, fileType) {
				var defer = $q.defer();
				if(!isNetWorkCanUse()) {
					defer.resolve(null);
					return defer.promise;
				}
				var fileName = localFile.substr(localFile.lastIndexOf('/') + 1, localFile.length - localFile.lastIndexOf('/'));
				var fileExt = localFile.substr(localFile.lastIndexOf('.'), localFile.length);
				var url = ApiService.Api50 + '/api/v1/File/UploadTempPic';
				var task = plus.uploader.createUpload(url, {
					method: "post"
				}, function(t, status) {
					if(status == 200) {
						var temp = JSON.parse(t.responseText);
						if(temp.State == 1 && temp.Data.length) {
							defer.resolve(temp.Data);
						} else {
							defer.resolve(null);
						}
					} else {
						defer.resolve(null);
					}
				});
				task.addFile(localFile, {
					key: $filter("uuid")() + fileExt,
					name: $filter("uuid")() + fileExt
				});
				task.start();
				return defer.promise;
			},
			uploadFile: function(options) {
				if(!options.funcKey)
					options.funcKey = 'MdtFile';

				var processContainer;
				if(options.domId) {
					processContainer = mui("#" + options.domId + " .attach-process");
					processContainer.length == 0 && (processContainer = null);
				}

				if(processContainer) {
					processContainer.progressbar({
						progress: 0
					}).show()
				}
				var fileName = options.localFile.substr(options.localFile.lastIndexOf('/') + 1, options.localFile.length - options.localFile.lastIndexOf('/'));
				var defer = $q.defer();
				var action = (options.fileType == 1) ? "UploadPic" : "UploadFile";
				var url = ApiService.Api50 + "/api/v1/File/" + action + "?funcKey=" + options.funcKey;
				var task = plus.uploader.createUpload(url, {
					method: "post"
				}, function(t, status) {

					if(processContainer) {
						processContainer.progressbar({
							progress: 100
						}).hide();
					}

					if(options.tempId)
						t.tempId = options.tempId;
					if(status == 200 && JSON.parse(t.responseText).State == 1) {
						defer.resolve(t);
					} else {
						defer.reject(t);
					}
				});
				task.addFile(options.localFile, {
					key: encodeURI(fileName),
					name: encodeURI(fileName)
				});
				task.start();

				if(processContainer) {
					task.addEventListener("statechanged", function(upload, status) {
						if(upload.state == 3) {
							var progress = upload.uploadedSize / upload.totalSize * 100;
							progress = Math.round(progress);
							processContainer.progressbar().setProgress(progress);
						}
					}, false);
				}

				return defer.promise;
			},
			downLoadFile: function(serverPath, loacalPath, domId) {
				return downloadFile(serverPath, loacalPath, domId);
			},
			downLoadAudio: function(serverPath, localName) {
				return downloadFile(serverPath, audioDir + localName);
			},
			getAddress: function(addr, needPos, maxLength) {
				var defer = $q.defer();
				$Modal.modal({
						params: {
							address: addr,
							needPos: needPos ? needPos : false,
							maxLength: maxLength ? maxLength : 50,
						},
						template: "<div class='md-address-map'><img src='{{localUrl}}/js/pages/location.png' class='location'><div id='map'></div><div class='address_detailed'><div class='sltArea'><span ng-click='mobile.selectArea(0)'>{{location.province||'选择省'}} <i class='icon-down'></i></span><span ng-click='mobile.selectArea(1)'>{{location.city||'选择市'}} <i class='icon-down'></i></span><span ng-click='mobile.selectArea(2)'>{{location.district||'选择区'}} <i class='icon-down'></i></span></div><i class='icon-location color-blue'></i><input type='text' placeholder='输入详细位置' ng-model='location.address' style='margin-top: 7px;margin-bottom:0px' maxlength='{{params.maxLength}}' /></div></div>",
						controller: "addressMap"
					}).footer(true).show()
					.then(function(address) {
						defer.resolve(address);
					});
				return defer.promise;
			},
			selectOrg: function(sltOrgId) {
				var defer = $q.defer();
				$Modal.modal({
						params: {
							orgid: sltOrgId,
						},
						template: "<md-select-org orgid='params.orgid' callback='selectOrg'></md-select-org>",
						controller: ['$scope',
							function($scope) {
								$scope.selectOrg = function(org) {
									$scope.$modal.resolve(org);
									$scope.$modal.close();
								};
							}
						]
					}).footer(false).show()
					.then(function(org) {
						defer.resolve(org);
					});
				return defer.promise;
			},
			sltOwnOrgUsers: function(myorgid, selected, ismulit) {
				var defer = $q.defer();
				$Modal.modal({
						params: {
							selected: (selected && selected.length) ? selected : [],
							myorgid: myorgid,
							ismulit: ismulit ? ismulit : 0
						},
						template: "<md-my-org-user myorgid='params.myorgid' selected='params.selected' ismulit='params.ismulit'></md-my-org-user>",
						controller: ['$scope',
							function($scope) {
								//传入的参数：$scope.params
								$scope.$modal.callback = function() {
									$scope.$modal.resolve($scope.params.selected);
									$scope.$modal.close();
								};
							}
						]
					}).footer(true).show()
					.then(function(users) {
						defer.resolve(users);
					});
				return defer.promise;
			},
			sltAllOrgUsers: function(selected, ismulit) {
				var defer = $q.defer();
				$Modal.modal({
						params: {
							selected: (selected && selected.length) ? selected : [],
							ismulit: ismulit ? ismulit : 0
						},
						template: "<md-all-org-user selected='params.selected' ismulit='params.ismulit'></md-all-org-user>",
						controller: ['$scope',
							function($scope) {
								//传入的参数：$scope.params
								$scope.$modal.callback = function() {
									$scope.$modal.resolve($scope.params.selected);
									$scope.$modal.close();
								};
							}
						]
					}).footer(true).show()
					.then(function(users) {
						defer.resolve(users);
					});
				return defer.promise;
			},
			selectProdSku: function() {
				var defer = $q.defer();
				$Modal.modal({
						params: {

						},
						template: "<md-prod-sku callback='sltSku'></md-prod-sku>",
						controller: ['$scope',
							function($scope) {
								//传入的参数：$scope.params
								$scope.sltSku = function(prodSku) {
									$scope.$modal.resolve(prodSku);
									$scope.$modal.close();
								};
							}
						]
					}).footer(false).show()
					.then(function(prodSku) {
						defer.resolve(prodSku);
					});
				return defer.promise;
			},
			selectBillDir: function(billkey, selectid) {
				var defer = $q.defer();
				$Modal.modal({
						params: {
							billkey: billkey,
							selectid: selectid
						},
						template: "<md-select-bill-dir selectid='params.selectid' billkey='params.billkey' callback='selectDir'></md-select-bill-dir>",
						controller: ['$scope',
							function($scope) {
								$scope.selectDir = function(dir) {
									$scope.$modal.resolve(dir);
									$scope.$modal.close();
								};
							}
						]
					}).footer(false).show()
					.then(function(dir) {
						defer.resolve(dir);
					});
				return defer.promise;
			},
			saveModal: function(listfn, editfn) {
				var template = '<div style="margin:-20px -10px"><md-save-menus data-list-fn="callback(\'list\')"';
				editfn && (template += ' data-edit-fn="callback(\'edit\')"');
				template += ' data-is-show-edit="' + !!editfn + '"></md-save-menus></div>';
				$Modal.modal({
					size: "small",
					region: "middle",
					footer: false,
					template: template,
					controller: ['$scope', function($scope) {
						$scope.callback = function(key) {
							$scope.$modal.resolve();
							$scope.$modal.close();
							if(key == 'list') {
								listfn();
							} else {
								editfn();
							}
						}
					}]
				}).show();
			},
			submitModal: function(process, listfn, editfn, backfn) {
				process.SaveState = 2;
				var template_success = '<md-save-menus class="submit-modal-template submit-modal-template-success" data-list-fn="callback(\'list\')" ng-model="params.process"';
				editfn && (template_success += ' data-edit-fn="callback(\'edit\')"');
				template_success += ' data-is-show-edit="' + !!editfn + '"></md-save-menus>';
				var template_process = '<md-notice class="submit-modal-template submit-modal-template-process" ng-model="params.process" data-back-fn="callback(\'back\')"></md-notice>';

				$Modal.modal({
					size: "small",
					region: "middle",
					footer: false,
					params: {
						process: process
					},
					template: ['<style>',
						'.submit-modal-template{display:none;}',
						'.submit-modal-state-2 .submit-modal-template-process,.submit-modal-state-1 .submit-modal-template-success{display:block;}',
						'</style>',
						'<div class="submit-modal" ng-class="\'submit-modal-state-\'+params.process.SaveState">',
						template_success,
						template_process,
						"</div>"
					].join(""),
					controller: ['$scope', function($scope) {
						$scope.callback = function(key) {
							$scope.$modal.resolve();
							$scope.$modal.close();
							if(key == 'list') {
								listfn();
							} else if(key == 'back') {
								backfn();
							} else {
								editfn();
							}
						}
					}]
				}).show();
			},
			actionSheet: function(title, buttons) {
				var defer = $q.defer();
				actionSheet = plus.nativeUI.actionSheet({
					title: "请选择" + title,
					cancel: "取消",
					buttons: buttons
				}, function(e) {
					var index = e.index;
					if(index > 0) {
						var selectObj = buttons[index - 1];
						defer.resolve(selectObj, actionSheet);
					}
				});
				return defer.promise;
			},
			backConfirm: function(title, buttons) {
				var defer = $q.defer();
				var old_back_fun = mui.back;
				mui.back = function() {
					if(isEdit()) {
						mui.confirm("您已编辑过，退出将丢失掉这些内容！", "提示", ["确认返回", "我再想想"], function(e) {
							if(e.index == 0) {
								old_back_fun();
							} else {
								defer.resolve();
							}
						});
					} else {
						old_back_fun();
					}
				};
				return defer.promise;
			},
			zipImage: zipImage,
			shareMsg: function(obj, selectUsers) {
				var defer = $q.defer();
				var msg = '';
				$Modal.modal({
					size: "small",
					region: "botttom",
					footer: false,
					params: {
						obj: obj,
						users: selectUsers,
						msg: msg
					},
					template: "<md-share-msg obj='params.obj' users='params.users' callback='getMsg'></md-share-msg>",
					controller: ['$scope', function($scope) {
						$scope.getMsg = function(res) {
							if(res.result) {
								$scope.$modal.resolve(res);
							}
							$scope.$modal.close();
						}
					}]
				}).show().then(function(res) {
					//确定分享
					defer.resolve(res.msg);
				});
				return defer.promise;
			},
			selectProvCity: function(selected) {
				var defer = $q.defer();
				$Modal.modal({
					size: "small",
					region: "middle",
					autoClose: true,
					footer: false,
					params: {
						selected: selected,
					},
					template: "<md-select-prov-city selected='params.selected' callback='getRes'></md-select-prov-city>",
					controller: ['$scope', function($scope) {
						$scope.getRes = function(res) {
							if(res.result) {
								$scope.$modal.resolve(res);
							}
							$scope.$modal.close();
						}
					}]
				}).show().then(function(res) {
					//确定分享
					if(res.location.province == "全国")
						res.location.province = "";
					if(res.location.city == "全部")
						res.location.city = "";
					defer.resolve(res.location);
				});
				return defer.promise;
			},
			selectArea: function(location) {
				var defer = $q.defer();
				$Modal.modal({
					size: "small",
					region: "middle",
					footer: false,
					autoClose: true,
					params: {
						location: location
					},
					template: "<md-select-city loct='params.location' callback='getCity'></md-select-city>",
					controller: ['$scope', function($scope) {
						$scope.getCity = function(res) {
							if(res.result) {
								$scope.$modal.resolve(res);
								$scope.$modal.close();
							} else {
								$scope.$modal.close();
							}
						}
					}]
				}).show().then(function(res) {
					defer.resolve(res.location);
				});
				return defer.promise;
			},
			//返回默认抄送人
			getDefaultRecipient: function() {
				var defer = $q.defer();
				var _url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetWorkLogSendUser";
				DataService.get(_url).then(function(res) {
					defer.resolve(res);
				}, function(error) {
					defer.reject(error);
				})
				return defer.promise;
			},
			//回复modal
			replyModal: function(length, content, placeholder) {
				var defer = $q.defer();
				var mui_back = mui.back;
				mui.back = function() {
					if(isModal) {
						$Modal.close();
					} else {
						mui_back();
					}
				}
				var isModal = false;
				$Modal.modal({
					size: "small",
					autoClose: true,
					footer: false,
					params: {
						placeholder: placeholder,
						maxLength: length,
						replayContent: content || "",
					},
					template: "<div class='replyModal'><textarea class='replay-input needsclick' ng-model='params.replayContent' onkeyup='value=value.replace(/[\ud800-\udbff][\udc00-\udfff]/g,\"\")' placeholder='{{params.placeholder}}'></textarea><span class='mui-btn mui-btn-block' ng-click='getContent()'>保存</span></div>",
					controller: ['$scope', '$element', function($scope, $element) {
						isModal = true;
						$scope.$on("modal_close", function() {
							isModal = false;
						});
						setTimeout(function() {
							document.querySelector("textarea").addEventListener("tap", function() {
								this && this.focus();
							})
						}, 400);
						$scope.getContent = function() {
							if($scope.params.replayContent.trim().length == 0) {
								mui.toast($scope.params.placeholder);
								return;
							}
							if($scope.params.maxLength && ($scope.params.replayContent.trim().length > $scope.params.maxLength)) {
								mui.toast("回复内容仅允许" + $scope.params.maxLength + "个字以内");
								return;
							}
							defer.resolve($scope.params.replayContent);
							$scope.$modal.close();
						}
					}]
				}).show();
				return defer.promise;
			},
			comentModal: function(length, content, placeholder) {
				var defer = $q.defer();
				var mui_back = mui.back;
				mui.back = function() {
					if(isModal) {
						$Modal.close();
					} else {
						mui_back();
					}
				}
				var isModal = false;
				$Modal.modal({
					size: "small",
					autoClose: true,
					footer: false,
					params: {
						placeholder: placeholder,
						maxLength: length,
						replayContent: content || "",
					},
					template: "<div class='replyModal'><textarea class='replay-input needsclick' ng-model='params.replayContent' onkeyup='value=value.replace(/[\ud800-\udbff][\udc00-\udfff]/g,\"\")' placeholder='{{params.placeholder}}'></textarea><span class='mui-btn mui-btn-block' ng-click='getContent()'>评论</span></div>",
					controller: ['$scope', '$element', function($scope, $element) {
						isModal = true;
						$scope.$on("modal_close", function() {
							isModal = false;
							//							mui("#pullrefresh").pullRefresh().setStopped(false)
							//							var curr = plus.webview.currentWebview();  
							//                          curr.setPullToRefresh({  
							//                          support: true,  
							//                          style: 'circle'  
							//                      }); 
							window.removeEventListener("touchmove", bodyScroll, {
								passive: false
							});
						});

						function bodyScroll(e) {
							//							mui("#pullrefresh").pullRefresh().setStopped(true)
							e.preventDefault(); //取消事件默认动作
							e.stopPropagation(); //不再派发事件
						}

						if(isModal) {

							window.addEventListener("touchmove", bodyScroll, {
								passive: false
							});
						} else {
							console.log(222)
							window.removeEventListener("touchmove", bodyScroll, {
								passive: false
							});
						}
						setTimeout(function() {
							document.querySelector("textarea").addEventListener("tap", function() {
								this && this.focus();
							})
						}, 400);
						$scope.getContent = function() {
							if($scope.params.replayContent.trim().length == 0) {
								mui.toast($scope.params.placeholder);
								return;
							}
							if($scope.params.maxLength && ($scope.params.replayContent.trim().length > $scope.params.maxLength)) {
								mui.toast("评论内容仅允许" + $scope.params.maxLength + "个字以内");
								return;
							}
							defer.resolve($scope.params.replayContent);
							$scope.$modal.close();
						}
					}]
				}).show();
				return defer.promise;
			}

		};
	}
]);

//跳转企业，企业秀还是企业信息页面
app.factory("TapService", ['UtilsService', 'CacheService',
	function(UtilsService, CacheService) {
		var user = CacheService.get('user');
		return {
			/**
			 *
			 * @param {Object} compid 要打开的企业编号
			 * @param {Object} index 企业详情页面第几个tab页面，从0开始
			 */
			openCoInfo: function(compid, index) {
				if(index === undefined) {
					index = 0;
				}
				if(user.CompID == compid) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'complib-index.html',
						url: '/src/pages/complib/index.html?compid=' + compid + '&tabidx=' + index
					});
				} else {
					UtilsService.openWindow({
						needLogin: true,
						id: 'compShow.html',
						url: '/src/pages/complib/compShow.html?compid=' + compid
					});
				}
			},
			/**
			 *
			 * @param {Object} prodid 选择的产品id
			 * @param {Object} prodCompId 选择的产品所在企业的id
			 */
			openProdInfo: function(prodId, prodCompId, isResource) {
				if(user.CompID == prodCompId) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodinfo-head.html',
						url: '/src/pages/problib/prodinfo-head.html?prodId=' + prodId + '&isResource=' + isResource
					});
				} else {
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodView.html',
						url: '/src/pages/problib/prodView.html?prodId=' + prodId + '&isResource=' + isResource
					});
				}
			}
		}
	}
]);
//选择省市
app.directive("mdSelectProvCity", [function() {
	return {
		restrict: "EA",
		scope: {
			selected: "=", //已选中的省市
			callback: "="
		},
		templateUrl: localPath + '/js/pages/mdSelectProvCity.html',
		controller: ["$scope", "UtilsService", "ApiService", "MapService", "$Modal", "LocationService", "Loading", function($scope, UtilsService, ApiService, MapService, $Modal, LocationService, Loading) {
			//位置信息
			$scope.location = {
				province: ($scope.selected && $scope.selected.province) || "",
				city: ($scope.selected && $scope.selected.city) || "",
				//district: ($scope.selected && $scope.selected.district) || "",
			};

			var source = "";
			//初始化省
			MapService.city().then(function(data) {
				source = data;
			});

			//移动端选择省市区
			$scope.selector = {
				//当前选择要加载的数据
				list: [],
				cityDisable: false,
				//选择省市区
				selectArea: function(type) {
					$scope.selector.list = [];
					if(!$scope.location.province)
						type = 0;

					var selected = "";
					switch(type) {
						case 0:
							$scope.selector.list.push("全国");
							for(var prov in source) {
								$scope.selector.list.push(prov);
							}
							selected = $scope.location.province;
							break;
						case 1:
							if($scope.selector.cityDisable)
								return;

							$scope.selector.list.push("全部");
							var count = 0;
							for(var city in source[$scope.location.province]) {
								$scope.selector.list.push(city);
								count++;
							}
							selected = $scope.location.city;
							break;
						case 2:
							for(var j = 0; j < source[$scope.location.province][$scope.location.city].length; j++) {
								$scope.selector.list.push(source[$scope.location.province][$scope.location.city][j]);
							}
							selected = $scope.location.district;
							break;
					}

					$Modal.modal({
							title: "请选择",
							size: "small",
							region: "middle",
							params: {
								list: $scope.selector.list,
								selected: selected,
							},
							template: "<div class='md-areas-modal'><span class='title'>城市选择<i class='icon-close' ng-click='cancel()'></i></span><div class='list'><span class='item' ng-class='{\"bgGray\":params.selected===item}' ng-click='selectItem(item)' ng-repeat='item in params.list'>{{item}}<i ng-class='{\"icon-roundcheckfill color-blue\":params.selected===item,\"icon-round color-gray\":params.selected!==item}'></i></span></div></div>",
							controller: ['$scope',
								function($scope) {
									$scope.selectItem = function(item) {
										$scope.params.selected = item;
										$scope.$modal.resolve(item);
										$scope.$modal.close();
									};

									$scope.cancel = function() {
										$scope.$modal.close();
									}
								}
							]
						}).footer(false).show()
						.then(function(selected) {
							switch(type) {
								case 0:
									if($scope.location.province != selected) {
										$scope.location.province = selected;
										$scope.location.city = "";
									}

									var count = 0;
									for(prov in source[$scope.location.province]) {
										count++;
									}
									if(count === 1) {
										$scope.location.city = selected;
										$scope.selector.cityDisable = true;
									} else if($scope.location.province == "全国") {
										$scope.selector.cityDisable = true;
									} else
										$scope.selector.cityDisable = false;
									break;
								case 1:
									if($scope.location.city != selected) {
										$scope.location.city = selected;
										//$scope.location.district = "";
									}
									break;
								case 2:
									if($scope.location.district != selected) {
										$scope.location.district = selected;
									}
									break;
							}
						});
				},
			};

			$scope.save = function() {
				if(!$scope.location.province) {
					mui.toast("请选择省");
					return false
				}
				if(!$scope.location.city && $scope.location.province != "全国") {
					mui.toast("请选择市");
					return false
				}

				//					if(!$scope.location.district && $scope.area.source[$scope.location.province][$scope.location.city].length) {
				//						mui.toast("请选择区");
				//						return false
				//					}				
				$scope.callback && $scope.callback({
					result: true,
					location: $scope.location
				});
			}

			$scope.cancel = function() {
				$scope.callback && $scope.callback({
					result: false
				});
			}
		}]
	}
}])

//选择地图省市区详细地址
app.directive("mdSelectCity", [function() {
	return {
		restrict: "EA",
		scope: {
			loct: "=", //位置信息
			callback: "="
		},
		templateUrl: localPath + '/js/pages/mdSelectCity.html',
		controller: ["$scope", "UtilsService", "ApiService", "MapService", "$Modal", "LocationService", "Loading", function($scope, UtilsService, ApiService, MapService, $Modal, LocationService, Loading) {
			//位置信息
			$scope.location = {
				type: $scope.loct.type, //0自动定位，1手动选择
				province: $scope.loct.province,
				city: $scope.loct.city,
				district: $scope.loct.district,
				address: $scope.loct.address,
				lng: $scope.loct.lng,
				lat: $scope.loct.lat
			};

			$scope.selectType = function(type) {
				$scope.location.type = type;
				$scope.location.province = '';
				$scope.location.city = '';
				$scope.location.district = '';
				$scope.location.address = '';
				$scope.location.lng = '';
				$scope.location.lat = '';
			}

			//选择省市区
			$scope.area = {
				source: "",
				list: [],
			};
			//初始化省
			MapService.city().then(function(data) {
				$scope.area.source = data;
				//初始化省份
				var i = 0;
				var temp = [];
				for(var prov in data) {
					if(i < 6) {
						temp.push(prov);
						i++;
					} else {
						$scope.area.list.push({
							items: temp,
							type: 0
						});
						temp = [];
						temp.push(prov);
						i = 1;
					}
				}
				if(temp.length)
					$scope.area.list.push({
						items: temp,
						type: 0
					});
			});

			//移动端选择省市区
			$scope.mobile = {
				//当前选择要加载的数据
				list: [],
				//当前选择的类型
				type: 0,
				//选择省市区
				selectArea: function(type) {
					$scope.mobile.list = [];
					if(!$scope.location.province)
						type = 0;

					var selected = "";
					switch(type) {
						case 0:
							for(var prov in $scope.area.source) {
								$scope.mobile.list.push(prov);
							}
							selected = $scope.location.province;
							break;
						case 1:
							for(var city in $scope.area.source[$scope.location.province]) {
								$scope.mobile.list.push(city);
							}
							selected = $scope.location.city;
							break;
						case 2:
							for(var j = 0; j < $scope.area.source[$scope.location.province][$scope.location.city].length; j++) {
								$scope.mobile.list.push($scope.area.source[$scope.location.province][$scope.location.city][j]);
							}

							selected = $scope.location.district;
							break;
					}

					if($scope.mobile.list.length == 0) {
						mui.toast("暂无数据", {
							duration: 1300,
							type: 'div'
						});
						return;
					}

					$Modal.modal({
							title: "请选择",
							size: "small",
							region: "middle",
							params: {
								list: $scope.mobile.list,
								selected: selected,
							},
							template: "<div class='md-areas-modal'><span class='title'>城市选择<i class='icon-close' ng-click='cancel()'></i></span><div class='list'><span class='item' ng-class='{\"bgGray\":params.selected===item}' ng-click='selectItem(item)' ng-repeat='item in params.list'>{{item}}<i ng-class='{\"icon-roundcheckfill color-blue\":params.selected===item,\"icon-round color-gray\":params.selected!==item}'></i></span></div></div>",
							controller: ['$scope',
								function($scope) {
									$scope.selectItem = function(item) {
										$scope.params.selected = item;
										$scope.$modal.resolve(item);
										$scope.$modal.close();
									};

									$scope.cancel = function() {
										$scope.$modal.close();
									}
								}
							]
						}).footer(false).show()
						.then(function(selected) {
							switch(type) {
								case 0:
									if($scope.location.province != selected) {
										$scope.location.province = selected;
										$scope.location.city = "";
										$scope.location.district = "";
										$scope.location.address = "";
									}

									var count = 0;
									for(prov in $scope.area.source[$scope.location.province]) {
										count++;
									}
									if(count === 1) {
										$scope.location.city = selected;
									}
									break;
								case 1:
									if($scope.location.city != selected) {
										$scope.location.city = selected;
										$scope.location.district = "";
										$scope.location.address = "";
									}
									break;
								case 2:
									if($scope.location.district != selected) {
										$scope.location.district = selected;
										$scope.location.address = "";
									}
									break;
							}

							if($scope.location.type == 0)
								$scope.location.type = 1;
						});
				},
			};

			$scope.save = function() {
				//自动定位
				if($scope.location.type == 0) {
					Loading.show();
					UtilsService.getLocation(true).then(function(location) {
						Loading.hide();
						$scope.location = {
							type: 0,
							province: location.province,
							city: location.city,
							district: location.district,
							address: location.address,
							lng: location.lng,
							lat: location.lat,
						};

						$scope.callback && $scope.callback({
							result: true,
							location: $scope.location
						});
					}, function() {
						mui.toast("请检查定位服务后再试");
						Loading.hide();
						$scope.callback && $scope.callback({
							result: false
						});
					});
				} else {
					if(!$scope.location.province) {
						mui.toast("请选择省");
						return false
					}
					if(!$scope.location.city) {
						mui.toast("请选择市");
						return false
					}

					if(!$scope.location.district && $scope.area.source[$scope.location.province][$scope.location.city].length) {
						mui.toast("请选择区");
						return false
					}

					var temp = $scope.location.province == $scope.location.city ? $scope.location.province : ($scope.location.province + $scope.location.city);
					if($scope.area.source[$scope.location.province][$scope.location.city].length) {
						temp += $scope.location.district;
					}
					Loading.show();
					MapService.geoCoder(temp).then(function(res) {
						Loading.hide();
						$scope.location.lng = res.lng;
						$scope.location.lat = res.lat;
						$scope.callback && $scope.callback({
							result: true,
							location: $scope.location
						});
					});
				}
			}

			$scope.cancel = function() {
				$scope.callback && $scope.callback({
					result: false
				});
			}
		}]
	}
}]);

//分享信息
app.directive("mdShareMsg", [function() {
	return {
		restrict: "EA",
		scope: {
			obj: "=",
			users: "=",
			callback: "="
		},
		templateUrl: localPath + '/js/pages/mdShareMsg.html',
		controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
			$scope.save = function() {
				$scope.callback && $scope.callback({
					result: true
				});
			}

			$scope.cancel = function() {
				$scope.callback && $scope.callback({
					result: false
				});
			}
		}]
	}
}]);

app.directive("mdCustomSelect", [function() {
	return {
		restrict: "EA",
		scope: {
			options: "="
		},
		templateUrl: localPath + '/js/pages/mdCustomSelect.html',
		controller: ["$scope", function($scope) {
			$scope.$watch("options.model." + $scope.options.nameField, function(_new, _old) {
				$scope.options.model[$scope.options.idField] && _new.trim().length == 0 && ($scope.options.model[$scope.options.idField] = "");
			});
			$scope.select = function() {

				if($scope.options.model[$scope.options.idField]) {
					$scope.options.model[$scope.options.idField] = "";
					$scope.options.model[$scope.options.nameField] = '';
					if($scope.options.clearfn) {
						$scope.options.clearfn();
					}
				} else {
					$scope.options.selectfn();
				}
			}
		}]
	}
}]);
app.directive("mdFaildescSelect", [function() {
	return {
		restrict: "EA",
		scope: {
			options: "="
		},
		templateUrl: localPath + '/js/pages/mdFaildescSelect.html',
		controller: ["$scope", function($scope) {
			$scope.$watch("options.model." + $scope.options.nameField, function(_new, _old) {
				$scope.options.model[$scope.options.idField] && _new.trim().length == 0 && ($scope.options.model[$scope.options.idField] = "");
			});
			$scope.select = function() {

				if($scope.options.model[$scope.options.idField]) {
					$scope.options.model[$scope.options.idField] = "";
					$scope.options.model[$scope.options.nameField] = '';
				} else {
					$scope.options.selectfn();
				}
			}
		}]
	}
}]);
//android发送推送
app.factory('PushService', ['ApiService', 'DataService', '$q',
	function(ApiService, DataService, $q) {
		return {
			sendMsgToAll: function(title, content) {
				return DataService.get(ApiService.Api50 + '/api/v1/Message/XingeAndroid_all_device?title=' + title + '&content=' + content);
			},
			sendMsgByAccount: function(account, title, content) {
				return DataService.get(ApiService.Api50 + '/api/v1/Message/XingeAndroid_single_account?title=' + title + '&content=' + content + '&account=' + account);
			},
			sendMsgByTag: function(tag, title, content) {
				return DataService.get(ApiService.Api50 + '/api/v1/Message/XingeAndroid_tags_device?title=' + title + '&content=' + content + '&tag=' + tag);
			},
			sendMsgByToken: function(devtoken, title, content) {
				return DataService.get(ApiService.Api50 + '/api/v1/Message/XingeAndroid_single_device?title=' + title + '&content=' + content + '&devtoken=' + devtoken);
			}
		};
	}
]);

//选择日期
app.factory('DatePickerService', ["$Modal", "$q", "$filter", function($Modal, $q, $filter) {

	function getDateRange(year, value, type, callback) {
		var startDate, endDate, view;
		var quarter = {
			"1": "一季度",
			"2": "二季度",
			"3": "三季度",
			"4": "四季度"
		};
		switch(type) {
			case 'year':
				startDate = new Date(year, 0, 1);
				endDate = new Date(year + 1, 0, 1);
				view = year + "年";
				break;
			case 'quarter':
				startDate = new Date(year, 1, 1).addMonths((value - 1) * 3 - 1);
				endDate = new Date(year, 1, 1).addMonths(value * 3 - 1);
				view = year + "年" + quarter[value];
				break;
			case 'month':
				startDate = new Date(year, value);
				endDate = new Date(year, value).addMonths(1);
				view = year + "年" + (value + 1) + "月";
				break;
		}
		callback(startDate, endDate, view);
	}

	return {
		pickDate: function(options) {
			var defer = $q.defer();
			var config = {
				title: "请选择日期",
				date: $filter("dateParse")(options.selected) || new Date()
			};
			options.minDate && (config.minDate = $filter("dateParse")(options.minDate));
			config.date < config.minDate && (config.date = config.minDate);
			plus.nativeUI.pickDate(function(e) {
				var selected = e.date.getFullYear() + "-" + ("0" + (e.date.getMonth() + 1)).slice(-2) + "-" + ("0" + (e.date.getDate())).slice(-2);
				defer.resolve(selected);
			}, function(e) {
				defer.reject();
			}, config);
			return defer.promise;
		},
		pickTime: function(options) {
			var defer = $q.defer();
			plus.nativeUI.pickTime(function(e) {
				var selected = ("0" + e.date.getHours()).slice(-2) + ":" + ("0" + (e.date.getMinutes())).slice(-2);
				defer.resolve(selected);
			}, function() {
				defer.reject();
			}, {
				title: "请选择时间",
				time: $filter("parseFormat")(options.selected, "HH:mm")
			});
			return defer.promise;
		},
		getDateRange: getDateRange,
		getTime: function(year, value, type, limit) {
			var defer = $q.defer();
			$Modal.modal({
					size: "small",
					region: "middle",
					autoClose: true,
					template: "<div class='timemodal'><div class='timetitle'><span class='icon-zuo timedec' ng-click='decreaseYear()'>" +
						"</span><div class='yearshow'>{{backvalue.year}}年</div><span class='icon-you timeinc' ng-click='increaseYear()'></span></div>" +
						"<table id='timetable' cellspacing='0' cellpadding='0'><tbody>" +
						"<tr ng-repeat='item in timelist'><td ng-repeat='x in item' ng-click='getCallBackDate(x.type,x.text,x.value)' ng-class=\"{'active':(x.type==curType&&backvalue.year==curYear&&backvalue.value==x.value)}\">{{x.text}}</td></tr>" +
						"</tbody></table></div>",
					controller: ['$scope', function($scope) {
						$scope.timelist = [
							[{
									'type': 'year',
									'text': '全年',
									'value': 'y'
								},
								{
									'type': 'quarter',
									'text': '一季度',
									'value': '1'
								},
								{
									'type': 'quarter',
									'text': '二季度',
									'value': '2'
								},
							],
							[{
									'type': 'quarter',
									'text': '三季度',
									'value': '3'
								},
								{
									'type': 'quarter',
									'text': '四季度',
									'value': '4'
								},
								{
									'type': ''
								},
							],
							[{
									'type': 'month',
									'text': '1月',
									'value': '0'
								},
								{
									'type': 'month',
									'text': '2月',
									'value': '1'
								},
								{
									'type': 'month',
									'text': '3月',
									'value': '2'
								},
							],
							[{
									'type': 'month',
									'text': '4月',
									'value': '3'
								},
								{
									'type': 'month',
									'text': '5月',
									'value': '4'
								},
								{
									'type': 'month',
									'text': '6月',
									'value': '5'
								},
							],
							[{
									'type': 'month',
									'text': '7月',
									'value': '6'
								},
								{
									'type': 'month',
									'text': '8月',
									'value': '7'
								},
								{
									'type': 'month',
									'text': '9月',
									'value': '8'
								},
							],
							[{
									'type': 'month',
									'text': '10月',
									'value': '9'
								},
								{
									'type': 'month',
									'text': '11月',
									'value': '10'
								},
								{
									'type': 'month',
									'text': '12月',
									'value': '11'
								},
							]
						];

						$scope.backvalue = {
							"year": "",
							"value": ""
						};

						$scope.curYear = year;
						$scope.curType = type;

						$scope.backvalue.year = year;
						$scope.backvalue.value = value;
						var realYear = parseInt(new Date().getFullYear());

						$scope.increaseYear = function() {
							if(limit && realYear - $scope.backvalue.year == 0) {
								mui.toast("只能查看最近" + limit + "年的数据");
								return
							}
							$scope.backvalue.year += 1;
						};
						$scope.decreaseYear = function() {
							if(limit && realYear - $scope.backvalue.year == limit - 1) {
								mui.toast("只能查看最近" + limit + "年的数据");
								return
							}
							$scope.backvalue.year -= 1;
						};
						$scope.getCallBackDate = function(type, text, value) {
							if(type == '') {
								return false;
							} else {

								var backData = {};
								backData.type = type;
								backData.year = $scope.backvalue.year;
								backData.value = value;
								backData.text = text;

								getDateRange(parseInt(backData.year), parseInt(value), type, function(startDate, endDate, view) {
									backData.startDate = startDate;
									backData.endDate = endDate;
									backData.view = view;
								});

							}
							$scope.$modal.resolve(backData);
							$scope.$modal.close();
						};

						$scope.ifAddClass = function() {
							if($scope.backvalue.year == '') {
								$scope.backvalue.year = new Date().getFullYear()
							}
						};
						$scope.selemm = $scope.ifAddClass();
					}]
				}).footer(false).show()
				.then(function(x) {
					defer.resolve(x);
				});
			return defer.promise;
		}
	};
}]);

app.directive("mdDatePicker", [
	function() {
		return {
			restrict: "E",
			scope: {
				options: "="
			},
			templateUrl: localPath + '/js/pages/mdDatePicker.html',
			controller: ["$scope", "DatePickerService", function($scope, DatePickerService) {
				//日期选择
				var newDate = new Date();
				$scope.view = newDate.getFullYear() + "年" + (newDate.getMonth() + 1) + "月"
				$scope.curDate = {
					curYear: newDate.getFullYear(),
					curValue: newDate.getMonth(),
					curType: "month"
				};
				$scope.options.callback($scope.curDate);
				var _date = $scope.curDate;
				$scope.event = {
					chooseDate: function() {
						DatePickerService.getTime(_date.curYear, _date.curValue, _date.curType, $scope.options.limit).then(function(data) {
							_date.curYear = data.year;
							_date.curType = data.type;
							_date.curValue = data.value;
							// _date.startDate = data.startDate;
							// _date.endDate = data.endDate;
							$scope.view = data.view;
							if(_date.curType == 'year') {
								$scope.isYearOrMonth = 1;
								$scope.dataMonth = 0;
							} else if(_date.curType == 'quarter') {
								$scope.isYearOrMonth = 2;
								$scope.dataMonth = _date.curValue;
							} else if(_date.curType == 'month') {
								$scope.isYearOrMonth = 3;
								$scope.dataMonth = parseInt(_date.curValue) + 1;
							}
							$scope.options.callback(_date);
						});
					},
					dateSub: function() {
						if(!$scope.event.dateLimit('sub')) {
							return;
						}
						switch(_date.curType) {
							case 'year':
								_date.curYear = parseInt(_date.curYear) - 1;
								$scope.dataYear = _date.curYear;
								break;
							case 'quarter':
								_date.curValue = parseInt(_date.curValue) - 1;
								if(_date.curValue == 0) {
									_date.curValue = 4;
									_date.curYear -= 1;
									$scope.dataYear = _date.curYear;
								}
								$scope.dataMonth = _date.curValue;
								break;
							case 'month':
								_date.curValue = parseInt(_date.curValue) - 1;
								if(_date.curValue == -1) {
									_date.curValue = 11;
									_date.curYear -= 1;
									$scope.dataYear = _date.curYear;
								}
								$scope.dataMonth = parseInt(_date.curValue) + 1;
								break;
						};
						$scope.event.getDateRange(function() {
							$scope.options.callback(_date);
						});

					},
					dateAdd: function() {
						if(!$scope.event.dateLimit('add')) {
							return;
						}
						switch(_date.curType) {
							case 'year':
								_date.curYear = parseInt(_date.curYear) + 1;
								$scope.dataYear = _date.curYear;
								break;
							case 'quarter':
								_date.curValue = parseInt(_date.curValue) + 1;
								if(_date.curValue == 5) {
									_date.curValue = 1;
									_date.curYear += 1;
									$scope.dataYear = _date.curYear;
								}
								$scope.dataMonth = _date.curValue;
								break;
							case 'month':
								_date.curValue = parseInt(_date.curValue) + 1;
								if(_date.curValue == 12) {
									_date.curValue = 0;
									_date.curYear += 1;
									$scope.dataYear = _date.curYear;
								}
								$scope.dataMonth = parseInt(_date.curValue) + 1;
								break;
						}
						$scope.event.getDateRange(function() {
							$scope.options.callback(_date);
						});
					},
					getDateRange: function(callback) {
						DatePickerService.getDateRange(parseInt(_date.curYear), parseInt(_date.curValue), _date.curType, function(startDate, endDate, view) {
							// _date.startDate = startDate;
							// _date.endDate = endDate;
							$scope.view = view;
							typeof callback == "function" && (callback());
						});
					},
					dateLimit: function(type) {
						var realYear = parseInt(newDate.getFullYear());
						var curYear = _date.curYear; //2017-12-08 11:09:49--20171208 00:00:00
						if(realYear - curYear == 0 && type == 'add') {
							// 季度 月份  年  加的时候 检查
							if(_date.curValue == 4 && _date.curType == "quarter" || _date.curValue == 11 && _date.curType == "month" || _date.curType == "year") {
								mui.toast("只能查看最近" + $scope.options.limit + "年的数据");
								return false;
							}
						}
						if(realYear - curYear == $scope.options.limit - 1 && type == 'sub') {
							if(_date.curValue == 1 && _date.curType == "quarter" || _date.curValue == 0 && _date.curType == "month" || _date.curType == "year") {
								mui.toast("只能查看最近" + $scope.options.limit + "年的数据");
								return false;
							}
						}
						return true
					}
				};
			}]
		}
	}
]);

app.directive("mdProdSku", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			sku: "=",
			callback: "="
		},
		templateUrl: localPath + '/js/pages/mdProdSku.html',
		controller: ["$scope", "ProdService", "Loading", "ApiService", "$Modal", function($scope, ProdService, Loading, ApiService, $Modal) {
			mui.init({
				pullRefresh: {
					container: '#pullrefresh',
					up: {
						auto: true,
						contentinit: '正在加载...',
						contentrefresh: '正在加载...',
						callback: pullupRefresh //上拉加载具体业务实现
					}
				}
			});

			$scope.imgUrl = ApiService.Img; //产品图片路径
			$scope.prodList = []; //产品列表
			$scope.totalCount = 0; //产品总数
			var pageIndex = 1;
			//上拉加载
			function pullupRefresh() {
				//setTimeout(function() {
				ProdService.getPkgList('', '', pageIndex, 10).then(function(res) {
					$scope.totalCount = res.TotalCount;
					if(res && res.DataRows.length) {
						$scope.prodList = $scope.prodList.concat(res.DataRows);
						pageIndex++;
					}
					mui('#pullrefresh').pullRefresh().endPullupToRefresh($scope.prodList.length === $scope.totalCount);
				}, function() {});
				//}, 300);
			}

			//pullupRefresh();

			$scope.openSku = function(prod) {
				$Modal.modal({
						footer: true,
						size: 'small',
						autoClose: true,
						params: {
							prodid: prod.ProdID,
							prodname: prod.ProdName,
							sku: ''
						},
						template: "<md-select-sku prodid='params.prodid' prodname='params.prodname' sku='params.sku'></md-select-sku>",
						controller: ['$scope',
							function($scope) {
								$scope.$modal.callback = function() {
									if(!$scope.params.sku.SkuID) {
										mui.toast("请选择型号！");
										return false;
									}
									$scope.$modal.resolve($scope.params.sku);
									$scope.$modal.close();
								};
							}
						]
					}).show()
					.then(function(sku) {
						$scope.callback && $scope.callback({
							ProdID: prod.ProdID,
							ProdName: prod.ProdName,
							SkuID: sku.SkuID,
							SkuName: sku.SkuName
						});
					});
			}
		}]
	}
}]);

app.directive("mdSelectSku", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			prodid: "=",
			prodname: "=",
			sku: "="
		},
		templateUrl: localPath + '/js/pages/mdSelectSku.html',
		controller: ["$scope", "ProdService", "Loading", "ApiService", function($scope, ProdService, Loading, ApiService) {
			//所有类型
			$scope.allParams = [];
			$scope.sku = {
				SkuID: '',
				SkuName: '',
			};
			//产品图片路径
			$scope.imgUrl = ApiService.Img;

			ProdService.getProdSelectParams($scope.prodid).then(function(res) {
				res.SelectParams.forEach(function(param) {
					param.Selected = [];
					var temp = [];
					param.Values.forEach(function(val) {
						temp.push({
							Value: val ? val : '空值',
							Disabled: val ? false : true,
							Selected: false
						});
					});
					param.Values = temp;
					$scope.allParams.push(param);
				});
			});

			//点击选择类型
			$scope.selectParam = function(param, value) {
				//如果当前项禁用，则退出
				if(value.Disabled)
					return;

				//如果当前项已经被选中，则要取消选中。否则再选中
				if(value.Selected) {
					param.Selected = param.Selected.filter(function(val) {
						return val != value.Value
					});
					value.Selected = false;
				} else {
					param.Selected.push(value.Value);
					value.Selected = true;
				}

				var postData = $scope.allParams.map(function(param) {
					return {
						ItemID: param.ItemID,
						ItemName: param.ItemName,
						Values: param.Selected
					};
				});

				ProdService.FilterSkuByParams($scope.prodid, postData).then(function(res) {
					if(res.Skus.length == 1)
						$scope.sku = {
							SkuID: res.Skus[0].SkuID,
							SkuName: res.Skus[0].SkuName,
						};
					else
						$scope.sku = {
							SkuID: '',
							SkuName: '',
						};

					//遍历判断每一项选中和禁用状态
					$scope.allParams.forEach(function(param) {
						res.SelectParams.every(function(temp) {
							if(param.ItemID !== temp.ItemID) {
								return true;
							}

							param.Values.forEach(function(val) {
								//判断当前值是否可用或者选中
								var flag = temp.Values.some(function(tValue) {
									return tValue == val.Value;
								});

								val.Disabled = !flag;

								//如果可用，并且只有一项，而且当前未选中时，要置为选中状态
								if(flag && temp.Values.length == 1 && !val.Selected) {
									//val.Selected = true;
								}
							});
							return false;
						});
					});

				});
			}
		}]
	}
}]);

app.directive("mdAllOrgUser", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			selected: "=",
			ismulit: "="
		},
		templateUrl: localPath + '/js/pages/mdAllOrgUser.html',
		controller: ["$scope", "AuthService", "Loading", function($scope, AuthService, Loading) {
			$scope.orgList = [];
			$scope.userList = [];
			$scope.loaded = false;
			//目录导航
			$scope.navDirData = [];

			$scope.loadOrgUserList = function(org, dirIdx) {
				$scope.loaded = false;

				if(dirIdx) {
					//如果是最后一项，直接退出
					if(dirIdx == $scope.navDirData.length - 1)
						return;

					//移除后续项
					$scope.navDirData.splice(dirIdx + 1, $scope.navDirData.length - dirIdx - 1);
				} else {
					//如果是点击的第一项，清空导航
					if(dirIdx == 0)
						$scope.navDirData.length = 0;

					$scope.navDirData.push({
						ID: org.ID,
						OrgName: org.OrgName
					});
				}

				if($scope.orgList.length)
					$scope.orgList.length = 0;
				if($scope.userList.length)
					$scope.userList.length = 0;

				resScroll();

				//获取子部门
				AuthService.getOrgList(org.ID).then(function(list) {
					$scope.orgList = list;
					$scope.loaded = true;
				}, function() {});

				//获取本部门人员
				setTimeout(function() {
					AuthService.getUserListByOrgId(org.ID).then(function(list) {
						list.forEach(function(user) {
							var temp = false;
							$scope.selected.filter(function(u) {
								if(u.UserID == user.UserID) {
									temp = true;
								}
							});
							user.selected = temp;
						});

						$scope.userList = list;
						$scope.loaded = true;
					}, function() {});
				}, 300);
			};

			$scope.loadOrgUserList({
				ID: 0,
				OrgName: "组织架构"
			});

			//导航栏滚动事件
			function resScroll() {
				setTimeout(function() {
					if(mui("#res-slide")[0]) {
						var width = mui("#res-slide")[0].clientWidth;
						var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
						scrollto = 0;
						if((scrollWidth + 35) < width || width == 0) {
							scrollto = 0;
						} else {
							scrollto = width - scrollWidth - 24;
						}
						mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
					}
				}, 100);
			}

			$scope.select = function(user) {
				user.selected = !user.selected;

				if($scope.ismulit == 1) {
					//追加或者移除已选中的人员
					if(user.selected) {
						$scope.selected.push(user);
					} else {
						var index = 0;
						$scope.selected.every(function(u, idx) {
							if(u.UserID == user.UserID) {
								index = idx;
								return true;
							} else
								return false;
						});
						$scope.selected.splice(index, 1);
					}
				} else {
					if($scope.selected.length == 1) {
						$scope.selected[0].selected = false;
						$scope.selected.length = 0;
					}
					if(user.selected) {
						$scope.selected.push(user);
					}
				}
			};
		}]
	}
}]);

app.directive("mdMyOrgUser", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			selected: "=",
			myorgid: "=",
			ismulit: "="
		},
		templateUrl: localPath + '/js/pages/mdMyOrgUser.html',
		controller: ["$scope", "AuthService", "Loading", function($scope, AuthService, Loading) {
			//Loading.show();			
			AuthService.getUserListByOrgId($scope.myorgid).then(function(list) {
				list.forEach(function(user) {
					var temp = false;
					$scope.selected.filter(function(u) {
						if(u.UserID == user.UserID) {
							temp = true;
						}
					});

					user.selected = temp;
				});

				$scope.userList = list;
				//Loading.hide();
			}, function() {
				//Loading.hide();
			});

			$scope.select = function(user) {
				user.selected = !user.selected;

				if($scope.ismulit == 1) {
					//追加或者移除已选中的人员
					if(user.selected) {
						$scope.selected.push(user);
					} else {
						var index = 0;
						$scope.selected.every(function(u, idx) {
							if(u.UserID == user.UserID) {
								index = idx;
								return true;
							} else
								return false;
						});
						$scope.selected.splice(index, 1);
					}
				} else {
					if($scope.selected.length == 1) {
						$scope.selected[0].selected = false;
						$scope.selected.length = 0;
					}
					if(user.selected) {
						$scope.selected.push(user);
					}
				}
			};
		}]
	}
}]);
//底部 工作分配 进展标记 维修记录 工作报告 进展标记 配件更换
app.directive('mdInfoBottomBar', [
	function() {
		return {
			restrict: 'EA',
			scope: {
				model: "=ngModel",
				options: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdInfoBottomBar.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {

			}]
		}
	}
]);
//底部录像，录音，拍照
app.directive("mdRecordMedia", [function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			videos: "=",
			audio: "=",
			images: "=",
			onlycamera: "="
		},
		templateUrl: localPath + '/js/pages/mdRecordMedia.html',
		controller: ["$scope", "UtilsService", "Loading", "$filter", function($scope, UtilsService, Loading, $filter) {
			$scope.localUrl = localPath;

			mui.init({
				gestureConfig: {
					hold: true,
					release: true
				}
			});

			//录视频
			$scope.recordVideo = function() {
				UtilsService.recordVideo().then(function(res) {
					$scope.videos = $scope.videos ? $scope.videos : [];
					res.State = 0;
					$scope.videos.push(res);

					UtilsService.getVideoTime(res.FileName).then(function(time) {
						res.FileSize = time;
					});

					if(typeof $scope.callback == "function") {
						$scope.callback(3, res);
					}
				});
			};

			$scope.audioEleId = $filter("uuid")();

			setTimeout(function() {
				//录音频
				document.getElementById("recordAudio_" + $scope.audioEleId).addEventListener("hold", function() {
					UtilsService.startRecordAudio(function(audioLength, name, path) {
						if($scope.audio.FilePath) {
							mui.confirm('确认要覆盖之前的录音吗？', '提示', ["确定", "取消"], function(e) {
								if(e.index == 0) {
									$scope.audio.FileName = name;
									$scope.audio.FilePath = path;
									$scope.audio.FileSize = audioLength;
									$scope.audio.FileType = 2;
									$scope.audio.FileGuid = "";
									$scope.audio.FileExt = path.substr(path.lastIndexOf(".") + 1, path.length - path.lastIndexOf("."));
									$scope.$apply();

									if(typeof $scope.callback == "function") {
										$scope.callback(2, $scope.audio);
									}
								}
							});
						} else {
							$scope.audio.FileName = name;
							$scope.audio.FilePath = path;
							$scope.audio.FileSize = audioLength;
							$scope.audio.FileType = 2;
							$scope.audio.FileGuid = "";
							$scope.audio.FileExt = path.substr(path.lastIndexOf(".") + 1, path.length - path.lastIndexOf("."));
							$scope.$apply();

							if(typeof $scope.callback == "function") {
								$scope.callback(2, $scope.audio);
							}
						}
					});
				});

				document.getElementById("recordAudio_" + $scope.audioEleId).addEventListener("release", function() {
					//setTimeout(function() {
					UtilsService.stopRecordAudio();
					//}, 100)
				});
			}, 300);

			//拍照
			$scope.chooseImage = function() {
				UtilsService.chooseImage(undefined, undefined, $scope.onlycamera).then(function(res) {
					res.forEach(function(image) {
						image.State = 0;
					})
					$scope.images = $scope.images ? $scope.images.concat(res) : res;
					if(typeof $scope.callback == "function") {
						$scope.callback(1, res);
					}
				});
			};
		}]
	}
}]);

//图片删除和展示
app.directive("mdImage", [function() {
	return {
		restrict: "EA",
		scope: {
			images: "=",
			readonly: "=",
			canadd: "="
		},
		templateUrl: localPath + '/js/pages/mdImage.html',
		controller: ["$scope", "UtilsService", "ApiService", "$filter", function($scope, UtilsService, ApiService, $filter) {
			$scope.localUrl = localPath;
			$scope.delete = function(index) {
				$scope.images.splice(index, 1);
			};

			$scope.preview = function(index) {
				var images = $scope.images.map(function(img) {
					if(img.FileGuid) {
						return ApiService.Down + "/" + $filter("filePathReg")(img.FilePath);
					} else {
						return mui.os.android ? img.FilePath.replace("file://", "") : img.FilePath;
					}
				});
				plus.nativeUI.previewImage(images, {
					current: index,
					loop: true,
					indicator: 'number'
				});
			};

			$scope.add = function() {
				UtilsService.chooseImage().then(function(res) {
					res.forEach(function(image) {
						image.State = 0;
					})
					$scope.images = $scope.images ? $scope.images.concat(res) : [].concat(res);
				});
			};

			//预览小图路径
			$scope.getPreSrc = function(img) {
				if(img.FileGuid)
					return ApiService.Api47 + "/api/v1/BillFile/DownLoadFile?filePath=" + img.FilePath + "&w=100";
				else
					return img.FileSmall;
			};
		}]
	}
}]);
app.directive("mdPic", [function() {
	return {
		restrict: "EA",
		scope: {
			images: "=",
			readonly: "=",
			canadd: "="
		},
		templateUrl: localPath + '/js/pages/mdPic.html',
		controller: ["$scope", "UtilsService", "ApiService", "$filter", function($scope, UtilsService, ApiService, $filter) {
			$scope.localUrl = localPath;
			$scope.delete = function(index) {
				$scope.images.splice(index, 1);
			};
			$scope.images = $scope.images.map(function(item) {
				return {
					"FileType": item.FileType,
					"FilePath": item.FilePath,
					"FileSize": item.FileSize,
					"FileName": item.FileName,
					"FileGuid": item.FileGuid

				}
			})
			$scope.preview = function(index) {
				var images = $scope.images.map(function(img) {
					if(img.FileGuid) {
						return ApiService.Down + $filter("filePathReg")(img.FilePath);
					} else {
						return mui.os.android ? img.FilePath.replace("file://", "") : img.FilePath;
					}
				});
				if(plus.os.name == "Android") {
					var images_Thumb = $scope.images.map(function(img) {
						if(img.FileGuid)
							return ApiService.Api47 + "/api/v1/BillFile/DownLoadFile?filePath=" + img.FilePath + "&w=400";
						else
							return img.FileSmall;
					}).toString();
					plus.Push.previewImage(images.toString() + ";" + images_Thumb, index);
				} else {
					plus.Push.openImageBrowser(images, index);
				}
			};

			$scope.add = function() {
				UtilsService.chooseImage().then(function(res) {
					res.forEach(function(image) {
						image.State = 0;
					})
					$scope.images = $scope.images ? $scope.images.concat(res) : [].concat(res);
				});
			};

			//预览小图路径
			$scope.getPreSrc = function(img) {
				if(img.FileGuid)
					return ApiService.Api47 + "/api/v1/BillFile/DownLoadFile?filePath=" + img.FilePath + "&w=100";
				else
					return img.FileSmall;
			};
		}]
	}
}]);

//视频删除和展示
app.directive("mdVideo", [function() {
	return {
		restrict: "EA",
		scope: {
			videos: "=",
			readonly: "="
		},
		templateUrl: localPath + '/js/pages/mdVideo.html',
		controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
			$scope.localUrl = localPath;
			$scope.downUrl = ApiService.Down + '/';

			$scope.play = function(video) {
				UtilsService.playVideo(video.FileName);
				if(video.FileSize == 0) {
					UtilsService.getVideoTime(video.FileName).then(function(time) {
						video.FileSize = time;
					});
				}
			};

			$scope.delete = function(index) {
				$scope.videos.splice(index, 1);
			}
		}]
	}
}]);
app.directive("mdZyVideo", [function() {
	return {
		restrict: "EA",
		scope: {
			videos: "=",
			readonly: "="
		},
		templateUrl: localPath + '/js/pages/mdZyVideo.html',
		controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
			$scope.localUrl = localPath;
			$scope.downUrl = ApiService.Down + '/';
			$scope.play = function(video) {
				UtilsService.playVideo(video.FileName);
				if(video.FileSize == 0) {
					UtilsService.getVideoTime(video.FileName).then(function(time) {
						video.FileSize = time;
					});
				}
			};
		}]
	}
}]);

function outFullscreen(el) {
	if(mui.os.android) {
		if(el.paused) {
			el.play();
		} else {
			el.pause();
		}
	}
}

//语音展示
app.directive("mdAudio", [function() {
	return {
		restrict: "EA",
		scope: {
			audio: "=",
			readonly: "=",
		},
		templateUrl: localPath + '/js/pages/mdAudio.html',
		controller: ["$scope", "UtilsService", function($scope, UtilsService) {
			$scope.localUrl = localPath;
			$scope.delete = function() {
				if(document.getElementById("img_" + $scope.audio.FileName).src == localPath + "/images/voice-play.gif") {
					stopAudio();

				};
				$scope.audio.FileSize = 0;
				$scope.audio.FilePath = "";
				$scope.audio = {};
			}
			$scope.play = function() {
				//如果正在播放，则要暂停
				if(document.getElementById("img_" + $scope.audio.FileName).src == localPath + "/images/voice-play.gif") {
					stopAudio();
					return;
				}
				if($scope.audio.FileGuid) {
					UtilsService.downLoadAudio($scope.audio.FilePath.replace(/\\/g, '%5C'), $scope.audio.FileName + $scope.audio.FileExt).then(function(res) {
						//更换图标显示方式
						document.getElementById("img_" + $scope.audio.FileName).src = localPath + "/images/voice-play.gif";
						UtilsService.playLocalAudio($scope.audio.FileName + $scope.audio.FileExt).then(function() {
							//还原图标
							document.getElementById("img_" + $scope.audio.FileName).src = localPath + "/images/voice.png";
						});
					})
				} else {
					//更换图标显示方式
					document.getElementById("img_" + $scope.audio.FileName).src = localPath + "/images/voice-play.gif";
					UtilsService.playLocalAudio($scope.audio.FileName).then(function() {
						//还原图标
						document.getElementById("img_" + $scope.audio.FileName).src = localPath + "/images/voice.png";
					});
				}
			};

			$scope.$on("stop_audio", function(e) {
				stopAudio();
			});

			function stopAudio() {
				UtilsService.stopLocalAudio();
				document.getElementById("img_" + $scope.audio.FileName).src = localPath + "/images/voice.png";
			}
		}]
	}
}]);

app.factory("AsyncModuleService", ["$q", function($q) {
	return {
		load: function(e, t, i) {
			//			var defer = $q.defer();
			//			require("../async")(_variable, url, attrs).then(function(data) {
			//				defer.resolve(data);
			//			});
			//			return defer.promise;

			return new Promise(function(n, o) {
				if(e && window[e]) n(window[e]);
				else {
					var s = function() {
							n(e && window[e])
						},
						r = angular.element("<script>");
					r.attr("type", "text/javascript"), r.attr("src", t), i && Object.keys(i).forEach(function(e) {
						r.attr(e, i[e])
					}), r.bind("load", s), r.bind("readystatechange", function() {
						"complete" === this.readyState && s()
					}), angular.element(document.body).append(r)
				}
			});
		}
	}
}]);

app.factory("MapService", ["AsyncModuleService", "LocationService", "$q", function(AsyncModuleService, LocationService, $q) {
	return {
		city: function() {
			return AsyncModuleService.load("cityData", "http://g.maidiyun.com/js/city2017.js?t=" + Date.now());
		},
		bMap: function() {
			window.BMap_loadScriptTime = window.BMap_loadScriptTime || (new Date).getTime();
			return AsyncModuleService.load("BMap", "http://api.map.baidu.com/getscript?v=2.0&ak=W6WIQmkWMM7fHZ1bQzONDGwimUikfaPU&services=&t=20170912191900");
		},
		/**
		 * 地址解析
		 * @param address {String}  位置
		 */
		geoCoder: function(address) {
			return LocationService.geoCoder(address);
		},
		/**
		 * 逆地址解析
		 * @param _lat  纬度
		 * @param _lng  经度
		 * @returns {Promise}
		 */
		geoDeCoder: function(_lat, _lng, _coordtype) {
			return LocationService.geoDeCoder(_lat, _lng, _coordtype);
		},

		geoLngLatToBaidu: function(_lat, _lng, _coordtype) {
			return LocationService.geoLngLatToBaidu(_lat, _lng, _coordtype);
		},

		/**
		 * 地图检索
		 * @param _query 检索内容
		 * @param _city 检索所在城市
		 * @param _page_size 分页数量
		 * @param _page_num 页码
		 */
		search: function(_query, _city, _page_size, _page_num, _need_total) {
			return LocationService.search(_query, _city, _page_size, _page_num, _need_total);
		}
	};
}]);

app.factory("ChatUserService", ["UtilsService", "CacheService", "$rootScope", "DataService", "ApiService", function(UtilsService, CacheService, $rootScope, DataService, ApiService) {
	var user = CacheService.get('user');
	return {
		tap: function(options) {
			$rootScope.$broadcast("stop_audio");
			var view = plus.webview.getWebviewById('chat-' + options.chatId);
			if(view) {
				view.show("slide-in-right")
			} else {
				view = plus.webview.create(localPath + "/pages/message/chat.html?isInit=true", "chat-" + options.chatId, {}, options);
				//view.hide();
				//view.addEventListener("loaded", function() {

				//})
				//view.evalJS("reloadNoRead()");
				setTimeout(function() {
					view.show("slide-in-right");
				}, 500);

			}

			// 			UtilsService.openWindow({
			// 				needLogin: true,
			// 				id: 'chat-' + options.chatId,
			// 				url: localPath + '/pages/message/chat.html',
			// 				extras: options,
			// 				createNew: false
			// 			});
		},
		tapGroup: function(options) {
			$rootScope.$broadcast("stop_audio");
			var view = plus.webview.getWebviewById('chat-group-' + options.GroupCode);
			if(view) {
				view.show("slide-in-right")
			} else {
				view = plus.webview.create(localPath + "/pages/message/chat-group.html?isInit=true", "chat-group-" + options.GroupCode, {}, options);
				//view.hide();
				//view.addEventListener("loaded", function() {

				//})
				//view.evalJS("reloadNoRead()");
				setTimeout(function() {
					view.show("slide-in-right");
				}, 500);
			}

			// 			UtilsService.openWindow({
			// 				needLogin: true,
			// 				id: 'chat-group-' + options.GroupCode,
			// 				url: '../../pages/message/chat-group.html',
			// 				extras: options,
			// 				createNew: false
			// 			});
		},
		send: function(options, transData) {
			if(options.chatId == user.UserID) return;
			options.userId = user.UserID;
			options.userName = user.UserName;
			DataService.get(ApiService.Api50 + '/api/v1/Resource/MyViewNameInOppo?oppoId=' + options.chatId).then(function(res) {
				options.reName = res;
				var msg = transMessage.packSimple(options, transData);
				RpcClient.invoke("message.html", 'RPC_SendMsg', msg);
			});
		},
		sendGroup: function(options, transData) {
			options.userId = user.UserID;
			DataService.get(ApiService.Api50 + '/api/v1/Message/GroupMemberName_Self?groupId=' + options.GroupID).then(function(res) {
				options.reName = res;
				options.userName = res;
				var msg = transMessage.packGroupSimple(options, transData);
				RpcClient.invoke("message.html", 'RPC_SendGroupMsg', msg);
			});
		},
		sendQANotice: function(options) {
			if(options.chatId == user.UserID) return;
			DataService.get(ApiService.Api50 + '/api/v1/Resource/MyViewNameInOppo?oppoId=' + options.chatId).then(function(res) {
				var _content = JSON.stringify([3, [
					[1, res + options.Content, [15, "#000"]]
				]]);
				var _msg = {
					Content: _content,
					reName: res,
					ReceiveID: options.chatId,
					ReceiveName: options.chatName,
					SendTime: new Date().Format("yyyy-MM-dd HH:mm:ss"),
					SendID: user.UserID,
					hasLogo: user.ULogoIsExist,
					compId: user.CompID,
					IsNotice: true
				};
				RpcClient.invoke("message.html", "RPC_SendNotice", _msg);
			});
		}
	};
}]);

app.controller("addressMap", ["$scope", "$Modal", "MapService", "$rootScope", "LocationService", "UtilsService",
	function($scope, $Modal, MapService, $rootScope, LocationService, UtilsService) {
		$scope.localUrl = localPath;
		//地图实例
		var map = "";
		//自动完成实例  pc端使用
		var autoComplete = "";
		//当前中心点位置
		var mapCenter = "";
		//中心点详细信息
		$scope.location = {
			province: "",
			city: "",
			district: "",
			address: "",
			lng: "",
			lat: ""
		};
		//中心点位置提示信息
		$scope.center = {
			isShow: false, //是否显示中心点提示信息
			tip: "", //中心点提示
			useLocation: false //是否显示使用此位置
		};

		//初始化位置
		if($scope.params.address) {
			$scope.location = {
				province: $scope.params.address.province,
				city: $scope.params.address.city,
				district: $scope.params.address.district,
				address: $scope.params.address.address,
				lng: $scope.params.address.lng ? $scope.params.address.lng : $scope.params.address.maplng, //临时办法
				lat: $scope.params.address.lat ? $scope.params.address.lat : $scope.params.address.maplat,
			};
		}

		//判断是否需要自动定位
		$scope.needPos = $scope.params.needPos;

		//初始化地图
		setTimeout(function() {
			MapService.bMap().then(function(re) {
				map = new BMap.Map("map");
				//开启鼠标滚轮缩放
				map.enableScrollWheelZoom(true);
				//禁用双击放大
				map.disableDoubleClickZoom();

				//如果有地址信息，则加载。。否则定位本市
				if($scope.location.province) {
					//如果有经纬度则通过经纬度搜索，否则通过详细地址搜索
					if($scope.location.lng && $scope.location.lat) {
						//把原始经纬度转换成百度地图的经纬度
						LocationService.bdEncrypt($scope.location).then(function(res) {
							$scope.location.lng = res.lng;
							$scope.location.lat = res.lat;
							locationAndShow();
						});
					} else {
						MapService.geoCoder($scope.location.province + $scope.location.city + $scope.location.district + $scope.location.address).then(function(rs) {
							$scope.location.lng = rs.lng;
							$scope.location.lat = rs.lat;

							//地图上定位地点
							locationAndShow();
						});
					}
				} else {
					if($scope.needPos) {
						UtilsService.getLocation(true).then(function(location) {
							$scope.location = {
								province: location.province,
								city: location.city,
								district: location.district,
								address: location.address,
								lng: location.lng,
								lat: location.lat
							};

							//把原始经纬度转换成百度地图的经纬度
							LocationService.bdEncrypt(new BMap.Point(location.lng, location.lat)).then(function(res) {
								$scope.location.lng = res.lng;
								$scope.location.lat = res.lat;

								var point = new BMap.Point(res.lng, res.lat);
								map.centerAndZoom(point, 12);
								mapCenter = map.getCenter();
							});
						});
					} else {
						var myCity = new BMap.LocalCity();
						myCity.get(function(result) {
							map.centerAndZoom(result.center, 12);
							mapCenter = map.getCenter();
						});
					}
				}

				//显示中心点位置信息
				function locationAndShow() {
					map.centerAndZoom(new BMap.Point($scope.location.lng, $scope.location.lat), 15);
					mapCenter = map.getCenter();
					if($scope.location.address) {
						$scope.center.isShow = true;
						$scope.center.tip = $scope.location.address;
					} else {
						$scope.center.isShow = false;
						$scope.center.tip = "";
					}
				}

				//缩放后事件
				map.addEventListener("zoomend", function() {
					var zoom = map.getZoom();
					map.centerAndZoom(mapCenter, zoom);
				});

				//拖动后事件
				map.addEventListener("dragend", function() {
					//清空搜索
					$scope.searchLocation = "";

					mapCenter = map.getCenter();
					geoDeCoder(mapCenter.lat, mapCenter.lng, true);
				});
			});
		}, 400);

		//PC端选择省市区
		$scope.area = {
			source: "",
			list: [],
		};
		//PC端初始化省
		MapService.city().then(function(data) {
			$scope.area.source = data;
			//初始化省份
			var i = 0;
			var temp = [];
			for(var prov in data) {
				if(i < 6) {
					temp.push(prov);
					i++;
				} else {
					$scope.area.list.push({
						items: temp,
						type: 0
					});
					temp = [];
					temp.push(prov);
					i = 1;
				}
			}
			if(temp.length)
				$scope.area.list.push({
					items: temp,
					type: 0
				});
		});

		//根据经纬度定位详细位置
		function geoDeCoder(lat, lng, needAddr) {
			MapService.geoDeCoder(lat, lng).then(function(rs) {
				var tempLocation;
				tempLocation = {
					province: rs.component.province,
					city: rs.component.city ? rs.component.city : rs.component.district,
					district: rs.component.district,
					address: needAddr ? (rs.component.street || "") + (rs.component.street_number || "") + (rs.description || "") : "",
					lng: rs.location.lng,
					lat: rs.location.lat
				};

				if(tempLocation.address) {
					$scope.center.tip = tempLocation.address;
				} else {
					$scope.center.tip = "";
				}

				//如果当初位置信息为空，或者拖动后的位置与之前设置的位置不同时，则显示使用此位置
				if(!$scope.location.province || ((Number(tempLocation.lng)).toFixed(5) != (Number($scope.location.lng)).toFixed(5) && (Number(tempLocation.lat)).toFixed(5) != (Number($scope.location.lat)).toFixed(5))) {
					$scope.center.useLocation = true;
				} else {
					$scope.center.useLocation = false;
				}

				$scope.location = tempLocation;
			});
		}

		//移动端选择省市区
		$scope.mobile = {
			//当前选择要加载的数据
			list: [],
			//当前选择的类型
			type: 0,
			//选择省市区
			selectArea: function(type) {
				$scope.mobile.list = [];
				if(!$scope.location.province)
					type = 0;

				var selected = "";
				switch(type) {
					case 0:
						for(var prov in $scope.area.source) {
							$scope.mobile.list.push(prov);
						}
						selected = $scope.location.province;
						break;
					case 1:
						for(var city in $scope.area.source[$scope.location.province]) {
							$scope.mobile.list.push(city);
						}
						selected = $scope.location.city;
						break;
					case 2:
						for(var j = 0; j < $scope.area.source[$scope.location.province][$scope.location.city].length; j++) {
							$scope.mobile.list.push($scope.area.source[$scope.location.province][$scope.location.city][j]);
						}
						selected = $scope.location.district;
						break;
				}

				$Modal.modal({
						title: "请选择",
						size: "small",
						region: "middle",
						params: {
							list: $scope.mobile.list,
							selected: selected,
						},
						template: "<div class='md-areas-modal'><span class='title'>城市选择<i class='icon-close' ng-click='cancel()'></i></span><div class='list'><span class='item' ng-class='{\"bgGray\":params.selected===item}' ng-click='selectItem(item)' ng-repeat='item in params.list'>{{item}}<i ng-class='{\"icon-roundcheckfill color-blue\":params.selected===item,\"icon-round color-gray\":params.selected!==item}'></i></span></div></div>",
						controller: ['$scope',
							function($scope) {
								$scope.selectItem = function(item) {
									$scope.params.selected = item;
									$scope.$modal.resolve(item);
									$scope.$modal.close();
								};

								$scope.cancel = function() {
									$scope.$modal.close();
								}
							}
						]
					}).footer(false).show()
					.then(function(selected) {
						switch(type) {
							case 0:
								if($scope.location.province != selected) {
									$scope.location.province = selected;
									$scope.location.city = "";
									$scope.location.district = "";
									$scope.location.address = "";
								}

								var count = 0;
								for(prov in $scope.area.source[$scope.location.province]) {
									count++;
								}
								if(count === 1) {
									$scope.location.city = selected;
								}
								break;
							case 1:
								if($scope.location.city != selected) {
									$scope.location.city = selected;
									$scope.location.district = "";
									$scope.location.address = "";
								}

								//如果没有区县，直接地图定位到市
								if(!$scope.area.source[$scope.location.province][$scope.location.city].length) {
									var temp = $scope.location.province == $scope.location.city ? $scope.location.province : ($scope.location.province + $scope.location.city);
									MapService.geoCoder(temp).then(function(res) {
										mapCenter = new BMap.Point(res.lng, res.lat);
										map.centerAndZoom(mapCenter, 12);
										geoDeCoder(mapCenter.lat, mapCenter.lng, false);
									});
								}
								break;
							case 2:
								if($scope.location.district != selected) {
									$scope.location.district = selected;
									$scope.location.address = "";
								}

								var temp = ($scope.location.province == $scope.location.city ? $scope.location.province : ($scope.location.province + $scope.location.city)) + $scope.location.district;
								MapService.geoCoder(temp).then(function(res) {
									mapCenter = new BMap.Point(res.lng, res.lat);
									map.centerAndZoom(mapCenter, 12);
									geoDeCoder(mapCenter.lat, mapCenter.lng, false);
								});
								break;
						}
					});
			},
		};

		//传入的参数：$scope.params
		$scope.$modal.callback = function() {
			if(!$scope.location.address) {
				$Modal.notify("请选择地址");
				return false
			}

			//将百度地图将纬度转换成原始经纬度
			LocationService.bdDecrypt($scope.location).then(function(res) {
				$scope.location.lng = res.lng.toFixed(6);
				$scope.location.lat = res.lat.toFixed(6);
				$scope.$modal.resolve($scope.location);
				$scope.$modal.close();
			});
		};
	}
]);

app.factory('Loading', [
	function() {
		/**
		 * 打开等待框
		 */
		var iswaiting = false;
		return {
			show: function() {
				if(iswaiting) {
					return;
				}
				iswaiting = true;
				plus.nativeUI.showWaiting('', {
					style: 'black',
					modal: false,
					background: 'rgba(0,0,0,0)'
				});
				//	//超过2s还没有执行完,则自动关闭等待,防止无休止等待
				//	setTimeout(function() {
				//		plus.nativeUI.closeWaiting();
				//	}, 5000);
			},
			hide: function() {
				iswaiting = true;
				if(!iswaiting) {
					return;
				}
				iswaiting = false;
				plus.nativeUI.closeWaiting();
			}
		}
	}
]);

app.directive("mdLogin", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			ismodal: "=",
			loginUser: "=" //切换用户时，对登录名赋值时使用
		},
		templateUrl: localPath + '/js/pages/mdLogin.html',
		controller: ["$scope", "AuthService", "Loading", "UtilsService", "CacheService", "$q", "DataService", "ApiService", "RPCObserver", function($scope, AuthService, Loading, UtilsService, CacheService, $q, DataService, ApiService, RPCObserver) {
			$scope.localUrl = localPath;

			setTimeout(function() {
				var preUserName = CacheService.get("preUserName") || "";
				document.getElementById("loginName").value = $scope.loginUser ? $scope.loginUser.Mdt : preUserName;
				document.getElementById("phone").value = CacheService.get("prePhone") || "";
			}, 300);
			var intl = "";
			$scope.user = {
				loginName: $scope.loginUser ? $scope.loginUser.Mdt : "",
				password: '',
				phone: '',
				verifyCode: '',
				rightCode: '',
				ImgCode: ApiService.Api50 + "/api/checkcode/login.jpg?v=" + new Date().getTime(),
				getImgCode: function() {
					$scope.user.ImgCode = ApiService.Api50 + "/api/checkcode/login.jpg?v=" + new Date().getTime();
				},
				time: 0,
				type: 0,
				getVCode: function() {
					if($scope.user.time != 60 && $scope.user.time != 0) {
						return;
					}

					$scope.user.phone = document.getElementById("phone").value;
					if(!$scope.user.phone) {
						mui.toast("请输入手机号！");
						return;
					}

					if(!/^1\d{10}$/.test($scope.user.phone)) {
						mui.toast("请输入正确的手机号！");
						return;
					}

					if(!$scope.user.phone) {
						mui.toast("请输入手机号！");
						return;
					}

					var inputImgCode = document.getElementById("inputImgCode").value;

					if(!inputImgCode) {
						mui.toast("请输入图片验证码");
						return;
					}

					var url = ApiService.Api50 + "/api/v1/user/GetPhoneCode";

					var _data = {
						"Phone": $scope.user.phone,
						"Code": inputImgCode,
						"UserType": 2,
						"CodeType": "login"
					};

					DataService.post(url, _data).then(function(res) {
						$scope.user.time = 59;

						intl = setInterval(function() {
							$scope.$apply(function() {
								$scope.user.time > 0 && $scope.user.time--;
							});
							if($scope.user.time <= 0) {
								$scope.user.time = 0;
								clearInterval(intl);
							}
						}, 1000);
					}, function(res) {
						//						console.log("err"+JSON.stringify(res))
						$scope.user.getImgCode();
						if(res && res.State != 0) {
							mui.toast(res.Data || res.ErrorMessage);
						}

					});

					// AuthService.getVerifyCode($scope.user.phone).then(function (res) {
					// 	$scope.user.verifyCode = res;
					// 	$scope.user.rightCode = res;
					// 	$scope.user.time = 59;

					// 	intl = setInterval(function () {
					// 		$scope.$apply(function () {
					// 			$scope.user.time > 0 && $scope.user.time--;
					// 		});
					// 		if ($scope.user.time <= 0) {
					// 			$scope.user.time = 0;
					// 			clearInterval(intl);
					// 		}
					// 	}, 1000);
					// });
				},
				swicthLogin: function(type) {
					$scope.user.type = type;
					if(type == 0) {
						$scope.user.time = 0;
						clearInterval(intl);
					}
				},
				doLogin: function() {
					//Loading.show();
					//账号登录
					plus.navigator.removeAllCookie();
					if($scope.user.type == 0) {
						$scope.user.loginName = document.getElementById("loginName").value;
						$scope.user.password = document.getElementById("password").value;

						if(!$scope.user.loginName) {
							mui.toast("请输入账号！");
							return;
						}
						if(!$scope.user.password) {
							mui.toast("请输入密码！");
							return;
						}
						if(!isNetWorkCanUse()) {
							mui.toast("网络连接失败，请检查网络后再试")
							return;
						}
						Loading.show();
						AuthService.login($scope.user.loginName, $scope.user.password).then(function(res) {
							if(res && res.length == 0) {
								Loading.hide();
								mui.confirm("您还未注册过企业帐号，验证失败！是否立即注册一个企业用户？", "提示", ["立即注册", "下次再说"], function(e) {
									if(e.index == 0) {
										document.getElementById("password").value = "";
										$scope.$apply();
										//直接调到注册页面
										UtilsService.openWindow({
											id: "regist.html",
											url: "regist.html"
										});
									}
								})
								return;
							}
							CacheService.set("preUserName", $scope.user.loginName, true);
							$scope.user.close(false);
							CacheService.remove("user");
							CacheService.remove("userList");
							$scope.user.loginName = "";
							$scope.user.password = "";
							CacheService.set("user", res[0], true);
							RpcClient.invoke("login.html", "RPC_LoginSuccess");
							RpcClient.invoke("message.html", "RPC_Login", res[0]);
							RPCObserver.broadcast("refresh_readList");
							var promises = [AuthService.getUserSwitchList(), AuthService.getUserAuth(), DataService.get(ApiService.Api50 + '/api/v1/Org/OrgEditAuth'), AuthService.getMenuAuth(), AuthService.getYunModuleAuthority()];
							$q.all(promises).then(function(resp) {
								CacheService.set("userList", resp[0], true);
								resp[2] && resp[1].push('Q0');
								CacheService.set("userAuth", resp[1], true);
								CacheService.set("menuAuth", resp[3], true);
								CacheService.set("moduleAuth", resp[4], true);
								document.getElementById("password").value = "";
								Loading.hide();
								mui.toast("登录成功");
								if($scope.callback) {
									$scope.callback(res[0]);
								}
							});
						}, function() {
							//mui.toast("登录失败");
						});
					} else {
						$scope.user.phone = document.getElementById("phone").value;
						$scope.user.verifyCode = document.getElementById("verifyCode").value;

						if(!$scope.user.phone) {
							mui.toast("请输入手机号！");
							return;
						}

						if(!/^1\d{10}$/.test($scope.user.phone)) {
							mui.toast("请输入正确的手机号！");
							return;
						}

						if(!$scope.user.verifyCode) {
							mui.toast("请输入验证码！");
							return;
						}

						//						if($scope.user.verifyCode != $scope.user.rightCode) {
						//							mui.toast("输入的验证码不正确！");
						//							return;
						//						}
						Loading.show();
						AuthService.loginUserByPhone($scope.user.phone, $scope.user.verifyCode, "login").then(function(res) {
							Loading.hide();
							if(res.length > 0) {
								CacheService.set("prePhone", $scope.user.phone, true);
								RpcClient.invoke("login.html", "RPC_LoginSuccess");
								$scope.user.close(false);
								$scope.user.phone = "";
								$scope.user.verifyCode = "";
								$scope.user.time = 0;
								clearInterval(intl);

								CacheService.set("user", res[0], true);
								RpcClient.invoke("message.html", "RPC_Login", res[0]);
								var promises = [AuthService.getUserSwitchList(), AuthService.getUserAuth(), DataService.get(ApiService.Api50 + '/api/v1/Org/OrgEditAuth'), AuthService.getMenuAuth(), AuthService.getYunModuleAuthority()];
								$q.all(promises).then(function(resp) {
									CacheService.set("userList", resp[0], true);
									resp[2] && resp[1].push("Q0");
									CacheService.set("userAuth", resp[1], true);
									CacheService.set("menuAuth", resp[3], true);
									CacheService.set("moduleAuth", resp[4], true);
									document.getElementById("verifyCode").value = "";
									RpcClient.invoke("change-account.html", "RPC_LoginSuccess");

									if(res[0].IsNew === 1) {
										mui.alert("登录成功，登陆密码为手机号！");
									} else
										mui.toast("登录成功");
									if($scope.callback) {
										$scope.callback(res[0]);
									}
								});
							} else {
								mui.confirm("您还未注册过企业帐号，验证失败！是否立即注册一个企业用户？", "提示", ["立即注册", "下次再说"], function(e) {
									//先清空验证码,注册成功登录需重新获取
									document.getElementById("verifyCode").value = "";
									$scope.user.time = 0;
									clearInterval(intl);
									$scope.$apply();
									if(e.index == 0) {
										//直接调到注册页面的第二步“完善信息”
										UtilsService.openWindow({
											id: "regist.html",
											url: "regist.html?quick=true&phone=" + $scope.user.phone
										});
									}
								})
							}
						}, function(error) {
							//							console.log("err2"+JSON.stringify(error))
							document.getElementById("verifyCode").value = "";
							//							$scope.user.time = 0;
							//							clearInterval(intl);
						});
					}
				},
				close: function(flag) {
					if($scope.ismodal) {
						if(flag && $scope.callback) {
							$scope.callback();
						}
					}
				},
				newComp: function() {
					UtilsService.clearWindow();
					UtilsService.openWindow({
						id: 'regist.html',
						url: '../../pages/login/regist.html',
					});
				},
				newSingle: function() {
					UtilsService.openWindow({
						id: 'registSingle.html',
						url: '../../pages/login/registSingle.html',
					});
				},
				forgetPW: function() {
					UtilsService.openWindow({
						id: 'forgetPW.html',
						url: '../../pages/login/forgetPW.html',
					});
				}
			};
		}]
	};
}]);

app.directive('mdSkuList', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel",
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdSkuList.html',
		controller: ["$scope", function($scope) {
			//$scope.localUrl = localPath;
			setTimeout(function() {
				$scope.isLoad = true
			}, 100)
		}]
	};
}]);

app.directive('mdFaultList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdFaultList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RpcServer.expose("RPC_RepairSelectRefresh", function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					})
				}
				//跳转
				$scope.tap = function(key, fault) {
					var url = {
						faultView: 'fault-info.html?id=' + fault.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdNoData', [function() {
	return {
		restrict: 'E',
		scope: {
			options: "=",
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdNoData.html',
		controller: ["$scope", function($scope) {
			$scope.localUrl = localPath;
		}]
	};
}]);
app.directive("mdNoticeTypeSelect", [function() {
	return {
		restrict: "EA",
		scope: {
			options: "="
		},
		templateUrl: localPath + '/js/pages/mdNoticeTypeSelect.html',
		controller: ["$scope", function($scope) {
			$scope.$watch("options.model." + $scope.options.nameField, function(_new, _old) {
				$scope.options.model[$scope.options.idField] && _new.trim().length == 0 && ($scope.options.model[$scope.options.idField] = "");
			});
			$scope.select = function() {
				if($scope.options.model[$scope.options.idField]) {
					$scope.options.model[$scope.options.idField] = "";
					$scope.options.model[$scope.options.nameField] = '';
					if($scope.options.clearfn) {
						$scope.options.clearfn();
					}
				} else {

					$scope.options.selectfn();
				}
			}
		}]
	}
}]);

app.directive('mdNoticeList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdNoticeList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				var title = query("title") || "我的公告";
				$scope.tap = function(prod) {
					UtilsService.openWindow({
						needLogin: true,
						id: "noticeinfo.html",
						url: "noticeinfo.html?id=" + prod.ID
					});
				}
			}]
		};
	}
]);

app.directive('mdProdLibList', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel",
			state: "=",
			type: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdProdLibList.html',
		controller: ["$scope", "UtilsService", function($scope, UtilsService) {
			$scope.isall = query("isall");
			$scope.state = query("state");
			$scope.skuid = query("skuid") || 0;
			$scope.selProdID = query("prodid") || 0;
			$scope.tap = function(prod) {
				if($scope.state == 'selsku') {
					if(prod.Count == 1 && $scope.isall !== "true") {
						var view = plus.webview.currentWebview().opener();
						var opener = view.opener();
						if(view.callback) {
							var temp = {
								ProdID: prod.ProdID,
								ProdName: prod.ProdName,
								SkuID: prod.SkuInfo.SkuID,
								SkuName: prod.SkuInfo.SkuName,
								MatCode: prod.SkuInfo.MatCode
							};
							opener.evalJS(view.callback + "(" + JSON.stringify(temp) + ")");
						}
						if($scope.type == 'search') {
							view.close("none");
							mui.back();
						} else {
							view.close();
						}
					} else {
						//处理名称里的特殊符号
						var prodName = encodeURIComponent(prod.ProdName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"));
						//选择型号
						UtilsService.openWindow({
							needLogin: true,
							id: 'sku-head.html',
							url: 'sku-head.html?prodId=' + prod.ProdID + '&prodName=' + prodName + '&isall=' + $scope.isall + "&skuid=" + $scope.skuid + "&selprodid=" + $scope.selProdID
						});
					}

				} else if($scope.state == 'selprod') {
					//选择产品
				} else if($scope.state == 'view') {
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodinfo-head.html',
						url: 'prodinfo-head.html?prodId=' + prod.ProdID
					});
				}
			};
		}]
	};
}]);

app.directive('mdWaitOverHaul', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel"
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdWaitOverHaul.html',
		controller: ["$scope", "UtilsService", function($scope, UtilsService) {
			//跳转
			$scope.tap = function(item) {
				UtilsService.openWindow({
					needLogin: true,
					id: "equ-patrol-equlist.html",
					url: "../eqmentlib/equ-patrol-equlist.html?planid=" + item.PlanID + "&logid=" + item.ID
//					extras: {
//						addEquRecord: {
//							EquipmentID: item.ID,
//							EqIdentifier: item.EqIdentifier,
//							EqName: item.EqName,
//							SkuName: item.SkuName,
//							NextRepairDate: item.NextRepairDate || ''
//						}
//					}
				});
			};
		}]
	};
}]);

app.directive('mdWaitPreserve', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel"
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdWaitPreserve.html',
		controller: ["$scope", "UtilsService", function($scope, UtilsService) {
			//跳转
			$scope.tap = function(item) {
				UtilsService.openWindow({
					needLogin: true,
					id: "equ-maintens-Equlist.html",
				    url: "../eqmentlib/equ-maintens-Equlist.html?id=" + item.PlanID+'&planLogId='+item.ID,
//					extras: {
//						addEquRecord: {
//							EquipmentID: item.ID,
//							EqIdentifier: item.EqIdentifier,
//							EqName: item.EqName,
//							SkuName: item.SkuName,
//							NextMaintainDate: item.NextMaintainDate || ''
//						}
//					}
				});
			};
		}]
	};
}]);

app.directive('mdNeedLogin', [
	function() {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: localPath + '/js/pages/mdNeedLogin.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.tologin = function() {
					UtilsService.openWindow({
						id: 'login.html',
						url: '../pages/login/login.html',
					});
				};
			}]
		};
	}
]);

app.directive("mdSwitchUser", ["CacheService", function(CacheService) {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			userid: "@",
			users: "=",
			ismodal: "="
		},
		templateUrl: localPath + '/js/pages/mdSwitchUser.html',
		controller: ["$scope", function($scope) {
			$scope.change = function(user) {
				if($scope.userid == user.UserID)
					return;

				$scope.userid = user.UserID;
				$scope.callback(user);
			};

			//切换用户，点击取消登录时，重新赋值
			$scope.$on("getCurUserID", function(e, d) {
				$scope.userid = d;
			})
		}]
	}
}]);

app.directive('mdPartInfolist', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdPartInfolist.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.partDetail = function(ID) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'part-info.html',
						url: 'part-info.html?id=' + ID
					});
				};
			}]
		}
	}
]);

app.directive('mdSearchUser', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				compid: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchUser.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.personalInfo = function(ID) {
					if($scope.compid) {
						UtilsService.openWindow({
							needLogin: true,
							id: 'contact-info.html',
							url: '../contact/contact-info.html?userid=' + ID + "&compid=" + $scope.compid
						});
						return;
					}
					UtilsService.openWindow({
						needLogin: true,
						id: 'personal-info.html',
						url: '../contact/personal-info.html?userid=' + ID
					});
				};
			}]
		}
	}
]);

/***
 * 用户头像
 */
app.directive('mdUserLogo', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel",
			width: "@",
			height: "@"
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdUserLogo.html',
		controller: ["$scope", "$filter", function($scope, $filter) {

		}]
	}
}]);
/**
 * 企业头像
 */
app.directive('mdCompLogo', ["$filter", function($filter) {
	return {
		restrict: 'E',
		scope: {
			width: "@",
			height: "@",
			compid: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdCompLogo.html',
		controller: ["$scope", "$filter", function($scope, $filter) {}]
	}
}]);

/**
 * 产品logo
 */
app.directive('mdProdLogo', ["$filter", function($filter) {
	return {
		restrict: 'E',
		scope: {
			width: "@",
			height: "@",
			model: "=ngModel"
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdProdLogo.html',
		controller: ["$scope", "$filter", function($scope, $filter) {}]
	}
}]);

/**
 * 设备Logo
 */
app.directive('mdEquLogo', ["$filter", function($filter) {
	return {
		restrict: 'E',
		scope: {
			width: "@",
			height: "@",
			path: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdEquLogo.html',
		controller: ["$scope", "$filter", function($scope, $filter) {}]
	}
}]);

app.directive('mdSearchComp', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchComp.html',
			controller: ["$scope", "UtilsService", "TapService", function($scope, UtilsService, TapService) {
				$scope.compInfo = function(ID) {
					TapService.openCoInfo(ID, 0);
				};
			}]
		}
	}
]);

app.directive('mdSearchProd', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchProd.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.ProdDetails = function(ID) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodinfo-head.html',
						url: '/src/pages/problib/prodinfo-head.html?prodId=' + ID
					});
				};
			}]
		}
	}
]);

app.directive('mdJfPoint', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdJfPoint.html',
			controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {

				$scope.gotoinfo = function(ID) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'point-redemption-details.html',
						url: '../point/point-redemption-details.html?compid=' + ID
					});
				}
			}]
		};
	}
]);
app.directive('mdSearchEquipment', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchEquipment.html',
			controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
				$scope.equDetails = function(ID) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'equ-details.html',
						url: '../eqmentlib/equ-details.html?equid=' + ID
					});
				}
			}]
		};
	}
]);

app.directive('mdIngReplyList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdIngReplyList.html',
			controller: ["$scope", "UtilsService", "ApiService", "DataService", "$element", "RPCObserver", "CacheService", "ChatUserService", function($scope, UtilsService, ApiService, DataService, $element, RPCObserver, CacheService, ChatUserService) {
				if(plus.webview.currentWebview().answer) {
					$scope.dataId = plus.webview.currentWebview().answer.ID;
				}

				var curUser = CacheService.get("user");

				$scope.tap = function(item) {
					if(!item.AUserInfo) return;
					if($scope.type == 'header') return;
					// if(item.CommentCount == 0) return;
					UtilsService.openWindow({
						needLogin: true,
						id: "ing-comment-info.html",
						url: "ing-comment-info.html?aId=" + item.ID,
						extras: {
							answer: item
						}
					})
				}
				$scope.goodp = function(item, event) {
					// event.stopPropagation();
					if(item.IsMyJudgePos == true) {
						cancelpos(item)
					} else {
						addpos(item);
					}
				};
				$scope.lowp = function(item, event) {
					// event.stopPropagation();
					if(item.IsMyJudgeNeg == true) {
						cancelneg(item)
					} else {
						addneg(item);
					}
				}

				//回复保存
				var a = 1;
				$scope.reply = function(item, event) {
					// event.stopPropagation();
					if(a == 1) {
						a = 0;
						UtilsService.replyModal(150, "", "请输入评论内容").then(function(res) {
							var url = ApiService.Api50 + '/api/v1/QA/CommentSave?aId=' + ($scope.type == "commentList" ? $scope.dataId : item.ID);
							var postData = {
								"ID": 0,
								"CID": $scope.type == "commentList" ? item.ID : 0,
								"CContent": res
							}
							DataService.post(url, postData).then(function(res) {
								if(res) {
									mui.toast("评论成功");
									var content = "在您的答案中评论:" + postData.CContent;
									var chatUserInfo = (item.AUserInfo || item.CUserInfo);
									curUser.UserID == chatUserInfo.UserID && (content = "回复了您的评论:" + postData.CContent);

									ChatUserService.sendQANotice({
										chatId: chatUserInfo.UserID,
										chatName: chatUserInfo.UserName,
										Content: content
									});

									RPCObserver.broadcast('refresh_Assist_detail');
								}
							});
						});
						setTimeout(function() {
							a = 1
						}, 500);
					}
				}

				function addpos(item) {
					var url = ApiService.Api50 + "/api/v1/QA/AnswerJudge?aId=" + item.ID + "&judgeType=1";
					DataService.post(url).then(function(res) {
						if(item.IsMyJudgeNeg == true) {
							cancelneg(item)
						}
						item.PosCount = item.PosCount + 1;
						item.IsMyJudgePos = true;
						return;
					}, function() {

					});
				};
				$scope.stopPropagation = function(event) {

					event.stopPropagation();
				};

				function cancelpos(item) {
					var url = ApiService.Api50 + "/api/v1/QA/AnswerJudgeCancel?aId=" + item.ID + "&judgeType=1";
					DataService.post(url).then(function(res) {
						if(item.PosCount > 0) {
							item.PosCount = item.PosCount - 1;
							item.IsMyJudgePos = false;
							return;
						}
						item.IsMyJudgePos = false;

					}, function() {

					});

				};

				function addneg(item) {
					var url = ApiService.Api50 + "/api/v1/QA/AnswerJudge?aId=" + item.ID + "&judgeType=2";
					DataService.post(url).then(function(res) {
						if(item.IsMyJudgePos == true) {
							cancelpos(item);
						}
						item.NegCount = item.NegCount + 1;
						item.IsMyJudgeNeg = true;
						return;
					}, function() {

					});
				};

				function cancelneg(item) {
					var url = ApiService.Api50 + "/api/v1/QA/AnswerJudgeCancel?aId=" + item.ID + "&judgeType=2";
					DataService.post(url).then(function(res) {
						if(item.NegCount > 0) {
							item.NegCount = item.NegCount - 1;
							item.IsMyJudgeNeg = false;
							return;
						}
						item.IsMyJudgeNeg = false;
						return;
					}, function() {

					});

				};

				setTimeout(function() {
					checkImages();

					mui($element).on("tap", "li.data-row", function() {
						var _idx = this.getAttribute("data-index");
						$scope.tap($scope.model[_idx]);
					}).on("tap", "span.goodp", function(event) {
						event.stopPropagation();
						var _idx = this.getAttribute("data-index");
						$scope.goodp($scope.model[_idx]);
					}).on("tap", "span.lowp", function(event) {
						event.stopPropagation();
						var _idx = this.getAttribute("data-index");
						$scope.lowp($scope.model[_idx]);
					}).on("tap", ".reply", function(event) {
						event.stopPropagation();
						var _idx = this.getAttribute("data-index");
						$scope.reply($scope.model[_idx]);
					}).on("tap", ".toperson", function(event) {
						event.stopPropagation();
						var _idx = this.getAttribute("data-index");
						if($scope.model[_idx].CUserInfo) {
							$scope.UserID = $scope.model[_idx].CUserInfo.UserID
						} else {
							$scope.UserID = $scope.model[_idx].AUserInfo.UserID
						}
						UtilsService.openWindow({
							needLogin: true,
							id: "personal-info.html",
							url: "../../pages/contact/personal-info.html?userid=" + $scope.UserID
						});
					}).on("tap", ".toperson-of-reply", function(event) {
						event.stopPropagation();
						var _idx = this.getAttribute("data-index");
						$scope.UserID = $scope.model[_idx].ReplyUserID;
						UtilsService.openWindow({
							needLogin: true,
							id: "personal-info.html",
							url: "../../pages/contact/personal-info.html?userid=" + $scope.UserID
						});

					});
					// });
				}, 500);

				//检查图片  绑定点击看大图事件
				$scope.ImageData = {};

				function checkImages() {
					$scope.ImageData = [];
					angular.forEach($element.find("li"), function(item, index) {
						$scope.ImageData[index] = [];

						angular.forEach(item.querySelectorAll("img"), function(_item) {
							var _src = _item.getAttribute("src");
							if(_src.indexOf(ApiService.MdBox + "/static/img/") < 0) {

								$scope.ImageData[index].push(_src);
								_item.setAttribute("data-index", $scope.ImageData[index].length - 1);
								_item.setAttribute("data-parent-idx", index);

								_item.addEventListener("tap", function(event) {
									event.stopPropagation();
									var index = this.getAttribute("data-index");
									var parentIdx = this.getAttribute("data-parent-idx");

									plus.nativeUI.previewImage($scope.ImageData[parentIdx], {
										current: index,
										loop: true,
										indicator: 'number'
									});

								})
							}
						});
					});
				}
			}]
		};
	}
]);

app.directive('mdSearchCustomer', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchCustomer.html',
			controller: ["$scope", "UtilsService", "BillService", function($scope, UtilsService, BillService) {
				$scope.action = query("action");
				if($scope.action == "select") {
					//接受已选择的参数
					$scope.selectObj = plus.webview.currentWebview().selectObj;
				}
				$scope.morecustomer = function(item) {
					if($scope.action == "select") {
						//反选
						item = item.ID == $scope.selectObj.ID ? {
							ID: 0,
							CustomerName: ''
						} : item;
						//选择
						$scope.selectObj = item ? item : {
							ID: 0,
							CustomerName: ''
						};
						RpcClient.invoke("customer-search.html", "RPC_CustomerSelectInfo", $scope.selectObj);
						return;
					}
					UtilsService.openWindow({
						id: "customer-info.html",
						url: "../customer/customer-info.html?customerid=" + item.ID
					});
				}
			}]
		}
	}
]);
app.directive('mdSearchSupplier', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchSupplier.html',
			controller: ["$scope", "UtilsService", "BillService", function($scope, UtilsService, BillService) {
				$scope.moresupplier = function(id) {
					BillService.openView("mdt-supplier-manage", id)
				}
			}]
		}
	}
]);
app.directive('mdMatPartInfolist', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatPartInfolist.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.partDetail = function(ID) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'mat-part-info.html',
						url: 'mat-part-info.html?id=' + ID
					});
				};
			}]
		}
	}
]);

app.directive("mdSelectEqClass", [function() {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			id: "=",
			curpid: "="
		},
		templateUrl: localPath + '/js/pages/mdSelectEqClass.html',
		controller: ["$scope", "Loading", "DataService", "ApiService", function($scope, Loading, DataService, ApiService) {
			$scope.Data = {};
			$scope.NavData = [{
				id: $scope.curpid,
				name: "全部",
				Data: []
			}];

			$scope.isLoad = false;

			$scope.loadData = function(id) {
				$scope.isLoad = false;
				if(!$scope.Data[id]) {
					var url = ApiService.Api45 + "/api/v1/PkgClass/GetSubClass?pid=" + id;

					DataService.get(url).then(function(res) {
						$scope.isLoad = true;
						$scope.Data[id] = res;
					}, function() {});
				} else {
					$scope.isLoad = true;
				}
			};

			$scope.ev_nav_click = function(item, idx) {
				if(idx == $scope.NavData.length - 1)
					return;

				//移除后续项
				$scope.NavData.splice(idx + 1, $scope.NavData.length - idx - 1);

				$scope.loadData(item.id);

				resScroll();
			};

			$scope.ev_item_click = function(item) {
				$scope.NavData.push(item);
				$scope.loadData(item.id);
				resScroll();
			};

			var temp = [];
			$scope.select = function(item) {
				if($scope.id == item.id) {
					temp = [];
					$scope.id = 0;
					$scope.callback();
				} else {
					temp = [];

					temp.push({
						id: item.id,
						name: item.name,
						CPath: item.CPath
					});

					$scope.id = item.id;
					$scope.callback(temp);
				}
			};

			//导航栏滚动事件
			function resScroll() {
				setTimeout(function() {
					if(mui("#res-slide")[0]) {
						var width = mui("#res-slide")[0].clientWidth;
						var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
						scrollto = 0;
						if((scrollWidth + 35) < width || width == 0) {
							scrollto = 0;
						} else {
							scrollto = width - scrollWidth - 24;
						}
						mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
					}
				}, 100);
			};

			$scope.loadData($scope.curpid);

			var mui_back = mui.back;
			mui.back = function() {
				if($scope.NavData.length > 1) {
					$scope.NavData.splice($scope.NavData.length - 2, 2);
					$scope.loadData($scope.NavData[$scope.NavData.length - 2].id);
					$scope.$apply();
				} else {
					mui_back();
				}
			}

			$scope.$on("mui_back", function(e, d) {
				mui_back();
			})
		}]
	}
}]);

app.directive("mdSelectOrg", [function() {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			orgid: "=",
			type: '=',
			compid: '='
		},
		templateUrl: localPath + '/js/pages/mdSelectOrg.html',
		controller: ["$scope", "Loading", "AuthService", "DataService", "ApiService", function($scope, Loading, AuthService, DataService, ApiService) {
			$scope.orgList = [];
			$scope.loaded = false;
			//目录导航
			$scope.navDirData = [];

			$scope.loadOrgList = function(org, navIdx) {
				$scope.loaded = false;

				if(navIdx) {
					//如果是最后一项，直接退出
					if(navIdx == $scope.navDirData.length - 1)
						return;

					//移除后续项
					$scope.navDirData.splice(navIdx + 1, $scope.navDirData.length - navIdx - 1);
				} else {
					//如果是点击的第一项，清空导航
					if(navIdx == 0)
						$scope.navDirData.length = 0;

					$scope.navDirData.push({
						ID: org.ID,
						OrgName: org.OrgName
					});
				}

				if($scope.orgList.length)
					$scope.orgList.length = 0;

				resScroll();
				if($scope.type == "register") {
					var url = ApiService.Api50 + "/api/v1/Org/GetOrgListNew?compId=" + $scope.compid + "&parentId=" + org.ID;
					DataService.get(url).then(function(res) {
						if(res) {
							$scope.orgList = res;
							$scope.loaded = true;
						}
					});
				} else {
					AuthService.getOrgList(org.ID).then(function(list) {
						$scope.orgList = list;
						$scope.loaded = true;
					}, function() {

					});
				}

			};
			//导航栏滚动事件
			function resScroll() {
				setTimeout(function() {
					if(mui("#res-slide")[0]) {
						var width = mui("#res-slide")[0].clientWidth;
						var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
						scrollto = 0;
						if((scrollWidth + 35) < width || width == 0) {
							scrollto = 0;
						} else {
							scrollto = width - scrollWidth - 24;
						}
						mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
					}
				}, 100);
			}

			$scope.loadOrgList({
				ID: 0,
				OrgName: "部门"
			});
			var temp = [];
			$scope.select = function(org) {
				if($scope.orgid == org.ID) {
					temp = [];
					$scope.orgid = 0;
					$scope.callback(temp);
				} else {
					temp = [];
					$scope.navDirData.forEach(function(org, index) {
						if(index > 0) {
							temp.push({
								ID: org.ID,
								OrgName: org.OrgName
							});
						}
					})
					temp.push({
						ID: org.ID,
						OrgName: org.OrgName
					});

					$scope.orgid = org.ID;
					$scope.callback(temp);
				}
			};

			//Android返回键返回上级目录
			var mui_back = mui.back;
			mui.back = function() {
				if($scope.navDirData.length > 1) {
					var temp = {
						ID: $scope.navDirData[$scope.navDirData.length - 2].ID,
						OrgName: $scope.navDirData[$scope.navDirData.length - 2].OrgName
					};
					$scope.navDirData.splice($scope.navDirData.length - 2, 2);
					$scope.loadOrgList(temp);
					$scope.$apply();
				} else {
					mui_back();
				}
			}

			$scope.$on("mui_back", function(e, d) {
				mui_back();
			})
		}]
	}
}]);

app.directive("mdSelectBillDir", [function() {
	return {
		restrict: "EA",
		scope: {
			callback: "=",
			billkey: "=",
			selected: "=",
			ismust: "="
		},
		templateUrl: localPath + '/js/pages/mdSelectBillDir.html',
		controller: ["$scope", "Loading", "BillService", function($scope, Loading, BillService) {
			$scope.dirList = [];
			$scope.loaded = false;
			//目录导航
			$scope.navDirData = [];

			$scope.selectedDir = {
				ID: $scope.selected ? $scope.selected.id : '',
				DirName: $scope.selected ? $scope.selected.name : '',
			};

			$scope.$on("back_dir", function(e, m) {
				if($scope.navDirData.length > 1) {
					$scope.loadDirList($scope.navDirData[$scope.navDirData.length - 2], $scope.navDirData.length - 2);
				} else {
					$scope.$emit("back_page");
				}
			})

			$scope.loadDirList = function(dir, navIdx) {
				Loading.show();
				$scope.loaded = false;

				if(navIdx) {
					//如果是最后一项，直接退出
					if(navIdx == $scope.navDirData.length - 1) {
						Loading.hide();
						return;
					}

					//移除后续项
					$scope.navDirData.splice(navIdx + 1, $scope.navDirData.length - navIdx - 1);
				} else {
					//如果是点击的第一项，清空导航
					if(navIdx == 0)
						$scope.navDirData.length = 0;

					$scope.navDirData.push({
						ID: dir.ID,
						DirName: dir.DirName
					});
				}

				if($scope.dirList.length)
					$scope.dirList.length = 0;

				resScroll();

				BillService.dataDirLevel($scope.billkey, dir.ID).then(function(list) {
					$scope.dirList = list;
					$scope.loaded = true;
					Loading.hide();
				}, function() {
					Loading.hide();
				});
			};
			//导航栏滚动事件
			function resScroll() {
				setTimeout(function() {
					if(mui("#res-slide")[0]) {
						var width = mui("#res-slide")[0].clientWidth;
						var scrollWidth = mui("#res-slide .mui-scroll")[0].clientWidth;
						scrollto = 0;
						if((scrollWidth + 35) < width || width == 0) {
							scrollto = 0;
						} else {
							scrollto = width - scrollWidth - 24;
						}
						mui('#res-slide').scroll().scrollTo(scrollto, 0, 0);
					}
				}, 100);
			}
			$scope.loadDirList({
				ID: 0,
				DirName: "目录"
			});

			$scope.choose = function(dir) {
				if($scope.selectedDir.ID == 0 || $scope.selectedDir.ID != dir.ID)
					$scope.selectedDir = dir;
				else {
					$scope.selectedDir = {
						ID: 0
					};
				}
			};

			$scope.select = function() {
				if(!$scope.selectedDir.ID) {
					mui.toast("请选择类别！");
					return;
				}

				$scope.callback({
					flag: 1,
					selectedDir: $scope.selectedDir
				});
			};

			$scope.cancel = function() {
				$scope.callback({
					flag: 0
				});
			};
		}]
	}
}]);

app.directive('mdUserList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedUsers: "=",
				multiSelect: "=",
				optant: "=",
				fromType: "=",
				isView: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdUserList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.selectedIds = [];
				mui.each($scope.selectedUsers, function(index, item) {
					$scope.selectedIds.push(item.UserID);
				});
				$scope.bannedIds = [];
				var bannedUsers = plus.webview.currentWebview().bannedUsers;
				bannedUsers && mui.each(bannedUsers, function(index, item) {
					$scope.bannedIds.push(item.UserID);
				});

				if($scope.action == "select") {
					//rpc同步页签选择
					RpcServer.expose("RPC_SelectUserRefresh", function(users) {
						$scope.selectedUsers = users;
						$scope.selectedIds = [];
						mui.each($scope.selectedUsers, function(index, item) {
							$scope.selectedIds.push(item.UserID);
						});
						$scope.$apply();
					})
				}

				$scope.tap = function(user) {
					if($scope.bannedIds.indexOf(user.UserID) >= 0) return;
					if($scope.action == "select") {
						if($scope.multiSelect == 'true') {
							var index = $scope.selectedIds.indexOf(user.UserID);
							if(index >= 0) {
								//反选
								$scope.selectedIds.splice(index, 1);
								$scope.selectedUsers.splice(index, 1);
							} else {
								$scope.selectedIds.push(user.UserID);
								$scope.selectedUsers.push(user);
							}
						} else {
							//反选
							if($scope.selectedIds.length > 0) {
								user = user.UserID == $scope.selectedIds[0] ? {} : user;
							}
							//选择
							$scope.selectedIds[0] = user.UserID || 0;
							$scope.selectedUsers[0] = user || {};
						}

						RpcClient.invoke("contact-select.html", "RPC_SelectUserInfo", $scope.selectedUsers);
						return;
					}

					if($scope.optant == 'edit') {
						UtilsService.openWindow({
							needLogin: true,
							id: 'personal-edit.html',
							url: 'personal-edit.html?userid=' + user.UserID
						});
					} else if($scope.optant == 'view') {
						UtilsService.openWindow({
							needLogin: true,
							id: 'personal-info.html',
							url: '../contact/personal-info.html?userid=' + user.UserID + '&type=staff' //staff:人员跳转查看页面 传入参数控制是否显示右上角更多
						});
					} else if(!$scope.optant) {
						UtilsService.openWindow({
							needLogin: true,
							id: 'personal-info.html',
							url: 'personal-info.html?userid=' + user.UserID + '&type=' + ($scope.fromType == 'work' ? 'staff' : '')
						});
					}
				}
			}]
		};
	}
]);
app.directive('mdDescriptionSelect', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedUsers: "=",
				multiSelect: "=",
				optant: "=",
				fromType: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDescriptionSelect.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.selectedIds = [];
				mui.each($scope.selectedUsers, function(index, item) {
					$scope.selectedIds.push(item.ID);
				});

				$scope.bannedIds = [];
				var bannedUsers = plus.webview.currentWebview().selectObj;
				$scope.selectId = bannedUsers.ID

				bannedUsers && mui.each(bannedUsers, function(index, item) {
					$scope.bannedIds.push(item.ID);
				});

				if($scope.action == "select") {
					//rpc同步页签选择
					RpcServer.expose("RPC_SelectUserRefresh", function(users) {
						$scope.selectedUsers = users;
						$scope.selectedIds = [];
						mui.each($scope.selectedUsers, function(index, item) {
							$scope.selectedIds.push(item.ID);
						});
						$scope.$apply();
					})
				}

				$scope.tap = function(user) {

					if($scope.bannedIds.indexOf(user.ID) >= 0) return;
					if($scope.action == "select") {
						if($scope.multiSelect == 'true') {
							var index = $scope.selectedIds.indexOf(user.ID);
							if(index >= 0) {
								//反选
								$scope.selectedIds.splice(index, 1);
								$scope.selectedUsers.splice(index, 1);
							} else {
								$scope.selectedIds.push(user.ID);
								$scope.selectedUsers.push(user);

							}
						} else {
							//反选
							if($scope.selectedIds.length > 0) {

								user = user.ID == $scope.selectedIds[0] ? {} : user;
							}
							//选择
							$scope.selectedIds[0] = user.ID || 0;
							$scope.selectedUsers[0] = user || {};
						}
						var view = plus.webview.currentWebview();
						var opener = view.opener();
						if(view.callback) {
							opener.evalJS(view.callback + "(" + JSON.stringify(user) + ")");
						}
						mui.back();
						//						RpcClient.invoke("contact-select.html", "RPC_SelectUserInfo", $scope.selectedUsers);
						//						return;
					}

				}
			}]
		};
	}
]);
app.directive('mdWorkUserList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdWorkUserList.html',
			controller: ["$scope", "UtilsService", "RPCObserver", function($scope, UtilsService, RPCObserver) {
				var workDate = {};
				RPCObserver.on("sync_work_date", "sync_work_date");
				window.sync_work_date = function(date) {
					workDate = date;
				}
				$scope.tap = function(user) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'work-user.html',
						url: 'work-user.html?id=' + user.CreateUserID,
						extras: {
							workUserName: user.CreateUserName,
							workDate: workDate
						}
					});

				}
			}]
		};
	}
]);
app.directive('mdUserResoList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedUsers: "=",
				multiSelect: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdUserResoList.html',
			controller: ["$scope", "UtilsService", "CacheService", function($scope, UtilsService, CacheService) {
				$scope.selectedIds = [];
				$scope.curUser = CacheService.get("user");
				$scope.CompID = $scope.curUser.CompID;
				mui.each($scope.selectedUsers, function(index, item) {
					$scope.selectedIds.push(item.UserID);
				});

				$scope.bannedIds = [];
				var bannedUsers = plus.webview.currentWebview().bannedUsers;
				bannedUsers && mui.each(bannedUsers, function(index, item) {
					$scope.bannedIds.push(item.UserID);
				});

				if($scope.action == "select") {
					//rpc同步页签选择
					RpcServer.expose("RPC_SelectUserRefresh", function(users) {
						$scope.selectedUsers = users;
						$scope.selectedIds = [];
						mui.each($scope.selectedUsers, function(index, item) {
							$scope.selectedIds.push(item.UserID);
						});
						$scope.$apply();
					})
				}

				$scope.gotoComp = function(compid) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'complib-index.html',
						url: '../complib/index.html?compid=' + compid + "&tabidx=3&isResource=1"
					});
				};

				$scope.checkUser = function(user) {
					if($scope.bannedIds.indexOf(user.UserID) >= 0) return;
					if($scope.action == "select") {
						if($scope.multiSelect == "true") {
							var index = $scope.selectedIds.indexOf(user.UserID);
							if(index >= 0) {
								//反选
								$scope.selectedIds.splice(index, 1);
								$scope.selectedUsers.splice(index, 1);
							} else {
								$scope.selectedIds.push(user.UserID);
								user.RealName = user.ViewName;
								$scope.selectedUsers.push(user);
							}
						} else {
							//反选
							if($scope.selectedIds.length > 0) {
								user = user.UserID == $scope.selectedIds[0] ? {} : user;
							}
							//选择
							$scope.selectedIds[0] = user.UserID || 0;
							$scope.selectedUsers[0] = user || {};
						}

						RpcClient.invoke("contact-select.html", "RPC_SelectUserInfo", $scope.selectedUsers);
						return;
					}
					UtilsService.openWindow({
						needLogin: true,
						id: 'personal-info.html',
						url: 'personal-info.html?userid=' + user.UserID
					});
				}
			}]
		};
	}
]);
app.directive('mdDeviceList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDeviceList.html',
			controller: ["$scope", "UtilsService", "ApiService", "RPCObserver", function($scope, UtilsService, ApiService, RPCObserver) {
				$scope.selectedIds = [];
				$scope.selectArr = plus.webview.currentWebview().selectArr;
				mui.each($scope.selectArr, function(index, item) {
					item.ID && $scope.selectedIds.push(item.ID);
				});
				$scope.multiSelect = query("multiselect") || "false";
				if($scope.action == "select") {
					//rpc同步页签选择
					RPCObserver.on("RPC_FaultEquSelectRefresh", "faultEquSelectRefresh")
					window.faultEquSelectRefresh = function(params) {
						$scope.selectArr = params;
						$scope.selectedIds = [];
						mui.each($scope.selectArr, function(index, item) {
							item.ID && $scope.selectedIds.push(item.ID);
						});
						$scope.$apply();
					}
				}
				$scope.equTap = function(type, obj) {
					if($scope.action == "select") {
						if($scope.multiSelect == "true") {
							var index = $scope.selectedIds.indexOf(obj.ID);
							if(index >= 0) {
								//反选
								$scope.selectedIds.splice(index, 1);
								$scope.selectArr.splice(index, 1);
							} else {
								$scope.selectedIds.push(obj.ID);
								$scope.selectArr.push(obj);
							}
						} else {
							//反选
							if($scope.selectedIds.length > 0) {
								obj = obj.ID == $scope.selectedIds[0] ? {} : obj;
							}
							//选择
							$scope.selectedIds[0] = obj.ID || 0;
							$scope.selectArr[0] = obj || {};
						}
						RPCObserver.broadcast("RPC_FaultEquSelectInfo", $scope.selectArr);
						return;
					}
					switch(type) {
						//设备查看
						case 'checkEqu':
							if($scope.action == "view") {
								UtilsService.openWindow({
									id: 'equ-details-external.html',
									url: '../eqmentlib/equ-details-external.html?equid=' + obj.ID
								});
							} else {
								UtilsService.openWindow({
									id: 'equ-details.html',
									url: '../eqmentlib/equ-details.html?equid=' + obj.ID
								});
							}
							break;
							//设备编辑
						case 'editEqu':
							UtilsService.openWindow({
								id: 'equ-edit.html',
								url: 'equ-edit.html?equid=' + obj.ID
							});
							break;
						default:
							break;
					}
				}
			}]
		};
	}
]);

app.directive('mdCustomerTranslation', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				showType: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdCustomerTranslation.html',
			controller: ["$scope", "UtilsService", "$filter", function($scope, UtilsService, $filter) {
				//跳转
				$scope.tap = function(evalObj) {
					var url = evalObj.IsEval == 0 ? 'eval-edit.html' : 'eval-info.html';
					UtilsService.openWindow({
						needLogin: true,
						id: url,
						url: '../aftersale/' + url + '?repairid=' + evalObj.ID + "&evalid=" + evalObj.EvalID + "&Jurisdiction=" + $filter("hasAuth")("Q33")
					});
				};
			}]
		}
	}
]);
app.directive('mdMatPartReplList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatPartReplList.html',
			controller: ["$scope", function($scope) {
				$scope.NumsLi = -1;
				//删除换件
				$scope.delPartItem = function(index) {
					if($scope.model.length == 1) {
						return;
					}
					if($scope.model[index].ID == 0) {
						$scope.model.splice(index, 1);
					} else {
						$scope.model[index].IsDelete = 1;
					}
					numLiPart();
				};

				$scope.showDelBtn = function(item) {
					return $scope.model.filter(function(item) {
						return item.IsDelete != 1;
					}).length > 1;
				};

				function numLiPart() {
					var liNum = 0;
					$scope.model.forEach(function(item) {
						if(!item.IsDelete) {
							liNum += 1;
						}
					})
					$scope.NumsLi = liNum;
					RpcClient.invoke("mat-part-edit.html", "RPC_partChangeNums", liNum);
				};
			}]
		}
	}
]);

app.directive('mdMatPartLookList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatPartLookList.html',
			controller: ["$scope", function($scope) {
				//
			}]
		}
	}
]);
app.directive('mdRemindList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdRemindList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				//跳转
				$scope.gotoinfo = function(id) {

					UtilsService.openWindow({
						needLogin: false,
						id: 'remind-info.html',
						url: 'remind-info.html?id=' + id,
					});
				};
			}]
		}
	}
]);
app.directive('mdWorkRecord', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdWorkRecord.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.listType = query("type");
				$scope.tap = function(event, key, item) {
					event.stopPropagation();
					if(item.IsRead == 0) {
						$scope.model.forEach(function(_item, _index) {
							if(item.ID == _item.ID) {
								_item.IsRead = 1;
							}
						})
					}
					var url = {
						WorkInfo: 'work-info.html?id=' + item.ID,
					};
					item.LogID && (url[key] += '&logid=' + item.LogID);
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		}
	}
]);
app.directive('mdSearchWorkUser', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdSearchWorkUser.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {

				$scope.top = function(user) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'work-user.html',
						url: 'work-user.html?id=' + user.CreateUserID,
						extras: {
							workUserName: user.CreateUserName,
							workDate: {
								start: "",
								end: ""
							}

						}
					});

				}
			}]
		}
	}
]);
app.directive('mdDeviceFaultList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDeviceFaultList.html',
			controller: ["$scope", "UtilsService", "ApiService", "RPCObserver", function($scope, UtilsService, ApiService, RPCObserver) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RPCObserver.on("RPC_FaultSelectRefresh", "faultSelectRefresh");
					window.faultSelectRefresh = function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					}
				}
				$scope.faultRecord = {
					//页面 跳转
					PageJump: function(num, obj) {
						if($scope.action == "select") {
							//反选
							obj = obj.ID == $scope.selectedId ? {} : obj;
							//选择
							$scope.selectedId = obj ? obj.ID : 0;
							RPCObserver.broadcast("RPC_FaultSelectInfo", obj);
							return;
						}
						if(obj.JobFrom == 3) {
							var infoUrl = "../eqmentlib/equ-thirdpart-repair-info.html?id=" + obj.ID
						} else {
							var infoUrl = obj.JobFrom == 1 ? "../eqmentlib/fault-info.html?id=" + obj.ID : "../mine/fault-info.html?id=" + obj.ID;
						}
						var Url = [
							infoUrl,
							"../eqmentlib/fault-edit.html?id=" + obj.ID
						];
						UtilsService.openWindow({
							needLogin: true,
							id: Url[num].substring(2, Url[num].lastIndexOf(".html") + 5),
							url: Url[num]
						});
					}
				};
			}]
		};
	}
]);

app.directive('mdEquFaultList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdEquFaultList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				$scope.faultRecord = {
					//页面 跳转
					PageJump: function(num, obj) {
						if(obj.JobFrom == 3) {
							var infoUrl = "../eqmentlib/equ-thirdpart-repair-info.html?id=" + obj.ID
						} else {
							var infoUrl = obj.JobFrom == 1 ? "../eqmentlib/fault-info.html?id=" + obj.ID : "../mine/fault-info.html?id=" + obj.ID;
						}

						var Url = [
							infoUrl,
							"./fault-edit.html?id=" + obj.ID
						];
						UtilsService.openWindow({
							needLogin: true,
							id: Url[num].substring(2, Url[num].lastIndexOf(".html") + 5),
							url: Url[num]
						});
					}
				};
			}]
		};
	}
]);
app.directive('mdHelpInfo', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdHelpInfo.html',
			controller: ["$scope", "UtilsService", "ChatUserService", "CacheService", function($scope, UtilsService, ChatUserService, CacheService) {
				$scope.curUser = CacheService.get("user");

				$scope.sendMsg = function(userid, userName, hasLogo, compId) {
					ChatUserService.tap({
						chatId: userid,
						chatName: userName,
						hasLogo: hasLogo,
						chatCompId: compId
					});
				}
			}]
		};
	}
]);

app.directive('mdDeviceRepairList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "=",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDeviceRepairList.html',
			controller: ["$scope", "UtilsService", "ApiService", "RPCObserver", function($scope, UtilsService, ApiService, RPCObserver) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RPCObserver.on("RPC_RepairSelectRefresh", "repairSelectRefresh");
					window.repairSelectRefresh = function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					}
				}
				//跳转
				$scope.tap = function(key, obj) {
					if($scope.action == "select") {
						//反选
						obj = obj.ID == $scope.selectedId ? {} : obj;
						//选择
						$scope.selectedId = obj ? obj.ID : 0;
						RPCObserver.broadcast("RPC_RepairSelectInfo", obj);
						return;
					}
					var url = {
						repairView: 'equ-repairView.html?id=' + obj.ID,
						repairEdit: 'equ-repair.html?id=' + obj.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdEquRepairList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdEquRepairList.html',
			controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
				//跳转
				$scope.tap = function(key, obj) {
					var url = {
						repairView: 'equ-repairView.html?id=' + obj.ID,
						repairEdit: 'equ-repair.html?id=' + obj.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdRepairList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdRepairList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RpcServer.expose("RPC_RepairSelectRefresh", function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					})
				}
				//跳转
				$scope.tap = function(key, obj) {
					if($scope.action == "select") {
						//反选
						obj = obj.ID == $scope.selectedId ? {} : obj;
						//选择
						$scope.selectedId = obj ? obj.ID : 0;
						RpcClient.invoke("repair-list.html", "RPC_RepairSelectInfo", obj);
						return;
					}
					var url = {
						repairView: 'equ-repairView.html?id=' + obj.ID,
						repairEdit: 'equ-repair.html?id=' + obj.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdMatRepairList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "=",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatRepairList.html',
			controller: ["$scope", "UtilsService", "RPCObserver", function($scope, UtilsService, RPCObserver) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RPCObserver.on('refresh_mat_Repair_Select_Refresh', 'refresh_mat_Repair_Select_Refresh');
					window.refresh_mat_Repair_Select_Refresh = function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					};
				}
				//跳转
				$scope.tap = function(key, obj) {
					if($scope.action == "select") {
						//反选
						obj = obj.ID == $scope.selectedId ? {} : obj;
						//选择
						$scope.selectedId = obj ? obj.ID : 0;
						RPCObserver.broadcast('refresh_mat_Repair_Select_Info', obj);
						return;
					}
					var url = {
						repairView: '../aftersale/mat-repairView.html?id=' + obj.ID,
						repairEdit: '../aftersale/mat-repair.html?id=' + obj.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(url[key].lastIndexOf('/') + 1, url[key].indexOf('?')),
						url: url[key]
					});
				};
			}]
		};
	}
]);
app.directive('mdScanList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				data: "=ngModel",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdScanList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {

			}]
		};
	}
]);
app.directive('mdMatFaultRepairList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatFaultRepairList.html',
			controller: ["$scope", "UtilsService", "$rootScope", function($scope, UtilsService, $rootScope) {
				//跳转
				$scope.tap = function(key, obj) {
					$rootScope.$broadcast("stop_audio");
					var url = {
						repairView: 'mat-repairView.html?id=' + obj.ID,
						repairEdit: 'mat-repair.html?id=' + obj.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdFaultyWorkOrder', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				action: "=",
				selectedId: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdFaultyWorkOrder.html',
			controller: ["$scope", "UtilsService", "RPCObserver", function($scope, UtilsService, RPCObserver) {
				if($scope.action == "select") {
					//rpc同步页签选择
					RPCObserver.on('refresh_mat_fault_Select_Refresh', 'refresh_mat_fault_Select_Refresh');
					window.refresh_mat_fault_Select_Refresh = function(id) {
						$scope.selectedId = id;
						$scope.$apply();
					};
				}
				$scope.tap = function(key, prod) {
					if($scope.action == "select") {
						//反选
						prod = prod.ID == $scope.selectedId ? {} : prod;
						//选择
						$scope.selectedId = prod ? prod.ID : 0;
						RPCObserver.broadcast('refresh_mat_fault_Select_Info', prod);
						return;
					}
					var url = {
						faultView: '../aftersale/mat-fault-info.html?id=' + prod.ID,
						faultEdit: '../aftersale/mat-fault-edit.html?id=' + prod.ID
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(url[key].lastIndexOf('/') + 1, url[key].indexOf('?')),
						url: url[key]
					});
				}
			}]
		};
	}
]);

app.directive('mdDebugList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDebugList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				var title = query("title") || "安装调试";
				$scope.tap = function(prod) {
					UtilsService.openWindow({
						needLogin: true,
						id: "debug-info.html",
						url: "debug-info.html?id=" + prod.ID + "&title=" + title
					});
				}
			}]
		};
	}
]);
app.directive('mdServiceList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdServiceList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				var title = query("title") || "其他服务详情";
				$scope.tap = function(prod) {
					UtilsService.openWindow({
						needLogin: true,
						id: "service-info.html",
						url: "service-info.html?id=" + prod.ID + "&title=" + title
					});
				}
			}]
		};
	}
]);

app.directive('mdPartReplceList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				optant: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdPartReplceList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				//跳转
				$scope.tap = function(indexID) {
					if($scope.optant == 'read') { //只读
						UtilsService.openWindow({
							needLogin: true,
							id: "part-info.html",
							url: "part-info.html?id=" + indexID
						});
					} else if($scope.optant == 'write') { //可编辑
						UtilsService.openWindow({
							needLogin: true,
							id: "part-edit.html",
							url: "part-edit.html?id=0",
							extras: {
								newPart: $scope.model[indexID],
								newPartIndex: indexID
							}
						});
					}
				};
				//删除
				$scope.delpartListItem = function(index) {
					if($scope.model[index].ID > 0) {
						$scope.model[index].IsDelete = 1;
					} else {
						$scope.model.splice(index, 1);
					}
				}
			}]
		};
	}
]);

app.directive('mdMatPartReplceList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				optant: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdMatPartReplceList.html',
			controller: ["$scope", "UtilsService", "$rootScope", function($scope, UtilsService, $rootScope) {
				$scope.NumsLi = -1;
				RpcServer.expose("RPC_PartNumRefresh", function() {
					var liNum = 0;
					$scope.model.forEach(function(item) {
						if(!item.IsDelete) {
							liNum += 1;
						}
					})
					$scope.NumsLi = liNum;
					$scope.$apply();
					RpcClient.invoke("mat-part-edit.html", "RPC_partChangeNums", liNum);
				})
				//跳转
				$scope.tap = function(indexID) {
					if($scope.optant == 'read') { //只读
						$rootScope.$broadcast("stop_audio");
						UtilsService.openWindow({
							needLogin: true,
							id: "mat-part-info.html",
							url: "mat-part-info.html?id=" + indexID
						});
					} else if($scope.optant == 'write') { //可编辑
						UtilsService.openWindow({
							needLogin: true,
							id: "mat-part-edit.html",
							url: "mat-part-edit.html?id=0",
							extras: {
								newPart: $scope.model[indexID],
								newPartIndex: indexID
							}
						});
					}
				};
				//删除
				$scope.delpartListItem = function(index) {
					if($scope.model[index].ID > 0) {
						$scope.model[index].IsDelete = 1;
					} else {
						$scope.model.splice(index, 1);
					}
					numLiPart();
				}

				function numLiPart() {
					var liNum = 0;
					$scope.model.forEach(function(item) {
						if(!item.IsDelete) {
							liNum += 1;
						}
					})
					$scope.NumsLi = liNum;
					RpcClient.invoke("mat-part-edit.html", "RPC_partChangeNums", liNum);
				};
			}]
		};
	}
]);

app.directive('mdDeviceInspList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDeviceInspList.html',
			controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
				//跳转
				$scope.tap = function(event, key, id) {
					event.stopPropagation();
					var url = {
						maintenView: 'equ-maintenanceView.html?id=' + id,
						maintenEdit: 'equ-maintenance.html?id=' + id
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdDevicePreserveList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				type: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDevicePreserveList.html',
			controller: ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
				//跳转
				$scope.tap = function(event, key, id) {
					event.stopPropagation();
					var url = {
						preserveView: 'equ-preserveView.html?id=' + id,
						preserveEdit: 'equ-preserve.html?id=' + id
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdEquInspList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdEquInspList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				//跳转
				$scope.tap = function(event, key, id) {
					event.stopPropagation();
					var url = {
						maintenView: 'equ-maintenanceView.html?id=' + id,
						maintenEdit: 'equ-maintenance.html?id=' + id
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdEquInspPlanRecordList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdEquInspPlanRecordList.html',
			controller: ["$scope", "UtilsService", function($scope, UtilsService) {
				//跳转
				$scope.tap = function(event, key, id) {
					event.stopPropagation();
					var url = {
						maintenView: 'equ-maintenance-details-view.html?id=' + id,
						maintenEdit: 'equ-maintenance-details-view.html?id=' + id
					};
					UtilsService.openWindow({
						needLogin: true,
						id: url[key].substring(0, url[key].lastIndexOf(".html") + 5),
						url: url[key]
					});
				};
			}]
		};
	}
]);

app.directive('mdChatUserList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdChatUserList.html',
			controller: ["$scope", "ChatUserService", "CacheService", function($scope, ChatUserService, CacheService) {
				var user = CacheService.get("user");
				var userid = user ? user.UserID : 0;
				$scope.tap = function(event, user) {
					event.stopPropagation();
					if(userid == user.ID) {
						mui.toast('不能与自己会话');
					} else {
						ChatUserService.tap({
							chatId: user.ID,
							chatName: user.Name,
							hasLogo: user.ULogoIsExist,
							chatCompId: user.CompID
						});
					}
				};
			}]
		};
	}
]);

app.directive('mdNotice', [
	function() {
		return {
			restrict: 'EA',
			scope: {
				backFn: "&",
				model: "=ngModel"
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdNotice.html',
			controller: ["$scope", "$Modal", function($scope, $Modal) {
				$scope.showBack = function() {
					return $scope.model.ProcessList.some(function(item) {
						return item.State == 3;
					});
				};
			}]
		};
	}
]);

app.directive('mdSelectFooter', [function() {
	return {
		restrict: 'E',
		scope: {
			submit: "&",
			type: "=",
			model: "=ngModel",
			btnText2: "=",
			btnEvent2: "&",
			isView: "=",
			btnText: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdSelectFooter.html',
		controller: ["$scope", function($scope) {
			$scope.isShow = false;
			//弹出悬浮窗
			var floatw = null;
			mui.plusReady(function() {
				//菜单
				var styles = {
					background: 'transparent',
					zindex: 10,
					bottom: '45px',
				};
				if(mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
					styles.hardwareAccelerated = false;
				}
				floatw = plus.webview.create("../menus/md-selected-list.html?type=" + $scope.type, "md-selected-list.html", styles, {
					selectObj: $scope.model,
					isView: $scope.isView
				});
				var ws = plus.webview.getWebviewById("md-selected-list.html");
				ws.addEventListener("show", function(res) {
					$scope.isShow = true;
					$scope.$apply();
				})
				ws.addEventListener("hide", function(res) {
					$scope.isShow = false;
					$scope.$apply();
				})
				$scope.openList = function() {
					if($scope.model.length == 0) {
						mui.toast("当前未选中任何数据");
						return;
					}
					$scope.model.length > 0 && floatw && !$scope.isShow && floatw.show("fade-in");
					floatw && $scope.isShow && floatw.hide("fade-out");
				}
			});

		}]
	};
}]);

app.directive('mdStateTip', [function() {
	return {
		restrict: 'E',
		scope: {
			options: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdStateTip.html',
		controller: ["$scope", function($scope) {}]
	};
}]);

app.directive("mdSaveMenus", [function() {
	return {
		restrict: "EA",
		scope: {
			listFn: "&",
			editFn: "&",
			isShowEdit: "=",
			model: "=ngModel"
		},
		templateUrl: localPath + '/js/pages/mdSaveMenus.html',
		controller: ["$scope", function($scope) {
			$scope.localPath = localPath;
		}]
	}
}]);

app.directive('customerInfoList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel" // 创建一个全新的隔离作用域
			},
			transclude: true, // 不想让指令内部的内容被模板替换，可以设置这个值为true
			templateUrl: '../aftersale/customerInfoList.html',
			controller: ["$scope", "UtilsService", "$rootScope", "CacheService", "ChatUserService", "$filter",
				function($scope, UtilsService, $rootScope, CacheService, ChatUserService, $filter) {
					//跳转到相应的页面
					$scope.evals = {
						1: "非常满意",
						2: "满意",
						3: "一般",
						4: "不满意"
					}
					$scope.DateType = {
						1: "日",
						2: "月",
						3: "年"
					}
					$scope.tap = function(href, obj) {
						$rootScope.$broadcast("stop_audio");
						if(!href) return;
						var winid, url;
						if(href.indexOf("eval-info.html") > -1) {
							winid = obj.IsEval == 0 ? 'eval-edit.html' : 'eval-info.html';
							url = '../aftersale/' + winid + '?repairid=' + obj.ID + "&evalid=" + obj.EvalID + "&Jurisdiction=" + $filter("hasAuth")("Q33");
						} else if(["../problib/securing-services-info.html", "linkman-info.html"].indexOf(href) > -1) {
							winid = href;
							url = href + "?id=" + obj.ID;
						} else {
							winid = href;
							url = '../aftersale/' + href + "?id=" + obj.ID;
						}
						UtilsService.openWindow({
							needLogin: true,
							id: winid,
							url: url
						});
					};
					$scope.call = function(phone) {
						event.stopPropagation();
						plus.device.dial(phone, false);
						return false;
					}
					$scope.lookover = function(key, title) {
						var url;
						if(key == 'parts') {
							title = "配件列表";
							url = "../aftersale/mat-part-infolist.html?type=all&customerid=" + query("customerid");
						} else {
							url = "../aftersale/customer-datas.html?key=" + key + "&id=" + query("customerid");
						}
						UtilsService.openWindow({
							needLogin: true,
							id: "hyperlink.html",
							url: "../../pages/common/hyperlink.html",
							extras: {
								hyperlink: {
									title: title,
									url: url
								}
							}
						});
					}

					var userInfo = CacheService.get("user");
					var userid = userInfo ? userInfo.UserID : 0;
					$scope.chart = function(event, user) {
						event.stopPropagation();
						var chatId = user.CreateUserID || user.ID;
						if(userid == chatId) {
							mui.toast('不能与自己会话');
						} else {
							// 不存在
							ChatUserService.tap({
								chatId: chatId,
								chatName: user.CreateUserName || user.Name,
								hasLogo: user.ULogoIsExist,
								chatCompId: user.CompID
							});
						}
					};
				}
			]
		};
	}
]);

app.filter("cloneTreeNode", function() {
	return function(_node) {
		var temp_node = angular.extend({}, _node);
		delete temp_node.children;
		return temp_node;
	}
});

app.directive('mdCompile', ["$compile", function($compile) {
	return {
		restrict: 'E',
		template: "",
		link: function(scope, element, attrs) {
			if(attrs.content) {
				attrs.xss !== 'false' && (attrs.content = filterXSS(attrs.content));
				element.html(attrs.content);
				$compile(element.contents())(scope);
			} else if(attrs.template) {
				scope.$watch(attrs.template,
					function(value) {
						attrs.xss !== 'false' && (value = filterXSS(value));
						element.html(value);
						$compile(element.contents())(scope);
					}
				);
			}
		}
	};
}]);

app.directive('mdTree', [
	function() {
		return {
			template: '<md-tree-node data-list="private_root" data-load="load" data-template="node_template" data-options="private_options"></md-tree-node>',
			scope: {
				options: "=",
				template: "=",
				root: "=",
				load: "="
			},
			restrict: 'E',
			controller: ["$scope", "$filter",
				function($scope, $filter) {
					var template_icon = [],
						template_caption = "{{_node.name}}";
					if($scope.template) {
						template_icon = $scope.template.icon.concat(template_icon);
						template_caption = $scope.template.caption || template_caption;
					}
					var _class = "";
					template_icon.reverse().forEach(function(_item) {
						var condition = Object.getOwnPropertyNames(_item)[0];
						var icon = _item[condition];
						if((/\?/g).test(_class)) _class = "(" + _class + ")";
						if(condition) _class = condition + "?'" + icon + "':" + _class + "'";
						else _class = "'" + icon + "'";
					});

					$scope.node_template = "<span>" + template_caption + "</span>";
					if(_class)
						$scope.node_template = '<span class="md-tree-node-icon" ng-class="' + _class + '"></span>' + $scope.node_template;
					if($scope.options) {
						$scope.private_options = $scope.options;
					} else {
						$scope.private_options = {};
					}
					$scope.private_root = $scope.root;
					if(!$scope.root) {
						$scope.load && $scope.load().then(function(data) {
							$scope.private_root = data;
							if($scope.private_root.length === 0) {
								return;
							}
							var _root = $scope.private_root[0];
							if($scope.private_root.length === 1 && !$scope.private_root[0].is_leaf && !$scope.private_root[0].children) {
								$scope.load(_root).then(function(data) {
									data.forEach(function(_item) {
										_item.parent = $filter("cloneTreeNode")(_root);
										_item.tree_id = _root.tree_id + "!" + _item.id;
									});
									_root.children = data;
									_root.expanded = true;
								});
							}

							/**************默认选中第一个根节点*************/
							if(!$scope.private_options || $scope.private_options.auto_select === false || $scope.private_options.selected) {
								return;
							}
							if(_root.usable == null && $scope.private_options.usable) {
								_root.usable = !!$scope.private_options.usable(_root);
							}
							if(_root.usable === false) {
								return;
							}
							if(!$scope.private_options.multi) {
								if(_root === $scope.private_options.selected) {
									return;
								}
								$scope.private_options.selected = _root;
								$scope.$emit('tree-node-selected', _root, $scope.private_root);
							}
							/***********************************************/
						});
					}

					function find_node(_parent, _path) {
						if(!_parent) {
							return;
						}
						if(_path.length === 1) {
							return _parent;
						} else {
							var _id = _path.splice(0, 1);
							if(!_parent.children) {
								return;
							}
							return find_node(_parent.children.filter(function(_node) {
								return _node.id == _id;
							})[0], _path);
						}
					}

					$scope.$on("refresh_tree_node", function(event, _node, refresh_type) {
						if($scope.private_root) {
							var _path = _node.tree_id.split("!");
							var _node_id = _path[_path.length - 1];
							var root_parent = $scope.private_root.filter(function(_item) {
								return ~_path.indexOf(String(_item.id));
							})[0];
							if(!root_parent) {
								return;
							}
							var _index = _path.indexOf(String(root_parent.id));
							if(_index === -1) {
								return;
							}
							_path.splice(0, _index + 1);
							var _parent = find_node(root_parent, _path);
							if(!_parent) {
								return;
							}
							if(refresh_type === "modify" && _parent.children) {
								_parent.children.forEach(function(_item) {
									if(String(_item.id) === _node_id) {
										for(var _property in _node) {
											if(_property !== "tree_id" && _node.hasOwnProperty(_property)) {
												_item[_property] = _node[_property];
											}
										}
									}
								});
							} else if(refresh_type === "add") {
								_parent.is_leaf = false;
								$scope.load(_parent).then(function(data) {
									data.forEach(function(_item) {
										_item.parent = $filter("cloneTreeNode")(_parent);
										_item.tree_id = _parent.tree_id + "!" + _item.id;
									});
									_parent.children = data;
									_parent.expanded = true;
								});
							} else if(refresh_type === "remove") {
								if(!_parent.children) {
									return;
								}
								var _removed = _parent.children.filter(function(_item) {
									return String(_item.id) === _node_id;
								})[0];
								if(!_removed) {
									return;
								}
								var removed_index = _parent.children.indexOf(_removed);
								if(removed_index === -1) {
									return;
								}
								_parent.children.splice(removed_index, 1);
								if(_parent.children.length === 0) {
									_parent.is_leaf = true;
									_parent.expanded = false;
								}
							}
						}
					});
				}
			]
		};
	}
]);

app.directive('mdTreeNode', [function() {
	return {
		templateUrl: localPath + '/js/pages/treeNode.html',
		restrict: 'E',
		scope: {
			"template": "=",
			"load": "=",
			"list": "=",
			"options": "="
		},
		controller: ["$scope", "$timeout", "$q", "$filter", function($scope, $timeout, $q, $filter) {

			/*tree options格式
			 {
			 "multi":"boolean"是否支持多选,
			 "usable":"function返回节点是否可用",
			 "expand_all":"boolean 当前是否为过滤列表，过滤列表不能拖拽",
			 "sortable":"是否支持同级树节点排序",
			 "sort":"function返回排序之后的数组",
			 "selected":"返回选中状态，单选模式返回对象，多选模式返回数组",
			 "positioned":"node当前被定位对象"
			 }*/

			$scope.sortable_config = {
				group: {
					name: 'tree_sort:' + Math.random()
				},
				animation: 150,
				onSort: function(data) {
					$scope.options && $scope.options.sort && $scope.options.sort(data.models);
				}
			};
			(!$scope.options || !$scope.options.sortable) && ($scope.sortable_config.draggable = 'virtual');

			var tree_id;

			function init() {
				var _parent_node = $scope.$parent._node;
				$scope.options && $scope.list.forEach(function(_node) {
					var key = "id";
					if(([].concat($scope.options.selected || [])[0] || {}).hasOwnProperty("tree_id")) {
						key = "tree_id";
					}
					if(!_node.hasOwnProperty("tree_id")) {
						if(_parent_node) {
							_node.parent = $filter("cloneTreeNode")(_parent_node);
							_node.tree_id = _parent_node.tree_id + "!" + _node.id;
						} else {
							_node.tree_id = _node.id.toString();
						}
					}
					if($scope.options.usable)
						_node.usable = !!$scope.options.usable(_node);
					if(!$scope.options.selected) {
						return;
					}
					if($scope.options.multi) {
						if(!$scope.options.selected.length) {
							return;
						}
						var _temp = $scope.options.selected.find(function(_item) {
							return _item[key] === _node[key];
						});
						if(!_temp) {
							return;
						}
						var _index = $scope.options.selected.indexOf(_temp);
						if(_node.usable !== false) {
							$scope.options.selected.splice(_index, 1, _node);
						} else {
							$scope.options.selected.splice(_index, 1);
						}
					} else if($scope.options.selected[key] === _node[key]) {
						if(_node.usable !== false) {
							$scope.options.selected = _node;
						} else {
							$scope.options.selected = null;
						}
					}
				});
			}

			if($scope.list) {
				init();
			}

			function private_load(_node) {
				var defer = $q.defer();
				$scope.load && $scope.load(_node).then(function(data) {
					data.forEach(function(_item) {
						if(_item.virtual) {
							_item.children && (_item.children.forEach(function(_item) {
								_item.parent = $filter("cloneTreeNode")(_node);
							}))
						} else {
							_item.parent = $filter("cloneTreeNode")(_node);
						}
						if(_item.tree_id) {
							//业务中设置过tree_id时  tree不再处理tree_id
							return;
						}
						_item.tree_id = _item.id;
						if(_node) {
							_item.tree_id = (_node.tree_id || _node.id) + "!" + _item.tree_id;
						}
					});
					_node.children = data;
					if(data.length === 0) {
						_node.is_leaf = true;
					}
					defer.resolve(_node.children);
				});
				return defer.promise;
			}

			$scope.toggle_expand = function(event, _node) {
				event.stopPropagation();
				if(_node.is_leaf) {
					return;
				}
				_node.expanded = !_node.expanded;
				!_node.children && private_load(_node);
			};
			$scope.node_select = function(event, _node, list) {
				event.stopPropagation();
				if(!$scope.options || !_node) {
					return;
				}
				if(_node.usable == null && $scope.options.usable) {
					_node.usable = !!$scope.options.usable(_node);
				}
				if(_node.usable === false) {
					return;
				}
				if($scope.options.multi) {
					if(!$scope.options.selected) {
						$scope.options.selected = [];
					}
					var _selected = $scope.options.selected;
					var _index = _selected.indexOf(_node);

					if(~_index) {
						_selected.splice(_index, 1);
					} else {
						_selected.push(_node)
					}
				} else {
					if(_node === $scope.options.selected) {
						return;
					}
					$scope.options.selected = _node;
					$scope.$emit('tree-node-selected', _node, list);
				}
			};
			$scope.$watch("list", function(val, old_val) {
				if(val && !old_val) {
					position_tree_node();
					if($scope.options) {
						init();
					}
				}
			});

			function position_next(_node, _path, _refresh) {
				if(!_node) {
					return $scope.$emit('tree-node-not-found');
				}
				if(_path.length === 0) {
					if(!$scope.options.multi) {
						if(_node.usable === undefined && $scope.options && $scope.options.usable) {
							_node.usable = !!$scope.options.usable(_node);
						}
						if(_node && _node.usable !== false) {
							if(_node !== $scope.options.selected) {
								$scope.options.selected = _node;
								$scope.$emit('tree-node-selected', _node);
							}
						}
					}
					if(_node !== $scope.options.positioned) {
						$scope.options.positioned = _node;
					}
					$timeout(function() {
						$scope.$emit("position_tree_node_success", _node);
					}, 200);
				} else if(_node) {
					var child_id = _path.splice(0, 1)[0];
					if(_node.children && (!_refresh || _path.length)) {
						_node.expanded = true;
						if(child_id === "*") {
							position_next(_node.children[0], _path);
						} else {
							position_next(_node.children.find(function(_node) {
								return String(_node.id) === child_id;
							}), _path);
						}
					} else if((!_node.children && !_node.is_leaf) || (_refresh && !_path.length)) {
						private_load(_node).then(function() {
							if(_node.children && _node.children.length) {
								_node.is_leaf && (_node.is_leaf = false);
								_node.expanded = true;
								if(child_id === "*") {
									position_next(_node.children[0], _path);
								} else {
									position_next(_node.children.find(function(_node) {
										return String(_node.id) === child_id;
									}), _path);
								}
							}
						});
					}
				}
			}

			function position_tree_node(_refresh) {
				if(!tree_id || !$scope.list) return;
				//遍历当前层级，如果当前层级匹配到tree_id中的某个节点
				// 并且当前节点未展开（展开说明下级也会接收到广播，上级就不需要再处理）
				var _path = tree_id.split("!");
				var last_node = $scope.list.find(function(_item) {
					var _node_id = _item.tree_id && _item.tree_id.split("!").pop() || String(_item.id);
					var _index = _path.indexOf(_node_id);
					if(~_index) {
						if(_index < _path.length - 1) {
							if(_path[_index + 1][0] === "*") {
								return true;
							} else {
								if(_refresh && _item.expanded && _index === _path.length - 2) {
									return true;
								}
								return !_item.expanded;
							}
						} else {
							return true;
						}
					} else if(_item.expanded) {
						_item.expanded = false;
					}
					return false;
				});
				if(last_node) {
					var _node_id = last_node.tree_id && last_node.tree_id.split("!").pop() || String(last_node.id);
					var last_index = _path.indexOf(String(_node_id));
					if(~last_index) {
						_path.splice(0, last_index + 1);
						position_next(last_node, _path, _refresh);
					}
				}
			}

			$scope.$on("position_tree_node", function(event, _tree_id, _refresh) {
				tree_id = _tree_id;
				position_tree_node(_refresh);
			});
		}]
	};
}]);
app.directive('mdIngList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				showType: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdIngList.html',
			controller: ["$scope", "UtilsService", "$filter", function($scope, UtilsService, $filter) {
				//跳转
				$scope.tap = function(evalObj) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'ing-info.html',
						url: localPath + '/pages/ing/ing-info.html?id=' + evalObj.ID
					});
				};
			}]
		}
	}
]);
var baiduAK = "W6WIQmkWMM7fHZ1bQzONDGwimUikfaPU";

var GPS = {
	PI: 3.14159265358979324,
	x_pi: 3.14159265358979324 * 3000.0 / 180.0,
	delta: function(lat, lng) {
		var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
		var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
		var dLat = this.transformLat(lng - 105.0, lat - 35.0);
		var dLng = this.transformLng(lng - 105.0, lat - 35.0);
		var radLat = lat / 180.0 * this.PI;
		var magic = Math.sin(radLat);
		magic = 1 - ee * magic * magic;
		var sqrtMagic = Math.sqrt(magic);
		dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
		dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
		return {
			'lat': dLat,
			'lng': dLng
		};
	},
	//WGS-84 to GCJ-02
	gcj_encrypt: function(wgsLat, wgsLng) {
		if(this.outOfChina(wgsLat, wgsLng))
			return {
				'lat': wgsLat,
				'lng': wgsLng
			};

		var d = this.delta(wgsLat, wgsLng);
		return {
			'lat': wgsLat + d.lat,
			'lng': wgsLng + d.lng
		};
	},
	//GCJ-02 to WGS-84
	gcj_decrypt: function(gcjLat, gcjLng) {
		if(this.outOfChina(gcjLat, gcjLng))
			return {
				'lat': gcjLat,
				'lng': gcjLng
			};

		var d = this.delta(gcjLat, gcjLng);
		return {
			'lat': gcjLat - d.lat,
			'lng': gcjLng - d.lng
		};
	},
	//GCJ-02 to WGS-84 exactly
	gcj_decrypt_exact: function(gcjLat, gcjLng) {
		var initDelta = 0.01;
		var threshold = 0.000000001;
		var dLat = initDelta,
			dLng = initDelta;
		var mLat = gcjLat - dLat,
			mLng = gcjLng - dLng;
		var pLat = gcjLat + dLat,
			pLng = gcjLng + dLng;
		var wgsLat, wgsLng, i = 0;
		while(1) {
			wgsLat = (mLat + pLat) / 2;
			wgsLng = (mLng + pLng) / 2;
			var tmp = this.gcj_encrypt(wgsLat, wgsLng);
			dLat = tmp.lat - gcjLat;
			dLng = tmp.lng - gcjLng;
			if((Math.abs(dLat) < threshold) && (Math.abs(dLng) < threshold))
				break;

			if(dLat > 0) pLat = wgsLat;
			else mLat = wgsLat;
			if(dLng > 0) pLng = wgsLng;
			else mLng = wgsLng;

			if(++i > 10000) break;
		}
		return {
			'lat': wgsLat,
			'lng': wgsLng
		};
	},
	//GCJ-02 to BD-09
	bd_encrypt: function(gcjLat, gcjLng) {
		var x = gcjLng,
			y = gcjLat;
		var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
		var bdLng = z * Math.cos(theta) + 0.0065;
		var bdLat = z * Math.sin(theta) + 0.006;
		return {
			'lat': bdLat,
			'lng': bdLng
		};
	},
	//BD-09 to GCJ-02
	bd_decrypt: function(bdLat, bdLng) {
		var x = bdLng - 0.0065,
			y = bdLat - 0.006;
		var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
		var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
		var gcjLng = z * Math.cos(theta);
		var gcjLat = z * Math.sin(theta);
		return {
			'lat': gcjLat,
			'lng': gcjLng
		};
	},
	//WGS-84 to Web mercator
	//mercatorLat -> y mercatorLng -> x
	mercator_encrypt: function(wgsLat, wgsLng) {
		var x = wgsLng * 20037508.34 / 180.;
		var y = Math.log(Math.tan((90. + wgsLat) * this.PI / 360.)) / (this.PI / 180.);
		y = y * 20037508.34 / 180.;
		return {
			'lat': y,
			'lng': x
		};
		/*
		 if ((Math.abs(wgsLng) > 180 || Math.abs(wgsLat) > 90))
		 return null;
		 var x = 6378137.0 * wgsLng * 0.017453292519943295;
		 var a = wgsLat * 0.017453292519943295;
		 var y = 3189068.5 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
		 return {'lat' : y, 'lng' : x};
		 //*/
	},
	// Web mercator to WGS-84
	// mercatorLat -> y mercatorLng -> x
	mercator_decrypt: function(mercatorLat, mercatorLng) {
		var x = mercatorLng / 20037508.34 * 180.;
		var y = mercatorLat / 20037508.34 * 180.;
		y = 180 / this.PI * (2 * Math.atan(Math.exp(y * this.PI / 180.)) - this.PI / 2);
		return {
			'lat': y,
			'lng': x
		};
	},
	// two point's distance
	distance: function(latA, lngA, latB, lngB) {
		var earthR = 6371000.;
		var x = Math.cos(latA * this.PI / 180.) * Math.cos(latB * this.PI / 180.) * Math.cos((lngA - lngB) * this.PI / 180);
		var y = Math.sin(latA * this.PI / 180.) * Math.sin(latB * this.PI / 180.);
		var s = x + y;
		if(s > 1) s = 1;
		if(s < -1) s = -1;
		var alpha = Math.acos(s);
		return alpha * earthR;
	},
	outOfChina: function(lat, lng) {
		if(lng < 72.004 || lng > 137.8347)
			return true;
		if(lat < 0.8293 || lat > 55.8271)
			return true;
		return false;
	},
	transformLat: function(x, y) {
		var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0;
		ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0;
		return ret;
	},
	transformLng: function(x, y) {
		var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
		ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
		ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0;
		ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0;
		return ret;
	}
};

app.factory("LocationService", ["DataService", "CacheService", "$q",
	function(DataService, CacheService, $q) {
		return {
			/**
			 * WGS到火星地址转换
			 * @param wgs   wgs坐标系坐标
			 * @returns {Promise}
			 */
			gcjEncrypt: function(wgs) {
				var defer = $q.defer();
				defer.resolve(GPS.gcj_encrypt(wgs.lat, wgs.lng));
				return defer.promise;
			},

			/**
			 * 火星地址到WGS转换
			 * @param gcj   gcj坐标系坐标
			 * @returns {Promise}
			 */
			gcjDecrypt: function(gcj) {
				var defer = $q.defer();
				defer.resolve(GPS.gcj_decrypt(gcj.lat, gcj.lng));
				return defer.promise;
			},

			/**
			 * WGS到百度坐标系转换
			 * @param wgs   wgs坐标系坐标
			 * @returns {Promise}
			 */
			bdEncrypt: function(wgs) {

				var defer = $q.defer();
				var url = 'http://api.map.baidu.com/geoconv/v1/?coords=' + wgs.lng + ',' + wgs.lat + '&output=json&from=1&to=5&ak=' + baiduAK;
				/**
				 * 调用百度接口实现
				 */
				DataService.jsonp(url).then(function(response) {
					if(response && response.status === 0) {
						defer.resolve({
							lat: response.result[0].y,
							lng: response.result[0].x
						})
					}
				});
				return defer.promise;
			},

			/**
			 * 百度坐标系到WGS转换
			 * @param bd    百度坐标系坐标
			 * @returns {*|Promise}
			 */
			bdDecrypt: function(bd) {
				return this.gcjDecrypt(GPS.bd_decrypt(bd.lat, bd.lng));
			},

			/**
			 * 地址解析
			 * @param address {String}  位置
			 */
			geoCoder: function(address) {
				var defer = $q.defer();
				var url = 'http://api.map.baidu.com/geocoder/v2/?ret_coordtype=wgs84&address=' + address + '&output=json&ak=' + baiduAK;
				DataService.jsonp(url).then(function(response) {
					if(response && response.status === 0) {
						defer.resolve(response.result.location);
					} else {
						defer.reject();
					}
				}, function() {
					defer.reject();
				});
				return defer.promise;
			},
			/**
			 * 逆地址解析
			 * @param _lat  纬度
			 * @param _lng  经度
			 * @returns {Promise}
			 */
			geoDeCoder: function(_lat, _lng, _coordtype) {
				var defer = $q.defer();
				var type = mui.os.ios ? "wgs84ll" : "wgs84";
				if(mui.os.android && _coordtype == 'gcj02')
					type = 'gcj02ll';

				var url = 'http://api.map.baidu.com/geocoder/v2/?coordtype=' + type + '&location=' + _lat + ',' + _lng + '&latest_admin=1&output=json&ak=' + baiduAK;
				DataService.jsonp(url).then(function(res) {
					if(res && res.status === 0) {
						defer.resolve({
							country: res.result.addressComponent.country || "",
							province: res.result.addressComponent.province || "",
							city: res.result.addressComponent.city || "",
							district: res.result.addressComponent.district || "",
							address: res.result.addressComponent.street || "",
							street: res.result.sematic_description || ""
						});
					}
				});
				return defer.promise;
			},

			//geo的经纬度转换为百度经纬度
			geoLngLatToBaidu: function(lng, lat, coordtype) {
				var defer = $q.defer();
				var from = coordtype == "gcj02" ? 3 : 1;
				var url = "http://api.map.baidu.com/geoconv/v1/?coords=" + lng + ',' + lat + "&output=json&from=" + from + "&to=5&ak=" + baiduAK;
				DataService.jsonp(url).then(function(res) {
					if(res && res.status === 0) {
						defer.resolve({
							lng: res.result[0].x,
							lat: res.result[0].y
						});
					}
				});
				return defer.promise;
			},

			/**
			 * 地图检索
			 * @param _query 检索内容
			 * @param _city 检索所在城市
			 * @param _page_size 分页数量
			 * @param _page_num 页码
			 */
			search: function(_query, _city, _page_size, _page_num, _need_total) {
				var defer = $q.defer();
				var url = 'http://api.map.baidu.com/place/v2/search?res=jsapi&query=' + _query + '&region=' + _city + '&city_limit=true' + '&page_size' + (_page_size || 20) + '&page_num=' + (_page_num || 0) + '&output=json&ak=' + baiduAK;
				DataService.jsonp(url).then(function(response) {
					if(response && response.status === 0) {
						if(_need_total) {
							defer.resolve({
								results: response.results,
								total: response.total
							});
						} else
							defer.resolve(response.results);
					}
				});
				return defer.promise;
			}
		};
	}
]);

app.directive('mdNotify', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "="
		},
		template: '<div ng-click="model.scope.close()" ng-bind="model.scope.content"></div>'
	};
}]);

app.directive('mdConfirm', [function() {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			model: "="
		},
		templateUrl: localPath + '/js/pages/modal.html',
	};
}]);

app.directive('mdModal', [function() {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			model: "="
		},
		templateUrl: localPath + '/js/pages/modal.html',
	};
}]);

//限制input输入数字 precision->精确度
app.directive("inputDecimalKong", ["$filter", function($filter) {
	return {
		restrict: "EA",
		scope: {
			model: "=ngModel",
			precision: "=ngPrecision"
		},
		link: function link(scope, element, attr) {
			element.on("input", function(e) {
				var _origin = angular.element(element).val();
				var _val = $filter("numberFormat")(_origin, scope.precision, true);
				if(!_val) {
					_val = '';
				}
				if(_origin !== String(_val)) {
					//2018-08-29 修改为不能输入负数
					if(_val.toString().indexOf('-') != -1) {
						_val = _val.toString().replace('-', '');
					}
					scope.model = _val || '';
					angular.element(element).val(_val || '');
				} else {
					if(_origin.toString().indexOf('-') != -1) {
						_val = _origin.toString().replace('-', '');
						scope.model = _val || '';
						angular.element(element).val(_val || '');
					}
				}
			});
			element.on("blur", function(e) {
				var _origin = angular.element(element).val();
				var _val = $filter("numberFormat")(_origin, scope.precision, true);
				_val = parseFloat(_val);
				if(parseFloat(_origin) !== parseFloat(_val)) {
					scope.model = parseFloat(_val) || '';
					angular.element(element).val(parseFloat(_val) || '');
				}
			});
		}
	};
}]);

app.directive("inputDecimal", ["$filter", function($filter) {
	return {
		restrict: "EA",
		scope: {
			model: "=ngModel",
			precision: "=ngPrecision"
		},
		link: function link(scope, element, attr) {
			element.on("input", function(e) {
				var _origin = angular.element(element).val();
				var _val = $filter("numberFormat")(_origin, scope.precision, true);
				if(!_val) {
					_val = '';
				}
				if(_origin !== String(_val)) {
					//2018-08-29 修改为不能输入负数
					if(_val.toString().indexOf('-') != -1) {
						_val = _val.toString().replace('-', '');
					}
					scope.model = _val || 0;
					angular.element(element).val(_val || 0);
				} else {
					if(_origin.toString().indexOf('-') != -1) {
						_val = _origin.toString().replace('-', '');
						scope.model = _val || 0;
						angular.element(element).val(_val || 0);
					}
				}
			});
			element.on("blur", function(e) {
				var _origin = angular.element(element).val();
				var _val = $filter("numberFormat")(_origin, scope.precision, true);
				_val = parseFloat(_val);
				if(_origin !== String(_val)) {
					scope.model = _val || 0;
					angular.element(element).val(_val || 0);
				}
			});
		}
	};
}]);

app.factory('$Modal', ['$timeout', '$q', '$compile', '$rootScope', '$controller',
	function($timeout, $q, $compile, $rootScope, $controller) {
		var stack = [];
		var zIndex;
		var showModal = function(_modal, params) {

			var _defer = $q.defer(),
				_scope = $rootScope.$new();

			_scope.$modal = _modal;
			_scope.params = params || _modal.options.params || {};
			_modal.options && !_modal.options.size && (_modal.options.size = "large");
			var _component = _modal.options.component || 'md-modal';
			var $element = _scope.$element = angular.element("<" + _component + " class=\"md-modal " + (_modal.options.region || "") + " " + _modal.options.size + "\" model=\"$modal\" >");
			$element.html(_modal.options.template);

			$timeout(function() {
				$element.addClass("show");
			}, 200);

			_scope.$modal.close = function() {
				$rootScope.$broadcast("modal_close");
				stack = stack.filter(function(_stack) {
					return _stack !== _scope.$modal;
				});
				var removeModal = function removeModal() {
					$element.remove();
				};

				$element.removeClass("show");
				$timeout(removeModal, 300);
			};
			_scope.$modal.maskClose = function() {
				//是否点击遮罩关闭
				_modal.options.autoClose == true && _scope.$modal.close();
			};
			_scope.$modal.success = function() {
				if(!_scope.$modal.callback) {
					_scope.$modal.resolve(_scope.params);
				} else {
					var _result = _scope.$modal.callback();
					if(_result === false) {
						return;
					} else if(_result && typeof _result.then === "function") {
						_result.then(function() {
							_scope.$modal.close();
						});
						return;
					}
				}
				_scope.$modal.close();
			};
			_scope.$modal.resolve = function(data) {
				_defer.resolve(data);
			};
			_scope.$modal.reject = function(data) {
				_defer.reject(data);
			};
			_scope.$modal.notify = function(data) {
				_defer.notify(data);
			};
			if(_modal.options.controller) {
				var invokeCtrl = $controller(_modal.options.controller, {
					$scope: _scope,
					$element: $element
				}, true);
				var ctrl = invokeCtrl();
				$element.data('$ngControllerController', ctrl);
			}
			_scope.$modal.scope = _scope;
			$element = $compile($element)(_scope);

			//动画显示Window
			var _parent = angular.element(document.body);
			//判断所有遮罩关闭
			if(stack.length === 0) {
				zIndex = 100;
			}
			zIndex++;
			$element.css("z-index", zIndex);
			_parent.append($element);
			stack.push(_modal);
			return _defer.promise;
		};

		return {
			message: function(message, icon, interval) {
				var options = {
					template: '<div class="modal-message"><span ng-if="icon" class="modal-message-icon" ng-class="icon"></span><span ng-bind="message"></span></div>',
					controller: ['$scope', function($scope) {
						$scope.message = message;
						$scope.icon = icon;

						$timeout(function() {
							$scope.close();
						}, interval || 2000);

						$scope.close = function() {
							$scope.$modal.resolve();
							$scope.$modal.close();
						};
					}]
				};
				return this.modal(options).footer(false).show();
			},
			error: function(error, internal) {
				return this.message(error, "icon-close color-warning", internal);
			},
			notify: function(content, interval) {
				var _preset = {
					component: "md-notify",
					controller: ['$scope', '$timeout', function($scope, $timeout) {
						var _time_interval;
						$scope.init = function(content, interval) {
							$scope.content = content;
							if(interval) {
								_time_interval && $timeout.cancel(_time_interval);
								_time_interval = $timeout(function() {
									$scope.close();
								}, interval);
							}
						};

						$scope.close = function() {
							$scope.$modal.resolve();
							$scope.$modal.close();
						};
						$scope.init($scope.params.content, $scope.params.interval);
					}]
				};
				var _modal = this.modal(_preset);
				_modal.set_content = function(content, interval) {
					_modal.scope.init(content, interval || 2000);
				};
				debugger
				return _modal.show({
					content: content,
					interval: interval || 2000
				});
			},
			confirm: function(content, title) {
				var _preset = {
					component: "md-confirm",
					template: "<div class='md-confirm-content'><div>" + content + "</div></div>",
					controller: ["$scope", function($scope) {
						$scope.$modal.callback = function() {
							$scope.$modal.resolve();
						}
					}]
				};
				return this.modal(_preset).size("small").title(title).show();
			},
			modal: function(_options) {

				return {
					options: _options || {},
					footer: function(_footer) {
						this.options['footer'] = !!_footer;
						return this;
					},
					size: function(_size) {
						this.options['size'] = _size;
						return this;
					},
					region: function(_region) {
						this.options['region'] = _region;
						return this;
					},
					title: function(_title) {
						this.options['title'] = _title;
						return this;
					},
					params: function(_params) {
						this.options['params'] = _params;
						return this;
					},
					autoClose: function(_close) {
						this.options['autoClose'] = _close;
						return this;
					},
					show: function(params) {
						return showModal(this, params);
					}
				};

			},
			close: function() {
				var _modal = stack.splice(-1)[0];
				_modal && _modal.close();
			},
			closeAll: function() {
				angular.forEach(stack.slice(0), function(_d) {
					_d.close();
				});
			},
			modals: function() {
				return stack;
			}
		};
	}
]);

//数值转分秒时间，如 4--> 00:04
app.filter("numToTime", ["UtilsService", function(UtilsService) {
	return function(duration, video) {
		if(duration > 100) {
			video.FileSize = null;
			UtilsService.getVideoTime(video.FileName).then(function(time) {
				video.FileSize = duration = time;
			});
		}
		// 计算,10进制，以及取模
		var minutes = parseInt(duration / 60, 10);
		var seconds = Math.round(duration % 60);
		minutes = minutes < 10 ? '0' + minutes : minutes;
		seconds = seconds < 10 ? '0' + seconds : seconds;
		return minutes + ":" + seconds;
	}
}]);

app.filter("uuid", function() {
	return function() {
		var timestamp = new Date().getTime();
		return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (timestamp + Math.random() * 16) % 16 | 0;
			timestamp = Math.floor(timestamp / 16);
			return(c === 'x' ? r : (r & 3 | 8)).toString(16);
		});
	}
});

//年月日转换
app.filter("getCustomDate", ["$filter", function($filter) {
	return function(year, quarter, month) {
		var start = '',
			end = '';
		if(year) {
			year = parseInt(year);
			if(quarter || month) {
				if(quarter) {
					quarter = parseInt(quarter);
					switch(quarter) {
						case 1:
							start = new Date(year, 0, 1);
							end = new Date(year, 3, 1);
							break;
						case 2:
							start = new Date(year, 3, 1);
							end = new Date(year, 6, 1);
							break;
						case 3:
							start = new Date(year, 6, 1);
							end = new Date(year, 9, 1);
							break;
						case 4:
							start = new Date(year, 9, 1);
							end = new Date(year + 1, 0, 1);
							break;
					}
				}
				if(month) {
					month = parseInt(month);
					var dMonth = month - 1 >= 0 ? (month - 1) : 0;
					start = new Date(year, dMonth, 1);
					end = new Date(year, dMonth + 1, 1);
				}
			} else {
				start = new Date(year, 0, 1);
				end = new Date(year + 1, 0, 1);
			}
			return {
				start: $filter("dateFormat")(start, "yyyy-MM-dd") + " 00:00:00",
				end: $filter("dateFormat")(end, "yyyy-MM-dd") + " 00:00:00"
			};
		} else {
			return {
				start: start,
				end: end
			}
		}
	};
}]);

app.filter("dateParse", function() {
	return function(date) {
		if(!(date instanceof Date)) {
			if(typeof date === "number") {
				date = new Date(date);
			} else if(typeof date === "string" && date !== "") {
				date = date.replace("T", " ");
				date = date.replace(/\..+$/g, "");
				if((/\d{4}[^\d]\d{1,2}$/).test(date)) {
					date = date + "/01";
				}
				if((/\d{4}[^\d]\d{1,2}[^\d]$/).test(date)) {
					date = date + "01";
				}
				date = date.replace(/[^\d: ]/g, "/");
				date = new Date(Date.parse(date));
			}
		}
		return date;
	};
});

app.filter("dateFormat", ["$filter", function($filter) {
	return function(date, format) {
		if(!date) {
			return date;
		}
		if(typeof date === "string" && !date.trim()) {
			return "";
		}
		if(!format) {
			format = 'yyyy-MM-dd';
		}
		//修改为支持字符串格式的日期或date对象
		date = $filter("dateParse")(date);
		var formats = {
			"y+": date.getFullYear(),
			"M+": date.getMonth() + 1,
			"d+": date.getDate(),
			"H+": date.getHours(),
			"m+": date.getMinutes(),
			"s+": date.getSeconds(),
			"w+": ["日", "一", "二", "三", "四", "五", "六"][date.getDay()]
		};
		angular.forEach(formats, function(item, key) {
			format = format.replace(eval("/" + key + "/g"), function(exp) {
				return(exp.length === 1) ? (item) : (("0" + item).substr(("0" + item).length - exp.length));
			});
		});
		return format;
	};
}]);

app.filter("dateAddYears", ["$filter", function($filter) {
	return function(date, years, format) {
		if(!date) {
			return "";
		}
		date = $filter("dateFormat")(date, "yyyy/MM/dd HH:mm:ss");
		if(!date)
			return "";
		var _date = new Date(date);
		if(isNaN(_date.getFullYear()))
			return "";
		if(years)
			_date = _date.setFullYear(_date.getFullYear() + years);
		return format ? $filter("dateFormat")(_date, format) : new Date(_date);
	};
}]);

app.filter("dateAddMonths", ["$filter", function($filter) {
	return function(date, months, format) {
		if(!date) {
			return "";
		}
		date = $filter("dateFormat")(date, "yyyy/MM/dd HH:mm:ss");
		if(!date)
			return "";
		var _date = new Date(date);
		if(isNaN(_date.getMonth()))
			return "";
		if(months) {
			_date = _date.setMonth(_date.getMonth() + months);
		}
		return format ? $filter("dateFormat")(_date, format) : new Date(_date);
	};
}]);

app.filter("dateAddDays", ["$filter", function($filter) {
	return function(date, days, format) {
		if(!date) {
			return "";
		}
		date = $filter("dateFormat")(date, "yyyy/MM/dd HH:mm:ss");
		if(!date)
			return "";
		var _date = new Date(date);
		if(isNaN(_date.getDate()))
			return "";
		if(days)
			_date = _date.setDate(_date.getDate() + days);
		return $filter("dateFormat")(_date, format)
	};
}]);

app.filter("dayDiff", ["$filter", function($filter) {
	return function(date1, date2) {
		date1 = new Date($filter("dateFormat")(date1, "yyyy/MM/dd"));
		date2 = new Date($filter("dateFormat")(date2, "yyyy/MM/dd"));
		return 1 + (date2 - date1) / 1000 / 60 / 60 / 24;
	};
}]);

app.filter("hourDiff", ["$filter", function($filter) {
	return function(date1, date2) {
		date1 = new Date($filter("dateFormat")(date1, "2000/01/01 HH:mm"));
		date2 = new Date($filter("dateFormat")(date2, "2000/01/01 HH:mm"));
		return(date2 - date1) / 1000 / 60 / 60;
	};
}]);

app.filter("minuteDiff", ["$filter", function($filter) {
	return function(date1, date2) {
		date1 = new Date($filter("dateFormat")(date1, "2000/01/01 HH:mm"));
		date2 = new Date($filter("dateFormat")(date2, "2000/01/01 HH:mm"));
		return(date2 - date1) / 1000 / 60;
	};
}]);

app.filter("parseFormat", function() {
	return function(date, format) {
		//修改为支持字符串格式的日期或date对象
		if(typeof date === "string" && date && format) {
			var data = date.replace(/[^\d]+/ig, " ").split(" ");
			var alias = format.replace(/[^yMdHms]+/ig, " ").split(" ");
			if(data.length >= alias.length) {
				var _now = new Date();
				var formats = {
					"y": 2000,
					"M": 1,
					"d": 1,
					"H": 0,
					"m": 0,
					"s": 0
				};
				alias.forEach(function(_key, _index) {
					formats[_key[0]] = data[_index];
				});
				date = formats["y"] + "/" + formats["M"] + "/" + formats["d"] + " " + formats["H"] + ":" + formats["m"] + ":" + formats["s"];
				return new Date(date);
			}
		}
		return date;
	};
});

app.filter("bytesToSize", function() {
	return function(bytes) {
		if(bytes === 0)
			return '0 B';
		var k = 1024,
			sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return(bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
	};
});

app.filter("numberFormat", function() {
	return function(val, precision, inputing) {
		if(val) {
			if(typeof val === "number") {
				var _time = Math.pow(10, precision || 0);
				return Math.round(val * _time) / _time;
			}
			if(typeof val === "string") {
				var start = inputing ? "0" : "1";
				var decimal = precision ? "(\\.\\d{" + start + "," + precision + "})?" : "";
				if(!(new RegExp("^[-+]?\\d+" + decimal + "$")).test(val)) {
					var regexp = new RegExp("(^[-+]?\\d+" + decimal + ").*");
					if((regexp).test(val)) {
						val = val.replace(regexp, "$1");
					} else {
						return undefined;
					}
				}
			}
		}
		return val;
	};
});

app.filter("accAdd", function() {
	return function(arg1, arg2) {
		var r1, r2, m;
		try {
			r1 = arg1.toString().split(".")[1].length
		} catch(e) {
			r1 = 0
		}
		try {
			r2 = arg2.toString().split(".")[1].length
		} catch(e) {
			r2 = 0
		}
		m = Math.pow(10, Math.max(r1, r2));
		return(arg1 * m + arg2 * m) / m;
	};
});

app.filter("addUrlParam", function() {
	return function(url, param, value) {
		var prefix = url.indexOf('?') < 0 ? '?' : '&';
		return url + prefix + param + '=' + value;
	};
});

app.filter("getUserLogo", ["ApiService", function(ApiService) {
	return function(id, width, height) {
		return ApiService.Pic + '/dXNlci9sb2dv_' + id + '_' + 240 + 'x' + 240 + '.jpg';
	}
}]);

app.filter("getUserLogo2", ["ApiService", function(ApiService) {
	return function(id, width, height) {
		if(!width && !height)
		{
			width=0;
			height=0;
		}
		return ApiService.Pic + '/dXNlci9sb2dv_' + id + '_' + width + 'x' + height + '.jpg';
	}
}]);


//截取自定义用户logo
app.filter('getUserCustomLogo', function() {
	return function(item) {
		return item && item.trim().substring(0, 1);
	}
});

app.filter("getCompLogo", ["ApiService", function(ApiService) {
	return function(id, width, height) {
		return ApiService.Pic + '/Y29tcC9sb2dv_' + id + '_' + width + 'x' + height + '.jpg';
	}
}]);

//筛选用户显示名称
app.filter("getViewName", function() {
	return function(UserName, RealName, Mdt) {
		var displayName = '-';
		if(UserName != '') {
			displayName = UserName;
		} else if(RealName != '') {
			displayName = RealName;
		} else if(Mdt != '') {
			displayName = Mdt;
		}
		return displayName;
	}
});

app.filter("formatProdInfo", ["ApiService", function(ApiService) {
	return function(ProdName, SkuName) {
		return ProdName + ' ' + SkuName;
	}
}]);

app.filter("formatEquInfo", ["ApiService", function(ApiService) {
	return function(EqIdentifier, EqName, SkuName) {
		var ret = EqIdentifier != '' ? '[' + EqIdentifier + ']' : EqIdentifier;
		ret += EqName + ' ' + SkuName;
		return ret;
	}
}]);

app.filter("formatDeviceFaultInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);

app.filter("formatDeviceRepairInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);

app.filter("formatFaultInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);

app.filter("formatRepairInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);

app.filter("formatWrokLogInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);

app.filter("getUserSex", function() {
	return function(val) {
		var sex = {
			1: '男',
			2: '女'
		};
		return sex[val] || '';
	}
});

app.filter("getEquLogo", ["ApiService", "$filter", function(ApiService, $filter) {
	return function(equUrl, w) {
		return equUrl ? ApiService.Api47 + "/api/v1/BillFile/DownLoadFile?filePath=" + $filter("filePathReg")(equUrl) + "&w=" + w : localPath + "/images/equ/defImg.png";
	}
}]);

//获取产品图片
app.filter('getProdLogo', ["ApiService", function(ApiService) {
	return function(item, w, h) {
		if(item.LogoIsExist === false) {
			return localPath + "/images/productlibrary.png";
		} else {
			var prodid = item.ProdID || item.PartProdID || item.HostProdID;
			if(item.IsNew == 0) {
				return ApiService.Pic + "/cGtnL2xvZ28=_" + prodid + "_" + w + "x" + h + ".jpg";
			} else {
				return ApiService.Img + "/prod/logo/" + prodid + "_" + w + "x" + h + ".jpg";
			}
		}
	}
}]);

//替换图片路径中的反斜线
app.filter('filePathReg', function() {
	return function(filePath) {
		return filePath.replace(/\\/g, "/");
	}
});

app.filter("locationfilter", function() {
	return function(province, city, district, address, street) {
		province = province || "";
		city = city || "";
		district = district || "";
		address = address || "";
		street = street || "";
		if(province == city) {
			return province + " " + district + " " + address + " " + street;
		} else {
			return province + " " + city + " " + district + " " + address + " " + street;
		}
	}
});

app.filter("hasAuth", ['CacheService', function(CacheService) {
	return function(keys, userid, compid) {
		var user = CacheService.get('user');

		var auths = CacheService.get('userAuth') || [];
		var self, comp;
		if(user && user.CompID) {
			if(compid > 0) {
				comp = user.CompID == compid;
			} else if(compid == 0) {
				if(keys instanceof Array) {
					for(var i = 0; i < keys.length; i++) {
						comp = ['Q5', 'Q9', '14', 'Q25'].some(function(item) {
							return item == keys[i];
						});
						if(comp) {
							break;
						}
					}
				} else {
					comp = ['Q5', 'Q9', '14', 'Q25'].indexOf(keys) >= 0;
				}
			} else {
				comp = true;
			}
		} else {
			comp = false;
		}
		if(keys instanceof Array) {
			var ret = false;
			for(var i = 0; i < keys.length; i++) {
				if(['Q5', 'Q10', 'Q15', 'Q26', 'Q31', 'Q43', 'Q51', 'Q56'].indexOf(keys[i]) >= 0) {
					self = user.UserID == userid;
				} else if(['Q4', 'Q9', 'Q25'].indexOf(keys[i]) >= 0) {
					self = user.CompID == 0;
				} else {
					self = false;
				}
				var flag = (comp && auths.some(function(item) {
					return item == keys[i];
				})) || self;

				if(flag) {
					ret = true;
					break;
				}
			}
			return ret;
		} else {
			if(['Q5', 'Q10', 'Q15', 'Q26', 'Q31', 'Q43', 'Q51', 'Q56'].indexOf(keys) >= 0) {
				self = user.UserID == userid;
			} else if(['Q4', 'Q9', 'Q25'].indexOf(keys) >= 0) {
				self = user.CompID == 0;
			} else {
				self = false;
			}
			return self || (comp && auths.indexOf(keys) >= 0);
		}
	}
}]);
//是否有菜单权限
app.filter("hasMenuAuth", ['CacheService', function(CacheService) {
	return function(mainkey, secondkey, thirdkey, fourthkey, userid, compid) {
		var ret = false;
		var user = CacheService.get('user');
		var auths = CacheService.get('menuAuth') || [];
		var hasMain = auths.some(function(ele) {
			return ele.IsChilds > 0 && ele.MKey == mainkey;
		})
		if(!hasMain) {
			return -1;
		}
		for(var i = 0; i < auths.length; i++) {
			if(auths[i].MKey == mainkey && auths[i].IsChilds) {
				for(var j = 0; j < auths[i].Childs.length; j++) {
					if(thirdkey) {
						var hassecondMain = auths[i].Childs.some(function(ele) {
							return ele.IsChilds > 0 && ele.MKey == secondkey;
						})
						if(!hassecondMain) {
							return -1;
						}
					}
					if(auths[i].Childs[j].MKey == secondkey) {
						if(thirdkey) {
							if(fourthkey) {
								var hasthirdMain = auths[i].Childs[j].Childs.some(function(ele) {
									return ele.IsChilds > 0 && ele.MKey == thirdkey;
								})
								if(!hasthirdMain) {
									return -1;
								}
							}
							var ishasthird = false;
							for(var m = 0; m < auths[i].Childs[j].Childs.length; m++) {
								if(auths[i].Childs[j].Childs[m].MKey == thirdkey) {
									if(fourthkey) {
										var ishasfourth = false;
										for(var n = 0; n < auths[i].Childs[j].Childs[m].Childs.length; n++) {
											if(auths[i].Childs[j].Childs[m].Childs[n].MKey == fourthkey) {
												ishasfourth = true;
												break;
											}
										}
										ishasthird = ishasfourth;
										break;
									}
									ishasthird = true;
									break;
								}
							}
							ret = ishasthird;
							break;
						}
						ret = true;
						break;
					}
				}
				if(ret) {
					break;
				}
			}
		}
		return ret;
	}
}]);
app.filter('hasModuleAuth', ['CacheService', function(CacheService) {
	return function(stateKey) {
		var auths = CacheService.get('moduleAuth') || [];
		var hasAuth = auths.some(function(item) {
			if(item.State == stateKey) {
				return item.IsShow == 0;
			}
		})
		return hasAuth;
	}
}]);

app.filter('getEquAddress', ['$filter', function($filter) {
	return function(item) {
		return $filter("locationfilter")(item.Province, item.City, item.District, item.Address, item.Street) + ' ' + item.Station;
	}
}]);

app.filter('formatAgo', ['$filter', function($filter) {
	return function(date) {
		var now = $filter("dateFormat")(new Date(), "yyyy-MM-dd HH:mm:ss");
		if(date.substring(0, 10) == now.substring(0, 10)) {
			var timespan = $filter("minuteDiff")(date, now);
			return timespan <= 10 ? "刚刚" : $filter("dateFormat")(date, "HH:mm");
		} else if(date.substring(0, 10) == $filter("dateAddDays")(now, -1, "yyyy-MM-dd")) {
			return "昨天";
		} else if(date.substring(0, 10) == $filter("dateAddDays")(now, -2, "yyyy-MM-dd")) {
			return "前天";
		} else {
			return date.substring(0, 10);
		}
	}
}]);

app.filter('formatName', function() {
	return function(name) {
		if(name && name.length > 1) {
			return "*" + name.substr(1);
		} else {
			return name;
		}
	}
})

app.filter('formatPhone', function() {
	return function(phone) {
		if(phone && phone.length >= 11) {
			return phone.slice(0, 3) + "****" + phone.substr(7);
		} else if(phone && phone.length == 7) {
			return phone.slice(0, 2) + "**" + phone.substr(4);
		} else {
			return phone;
		}
	}
})

app.factory("ShareLogService", ["ApiService", "DataService", function(ApiService, DataService) {
	return {
		add: function(logid, datafrom, callback) {
			var url = ApiService.Api50 + "/api/v1/Common/AddSendLogState?sendLogId=" + logid;
			DataService.post(url).then(function(res) {
				var workView = plus.webview.getWebviewById("work.html");
				if(workView) {
					RpcClient.invoke("work.html", "RefTodoCount");
				} else {
					RpcClient.invoke("tab.html", "RPC_RefMsgList");
				}
				callback && callback();

			});
		}
	};
}]);

app.factory("RPCObserver", ["CacheService", function(CacheService) {
	//todo mui获得当前页面的Id
	var pageId = plus.webview.currentWebview().id;
	return {
		broadcast: function(_key) {
			var Observer = CacheService.get("RPCObserver") || {};
			var processQueue = Observer[_key] || [];
			var params = [].slice.call(arguments, 1);
			processQueue.forEach(function(item) {
				var page_function = item.split(":");
				var _page = page_function[0];
				var _function = page_function[1];
				//todo 通过mui查找窗体和方法
				plus.webview.all().filter(function(win) {
					return win.id == _page;
				}).forEach(function(win) {
					win.evalJS(_function + ".apply(null, " + JSON.stringify(params) + ")");
				});
			});
		},
		on: function(_key, _function) {
			var Observer = CacheService.get("RPCObserver") || {};
			var processQueue = Observer[_key];
			!processQueue && (processQueue = Observer[_key] = []);
			if(!processQueue.some(function(_item) {
					return _item.indexOf(pageId + ":") === 0
				})) {
				processQueue.push(pageId + ":" + _function);
				CacheService.set("RPCObserver", Observer, true);
			}
		},
		off: function(_key) {
			var Observer = CacheService.get("RPCObserver") || {};
			var processQueue = Observer[_key] || [];
			processQueue.some(function(_item, _index) {
				if(_item.indexOf(pageId + ":") !== 0) {
					processQueue.splice(_index, 1);
					CacheService.set("RPCObserver", Observer, true);
					return true;
				}
			})
		},
		remove: function(_key) {
			var Observer = CacheService.get("RPCObserver") || {};
			if(Observer[_key]) {
				delete Observer[_key];
				CacheService.set("RPCObserver", Observer);
			}
		},
		clear: function() {
			CacheService.remove("RPCObserver");
		}
	};
}]);

app.filter("emojiIgnore", function() {
	return function(input) {
		return input && input.replace(new RegExp("\\ud83c[\\udc00-\\udfff]|\\ud83d[\\udc00-\\udfff]|[\\u2600-\\u27ff]|\\ud83e[\\udd00-\\uddff]|[\\u2300-\\u23ff]|[\\u2500-\\u25ff]|[\\u2100-\\u21ff]|[\\u2b00-\\u2bff]|[\\u2d06]|[\\u3030]", "g"), "");
	};
});

app.directive('ngModelDivText', ["$filter", "$compile", function($filter, $compile) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var modelAttr = attrs["ngModelDivText"];
			if(!attrs.hasOwnProperty("contenteditable")) {
				element.attr("contenteditable", "true");
			}

			if(!modelAttr)
				return;

			var isInner = false;

			element.on('keyup change input blur', function() {
				scope.$apply(function() {
					isInner = true;
					var origin = element[0].innerText;
					var content = $filter("emojiIgnore")(origin);
					scope.$eval(modelAttr + "=" + JSON.stringify(content));
					if(origin !== content) {
						content = content.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
						element.html(content);
						moveEnd(element[0]);
					}
				});
			});

			function setter(val) {

				// var _element;
				// while(_element = _element ? _element.parentElement : window.getSelection().baseNode) {
				// 	if(_element.isSameNode(element[0])) {
				// 		return;
				// 	}
				// }
				if(isInner) {
					isInner = false;
					return;
				}

				val = (val || "").replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
				element.html(val);

				if(!val) {
					moveEnd(element[0]);
					element[0].blur();
				}
			}

			// scope.$watch(modelAttr, function (val, old) {
			//     val !== old && setter(val);
			// });
			var val = scope.$eval(modelAttr);
			setter(val);
			//光标移到最后
			//moveEnd(element[0]);
			var path = modelAttr.split(".");
			var property = path.splice(-1)[0];
			var owner = scope;
			if(path.length) {
				var ownerProperty = path.join(".");
				owner = scope.$eval(ownerProperty);
				if(!owner) {
					scope.$eval(path.join(".") + "={};");
					owner = scope.$eval(ownerProperty);
				}
			}
			owner.__defineGetter__(property, function() {
				var origin = element[0].innerText;
				return $filter("emojiIgnore")(origin);
			});
			owner.__defineSetter__(property, setter);
		}
	};
}]);

app.controller("pullrefreshController", ["$scope", "ApiService", "DataService", "Loading", function($scope, ApiService, DataService, Loading) {
	//	$scope.data = null;

	Loading.show();
	var isAutoUpPull = $scope.$parent.autoUserPull == undefined ? true : $scope.$parent.autoUserPull;

	var isEnd = false;

	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				up: {
					auto: isAutoUpPull,
					callback: pullupRefresh
				},
				down: {
					callback: pulldownRefresh
				}
			}
		});
	})

	function loadPageData(type) {
		DataService.get($scope.$parent.url).then(function(res) {
			Loading.hide();
			$scope.$parent.afterLoad && $scope.$parent.afterLoad(res);
			type == "down" && ($scope.data = null);
			$scope.data == null && ($scope.data = []);

			$scope.data = $scope.data.concat(res.DataRows || res.DataRow || res.Data || res);

			isEnd = $scope.data.length ? $scope.data.length >= (res.TotalCount || res.Total || res.length) : true;
			if(mui("#pullrefresh").pullRefresh()) {
				if(type == "down") {
					mui('#pullrefresh').pullRefresh().refresh(true);
					mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				}
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
			}
			hideUpData();
			$scope.isLoad = true;
		}, function(error) {
			$scope.isLoad = true;

			$scope.data == null && ($scope.data = []);

			if(mui("#pullrefresh").pullRefresh()) {
				mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
			}
			hideUpData();
		});
	};
	//当数据为空时，隐藏上拉的提示
	function hideUpData() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			if(!$scope.data || $scope.data.length == 0) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
	}

	//下拉刷新
	function pulldownRefresh() {
		$scope.$parent.pageIndex = 1;
		$scope.$emit("refresh_pageindex");
		loadPageData("down");
	};

	//上拉加载
	function pullupRefresh() {

		$scope.$parent.pageIndex++;
		$scope.$emit("refresh_pageindex");
		//加载数据
		loadPageData();
	}

	//rpc刷新列表
	$scope.$on("md_pullrefresh", reload);

	function reload() {
		mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().refresh(true);
		//ios上拉加载后刷新，会出现界面无数据的情况，所以加上下面一句代码
		mui.os.ios && mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
		$scope.data = null;
		hideUpData();
		$scope.$parent.pageIndex = 0;
		if(isAutoUpPull) {
			pullupRefresh();
		} else {
			mui("#pullrefresh").pullRefresh().pullupLoading()
		}

	}

}]);
/***
 * tab页签
 */
app.directive('mdTab', [function() {
	return {
		restrict: 'E',
		scope: {
			model: "=ngModel",
			options: "="
		},
		transclude: true,
		templateUrl: localPath + '/js/pages/mdTab.html',
		controller: ["$scope", "$filter", "$element", function($scope, $filter, $element) {
			$scope.top = "84";

			if($scope.options && $scope.options.header === false) {
				$scope.top = "40";
				angular.element($element[0]).addClass("md-tab-noHeader")
			}

			setTimeout(function() {
				var tabNum = 0;
				for(var i = 0; i < $scope.model.length; i++) {
					var item = $scope.model[i];
					(!item.hasOwnProperty("auth") || (item.auth && $filter("hasAuth")(item.auth))) && tabNum++;
					if(tabNum > 1) break;
				}
				tabNum > 1 && ($scope.showTab = true);
				!$scope.showTab && ($scope.top = "44");
				!$scope.showTab && angular.element($element[0]).addClass("has-tab");
				$scope.$apply();
				StartUsingTab();
			})

			/**
			 * 启用tab页签
			 */
			function StartUsingTab() {
				//切换tab页签
				mui('.md-tab').on('tap', '.md-tab-item', function() {
					if(this.classList.contains("md-active")) {
						return;
					}
					//隐藏当前显示的
					var tab = this.parentElement.querySelector(".md-active");

					if(tab) {
						var href = tab.getAttribute("href");

						if(href.substr(0, 1) == "#") {
							document.body.querySelector(href).style.display = "none";
						} else {
							plus.webview.hide(tab.getAttribute("winid") || href)
						}
						tab.classList.remove("md-active");
					}
					//激活点击的
					activeSubPage(this);
				});
				//显示指定页签
				function activeSubPage($) {
					$.classList.add("md-active");
					var href = $.getAttribute("href");

					if(href.substr(0, 1) == "#") {
						document.body.querySelector(href).style.display = "";
					} else {
						createSubPage({
							href: href,
							winid: $.getAttribute("winid"),
							top: $.parentElement.getAttribute("top"),
							bottom: $.parentElement.getAttribute("bottom"),
							extras: {
								selectArr: $scope.selectEquArr,
								selectCatArr: $scope.selectCatArr
							}
						})
					}
				}
				//创建或显示标签页的内容(href, winid, top, bottom
				function createSubPage(options) {
					var win = plus.webview.getWebviewById(options.winid || options.href);
					if(!win) {
						var styles = {
							popGesture: "none",
							top: (options.top || 0) + "px",
							bottom: (options.bottom || 0) + "px"
						};
						if(mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
							styles.hardwareAccelerated = false;
						}
						win = plus.webview.create(options.href, options.winid || options.href, styles, options.extras);
						plus.webview.currentWebview().append(win);
					}
					win.show();
				}

				//默认激活当前的tab页签
				var activeTab = document.body.querySelector(".md-tab-item.md-active");

				if(activeTab) {
					activeSubPage(activeTab);

					var tabList = document.body.querySelectorAll(".md-tab-item:not(.md-active)[href^='#']");
					var i = tabList.length;
					while(i--) {
						document.body.querySelector(tabList[i].getAttribute("href")).style.display = "none";
					}
				}
			}
		}]
	}
}]);

/**
 * 选择Service
 */
app.factory("ChooseService", ["UtilsService", "$Modal", function(UtilsService, $Modal) {

	var _options;

	function choose(type) {
		var url = "",
			id = "",
			_selectObj = _options.selected,
			_selectCatalog = [];

		switch(type) {
			case 'user':
				id = "contact-select.html";
				url = localPath + "/pages/common/contact-select.html?action=select&multiselect=" + _options.isMulti;
				break;
			case 'prod':
				id = "problib-index.html";
				url = localPath + "/pages/problib/index.html?state=selsku";
				break;
			case 'equ':
				id = "select-equ-list.html";
				if(_options.isCatalog) {

					_selectObj = (_options.selected || []).filter(function(_item) {
						return _item.IsDir == 0;
					})

					_selectCatalog = (_options.selected || []).filter(function(_item) {
						return _item.IsDir == 1;
					})

					url = localPath + "/pages/eqmentlib/equ-list.html?action=select&must=true&multiselect=" + _options.isMulti + "&selectCatalog=true";
				} else {
					url = localPath + "/pages/eqmentlib/equ-list.html?action=select&must=true&multiselect=" + _options.isMulti;
				}
				break;
			case 'scan':
				id = 'scan.html';
				url = localPath + "/pages/scan/scan.html";
				break;

		}

		UtilsService.openWindow({
			needLogin: true,
			id: id,
			url: url,
			extras: {
				selectObj: _selectObj,
				selectCatalog: _selectCatalog,
				callback: "selectCallback"
			}
		});
	};

	/**
	 * 回调事件
	 * **/
	window.selectCallback = function(obj, catalogs) {
		_options.callback(angular.copy(obj), catalogs || []);
	};

	return {
		user: function(options) {
			_options = options;
			choose('user');
		},
		prod: function(options) {
			_options = options;
			choose('prod');
		},
		equ: function(options) {
			_options = options;
			choose('equ');
		},
		scan: function(options) {
			_options = options;
			choose('scan');
		},
		equFault: function(callback, isClose) {
			$Modal.modal({
				size: "small",
				region: "middle",
				footer: false,
				autoClose: isClose == false ? false : true,
				template: '<ul class="mui-table-view choose-fault-model"><li class="mui-table-view-cell"><a class="mui-navigate-right" ng-click="event.choose()"><img class="mui-media-object mui-pull-left" src="' + localPath + '/images/eqmentlib/icon-item.png" /><div class="mui-media-body">选择一个设备</div></a></li><li class="mui-table-view-cell"><a class="mui-navigate-right" ng-click="event.scan()"><img class="mui-media-object mui-pull-left" src="' + localPath + '/images/eqmentlib/icon-scan.png"/><div class="mui-media-body">扫码识别设备</div></a></li></ul>',
				controller: ['$scope', "ApiService", "DataService", "UtilsService", function($scope, ApiService, DataService, UtilsService) {
					$scope.event = {
						choose: function() {
							isClose != false && ($scope.$modal.close());
							_options = {
								isMulti: false,
								selected: [],
								callback: function(data, catalogs) {
									callback(1, data, catalogs);
								}
							}

							choose('equ');
						},
						scan: function() {
							isClose != false && ($scope.$modal.close());
							_options = {
								callback: function(data) {
									callback(2, data);
								}
							};

							choose('scan');
						}
					}
				}]
			}).show();
		}
	};
}]);

app.directive("mdDebugModal", [function() {
	return {
		restrict: "EA",
		scope: {
			options: "="
		},
		templateUrl: localPath + '/js/pages/mdDebugModal.html',
		controller: ["$scope", "$Modal", function($scope, $Modal) {
			$scope.cancel = function() {
				$Modal.close();
			};
		}]
	}
}]);

//选择下拉列表
app.directive('mdDropDownList', [
	function() {
		return {
			restrict: 'EA',
			scope: {
				model: "=ngModel",
				options: "=",
				back: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdDropDownList.html',
			controller: ["$scope", "UtilsService", "DataService", "$timeout", function($scope, UtilsService, DataService, $timeout) {
				var timer = null;
				$scope.getData = function(url, opname) {
					clearTimeout(timer)
					//清空关键字同时清空选项
					$scope.rows = [];
					var _name = $scope.model.Name;
					$scope.model.Name = "";
					$scope.model.ID = 0;
					$scope.model.Name = _name;
					if($scope.model.Name == '') {
						return;
					}
					//展示下拉菜单
					timer = setTimeout(function() {
						DataService.get($scope.options.url + encodeURIComponent($scope.model.Name)).then(function(res) {
							if(res.DataRow) {
								$scope.rows = res.DataRow;
								$scope.rows = $scope.rows.map(function(item) {
									return {
										ID: item.ID,
										Name: item.Subject
									}
								})
								if(res.length == 0) {
									$scope.model.ID = 0;
								}
								var findItem = $scope.rows.find(function(item) {
									return item.Name == $scope.model.Name;
								});
								//								$scope.select = function(item) {
								//									UtilsService.openWindow({
								//										needLogin: true,
								//										id: "equ-handbook-details.html",
								//										url: "../eqmentlib/equ-handbook-details.html?from=editview&id=" + item.ID,
								//										extras: {
								//											callback: "equHandbookCallback"
								//										}
								//									});
								//								}

							} else {
								$scope.rows = res;

								if(res.length == 0) {
									$scope.model.ID = 0;
								}
								var findItem = $scope.rows.find(function(item) {
									return item.Name == $scope.model.Name;
								});
							}
							$scope.model.ID = findItem ? findItem.ID : 0;
							$timeout(function() {
								var _height = document.getElementById("drop_ul" + opname).clientHeight + 10;
								document.getElementById("drop_btn" + opname).style.marginTop = _height + "px";
							});
						});
					}, 300)

				};
				$scope.select = function(item, isFault) {
					//关闭下拉菜单
					if(isFault) {
						UtilsService.openWindow({
							needLogin: true,
							id: "equ-handbook-details.html",
							url: "../eqmentlib/equ-handbook-details.html?from=editview&id=" + item.ID,
							extras: {
								callback: "equHandbookCallback"
							}
						});
					} else {
						if(item != undefined) {
							if($scope.options.type && ['debug', 'work'].indexOf($scope.options.type) >= 0) {
								$scope.model.ID = item.ID;
								$scope.model.Name = item.Name;
							} else if($scope.options.type && ['sale'].indexOf($scope.options.type) >= 0) {
								Object.keys(item).forEach(function(field) {
									$scope.model[field] = item[field];
								});
								if(!item.LinkName && item.LinkManList.length > 0) {
									$scope.model.LinkName = item.LinkManList[0].LinkName;
									$scope.model.LinkPhone = item.LinkManList[0].LinkPhone;
								} else {
									$scope.model.LinkName = item.LinkName;
									$scope.model.LinkPhone = item.LinkPhone;
								}
							} else {
								Object.keys(item).forEach(function(field) {
									$scope.model[field] = item[field];
								});
							}
							$scope.back(item);
						}
						$scope.rows = [];
					}

				};
				//失去焦点
				$scope.closeDrop = function() {
					$timeout(function() {
						$scope.rows = [];

					}, 400)

				};
				//清空关键字(清空$scope.model?)
				$scope.clearName = function() {
					if($scope.model.Name == '') {
						return;
					}
					$scope.model.Name = "";
					$scope.rows = [];
					$scope.model.ID = 0;
				}
			}]
		}
	}
]);
//常见故障列表
app.directive('mdFaultCategoryList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel",
				type: "=",
				prod: "=",
				dateobj: "="
			},
			transclude: true,
			templateUrl: localPath + '/js/pages/mdFaultCategory.html',
			controller: ["$scope", "UtilsService", "DataService", "$timeout", function($scope, UtilsService, DataService, $timeout) {
				//console.log(JSON.stringify($scope.dateobj))
				$scope.goToDetail = function(id, type) {
					var url = "";
					var urlId = "";
					switch(type) {
						case 3:
							url = "../aftersale/mat-fault-statistics.html?descid=" + id;
							urlId = "mat-fault-statistics.html";
							break;
						case 1:
							url = "../aftersale/mat-repair-statistics.html?descid=" + id;
							urlId = "mat-repair-statistics.html";
							break;
						case 2:
							url = "../aftersale/mat-repair-statistics.html?resultid=" + id;
							urlId = "mat-repair-statistics.html";
							break;
					}
					if($scope.dateobj.isYearOrMonth == 1) {
						url += "&year=" + $scope.dateobj.dataYear
					} else if($scope.dateobj.isYearOrMonth == 2) {
						url += "&year=" + $scope.dateobj.dataYear + "&quarter=" + $scope.dateobj.dataMonth;

					} else if($scope.dateobj.isYearOrMonth == 3) {
						url += "&year=" + $scope.dateobj.dataYear + "&month=" + $scope.dateobj.dataMonth;
					}
					$scope.prod && (url += "&prodid=" + $scope.prod.ProdID + "&skuid=" + $scope.prod.SkuID);
					UtilsService.openWindow({
						needLogin: true,
						id: urlId,
						url: url
					});
				}
			}]
		}
	}
]);
app.factory("CustomModalService", ["$Modal", "UtilsService", "ApiService", "DataService", "Loading", "CacheService", function($Modal, UtilsService, ApiService, DataService, Loading, CacheService) {
	return {
		debug: function(scanInfo) {
			var gotoscan = function(typeid, title) {
				$Modal.close();
				if(scanInfo) {
					gotoDebugEditView(scanInfo);
					return;
				}
				UtilsService.openWindow({
					needLogin: true,
					id: 'scan.html',
					url: '/src/pages/scan/scan.html',
					extras: {
						type: "prod",
						callback: "scanCallback"
					}
				});
				window.scanCallback = function(res) {
					res = JSON.parse(res);
					if(res.resType == 1) {
						res.resInfo.SkuName = decodeURIComponent(res.resInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
						res.resInfo.ProdName = decodeURIComponent(res.resInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
						res.resInfo.MDCode = res.codeValue;
						gotoDebugEditView(res.resInfo);
					} else if(res.resType == 2) {
						mui.toast("当前为设备码，请扫描本企业产品码")
					}
				};

				function gotoDebugEditView(prodInfo) {
					UtilsService.openWindow({
						id: 'debug-edit.html',
						url: '/src/pages/aftersale/debug-edit.html?typeid=' + typeid + "&title=" + encodeURIComponent(title),
						extras: {
							prodInfo: prodInfo
						}
					});
					//					openWindow('/src/pages/aftersale/debug-edit.html?typeid=' + typeid + "&title=" + encodeURIComponent(title), {
					//						obj: prodInfo
					//					}, 'debug-edit.html');
				}
			};

			var types = [];
			var isloading = false;
			init();
			var curUser = CacheService.get("user");

			function init() {
				if(isloading) return;
				isloading = true;
				Loading.show();
				var url = ApiService.Api50 + "/api/v1/ProdDebug/GetDebugParamsTypeList";
				DataService.get(url).then(function(res) {
					Loading.hide();
					isloading = false;
					if(res.length > 0) {
						curUser.CompID != 266 && types.push({
							id: -1,
							title: '安装调试'
						});
						res.forEach(function(item) {
							types.push({
								id: item.ID,
								title: item.Name
							})
						});
						$Modal.modal({
							size: "small",
							region: "middle",
							footer: false,
							autoClose: true,
							template: '<div style="margin:-20px -10px"><md-debug-modal data-options="params"></md-debug-modal></div>',
							params: {
								debugParams: types,
								gotoscan: gotoscan
							},
							controller: ['$scope', "ApiService", "DataService", "UtilsService", function($scope, ApiService, DataService, UtilsService) {}]
						}).show();
					} else {
						Loading.hide();
						gotoscan(-1, '安装调试');
					}
				})
			}

		},
		service: function() {
			var gotoDebugEditView = function(typeid, title) {
				$Modal.close();
				UtilsService.openWindow({
					needLogin: true,
					id: 'service-edit',
					url: '/src/pages/aftersale/service-edit.html?typeid=' + typeid + "&title=" + encodeURIComponent(title)
				});
			};

			var types = [];
			var isloading = false;
			init();

			function init() {
				if(isloading) return;
				Loading.show();
				isloading = true;
				var url = ApiService.Api50 + "/api/v2/Customer/GetCustomerServiceParamsTypeList";
				DataService.get(url).then(function(res) {
					isloading = false;
					Loading.hide();
					if(res.length > 0) {
						if(res.length > 0) {
							types.push({
								id: -1,
								title: '其他服务'
							})
						}
						res.forEach(function(item) {
							types.push({
								id: item.ID,
								title: item.Name
							})
						})
						$Modal.modal({
							size: "small",
							region: "middle",
							footer: false,
							autoClose: true,
							template: '<div style="margin:-20px -10px"><md-debug-modal data-options="params"></md-debug-modal></div>',
							params: {
								debugParams: types,
								gotoscan: gotoDebugEditView
							},
							controller: ['$scope', "ApiService", "DataService", "UtilsService", function($scope, ApiService, DataService, UtilsService) {}]
						}).show();
					} else {
						Loading.hide();
						gotoDebugEditView(-1, '其他服务');
					}
				})
			}
		}
	};
}]);

//搜索Controller
app.controller("searchBodyCtl", ["$scope", "ApiService", "DataService", "Loading", "CacheService", "AuthService", function($scope, ApiService, DataService, Loading, CacheService, AuthService) {

	//设置android的样式
	var style = {
		scrollIndicator: 'none'
	};
	mui.os.android && (style.softinputMode = 'adjustResize');
	plus.webview.currentWebview().setStyle(style);

	mui.init({
		pullRefresh: {
			container: '#pullrefresh',
			up: {
				callback: uppullRefresh
			},
		}
	});

	//上拉加载
	function uppullRefresh() {
		if(!$scope.event.checkNetWork()) {
			plus.nativeUI.toast("暂无可用网络！");
			return;
		}
		if(!$scope.search.showResult) {
			return;
		}
		$scope.search.pageIndex++;
		$scope.$emit("refresh_url", {
			value: $scope.search.key,
			index: $scope.search.pageIndex,
			size: $scope.search.pageSize
		});
		$scope.event.getList();
	}

	//页面对象
	$scope.search = {
		showDom: false,
		showResult: false,
		action: query("action") || '',
		key: "",
		searchKey: $scope.$parent.options.key,
		InnerCodeName: $scope.$parent.options.name || "",
		history: [],
		data: null,
		userId: 0,
		netWork: true,
		error: false,
		pageIndex: 0,
		pageSize: $scope.$parent.options.pageSize || 20
	};

	$scope.event = {
		//清空搜索
		delSearch: function() {
			$scope.search.key = '';
			$scope.search.showResult = false;
			$scope.search.error = false;
			$scope.search.netWork = true;

			//没有搜索的时候禁用上拉事件
			mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
		},
		//点击搜索历史
		hisSearch: function(key) {
			$scope.search.key = key;
			setTimeout(function() {
				$scope.event.doSearch();
			}, 50)
		},
		//执行搜索
		doSearch: function() {
			$scope.search.key = document.querySelector("input").value.trim();

			if(!$scope.search.key) {
				plus.nativeUI.toast("请输入" + $scope.search.InnerCodeName);
				return;
			}

			$scope.search.data = null;

			//关闭键盘
			document.activeElement.blur();

			//关键字记录到本地
			$scope.event.writeHistory();

			$scope.search.pageIndex = 0;

			$scope.search.showResult = true;

			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui('#pullrefresh').pullRefresh().pullCaption.innerText = "";
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		//写入搜索历史
		writeHistory: function() {
			var idx = $scope.search.history.indexOf($scope.search.key);
			if(idx >= 0) {
				$scope.search.history.splice(idx, 1);
			}

			if($scope.search.history.length == 10) {
				$scope.search.history.splice(9, 1);
			}

			$scope.search.history = [$scope.search.key].concat($scope.search.history);

			CacheService.set($scope.search.userId + "_" + $scope.search.searchKey + "_search", $scope.search.history, true);
		},
		//获取搜索历史
		getHistory: function() {
			var _history = CacheService.get($scope.search.userId + "_" + $scope.search.searchKey + "_search");
			_history && ($scope.search.history = _history);

			$scope.search.showDom = true;

			Loading.hide();
			//mui.hideLoading();

			//弹出键盘
			showInput();
		},
		checkNetWork: function() {
			$scope.search.netWork = isNetWorkCanUse();
			$scope.search.error = false;
			return $scope.search.netWork;
		},
		getList: function() {

			DataService.get($scope.$parent.url).then(function(res) {
				Loading.hide();

				($scope.search.data == null) && ($scope.search.data = []);
				$scope.search.data = $scope.search.data.concat(res.DataRows);

				var isEnd = $scope.search.data.length >= res.TotalCount;

				mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);

				$scope.search.showResult = true;

				var tip = mui('#pullrefresh').pullRefresh().pullPocket;
				if(tip) {
					if($scope.search.data.length == 0) {
						tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
						tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
					} else {
						!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
						!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
					}
				}

			}, function() {
				$scope.search.error = true;
				var tip = mui('#pullrefresh').pullRefresh().pullPocket;
				if(tip) {
					tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
					tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
				}
			});
		}
	};

	$scope.$on("search_init", function() {

		$scope.search.InnerCodeName = $scope.$parent.options.name;
	});

	//rpc刷新列表
	$scope.$on("md_pullrefresh", function() {
		mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
		$scope.search.data = null;
		$scope.search.pageIndex = 0;
		uppullRefresh();
	});

	//初始化
	var user = CacheService.get("user");
	user && ($scope.search.userId = user.UserID);

	$scope.event.getHistory();

}]);

//分享信息
app.directive("mdChildOrg", [function() {
	return {
		restrict: "EA",
		scope: {
			options: "="
		},
		templateUrl: localPath + '/js/pages/mdChildOrg.html',
		controller: ["$scope", "UtilsService", "ApiService", "CacheService", "DataService", function($scope, UtilsService, ApiService, CacheService, DataService) {
			$scope.domData = {
				navDirData: [],
				curId: 0,
				data: {},
				isLoad: false,
			};
			var curUser = CacheService.get("user");

			$scope.event = {
				tapDir: function(item) {
					$scope.domData.navDirData.push(item);
					$scope.domData.curId = item.ID;

					resScroll();

					curData.getChildOrg();
				}
			};

			var curData = {
				init: function() {

					var curOrgId = $scope.options.type == "all" ? 0 : curUser.OrgID;

					$scope.domData.navDirData.push({
						ID: curOrgId,
						OrgName: "全部"
					});

					if($scope.options.type == "all" && curUser.OrgList.length != 0) {
						$scope.domData.navDirData = $scope.domData.navDirData.concat(curUser.OrgList);
					}

					$scope.domData.curId = $scope.domData.navDirData[$scope.domData.navDirData.length - 1].ID;

					this.getChildOrg();
				},
				getChildOrg: function() {

					if($scope.domData.data[$scope.curId] == undefined) {
						var url = ApiService.Api50 + "/api/v1/Org/GetOrgList?parentId=" + $scope.domData.curId;

						DataService.get(url).then(function(res) {
							$scope.domData.isLoad = true;
							$scope.domData.data[$scope.domData.curId] = res;
						});
					}

					var isBack = $scope.domData.isLoad ? true : $scope.options.autoUserPull === false ? true : false;

					if(isBack) {
						document.querySelector("body").scrollTop = 0
						$scope.options.callback($scope.domData.curId)
					}
				}
			};

			//导航栏滚动事件
			function resScroll() {
				setTimeout(function() {
					var width = mui("#res-slide-directive-org")[0].clientWidth;
					var scrollWidth = mui("#res-slide-directive-org .mui-scroll")[0].clientWidth;
					scrollto = 0;
					if((scrollWidth + 35) < width || width == 0) {
						scrollto = 0;
					} else {
						scrollto = width - scrollWidth - 24;
					}
					mui('#res-slide-directive-org').scroll().scrollTo(scrollto, 0, 0);
				}, 100);
			};

			//点击导航目录
			mui("#res-slide-directive-org").on("tap", ".mui-control-item", function() {
				var orgid = this.getAttribute("orgid");
				var index = this.getAttribute("index");
				if(orgid == $scope.curId) return;
				$scope.domData.curId = orgid;

				$scope.domData.navDirData = $scope.domData.navDirData.filter(function(_item, _index) {
					return _index <= parseInt(index);
				});
				$scope.$apply();
				resScroll();
				curData.getChildOrg();
			});

			//Android返回键返回上级目录
			var mui_back = mui.back;
			mui.back = function() {
				if($scope.domData.navDirData.length > 1) {
					$scope.domData.navDirData.splice($scope.domData.navDirData.length - 1, 1);
					$scope.domData.curId = $scope.domData.navDirData[$scope.domData.navDirData.length - 1].ID;
					$scope.$apply();
					resScroll();
					curData.getChildOrg();
				} else {
					mui_back();
				}
			};

			curData.init();
		}]
	}
}]);