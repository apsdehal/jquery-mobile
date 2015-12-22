/*!
 * jQuery Mobile Panel @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Panel
//>>group: Widgets
//>>description: Responsive presentation and behavior for HTML data panels
//>>docs: http://api.jquerymobile.com/panel/
//>>demos: http://demos.jquerymobile.com/@VERSION/panel/
//>>css.structure: ../css/structure/jquery.mobile.panel.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [
			"jquery",
			"../widget",
			"./page" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

var classesMap = {
	pageContainer: "ui-panel-page-container",

	// Used for wrapper and fixed toolbars position, display and open classes.
	pageContentPrefix: "ui-panel-page-content"
};

return $.widget( "mobile.panel", {
	version: "@VERSION",

	options: {
		classes: {
			"ui-panel": "ui-panel-closed"
		},
		animate: true,
		theme: null,
		position: "left",
		dismissible: true,

		// Accepts reveal, push, overlay
		display: "reveal",
		swipeClose: true,
		positionFixed: false
	},

	_closeLink: null,
	_parentPage: null,
	_page: null,
	_modal: null,
	_panelInner: null,
	_wrapper: null,
	_fixedToolbars: null,

	_create: function() {
		var el = this.element,
			parentPage = el.closest( ".ui-page, :jqmData(role='page')" );

		// Expose some private props to other methods
		$.extend( this, {
			_closeLink: el.find( ":jqmData(rel='close')" ),
			_parentPage: ( parentPage.length > 0 ) ? parentPage : false,
			_openedPage: null,
			_page: this._getPage,
			_panelInner: this._getPanelInner(),
			_fixedToolbars: this._getFixedToolbars
		} );
		if ( this.options.display !== "overlay" ) {
			this._getWrapper();
		}

		this._addClass( "ui-panel", this._getPanelClasses() );

		// If animating, add the class to do so
		if ( $.support.cssTransform3d && !!this.options.animate ) {
			this._addClass( "ui-panel-animate" );
		}

		this._bindUpdateLayout();
		this._bindCloseEvents();
		this._bindLinkListeners();
		this._bindPageEvents();

		if ( !!this.options.dismissible ) {
			this._createModal();
		}

		this._bindSwipeEvents();
		this._superApply( arguments );
	},

	_safelyWrap: function( parent, wrapperHtml, children ) {
		return children.length ? children.wrapAll( wrapperHtml ).parent() :
			$( wrapperHtml ).appendTo( parent );
	},

	_getPanelInner: function() {
		var panelInner = this.element.find( ".ui-panel-inner" );

		if ( panelInner.length === 0 ) {
			panelInner = this._safelyWrap( this.element,
				"<div class='ui-panel-inner'></div>",
				this.element.children() );
		}

		return panelInner;
	},

	_createModal: function() {
		var self = this,
			target = self._parentPage ? self._parentPage.parent() : self.element.parent();

		self._modal = $( "<div class='ui-panel-dismiss'></div>" )
			.on( "mousedown", function() {
				self.close();
			} )
			.appendTo( target );
	},

	_getPage: function() {
		var page = this._openedPage || this._parentPage || $( ".ui-page-active" );

		return page;
	},

	_getWrapper: function() {
		var thePage,
			wrapper = this._page().find( ".ui-panel-wrapper" );

		if ( wrapper.length === 0 ) {
			thePage = this._page();
			wrapper = this._safelyWrap( thePage,
				"<div class='ui-panel-wrapper'></div>",
				this._page().children( ".ui-header:not(.ui-header-fixed), " +
					".ui-content:not(.ui-popup), .ui-footer:not(.ui-footer-fixed)" ) );
		}

		this._wrapper = wrapper;
	},

	_getFixedToolbars: function() {
		var extFixedToolbars = $( "body" ).children( ".ui-header-fixed, .ui-footer-fixed" ),
			intFixedToolbars = this._page().find( ".ui-header-fixed, .ui-footer-fixed" ),
			fixedToolbars = extFixedToolbars.add( intFixedToolbars );

		this._addClass( fixedToolbars, "ui-panel-fixed-toolbar" );

		return fixedToolbars;
	},

	_getPosDisplayClasses: function( prefix ) {
		return prefix + "-position-" +
			this.options.position + " " + prefix +
			"-display-" + this.options.display;
	},

	_getPanelClasses: function() {
		var panelClasses = this._getPosDisplayClasses( "ui-panel" ) +
			" " + "ui-body-" + ( this.options.theme ? this.options.theme : "inherit" );

		if ( !!this.options.positionFixed ) {
			panelClasses += " " + "ui-panel-fixed";
		}

		return panelClasses;
	},

	_handleCloseClick: function( event ) {
		if ( !event.isDefaultPrevented() ) {
			this.close();
		}
	},

	_bindCloseEvents: function() {
		this._on( this._closeLink, {
			"click": "_handleCloseClick"
		} );

		this._on( {
			"click a:jqmData(ajax='false')": "_handleCloseClick"
		} );
	},

	_positionPanel: function( scrollToTop ) {
		var heightWithMargins, heightWithoutMargins,
			self = this,
			panelInnerHeight = self._panelInner.outerHeight(),
			expand = panelInnerHeight > this.window.height();

		if ( expand || !self.options.positionFixed ) {
			if ( expand ) {
				self._unfixPanel();
				$.mobile.resetActivePageHeight( panelInnerHeight );
			} else if ( !this._parentPage ) {
				heightWithMargins = this.element.outerHeight( true );
				if ( heightWithMargins < this.document.height() ) {
					heightWithoutMargins = this.element.outerHeight();

					// Set the panel's total height (including margins) to the document height
					this.element.outerHeight( this.document.height() -
						( heightWithMargins - heightWithoutMargins ) );
				}
			}
			if ( scrollToTop === true ) {
				this.window[ 0 ].scrollTo( 0, $.mobile.defaultHomeScroll );
			}
		} else {
			self._fixPanel();
		}
	},

	_bindFixListener: function() {
		this._on( this.window, { "throttledresize": "_positionPanel" } );
	},

	_unbindFixListener: function() {
		this._off( this.window, "throttledresize" );
	},

	_unfixPanel: function() {
		if ( !!this.options.positionFixed && $.support.fixedPosition ) {
			this._removeClass( "ui-panel-fixed" );
		}
	},

	_fixPanel: function() {
		if ( !!this.options.positionFixed && $.support.fixedPosition ) {
			this._addClass( "ui-panel-fixed" );
		}
	},

	_bindUpdateLayout: function() {
		var self = this;

		self.element.on( "updatelayout", function( /* e */ ) {
			if ( self._open ) {
				self._positionPanel();
			}
		} );
	},

	_bindLinkListeners: function() {
		this._on( "body", {
			"click a": "_handleClick"
		} );

	},

	_handleClick: function( e ) {
		var link,
			panelId = this.element.attr( "id" );

		if ( e.currentTarget.href.split( "#" )[ 1 ] === panelId && panelId !== undefined ) {

			e.preventDefault();
			link = $( e.target );
			if ( link.hasClass( "ui-button" ) ) {
				this._addClass( link, "ui-button-active" );
				this.element.one( "panelopen panelclose", function() {
					this._removeClass( "ui-button-active" );
				} );
			}
			this.toggle();
		}
	},

	_handleSwipe: function( event ) {
		if ( !event.isDefaultPrevented() ) {
			this.close();
		}
	},

	_bindSwipeEvents: function() {
		var handler = {};

		// Close the panel on swipe if the swipe event's default is not prevented
		if ( this.options.swipeClose ) {
			handler[ "swipe" + this.options.position ] = "_handleSwipe";
			this._on( ( this._modal ? this.element.add( this._modal ) : this.element ), handler );
		}
	},

	_bindPageEvents: function() {
		var self = this;

		this.document

			// Close the panel if another panel on the page opens
			.on( "panelbeforeopen", function( e ) {
				if ( self._open && e.target !== self.element[ 0 ] ) {
					self.close();
				}
			} )

			// On escape, close? might need to have a target check too...
			.on( "keyup.panel", function( e ) {
				if ( e.keyCode === 27 && self._open ) {
					self.close();
				}
			} );
		if ( !this._parentPage && this.options.display !== "overlay" ) {
			this._on( this.document, {
				"pageshow": function() {
					this._openedPage = null;
					this._getWrapper();
				}
			} );
		}

		// Clean up open panels after page hide
		if ( self._parentPage ) {
			this.document.on( "pagehide", ":jqmData(role='page')", function() {
				if ( self._open ) {
					self.close( true );
				}
			} );
		} else {
			this.document.on( "pagebeforehide", function() {
				if ( self._open ) {
					self.close( true );
				}
			} );
		}
	},

	// State storage of open or closed
	_open: false,
	_pageContentOpenClasses: null,
	_modalOpenClasses: null,

	open: function( immediate ) {
		if ( !this._open ) {
			var self = this,
				o = self.options,

				_openPanel = function() {
					self._off( self.document, "panelclose" );
					self._page().jqmData( "panel", "open" );

					if ( $.support.cssTransform3d && !!o.animate && o.display !== "overlay" ) {
						self._addClass( self._wrapper, "ui-panel-animate" );
						self._addClass( self._fixedToolbars(), "ui-panel-animate" );
					}

					if ( !immediate && $.support.cssTransform3d && !!o.animate ) {
						( self._wrapper || self.element )
							.animationComplete( complete, "transition" );
					} else {
						setTimeout( complete, 0 );
					}

					if ( o.theme && o.display !== "overlay" ) {
						self._addClass( self._page().parent(),
							classesMap.pageContainer + "-themed " +
							classesMap.pageContainer + "-" + o.theme );
					}

					self._removeClass( "ui-panel-closed" )
						._addClass( "ui-panel-open" );

					self._positionPanel( true );

					self._pageContentOpenClasses =
						self._getPosDisplayClasses( classesMap.pageContentPrefix );

					if ( o.display !== "overlay" ) {
						self._addClass( self._page().parent(), classesMap.pageContainer );
						self._addClass( self._wrapper, self._pageContentOpenClasses );
						self._addClass( self._fixedToolbars(), self._pageContentOpenClasses );
					}

					self._modalOpenClasses =
						self._getPosDisplayClasses( "ui-panel-dismiss" ) +
						" " + "ui-panel-dismiss-open";

					if ( self._modal ) {
						self._addClass( self._modal, self._modalOpenClasses );

						self._modal.height(
							Math.max( self._modal.height(), self.document.height() ) );
					}
				},
				complete = function() {

					// Bail if the panel was closed before the opening animation has completed
					if ( !self._open ) {
						return;
					}

					if ( o.display !== "overlay" ) {
						self._addClass( self._wrapper, classesMap.pageContentPrefix + "-open" );
						self._addClass( self._fixedToolbars(),
							classesMap.pageContentPrefix + "-open" );
					}

					self._bindFixListener();

					self._trigger( "open" );

					self._openedPage = self._page();
				};

			self._trigger( "beforeopen" );

			if ( self._page().jqmData( "panel" ) === "open" ) {
				self._on( self.document, {
					"panelclose": _openPanel
				} );
			} else {
				_openPanel();
			}

			self._open = true;
		}
	},

	close: function( immediate ) {
		if ( this._open ) {
			var self = this,

				// Record what the page is the moment the process of closing begins, because it
				// may change by the time the process completes
				currentPage = self._page(),
				o = this.options,

				_closePanel = function() {

					self._removeClass( "ui-panel-open" );

					if ( o.display !== "overlay" ) {
						self._removeClass( self._wrapper, self._pageContentOpenClasses );
						self._removeClass( self._fixedToolbars(), self._pageContentOpenClasses );
					}

					if ( !immediate && $.support.cssTransform3d && !!o.animate ) {
						( self._wrapper || self.element )
							.animationComplete( complete, "transition" );
					} else {
						setTimeout( complete, 0 );
					}

					if ( self._modal ) {
						self._removeClass( self._modal, self._modalOpenClasses );
						self._modal.height( "" );
					}
				},
				complete = function() {
					if ( o.theme && o.display !== "overlay" ) {
						self._removeClass( currentPage.parent(),
							classesMap.pageContainer + "-themed " +
							classesMap.pageContainer + "-" + o.theme );
					}

					self._addClass( "ui-panel-closed" );

					// Scroll to the top
					self._positionPanel( true );

					if ( o.display !== "overlay" ) {
						self._removeClass( currentPage.parent(), classesMap.pageContainer );
						self._removeClass( self._wrapper, classesMap.pageContentPrefix + "-open" );
						self._removeClass( self._fixedToolbars(),
							classesMap.pageContentPrefix + "-open" );
					}

					if ( $.support.cssTransform3d && !!o.animate && o.display !== "overlay" ) {
						self._removeClass( self._wrapper, "ui-panel-animate" );
						self._removeClass( self._fixedToolbars(), "ui-panel-animate" );
					}

					self._fixPanel();
					self._unbindFixListener();
					$.mobile.resetActivePageHeight();

					currentPage.jqmRemoveData( "panel" );

					self._trigger( "close" );

					self._openedPage = null;
				};

			self._trigger( "beforeclose" );

			_closePanel();

			self._open = false;
		}
	},

	toggle: function() {
		this[ this._open ? "close" : "open" ]();
	},

	_destroy: function() {
		var otherPanels,
			o = this.options,
			multiplePanels = ( $( "body > :mobile-panel" ).length +
				$.mobile.activePage.find( ":mobile-panel" ).length ) > 1;

		if ( o.display !== "overlay" ) {

			// Remove the wrapper if not in use by another panel
			otherPanels = $( "body > :mobile-panel" ).add(
				$.mobile.activePage.find( ":mobile-panel" ) );

			if ( otherPanels.not( ".ui-panel-display-overlay" ).not( this.element ).length === 0 ) {
				this._wrapper.children().unwrap();
			}

			if ( this._open ) {
				this._removeClass( this._fixedToolbars(), classesMap.pageContentPrefix + "-open" );

				if ( $.support.cssTransform3d && !!o.animate ) {
					this._removeClass( this._fixedToolbars(), "ui-panel-animate" );
				}

				this._removeClass( this._page().parent(), classesMap.pageContainer );

				if ( o.theme ) {
					this._removeClass( this._page().parent(),
						classesMap.pageContainer + "-themed " +
						classesMap.pageContainer + "-" + o.theme );
				}
			}
		}

		if ( !multiplePanels ) {
			this.document.off( "panelopen panelclose" );
		}

		if ( this._open ) {
			this._page().jqmRemoveData( "panel" );
		}

		this._panelInner.children().unwrap();

		this._removeClass( "ui-panel",
			this._getPanelClasses() + " ui-panel-open ui-panel-animate" );

		this.element.off( "panelbeforeopen panelhide keyup.panel updatelayout" );

		if ( this._modal ) {
			this._modal.remove();
		}

		this._superApply( arguments );
	}
} );

} );
