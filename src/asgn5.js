import * as THREE from '../lib/three.module.js';
import {OrbitControls} from '../lib/OrbitControls.js';
import {OBJLoader} from '../lib/OBJLoader.js';
import {MTLLoader} from '../lib/MTLLoader.js';

async function main() {
    // ----- SETUP -----
    const canvas = document.querySelector('#c');
    const renderer = initializeRenderer(canvas);

    // ----- CAMERA -----
    const camera = initializeCamera(canvas);

    const controls = new OrbitControls(camera, canvas);

    const scene = new THREE.Scene();
    
    initializeLight(scene);

    function skyboxInit(scene) { 
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
        '../Textures/SkyBox/right.png',  // Positive X (right)
        '../Textures/SkyBox/left.png',   // Negative X (left)
        '../Textures/SkyBox/top.png',   // Positive Y (top)
        '../Textures/SkyBox/bottom.png',  // Negative Y (bottom)
        '../Textures/SkyBox/front.png',  //  Positive Z (front)
        '../Textures/SkyBox/back.png',    //  Negative Z (back)
        ]);
        scene.background = texture;
    }

    skyboxInit(scene);
    // ----- FLOOR SETUP -----
    setupFloor(scene);

    // ----- LOAD MODELS -----
    await loadModels(scene);

    // ----- CUBES -----
    const cubes = createCubes(scene);

    // ----- RESIZE RENDER -----
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    // ----- RENDER -----
    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        animateCubes(time, cubes);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function initializeRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
    });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    return renderer;
}

function initializeCamera(canvas) {
    const fov = 80;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 12, 30);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 12, 0);
    controls.update();
    return camera;
}

function initializeLight(scene) {
    const red = 0xf23030;
    const color = 0xFFEAD0;
    const intensity = .4;

    const spotlight = new THREE.SpotLight(0xff0000); // Red light
    spotlight.distance = 100;
    spotlight.angle = Math.PI / 16;
    //spotlight.penumbra = 1;
    spotlight.intensity = 1;
    spotlight.position.set(0, 10, 0); // 10 meters above the origin
    spotlight.target.position.set(0, 0, 0); // Point towards the origin
    scene.add(spotlight);
    scene.add(spotlight.target);
    const spotlightHelper = new THREE.SpotLightHelper(spotlight);
    scene.add(spotlightHelper);

    //Create a HemisphereLight
    const hemiLight = new THREE.HemisphereLight(color, 0x404040, intensity);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // Left Lamp Light
    const pointLight = new THREE.PointLight(0xebd234, 1); // color, intensity
    pointLight.position.set(-2, 5.5, 11); // Set position of the light
    scene.add(pointLight); // Add the light to the scene
    const pointLightHelper = new THREE.PointLightHelper(pointLight, 1); // Light, size of the helper
    scene.add(pointLightHelper); // Add helper to the scene

    // Right Lamp Light
    const pointLight2 = new THREE.PointLight(0xebd234, 1); // color, intensity
    pointLight2.position.set(2, 5.5, 11); // Set position of the light
    scene.add(pointLight2); // Add the light to the scene
    const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, 1); // Light, size of the helper
    scene.add(pointLightHelper2); // Add helper to the scene
}

function setupFloor(scene) {
    const groundSize = 40;

    const texture = new THREE.TextureLoader().load('../Textures/texture-grass-field.jpg');
    texture.encoding = THREE.sRGBEncoding;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.Filter = THREE.NearestFilter;
    const repeats = groundSize / 2;
    texture.repeat.set(repeats, repeats);

    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.receiveShadow = true;
    groundMesh.rotation.x = -Math.PI / 2;

    scene.add(groundMesh);
}

