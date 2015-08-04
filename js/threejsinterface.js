var renderer, scene, camera, actors, raycaster, target;
var mouse = {
    vector: null,
    x: 0,
    y: 0
}
var dragStart = {
    x: 0,
    y: 0
};
var togglables = [];
var MAX_SCALE = 2.7;
var MIN_SCALE = 0.2;
var INITIAL_VELOCITY = 0.5;
var drumPattern = [];
var textureFlare0 = THREE.ImageUtils.loadTexture( "media/img/lensflare0.png" );
var textureFlare2 = THREE.ImageUtils.loadTexture( "media/img/lensflare2.png" );
var textureFlare3 = THREE.ImageUtils.loadTexture( "media/img/lensflare3.png" );
var metronome = {
    mesh: null,
    move: function(xPos){
        var newX = xPos - 8;
        this.mesh.position.x = newX;
    }
};

function addMetronome(){
    metronome.mesh = new THREE.Object3D();

    // Here is the sphere
    var geometry = new THREE.SphereGeometry( 0.25 );
    var material = new THREE.MeshLambertMaterial( {
        color: 0xffffff
    });
    var sphere   = new THREE.Mesh( geometry, material );
    sphere.position.y = 2;
    metronome.mesh.add(sphere);

    var light = new THREE.PointLight( 0xffffff, 2, 2);
    light.position.z = 1;
    // light.position.y = 2;
    metronome.mesh.add(light);

    scene.add(metronome.mesh);
}

function init3DScene(){
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor( 0x000000, 1 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;

    raycaster = new THREE.Raycaster();
    mouse.vector = new THREE.Vector2();

    // $('canvas').mousedown(onMouseDown)
    document.addEventListener( 'mousedown', onMouseDown, false );
    document.addEventListener( 'mousemove', onMouseMove, false );
}

function addStar(index, x, y, instrument){

        var group = new THREE.Object3D()

        var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var material = new THREE.MeshLambertMaterial( {
            color: 0x00ff00,
            wireframe: true 
        });
        var cube = new THREE.Mesh( geometry, material );

        group.add( cube );

        togglables.push(cube);
        group.add( cube );

        group.position.x = x;
        group.position.y = y;

        group.userData = { 
            beatNumber: index,
            isActive: false,
            velocity: INITIAL_VELOCITY,
            instrument: instrument,
            type: "TOGGLABLE"
        };

        var scale = MAX_SCALE * INITIAL_VELOCITY;
        cube.scale.set( scale, scale, scale );

        scene.add( group );
        actors.push( group );
}

function initUI(){
    actors = [];
    var XPos = -8;

    for (var i = 0; i < 16; i++) {

        // closedhihat
        addStar(i, XPos, 1, "closedhihat");
        // snare
        addStar(i, XPos, 0, "snare");
        // kick
        addStar(i, XPos, -1, "kick");

        drumPattern.push({
            closedhihat: {
                isActive: false,
                velocity: INITIAL_VELOCITY
            },
            snare: {
                isActive: false,
                velocity: INITIAL_VELOCITY
            },
            kick: {
                isActive: false,
                velocity: INITIAL_VELOCITY
            }
        });

        XPos ++;
    };

    addMetronome();

    var ambientLight = new THREE.AmbientLight( 0x404040 );
    scene.add( ambientLight );   
}

function render(){
    requestAnimationFrame( render );

    /*for (var i = 0; i < actors.length; i++) {
        actors[i].rotation.x += 0.01
        actors[i].rotation.y += 0.01;
    };*/

    camera.position.y = ( -mouse.y * 2 + window.innerHeight ) / window.innerHeight;
    camera.position.x = ( -mouse.x * 2 + window.innerWidth ) / window.innerWidth;
    camera.lookAt( scene.position );

    renderer.render(scene, camera);
}

function getMouseCoords(){
    var vector = new THREE.Vector3();

    vector.set(
        ( event.clientX / window.innerWidth ) * 2 - 1,
        - ( event.clientY / window.innerHeight ) * 2 + 1,
        0.5 );

    vector.unproject( camera );

    var dir = vector.sub( camera.position ).normalize();

    var distance = - camera.position.z / dir.z;

    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    
    return {
        x: pos.x,
        y: pos.y
    }
}

function onMouseDown( event ) {
    event.preventDefault();

    mouse.vector.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    dragStart = getMouseCoords();

    raycaster.setFromCamera( mouse.vector, camera );

    var intersects = raycaster.intersectObjects( togglables, true );

    if ( intersects.length > 0 ) {

        target = intersects[0].object;

        if ( target.parent.userData.type == "TOGGLABLE" ) {
            mouse.isDown = true;
            // document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
        };
    }
}

function onMouseMove(event){
    if (mouse.isDown) {
        var currentDragPos = getMouseCoords();
        var yOffset = currentDragPos.y - dragStart.y; // Différence entre position y d'origine et de fin
        var xOffset = dragStart.x - currentDragPos.x; // Différence entre position x d'origine et de fin
        var offset  = yOffset + xOffset; // Différence moyenne entre les point d'origine et le point de fin
        var newScale = target.scale.x + offset/30;

        if (newScale <= MAX_SCALE && newScale >= MIN_SCALE) {

            var beatNumber = target.parent.userData.beatNumber;
            var instrument = target.parent.userData.instrument;
            
            drumPattern[beatNumber][instrument].velocity = newScale/MAX_SCALE; // On update le param velocity dans notre drumPattern

            target.scale.set( newScale, newScale, newScale); // On update la taille de l'objet 3D
        };    
    };

    mouse.y = event.clientY;
    mouse.x = event.clientX;
}

function onMouseUp(){
    mouse.vector.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    raycaster.setFromCamera( mouse.vector, camera );

    var intersects = raycaster.intersectObjects( togglables, true );

    if ( intersects.length > 0 ) {

        var target = intersects[0].object;

        if ( target.parent.userData.type == "TOGGLABLE" ) {
            if (target.parent.userData.isActive) {
                desactivateBeat( target )
            } else {
                activateBeat( target );
            }
        };
    }

    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener( 'mouseup', onMouseUp, false );
}

function activateBeat( target ){
    var beatNumber = target.parent.userData.beatNumber;
    var instrument = target.parent.userData.instrument;
    var velocity = target.parent.userData.velocity;

    drumPattern[beatNumber][instrument].isActive = !drumPattern[beatNumber][instrument].isActive;
    drumPattern[beatNumber][instrument].velocity = velocity;

    target.parent.userData.isActive = true;
    target.material.wireframe = false;

    // addLight(0.55, 0.9, 0.5, target.parent.position.x, target.parent.position.y, target.parent.position.z)
}

function desactivateBeat( target ){
    var beatNumber = target.parent.userData.beatNumber;
    var instrument = target.parent.userData.instrument;
    var velocity = target.parent.userData.velocity;

    drumPattern[beatNumber][instrument].isActive = !drumPattern[beatNumber][instrument].isActive;

    target.parent.userData.isActive = false;
    target.material.wireframe = true;
}

function init(){
    init3DScene();
    initUI();
    render();
}
init();