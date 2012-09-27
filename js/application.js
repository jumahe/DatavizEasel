// -- canvas dimensions
var CANVAS_WIDTH = viewport().width;
var CANVAS_HEIGHT = viewport().height;

// -- variables
var wrapper;
var canvas;
var stage;
var colors = new Array( 
    "rgba(30,180,255,1)",   // blue
    "rgba(204,197,3,1)",    // green
    "rgba(255,55,75,1)",    // pink
    "rgba(159,76,255,1)",   // purple
    "rgba(204,121,3,1)"     // orange
    );
var vTweens = new Array();
var drawLinesB = new Array();

// -- tooltip
var tooltip;
var ttLab;
var ttVisible = false;

// -- datas
var datas_len = 0;
var years = new Array();
var yearsId = new Array();
var nb_values = 5;

// -- values order:
// --> somme temperatures (°C)
// --> pluie (mm)
// --> jour où temperature > 30°
// --> rdm 1
// --> rdm 2
var labelNames = new Array(
    "Sum t°:",
    "Rain:",
    "T°>30°:",
    "Rdm1:",
    "Rdm2:"
);
var labelUnits = new Array(
    "C°",
    "mm",
    "days",
    "",
    ""
);

// -- current ID
var currentID = 0;

// -- extreme values & angles ({ min:999, max:0, angle:0 })
var constVal = new Array();

// -- points (temp, pluie, jours )
var pointsShape = new Array();

// -- lines
var linesShape = new Array();

// -- arc Shapes
var arcsShape = new Array();

// -- base lines
var bLinesGraph = new Array();
var bLinesShape = new Array();

// -- ring
var CIRCLE_INTERN_RADIUS = 200;
var CIRCLE_EXTERN_RADIUS = 230;
var ring;
var ringGraphic;
var ringShape;
var angle = 20;

// -- central circles
var circles;
var nb_circles = 4;
var circle_radius_base = CIRCLE_EXTERN_RADIUS + 5;
var circle_radius_delta = 10;
var ccGraphs = new Array();
var ccShapes = new Array();

// -- date markers
var markerGraph;
var markerShapes = new Array();
var currentSelected = null;
var nextSelected = null;

// -- cursor
var cursorGraph;
var cursorShape;


// -- INIT
// -----------------------------------------------------------
function initApp( canvasId )
{
	// -- are canvas supported?
	if(!(!!document.createElement('canvas').getContext))
	{
            var wrapper = document.getElementById("wrapper");
            wrapper.innerHTML = "Your browser does not appear to support the HTML5 Canvas element";
            return;
	}

	// -- get a reference to the canvas element
	canvas = document.getElementById( canvasId );
	canvas.setAttribute("width", CANVAS_WIDTH);
	canvas.setAttribute("height", CANVAS_HEIGHT);
	
	// -- init stage
	stage = new Stage( canvas );
        
        // -- init some values
        var i;
        var o;
        var deltaAngle = 360 / nb_values;
        for( i = 0; i < nb_values; i++ )
        {
            o = {min:9999, max:0, angle:(0 + (deltaAngle * i))};
            constVal[i] = o;
        }
        
        // -- parse datas
        parseDatas();
        
        // -- draw UI
        initUI();
	
	// -- EnterFrame + addEventListener
	Ticker.setFPS(24);
	Ticker.addListener(this);
        
        // -- resize
        $(window).resize( function(){
            onResize();
        });
}


// -- onEnterFrameHandler
// -----------------------------------------------------------
function tick()
{
	// -- update things...
        var i;
        for( i = 0; i < nb_values; i++ )
        {
            if( drawLinesB[i] == true )
            {
                //redrawLine( i );
                redrawArc( i );
            }
        }
        
        if( ttVisible == true )
        {
            tooltip.x += (stage.mouseX + 5 - tooltip.x) * .25;
            tooltip.y += (stage.mouseY - 5 - tooltip.y) * .25;
        }
        
        // -- tell the stage to render to the canvas
	stage.update();
}


// -- onResizeEventHandler
// -----------------------------------------------------------
function onResize()
{
    // -- record the new values
    CANVAS_WIDTH = viewport().width;
    CANVAS_HEIGHT = viewport().height;
    
    // -- resize the canvas area
    canvas.setAttribute("width", CANVAS_WIDTH);
    canvas.setAttribute("height", CANVAS_HEIGHT);
    
    // -- center the shape
    ring.x = CANVAS_WIDTH * .5;
    ring.y = CANVAS_HEIGHT * .5;
    
    // -- recenter tooltip
    tooltip.x = ring.x;
    tooltip.y = ring.y;
    
    stage.update();
}


