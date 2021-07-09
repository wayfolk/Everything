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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import {Pane} from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import * as CamerakitPlugin from '@tweakpane/plugin-camerakit';

/// LOCAL ///
import { FRP } from '~/_utils/FRP.js';
import { ENV } from '~/_utils/ENV.js';
import { DOM } from '~/_utils/DOM.js';
import { CSS } from '~/_utils/CSS.js';
import { LOG } from '~/_utils/LOG.js';

/// ASSETS CSS ///
import sCSS from './WebGL.css';

/// ASSETS WEBGL ///
// import home_LOD0 from './assets/home_LOD0.glb';
// import home_LOD1 from './assets/home_LOD1.glb';
// import theMainInTheWall_LOD0 from './assets/the-man-in-the-wall_LOD0.glb';
// import theMainInTheWall_LOD1 from './assets/the-man-in-the-wall_LOD1.glb';
// import theVeil_LOD0 from './assets/the-veil_LOD0.glb';
// import theVeil_LOD1 from './assets/the-veil_LOD1.glb';
// import anotherWorldAwaits_LOD0 from './assets/another-world-awaits_LOD0.glb';
// import anotherWorldAwaits_LOD1 from './assets/another-world-awaits_LOD1.glb';
import test_scene_0001 from './assets/test_scene_0001.glb';

/// SHADERS WEBGL ///
import reflectorFragment from './shaders/three/reflector/reflectorFragment.glsl';

// THREE Reflector shader override
Reflector['ReflectorShader'].fragmentShader = reflectorFragment;


/////////////////
///// CLASS /////
/////////////////

class WebGL extends HTMLElement {

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
    console.warn(ENV);
    this.env = Object.create(null);
    this.env.bIsMobile = ENV.getGPU().isMobile;
    this.env.nGPUTier = ENV.getGPU().tier;
    this.env.sGPU = ENV.getGPU().gpu;

    let num = null;
    this.env.bIsRecentAppleGPU = false;

    if (this.env.sGPU !== undefined) { // undefined through device emulation in chromium
      if (this.env.sGPU.includes('apple a')) {
        num = this.env.sGPU.replace(/[^0-9]/g,'');
        if (num >= 12) {
          this.env.bIsRecentAppleGPU = true;
        };
      };
    };

