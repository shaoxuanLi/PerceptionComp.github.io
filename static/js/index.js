$(document).ready(function() {
  // Initialize example questions carousel (BLINK-style)
  if (typeof bulmaCarousel !== 'undefined') {
    bulmaCarousel.attach('.carousel', {
      slidesToScroll: 1,
      slidesToShow: 2,
      loop: true,
      infinite: true,
      autoplay: false,
    });
  }

  // Mobile navbar burger toggle
  $(".navbar-burger").click(function() {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  // Smooth scroll for navbar anchor links
  $('a[href^="#"]').on('click', function(e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      $('html, body').animate({ scrollTop: target.offset().top - 60 }, 400);
    }
  });
});
