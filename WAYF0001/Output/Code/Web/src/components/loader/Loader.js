///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import async from 'async';
import { TweenMax, Linear, Sine } from 'gsap';
import { Loader as ResourceLoader, Resource } from 'resource-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

/// LOCAL ///
import { FRP } from '~/_utils/FRP.js';
import { ENV } from '~/_utils/ENV.js';
import { DOM } from '~/_utils/DOM.js';
import { CSS } from '~/_utils/CSS.js';
import { LOG } from '~/_utils/LOG.js';

/// ASSETS CSS ///
import sCSS from './Loader.css';

/// ASSETS WEBGL ///
import loader_LOD0 from './assets/loader_LOD0.glb';


/////////////////
///// CLASS /////
/////////////////

class Loader extends HTMLElement {

  /// CONSTRUCTOR ///
  constructor(oOptions, fCB) {
    super();

    this.oOptions = oOptions;

    async.parallel([
      function (fCB) { this.createEnvironment(fCB); }.bind(this),
      function (fCB) { this.createDataStructures(fCB); }.bind(this),
      function (fCB) { this.createShadowDOM(fCB); }.bind(this),
    ], function (err, results) {

      this.__init(fCB);

    }.bind(this));
  };

  createEnvironment(fCB) {
    this.env = Object.create(null);
    this.env.bIsMobile = ENV.getGPU().isMobile;
    this.env.nGPUTier = ENV.getGPU().tier;

    fCB();
  };

  createDataStructures(fCB) {
    this.oStreamListeners = Object.create(null);

    this.activePage = this.oOptions.sContent;

    this.resources = {};
    this.entities = {};
    this.entities.meshes = {};
    this.entities.lights = {};
    this.entities.helpers = {};

    this.mixer = null;

    this.oTweens = {};

    fCB();
  };

  createShadowDOM(fCB) {
    this.shadow = this.attachShadow({ mode: 'open' });

    const oCSSAssets = { sCSS: sCSS };
    const _css = CSS.createDomStyleElement(oCSSAssets);

    DOM.append(_css, this.shadow);

    fCB();
  };


  ///////////////////////////////////
  ///// WEB COMPONENT LIFECYCLE /////
  ///////////////////////////////////

  connectedCallback() { };
  disconnectedCallback() { this.destroy(); };

  ///////////////////////////
  ///// CLASS LIFECYCLE /////
  ///////////////////////////

  __init(fCB) {
    LOG.info('~/components/loader/Loader :: __init');

    async.series([
      // As the CSS has been applied to the Shadow DOM we can start creating the WebGL environment.
      // NOTE: no need to wait on async loading of resources.
      function (callback) {
        this.createCanvas();
        this.createScene();
        this.createRenderer();
        this.createControls();

        this.createBundledEntities();
        this.createBundledEntityTweens();
        if (process.env.NODE_ENV === 'development') this.createHelpers();
        if (process.env.NODE_ENV === 'development') this.createGui();
        this.createAnimationLoop();

        this.createEventStreams();

        callback();
      }.bind(this),

      // Async call for loading resources over XHR.
      function (callback) {
        this.loadResources(callback);
      }.bind(this),

      function (callback) {
        this.processResources(callback);
      }.bind(this),

    ], function (err, results) {
      if (err) { return LOG['error'](err); }
      // Now the resources have been loaded we can compute the methods that rely on them.
      this.createLoadedEntities();
      this.createLoadedEntityTweens();

      // TODO: rename this? move this?
      this.setElementSizes(100, 125);

      LOG.info('~/components/loader/Loader :: __init (complete)');
      fCB();

    }.bind(this));
  };

  destroy() {
    // TODO: replace with proper outro
    // this timeout prevents a white flash when we immediately remove the draw calls
    setTimeout(function () {
      this.removeAnimationLoop();
      this.removeLoaders();
      this.removeTweens();
      if (process.env.NODE_ENV === 'development') this.removeGui();
      this.removeThree();
    }.bind(this), 10);
  };


  /////////////////////////
  ///// CLASS METHODS /////
  /////////////////////////

  /// ANIMATE ///
  intro() {
    LOG.info('~/components/loader/Loader :: intro');

    // if (this.oTweens['sceneIntro']) this.oTweens['sceneIntro'].kill();
    // if (this.oTweens['sceneOutro']) this.oTweens['sceneOutro'].kill();

    // resume render loop
    for (const tween in this.oTweens) { this.oTweens[tween].resume(); };
    this.renderer.setAnimationLoop(this.tick.bind(this));

    this.oTweens['sceneIntro'] = TweenMax.to(this.domCanvas, 0.500, {
      opacity: 1.0, delay: 0.500, ease: Linear.easeNone, onComplete: function() {
        LOG.info('~/components/loader/Loader :: intro (complete)');
      }.bind(this),
    });
  };

