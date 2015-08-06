( function() {

	requirejs.config( {
		paths: {
			"tests": "../tests",
			"external": "../external",
			"qunit": "../external/qunit/qunit",
			"text": "../external/requirejs/plugins/text",
			"json": "../external/requirejs/plugins/json",

			"jquery": "../external/jquery/jquery",
			"jquery-ui": "../external/jquery-ui",
			"jquery-plugins": "../external/jquery/plugins",
			"qunit-assert-classes": "../external/qunit-assert-classes/qunit-assert-classes"
		}
	} );

	define( "jquery-no-backcompat", [ "jquery" ], function( $ ) {
		$.mobileBackcompat = false;
		return $;
	} );

	define( "jquery-set-ns", [ "jquery" ], function( $ ) {
		$( document ).bind( "mobileinit", function() {
			$.mobile.ns = "nstest-";
			$.support.inlineSVG = $.noop;
		});

		return $;
	} );

	var widgets = [
		// Main Widgets
		"accordion",
		"addFirstLastClasses",
		"collapsible",
		"collapsibleSet",
		"controlgroup",
		"dialog",
		"enhancer",
		"enhancer.backcompat",
		"enhancer.widgetCrawler",
		"filterable",
		"fixedToolbar",
		"fixedToolbar.workarounds",
		"listview",
		"listview.autodividers",
		"listview.hidedividers",
		"loader",
		"navbar",
		"page",
		"page.dialog",
		"pagecontainer",
		"panel",
		"popup",
		"popup.arrow",
		"table",
		"tabs.ajax",
		"table.reflow",
		"table.columntoggle",
		"toolbar",
		"widget.backcompat",
		"widget.theme",
		// Form Widgets
		"forms/autogrow",
		"forms/button",
		"forms/checkboxradio",
		"forms/clearButton",
		"forms/flipswitch",
		"forms/rangeslider",
		"forms/rangeslider.backcompat",
		"forms/reset",
		"forms/select",
		"forms/select.custom",
		"forms/slider",
		"forms/slider.backcompat",
		"forms/slider.tooltip",
		"forms/textinput",
		"forms/textinput.backcompat"
	];

	var events = [
		"navigate",
		"orientationchange",
		"scroll",
		"throttledresize",
		"touch"
	];

	function getPath( dep ) {
		for ( var i = 0; i < widgets.length; i++ ) {
			if ( widgets[i] === dep ) {
				return "widgets/" + dep;
			}
		}

		for ( var i = 0; i < events.length; i++ ) {
			if ( events[i] === dep ) {
				return "events/" + dep;
			}
		}
		return dep;
	}

	function fixPaths( deps ) {
		for ( var i = 0; i < deps.length; i++ ) {
			deps[ i ] = getPath( deps[ i ] );
		}

		return deps;
	}

	function requireModules( dependencies, callback, noAutoStart, modules ) {
		if ( dependencies.length == 1 ) {

			$( document ).ready( function() {
				var $fixture = $( '#qunit-fixture' );
				if ( $fixture.length ) {
					QUnit.config.fixture = $fixture.html();
				}

				if ( !noAutoStart ) {
					QUnit.start();
				}
			} );
		}

		if ( !dependencies.length ) {
			if ( callback ) {
				callback.apply( null, modules );
			}
		}

		if ( !modules ) {
			modules = [];
		}

		var dependency = dependencies.shift();
		require( [ dependency ], function( module ) {
			modules.push( module );
			requireModules( dependencies, callback, noAutoStart, modules );
		} );
	}

	// Load test modules based on data attributes
	( function() {

		var scripts = document.getElementsByTagName( "script" );
		var script = scripts[ scripts.length - 1 ];

		var deps = script.getAttribute( "data-deps" );

		if ( deps ) {
			deps = deps.replace( /^\s+|\s+$/g, "" ).split( /\s+/ );
		} else {
			deps = [];
		}

		var full = !!script.getAttribute( "data-full" );

		if ( full ) {
			deps = deps.concat( "jquery.mobile" );
		}

		deps = fixPaths( deps );

		var init = !!script.getAttribute( "data-init" );
		var noAutoStart = !!script.getAttribute( "data-no-autostart" );
		var noBackCompat = !!script.getAttribute( "data-no-backcompat" );
		var baseUrl = script.getAttribute( "data-base-url" );
		var modules = script.getAttribute( "data-modules" );

		// Format modules attribute
		if ( modules ) {
			modules = modules
					  .replace( /^\s+|\s+$/g, "" )
					  .split( /\s+/ )
					  .map( function( module ) {
					  	// Change to make sure it is loaded from the local folder
					  	return "./" + module + ".js";
					  });
		} else {
			modules = [];
		}

		// Load these after backcompat resolution
		deps = [
			"jquery.tag.inserter",
			"tests/jquery.testHelper"
		].concat( deps );

		if ( init ) {
			deps = deps.concat( [ "init" ] );

			if ( noBackCompat ) {
				deps = [ "jquery-no-backcompat" ].concat( deps );
			} else {
				deps =  [
					"jquery-set-ns",
					"widgets/widget.backcompat"
				].concat( deps );
			}
		} else {
			deps = [ "jquery" ].concat( deps );
		}

		// Load QUnit first among all of them
		deps = [ "qunit" ].concat( deps );

		deps = deps.concat( modules );

		require( {
			baseUrl: baseUrl || "../../../js"
		} );

		requireModules( deps, function( QUnit ) {
			QUnit.config.autostart = false;
		}, noAutoStart );

	} )();

} )();
