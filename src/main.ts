import {vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import Drawable from './rendering/gl/Drawable';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  'Shader'    : "Lambert",
  'Geometry'  : "Cube",
  'Color'     : [255, 0, 0]
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;
let prevColor = [1, 0, 0]

var time = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations);
  icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.add(controls, 'Load Scene');
  gui.add(controls, "Shader", ["Lambert", "Special"]);
  gui.add(controls, "Geometry", ["Cube", "Sphere", "Square"]);
  gui.addColor(controls, "Color");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);
  const steven = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/steven-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/steven-frag.glsl')),
  ]);
  lambert.setGeometryColor(vec4.fromValues(1, 0, 0, 1));
  steven.setGeometryColor(vec4.fromValues(1, 0, 0, 1));

  const shaders = new Map<string, ShaderProgram>()
  shaders.set("Lambert", lambert);
  shaders.set("Special", steven);

  const geometries = new Map<string, Drawable>();
  geometries.set("Cube", cube);
  geometries.set("Sphere", icosphere);
  geometries.set("Square", square);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    const currentShader = shaders.get(controls.Shader);
    const currentGeometry = geometries.get(controls.Geometry);

    if(controls.tesselations != prevTesselations) {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }

    var col = [0, 0, 0]
    for (var i = 0; i < 3; i++) {
        col[i] = controls["Color"][i] / 255.0
    }
    if (col[0] != prevColor[0] || col[1] != prevColor[1] || col[2] != prevColor[2]) {
        currentShader.setGeometryColor(vec4.fromValues(col[0], col[1], col[2], 1));
        prevColor = col;
    }

    const camDir = vec4.fromValues(
        camera.viewMatrix[2],
        camera.viewMatrix[6],
        camera.viewMatrix[10],
        0
    );
    currentShader.setCameraForward(camDir);
    currentShader.setTime(++time);

    renderer.render(camera, currentShader, [
        currentGeometry
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
