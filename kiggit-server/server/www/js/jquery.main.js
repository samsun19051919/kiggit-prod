// page init
jQuery(function(){
	initNumberedLists();
	initOpenClose();
	initChildClasses();
	initScrollPage();
});

jQuery(window).on('load', function(){
	initStretchPromoBox();
})

// stretch promo box init
function initStretchPromoBox(){
	var win = jQuery(window);
	var promoBoxes = jQuery('.promo-block');
	var navPanel = jQuery('.panel-nav');
	promoBoxes.each(function(){
		var container = jQuery(this);
		
		var contentHolder = container.find('.caption .holder');
		
		container.css({height: win.height() - navPanel.outerHeight()});
		win.bind('resize orientationchange load', function(){
			if(win.height() > contentHolder.outerHeight()) container.css({height: win.height() - navPanel.outerHeight()});
			else container.css({height: contentHolder.outerHeight()});
		});
		
		var visualHolder = container.find('.img-block');
		var image = visualHolder.find('img');
		var info = {};
		var rImagesTimer;
		
		updateImage();
		onWindowResize();
		win.bind('resize orientationchange', onWindowResize)
		
		function onWindowResize() {
			info.containerH = container.outerHeight();
			info.visualHolderW = visualHolder.width();
			info.visualHolderH = info.containerH;
			
			if(win.height() > contentHolder.outerHeight()) visualHolder.css({height: win.height() - navPanel.outerHeight()});
			else visualHolder.css({height: contentHolder.outerHeight()});
			resizeImage();
		}
		
		// calculate element coords to fit in mask
		function getProportion(data) {
			var ratio = data.ratio || (data.elementWidth / data.elementHeight);
			var slideWidth = data.maskWidth, slideHeight = slideWidth / ratio;
			
			if(slideHeight < data.maskHeight) {
				slideHeight = data.maskHeight;
				slideWidth = slideHeight * ratio;
			}
			return {
				width: slideWidth,
				height: slideHeight,
				top: (data.maskHeight - slideHeight) / 2,
				left: (data.maskWidth - slideWidth) / 2
			}
		}
		
		function updateImage() {
			var tmpImg = new Image();
			
			tmpImg.onload = function() {
				image.data('iRatio', tmpImg.width / tmpImg.height);
				image.css(
					getProportion({
						ratio: image.data('iRatio'),
						maskWidth: info.visualHolderW,
						maskHeight: info.visualHolderH
					})
				);
			};
			tmpImg.src = image.get(0).src;
		}
		
		function resizeImage() {
			clearTimeout(rImagesTimer);
			rImagesTimer = setTimeout(function() {
				image.css(
					getProportion({
						ratio: image.data('iRatio'),
						maskWidth: info.visualHolderW,
						maskHeight: info.visualHolderH
					})
				);
			}, 100);
		}
	});
}

