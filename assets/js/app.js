$(document).ready(function() {

    'use strict';
  
    // =====================
    // Membership Navigation
    // Add current class to
    // the current page
    // =====================
  
    var pathname = window.location.pathname;
  
    $('.js-nav__link-membership[href="'+ pathname +'"]').addClass('c-nav__link--current');
  
    // =====================
    // Navigation
    // =====================
  
    $('.js-nav-toggle').click(function(e) {
      e.preventDefault();
      $('.c-nav-wrap').toggleClass('is-active');
      $(this).toggleClass('c-nav-toggle--close');
      $('body').toggleClass('e-mode-mobile');
    });
  
    // =====================
    // Mobile menu
    // =====================
    var menuToggle = $('.mobile-toggle');
    var mobileNavPanel = document.querySelector('.c-header-mobile__nav');
    menuToggle.click(function(e) {
      $('body').toggleClass('mobile-menu-active');
      if (mobileNavPanel) {
        mobileNavPanel.setAttribute('aria-hidden', $('body').hasClass('mobile-menu-active') ? 'false' : 'true');
      }
      if (!$('body').hasClass('mobile-menu-active')) {
        $('.c-header-mobile__nav--item--has-children').removeClass('is-open');
        $('.c-header-mobile__nav--expand').attr('aria-expanded', 'false');
      }
    });

    // 모바일 드로어: 하위 메뉴 아코디언 — 링크(글자)는 이동, 행 나머지·펼침 버튼은 토글
    function toggleMobileDrawerAccordion($btn) {
      var $li = $btn.closest('.c-header-mobile__nav--item--has-children');
      var opening = !$li.hasClass('is-open');

      $('.c-header-mobile__nav--item--has-children').not($li).removeClass('is-open');
      $('.c-header-mobile__nav--expand').not($btn).attr('aria-expanded', 'false');

      if (opening) {
        $li.addClass('is-open');
        $btn.attr('aria-expanded', 'true');
      } else {
        $li.removeClass('is-open');
        $btn.attr('aria-expanded', 'false');
      }
    }

    $(document).on('click', '.c-header-mobile__nav--expand', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileDrawerAccordion($(this));
    });

    $(document).on('click', '.c-header-mobile__nav--row-fill', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var $btn = $(this).closest('.c-header-mobile__nav--row').find('.c-header-mobile__nav--expand');
      if ($btn.length) {
        toggleMobileDrawerAccordion($btn);
      }
    });
  
    // =====================
    // Koenig Gallery
    // =====================
    var gallery_images = document.querySelectorAll('.kg-gallery-image img');
  
    gallery_images.forEach(function (image) {
      var container = image.closest('.kg-gallery-image');
      var width = image.attributes.width.value;
      var height = image.attributes.height.value;
      var ratio = width / height;
      container.style.flex = ratio + ' 1 0%';
    });
  
    // =====================
    // Decode HTML entities returned by Ghost translations
    // Input: Plus d&#x27;articles
    // Output: Plus d'articles
    // =====================
  
    function decoding_translation_chars(string) {
      return $('<textarea/>').html(string).text();
    }
  
    // =====================
    // Responsive videos
    // =====================
  
    $('.c-content').fitVids({
      'customSelector': [ 'iframe[src*="ted.com"]'          ,
                          'iframe[src*="player.twitch.tv"]' ,
                          'iframe[src*="dailymotion.com"]'  ,
                          'iframe[src*="facebook.com"]'
                        ]
    });
  
    // =====================
    // Images zoom
    // =====================
  
    $('.c-content img').attr('data-action', 'zoom');
  
    // If the image is inside a link, remove zoom
    $('.c-content a img').removeAttr('data-action');
  
    // =====================
    // Clipboard URL Copy
    // =====================
  
    var clipboard = new ClipboardJS('.js-share__link--clipboard');
  
    clipboard.on('success', function(e) {
      var element = $(e.trigger);
  
      element.addClass('tooltipped tooltipped-s');
      element.attr('aria-label', clipboard_copied_text);
  
      element.mouseleave(function() {
        $(this).removeAttr('aria-label');
        $(this).removeClass('tooltipped tooltipped-s');
      });
    });
  
    // =====================
  // Ajax Load More
  // =====================

  var $load_posts_button = $('.js-load-posts');
  var $homeRankingsAppend = $('.js-home-rankings-append');