    fCB();
  };

  createDataStructures(fCB) {
    this.oDOMElements = Object.create(null);
    this.oComponentInstances = Object.create(null);
    this.oStreamListeners = Object.create(null);

    this.activePage = this.oOptions.sContent;

    this.resources = Object.create(null);
    this.entities = { meshes: Object.create(null), lights: Object.create(null), helpers: Object.create(null) };
    this.oTweens = Object.create(null);;
    this.oIntervals = Object.create(null);;
    this.mixer = null;

    this.fAnimateToPositionInterval = null;
    this.nAnimationToPositionCounter = 0;
    this.aPositions = new Array(Object.create(null), Object.create(null), Object.create(null));

    this.aPositions[0] = { camera: { fov: 20, posX: -60, posY: -65, posZ: 95 }, target: { posX: 0, posY: 0, posZ: 0 } };
    this.aPositions[1] = { camera: { fov: 20, posX: 100, posY: -6, posZ: 14 }, target: { posX: -9.5, posY: 2, posZ: 18.5 } };
    this.aPositions[2] = { camera: { fov: 20, posX: 0, posY: -75, posZ: 102 }, target: { posX: 0, posY: 11.5, posZ: 5.5 } };


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

  connectedCallback() {};
  disconnectedCallback() { this.destroy(); };


  ///////////////////////////
  ///// CLASS LIFECYCLE /////
  ///////////////////////////

  __init(fCB) {
    LOG.info('~/pages/_common/components/webgl/WebGL :: __init');

    async.series(
      [
        function (fCB) { this.createDomElements(fCB); }.bind(this),
        function (fCB) { this.createComponentInstances(fCB); }.bind(this),
        function (fCB) { this.createThree(fCB); }.bind(this),
        function (fCB) { this.loadResources(fCB); }.bind(this),
        function (fCB) { this.processResources(fCB); }.bind(this),
      ], function (err, results) {
        LOG.info('~/pages/_common/components/webgl/WebGL :: __init (complete)');
        if (err) { return LOG['error'](err); }

        // NOTE: here we check if we didn't end up here while we've already desotroyed this class
        // this can happen with the series running while navigating to antoher page
        // TODO: see if there's a more elegant way of doing this
        // can we break the series calls upon destroy?
        if (this.renderer === null) {
          this.destroy();
          return;
        };

        this.createLoadedEntities();
        this.createLoadedEntityTweens();
        this.createEventStreams();

        // set intital sizes
        this.setElementSizes(window.innerWidth, window.innerHeight);

        fCB();

      }.bind(this)
    );
  };

  destroy() {
    this.removeAnimationLoop();
    this.removeLoaders();
    this.removeTweens();
    this.removeEventStreams();
    this.removeIntervals();
    if (process.env.NODE_ENV === 'development' && !this.env.bIsMobile) this.removeGui();
    this.removeThree();

  };


  /////////////////////////
  ///// CLASS METHODS /////
  /////////////////////////


  createEventStreams() {

    /// WINDOW RESIZE ///
    this.oStreamListeners['window:onresize'] = FRP.createStreamListener('window:onresize', function () {
      this.setElementSizes(window.innerWidth, window.innerHeight);
    }.bind(this));

  };

  createDomElements(fCB) {
    // We create a wrapper element as the canvas tag doesn't resize based on '%' stylings.
    this.domCanvasWrapper = DOM.create('div', { className: 'domCanvasWrapper' });
    DOM.append(this.domCanvasWrapper, this.shadow);

    this.domCanvas = DOM.create('canvas', { id: 'domCanvas', className: 'domCanvas' });
    this.domCanvasContext = this.domCanvas.getContext('webgl', { powerPreference: 'high-performance', preserveDrawingBuffer: true });
    DOM.append(this.domCanvas, this.domCanvasWrapper);

    // TODO: move this to createDmomElements node
    // this.oDOMElements['domNavTEST'] = DOM.create('div', { className: 'domNavTEST' });
    this.domFilter = DOM.create('div', { className: 'domFilter' });
    DOM.append(this.domFilter, this.shadow);

    fCB();
  };

  createComponentInstances(fCB) { fCB(); };

  /// ANIMATE ///
  intro(fCB, nDelay) {
    if (nDelay === undefined) nDelay = 0.00;

    LOG.info('~/pages/_common/components/webgl/WebGL :: intro');

    this.createIntervals();

    this.camera.fov = this.aPositions[0].camera.fov;
    this.camera.updateProjectionMatrix();


    let sFilterColor, nFilterOpacity;
    if (this.activePage === 'home') {
      // sFilterColor = '#404040'; nFilterOpacity = 1.0;
      sFilterColor = '#191919'; nFilterOpacity = 1.0;
    } else if (this.activePage === 'the-veil') {
      sFilterColor = '#191919'; nFilterOpacity = 0.0;
    } else if (this.activePage === 'the-man-in-the-wall') {
      sFilterColor = '#191919'; nFilterOpacity = 0.0;
    } else if (this.activePage === 'another-world-awaits') {
      sFilterColor = '#191919'; nFilterOpacity = 0.0;
    };

    this.oTweens['domFilterIntro'] = TweenMax.to(this.domFilter, 5.000, {
      css: { backgroundColor: sFilterColor, opacity: nFilterOpacity }, delay: nDelay, ease: Linear.easeNone, onComplete: function () {}.bind(this),
    });


    // TODO : create a separate intro position (just for another world awaits ?)

    this.oTweens['cameraIntro'] = TweenMax.fromTo(this.camera.position, 2.000, {
      x: this.aPositions[0].camera.posX / 3, y: this.aPositions[0].camera.posY / 3, z: this.aPositions[0].camera.posZ / 3,
    }, {
      x: this.aPositions[0].camera.posX, y: this.aPositions[0].camera.posY, z: this.aPositions[0].camera.posZ,
      delay: nDelay, ease: Sine.easeOut, onComplete: function() {}.bind(this),
    });

    this.oTweens['domCanvasIntro'] = TweenMax.to(this.domCanvas, 2.000, {
      opacity: 1.0, delay: nDelay, ease: Linear.easeNone, onComplete: function() {
        LOG.info('~/pages/_common/components/webgl/WebGL :: intro (complete)');

        this.controls.enabled = true;

        fCB();
      }.bind(this),
    });
  };

  outro(fCB) {
    LOG.info('~/pages/_common/components/webgl/WebGL :: outro');

    this.controls.enabled = false;


    this.oTweens['domFilterOutro'] = TweenMax.to(this.domFilter, 1.000, {
      css: { opacity: 0.0 }, ease: Linear.easeNone, onComplete: function () { }.bind(this),
    });



    this.oTweens['cameraOutroX'] = TweenMax.to(this.camera.position, 2.000, {
      x: this.camera.position.x * 3, ease: Sine.easeIn, onComplete: function() {}.bind(this),
    });

    this.oTweens['cameraOutroY'] = TweenMax.to(this.camera.position, 2.000, {
      y: this.camera.position.y * 3, ease: Sine.easeIn, onComplete: function() {}.bind(this),
    });

    this.oTweens['cameraOutroZ'] = TweenMax.to(this.camera.position, 2.000, {
      z: this.camera.position.z * 3, ease: Sine.easeIn, onComplete: function() {}.bind(this),
    });

    this.oTweens['domCanvasOutro'] = TweenMax.to(this.domCanvas, 1.000, {
      opacity: 0.0, delay: 0.000, ease: Linear.easeNone, onComplete: function() {
        LOG.info('~/pages/_common/components/webgl/WebGL :: outro (complete)');

        setTimeout(function() { fCB(); }, 50); // slight extra delay before we proceed
      }.bind(this),
    });

  };

  animateToPosition(nPosition) {
    const stream = FRP.getStream('loader:onchange');
    stream('intro');

    // const targetX = this.aPositions[nPosition].target.posX;
    // const targetY = this.aPositions[nPosition].target.posY;
    // const targetZ = this.aPositions[nPosition].target.posZ;

    // this.controls.target.set(targetX, targetY, targetZ);

    this.controls.enabled = false;

    this.camera.fov = this.aPositions[nPosition].camera.fov;

    this.oTweens['controlsIntro'] = TweenMax.to(this.controls.target, 2.500, {
      x: this.aPositions[nPosition].target.posX, y: this.aPositions[nPosition].target.posY, z: this.aPositions[nPosition].target.posZ,
      ease: Sine.easeInOut, onComplete: function() {}.bind(this),
    });

    this.oTweens['cameraIntro'] = TweenMax.to(this.camera.position, 5.000, {
      x: this.aPositions[nPosition].camera.posX, y: this.aPositions[nPosition].camera.posY, z: this.aPositions[nPosition].camera.posZ,
      ease: Sine.easeInOut, onComplete: function() {

        const stream = FRP.getStream('loader:onchange');
        stream('outro');

        this.controls.enabled = true;

      }.bind(this),
    });
  };

  createThree(fCB) {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createBundledEntities();
    this.createBundledEntityTweens();
    if (process.env.NODE_ENV === 'development' && !this.env.bIsMobile) this.createHelpers();
    if (process.env.NODE_ENV === 'development' && !this.env.bIsMobile) this.createGui();
    this.createAnimationLoop();

    fCB();
  };

  createScene() {
    this.scene = new THREE.Scene();
  };

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.domCanvas.clientWidth / this.domCanvas.clientHeight, 1, 10000);
    this.camera.fov = 20;
    this.camera.position.set(0, 0, 0);

    this.camera.updateProjectionMatrix();
  };

  createRenderer() {
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

    // TODO : can we detect recent iPads specifically?
    // TODO : what does the M1 report?
    if (this.env.bIsMobile) {
      if (this.env.bIsRecentAppleGPU) {
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      } else {
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
      }
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


    console.warn('bIsMobile: ' + this.env.bIsMobile);
    console.warn('nGPUTier: ' + this.env.nGPUTier);
  };



  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.04;
    this.controls.zoomSpeed = 0.75;

    if (process.env.NODE_ENV === 'production') {
      this.controls.enablePan = false;
    };

    this.controls.enabled = false;
  };

  createBundledEntities() {

    // TODO: we need simpler mobile meshes
    // can we diff between ram size? ipad high end?

    // LINK: https://en.wikipedia.org/wiki/Lux
    // LINK: https://threejs.org/docs/#api/en/lights/shadows/LightShadow.bias

    if (this.activePage === 'home') {
      // this.entities.lights['pointLight'] = new THREE.PointLight(0xb9ace3, 50000.0, 500, 2.0);
      // this.entities.lights['pointLight'].position.set(20, 20, 20);

      // TODO: why does this add a massive GPU load? (shadows?)
      // this.entities.lights['pointLight2'] = new THREE.PointLight(0xa08b68, 5000.0, 500, 2.0);
      // this.entities.lights['pointLight2'].position.set(0, 10, 20);

    }
    // } else if (this.activePage === 'the-veil') {

    //   // TODO: this is _very_ heavy on mobile
    //   // can we make it work by tweaking the shader? or the model?
    //   if (!this.env.bIsMobile && this.env.nGPUTier > 1) {
    //     const mirrorGeometry = new THREE.PlaneGeometry(22.1, 29.1, 1, 1);
    //     const mirror = new Reflector(mirrorGeometry, {
    //       clipBias: 0.000001,
    //       textureWidth: 4096,
    //       textureHeight:4096,
    //       color:new THREE.Color(0x6e6e9b),
    //     });
    //     mirror.position.y = 1.66;
    //     mirror.position.z = 1.675;
    //     mirror.rotation.x = -0.006; // compensate for scene inaccuracy
    //     this.scene.add(mirror);
    //   };

    //   this.entities.lights['pointLight'] = new THREE.PointLight(0xb9ace3, 5000.0, 500, 2.0);
    //   this.entities.lights['pointLight'].position.set(20, 20, 10);

    // } else if (this.activePage === 'the-man-in-the-wall') {

    //   // TODO: this is _very_ heavy on mobile
    //   // can we make it work by tweaking the shader? or the model?
    //   if (!this.env.bIsMobile && this.env.nGPUTier > 1) {
    //     const mirrorGeometry = new THREE.PlaneGeometry(22.1, 29.1, 1, 1);
    //     const mirror = new Reflector(mirrorGeometry, {
    //       clipBias: 0.000001,
    //       textureWidth: 4096,
    //       textureHeight: 4096,
    //       color:new THREE.Color(0x6e6e9b),
    //     });
    //     mirror.position.y = 0.01;
    //     mirror.position.z = 0;
    //     mirror.rotation.x = - Math.PI / 2;
    //     this.scene.add(mirror);
    //   };

    //   this.entities.lights['pointLight'] = new THREE.PointLight(0xb9ace3, 2500.0, 500, 2.0);
    //   this.entities.lights['pointLight'].position.set(10, 10, 10);

    // } else if (this.activePage === 'another-world-awaits') {
    //   this.entities.lights['pointLight'] = new THREE.PointLight(0xffffff, 2500000.0, 500, 2.0);
    //   this.entities.lights['pointLight'].position.set(0, 150, 0);
    // };

    // TODO: this explodes on mobile (VRAM?)
    // reducing shadow res might work

    // this.entities.lights['pointLight'].castShadow = true;
    // this.entities.lights['pointLight'].shadow.bias = -0.0005;

    // if (!this.env.bIsMobile && this.env.nGPUTier > 1) {
    //   this.entities.lights['pointLight'].shadow.mapSize.width = 2048;
    //   this.entities.lights['pointLight'].shadow.mapSize.height = 2048;

    // } else {
    //   this.entities.lights['pointLight'].shadow.mapSize.width = 512;
    //   this.entities.lights['pointLight'].shadow.mapSize.height = 512;
    // };

    // this.entities.lights['pointLight'].updateMatrixWorld(true);
    // this.scene.add(this.entities.lights['pointLight']);
  };

  createBundledEntityTweens() {

    if (this.activePage === 'home') {

      // this.oTweens['pointLightPosition'] = TweenMax.fromTo(this.entities.lights['pointLight'].position, 10, {
      //   x: this.entities.lights['pointLight'].position.x,
      // }, { x: -20, repeat: -1, yoyo: true, ease: Sine.easeInOut, onComplete: function() {},
      // });

    }
    //  else if (this.activePage === 'the-veil') {

    //   this.oTweens['pointLightPosition'] = TweenMax.fromTo(this.entities.lights['pointLight'].position, 10, {
    //     x: this.entities.lights['pointLight'].position.x,
    //   }, { x: -20, repeat: -1, yoyo: true, ease: Sine.easeInOut, onComplete: function() {},
    //   });

    // } else if (this.activePage === 'the-man-in-the-wall') {

    //   this.oTweens['pointLightPosition'] = TweenMax.fromTo(this.entities.lights['pointLight'].position, 10, {
    //     x: this.entities.lights['pointLight'].position.x,
    //   }, { x: -10, repeat: -1, yoyo: true, ease: Sine.easeInOut, onComplete: function() {},
    //   });

    // } else if (this.activePage === 'another-world-awaits') {}
  };

  loadResources(fCB) {
    const resourceLoader = new ResourceLoader();
    const gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader(); // class scope reference so we can dispose it.
    this.dracoLoader.setDecoderPath('/static/draco/');
    this.dracoLoader.setWorkerLimit(10);
    this.dracoLoader.preload();
    gltfLoader.setDRACOLoader(this.dracoLoader);

    resourceLoader.add('glft_scene', test_scene_0001, { loadType: Resource.LOAD_TYPE.XHR, xhrType: Resource.XHR_RESPONSE_TYPE.BUFFER });

    resourceLoader.use(function(resource, next) {

      if (resource.extension === 'glb') {
        gltfLoader.parse(resource.data, '', function (gltf) {
          // console.log(gltf);
          this.resources[resource.name] = gltf;

          next();
        }.bind(this));
      }
    }.bind(this));

    resourceLoader.load(function(resourceLoader, resources) {
      fCB();
    }.bind(this));
  };

  processResources(fCB) {
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


    fCB();
  };

  createLoadedEntities() {
    // console.log(this.resources['glft_scene']);

    // TODO: store the camera(s) incl. 'default cam
    // TODO: switch between the cameras at will

    // cameras
    for (let i = 0; i < this.resources['glft_scene'].cameras.length; i++) {
      this.scene.add(this.resources['glft_scene'].cameras[i]);
    }


    for (let i = 0; i < this.resources['glft_scene'].scene.children.length; i++) {
      const element = this.resources['glft_scene'].scene.children[i];
      console.log(element);

      // meshes
      if (element.userData.type === 'mesh') {
        this.scene.add(this.resources['glft_scene'].scene.children[i]);
      }

      // pointLights
      else if (element.userData.type === 'pointLight') {
        this.entities.lights['pointLight'] = new THREE.PointLight(new THREE.Color(element.userData.color), element.userData.power, 500, 2.0);
        this.entities.lights['pointLight'].position.copy(element.position);
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
      }

    }

    console.log(this.scene);

  };

  createLoadedEntityTweens() {};

  createGui() {

    this.gui = new Pane();
    this.gui.registerPlugin(EssentialsPlugin);
    this.gui.registerPlugin(CamerakitPlugin);

    /// FPS ///
    this.gui_graph_fps = this.gui.addBlade({
      view: 'fpsgraph',
      label: 'fps',
      lineCount: 2,
    });


    /// RENDER SETTINGS ///
    const gui_folder_renderSettings = this.gui.addFolder({ title: 'Render Settings', expanded: true });

    this.gui_renderSettings = {
      pixelRatio :  this.renderer.getPixelRatio(),
      pauseRenderer : false,
    };

    gui_folder_renderSettings.addInput(this.gui_renderSettings, 'pixelRatio', {
      label: 'hidpi', min: 0.5, max: 5.0, step: 0.1 },
    ).on('change', function(e) {
      this.renderer.setPixelRatio(e.value);
    }.bind(this));

    gui_folder_renderSettings.addInput(this.gui_renderSettings, 'pauseRenderer', {
      label : 'pause' }
    ).on('change', function(e) {
      if (e.value === true) {
        this.controls.enabled = false;
        for (const tween in this.oTweens) { this.oTweens[tween].pause(); };
        this.renderer.setAnimationLoop(null);
      } else {
        this.controls.enabled = true;
        for (const tween in this.oTweens) { this.oTweens[tween].resume(); };
        this.renderer.setAnimationLoop(this.tick.bind(this));
      }
    }.bind(this));

    gui_folder_renderSettings.addButton({ title: 'grab framebuffer' }).on('click', function(e) {
      const dataURL = this.domCanvas.toDataURL('image/png');
      const newTab = window.open();
      newTab.document.body.style.margin = '0px';
      newTab.document.body.innerHTML = '<img src="'+ dataURL +'">';
    }.bind(this));


    /// CAMERA SETTINGS ///
    const gui_folder_cameraSettings = this.gui.addFolder({ title: 'Camera Settings', expanded: true });

    this.gui_cameraSettings = {
      camera_position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
      target_position: { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z },
      fov: this.camera.fov,
    };

    gui_folder_cameraSettings.addInput(this.gui_cameraSettings, 'camera_position', {
      label : 'pos', x: { min: -1000, max: 1000, step: 0.01 }, y: { min: -1000, max: 1000, step: 0.01 }, z: { min: -1000, max: 1000, step: 0.01 },
    });

    gui_folder_cameraSettings.addInput(this.gui_cameraSettings, 'target_position', {
      label : 'target', x: { min: -1000, max: 1000, step: 0.01 }, y: { min: -1000, max: 1000, step: 0.01 }, z: { min: -1000, max: 1000, step: 0.01 },
    });

    gui_folder_cameraSettings.addInput(this.gui_cameraSettings, 'fov', {
      label : 'fov', min: 1, max: 180, step: 0.01, view: 'cameraring', series: 1 },
    ).on('change', function(e) {
      this.camera.fov = e.value;
      this.camera.updateProjectionMatrix();
    }.bind(this));


    /// STUDIO SETTINGS ///
    const gui_folder_studioSettings = this.gui.addFolder({ title: 'Studio Settings', expanded: true });

    this.gui_studioSettings = {
      showHelpers : true,
    };

    gui_folder_studioSettings.addInput(this.gui_studioSettings, 'showHelpers', { label : 'helpers' }).on('change', function(e) {
      for (const helper in this.entities.helpers) {
        this.entities.helpers[helper].visible = e.value;
      }
    }.bind(this));
  };

  createHelpers() {
    this.entities.helpers['axesHelper'] = new THREE.AxesHelper(25);
    this.entities.helpers['axesHelper'].visible = true;
    this.scene.add(this.entities.helpers['axesHelper']);

    this.entities.helpers['gridHelper'] = new THREE.GridHelper(100, 10, 0x808080, 0x808080);
    this.entities.helpers['gridHelper'].position.y = 0;
    this.entities.helpers['gridHelper'].position.x = 0;
    this.entities.helpers['gridHelper'].visible = true;
    this.scene.add(this.entities.helpers['gridHelper']);

    this.entities.helpers['polarGridHelper'] = new THREE.PolarGridHelper(200, 16, 8, 64, 0x808080, 0x808080);
    this.entities.helpers['polarGridHelper'].position.y = 0;
    this.entities.helpers['polarGridHelper'].position.x = 0;
    this.entities.helpers['polarGridHelper'].visible = true;
    this.scene.add(this.entities.helpers['polarGridHelper']);

    // this.entities.helpers['pointLightHelper'] = new THREE.PointLightHelper(this.entities.lights['pointLight'], 1.0, 0x808080);
    // this.entities.helpers['pointLightHelper'].visible = false;
    // this.scene.add(this.entities.helpers['pointLightHelper']);
  };

  createAnimationLoop() {
    this.renderer.setAnimationLoop(this.tick.bind(this));
  };

  tick() {
    this.gui_graph_fps.begin();

    // LOG.info(this.camera.fov)
    // update controls
    this.controls.update();

    // update gui

    // console.log(this.bla);

    // this.bla.
    this.gui_cameraSettings.camera_position.x = this.camera.position.x;
    this.gui_cameraSettings.camera_position.y = this.camera.position.y;
    this.gui_cameraSettings.camera_position.z = this.camera.position.z;

    this.gui_cameraSettings.target_position.x = this.controls.target.x;
    this.gui_cameraSettings.target_position.y = this.controls.target.y;
    this.gui_cameraSettings.target_position.z = this.controls.target.z;
    // console.log(this.gui_cameraSettings.position.x);
    // update dat.gui
    // if (this.cameraSettingsOptions) this.cameraSettingsOptions.pos_x = this.camera.position.x;
    // if (this.cameraSettingsOptions) this.cameraSettingsOptions.pos_y = this.camera.position.y;
    // if (this.cameraSettingsOptions) this.cameraSettingsOptions.pos_z = this.camera.position.z;

    // if (this.controlsTargetOptions) this.controlsTargetOptions.x = this.controls.target.x;
    // if (this.controlsTargetOptions) this.controlsTargetOptions.y = this.controls.target.y;
    // if (this.controlsTargetOptions) this.controlsTargetOptions.z = this.controls.target.z;

    // update animations
    // const delta = this.clock.getDelta();
    // if (this.mixer !== null) this.mixer.update(delta);



    // update renderer
    this.renderer.render(this.scene, this.camera);

    this.gui_graph_fps.end();

    this.gui.refresh();
  };

  createIntervals() {
    this.oIntervals['animateToPositionInterval'] = setInterval(this.animateToPositionIntervallCall.bind(this), 30 * 1000);
  };

  animateToPositionIntervallCall() {
    this.nAnimationToPositionCounter++;
    if (this.nAnimationToPositionCounter > this.aPositions.length -1) { this.nAnimationToPositionCounter = 0; };
    this.animateToPosition(this.nAnimationToPositionCounter);
  };


  //////////////////////////////
  ///// DOM EVENT HANDLERS /////
  ////////////////////////////  //

  setElementSizes(updatedWidth, updatedHeight) {
    this.domCanvasWrapper.style.width = updatedWidth + 'px';
    this.domCanvasWrapper.style.height = updatedHeight + 'px';

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

    this.oTweens = null;
  };

  removeIntervals() {
    for (const interval in this.oIntervals) {
      clearInterval(this.oIntervals[interval]);
    };

    this.oIntervals = null;
  };

  removeEventStreams() {
    for (const stream in this.oStreamListeners) {
      FRP.destroyStreamListener(this.oStreamListeners[stream]);
      this.oStreamListeners[stream] = null;
    };

    this.oStreamListeners = null;
  };

  removeGui() {
    // this.gui['destroy']();
  };

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

customElements.define('theu0001-pages-_common-components-webgl', WebGL);


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default WebGL;


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
