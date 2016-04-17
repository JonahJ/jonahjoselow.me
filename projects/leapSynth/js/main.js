if (!Detector.webgl) Detector.addGetWebGLMessage();


var MIN_SECONDS_BETWEEN_NEW_OBJECT_CREATION = 1.5;
var container;
var stats;
var camera;
var controls;
var scene;
var renderer;
var cross;

var formed_objects = [];
var background_objects = [];
var lights = [];
var walkway_pieces = [];
var modifier = new THREE.DentModifier();
var projector = new THREE.Projector();

/**
 * Global Shapes
 */
var right_hand_sphere = null;
var left_hand_sphere = null;
var current_shape_being_formed = null;
var current_shape_camera = null;
var last_shape_formed = null;

var FORMED_SHAPE_RADIUS = 100;
var MAX_NUMBER_OF_OBJECTS_TO_SHAPE = 8;

/**
 * HTML
 */
var output = document.getElementById('output');
var progress = document.getElementById('progress');

/**
 * Walkway
 */
var WALKWAY_RADIUS = 1000;
var NUMBER_OF_WALKWAYS = 48;


/**
 * Walkway
 */
var last_piece_colored = 0;
var last_colored = moment();
var MIN_MILLISECONDS_WALKWAY_PIECE_LIT = 100;
var WALKWAY_REST_COLOR = 0x900000;

var WALKWAY_REST_COLORS = [
    0x000000,
    0x900000,
    // 0x009000,
    // 0x000090,
];
var WALKWAY_REST_COLOR_INDEX = 0;
var getWalkwayPieceColor = function() {
    return WALKWAY_REST_COLORS[WALKWAY_REST_COLOR_INDEX];
};

var WALKWAY_LIT_COLOR = 0xffff00;


/**
 * Audio
 */
var audioController = new AudioController();
var audio = new Audio();
var audio_url = 'http://api.soundcloud.com/tracks/169306457/stream?client_id=2400df97862fa2c06f486af524e4f974';

audio.src = audio_url;

var source = audioController.ctx.createMediaElementSource(audio);
source.connect(audioController.gain);



// var texture = THREE.ImageUtils.loadTexture('images/textures/2294472375_24a3b8ef46_o.jpg', new THREE.UVMapping(), function() {
init();
animate();
// });

function init() {
    // source.mediaElement.play();


    playBackgroundMusic();

    /**
     * Camera
     */
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.z = 1800;
    camera.position.y = 500;

    /**
     * Controls
     */
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [65, 83, 68];
    controls.addEventListener('change', render);


    scene = new THREE.Scene();


    /**
     * lights
     */

    // light = new THREE.DirectionalLight(0xffffff);
    // light.position.set(1, 1, 1);
    // scene.add(light);
    // light = new THREE.DirectionalLight(0x002288);
    // light.position.set(-1, -1, -1);
    // scene.add(light);
    // light = new THREE.AmbientLight(0x222222);
    // scene.add(light);

    scene.matrixAutoUpdate = false;

    /**
     * Renderer
     */
    renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    /**
     * Axis Help
     */
    // var axisHelper = new THREE.AxisHelper(1000);
    // scene.add(axisHelper);

    /**
     * Stats
     */
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    /**
     * Listeners
     */
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);


    var hand_sphere_geometry = new THREE.SphereGeometry(50, 50, 50);
    hand_sphere_geometry.mergeVertices();

    var material2 = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        // opacity: 0.6
    });
    right_hand_sphere = new THREE.Mesh(hand_sphere_geometry, material2);
    right_hand_sphere.castShadow = true;
    right_hand_sphere.receiveShadow = true;
    right_hand_sphere.name = "Right Hand";
    right_hand_sphere.visible = false;
    scene.add(right_hand_sphere);

    var material3 = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        // opacity: 0.6
    });
    left_hand_sphere = new THREE.Mesh(hand_sphere_geometry.clone(), material3);
    left_hand_sphere.castShadow = true;
    left_hand_sphere.receiveShadow = true;
    left_hand_sphere.name = "Left Hand";
    left_hand_sphere.visible = false;
    scene.add(left_hand_sphere);



    addShapeToForm();
    addBackgroundObjects();
    addWalkway();


    render();
}

function playBackgroundMusic() {
    var freq = T("pulse", {
        freq: 5,
        add: 5,
        mul: 200
    }).kr();

    T("sin", {
        freq: freq,
        mul: 0.5
    }).play();
}