// Loads Tree model!
async function loadModels(scene) {
    const materialLoader = new MTLLoader();
    const objLoader = new OBJLoader();

    try {
        const mtl = await new Promise((resolve, reject) => {
            materialLoader.load('../models/Tree/Lowpoly_tree_sample.mtl', resolve, undefined, reject);
        });
        mtl.preload();

        for (const material of Object.values(mtl.materials)) {
            material.side = THREE.DoubleSide;
            // Apply texture here
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('../Textures/abstract-alien-metal_albedo.png');
            texture.encoding = THREE.sRGBEncoding;
            material.map = texture;
        }

        objLoader.setMaterials(mtl);

        const root = await new Promise((resolve, reject) => {
            objLoader.load('../models/Tree/Lowpoly_tree_sample.obj', resolve, undefined, reject);
        });

        root.scale.set(0.3, 0.3, 0.3);
        root.rotation.y = 135;
        root.position.set(10, 0.05, 13);
        scene.add(root);
    } catch (error) {
        console.error('Error loading model:', error);
    }


    try {
        const mtl = await new Promise((resolve, reject) => {
            materialLoader.load('../models/Lamp/rv_lamp_post_3.mtl', resolve, undefined, reject);
        });
        mtl.preload();

        // for (const material of Object.values(mtl.materials)) {
        //     material.side = THREE.DoubleSide;
        //     // Apply texture here
        //     const textureLoader = new THREE.TextureLoader();
        //     const texture = textureLoader.load('../Textures/abstract-alien-metal_albedo.png');
        //     texture.encoding = THREE.sRGBEncoding;
        //     material.map = texture;
        // }

        objLoader.setMaterials(mtl);

        const root = await new Promise((resolve, reject) => {
            objLoader.load('../models/Lamp/rv_lamp_post_3.obj', resolve, undefined, reject);
        });

        root.scale.set(0.3, 0.3, 0.3);
        root.rotation.y = Math.PI / 2;
        root.position.set(-2, 0.05, 11);
        scene.add(root);
    } catch (error) {
        console.error('Error loading model:', error);
    }

    try {
        const mtl = await new Promise((resolve, reject) => {
            materialLoader.load('../models/Lamp/rv_lamp_post_3.mtl', resolve, undefined, reject);
        });
        mtl.preload();

        // for (const material of Object.values(mtl.materials)) {
        //     material.side = THREE.DoubleSide;
        //     // Apply texture here
        //     const textureLoader = new THREE.TextureLoader();
        //     const texture = textureLoader.load('../Textures/abstract-alien-metal_albedo.png');
        //     texture.encoding = THREE.sRGBEncoding;
        //     material.map = texture;
        // }

        objLoader.setMaterials(mtl);

        const root = await new Promise((resolve, reject) => {
            objLoader.load('../models/Lamp/rv_lamp_post_3.obj', resolve, undefined, reject);
        });

        root.scale.set(0.3, 0.3, 0.3);
        root.rotation.y = Math.PI / 2;
        root.position.set(2, 0.05, 11);
        scene.add(root);
    } catch (error) {
        console.error('Error loading model:', error);
    }
}