// -- get Viewport Size
// -----------------------------------------------------------
function viewport()
{
    var e = window
    , a = 'inner';
    
    if ( !( 'innerWidth' in window ) )
    {
        a = 'client';
        e = document.documentElement || document.body;
    }
    
    return {width : e[ a+'Width' ] , height : e[ a+'Height' ]}
}


// -- parse Datas
// -----------------------------------------------------------
function parseDatas()
{
    datas_len = datas.millesimes.length;
    
    var i,j;
    var o;
    var val;
    
    // -- millesimes parsing
    for( i = 0; i < datas_len; i++ )
    {
        o = datas.millesimes[i];
        years[i] = o;
        yearsId[(o.annee + "")] = i;
        
        // -- values parsing and min/max finding
        for( j = 0; j < nb_values; j++ )
        {
            val = o.values[j];
            if( val > constVal[j].max ) constVal[j].max = val;
            if( val < constVal[j].min ) constVal[j].min = val;
            constVal[j].min = 0;
        }
    }
}


// -- init UI
// -----------------------------------------------------------
function initUI()
{
    var i;
    ring = new Container();
    
    // -- enabling mouseOver on Stage
    stage.enableMouseOver();
    
    // -- add the Ring to the stage
    stage.addChild( ring );
    
    // -------------------------------------------------------
    // -- central circles
    // -------------------------------------------------------
    circles = new Container();
    
    var ccGraph;
    var ccShape;
    
    // -- create circles
    for( i = 0; i < nb_circles; i++ )
    {
        ccGraph = new Graphics();
        ccGraph.beginFill( "rgba(165,255,107,.25)" );
        ccGraph.drawCircle( 0, 0, circle_radius_base + (circle_radius_delta * i));
        ccGraphs[i] = ccGraph;
        
        ccShape = new Shape( ccGraph );
        ccShapes[i] = ccShape;
    }
    
    // -- addCircles
    for( i = nb_circles - 1; i >= 0; i-- )
    {
       circles.addChild( ccShapes[i] ); 
    }
    
    // -- add the circles container to the ring
    ring.addChild( circles );
    
    // -- init circles aspect
    for( i = 0; i < nb_circles; i++ )
    {
        ccShape = ccShapes[i];
        ccShape.alpha = .1;
    }
    
    // -- + a kind of mask
    ccGraph = new Graphics();
    //ccGraph.beginFill( "rgba(0,0,0,.5)" );
    ccGraph.beginRadialGradientFill(["#666","#333"], [0, 1], 0, 0, 0, 0, 0, CIRCLE_EXTERN_RADIUS);
    ccGraph.drawCircle( 0, 0, CIRCLE_EXTERN_RADIUS);
    
    ccShape = new Shape( ccGraph );
    
    circles.addChild(ccShape);
    
    // -------------------------------------------------------
    // -- ring
    // -------------------------------------------------------
    ringGraphic = new Graphics();
    ringGraphic.setStrokeStyle(1);
    ringGraphic.beginStroke( Graphics.getRGB( 0, 0, 0, 0 ) );
    //ringGraphic.beginFill( "rgba(255,255,255,.1)" );
    ringGraphic.beginFill("#333");
    ringGraphic.moveTo( CIRCLE_INTERN_RADIUS * Math.sin(degToRad(angle)), -CIRCLE_INTERN_RADIUS * Math.cos( degToRad(angle)) );
    ringGraphic.lineTo( CIRCLE_EXTERN_RADIUS * Math.sin(degToRad(angle)), -CIRCLE_EXTERN_RADIUS * Math.cos( degToRad(angle)) );
    
    ringGraphic.arc( 
        0,0,
        CIRCLE_EXTERN_RADIUS,
        degToRad(angle - 90),
        degToRad(-angle - 90),
        false
    );
    
    ringGraphic.lineTo( -CIRCLE_INTERN_RADIUS * Math.sin(degToRad(angle)), -CIRCLE_INTERN_RADIUS * Math.cos( degToRad(angle)) );
    
    ringGraphic.arc( 
        0,0,
        CIRCLE_INTERN_RADIUS,
        degToRad(-angle - 90),
        degToRad(angle - 90),
        true
    );
    
    ringGraphic.endStroke();
    ringGraphic.endFill();
    
    ringShape = new Shape(ringGraphic);
    ring.addChild( ringShape );
    
    // -------------------------------------------------------
    // -- date points
    // -------------------------------------------------------
    markerGraph = new Graphics();
    markerGraph.beginFill( "rgba(0,0,0,.4)" );
    markerGraph.drawCircle( 0, 0, 10 );
    
    var startAngle = angle + 10;
    var maxAngleDates = 360 - (startAngle * 2);
    var deltaAngleDates = maxAngleDates / (datas_len - 1);
    
    var markerShape;
    var mediumRadius = (CIRCLE_EXTERN_RADIUS + CIRCLE_INTERN_RADIUS) * .5;
    
    var px = 10 - ((datas_len * 20) + ((datas_len - 1) * 5)) * .5;
    var py = -(CIRCLE_EXTERN_RADIUS + 60);
    
    for( i = 0; i < datas_len; i++ )
    {
        markerShape = new Shape(markerGraph);
        
        //markerShape.x = mediumRadius * Math.sin( degToRad(startAngle + (deltaAngleDates * i)) );
        //markerShape.y = -mediumRadius * Math.cos( degToRad(startAngle + (deltaAngleDates * i)) );
        
        markerShape.x = px;
        markerShape.y = py;
        
        markerShapes[i] = markerShape;
        
        markerShape.name = "year_" + years[i].annee;
        markerShape.onClick = onClickHandler;
        
        markerShape.alpha = .3;
        
        ring.addChild( markerShape );
        
        px += 25;
    }
    
    // -------------------------------------------------------
    // -- values lines
    // -------------------------------------------------------
    var aShape;
    for( i = 0; i < nb_values; i++ )
    {
        linesShape[i] = new Shape( new Graphics() );
        
        aShape = new Shape( new Graphics() )
        aShape.name = "arc_" + i;
        aShape.onMouseOver = onOverHandler;
        aShape.onMouseOut = onOutHandler;
        
        arcsShape[i] = aShape;
        
        ring.addChild( linesShape[i] );
        ring.addChild( arcsShape[i] );
        
        drawLinesB[i] = false;
    }
    
    // -------------------------------------------------------
    // -- base lines
    // -------------------------------------------------------
    var lGraph;
    var lShape;
    
    for( i = 0; i < nb_values; i++ )
    {
        lGraph = new Graphics();
        lGraph.setStrokeStyle(1);
        lGraph.beginStroke( Graphics.getRGB( 0, 0, 0, .2 ) );
        lGraph.moveTo(0,0);
        lGraph.lineTo( 
            (CIRCLE_INTERN_RADIUS - 10) * Math.sin(degToRad(constVal[i].angle)), 
            -(CIRCLE_INTERN_RADIUS - 10) * Math.cos(degToRad(constVal[i].angle)) 
        );
        
        lShape = new Shape(lGraph);
        
        bLinesGraph[i] = lGraph;
        bLinesShape[i] = lShape;
        
        ring.addChild(lShape);
    }
    
    // -------------------------------------------------------
    // -- values points
    // -------------------------------------------------------
    var pGraph = new Graphics();
    pGraph.setStrokeStyle(3);
    pGraph.beginStroke( Graphics.getRGB( 255, 255, 255, .5 ) );
    pGraph.beginFill( "rgba(0,0,0,.25)" );
    pGraph.drawCircle( 0, 0, 5 );
    
    var pShape;
    
    for( i = 0; i < nb_values; i++ )
    {
        pShape = new Shape(pGraph);
        pShape.x = 0;
        pShape.y = 0;
        pShape.alpha = 0;
        
        pointsShape[i] = pShape;
        
        ring.addChild(pShape);
        
        vTweens[i] = Tween.get( pointsShape[i] );
    }
    
    // -------------------------------------------------------
    // -- mask point
    // -------------------------------------------------------
    var mGraph = new Graphics();
    mGraph.beginFill( "#333" );
    mGraph.drawCircle( 0, 0, 10 );
    
    ring.addChild( new Shape(mGraph) );
    
    // -------------------------------------------------------
    // -- tooltip
    // -------------------------------------------------------
    tooltip = new Container();
    tooltip.alpha = 0;
    ttLab = new Text("test", "bold 12px Arial", "#333");
    tooltip.addChild(ttLab);
    stage.addChild(tooltip);
    
    // -------------------------------------------------------
    // -- test first value
    // -------------------------------------------------------
    setYear(0);
    
    // -- init resize
    onResize();
}