$load_posts_button.click(function(e) {
  e.preventDefault();

  var $btn = $(this);

  // 현재 URL 기반으로 다음 페이지 URL 구성
  var currentPath = window.location.pathname;
  var basePath = currentPath.replace(/\/page\/\d+\/?$/, '');
  if (!basePath.endsWith('/')) basePath += '/';
  
  var request_next_link = basePath + 'page/' + pagination_next_page_number + '/';
  console.log(request_next_link);
  $.ajax({
    url: request_next_link,
    beforeSend: function() {
      $btn.text(decoding_translation_chars(pagination_loading_text));
      $btn.addClass('c-btn--loading');
    }
  }).done(function(data) {
    var $appendTarget;
    var $items;
    var appendKind = $btn.attr('data-load-append') || '';

    if (appendKind === 'home-recommended') {
      $items = $('.js-home-recommended-fetch-source .c-home-recommended-card', data);
      $appendTarget = $('.js-home-recommended-append');
    } else if ($homeRankingsAppend.length && !appendKind) {
      // 홈: rankings-split 최근 목록과 동일 카드 — 다음 페이지 HTML의 숨김 소스에서 추출
      $items = $('.js-home-rankings-fetch-source .c-home-rankings-card', data);
      $appendTarget = $homeRankingsAppend;
    } else {
      $items = $('.js-post-card__wrap', data);
      $appendTarget = $('.js-grid');
    }

    $appendTarget.append($items);

    $btn.text(decoding_translation_chars(pagination_more_posts_text));
    $btn.removeClass('c-btn--loading');

    pagination_next_page_number++;

    // If you are on the last pagination page, hide the load more button
    if (pagination_next_page_number > pagination_available_pages_number) {
      $('.js-load-posts').addClass('c-btn--disabled').attr('disabled', true);
    }
  });
});

  // =====================
  // 홈 태그 카테고리: 첫 6개만 표시 → 더보기마다 6개(배치). 최대 60개는 DOM에 미리 두고, 초과분은 Ajax
  // =====================
  var TAG_FEED_DEFAULT_BATCH = 6;

  function extractTagFeedCardsFromAjaxHtml(html) {
    var str = typeof html === 'string' ? html : '';
    if (!str) {
      return $();
    }
    var parsed = new DOMParser().parseFromString(str, 'text/html');
    var container = parsed.querySelector('.js-tag-feed-fetch-source');
    var nodes = container
      ? container.querySelectorAll('.c-home-tag-card')
      : parsed.querySelectorAll('.js-tag-feed-fetch-source .c-home-tag-card');
    if (!nodes || !nodes.length) {
      nodes = parsed.querySelectorAll('article.c-home-tag-card');
    }
    if (nodes && nodes.length) {
      return $(nodes);
    }
    var $frag = $('<div>').append($.parseHTML(str, document, true));
    return $frag.find('.js-tag-feed-fetch-source .c-home-tag-card');
  }

  function tagFeedCardDedupeKey($card) {
    var id = ($card.attr('data-post-id') || '').trim();
    if (id) {
      return id;
    }
    var href = ($card.find('a[href]').first().attr('href') || '').trim();
    return href || '';
  }

  function tagFeedVisibleCellCount($grid) {
    return $grid.find('.c-home-tag-feed__cell:not(.c-home-tag-feed__cell--collapsed)').length;
  }

  function tagFeedSeenKeys($grid) {
    var seen = {};
    $grid.find('.c-home-tag-card').each(function() {
      var key = tagFeedCardDedupeKey($(this));
      if (key) {
        seen[key] = true;
      }
    });
    return seen;
  }

  function initHomeTagFeedBatches() {
    $('.c-home-tag-feed').each(function() {
      var $section = $(this);
      var total = parseInt($section.attr('data-total-posts'), 10) || 0;
      var batchSize = parseInt($section.attr('data-batch-size'), 10) || TAG_FEED_DEFAULT_BATCH;
      var $more = $section.find('.c-home-tag-feed__more');
      var $btn = $section.find('.js-tag-feed-more');
      var $grid = $section.find('.js-home-tag-feed-grid');

      if (total <= batchSize) {
        $more.hide();
        return;
      }

      $grid.find('.c-home-tag-feed__cell').each(function() {
        var ord = parseInt($(this).attr('data-ordinal'), 10);
        if (isNaN(ord)) {
          return;
        }
        var batch = Math.floor(ord / batchSize);
        $(this).attr('data-batch', String(batch));
        if (batch >= 1) {
          $(this).addClass('c-home-tag-feed__cell--collapsed');
        }
      });

      $btn.attr('data-phase', 'batches');
      $btn.attr('data-next-batch', '1');
    });
  }

  initHomeTagFeedBatches();

  $(document).on('click', '.js-tag-feed-more', function(e) {
    e.preventDefault();
    var $btn = $(this);
    var $section = $btn.closest('.c-home-tag-feed');
    var $grid = $section.find('.js-home-tag-feed-grid');
    var batchSize = parseInt($section.attr('data-batch-size'), 10) || TAG_FEED_DEFAULT_BATCH;
    var totalPosts = parseInt($section.attr('data-total-posts'), 10) || 0;
    var perPage = parseInt($section.attr('data-per-page'), 10) || 15;
    var baseUrl = ($btn.attr('data-tag-base-url') || '').trim();
    if (!baseUrl) {
      return;
    }
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    function finishTagFeedButton() {
      $btn.removeClass('c-btn--loading').prop('disabled', false);
      $btn.text(decoding_translation_chars(pagination_more_posts_text));
    }

    function hideMoreIfDone() {
      if (tagFeedVisibleCellCount($grid) >= totalPosts) {
        $btn.closest('.c-home-tag-feed__more').hide();
        return true;
      }
      return false;
    }

    function appendCardsFromQueue(cards) {
      cards.forEach(function($c) {
        var $cell = $('<div class="c-home-tag-feed__cell"></div>');
        $cell.append($c.clone(true, true));
        $grid.append($cell);
      });
    }

    var rem = $btn.data('tagFeedRemainder');
    if (rem && rem.length) {
      var chunk = rem.splice(0, batchSize);
      $btn.data('tagFeedRemainder', rem.length ? rem : null);
      appendCardsFromQueue(chunk);
      if (hideMoreIfDone()) {
        return;
      }
      return;
    }

    var phase = $btn.attr('data-phase') || 'batches';

    if (phase === 'batches') {
      var nextBatch = parseInt($btn.attr('data-next-batch'), 10) || 1;
      $grid.find('.c-home-tag-feed__cell[data-batch="' + nextBatch + '"]').removeClass('c-home-tag-feed__cell--collapsed');
      $btn.attr('data-next-batch', String(nextBatch + 1));
      if (hideMoreIfDone()) {
        return;
      }
      if ($grid.find('.c-home-tag-feed__cell--collapsed').length) {
        return;
      }
      var shown = tagFeedVisibleCellCount($grid);
      if (shown >= totalPosts) {
        $btn.closest('.c-home-tag-feed__more').hide();
        return;
      }
      $btn.attr('data-phase', 'paged');
      $btn.attr('data-next-ajax-page', String(Math.floor(shown / perPage) + 1));
      return;
    }

    if (phase !== 'paged') {
      return;
    }

    var ajaxPage = parseInt($btn.attr('data-next-ajax-page'), 10);
    if (isNaN(ajaxPage)) {
      ajaxPage = 1;
    }

    var seenIds = tagFeedSeenKeys($grid);
    var requestUrl = baseUrl + 'page/' + ajaxPage + '/';

    $.ajax({
      url: requestUrl,
      dataType: 'html',
      beforeSend: function() {
        $btn.prop('disabled', true).addClass('c-btn--loading');
        $btn.text(decoding_translation_chars(pagination_loading_text));
      }
    }).done(function(data) {
      var $cards = extractTagFeedCardsFromAjaxHtml(data);
      var fresh = [];
      $cards.each(function() {
        var $card = $(this);
        var key = tagFeedCardDedupeKey($card);
        if (!key || seenIds[key]) {
          return;
        }
        seenIds[key] = true;
        fresh.push($card);
      });

      var take = fresh.splice(0, batchSize);
      $btn.data('tagFeedRemainder', fresh.length ? fresh : null);
      appendCardsFromQueue(take);

      finishTagFeedButton();

      if (hideMoreIfDone()) {
        return;
      }

      if ($btn.data('tagFeedRemainder') && $btn.data('tagFeedRemainder').length) {
        return;
      }

      if (take.length === 0 && (!$btn.data('tagFeedRemainder') || !$btn.data('tagFeedRemainder').length)) {
        $btn.attr('data-next-ajax-page', String(ajaxPage + 1));
        return;
      }

      $btn.attr('data-next-ajax-page', String(ajaxPage + 1));
    }).fail(function() {
      finishTagFeedButton();
    });
  });

  
    // =====================
    // Mobile Search form
    // =====================
    var mSearchForm = document.getElementById("c-search");
    if (mSearchForm) {
      mSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
  
        var searchParam = $(this).find('.c-search__stx')[0].value;
        window.location.href = '/search/' + encodeURIComponent(searchParam.trim());
        return false;
      });
    }

    // =====================
    // Desktop Header Search popover
    // =====================
    var headerSearchToggle = document.querySelector('.c-header__search-toggle');
    var headerSearchForm = document.getElementById('c-header-search');
    if (headerSearchToggle && headerSearchForm) {
      var headerSearchInput = headerSearchForm.querySelector('.c-header__search-input');

      headerSearchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = headerSearchForm.classList.toggle('is-open');
        headerSearchToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        headerSearchForm.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (isOpen && headerSearchInput) {
          setTimeout(function() { headerSearchInput.focus(); }, 0);
        }
      });

      headerSearchForm.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      document.addEventListener('click', function(e) {
        if (!headerSearchForm.classList.contains('is-open')) return;
        if (e.target === headerSearchToggle || headerSearchToggle.contains(e.target)) return;
        headerSearchForm.classList.remove('is-open');
        headerSearchToggle.setAttribute('aria-expanded', 'false');
        headerSearchForm.setAttribute('aria-hidden', 'true');
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && headerSearchForm.classList.contains('is-open')) {
          headerSearchForm.classList.remove('is-open');
          headerSearchToggle.setAttribute('aria-expanded', 'false');
          headerSearchForm.setAttribute('aria-hidden', 'true');
          headerSearchToggle.focus();
        }
      });

      headerSearchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var query = headerSearchInput ? headerSearchInput.value.trim() : '';
        if (!query) {
          if (headerSearchInput) headerSearchInput.focus();
          return false;
        }
        window.location.href = '/search/' + encodeURIComponent(query);
        return false;
      });
    }
  
    // =====================
    // Tab
    // =====================
    $('.c-home__post-tabs .c-home__post-tab--link').click(function(){
      var tab_id = $(this).attr('data-tab');
  
      $('.c-home__post-tabs .c-home__post-tab--link').removeClass('current');
      $('.c-home__post-tab--content').removeClass('current');
  
      $(this).addClass('current');
      $("#"+tab_id).addClass('current');
    })
  });
  
  /* 요소 없는 페이지(홈 등)에서 throw 나면 이후 Swiper 전부 스킵됨 — 반드시 존재할 때만 초기화 */
  var shopFeaturedSwiperEl = document.querySelector('.c-shop-featured__carousel--swiper');
  if (shopFeaturedSwiperEl && typeof Swiper !== 'undefined') {
    new Swiper(shopFeaturedSwiperEl, {
      navigation: {
        nextEl: '.c-shop-featured__carousel .swiper-button-next',
        prevEl: '.c-shop-featured__carousel .swiper-button-prev',
      },
      slidesPerView: 1,
      spaceBetween: 40,
    });
  }
  
  history.scrollRestoration = "auto"
  
  /**
   * Products Carousel
   */
  const productsCarousel = document.querySelectorAll('.s-products-carousel__container');
  productsCarousel.forEach(el => {
    const swiper = new Swiper(el.querySelector('.swiper'), {
      spaceBetween: 20,
      slidesPerView: 2,
      breakpoints: {
        640: {
          spaceBetween: 40
        },
        1024: {
          spaceBetween: 20,
          slidesPerView: 4,
        },
      },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev'),
      },
      watchSlidesProgress: true,
    })
  });
