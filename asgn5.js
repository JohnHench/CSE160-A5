import * as THREE from './lib/three.module.js';
import {OrbitControls} from './lib/OrbitControls.js';
import {OBJLoader} from './lib/OBJLoader.js';
import {MTLLoader} from './lib/MTLLoader.js';

async function main() {
    // ----- SETUP -----
    const canvas = document.querySelector('#c');
    const renderer = initializeRenderer(canvas);

    // ----- CAMERA -----
    const camera = initializeCamera(canvas);

    const controls = new OrbitControls(camera, canvas);

    const scene = new THREE.Scene();
    
    initializeLight(scene);

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
    const color = 0xFFEAD0;
    const intensity = 0.2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(0, 0, 0);
    scene.add(light);
    scene.add(light.target);

    const aboveTreeLight = new THREE.DirectionalLight(color, intensity);
    aboveTreeLight.position.set(0, 20, 0); 
    aboveTreeLight.target.position.set(0, 0, 0);
    scene.add(aboveTreeLight);
    scene.add(aboveTreeLight.target);
}

function setupFloor(scene) {
    const groundSize = 40;

    const texture = new THREE.TextureLoader().load('./texture-grass-field.jpg');
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
            materialLoader.load('./models/Tree/Lowpoly_tree_sample.mtl', resolve, undefined, reject);
        });
        mtl.preload();

        for (const material of Object.values(mtl.materials)) {
            material.side = THREE.DoubleSide;
            // Apply texture here
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('./abstract-alien-metal_albedo.png');
            texture.encoding = THREE.sRGBEncoding;
            material.map = texture;
        }

        objLoader.setMaterials(mtl);

        const root = await new Promise((resolve, reject) => {
            objLoader.load('./models/Tree/Lowpoly_tree_sample.obj', resolve, undefined, reject);
        });

        root.scale.set(0.3, 0.3, 0.3);
        root.rotation.y = 135;
        root.position.set(4, 0.05, 0);
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
    createCube(scene, 1, -.9, 0);

    // LOG 2
    createCube(scene, -1, -.9, 0);

    // LOG 3
    createCube(scene, 0, -.9, 1, Math.PI / 2);

    // LOG 4
    createCube(scene, 0, -.9, -1, Math.PI / 2);

    // FIRE MODEL
    const geometry = new THREE.IcosahedronGeometry(1);
    const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(255/255, 55/255, 0/255) });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    cubes.push(mesh);
    scene.add(mesh);

    return cubes;
}

function createCube(scene, x, y, z, rotationZ = 0) {
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

function animateCubes(time, cubes) {
    cubes.forEach((cube, ndx) => {
        const speed = 5 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    });
}

main();