// -- SET YEAR
// -----------------------------------------------------------
function setYear( id )
{
    var i;
    var toAlpha;
    
    // -- note
    for( i = 0; i < nb_circles; i++ )
    {
        if( i + 1 <= years[id].note )
        {
            toAlpha = 1;
            
        }
        else
        {
            toAlpha = .1;
        }
        
        if(ccShapes[i].alpha !== toAlpha)
        {
            var tween = Tween.get( ccShapes[i] ).to(
            {
                alpha:toAlpha
            }, 1000, Ease.quadOut );
        }
    }
    
    // -- values
    for( i = 0; i < nb_values; i++ )
    {
        setValue( i, years[id].values[i], true );
    }
    
    // -- date markers update
    if( currentSelected !== null ) currentSelected.alpha = .3;
    nextSelected = markerShapes[id];
    currentSelected = nextSelected;
    currentSelected.alpha = 1;
    nextSelected = null;
    
    // -- setCurrentID
    currentID = id;
}


// -- SET VALUE
// -----------------------------------------------------------
function setValue( id, val, ease )
{
    var pointShape = pointsShape[id];
    
    var percent = normalize( val, constVal[id].min, constVal[id].max );
    var vStrengh = percent * (CIRCLE_INTERN_RADIUS - 10);
    
    if( ease == false )
    {
        pointShape.x = vStrengh * Math.sin( degToRad(constVal[id].angle) );
        pointShape.y = -vStrengh * Math.cos( degToRad(constVal[id].angle) );
        
        redrawLine( id );
    }
    else
    {
        Tween.removeTweens( pointsShape[id] );
        
        var duration = 1000;
        
        drawLinesB[id] = true;
        
        vTweens[id] = Tween.get( pointsShape[id] ).to(
        {
            x:(vStrengh * Math.sin( degToRad(constVal[id].angle) )),
            y:(-vStrengh * Math.cos( degToRad(constVal[id].angle) ))
        }, duration, Ease.quadOut ).wait(duration).call(endDrawLine, [id]);
    }
}


