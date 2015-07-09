import $ from 'jquery';

/*
 * Original swipe logic by Brad Birdsall
 * https://github.com/thebird/swipe
 * Copyright 2013, MIT License
*/

export default class SwipeFade {

  constructor(options) {
    this.options = options;

    // cache some elements
    this.$el = options.el;
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
      addEventListener: !!window.addEventListener,
      touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
      transitions: (function(temp) {
        const props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
        for ( let i in props ) {
          if (temp.style[ props[i] ] !== undefined) {
            return true;
          }
        }
        return false;
      })(document.createElement('swipe'))
    };

    // -------------------------- Event Handling -------------------------- //

    this.events = {
      _handleEvent: (event) => {
        switch (event.type) {
          case 'touchstart': this.events._start(event); break;
          case 'touchmove': this.events._move(event); break;
          case 'touchend': this._offloadFn(this.events._end(event)); break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend': this._offloadFn(this.events._transitionEnd(event)); break;
          case 'resize': this._offloadFn(this._setupAll()); break;
        }

        // TODO: decide if this should stay
        if (this.options.stopPropagation) event.stopPropagation();
      },

      _start: (event) => {
        const touches = event.originalEvent.touches[0];

        // measure start values
        this.start = {
          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,
          // store time to determine touch duration
          time: +new Date
        };

        // used for testing first move event
        this.isScrolling = undefined;

        // reset this.delta and end measurements
        this.delta = {};

        // attach touchmove and touchend listeners
        this.$wrapper.on('touchmove touchend',  this.events._handleEvent );
      },

      _move: (event) => {
        let event = event.originalEvent;
        // ensure swiping with one touch and not pinching
        if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

        // Again, this option is not documented. Keep?..
        if (this.options.disableScroll) event.preventDefault();

        const touches = event.touches[0];

        // measure change in x and y
        this.delta = {
          x: touches.pageX - this.start.x,
          y: touches.pageY - this.start.y
        }

        // determine if scrolling test has run - one time test
        if ( typeof this.isScrolling == 'undefined') {
          this.isScrolling = !!( this.isScrolling || Math.abs(this.delta.x) < Math.abs(this.delta.y) );
        }

        // if user is not trying to scroll vertically
        if (!this.isScrolling) {

          // prevent native scrolling
          event.preventDefault();

          // increase resistance if first or last slide
          this.delta.x =
            this.delta.x /
              ( (!this.index && this.delta.x > 0             // if first slide and sliding left
                || this.index == this.length - 1      // or if last slide and sliding right
                && this.delta.x < 0                          // and if sliding at all
              ) ?
              ( Math.abs(this.delta.x) / this.width + 1 )    // determine resistance level
              : 1 );                                         // no resistance if false

          // translate 1:1
          this._translate(this.index-1, this.delta.x + this.slidePos[this.index-1], 0);
          this._translate(this.index, this.delta.x + this.slidePos[this.index], 0);
          this._translate(this.index+1, this.delta.x + this.slidePos[this.index+1], 0);
        }
      },

      _end: (event) => {
        // measure duration
        const duration = +new Date - this.start.time;

        // determine if slide attempt triggers next/prev slide
        const isValidSlide =
              Number(duration) < 250               // if slide duration is less than 250ms
              && Math.abs(this.delta.x) > 20            // and if slide amt is greater than 20px
              || Math.abs(this.delta.x) > this.width / 2;      // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        const isPastBounds =
              !this.index && this.delta.x > 0                            // if first slide and slide amt is greater than 0
              || this.index == this.length - 1 && this.delta.x < 0;    // or if last slide and slide amt is less than 0

        // determine direction of swipe (true:right, false:left)
        const direction = this.delta.x < 0;

        // if not scrolling vertically
        if (!this.isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {
              this._move(this.index - 1, -this.width, 0);
              this._move(this.index, this.slidePos[this.index]-this.width, this.speed);
              this._move(this._circle(this.index + 1), this.slidePos[this._circle(this.index + 1)]-this.width, this.speed);
              this.index = this._circle(this.index + 1);

            } else {
              this._move(this.index + 1, this.width, 0);
              this._move(this.index, this.slidePos[this.index]+this.width, this.speed);
              this._move(this._circle(this.index - 1), this.slidePos[this._circle(this.index - 1)]+this.width, this.speed);
              this.index = this._circle(this.index - 1);
            }

            this.options.callback && this.options.callback(this.index, this._$currentSlide());

          } else {
            this._move(this.index - 1, -this.width, this.speed);
            this._move(this.index, 0, this.speed);
            this._move(this.index + 1, this.width, this.speed);
          }
        }

        // kill touchmove and touchend event listeners until touchstart called again
        this.$wrapper.off('touchmove touchend', this.events._handleEvent);
      },