  outro() {
    LOG.info('~/components/loader/Loader :: outro');

    // if (this.oTweens['sceneIntro']) this.oTweens['sceneIntro'].kill();
    // if (this.oTweens['sceneOutro']) this.oTweens['sceneOutro'].kill();

    this.oTweens['sceneOutro'] = TweenMax.to(this.domCanvas, 0.500, {
      opacity: 0.0, ease: Linear.easeNone, onComplete: function() {
        LOG.info('~/components/loader/Loader :: outro (complete)');

        // kill render loop
        for (const tween in this.oTweens) { this.oTweens[tween].pause(); };
        this.renderer.setAnimationLoop(null);
      }.bind(this),
    });
  };

  createCanvas() {
    // TODO: move this to an animation handler
    this.clock = new THREE.Clock();

    // We create a wrapper element as the canvas tag doesn't resize based on '%' stylings.
    this.domCanvasWrapper = DOM.create('div', { className: 'domCanvasWrapper' });
    DOM.append(this.domCanvasWrapper, this.shadow);

    this.domCanvas = DOM.create('canvas', { id: 'domCanvas', className: 'domCanvas' });
    this.domCanvasContext = this.domCanvas.getContext('webgl', { powerPreference: 'high-performance', preserveDrawingBuffer: true });
    DOM.append(this.domCanvas, this.domCanvasWrapper);
  };

  createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.domCanvas.clientWidth / this.domCanvas.clientHeight, 1, 10000);

    this.camera.fov = 20;
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 150;

    this.camera.updateProjectionMatrix();
  };

  createRenderer() {
    // Our main renderer.
    // NOTE: We don't utilise the THREE.EffectComposer as we're not planning on any postprocessing effects.
    //       We'll stick to material shader effects and skip the overhead of the composor chain.
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.domCanvas,
      context: this.domCanvasContext,
      antialias: false,
      alpha: true,
    });

    this.renderer.setSize(this.domCanvas.clientWidth, this.domCanvas.clientHeight);

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 0.18; // exposure / f-stop

    // LINK: https://threejs.org/examples/#webgl_lights_physical
    // LINK: https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_physical.html
    this.renderer.physicallyCorrectLights = true;
    this.renderer.shadowMap.enabled = true;


    if (this.env.bIsMobile) {

      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.type = THREE.PCFShadowMap ;

    } else if (this.env.nGPUTier === 1) { // tier 1 GPUs (intel integrated etc)

      this.renderer.setPixelRatio(0.8);
      this.renderer.shadowMap.type = THREE.BasicShadowMap;

    } else if (this.env.nGPUTier === 2) {

      this.renderer.setPixelRatio(1.0);
      this.renderer.shadowMap.type = THREE.PCFShadowMap;

    } else { // high end || anything outside the spec but hitting decent fps

      this.renderer.setPixelRatio(1.5);
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    };

  };

  createControls() {};

  // createDomObservers() {

  //   this.onWindowResize(100, 125);

  //   // Handler to set size of the domCanvasWrapper and its domCanvas child
  //   // NOTE: We call this before creating the scene and camera to guarantee correct sizings.
  //   //       The ResizeObserver makes sure we handle subsequent resizes of the domCanvasWrapper.
  //   // this.canvasWrapperResizeObserver = new ResizeObserver(function (entries) {
  //   //   this.onCanvasWrapperResize(entries[0].contentRect.width, entries[0].contentRect.height);
  //   // }.bind(this));

  //   // this.canvasWrapperResizeObserver.observe(this.domCanvasWrapper);
  // };

  createBundledEntities() {
    // LINK: https://en.wikipedia.org/wiki/Lux
    // LINK: https://threejs.org/docs/#api/en/lights/shadows/LightShadow.bias


    this.entities.lights['pointLight'] = new THREE.PointLight(0xc4c4f5, 50000.0, 500, 2.0);
    this.entities.lights['pointLight'].position.set(20, 20, 20);

    this.entities.lights['pointLight'].castShadow = true;
    this.entities.lights['pointLight'].shadow.bias = -0.0005;

    if (!this.env.bIsMobile && this.env.nGPUTier > 1) {
      this.entities.lights['pointLight'].shadow.mapSize.width = 2048;
      this.entities.lights['pointLight'].shadow.mapSize.height = 2048;
    } else {
      this.entities.lights['pointLight'].shadow.mapSize.width = 512;
      this.entities.lights['pointLight'].shadow.mapSize.height = 512;
    };

    this.entities.lights['pointLight'].updateMatrixWorld(true);
    this.scene.add(this.entities.lights['pointLight']);
  };

  createBundledEntityTweens() {


    this.oTweens['pointLightPosition'] = TweenMax.fromTo(this.entities.lights['pointLight'].position, 10, {
      x: this.entities.lights['pointLight'].position.x,
    }, {
      x: -20,
      repeat: -1, yoyo: true, ease: Sine.easeInOut, onComplete: function() {},
    });

  };

  loadResources(callback) {
    const resourceLoader = new ResourceLoader();
    const gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader(); // class scope reference so we can dispose it.
    this.dracoLoader.setDecoderPath('/static/draco/');
    this.dracoLoader.setWorkerLimit(10);
    this.dracoLoader.preload();
    gltfLoader.setDRACOLoader(this.dracoLoader);


    resourceLoader.add('glft_scene', loader_LOD0, { loadType: Resource.LOAD_TYPE.XHR, xhrType: Resource.XHR_RESPONSE_TYPE.BUFFER });


    resourceLoader.use(function (resource, next) {

      if (resource.extension === 'glb') {
        gltfLoader.parse(resource.data, '', function (gltf) {
          this.resources[resource.name] = gltf;

          next();
        }.bind(this));
      }
    }.bind(this));

    resourceLoader.load(function (resourceLoader, resources) {
      if (callback) callback();
    }.bind(this));
  };

  processResources(callback) {
    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();

    for (const resource in this.resources) {

      this.resources[resource].scene.traverse(function (resource) {
        // set mesh interpretation
        if (resource.isMesh) {
          resource.castShadow = true;
          resource.receiveShadow = true;

          // set texture map interpretation
          if (resource.material.map !== null) {
            resource.material.map.anisotropy = maxAnisotropy;
          };
        };
      }.bind(this));
    };

    callback();
  };

  createLoadedEntities() {
    this.scene.add(this.resources['glft_scene'].scene);
  };

  createLoadedEntityTweens() {};

  createGui() {};

  createHelpers() {};

  createAnimationLoop() {
    this.renderer.setAnimationLoop(this.tick.bind(this));
  };

  tick() {
    this.scene.rotation.y = this.scene.rotation.y + 0.035;

    // update animations
    const delta = this.clock.getDelta();
    if (this.mixer !== null) this.mixer.update(delta);

    // update renderer
    this.renderer.render(this.scene, this.camera);
  };


  //////////////////////////
  ///// EVENT HANDLERS /////
  //////////////////////////

  createEventStreams() {

    /// LOADER CHANGE ///
    FRP.createStream('loader:onchange');
    this.oStreamListeners['loader:onchange'] = FRP.createStreamListener('loader:onchange', function(data) {
      if (data === 'intro') { this.intro(); }
      else if (data === 'outro') { this.outro(); }

    }.bind(this));
  };


  //////////////////////////////
  ///// DOM EVENT HANDLERS /////
  //////////////////////////////

  setElementSizes(updatedWidth, updatedHeight) {
    this.domCanvas.style.width = updatedWidth + 'px';
    this.domCanvas.style.height = updatedHeight + 'px';

    this.renderer.setSize(updatedWidth, updatedHeight);

    this.camera.aspect = updatedWidth / updatedHeight;
    this.camera.updateProjectionMatrix();
  };


  ///////////////////
  ///// CLEANUP /////
  ///////////////////

  removeAnimationLoop() {
    this.renderer.setAnimationLoop(null);
  };

  removeTweens() {
    for (const tween in this.oTweens) { this.oTweens[tween].kill(); };
  };

  removeGui() {};

  removeLoaders() {
    this.dracoLoader.dispose();
  };

  removeThree() {
    const disposeMaterial = function(oMaterial) {
      for (const key of Object.keys(oMaterial)) {
        const value = oMaterial[key];
        if (value && typeof value === 'object' && 'minFilter' in value) { value.dispose(); } // texture
      };

      oMaterial.dispose();
    };

    if (this.scene) {

      this.scene.traverse(function(oChild) {
        if (oChild instanceof THREE.Mesh) {
          if (oChild.geometry) { oChild.geometry.dispose(); };
          if (oChild.material instanceof THREE.Material) { disposeMaterial(oChild.material); }
          else if (typeof oChild.material === 'object') {
            for (const material of oChild.material) disposeMaterial(material);
          };
        };
      });

      this.renderer.dispose();
      this.scene = null;
      this.camera = null;
      this.renderer = null;
    };
  };
};