// -- REDRAW LINE?
// -----------------------------------------------------------
function endDrawLine(id)
{
    drawLinesB[id] = false;
}


// -- REDRAW LINE
// -----------------------------------------------------------
function redrawLine( id )
{
    var point = pointsShape[id];
    
    var lineShape = linesShape[id];
    var lineGraph = lineShape.graphics;
    lineGraph.clear();
    
    var color = colors[id];
    
    var dist = Math.sqrt( Math.pow(point.x, 2) + Math.pow(point.y, 2) );
    
    lineGraph = new Graphics();
    lineGraph.setStrokeStyle( 1 );
    lineGraph.beginStroke( color );
    lineGraph.moveTo(0,0);
    lineGraph.lineTo( 
        dist * Math.sin(degToRad(constVal[id].angle)), 
        -dist * Math.cos(degToRad(constVal[id].angle)) 
    );
    
    lineShape.graphics = lineGraph;
    
    stage.update();
}


// -- REDRAW ARC
// -----------------------------------------------------------
function redrawArc( id )
{
    var point = pointsShape[id];
    
    var arcShape = arcsShape[id];
    var arcGraph = arcShape.graphics;
    arcGraph.clear();
    
    var color = colors[id];
    
    var dist = Math.sqrt( Math.pow(point.x, 2) + Math.pow(point.y, 2) );
    
    var nId = id + 1;
    if(nId >= nb_values) nId = 0;
    
    arcGraph = new Graphics();
    arcGraph.setStrokeStyle(1);
    arcGraph.beginStroke("rgba(0,0,0,0)");
    arcGraph.beginFill(color);
    arcGraph.moveTo(0,0);
    arcGraph.lineTo( 
        dist * Math.sin(degToRad(constVal[id].angle)), 
        -dist * Math.cos(degToRad(constVal[id].angle)) 
    );
    
    arcGraph.arc( 
        0,0,
        dist,
        degToRad(constVal[id].angle - 90),
        degToRad(constVal[nId].angle - 90),
        false
    );
    
    arcGraph.lineTo( 0, 0 );
    
    arcShape.graphics = arcGraph;
    
    stage.update();
}


// -- ON-CLICK MOUSE EVENT
// -----------------------------------------------------------
function onClickHandler(event)
{
    var clickedName = event.target.name;
    var reg = new RegExp("_", "g");
    var yearStr = clickedName.split(reg)[1];
    
    setYear( yearsId[yearStr] );
}


// -- ON-OVER MOUSE EVENT
// -----------------------------------------------------------
function onOverHandler(event)
{
    var targetName = event.target.name;
    var reg = new RegExp("_", "g");
    var id = targetName.split(reg)[1];
    
    ttLab.text = labelNames[id] + " " + years[currentID].values[id] + " " + labelUnits[id];
    
    tooltip.alpha = 1;
    ttVisible = true;
}


// -- ON-OUT MOUSE EVENT
// -----------------------------------------------------------
function onOutHandler(event)
{
    ttLab.text = "";
    
    tooltip.alpha = 0;
    ttVisible = false;
}


// -- UTIL :: deg to rad
// -----------------------------------------------------------
function degToRad( deg )
{
    return Math.PI * deg / 180;
}


// -- UTIL :: rad to deg
// -----------------------------------------------------------
function radToDeg( rad )
{
    return  rad * 180 / Math.PI;
}


// -- UTIL :: normalize
// -----------------------------------------------------------
function normalize(value, min, max)
{
    return (value - min) / (max - min);
}