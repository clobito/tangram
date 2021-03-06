/*jslint browser: true*/
/*global Tangram, gui */

/*

Hello source-viewers!

We're glad you're interested in how Tangram can be used to make amazing maps!

This demo is meant to show off various visual styles, but it has a really complex setup - we had to jump through a lot of hoops to implement the style-switcher and rebuild the dat.gui interface on the fly, which are things you would probably never have to do in a real-world use case.

So instead of rummaging through this rather confusing example, we recommend you check out our documentation, which is chock-full of specific, targeted demos highlighting all of the nifty features of the Tangram library:

https://github.com/tangrams/tangram/wiki/

Enjoy!
- The Mapzen Tangram team

*/

/* Control de cambios
Fecha actualizado: 30/11/2015
Cambio realizado: Actualización de la llave API componente vector-tiles
Fecha actualizado: 09/12/2015
Cambio realizado: Actualización del Zoom a 22x
*/

(function () {
    'use strict';

    var tile_sources = {
        'mapzen': {
            type: 'MVT',
            //url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-HqUVidw'
            url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.mvt?api_key=vector-tiles-PNP2Dn4'
        },
        'mapzen-geojson': {
            type: 'GeoJSON',
            //url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.json?api_key=vector-tiles-HqUVidw'//,
            url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.json?api_key=vector-tiles-PNP2Dn4'
            // transform: function(data) {
            //     // You can edit the tile data here before it gets projected
            //     // and rendered
            //     return data;
            // },
            // scripts: [
            //     // importScripts doesn't like the agnostic //example.com proto
            //     'http://api.tiles.mapbox.com/mapbox.js/plugins/turf/v2.0.0/turf.min.js'
            // ]
        },
        'mapzen-dev': {
            type: 'GeoJSON',
            //url: 'https://vector.dev.mapzen.com/osm/all/{z}/{x}/{y}.json?api_key=vector-tiles-HqUVidw'
            url: 'https://vector.dev.mapzen.com/osm/all/{z}/{x}/{y}.json?api_key=vector-tiles-PNP2Dn4'
        },
        'mapzen-local': {
            type: 'GeoJSON',
            //url: '//localhost:8080/all/{z}/{x}/{y}.json?api_key=vector-tiles-HqUVidw'
            url: '//localhost:8080/all/{z}/{x}/{y}.json?api_key=vector-tiles-PNP2Dn4'
        },
        'mapzen-topojson': {
            type: 'TopoJSON',
            //url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=vector-tiles-HqUVidw'
            url: 'https://vector.mapzen.com/osm/all/{z}/{x}/{y}.topojson?api_key=vector-tiles-PNP2Dn4'
        },

        // 'osm': {
        //     type: 'GeoJSON',
        //     url: '//tile.openstreetmap.us/vectiles-all/{z}/{x}/{y}.json'
        // },

        'mapbox': {
            type: 'MVT',
            url: 'https://{s:[a,b,c,d]}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6-dev/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiYmNhbXBlciIsImEiOiJWUmh3anY0In0.1fgSTNWpQV8-5sBjGbBzGg',
            max_zoom: 15
        }

    },
    default_tile_source = 'mapzen',
    scene_url = 'demos/scene.yaml',
    //osm_debug = false,
    osm_debug = true,
    rS, url_hash, map_start_location, url_ui, url_style;    

    getValuesFromUrl();    
    
    // default source, can be overriden by URL
    //alert("Escena => "+scene_url);
    var
        map = L.map('map', {
            //maxZoom: 20,
            maxZoom: 22,
            trackResize: true,
            keyboard: false
        }),
        
        layer = Tangram.leafletLayer({
            scene: scene_url,
            preUpdate: preUpdate,
            postUpdate: postUpdate,
            // highDensityDisplay: false,
            logLevel: 'debug',
            //attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
            attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a><span title="Usar la combinación de teclas Control + Click izquierdo del mouse para visualizar información del segmento" style="cursor:pointer">| Información Segmento</span>'
        });
        //Carga de la escena
    layer.scene.subscribe({
        load: function (msg) {            
            var config = msg.config;            
            // If no source was set in scene definition, set one based on the URL
            if (!config.sources || !config.sources['osm']) {
                config.sources = config.sources || {};
                config.sources['osm'] = tile_sources[default_tile_source];
            }

        },
        error: function (msg) {
            // debugger;            
        },
        warning: function (msg) {
            // debugger;
        }
    });

    /***** GUI/debug controls *****/

    /*** URL parsing ***/

    // URL hash pattern is one of:
    // #[source]
    // #[lat],[lng],[zoom]
    // #[source],[lat],[lng],[zoom]
    // #[source],[location name]
    function getValuesFromUrl() {        
        url_hash = window.location.hash.slice(1, window.location.hash.length).split(',');
       
        // Get tile source from URL
        if (url_hash.length >= 1 && tile_sources[url_hash[0]] != null) {
            default_tile_source = url_hash[0];

        }
        //alert("URL Length =>"+url_hash.length);        
        // Get location from URL
        //map_start_location = [40.70531887544228, -74.00976419448853, 16]; // NYC
        //Colombia
        map_start_location = [4.647231, -74.095740, 15];
        //alert("Coordenadas =>"+map_start_location);         
        if (url_hash.length === 3) {
            map_start_location = url_hash.slice(0, 3);
        }
        if (url_hash.length > 3) {
            map_start_location = url_hash.slice(1, 4);            
        }

        if (url_hash.length > 4) {
            url_ui = url_hash.slice(4);

            // Style on URL?
            url_style;
            if (url_ui) {
                var re = new RegExp(/(?:style|mode)=(\w+)/);
                url_ui.forEach(function(u) {
                    var match = u.match(re);
                    url_style = (match && match.length > 1 && match[1]);

                });
            }           
        }         
    }
    //alert("Coordenadas =>"+map_start_location);
    // Put current state on URL
    var update_url_throttle = 100;
    var update_url_timeout = null;
    function updateURL() {        
        clearTimeout(update_url_timeout);
        update_url_timeout = setTimeout(function() {
            var center = map.getCenter();
            var url_options = [default_tile_source, center.lat, center.lng, map.getZoom()];

            if (rS) {
                url_options.push('rstats');
            }

            if (style_options && style_options.effect != '') {
                url_options.push('style=' + style_options.effect);
            }            
            
            window.location.hash = url_options.join(',');            
            
        }, update_url_throttle);
    }

    /*** Map ***/
    
    window.layer = layer;
    window.map = map;
    var scene = layer.scene;
    window.scene = scene;

      // Update URL hash on move
    map.attributionControl.setPrefix('');
    map.setView(map_start_location.slice(0, 2), map_start_location[2]);
    map.on('move', updateURL);    

    // Take a screenshot and save file
    function screenshot() {
        // Adapted from: https://gist.github.com/unconed/4370822
        var image = scene.canvas.toDataURL('image/png').slice(22); // slice strips host/mimetype/etc.
        var data = atob(image); // convert base64 to binary without UTF-8 mangling
        var buf = new Uint8Array(data.length);
        for (var i = 0; i < data.length; ++i) {
            buf[i] = data.charCodeAt(i);
        }
        var blob = new Blob([buf], { type: 'image/png' });
        saveAs(blob, 'tangram-' + (+new Date()) + '.png'); // uses FileSaver.js: https://github.com/eligrey/FileSaver.js/
    }

    // Render/GL stats: http://spite.github.io/rstats/
    // Activate with 'rstats' anywhere in options list in URL
    if (url_ui && url_ui.indexOf('rstats') >= 0) {
        var glS = new glStats();
        glS.fractions = []; // turn this off till we need it

        rS = new rStats({
            values: {
                frame: { caption: 'Total frame time (ms)', over: 5 },
                raf: { caption: 'Time since last rAF (ms)' },
                fps: { caption: 'Framerate (FPS)', below: 30 },
                rendertiles: { caption: 'Rendered tiles' },
                features: { caption: '# of geo features' },
                glbuffers: { caption: 'GL buffers (MB)' }
            },
            CSSPath : 'demos/lib/',
            plugins: [glS]
        });

        // Move it to the bottom-left so it doesn't obscure zoom controls
        var rSDOM = document.querySelector('.rs-base');
        rSDOM.style.bottom = '0px';
        rSDOM.style.top = 'inherit';
    }
    
    // For easier debugging access

    // GUI options for rendering style/effects
	// Combo de estilos
	/*Definición de colores de la región => sección settings
    Fecha actualizado: 17/12/2015
    Cambio realizado: Adicionar el estilo Plain, para dibujar las alturas de manera constante.
    Fecha actualizado: 18/12/2015
    Cambio realizado: Dejar mapa base visible al cargar => dejar desactivada la capa "earth" en el efecto "daneplain"
    Fecha actualizado: 21/12/2015
    Cambio realizado: Para la opción None, dejar la capa sin estilo, dibujándose la altura de manera constante (efecto danenone)
    Fecha actualizado: 21/12/2015
    Cambio realizado: Actualizar el cargue los efectos {None, Water animation, Plain}: Estilo plano de los edificios
    */

    var style_options = {
        effect: url_style || '',
        options: {
            'None': 'danenone',
            'Water animation': 'water',
            'Elevator': 'elevator',
            'Pop-up': 'popup',
            'Halftone': 'halftone',
            'Windows': 'windows',
            'Environment Map': 'envmap',
            'Rainbow': 'rainbow',
            'Plain': 'daneplain'
        },
        saveInitial: function() {            
            this.initial = { config: JSON.stringify(scene.config) };
        },
        setup: function (style) {           
            // Restore initial state
            scene.config = JSON.parse(this.initial.config);

            // Remove existing style-specific controls
            gui.removeFolder(this.folder);

            // Style-specific settings
            if (style != '') {               
                if (this.settings[style] != null) {
                    var settings = this.settings[style] || {};

                    // Change projection if specified
                    if (settings.camera) {
                        scene.setActiveCamera(settings.camera);
                    }

                    // Style-specific setup function
                    if (settings.setup) {
                        settings.uniforms = function() {
                            return scene.styles[style] && scene.styles[style].shaders.uniforms;
                        };
                        settings.state = {}; // dat.gui needs a single object to old state

                        this.folder = style[0].toUpperCase() + style.slice(1); // capitalize first letter
                        settings.folder = gui.addFolder(this.folder);
                        settings.folder.open();

                        settings.setup(style);

                        if (settings.folder.__controllers.length === 0) {
                            gui.removeFolder(this.folder);
                        }
                    }
                }
            }           
             
            // Recompile/rebuild
            scene.updateConfig({ rebuild: true });            
            updateURL();

            // Force-update dat.gui
            for (var i in gui.__controllers) {
                gui.__controllers[i].updateDisplay();
            }
        },
        settings: {            
            'water': {
                setup: function (style) {
                    scene.config.layers.water.draw.polygons.style = style;
                    //Estilo a las capas Viviendas, Hogares, PersonasHogar
                    style = 'water';
                    //style = 'windows';
                    scene.config.layers.Viviendas.draw.polygons.style               =   style;
                    scene.config.layers.Viviendas.extruded.draw.polygons.style      =   style;

                    scene.config.layers.Hogares.draw.polygons.style                 =   style;
                    scene.config.layers.Hogares.extruded.draw.polygons.style        =   style; 

                    scene.config.layers.PersonasHogar.draw.polygons.style           =   style;
                    scene.config.layers.PersonasHogar.extruded.draw.polygons.style  =   style;
                    
                    //Visibilidad capas: Dejar visible la capa Viviendas, las demás ocultas

                    layer.scene.config.layers['Viviendas'].visible                  =   true;
                    layer.scene.config.layers['Hogares'].visible                    =   false;
                    layer.scene.config.layers['PersonasHogar'].visible              =   false;

                    //Ocultar textos de las capas
                    scene.config.layers.Viviendas.draw.text.visible                 =   false;
                    scene.config.layers.Hogares.draw.text.visible                   =   false;
                    scene.config.layers.PersonasHogar.draw.text.visible             =   false;
                }
            },
            'rainbow': {
                setup: function (style) {
                    //Personalizar color poligonos de manera dinàmica
                    //scene.config.layers.earth.draw.polygons.color = '#333';
                    scene.config.layers.earth.draw.polygons.color = '#1B008F';
                    //Personalizar color calles, carreras
                    //scene.config.layers.roads.draw.lines.color = '#777';
                    scene.config.layers.roads.draw.lines.color = '#730016';
                    scene.config.layers.poi_icons.visible = false;
                    scene.config.layers.buildings.draw.polygons.style = style;
                    scene.config.layers.buildings.extruded.draw.polygons.style = style;
                }
            },
            'popup': {
                setup: function (style) {
                    scene.config.layers.buildings.extruded.draw.polygons.style = style;
                }
            },
            'elevator': {
                setup: function (style) {                    
                    scene.config.layers.buildings.extruded.draw.polygons.style = style;
                }
            },
            'halftone': {
                setup: function (style) {
                    
                    //scene.config.scene.background.color = 'black';
                    //scene.config.scene.background.color = '#E18B00';
                    
                    //Configuración de las capas
                    var layers = scene.config.layers;
                    layers.earth.draw.polygons.style = 'halftone_polygons';
                    layers.water.draw.polygons.style = 'halftone_polygons';
                    // layers.water.outlines.draw.lines.style = 'halftone_lines';
                    layers.landuse.draw.polygons.style = 'halftone_polygons';
                    layers.buildings.draw.polygons.style = 'halftone_polygons';
                    layers.buildings.extruded.draw.polygons.style = 'halftone_polygons';
                    layers.buildings.draw.polygons.color = 'Style.color.pseudoRandomColor()';
                    layers.roads.draw.lines.style = 'halftone_lines';
                    layers.poi_icons.visible = false;

                    var visible_layers = ['landuse', 'water', 'roads', 'buildings'];
                    Object.keys(layers).forEach(function(l) {
                        if (visible_layers.indexOf(l) === -1) {
                            layers[l].visible = false;
                        }
                    });
                }
            },
            'windows': {
                camera: 'isometric', // force isometric
                setup: function (style) {
                    scene.config.layers.earth.draw.polygons.color = '#333';
                    scene.config.layers.roads.draw.lines.color = '#777';
                    scene.config.layers.poi_icons.visible = false;

                    scene.config.layers.buildings.draw.polygons.style = style;
                    scene.config.layers.buildings.extruded.draw.polygons.style = style;
                    // scene.config.layers.pois.visible = false;
                }
            },
            'envmap': {
                setup: function (style) {
                    scene.config.layers.earth.draw.polygons.color = '#333';
                    scene.config.layers.roads.draw.lines.color = '#777';

                    scene.config.layers.buildings.draw.polygons.style = style;
                    scene.config.layers.buildings.extruded.draw.polygons.style = style;

                    var envmaps = {
                        'Sunset': window.location.origin+window.location.pathname+'demos/images/sunset.jpg',
                        'Chrome': window.location.origin+window.location.pathname+'demos/images/LitSphere_test_02.jpg',
                        'Matte Red': window.location.origin+window.location.pathname+'demos/images/matball01.jpg',
                        'Color Wheel': window.location.origin+window.location.pathname+'demos/images/wheel.png'
                    };

                    this.state.envmap = scene.styles.envmap.material.emission.texture;
                    this.folder.add(this.state, 'envmap', envmaps).onChange(function(value) {
                        scene.styles.envmap.material.emission.texture = value;
                        scene.requestRedraw();
                    }.bind(this));
                }
            },
            'daneplain':
            {
                setup: function (style)
                {
                    //Ocultar las demás capas
                    scene.config.layers.earth.draw.polygons.visible                 =   false;
                    scene.config.layers.landuse.draw.polygons.visible               =   false;
                    scene.config.layers.water.draw.polygons.visible                 =   false;
                    scene.config.layers.roads.draw.lines.visible                    =   false;
                    scene.config.layers.buildings.draw.polygons.visible             =   false;
                    scene.config.layers.road_labels.highway.draw.text.visible       =   false;
                    scene.config.layers.road_labels.not_highway.draw.text.visible   =   false;
                    /*scene.config.layers.poi_icons.draw.points.visible               =   false;*/                 
                    //Estilo a las capas Viviendas, Hogares, PersonasHogar
                    style = 'water';
                    //style = 'windows';
                    scene.config.layers.Viviendas.draw.polygons.style               =   style;
                    scene.config.layers.Viviendas.extruded.draw.polygons.style      =   style;

                    scene.config.layers.Hogares.draw.polygons.style                 =   style;
                    scene.config.layers.Hogares.extruded.draw.polygons.style        =   style; 

                    scene.config.layers.PersonasHogar.draw.polygons.style           =   style;
                    scene.config.layers.PersonasHogar.extruded.draw.polygons.style  =   style;
                    
                    //Visibilidad capas: Dejar visible la capa Viviendas, las demás ocultas

                    layer.scene.config.layers['Viviendas'].visible                  =   true;
                    layer.scene.config.layers['Hogares'].visible                    =   false;
                    layer.scene.config.layers['PersonasHogar'].visible              =   false;

                    //Ocultar textos de las capas
                    scene.config.layers.Viviendas.draw.text.visible                 =   false;
                    scene.config.layers.Hogares.draw.text.visible                   =   false;
                    scene.config.layers.PersonasHogar.draw.text.visible             =   false;
                }
            },
            'danenone':
            {
               setup: function (style)
               {
                    style = 'water';
                    //alert("Estilo =>"+style);
                    scene.config.layers.Viviendas.draw.polygons.style               =   style;
                    scene.config.layers.Viviendas.extruded.draw.polygons.style      =   style;

                    scene.config.layers.Hogares.draw.polygons.style                 =   style;
                    scene.config.layers.Hogares.extruded.draw.polygons.style        =   style; 

                    scene.config.layers.PersonasHogar.draw.polygons.style           =   style;
                    scene.config.layers.PersonasHogar.extruded.draw.polygons.style  =   style;

                     //Visibilidad capas: Dejar visible la capa Viviendas, las demás ocultas

                    layer.scene.config.layers['Viviendas'].visible                  =   true;
                    layer.scene.config.layers['Hogares'].visible                    =   false;
                    layer.scene.config.layers['PersonasHogar'].visible              =   false;

                     //Ocultar textos de las capas
                    scene.config.layers.Viviendas.draw.text.visible                 =   false;
                    scene.config.layers.Hogares.draw.text.visible                   =   false;
                    scene.config.layers.PersonasHogar.draw.text.visible             =   false;

               } 
            }
        },
        scaleColor: function (c, factor) { // convenience for converting between uniforms (0-1) and DAT colors (0-255)
            if ((typeof c == 'string' || c instanceof String) && c[0].charAt(0) == "#") {
                // convert from hex to rgb
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
                c = result ? [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16)
                ] : null;
            }
            return [c[0] * factor, c[1] * factor, c[2] * factor];
        }
    };   
    // Create dat GUI
    var gui = new dat.GUI({ autoPlace: true });
    function addGUI () {
        /* Propósito: Controles del Panel de control
        Fecha Actualizado: 17/12/2015
        Cambio realizado: Dejar activadas las capas Viviendas, Hogares, PersonasHogar, desactivando todas las demás.*/
        gui.domElement.parentNode.style.zIndex = 10000;
        window.gui = gui;
        //Prueba
        //alert("Info =>"+scene.selection.feature.NRO_PISOS);
        // Add ability to remove a whole folder from DAT.gui
        gui.removeFolder = function(name) {
            var folder = this.__folders[name];
            if (folder == null) {
                return;
            }

            folder.close();
            folder.__ul.parentNode.removeChild(folder.__ul);
            this.__folders[name] = undefined;
            this.onResize();
        };       
        // Camera
        var camera_types = {
            'Flat': 'flat',
            'Perspective': 'perspective',
            'Isometric': 'isometric'
        };
        gui.camera = scene.getActiveCamera();
        gui.add(gui, 'camera', camera_types).onChange(function(value) {
            scene.setActiveCamera(value);
            scene.updateConfig();
        });

        // Feature selection on hover
        gui['feature info'] = true;
        gui.add(gui, 'feature info');

        // Screenshot
        gui.screenshot = function () {
            gui.queue_screenshot = true;
            scene.requestRedraw();
        };
        gui.add(gui, 'screenshot');

        // Layers
        var layer_gui = gui.addFolder('Layers');
        var layer_controls = {};
        Object.keys(layer.scene.config.layers).forEach(function(l) {
            //alert("l=>"+l);            
            if (!layer.scene.config.layers[l]) {
                return;
            }
            //Desactivar capas primarias, dejar activa la capa Viviendas
            //layer_controls[l] = !(layer.scene.config.layers[l].visible == false);
            layer_controls[l] = false;            
            layer_controls['Viviendas']     =   true;            
            //alert("Control capa =>"+layer_controls[l]);
            layer_gui.
                add(layer_controls, l).
                onChange(function(value) { 
                    //alert("Visible =>"+value);                   
                    layer.scene.config.layers[l].visible = value;
                    layer.scene.rebuildGeometry();
                });
        });

        // Styles
        gui.add(style_options, 'effect', style_options.options).
            onChange(style_options.setup.bind(style_options));

        // Link to edit in OSM - hold 'e' and click
        window.addEventListener('click', function () {
        /*Fecha actualizado: 15/12/2015
        Cambio realizado: Implementación del cargue de información sobre la capa de manzana. Información: Total Vivienda, Total Hogar, Total Personas Hogar.
        Autor: DANE
        FUENTE: http://labs.abeautifulsite.net/archived/jquery-alerts/demo/*/
        
            // if (key.isPressed('e')) {
            if (key.shift) {
                var url = 'https://www.openstreetmap.org/edit?';

                if (scene.selection.feature && scene.selection.feature.id) {
                    url += 'way=' + scene.selection.feature.id;
                }

                if (scene.center) {
                    url += '#map=' + scene.baseZoom(scene.zoom) + '/' + scene.center.lat + '/' + scene.center.lng;
                }                               
                window.open(url, '_blank');
            }
            //Cuando se realice Control + click sobre la región, presentar la información en una ventana auxiliar, tipo jAlert
            //Fecha: 15/12/2015
            else if (key.ctrl)
            {
                var infoCapa = scene.camera.scene.selection.feature.properties;                
                //alert("Ensayo =>"+infoCapa.FID+","+infoCapa.TOT_HOG);
                if (infoCapa.FID != undefined)
                {
                    jAlert("Total Vivienda:"+infoCapa.TOT_VIV+"\n"+"Total Hogares:"+infoCapa.TOT_HOG+"\n"+"Total personas en el hogar:"+infoCapa.TOT_PERHOG,"Información Segmento"+" "+infoCapa.FID);
                }
                else
                {
                    jAlert("No existe información del segmento","Alerta");
                }
            }         
        });
    }

    // Feature selection
    function initFeatureSelection () {
        // Selection info shown on hover
        var selection_info = document.createElement('div');
        selection_info.setAttribute('class', 'label');
        selection_info.style.display = 'block';

        // Show selected feature on hover
        map.getContainer().addEventListener('mousemove', function (event) {
            if (gui['feature info'] == false) {
                if (selection_info.parentNode != null) {
                    selection_info.parentNode.removeChild(selection_info);
                }

                return;
            }

            var pixel = { x: event.clientX, y: event.clientY };

            scene.getFeatureAt(pixel).then(function(selection) {
                if (!selection) {
                    return;
                }
                var feature = selection.feature;
                if (feature != null) {
                    var label = '';                   
                    if (feature.properties.name != null) {
                        label = feature.properties.name;
                    }
                    // Object.keys(feature.properties).forEach(p => label += `<b>${p}:</b> ${feature.properties[p]}<br>`);

                    if (label != '') {
                        selection_info.style.left = (pixel.x + 5) + 'px';
                        selection_info.style.top = (pixel.y + 15) + 'px';
                        selection_info.innerHTML = '<span class="labelInner">' + label + '</span>';
                        map.getContainer().appendChild(selection_info);
                    }
                    else if (selection_info.parentNode != null) {
                        selection_info.parentNode.removeChild(selection_info);
                    }
                }
                else if (selection_info.parentNode != null) {
                    selection_info.parentNode.removeChild(selection_info);
                }
            });

            // Don't show labels while panning
            if (scene.panning == true) {
                if (selection_info.parentNode != null) {
                    selection_info.parentNode.removeChild(selection_info);
                }
            }
        });
    }

    // Pre-render hook
    var zoom_step = 0.03;
    function preUpdate (will_render) {
        // Input
        if (key.isPressed('up')) {
            map._move(map.getCenter(), map.getZoom() + zoom_step);
        }
        else if (key.isPressed('down')) {
            map._move(map.getCenter(), map.getZoom() - zoom_step);
        }

        // Profiling
        if (will_render && rS) {
            rS('frame').start();
            // rS('raf').tick();
            rS('fps').frame();

            if (scene.dirty) {
                glS.start();
            }
        }
    }

    // Post-render hook
    function postUpdate () {
        if (rS != null) { // rstats
            rS('frame').end();
            rS('rendertiles').set(scene.renderable_tiles_count);
            rS('glbuffers').set((scene.tile_manager.getDebugSum('buffer_size') / (1024*1024)).toFixed(2));
            rS('features').set(scene.tile_manager.getDebugSum('features'));
            rS().update();
        }

        // Screenshot needs to happen in the requestAnimationFrame callback, or the frame buffer might already be cleared
        if (gui.queue_screenshot == true) {
            gui.queue_screenshot = false;
            screenshot();
        }
    }

    /***** Render loop *****/
    /*Fecha actualizado: 21/12/2015
    Cambio realizado: Establecer por default el estilo a daneplain, para dar atención al requerimiento "Apagar efecto “Strude” al cambiar el efecto en el Panel de control, bajo opción Effect a none"*/
    window.addEventListener('load', function () {
        url_style = 'daneplain';
        // Scene initialized
        layer.on('init', function() {            
            addGUI();            
            style_options.saveInitial();
            //alert("url_style =>"+url_style);
            if (url_style) {
                style_options.setup(url_style);
            }

            updateURL();

            initFeatureSelection();
        });
        
        layer.addTo(map);

        if (osm_debug == true) {
            window.osm_layer =
                L.tileLayer(
                    'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    // 'https://stamen-tiles.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}.jpg',
                    {
                        maxZoom: 19//,
                        // opacity: 0.5
                    })
                .addTo(map);
                // .bringToFront();
        }

        layer.bringToFront();
    });


}());