function onDocumentMouseDown(event) {

    var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
    projector.unprojectVector(vector, camera);

    var raycaster = new THREE.Raycaster(
        camera.position, vector.sub(camera.position).normalize());

    var intersects = raycaster.intersectObjects([current_shape_being_formed]);

    if (intersects.length > 0) {

        var face = intersects[0].face; //intersects[ 0 ].point.show();
        var direction = new THREE.Vector3();
        direction.copy(face.normal);

        var obj = intersects[0].object;
        modifier.set(intersects[0].point, direction, 80, 0.5).modify(obj).update();

        // console.log("CLICK HIT", intersects[0]);

    }

    render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
}

function render() {


    for (var each_formed_object in formed_objects) {
        var this_formed_object = formed_objects[each_formed_object];
        this_formed_object.rotation.y += Math.PI / 180 * 0.3;
    }
    // current_shape_being_formed.rotation.y += Math.PI / 180 * 0.3;

    current_shape_being_formed.visible = false;
    current_shape_camera.updateCubeMap(renderer, scene);
    current_shape_being_formed.visible = true;

    for (var each_background_obj in background_objects) {
        var this_background_obj = each_background_obj[each_background_obj]
        this_background_obj.lookAt(current_shape_being_formed.position);
    }

    try {
        if (moment().diff(last_colored, 'milliseconds') > MIN_MILLISECONDS_WALKWAY_PIECE_LIT) {

            last_colored = moment();
            /**
             * Change color back of old
             */
            var last_piece_lit = walkway_pieces[last_piece_colored];
            last_piece_lit.material.color.setHex(getWalkwayPieceColor());

            /**
             * Increment and change color of new
             */
            last_piece_colored += 1;
            if (last_piece_colored > walkway_pieces.length - 1) {
                last_piece_colored = 0;

                WALKWAY_REST_COLOR_INDEX += 1;

                if (WALKWAY_REST_COLOR_INDEX > WALKWAY_REST_COLORS.length - 1) {
                    WALKWAY_REST_COLOR_INDEX = 0;
                }
            }

            var walkway_piece_to_change_color = walkway_pieces[last_piece_colored];
            walkway_piece_to_change_color.material.color.setHex(WALKWAY_LIT_COLOR);

            /**
             * Play Note if piece on index
             */
            try {
                walkway_piece_to_change_color.userData.formedShape.userData.playSound();
            } catch (err) {}
        }
    } catch (err) {}


    // var time = Date.now() * 0.0005;
    // light1.position.x = Math.sin( time * 0.7 ) * 30;
    //             light1.position.y = Math.cos( time * 0.5 ) * 40;
    //             light1.position.z = Math.cos( time * 0.3 ) * 30;
    renderer.render(scene, camera);

    stats.update();
}

