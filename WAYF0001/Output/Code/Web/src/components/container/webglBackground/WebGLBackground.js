///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import async from 'async';
import { TweenMax, Linear } from 'gsap';
import * as THREE from 'three';

/// LOCAL ///
import { FRP } from '~/_utils/FRP.js';
import { DOM } from '~/_utils/DOM.js';
import { CSS } from '~/_utils/CSS.js';
import { LOG } from '~/_utils/LOG.js';

/// ASSETS ///
import sCSS from './WebGLBackground.css';


/////////////////
///// CLASS /////
/////////////////

class WebGLBackground extends HTMLElement {

  /// CONSTRUCTOR ///
  constructor(fCB) {
    super();

    async.parallel([
      function (fCB) { this.createDataStructures(fCB); }.bind(this),
      function (fCB) { this.createShadowDOM(fCB); }.bind(this),
    ], function (err, results) {

      this.__init(fCB);

    }.bind(this));
  };

  createDataStructures(fCB) {
    this.tweens = Object.create(null);
    this.oStreamListeners = Object.create(null);

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

  connectedCallback() {} ;
  disconnectedCallback() { this.destroy(); };


  ///////////////////////////
  ///// CLASS LIFECYCLE /////
  ///////////////////////////

  __init(fCB) {
    LOG.info('~/components/webglBackground/WebGLBackground :: __init');

    async.series([
      // As the CSS has been applied to the Shadow DOM we can start creating the WebGL environment.
      // NOTE: no need to wait on async loading of resources.
      function (callback) {
        this.createCanvas();
        this.createScene();
        this.createRenderer();
        this.createControls();
        this.createDomObservers();
        this.createBundledEntities();
        this.createHelpers();
        this.createBundledEntityTweens();
        this.createGui();
        this.createAnimationLoop();

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
      if (err) { return LOG.error(err); }
      // Now the resources have been loaded we can compute the methods that rely on them.
      this.createLoadedEntities();
      this.createLoadedEntityTweens();

      // this.handleRouterEvents();

      this.createEventStreams();

      // set intital sizes
      this.setElementSizes(window.innerWidth, window.innerHeight);

      LOG.info('~/components/webglBackground/WebGLBackground :: __init (complete)');
      fCB();

    }.bind(this));
  };

  destroy() {
    this.removeAnimationLoop();
    this.removeDomObservers();
    this.removeLoaders();
    this.removeTweens();
    this.removeGui();
    this.removeThree();
  };


  /////////////////////////
  ///// CLASS METHODS /////
  /////////////////////////

  createCanvas() {

    // We create a wrapper element as the canvas tag doesn't resize based on '%' stylings.
    this.domCanvasWrapper = DOM.create('div', { className: 'domCanvasWrapper' });
    DOM.append(this.domCanvasWrapper, this.shadow);

    this.domCanvas = DOM.create('canvas', { id: 'domCanvas', className: 'domCanvas' });
    this.domCanvasContext = this.domCanvas.getContext('webgl', { powerPreference: 'high-performance', preserveDrawingBuffer: true });
    DOM.append(this.domCanvas, this.domCanvasWrapper);
  };

  createScene() {
    this.scene = new THREE.Scene();
    // set the background color on the scene - NOT on the renderer
    // much more efficient easing
    this.scene.background = new THREE.Color(0xffffff); // white like the html
    // this.scene.background = new THREE.Color(0xff0000); // white like the html

    this.camera = new THREE.PerspectiveCamera(45, this.domCanvas.clientWidth / this.domCanvas.clientHeight, 1, 10000);
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
      alpha: false,
    });

    this.renderer.setSize(this.domCanvas.clientWidth, this.domCanvas.clientHeight);
    this.renderer.setPixelRatio(1.0);

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 0.18; // exposure / f-stop

    // LINK: https://threejs.org/examples/#webgl_lights_physical
    // LINK: https://github.com/mrdoob/three.js/blob/master/examples/webgl_lights_physical.html
    this.renderer.physicallyCorrectLights = true;

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  };

  createControls() {};

