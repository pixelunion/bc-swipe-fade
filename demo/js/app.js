import $ from 'jquery';
import SwipeFade from '../../dist/js/swipe-fade';

$(function(){

  const gallery = new SwipeFade({
    el: '#product-images',
    callback: (index, $slide) => {
      updatePagination(index);
    }
  });

  $('.pagination a').bind('click', (evt) => {
    evt.preventDefault();
    const $target = $(evt.currentTarget);
    const to = $target.data('index');

    $target.parent('li').addClass('active').siblings().removeClass('active');
    console.log(`slide changed to number ${to}`);
    gallery.change(to, 500);
  })

  let updatePagination = function(index) {
    $('.pagination li').removeClass('active').eq(index).addClass('active');
  }
});