function addBackgroundObjects() {
    var geometry = new THREE.Geometry();
    var points = hilbert3D(new THREE.Vector3(0, 0, 0), 200.0, 4, 0, 1, 2, 3, 4, 5, 6, 7);

    for (i = 0; i < points.length; i++) {

        geometry.vertices.push(points[i]);

    }


    // lines

    var line = null;
    var p = null;
    var scale = 0.3;
    var d = 125;
    var c1 = 0xff1000;
    var c2 = 0xff2222;
    var c3 = 0xff2800;
    var c4 = 0x222899;
    var g1 = geometry;
    var m1 = new THREE.LineBasicMaterial({
        color: c1,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    var m2 = new THREE.LineBasicMaterial({
        color: c2,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    var m3 = new THREE.LineBasicMaterial({
        color: c3,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    var m4 = new THREE.LineBasicMaterial({
        color: c4,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    var parameters = [
        // [m1, scale * 0.5, [0, 0, 0], g1],
        // [m2, scale * 0.5, [d, 0, 0], g1],
        // [m3, scale * 0.5, [-d, 0, 0], g1],
        // [m4, scale * 0.5, [0, d, 0], g1],
        // [m1, scale * 0.5, [d, d, 0], g1],
        // [m2, scale * 0.5, [-d, d, 0], g1],
        // [m3, scale * 0.5, [0, -d, 0], g1],
        // [m4, scale * 0.5, [d, -d, 0], g1],
        // [m1, scale * 0.5, [-d, -d, 0], g1],

        // [m2, scale * 0.5, [2 * d, 0, 0], g1],
        // [m3, scale * 0.5, [-2 * d, 0, 0], g1],
        // [m4, scale * 0.5, [2 * d, d, 0], g1],
        // [m1, scale * 0.5, [-2 * d, d, 0], g1],
        // [m2, scale * 0.5, [2 * d, -d, 0], g1],
        // [m3, scale * 0.5, [-2 * d, -d, 0], g1],


        // [m4, scale * 0.5, [0, 0, 0], g1],
        // [m1, scale * 0.5, [d, 0, 0], g1],
        [m2, scale * 0.5, [-d, 0, 0], g1],
        [m3, scale * 0.5, [0, d, 0], g1],
        [m4, scale * 0.5, [d, d, 0], g1],
        [m1, scale * 0.5, [-d, d, 0], g1],
        [m2, scale * 0.5, [0, -d, 0], g1],
        [m3, scale * 0.5, [d, -d, 0], g1],
        [m4, scale * 0.5, [-d, -d, 0], g1],

        [m1, scale * 0.5, [2 * d, 0, 0], g1],
        [m2, scale * 0.5, [-2 * d, 0, 0], g1],
        [m3, scale * 0.5, [2 * d, d, 0], g1],
        [m4, scale * 0.5, [-2 * d, d, 0], g1],
        [m1, scale * 0.5, [2 * d, -d, 0], g1],
        [m2, scale * 0.5, [-2 * d, -d, 0], g1],
    ];

    for (i = 0; i < parameters.length; i++) {

        p = parameters[i];

        line = new THREE.Line(p[3], p[0]);

        line.scale.x = line.scale.y = line.scale.z = p[1];

        line.position.x = p[2][0] * Math.cos(Math.PI * Math.random()) * 10;
        line.position.y = p[2][0] * Math.sin(Math.PI * Math.random()) * 10;
        line.position.z = p[2][0] * Math.cos(Math.PI * Math.random()) * 10;



        var light = new THREE.DirectionalLight(p[0], 0.5);

        // var mesh = new THREE.Mesh(geometry, material);
        // mesh.position.x = Math.cos(Math.PI * Math.random()) * 500;
        // mesh.position.y = Math.cos(Math.PI * Math.random()) * 500;
        // mesh.position.z = Math.cos(Math.PI * Math.random()) * 500;

        // mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 4 + 2;
        light.add(line);

        light.position.copy(line.position);
        // light.position.set(0,0,0);
        scene.add(light);
        lights.push(light);

        scene.add(line);

    }

    // var geometry = new THREE.SphereGeometry(5, 2, 2);
    // // geometry.applyMatrix(
    // //     new THREE.Matrix4().makeRotationFromEuler(
    // //         new THREE.Euler(Math.PI / 2, Math.PI, 0)
    // //     )
    // // );

    // var material = new THREE.MeshNormalMaterial();

    // // var sphere = new THREE.SphereGeometry(10, 5, 5);
    // // light1 = new THREE.PointLight(0xffff40, 200, 5000);
    // // // light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({
    // // //     color: 0xffff40
    // // // })));

    // // light1.intensity = 1;

    // // light1.position.set(600, 0, 0);
    // // scene.add(light1);

    // for (var i = 0; i < 200; i++) {

    //     var light = new THREE.DirectionalLight(0xff0000, 0.9);

    //     var mesh = new THREE.Mesh(geometry, material);
    //     mesh.position.x = Math.cos(Math.PI * Math.random()) * 500;
    //     mesh.position.y = Math.cos(Math.PI * Math.random()) * 500;
    //     mesh.position.z = Math.cos(Math.PI * Math.random()) * 500;

    //     mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 4 + 2;
    //     light.add(mesh);

    //     light.position.copy(mesh.position);
    //     // light.position.set(0,0,0);
    //     scene.add(light);
    //     lights.push(light);

    //     //     var spotlight = new THREE.PointLight(0xff0000, 1, 100);
    //     //     spotlight.position.set(500, 0, 0); //copy(mesh.position);
    //     //     // spotlight.lookAt(current_shape_being_formed.position);

    //     //     // spotlight.shadowCameraVisible = true;
    //     //     // spotlight.shadowDarkness = 0.70;
    //     //     // spotlight.intensity = 200;
    //     //     // spotlight.castShadow = true;
    //     //     scene.add(spotlight);



    //     //     // scene.add(mesh);
    //     //     background_objects.push(mesh);
    // }
}

function addShapeToForm() {

    if (formed_objects.length >= MAX_NUMBER_OF_OBJECTS_TO_SHAPE) {
        current_shape_being_formed = new THREE.Mesh(
            new THREE.SphereGeometry(FORMED_SHAPE_RADIUS, 25, 25),
            // new THREE.MeshPhongMaterial({
            //     envMap: current_shape_camera.renderTarget,
            //     reflectivity: 0.3
            // })
            //
            new THREE.MeshPhongMaterial({
                envMap: current_shape_camera.renderTarget,

                // ambient: 0x555555,
                // color: 0x555555,
                // specular: 0xffffff,
                // shininess: 50,
                shading: THREE.SmoothShading
            })

        );
        return;
    }

    current_shape_camera = new THREE.CubeCamera(0.1, 1000, 512);

    current_shape_camera.position.set(0, 0, 0);
    current_shape_camera.renderTarget.format = THREE.RGBAFormat;
    scene.add(current_shape_camera);

    current_shape_being_formed = new THREE.Mesh(
        new THREE.SphereGeometry(FORMED_SHAPE_RADIUS, 25, 25),
        // new THREE.MeshPhongMaterial({
        //     envMap: current_shape_camera.renderTarget,
        //     reflectivity: 0.3
        // })
        //
        new THREE.MeshPhongMaterial({
            envMap: current_shape_camera.renderTarget,

            // ambient: 0x555555,
            // color: 0x555555,
            // specular: 0xffffff,
            // shininess: 50,
            shading: THREE.SmoothShading
        })

    );
    current_shape_being_formed.position.set(0, 0, 0);
    current_shape_camera.position.copy(current_shape_being_formed.position);
    current_shape_being_formed.userData = {
        freq: 200,
        mul: 1.0,

    };
    scene.add(current_shape_being_formed);
    formed_objects.push(current_shape_being_formed);

    last_shape_formed = moment();
}

function addWalkway() {
    var material = new THREE.MeshBasicMaterial({
        color: 0x0000ff
    });

    var segments = 32

    var circleGeometry = new THREE.CircleGeometry(WALKWAY_RADIUS, segments);
    var circle = new THREE.Mesh(circleGeometry, material);

    circle.position.x = 0;
    circle.position.y = -1;
    circle.position.z = 0;

    circle.rotation.x = -Math.PI / 2;
    circle.rotation.y = 0;
    circle.rotation.z = 0;

    // scene.add(circle);

    var walkway_geometry = new THREE.BoxGeometry(50, 2, 100);
    var walkway_material = new THREE.MeshBasicMaterial({});

    walkway_material.color.setHex(getWalkwayPieceColor());

    for (var i = 0; i < NUMBER_OF_WALKWAYS; i++) {
        var walkway_piece = new THREE.Mesh(walkway_geometry.clone(), walkway_material.clone());
        walkway_piece.name = "walkway-piece-" + i.toString();

        walkway_piece.position.set(0, 200, 0);

        var angle = i * Math.PI * 2 / NUMBER_OF_WALKWAYS;

        walkway_piece.position.set(
            WALKWAY_RADIUS * Math.cos(angle),
            0,
            WALKWAY_RADIUS * Math.sin(angle)
        );

        walkway_piece.lookAt(current_shape_being_formed.position);
        scene.add(walkway_piece);
        walkway_pieces.push(walkway_piece);
    };
}

function moveFormedShape() {
    var index_to_move_to = formed_objects.length - 1;

    var index_of_walkway_ontop_of = (NUMBER_OF_WALKWAYS / MAX_NUMBER_OF_OBJECTS_TO_SHAPE * index_to_move_to);
    if (index_of_walkway_ontop_of > NUMBER_OF_WALKWAYS) {
        index_of_walkway_ontop_of = index_of_walkway_ontop_of - NUMBER_OF_WALKWAYS + NUMBER_OF_WALKWAYS / MAX_NUMBER_OF_OBJECTS_TO_SHAPE / 2;
    }

    var walkway_ontop_of = walkway_pieces[index_of_walkway_ontop_of];

    walkway_ontop_of.userData = {
        formedShape: current_shape_being_formed,
    };

    current_shape_being_formed.position.set(
        walkway_ontop_of.position.x,
        walkway_ontop_of.position.y + FORMED_SHAPE_RADIUS,
        walkway_ontop_of.position.z
    );


    var current_freq = current_shape_being_formed.userData.freq;
    var current_mul = current_shape_being_formed.userData.mul;

    current_shape_being_formed.userData.playSound = function() {
        var sine1 = T("sin", {
            freq:  200,
            mul: current_mul / 2,
        });
        var sine2 = T("sin", {
            freq: current_freq,
            mul: current_mul
        });

        T("perc", {
            r: 500
        }, sine1, sine2).on("ended", function() {
            this.pause();
        }).bang().play();
    };

    addShapeToForm();
}

Leap.loop(function(frame) {


    var hand, phalanx, point, length;
    if (frame.hands.length) {


        for (each_hand in frame.hands) {
            this_hand = frame.hands[each_hand];

            // console.log(this_hand.palmPosition);
            manipulateObject(this_hand);

        }

        // for (var vertexIndex = 0; vertexIndex < current_shape_being_formed.geometry.vertices.length; vertexIndex++) {
        //     var localVertex = current_shape_being_formed.geometry.vertices[vertexIndex];
        //     var globalVertex = localVertex.applyMatrix4(current_shape_being_formed.matrix);
        //     var directionVector = globalVertex.sub(current_shape_being_formed.position);
        //     console.log(directionVector.normalize());
        //     var ray = new THREE.Raycaster(originPoint, directionVector.normalize());
        //     var collisionResults = ray.intersectObjects(formed_objects);
        // }
    }
    render();
});

function manipulateObject(detected_hand) {
    hand_object = null;
    direction_multiply = 1;

    if (detected_hand.type == "right") {
        // console.log('right');

        hand_object = right_hand_sphere;
        direction_multiply = 1;

        current_shape_being_formed.userData.freq -= 20;
    } else if (detected_hand.type == "left") {
        // console.log('left');

        hand_object = left_hand_sphere;
        direction_multiply = -1;

        current_shape_being_formed.userData.mul -= 0.05;
    }
    hand_object.visible = true;

    var multiplier = 5;
    hand_object.position.set(
        (detected_hand.palmPosition[0]) * multiplier, (detected_hand.palmPosition[1] - 250) * multiplier, (detected_hand.palmPosition[2]) * multiplier
    );


    /**
     * Detect Intersections
     */
    var vector = new THREE.Vector3(hand_object.position.x, hand_object.position.y, hand_object.position.z);
    var raycaster = new THREE.Raycaster(
        camera.position,
        vector.sub(camera.position).normalize()
    );
    var intersects = raycaster.intersectObjects([current_shape_being_formed]);
    if (intersects.length > 0) {

        var face = intersects[0].face; //intersects[ 0 ].point.show();
        var direction = new THREE.Vector3();
        direction.copy(face.normal);

        // var obj = intersects[0].object;
        modifier.set(intersects[0].point, direction.multiplyScalar(direction_multiply), 60, 1.0).modify(current_shape_being_formed).update();

        // console.log("HIT", intersects[0]);
    }
}

Leap.loop({
    useAllPlugins: false,
    background: true
}, {
    hand: function(hand) {

        output.innerHTML = hand.pinchStrength.toPrecision(2);
        progress.style.width = hand.pinchStrength * 100 + '%';

        if (hand.pinchStrength.toPrecision(2) == 1.0) {

            if (moment().diff(last_shape_formed, 'seconds') > MIN_SECONDS_BETWEEN_NEW_OBJECT_CREATION) {
                // console.log("NEW SPHERE NEEDED");
                moveFormedShape();
            }
        }

    }
});

visualizeHand = function(controller) {
    controller.use('riggedHand', {
        scale: 0.3,
        boneColors: function(boneMesh, leapHand) {
            if ((boneMesh.name.indexOf('Finger_') == 0)) {
                if ((boneMesh.name.indexOf('Finger_0') == 0) || (boneMesh.name.indexOf('Finger_1') == 0)) {
                    return {
                        hue: 0.564,
                        saturation: leapHand.pinchStrength,
                        //saturation: leapHand.confidence,
                        lightness: 0.5,
                    }
                }
            }
        }
    })
}
visualizeHand(Leap.loopController)
