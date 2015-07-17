# Bigcommerce Product Image Galleries

Make the product images change. Make them change differently based on screen size.

### Installation

```
jspm install --save bc-swipe-fade=bitbucket:pixelunion/bc-swipe-fade
```

### Usage

```
import $ from 'jquery';
import SwipeFade from 'bc-swipe-fade';

let gallery = new SwipeFade({
  el: $('.product-slides-container'),
  callback: (index, el) {
    console.log(`welcome to slide number ${index}`);
  }
});
```


### Options

`el`: A jQuery object of our gallery container.
`callback`: a function to run after each slide change.

### Some sample markup

```
<div class="product-slides-container">
  <div class="product-slides-wrap">
    <div class="product-slide">
      <img src="demo/images/photo-1.jpg">
    </div>
    <div class="product-slide">
      <img src="demo/images/photo-2.jpg">
    </div>
    <div class="product-slide">
      <img src="demo/images/photo-3.jpg">
    </div>
    <div class="product-slide">
      <img src="demo/images/photo-4.jpg">
    </div>
  </div>
</div>
```

The module is classname agnositc but remember to wrap your slides in TWO elements.

### Methods

`.change(index)`: Switch to a slide

`.next()` and `prev()` are available as well.

### Responsiveness

The module will watch for an `:after` pseudoelement on the same element with which the module is initialized. If the `:after` element has a `content: 'swipe';` property, the module will arrange itself as a touch-driven swipe gallery. If not, it will fade. CSS is therefore a little specific:

### Important CSS

```
.product-slides-container {
  position: relative;
  overflow: hidden;
}

.product-slides-wrap {
  position: relative;
  overflow: hidden;
}

@media(swiping-breakpoint) {
  .product-slides-container {
    &:after {
      display: none;
      content: "swipe";
    }
  }

  .product-slide {
    position: relative;
    float: left;
    width: 100%;
    transition: all 0.2s ease;
  }
}

@media(fading-breakpoint) {
  .product-slide {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    opacity: 0;

    &.current {
      z-index: auto;
      opacity: 1;
    }
  }
}

```


### Navigation

The module currently does not include any navigation by default. Make use of the callback and public methods to bake your own. Have a look at the demo.

### Todo
- Make use of jquery.trend for handling transition events
- Make fading work for IE8 (opacity)
- Further es6ification

### Further Development

For debugging or improvements you can run a standalone test version of the module using a very basic node server:

```
$ npm install
$ jspm install
$ npm run serve
```
This will allow you to make changes to the JS and HTML. To re-compile the scss you'll need to run `npm run build` from a separate terminal window after each change.