  createDomObservers() {

    // FRP.addStreamListener('window:onresize', { target: window, event: 'resize' }, function () {
    //   // LOG.info(window.innerWidth)
    //   // LOG.info(window.innerHeight)
    //   this.onWindowResize(window.innerWidth, window.innerHeight);
    // }.bind(this));

    // Handler to set size of the domCanvasWrapper and its domCanvas child
    // NOTE: We call this before creating the scene and camera to guarantee correct sizings.
    //       The ResizeObserver makes sure we handle subsequent resizes of the domCanvasWrapper.
    // this.canvasWrapperResizeObserver = new ResizeObserver(function (entries) {
    //   LOG.info(entries[0])
    //   // TODO: see if we can grab the values from the rezise observer
    //   this.onCanvasWrapperResize(entries[0].contentRect.width, entries[0].contentRect.height);

    //   LOG.warn(this.domCanvasWrapper.getClientRects())
    //   // this.onCanvasWrapperResize(window.innerWidth, window.innerHeight);

    // }.bind(this));

    // this.canvasWrapperResizeObserver.observe(this.domCanvasWrapper);
  };

  createBundledEntities() {};
  createBundledEntityTweens() {};
  loadResources(callback) { if (callback) callback(); };
  processResources(callback) { if (callback) callback(); };
  createLoadedEntities() {};
  createLoadedEntityTweens() {};
  createGui() {};
  createHelpers() {};

  createAnimationLoop() {
    this.renderer.setAnimationLoop(this.tick.bind(this));
  };

  tick() {
    // update renderer
    this.renderer.render(this.scene, this.camera);
  };


  //////////////////////////////
  ///// DOM EVENT HANDLERS /////
  //////////////////////////////

  setElementSizes(updatedWidth, updatedHeight) {
    // this.shadow.host['style'].width = updatedWidth + 'px';
    // this.shadow.host['style'].height = updatedHeight + 'px';

    this.domCanvasWrapper.style.width = updatedWidth + 'px';
    this.domCanvasWrapper.style.height = updatedHeight + 'px';

    this.renderer.setSize(updatedWidth, updatedHeight);

    this.camera.aspect = updatedWidth / updatedHeight;
    this.camera.updateProjectionMatrix();
  };

  // handleRouterEvents() {

  // FRP.addStreamListener('router:onNewPage', null, function(data) {
  //   this.updateBackgroundColor(data);
  // }.bind(this));
  // };

  // updateBackgroundColor(sPageName) {
  //   if (this.tweens['backgroundColor']) this.tweens['backgroundColor'].kill();

  //   // TODO: fix white bg color flash
  //   let oTargetColor;
  //   if (sPageName === 'home') { oTargetColor = new THREE.Color(0xfdfbf8); }
  //   else if (sPageName === 'the-veil') { oTargetColor = new THREE.Color(0xa08b68); }
  //   else if (sPageName === 'the-man-in-the-wall') { oTargetColor = new THREE.Color(0xa08b68); }
  //   else if (sPageName === 'another-world-awaits') { oTargetColor = new THREE.Color(0x000000); }
  //   else if (sPageName === '404') { oTargetColor = new THREE.Color(0xfdfbf8); };

  //   this.tweens['backgroundColor'] = TweenMax.to(this.scene.background, 3.000, {
  //     r: oTargetColor.r, g: oTargetColor.g, b: oTargetColor.b,
  //     ease: Linear.easeNone, onComplete: function () { },
  //   });

  createEventStreams() {

    /// WINDOW RESIZE ///
    this.oStreamListeners['window:onresize'] = FRP.createStreamListener('window:onresize', function () {
      this.setElementSizes(window.innerWidth, window.innerHeight);
    }.bind(this));

    /// WEBGLBACKGROUND CHANGE ///
    FRP.createStream('webglBackground:onchange');

    this.oStreamListeners['webglBackground:onchange'] = FRP.createStreamListener('webglBackground:onchange', function(data) {
      this.updateBackgroundColor(data);
    }.bind(this));
  };

  updateBackgroundColor(oOptions) {
    if (this.tweens['backgroundColor']) this.tweens['backgroundColor'].kill();

    const oTargetColor = new THREE.Color(oOptions.sColor);

    this.tweens['backgroundColor'] = TweenMax.to(this.scene.background, oOptions.nDuration, {
      r: oTargetColor.r, g: oTargetColor.g, b: oTargetColor.b,
      ease: Linear.easeNone, onComplete: function () { },
    });
  };


  ///////////////////
  ///// CLEANUP /////
  ///////////////////

  removeAnimationLoop() {
    this.renderer.setAnimationLoop(null);
  };

  removeDomObservers() {
    // this.canvasWrapperResizeObserver.unobserve(this.domCanvasWrapper);
    // this.canvasWrapperResizeObserver.disconnect();
  };

  removeTweens() {
    for (const tween in this.tweens) { this.tweens[tween].kill(); };
  };

  removeGui() {};


  removeLoaders() {};

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

customElements.define('theu0001-components-container-webglbackground', WebGLBackground);


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default WebGLBackground;


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
