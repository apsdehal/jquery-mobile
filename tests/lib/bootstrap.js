( function() {

	requirejs.config( {
		paths: {
			"tests": "../tests",
			"external": "../external",
			"qunit": "../external/qunit/qunit",
			"qunit": "../external/qunit-assert-classes/qunit-assert-classes",
			"text": "../external/requirejs/plugins/text",
			"json": "../external/requirejs/plugins/json",

			"jquery": "../external/jquery/jquery",
			"jquery-ui": "../external/jquery-ui",
			"jquery-plugins": "../external/jquery/plugins"
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
		"forms/reset",
		"forms/select",
		"forms/select.custom",
		"forms/slider",
		"forms/slider.tooltip",
		"forms/textinput"
	];

	function getPath( dep ) {
		for ( var i = 0; i < widgets.length; i++ ) {
			if ( widgets[i] === dep ) {
				return "widgets/" + dep;
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

	function requireModules( dependencies, callback, modules ) {
		if ( dependencies.length == 1 ) {

			$( document ).ready( function() {
				var $fixture = $( '#qunit-fixture' );
				if ( $fixture.length ) {
					QUnit.config.fixture = $fixture.html();
				}
				QUnit.start();
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
			requireModules( dependencies, callback, modules );
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

		deps = fixPaths( deps );

		var init = !!script.getAttribute( "data-init" );
		var noBackCompat = !!script.getAttribute( "data-no-backcompat" );
		var baseUrl = script.getAttribute( "data-base-url" );
		var main = script.getAttribute( "data-main" );
		main = './' + main;

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

		if ( main ) {
			deps = deps.concat( main );
		}

		require( {
			baseUrl: baseUrl || "../../../js"
		} );

		requireModules( deps, function( QUnit ) {
			QUnit.config.autostart = false;
		} );

	} )();

} )();
