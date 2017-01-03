'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Original swipe logic by Brad Birdsall
 * https://github.com/thebird/swipe
 * Copyright 2013, MIT License
*/

var SwipeFade = function () {
  function SwipeFade(options) {
    _classCallCheck(this, SwipeFade);

    this.options = options;

    // cache some elements
    this.$el = (0, _jquery2.default)(options.el);
    this.$wrapper = this.$el.children();
    this.$slides = this.$wrapper.children();

    // measurement & utility
    this.length = this.$slides.length;
    this.start = {};
    this.delta = {};
    this.width;
    this.isScrolling;
    this.index = 0;

    // swipe or fade?
    this.mode;

    // create an array to store current positions of each slide
    this.slidePos = new Array(this.length);

    // Deprecating this in lieu of transition css properties, I think
    this.speed = this.options.speed || 300;

    // check browser capabilities
    this.browser = {
      transitions: function (temp) {
        var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
        for (var i in props) {
          if (temp.style[props[i]] !== undefined) {
            return true;
          }
        }
        return false;
      }(document.createElement('swipe'))
    };

    this._init();
  }

  _createClass(SwipeFade, [{
    key: '_init',
    value: function _init() {
      var _this = this;

      // determine initial state, bind touch events if we're looking swipey
      if (this._shouldSwipe()) {
        this.mode = 'swipe';
        this._bindListeners();
      } else {
        this.mode = 'fade';
      }

      // set the first class
      this._$currentSlide().addClass('current').siblings().removeClass('current');

      // trigger layout for first time
      this._setupAll();

      // bind resize event
      (0, _jquery2.default)(window).on('resize', function () {
        _this._offloadFn(_this._setupAll());
      });
    }

    // -------------------------- Event Binding -------------------------- //

  }, {
    key: '_bindListeners',
    value: function _bindListeners() {
      this.$wrapper.on('touchstart', _jquery2.default.proxy(this._handleEvent, this));
    }
  }, {
    key: '_unBindListeners',
    value: function _unBindListeners() {
      this.$wrapper.off('touchstart', _jquery2.default.proxy(this._handleEvent, this));
    }

    // -------------------------- Event Handling -------------------------- //

  }, {
    key: '_handleEvent',
    value: function _handleEvent(event) {
      switch (event.type) {
        case 'touchstart':
          this._onStart(event);break;
        case 'touchmove':
          this._onMove(event);break;
        case 'touchend':
          this._offloadFn(this._onEnd(event));break;
      }

      // TODO: decide if this should stay
      if (this.options.stopPropagation) event.stopPropagation();
    }
  }, {
    key: '_onStart',
    value: function _onStart(event) {
      var touches = event.originalEvent.touches[0];

      // measure start values
      this.start = {
        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,
        // store time to determine touch duration
        time: +new Date()
      };

      // used for testing first move event
      this.isScrolling = undefined;

      // reset this.delta and end measurements
      this.delta = {};

      // attach touchmove and touchend listeners
      this.$wrapper.on('touchmove touchend', _jquery2.default.proxy(this._handleEvent, this));
    }
  }, {
    key: '_onMove',
    value: function _onMove(event) {
      event = event.originalEvent;
      // ensure swiping with one touch and not pinching
      if (event.touches.length > 1 || event.scale && event.scale !== 1) return;

      // Again, this option is not documented. Keep?..
      if (this.options.disableScroll) event.preventDefault();

      var touches = event.touches[0];

      // measure change in x and y
      this.delta = {
        x: touches.pageX - this.start.x,
        y: touches.pageY - this.start.y
      };

      // determine if scrolling test has run - one time test
      if (typeof this.isScrolling == 'undefined') {
        this.isScrolling = !!(this.isScrolling || Math.abs(this.delta.x) < Math.abs(this.delta.y));
      }

      // if user is not trying to scroll vertically
      if (!this.isScrolling) {

        // prevent native scrolling
        event.preventDefault();

        // increase resistance if first or last slide
        this.delta.x = this.delta.x / (!this.index && this.delta.x > 0 // if first slide and sliding left
        || this.index == this.length - 1 // or if last slide and sliding right
        && this.delta.x < 0 // and if sliding at all
        ? Math.abs(this.delta.x) / this.width + 1 : // determine resistance level
        1); // no resistance if false

        // translate 1:1
        this._translate(this.index - 1, this.delta.x + this.slidePos[this.index - 1], 0);
        this._translate(this.index, this.delta.x + this.slidePos[this.index], 0);
        this._translate(this.index + 1, this.delta.x + this.slidePos[this.index + 1], 0);
      }
    }
  }, {
    key: '_onEnd',
    value: function _onEnd(event) {
      // measure duration
      var duration = +new Date() - this.start.time;

      // determine if slide attempt triggers next/prev slide
      var isValidSlide = Number(duration) < 250 // if slide duration is less than 250ms
      && Math.abs(this.delta.x) > 20 // and if slide amt is greater than 20px
      || Math.abs(this.delta.x) > this.width / 2; // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds = !this.index && this.delta.x > 0 // if first slide and slide amt is greater than 0
      || this.index == this.length - 1 && this.delta.x < 0; // or if last slide and slide amt is less than 0

      // determine direction of swipe (true:right, false:left)
      var direction = this.delta.x < 0;

      // if not scrolling vertically
      if (!this.isScrolling) {

        if (isValidSlide && !isPastBounds) {

          if (direction) {
            this._move(this.index - 1, -this.width, 0);
            this._move(this.index, this.slidePos[this.index] - this.width, this.speed);
            this._move(this._circle(this.index + 1), this.slidePos[this._circle(this.index + 1)] - this.width, this.speed);
            this.index = this._circle(this.index + 1);
          } else {
            this._move(this.index + 1, this.width, 0);
            this._move(this.index, this.slidePos[this.index] + this.width, this.speed);
            this._move(this._circle(this.index - 1), this.slidePos[this._circle(this.index - 1)] + this.width, this.speed);
            this.index = this._circle(this.index - 1);
          }

          this.options.callback && this.options.callback(this.index, this._$currentSlide());
        } else {
          this._move(this.index - 1, -this.width, this.speed);
          this._move(this.index, 0, this.speed);
          this._move(this.index + 1, this.width, this.speed);
        }
      }

      this._setWrapperHeight();

      // kill touchmove and touchend event listeners until touchstart called again
      this.$wrapper.off('touchmove touchend', _jquery2.default.proxy(this._handleEvent, this));
    }

    // -------------------------- Utility -------------------------- //

    // offload a function's execution

  }, {
    key: '_offloadFn',
    value: function _offloadFn(fn) {
      setTimeout(fn || function () {}, 0);
    }
  }, {
    key: '_$currentSlide',


    // this.$slides.eq(this.index) doesn't work for some reason
    value: function _$currentSlide() {
      return (0, _jquery2.default)(this.$slides[this.index]);
    }

    // activate if :after { content: 'swipe' } (Thanks Flickity!) and if browser supports transitions. Fade will just stay for IE8.

  }, {
    key: '_shouldSwipe',
    value: function _shouldSwipe() {
      var afterContent = getComputedStyle(this.$el[0], ':after').content;
      return afterContent.indexOf('swipe') != -1 && this.browser.transitions;
    }
  }, {
    key: '_setWrapperHeight',
    value: function _setWrapperHeight() {
      var imgHeight = this._$currentSlide().find('img').height();
      this.$wrapper.height(imgHeight);
    }

    // -------------------------- Setup & Destroy -------------------------- //

  }, {
    key: '_setupAll',
    value: function _setupAll() {
      this.$wrapper.removeClass('swipe-fade-active'); // temporarily disable any transition effects

      if (this._shouldSwipe()) {

        // run these only on initial switch
        if (this.mode == 'fade') {
          this._killFade();
          this._bindListeners();
          this.mode = 'swipe';
        }

        this._setupSwipe();
      } else {

        // run these only on initial switch
        if (this.mode == 'swipe') {
          this._killSwipe();
          this._unBindListeners();
          this.mode = 'fade';
        }

        this._setupFade();
      }

      this.$wrapper.addClass('swipe-fade-active'); // enable transition effects
    }
  }, {
    key: '_setupSwipe',
    value: function _setupSwipe() {
      var _this2 = this;

      // determine this.width of each slide
      this.width = this.$el.outerWidth();

      this.$wrapper.width(this.length * this.width);

      this.$slides.each(function (i, slide) {
        (0, _jquery2.default)(slide).width(_this2.width);
        (0, _jquery2.default)(slide).attr('data-index', i);

        (0, _jquery2.default)(slide).css('left', i * -_this2.width);
        _this2._move(i, _this2.index > i ? -_this2.width : _this2.index < i ? _this2.width : 0, 0);
      });

      // set height
      this._setWrapperHeight();
    }
  }, {
    key: '_killSwipe',
    value: function _killSwipe() {
      // reset elements
      this.$wrapper.css('width', '');
      this.$slides.each(function () {
        (0, _jquery2.default)(this).removeAttr('style');
      });
    }
  }, {
    key: '_setupFade',
    value: function _setupFade() {
      this._setWrapperHeight();
    }
  }, {
    key: '_killFade',
    value: function _killFade() {}

    // -------------------------- Interaction -------------------------- //

  }, {
    key: '_prev',
    value: function _prev() {
      if (this.index) {
        change(this.index - 1);
      }
    }
  }, {
    key: '_next',
    value: function _next() {
      if (this.index < this.length - 1) {
        change(this.index + 1);
      }
    }
  }, {
    key: '_circle',
    value: function _circle(index) {
      // a simple positive modulo using this.length
      return (this.length + index % this.length) % this.length;
    }
  }, {
    key: '_change',
    value: function _change(to) {
      this.mode === 'swipe' ? this._swipe(to) : this._fade(to);
      this._$currentSlide().addClass('current').siblings().removeClass('current');
    }
  }, {
    key: '_swipe',
    value: function _swipe(to) {
      // do nothing if already on requested slide
      if (this.index == to) return;

      var direction = Math.abs(this.index - to) / (this.index - to); // 1: backward, -1: forward
      var diff = Math.abs(this.index - to) - 1;

      // move all the this.$slides between index and to in the right direction
      while (diff--) {
        this._move(this._circle((to > this.index ? to : this.index) - diff - 1), this.width * direction, 0);
      }

      to = this._circle(to);

      this._move(this.index, this.width * direction, this.speed);
      this._move(to, 0, this.speed);

      this.index = to;
      this._setWrapperHeight();

      this._offloadFn(this.options.callback && this.options.callback(this.index, this._$currentSlide()));
    }
  }, {
    key: '_move',
    value: function _move(index, dist, speed) {
      this._translate(index, dist, speed);
      this.slidePos[index] = dist;
    }
  }, {
    key: '_translate',
    value: function _translate(index, dist, speed) {
      var $slide = (0, _jquery2.default)(this.$slides[index]);

      if ($slide) {
        $slide.css({
          webkitTransform: 'translate(' + dist + 'px,0) translateZ(0)',
          msTransform: 'translateX(' + dist + 'px)',
          MozTransform: 'translateX(' + dist + 'px)',
          OTransform: 'translateX(' + dist + 'px'
        });
      };
    }
  }, {
    key: '_fade',
    value: function _fade(to) {
      this.index = to;
      this._setWrapperHeight();
      this._offloadFn(this.options.callback && this.options.callback(this.index, this._$currentSlide()));
    }

    // -------------------------- Expose public methods -------------------------- //

  }, {
    key: 'change',
    value: function change(to) {
      this._change(to);
    }
  }, {
    key: 'prev',
    value: function prev() {
      this._prev();
    }
  }, {
    key: 'next',
    value: function next() {
      this._next();
    }
  }]);

  return SwipeFade;
}();

exports.default = SwipeFade;