////////////////////////////////////
///// WEB COMPONENT DEFINITION /////
////////////////////////////////////

customElements.define('theu0001-components-loader', Loader);


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default Loader;


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
//////////////////////////.        /////////////////////////
/////////////////////     .      ..  ...////////////////////
///////////////////    ..  .   ....    .  ./////////////////
//////////////////        . .  . ...  . ... ////////////////
/////////////////     ...................   ////////////////
/////////////////  .(,(/.%,.*%#&&&.//....   ////////////////
/////////////////  .***/..*,*/%,%%#%*/(/(. ,* //////////////
////////////////( ******  #%#((&%%*&///%%*..(.//////////////
/////////////////(/,((//**&.*,%%(*//.**##, .#(//////////////
///////////////( .(,**....* ...,*,,,%&,((*.* .//////////////
///////////////( . **..(*#/ %%%%#,*##,..*%,,.///////////////
////////////////(.,#/%#%%,#(%#(/&&(%,(.//#,..///////////////
//////////////////(,,/*#(.#/ /(&..%/&/(*(.//////////////////
///////////////////( ***#     .,.,/&%%%*.///////////////////
////////////////////(./,/*,,.,&*(((%%(/ ////////////////////
///////////////////////**.*.*//##.*,,,//////////////////////
///////////////////////  ,*%%/@//(*   ./////////////////////
//////////////////////                 /////////////////////
////////////////////                     ///////////////////
//////////////// . ... .. ..    ...    .. .. ///////////////
////....................................................////
