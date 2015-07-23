var renderer, scene, camera, actors, mouse, raycaster, target;
var dragStart = {
    x: 0,
    y: 0
};
var togglables = [];
var MAX_VEL = 2.7;
var MIN_VEL = 0.2;

function init3DScene(){
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    camera.position.z = 5;

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // $('canvas').mousedown(onMouseDown)
    document.addEventListener( 'mousedown', onMouseDown, false );
}

function initUI(){
    actors = [];
    var XPos = -8;

    for (var i = 0; i < 16; i++) {

        var group = new THREE.Object3D()

        var geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var material = new THREE.MeshBasicMaterial( {
            color: 0x00ff00,
            wireframe: true 
        });
        var cube = new THREE.Mesh( geometry, material );
        group.add( cube );

        /*geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        material = new THREE.MeshBasicMaterial( {
            color: 0x00ff00,
            opacity: 0.5,
            transparent: true
        });
        cube = new THREE.Mesh( geometry, material );
        cube.rotation.y = 90;
        cube.rotation.x = 90;*/

        togglables.push(cube);
        group.add( cube );

        group.position.x = XPos;
        group.position.y = 1;

        group.userData = { 
            beatNumber: i,
            isActive: false,
            velocity: 100,
            instrument: "closedhihat",
            type: "TOGGLABLE"
        };
        scene.add( group );
        actors.push( group );

        XPos ++;
    };
}

function render(){
    requestAnimationFrame( render );

    for (var i = 0; i < actors.length; i++) {
        actors[i].rotation.x += 0.01
        actors[i].rotation.y += 0.01;
    };

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

    mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    dragStart = getMouseCoords();

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( togglables, true );

    if ( intersects.length > 0 ) {

        target = intersects[0].object;

        if ( target.parent.userData.type == "TOGGLABLE" ) {
            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
        };
    }
}

function onMouseMove(){
    var currentDragPos = getMouseCoords();
    var yOffset = currentDragPos.y - dragStart.y; // Différence entre position y d'origine et de fin
    var xOffset = dragStart.x - currentDragPos.x; // Différence entre position x d'origine et de fin
    var offset  = yOffset + xOffset; // Différence moyenne entre les point d'origine et le point de fin

    var newVelocity = target.parent.userData.velocity + offset/10; // Divise offset par 10 pour réduire la sensibilité lors du drag

    if (newVelocity <= MAX_VEL && newVelocity >= MIN_VEL) {

        target.parent.userData.velocity = newVelocity; // On update le param velocity dans userData associé à l'objet 3D

        target.scale.set( newVelocity, newVelocity, newVelocity); // On update la taille de l'objet 3D
    };

    
}

function onMouseUp(){
    mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    raycaster.setFromCamera( mouse, camera );

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

    console.log(beatNumber);
    console.log(instrument);

    drumPattern[beatNumber][instrument].isActive = !drumPattern[beatNumber][instrument].isActive;
    drumPattern[beatNumber][instrument].velocity = velocity;

    target.parent.userData.isActive = true;
    target.material.wireframe = false;
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
    console.log(actors);
}
init();