      _transitionEnd: (event) => {
        if (parseInt(event.target.getAttribute('data-index'), 10) == this.index) {
          this.options.transitionEnd && this.options.transitionEnd.call(event, this.index, this._$currentSlide());
        }
      }
    }

    // -------------------------- Initial Setup on page load -------------------------- //

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
    if (window.addEventListener) {
      window.addEventListener('resize', this.events._handleEvent, false);
    } else {
      window.onresize = function () { setupAll() }; // to play nice with old IE
    }
  }

  // -------------------------- Utility -------------------------- //

  // offload a function's execution
  _offloadFn(fn) { setTimeout(fn || function() {}, 0) };

  // this.$slides.eq(this.index) doesn't work for some reason
  _$currentSlide() {
    return $(this.$slides[this.index]);
  }

  // activate if :after { content: 'swipe' }. Thanks Flickity!
  _shouldSwipe() {
    const afterContent = getComputedStyle( this.$el[0], ':after' ).content;
    return afterContent.indexOf('swipe') != -1;
  }

  _setWrapperHeight() {
    const imgHeight = this._$currentSlide().find('img').height();
    this.$wrapper.height(imgHeight);
  }

  // -------------------------- Setup & Destroy -------------------------- //

  _setupAll() {
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
  }

  _setupSwipe() {
    // determine this.width of each slide
    this.width = this.$el.outerWidth();

    this.$wrapper.width(this.length * this.width);

    // stack this.$wrappers
    let pos = this.length;

    this.$slides.each((i, slide) => {
      $(slide).width(this.width);
      $(slide).attr('data-index', pos);

      if (this.browser.transitions) {
        $(slide).css('left', (i * -this.width));
        this._move(i, this.index > i ? -this.width : (this.index < i ? this.width : 0), 0);
      }
    });

    if (!this.browser.transitions) this.$wrapper.css('left', (this.index * -width));
  }

  _killSwipe() {
    // reset element
    this.$wrapper.removeAttr('style');

    this.$slides.each(function() {
      $(this).removeAttr('style');
    })
  }

  _setupFade() {
    this._setWrapperHeight();
  }

  _killFade() {
    this.$wrapper.css('height', '');
  }

  // -------------------------- Event Binding -------------------------- //

  _bindListeners() {
    // add event listeners
    if (this.browser.addEventListener) {
      // set touchstart event on this.$wrapper
      if (this.browser.touch) {
        this.$wrapper.on('touchstart', (evt) => {
          this.events._handleEvent(evt);
        });
      }

      if (this.browser.transitions) {
        this.$wrapper.on('webkitTransitionEnd msTransitionEnd oTransitionEnd otransitionend transitionend', (evt) => {
          this.events._handleEvent(evt);
        });
      }
    }
  }

  _unBindListeners() {
    // remove event listeners
    if (this.browser.transitions) {
      this.$wrapper.off('webkitTransitionEnd msTransitionEnd oTransitionEnd otransitionend transitionend touchstart', this.events._handleEvent);
    }
  }

  // -------------------------- Interaction -------------------------- //

  _prev() {
    if (this.index) {
      change(this.index - 1);
    }
  }

  _next() {
    if (this.index < this.length - 1) {
      change(this.index + 1);
    }
  }

  _circle(index) {
    // a simple positive modulo using this.length
    return (this.length + (index % this.length)) % this.length;
  }

  _change(to) {
    (this.mode === 'swipe') ? this._swipe(to) : this._fade(to);
    this._$currentSlide().addClass('current').siblings().removeClass('current');
  }

  _swipe(to) {
    // do nothing if already on requested slide
    if (this.index == to) return;

    if (this.browser.transitions) {
      const direction = Math.abs(this.index - to) / (this.index - to); // 1: backward, -1: forward
      let diff = Math.abs(this.index - to) - 1;

      // move all the this.$slides between index and to in the right direction
      while (diff--) {
        this._move( this._circle((to > this.index ? to : this.index) - diff - 1), this.width * direction, 0);
      }

      to = this._circle(to);

      this._move(this.index, this.width * direction, this.speed);
      this._move(to, 0, this.speed);

    } else {
      to = this._circle(to);
      this._animate(this.index * -this.width, to * -this.width, this.speed);
    }

    this.index = to;

    this._offloadFn(this.options.callback && this.options.callback(this.index, this._$currentSlide()));
  }

  _move(index, dist, speed) {
    this._translate(index, dist, speed);
    this.slidePos[index] = dist;
  }

  _translate(index, dist, speed) {
    const $slide = $(this.$slides[index]);

    if ($slide) {
      $slide.css({
        webkitTransform: `translate(${ dist }px,0) translateZ(0)`,
        msTransform: `translateX(${ dist }px)`,
        MozTransform: `translateX(${ dist }px)`,
        OTransform: `translateX(${ dist }px`
      });
    };

  }

  // TODO: untested & out of date
  _animate(from, to, speed) {
    // if not an animation, just reposition
    if (!speed) {
      element.style.left = to + 'px';
      return;
    }

    const start = +new Date;

    const timer = setInterval(function() {

      let timeElap = +new Date - start;

      if (timeElap > speed) {
        element.style.left = to + 'px';
        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        clearInterval(timer);
        return;
      }

      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

    }, 4);
  }

  _fade(to) {
    this.index = to;
    this._setWrapperHeight();
    this._offloadFn(this.options.callback && this.options.callback(this.index, this._$currentSlide()));
  }

  // -------------------------- Expose public methods -------------------------- //

  change(to) {
    this._change(to);
  }

  prev() {
    this._prev();
  }

  next() {
    this._next();
  }
}