// fixed panel init
function initScrollPage(){
	var win = jQuery(window);
	var fixedClass = 'nav-fixed';
	var activeClass = 'active';
	var header = jQuery('#header');
	var fixedBlock = header.find('.panel-nav');
	var animSpeed = 1000;
	var flag = false;
	
	var isTouchDevice = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
	var isWinPhoneDevice = navigator.msPointerEnabled && /MSIE 10.*Touch/.test(navigator.userAgent);
	var event = isTouchDevice ? (isWinPhoneDevice ? 'MSPointerDown' : 'click') : 'click';
	
	jQuery('#nav').each(function(){
		var items = jQuery(this).find('a');
		items.each(function(){
			var item = jQuery(this)
			var attribute = item.attr('href');
			
			var section = jQuery(item.attr('href'));
			
			item.bind(event, function(e){
				e.preventDefault();
				if(!item.hasClass(activeClass)){
					items.removeClass(activeClass)
					item.addClass(activeClass)
					var offset = jQuery(attribute).offset().top - fixedBlock.height();
					flag = true;
					if(isWinPhoneDevice){
						jQuery(window).scrollTop(offset);
						flag = false;
					}
					else {
						jQuery('html, body').animate({scrollTop: offset}, {duration: animSpeed, complete: function(){
							flag = false;
						}});
					}
				}
			});
			
			if(section.length){
				jQuery(window).bind('scroll load', function(){
					setTimeout(function(){
						if(fixedBlock.hasClass(fixedClass)){
							if(!flag && win.scrollTop() > section.offset().top - fixedBlock.height()-1 && win.scrollTop() < section.offset().top + section.height() - fixedBlock.height()-1){
								items.removeClass(activeClass);
								item.addClass(activeClass);
							}
						}
						else{
							if(!flag && win.scrollTop() > section.offset().top && win.scrollTop() < section.offset().top + section.height()){
								items.removeClass(activeClass);
								item.addClass(activeClass);
							}
						}
					}, 100)
				});
			}
		});
	});
	
	function listPosition(){
		var offset = header.outerHeight() - fixedBlock.outerHeight();
		if(win.scrollTop() > offset) {
			fixedBlock.addClass(fixedClass);
			header.css({paddingBottom: fixedBlock.outerHeight()})
		}
		else{
			fixedBlock.removeClass(fixedClass);
			header.css({paddingBottom: ''})
		}
	}
	listPosition();
	win.bind('scroll resize', listPosition);
}

// open-close init
function initOpenClose() {
	jQuery('.open-close').openClose({
		activeClass: 'active',
		opener: '.opener',
		slider: '.slide',
		animSpeed: 400,
		effect: 'slide'
	});
}

// add classes to support css3 selectors in old browsers
function initChildClasses() {
	jQuery('.steps-list').children(':last-child').addClass('last-child');
}

// build custom structure for numbered lists
function initNumberedLists() {
	jQuery('ol.steps-list').numberedList({
		symbol: '',
		wrapTag: 'span'
	});
}

/*
 * jQuery Open/Close plugin
 */
