import $ from 'jquery';
import SwipeFade from '../../dist/js/swipe-fade';

$(function(){

  let gallery = new SwipeFade(document.getElementById('product-images'), {
    callback: (index, elem) => {
      console.log('update');
      // updatePagination(index);
    }
  });

  $('.pagination a').bind('click', (evt) => {
    evt.preventDefault();
    let $target = $(evt.currentTarget);
    let to = $target.data('index');

    $target.parent('li').addClass('active').siblings().removeClass('active');
    console.log(`slide changed to number ${to}`);
    gallery.change(to, 500);
  })

})