function createCubes(scene) {
    const cubes = [];
    const cubeWidth = 6;
    const cubeHeight = 6;
    const cubeDepth = 6;

    // LOG 1
    createLog(scene, 1, -.9, 0);

    // LOG 2
    createLog(scene, -1, -.9, 0);

    // LOG 3
    createLog(scene, 0, -.9, 1, Math.PI / 2);

    // LOG 4
    createLog(scene, 0, -.9, -1, Math.PI / 2);

    // FIRE MODEL
    const geometry = new THREE.IcosahedronGeometry(1);
    const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(255/255, 55/255, 0/255) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    cubes.push(mesh);
    scene.add(mesh);

    // Path to fire
    createCube(scene, .6, -.4, 5, 1, "gray");
    createCube(scene, -0.6, -.4, 6, 1, "gray");
    createCube(scene, 0.6, -.4, 7, 1, "gray");
    
    createCube(scene, -0.6, -.4, 8, 1, "gray");
    createCube(scene, 0.6, -.4, 9, 1, "gray");
    createCube(scene, -0.6, -.4, 10, 1, "gray");

    createCube(scene, 0.6, -.4, 11, 1, "gray");
    createCube(scene, -0.6, -.4, 12, 1, "gray");
    createCube(scene, 0.6, -.4, 13, 1, "gray");


    // Wall Front and Back
    createCube(scene, -9, .5, 10, 2, "brown");
    createCube(scene, -9, .5, 10, 2, "brown");
    createCube(scene, 9, .5, 10, 2, "brown");
    createCube(scene, -9, .5, -10, 2, "brown");
    createCube(scene, 9, .5, -10, 2, "brown");

    // Wall Left and Right
    createCube(scene, 15.25, .5, 0, 3, "brown");
    createCube(scene, -15.25, .5, 0, 3, "brown");

    // Wall Posts Front
    createCube(scene, 2, .5, 10, 4, "brown");
    createCube(scene, -2, .5, 10, 4, "brown");

    // Wall Posts Back
    createCube(scene, 2, .5, -10, 4, "brown");
    createCube(scene, -2, .5, -10, 4, "brown");

    // Grave Head Stone Cylinder Part
    createCube(scene, -13, 1.75, -8, 5, "gray", Math.PI / 2, 0, 0);
    // Grave Head Stone Cube Part
    createCube(scene, -13, 1, -8, 6, "gray");
    // Grave
    createCube(scene, -13, -.9, -6, 7, "brown");

    // Grave Head Stone Cylinder Part
    createCube(scene, -10, 1.75, -8, 5, "gray", Math.PI / 2, 0, 0);
    // Grave Head Stone Cube Part
    createCube(scene, -10, 1, -8, 6, "gray");
    // Grave
    createCube(scene, -10, -.9, -6, 7, "brown");

    // Grave Head Stone Cylinder Part
    createCube(scene, -7, 1.75, -8, 5, "gray", Math.PI / 2, 0, 0);
    // Grave Head Stone Cube Part
    createCube(scene, -7, 1, -8, 6, "gray");
    // Grave
    createCube(scene, -7, -.9, -6, 7, "brown");



    return cubes;
}

function createLog(scene, x, y, z, rotationZ = 0) {
    const geometry = new THREE.CylinderGeometry(1, 1, 3, 20);
    const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(101/255, 67/255, 33/255) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI / 2; // Rotate 90 degrees around the x-axis
    mesh.rotation.z = rotationZ;
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

function createCube(scene, x, y, z, size, color, rotationX = 0, rotationY = 0,  rotationZ = 0) {
    const geometry = createGeometry(size);
    const material = createMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = rotationX;
    mesh.rotation.y = rotationY;
    mesh.rotation.z = rotationZ;
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

function createGeometry(size) {
    let geometry;
    switch (size) {
        // Cube for path
        case 1:
            geometry = new THREE.BoxGeometry(1, 1, 1);
            break;
        // Wall Front and back
        case 2:
            geometry = new THREE.BoxGeometry(13, 3, .5); 
            break;
        // Wall Left and Right
        case 3:
            geometry = new THREE.BoxGeometry(.5, 3, 20); 
            break;
        // Wall Posts 
        case 4:
            geometry = new THREE.BoxGeometry(1, 5, .8); 
            break;
        // Grave Head Stone Cylinder Part
        case 5:
            geometry = new THREE.CylinderGeometry(.75, .75, .25, 20);
            break;
        // Grave Head Stone Cube Part
        case 6:
            geometry = new THREE.BoxGeometry(1.5, 2.0, .255);
            break; 
        // Grave     
        case 7:
            geometry  = new THREE.BoxGeometry(2, 2.0, 3);
            break;
        // Add more cases for different sizes if needed
        default:
            geometry = new THREE.BoxGeometry(size, size, size);
            break;
    }
    return geometry;
}

function createMaterial(color) {
    let material;
    switch (color) {
        case "gray":
            material = new THREE.MeshPhongMaterial({ color: new THREE.Color(100/255, 107/255, 104/255) });
            break;
        case "brown":
            material = new THREE.MeshPhongMaterial({ color: new THREE.Color(10/255, 5/255, 0/255) });
            break;
        // Add more cases for different colors if needed
        default:
            material = new THREE.MeshPhongMaterial({ color: new THREE.Color(1, 1, 1) }); // Default white color
            break;
    }
    return material;
}

function animateCubes(time, cubes) {
    cubes.forEach((cube, ndx) => {
        const speed = 5 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    });
}

main();