;(function($) {
	function OpenClose(options) {
		this.options = $.extend({
			addClassBeforeAnimation: true,
			hideOnClickOutside: false,
			activeClass:'active',
			opener:'.opener',
			slider:'.slide',
			animSpeed: 400,
			effect:'fade',
			event:'click'
		}, options);
		this.init();
	}
	OpenClose.prototype = {
		init: function() {
			if(this.options.holder) {
				this.findElements();
				this.attachEvents();
				this.makeCallback('onInit');
			}
		},
		findElements: function() {
			this.holder = $(this.options.holder);
			this.opener = this.holder.find(this.options.opener);
			this.slider = this.holder.find(this.options.slider);
		},
		attachEvents: function() {
			// add handler
			var self = this;
			this.eventHandler = function(e) {
				e.preventDefault();
				if (self.slider.hasClass(slideHiddenClass)) {
					self.showSlide();
				} else {
					self.hideSlide();
				}
			};
			self.opener.bind(self.options.event, this.eventHandler);

			// hover mode handler
			if(self.options.event === 'over') {
				self.opener.bind('mouseenter', function() {
					self.showSlide();
				});
				self.holder.bind('mouseleave', function() {
					self.hideSlide();
				});
			}

			// outside click handler
			self.outsideClickHandler = function(e) {
				if(self.options.hideOnClickOutside) {
					var target = $(e.target);
					if (!target.is(self.holder) && !target.closest(self.holder).length) {
						self.hideSlide();
					}
				}
			};

			// set initial styles
			if (this.holder.hasClass(this.options.activeClass)) {
				$(document).bind('click touchstart', self.outsideClickHandler);
			} else {
				this.slider.addClass(slideHiddenClass);
			}
		},
		showSlide: function() {
			var self = this;
			if (self.options.addClassBeforeAnimation) {
				self.holder.addClass(self.options.activeClass);
			}
			self.slider.removeClass(slideHiddenClass);
			$(document).bind('click touchstart', self.outsideClickHandler);

			self.makeCallback('animStart', true);
			toggleEffects[self.options.effect].show({
				box: self.slider,
				speed: self.options.animSpeed,
				complete: function() {
					if (!self.options.addClassBeforeAnimation) {
						self.holder.addClass(self.options.activeClass);
					}
					self.makeCallback('animEnd', true);
				}
			});
		},
		hideSlide: function() {
			var self = this;
			if (self.options.addClassBeforeAnimation) {
				self.holder.removeClass(self.options.activeClass);
			}
			$(document).unbind('click touchstart', self.outsideClickHandler);

			self.makeCallback('animStart', false);
			toggleEffects[self.options.effect].hide({
				box: self.slider,
				speed: self.options.animSpeed,
				complete: function() {
					if (!self.options.addClassBeforeAnimation) {
						self.holder.removeClass(self.options.activeClass);
					}
					self.slider.addClass(slideHiddenClass);
					self.makeCallback('animEnd', false);
				}
			});
		},
		destroy: function() {
			this.slider.removeClass(slideHiddenClass).css({display:''});
			this.opener.unbind(this.options.event, this.eventHandler);
			this.holder.removeClass(this.options.activeClass).removeData('OpenClose');
			$(document).unbind('click touchstart', this.outsideClickHandler);
		},
		makeCallback: function(name) {
			if(typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	};

	// add stylesheet for slide on DOMReady
	var slideHiddenClass = 'js-slide-hidden';
	$(function() {
		var tabStyleSheet = $('<style type="text/css">')[0];
		var tabStyleRule = '.' + slideHiddenClass;
		tabStyleRule += '{position:absolute !important;left:-9999px !important;top:-9999px !important;display:block !important}';
		if (tabStyleSheet.styleSheet) {
			tabStyleSheet.styleSheet.cssText = tabStyleRule;
		} else {
			tabStyleSheet.appendChild(document.createTextNode(tabStyleRule));
		}
		$('head').append(tabStyleSheet);
	});

	// animation effects
	var toggleEffects = {
		slide: {
			show: function(o) {
				o.box.stop(true).hide().slideDown(o.speed, o.complete);
			},
			hide: function(o) {
				o.box.stop(true).slideUp(o.speed, o.complete);
			}
		},
		fade: {
			show: function(o) {
				o.box.stop(true).hide().fadeIn(o.speed, o.complete);
			},
			hide: function(o) {
				o.box.stop(true).fadeOut(o.speed, o.complete);
			}
		},
		none: {
			show: function(o) {
				o.box.hide().show(0, o.complete);
			},
			hide: function(o) {
				o.box.hide(0, o.complete);
			}
		}
	};

	// jQuery plugin interface
	$.fn.openClose = function(opt) {
		return this.each(function() {
			jQuery(this).data('OpenClose', new OpenClose($.extend(opt, {holder: this})));
		});
	};
}(jQuery));

/*
 * Custom numbered list module
 */
;(function($) {
	function NumberedList(options) {
		this.options = $.extend({
			list: null,
			symbol: '.',
			wrapTag: 'span',
			wrapClass: 'ol-item-index',
			moduleActiveClass: 'ol-custom-structure',
			zeroLeadIndex: true
		}, options);
		if(this.options.list) {
			this.initStructure();
		}
	}
	NumberedList.prototype = {
		initStructure: function() {
			var self = this;
			this.list = $(this.options.list).addClass(this.options.moduleActiveClass);
			this.items = this.list.children();
			this.startIndex = parseInt(this.list.attr('start'), 10);
			if(isNaN(this.startIndex)) {
				this.startIndex = 1;
			}
			this.items.each(function(index, item) {
				var textBlock = jQuery(document.createElement(self.options.wrapTag));
				var slideIndex = self.startIndex + index;

				if(self.options.zeroLeadIndex) {
					slideIndex = slideIndex < 10 && slideIndex >= 0 ? '0' + slideIndex : slideIndex;
				}
				textBlock.addClass(self.options.wrapClass).text(slideIndex + self.options.symbol).prependTo(item);
			});
		}
	};

	// jquery pluginm interface
	$.fn.numberedList = function(opt) {
		return this.each(function() {
			new NumberedList($.extend({list: this}, opt));
		});
	};
}(jQuery));