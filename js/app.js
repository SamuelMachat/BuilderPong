/* global THREE */

window.onload = function () {
    var stats;

    // 3D objects
    var camera, controls, scene, panels, parent, playingItem_obj, playingItem, box, renderer, player1, player2, player1_obj, player2_obj;

    // main game variables
    var game_size = 1; // the scale of playgrond
    var box_size_x = 9.0;
    var box_size_y = 5.0;
    var box_size_z = 1 / game_size;
    var ground_size_z = 10;
    var hard = 0.7; // hardness of game from 0.0 to 1.0
    var game_speed = 0.04; // ball speed coeficient
    // environment
    var panel_size_x = 0.1 / game_size;
    var forkHeight = 0.1 / game_size;
    var forkThickness = 0.2 / game_size;
    var scale = 0.8 / game_size;
    var car_pos_y = 0;//- 0.1*box_size_z;
    // ball properties
    var speed = game_speed * game_size;
    var ball_size_y = 1;
    var playingItem_size_x = ball_size_y / game_size;
    var playingItem_size_y = playingItem_size_x / game_size;
    var rand = (Math.random() >= 0.5) ? 1 : -1; // 50:50 probability
    var dy = rand * speed / game_size;
    rand = (Math.random() >= 0.5) ? 1 : -1; // 50:50 probability
    var dx = rand * (speed + 0.01) / game_size;
    var coefRot = 10; // ball rotation coeficient
    // player properties
    var player_size_x = 1.0 / game_size;
    var player_size_y = 1.0 / game_size;
    var player1_speed = 0.1;
    var player2_speed = 0.1;
    var increment_speed_coef = 0.002; // the value by which the speed of playing item is increased
    var player1_points = 0;
    var player2_points = 0;
    var player1MoveCom = 0; // discribes what command player 1 gave to its object (-1 = move down; 0 = do not move; 1 = move up)
    var player2MoveCom = 0; // discribes what command player 2 gave to its object (-1 = move down; 0 = do not move; 1 = move up)
    var player1Move, player2Move; // discribe ehere the players will move
    var limit_y = box_size_y / 2 - player_size_y / 2 - forkHeight; // y movement limit
    var catchBallLimit = 0.4 / game_size; // tolerance of space to bing the ball
    var space_limit = playingItem_size_y / 1.8 / game_size;
    // AI
    var AIon = true;
    var fluent = false; // true means that the AI copies the y coordinate of the playing item
    var randCoef = (Math.random() - 0.5) * 2; //random coefficient that determines where the will go in case of random movement
    var goodStep = true; // determines if the next step of AI will be good or not (The first step in game is good.)
    var tolerance = 0.2 * (ball_size_y + player_size_y) / game_size; // discribes the tolerance of y position of AI player towards the y position of playing item
    var goodY = 0; // y coordinate of playing item
    var disPos = 0; // y coordinate where AI has to go if it does a bad step
    // sounds
    var bingSound = new Audio('sounds/bing.mp3');
    var bombSound = new Audio('sounds/bomb.mp3');
    var myAudio = new Audio('sounds/REGGAE.mp3');


    // starting menu
    if (confirm("Welcome to The Builder Pong!\nDo you want to play against AI?") === true) {
        AIon = true;
        dif = prompt("Set the difficulty.\nWrite down a number from 0.0 (easy) to 1.0 (hard).\nLeave blank for default.");
        if (dif >= 0 && dif <= 1) {
            hard = dif;
        }
    } else {
        AIon = false;
    }
    alert("The Builder Pong\nControls:\nPlayer 1: W - up, S - down\nPlayer2: up - up, down - down\nClick OK to begin the game.");
    // render
    init();
    // play
    animate();

    // handles keyUps
    function keyboard2(event) {
        this.keyCode = event.keyCode;
        if (keyCode === 38 || keyCode === 40) {
            player2MoveCom = 0;
        }
        if (keyCode === 87 || keyCode === 83) {
            player1MoveCom = 0;
        }
    }

    // handles keyDowns
    function keyboard(event) {
        this.keyCode = event.keyCode;
        if (keyCode === 87 && player1_obj.position.y <= limit_y) { // W key
            player1_obj.position.y += player1_speed;
            player1MoveCom = 1;
        }
        else if (keyCode === 83 && player1_obj.position.y >= -limit_y) { // S key
            player1_obj.position.y -= player1_speed;
            player1MoveCom = -1;
        }
        if (keyCode === 38 && player2_obj.position.y <= limit_y) { // up arrow
            player2_obj.position.y += player2_speed;
            player2MoveCom = 1;
        }
        else if (keyCode === 40 && player2_obj.position.y >= -limit_y) { // down arrow
            player2_obj.position.y -= player2_speed;
            player2MoveCom = -1;
        }
    }

    // rendera the beginning frame
    function init() {

        //camera settings
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 5.0;

        // mouse camera control settings
        controls = new THREE.TrackballControls(camera);
        controls.rotateSpeed = 4.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = false;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.keys = [65, 83, 68];
        controls.addEventListener('change', render);

        // Create scene hierarchy
        scene = new THREE.Scene();
        panels = new THREE.Object3D();
        parent = new THREE.Object3D();
        playingItem_obj = new THREE.Object3D();
        player1_obj = new THREE.Object3D();
        player2_obj = new THREE.Object3D();
        box = new THREE.Object3D();
        parent.add(playingItem_obj);
        parent.add(panels);
        parent.add(player1_obj);
        parent.add(player2_obj);
        scene.add(parent);
        var ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);

        // skybox
        var urlPrefix = "textures/arrakisday/";
        var urls = [
            urlPrefix + "front.png", urlPrefix + "back.png",
            urlPrefix + "up.png", urlPrefix + "down.png",
            urlPrefix + "right.png", urlPrefix + "left.png"
        ];
        var cubemap = THREE.ImageUtils.loadTextureCube(urls);
        cubemap.format = THREE.RGBFormat;
        var shader = THREE.ShaderLib["cube"];
        shader.uniforms["tCube"].value = cubemap;

        var material = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            depthWrite: true,
            side: THREE.DoubleSide
        });

        var skybox = new THREE.Mesh(new THREE.CubeGeometry(1000, 1000, 1000), material);
        scene.add(skybox);


        var onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% loaded');
            }
        };
        var onError = function (xhr) { };


        // Load forklifts from .obj and .mtl
        THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('models/forklift/');
        mtlLoader.load('VEHICLE_Forklift.mtl', function (materials) {

            materials.preload();

            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('models/forklift/');
            // player 1
            objLoader.load('forklift.obj', function (object) {
                angle = 90;
                var matrix = new THREE.Matrix4();
                matrix.makeRotationY(angle * (Math.PI / 180));
                object.applyMatrix(matrix);
                matrix.makeTranslation(object.position.x, object.position.y, object.position.z);
                object.applyMatrix(matrix);
                object.scale.x = scale;
                object.scale.y = scale;
                object.scale.z = scale;
                object.position.x = -(box_size_x / 2 + 2 * panel_size_x + 0.8 / game_size);
                object.position.y = (-box_size_y / 2 + car_pos_y);
                scene.add(object);

            }, onProgress, onError);
            // player 2
            objLoader.load('forklift.obj', function (object) {
                angle = 270;
                var matrix = new THREE.Matrix4();
                matrix.makeRotationY(angle * (Math.PI / 180));
                object.applyMatrix(matrix);
                matrix.makeTranslation(object.position.x, object.position.y, object.position.z);
                object.applyMatrix(matrix);
                object.scale.x = scale;
                object.scale.y = scale;
                object.scale.z = scale;
                object.position.x = (box_size_x / 2 + 2 * panel_size_x + 0.8 / game_size);
                object.position.y = (-box_size_y / 2 + car_pos_y);
                scene.add(object);

            }, onProgress, onError);

        });


        // initiate loader
        var texLoader = new THREE.TextureLoader();


        // Load forklift forks
        texLoader.load(
            // URL of texture
            'textures/iron2.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var fork_geometry = new THREE.CubeGeometry(player_size_x, forkHeight, forkThickness);
                var fork_material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                fork1 = new THREE.Mesh(fork_geometry, fork_material);
                fork1.position.x = -(box_size_x / 2 - player_size_x / 2);
                fork1.position.y = -player_size_y / 2 - forkHeight / 2;
                fork1.position.z = 0.3 * box_size_z;
                player1_obj.add(fork1);
                fork2 = new THREE.Mesh(fork_geometry, fork_material);
                fork2.position.x = -(box_size_x / 2 - player_size_x / 2);
                fork2.position.y = -player_size_y / 2 - forkHeight / 2;
                fork2.position.z = -0.3 * box_size_z;
                player1_obj.add(fork2);

                fork11 = new THREE.Mesh(fork_geometry, fork_material);
                fork11.position.x = (box_size_x / 2 - player_size_x / 2);
                fork11.position.y = -player_size_y / 2 - forkHeight / 2;
                fork11.position.z = 0.3 * box_size_z;
                player2_obj.add(fork11);
                fork21 = new THREE.Mesh(fork_geometry, fork_material);
                fork21.position.x = (box_size_x / 2 - player_size_x / 2);
                fork21.position.y = -player_size_y / 2 - forkHeight / 2;
                fork21.position.z = -0.3 * box_size_z;
                player2_obj.add(fork21);
            }, onProgress, onError
        );


        texLoader.load(
            // URL of texture
            'textures/iron2.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var panel_geometry = new THREE.CubeGeometry(panel_size_x, box_size_y, 0.2 * box_size_z);
                var panel_material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                var panel11 = new THREE.Mesh(panel_geometry, panel_material);
                panel11.position.x = -(box_size_x / 2 + panel_size_x / 2);
                panel11.position.z = 0.3 * box_size_z;
                panels.add(panel11);
                var panel12 = new THREE.Mesh(panel_geometry, panel_material);
                panel12.position.x = -(box_size_x / 2 + panel_size_x / 2);
                panel12.position.z = -0.3 * box_size_z;
                panels.add(panel12);

                var panel21 = new THREE.Mesh(panel_geometry, panel_material);
                panel21.position.x = (box_size_x / 2 + panel_size_x / 2);
                panel21.position.z = 0.3 * box_size_z;
                panels.add(panel21);
                var panel22 = new THREE.Mesh(panel_geometry, panel_material);
                panel22.position.x = (box_size_x / 2 + panel_size_x / 2);
                panel22.position.z = -0.3 * box_size_z;
                panels.add(panel22);
            }, onProgress, onError
        );


        // Load ground
        texLoader.load(
            // URL of texture
            'textures/ground.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var ground_geometry = new THREE.CubeGeometry(box_size_x + 2 * panel_size_x + ground_size_z, 0.1 * box_size_z, box_size_z + ground_size_z);
                var ground_material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                var ground = new THREE.Mesh(ground_geometry, ground_material);
                ground.position.y = (-box_size_y / 2 - panel_size_x / 2);
                panels.add(ground);
            }, onProgress, onError
        );


        // Load plank
        texLoader.load(
            // URL of texture
            'textures/plank.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var ground_geometry = new THREE.CubeGeometry(box_size_x + 2 * panel_size_x, 0.1 * box_size_z, box_size_z);
                var ground_material = new THREE.MeshBasicMaterial({
                    map: texture
                });
                var ground2 = new THREE.Mesh(ground_geometry, ground_material);
                ground2.position.y = (box_size_y / 2 + panel_size_x / 2);
                panels.add(ground2);
            }, onProgress, onError
        );



        // Load playing item
        texLoader.load(
            // URL of texture
            'textures/ball.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var radius = playingItem_size_x / 2,
                    segments = 10,
                    rings = 10;
                var playingItem_geometry = new THREE.SphereGeometry(radius, segments, rings);
                var tex_material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                playingItem = new THREE.Mesh(playingItem_geometry, tex_material);
                playingItem_obj.add(playingItem);
            }, onProgress, onError
        );


        // Load players' boxes
        texLoader.load(
            // URL of texture
            'textures/wood_texture_simple.png',
            // Function when resource is loaded
            function (texture) {
                // Create objects using texture
                var player_geometry = new THREE.CubeGeometry(player_size_x, player_size_y, box_size_z);

                var player_material = new THREE.MeshBasicMaterial({
                    map: texture
                });

                player1 = new THREE.Mesh(player_geometry, player_material);
                player1.position.x = -(box_size_x / 2 - player_size_x / 2);
                player1_obj.add(player1);

                player2 = new THREE.Mesh(player_geometry, player_material);
                player2.position.x = (box_size_x / 2 - player_size_x / 2);
                player2_obj.add(player2);
                render();
            }, onProgress, onError
        );


        // Display statistics of drawing to canvas
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        document.body.appendChild(stats.domElement);

        // renderer
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('keydown', keyboard, false);
        window.addEventListener('keyup', keyboard2, false);

        myAudio.addEventListener('ended', function () {
            this.currentTime = 0;
            this.play();
        }, false);
        myAudio.play();

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
        render();
    }

    // moves player to some position
    function playerGoTo(playerN, goodY) {
        if (fluent === false) {
            if (player2_obj.position.y < goodY - tolerance) {
                player2Move = 1;
                player2_obj.position.y += player2_speed;
            }
            else if (player2_obj.position.y > goodY + tolerance) {
                player2Move = -1;
                player2_obj.position.y -= player2_speed;
            }
            else {
                player2Move = 0;
            }
            if (player2_obj.position.y > limit_y) {
                player2_obj.position.y = limit_y;
            }
            else if (player2_obj.position.y < -limit_y) {
                player2_obj.position.y = - (limit_y);
            }
        }
        else {
            if (player2_obj.position.y <= limit_y && player2_obj.position.y >= - (limit_y)) {
                player2_obj.position.y = goodY;
            }
            player2_obj.position.y = goodY;
            if (player2_obj.position.y > limit_y) {
                player2_obj.position.y = limit_y;
            }
            else if (player2_obj.position.y < -limit_y) {
                player2_obj.position.y = - (limit_y);
            }
        }
    }

    function animate() {
        requestAnimationFrame(animate);
        // if object touches the top or the bottom border
        if (playingItem.position.y >= (box_size_y / 2 - playingItem_size_y / 2 - 0.005 * game_size) || playingItem.position.y <= -(box_size_y / 2 - playingItem_size_y / 2 - 0.005 * game_size)) {
            dy = -dy;
        };
        // AI movement
        if (AIon) {
            // if AI does not do mistakes
            if (hard === 1) {
                goodY = playingItem.position.y;
                playerGoTo(2, goodY);
            }
            else {
                // if the following step of AI is good
                if (goodStep) {
                    goodY = playingItem.position.y;
                    playerGoTo(2, goodY);
                }
                else {
                    disPos = randCoef * (box_size_y - 2 * player_size_y - forkHeight);
                    playerGoTo(2, disPos);
                }
            }

        }
        playingItem.position.y += dy;
        // if player 1 does not move over limits
        if (player1_obj.position.y <= limit_y && player1_obj.position.y >= -limit_y) {
            player1_obj.position.y += player1MoveCom * player1_speed;
            player1Move = true;
        }
        else {
            player1Move = false;
        }
        // if player 2 does not move over limits
        if (player2_obj.position.y <= limit_y && player2_obj.position.y >= -limit_y) {
            player2_obj.position.y += player2MoveCom * player2_speed;
            player2Move = true;
        }
        else {
            player2Move = false;
        }

        // if playing item reaches player 1 place
        if (playingItem_obj.position.x <= -(box_size_x / 2 - playingItem_size_x / 2 - player_size_x)) {
            dx = -dx;
            // if player 1 is looser
            if (playingItem.position.y > player1_obj.position.y + player_size_y / 2 + catchBallLimit * playingItem_size_y && box_size_y / 2 - (player1_obj.position.y + player_size_y / 2) > space_limit || playingItem.position.y < player1_obj.position.y - player_size_y / 2 - catchBallLimit * playingItem_size_y && box_size_y / 2 + (player1_obj.position.y - player_size_y / 2) > space_limit) {
                bombSound.play();
                player2_points += 1;
                alert("Bod pro hr��e �. 2\nSk�re: " + player1_points + " : " + player2_points);// + "\n" + playingItem.position.y + " " + player1_obj.position.y
                playingItem_obj.position.x = 0;
                playingItem.position.y = 0;
                rand = (Math.random() >= 0.5) ? 1 : -1;
                dy = rand * speed / game_size;
                dx = (speed + 0.01) / game_size;
            }
            else {
                bingSound.play();
                // reverse movement of playing item
                if (dx > 0) {
                    dx += increment_speed_coef;
                    dy = dy - coefRot * player1MoveCom * increment_speed_coef;
                    randCoef = (Math.random() - 0.5) * 2;
                }
                if (dx < 0) {
                    dx -= increment_speed_coef;
                    dy = dy - coefRot * player2MoveCom * increment_speed_coef;
                }

                if (dy > 0) dy += increment_speed_coef;
                if (dy < 0) dy -= increment_speed_coef;
            }
            goodStep = (Math.random() < hard) ? 1 : 0;

        }
        // if playing item reaches player 2 place
        else if (playingItem_obj.position.x >= (box_size_x / 2 - playingItem_size_x / 2 - player_size_x)) {
            dx = -dx;
            // if player 2 is looser
            if ((playingItem.position.y > player2_obj.position.y + player_size_y / 2 + catchBallLimit * playingItem_size_y && box_size_y / 2 - (player2_obj.position.y + player_size_y / 2) > space_limit) || (playingItem.position.y < player2_obj.position.y - player_size_y / 2 - catchBallLimit * playingItem_size_y && box_size_y / 2 + (player2_obj.position.y - player_size_y / 2) > space_limit)) {
                bombSound.play();
                player1_points += 1;
                alert("Bod pro hr��e �. 1\nSk�re: " + player1_points + " : " + player2_points);// + "\n" + playingItem.position.y + " " + player2_obj.position.y
                playingItem_obj.position.x = 0;
                playingItem.position.y = 0;
                rand = (Math.random() >= 0.5) ? 1 : -1;
                dy = rand * speed / game_size;
                dx = - (speed + 0.01) / game_size;
            }
            else {
                bingSound.play();
                // reverse movement of playing item
                if (dx > 0) {
                    dx += increment_speed_coef;
                    dy = dy - coefRot * player1MoveCom * increment_speed_coef;
                }
                if (dx < 0) {
                    dx -= increment_speed_coef;
                    dy = dy - coefRot * player2MoveCom * increment_speed_coef;
                }

                if (dy > 0) dy += increment_speed_coef;
                if (dy < 0) dy -= increment_speed_coef;
                randCoef = player2_obj.position.y / (box_size_y - 2 * player_size_y - forkHeight);
                goodStep = 0;
            }
        };
        playingItem_obj.position.x += dx;
        // Update position of camera
        controls.update();
        // Render scene
        render();
    }

    function render() {
        renderer.render(scene, camera);
        // Update draw statistics
        stats.update();
    }

};