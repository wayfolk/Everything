///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import async from 'async';

/// LOCAL ///
import { DOM } from '~/_utils/DOM.js';
import { CSS } from '~/_utils/CSS.js';
import { LOG } from '~/_utils/LOG.js';

import WebGLBackground from './webglBackground/WebGLBackground.js';

/// ASSETS CSS ///
import sCSS from './Container.css';
import { FRP } from '~/_utils/FRP.js';


/////////////////
///// CLASS /////
/////////////////

class Container extends HTMLElement  {

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
    this.oDOMElements = Object.create(null);
    this.oComponentInstances = Object.create(null);

    fCB();
  };

  createShadowDOM(fCB) {
    this.shadow = this.attachShadow({ mode: 'open' });

    const oCSSAssets = { sCSS: sCSS };
    const _css = CSS.createDomStyleElement(oCSSAssets);

    // TODO: do this elegantly
    // TODO: handle resizes
    // TODO: handle min-sizes

    // controls the page size


    DOM.append(_css, this.shadow);

    fCB();
  };


  ///////////////////////////////////
  ///// WEB COMPONENT LIFECYCLE /////
  ///////////////////////////////////

  connectedCallback() { };
  disconnectedCallback() { this.__del(); };


  ///////////////////////////
  ///// CLASS LIFECYCLE /////
  ///////////////////////////

  // triggered by the web component connectedCallback
  // we're attached to the DOM at this point
  __init(fCB) {
    LOG.info('~/components/container/Container :: __init');

    async.series([
      function (fCB) { this.createDomElements(fCB); }.bind(this),
      function (fCB) { this.createComponentInstances(fCB); }.bind(this),
    ], function (err, results) {
      LOG.info('~/components/container/Container :: __init (complete)');

      // this.setDomShadowSize(window.innerWidth, window.innerWidth);
      this.createDomObservers();

      fCB();
    }.bind(this));

  };

  // triggered by the web component disconnectedCallback
  // we're no longer attached to the DOM at this point
  __del() {
    this.destroyDomElements();
    this.destroyComponentInstances();
  };


  /////////////////////////
  ///// CLASS METHODS /////
  /////////////////////////

  /// CREATE ///
  createDomElements(fCB) {
    this.oDOMElements['domPageWrapper'] = DOM.create('div', { className: 'domPageWrapper' });
    DOM.append(this.oDOMElements['domPageWrapper'], this.shadow);

    this.oDOMElements['domBackgroundWrapper'] = DOM.create('div', { className: 'domBackgroundWrapper' });
    DOM.append(this.oDOMElements['domBackgroundWrapper'], this.shadow);

    fCB();
  };

  createComponentInstances(fCB) {

    async.series([
      function (fCB) { this.oComponentInstances['_webglBackground'] = new WebGLBackground(fCB); }.bind(this),
    ], function (err, results) {

      DOM.append(this.oComponentInstances['_webglBackground'], this.oDOMElements['domBackgroundWrapper']);

      fCB();
    }.bind(this));

  };

  // TODO : this doesn't trigger correctly on iOS landscape ?
  // hhhm, https://bugs.webkit.org/show_bug.cgi?id=170595
  createDomObservers() {

    // FRP.addStreamListener('window:onresize', { target: window, event: 'resize' }, function() {
    //   this.setDomShadowSize(window.innerWidth, window.innerHeight);
    // }.bind(this));

    // Handler to set size of the domCanvasWrapper and its domCanvas child
    // NOTE: We call this before creating the scene and camera to guarantee correct sizings.
    //       The ResizeObserver makes sure we handle subsequent resizes of the domCanvasWrapper.
    // this.resizeObserver = new ResizeObserver(function(entries) {

    //   // LOG.info('contentRect.width : ' + Math.round(entries[0].contentRect.width));
    //   // LOG.info('window.innerWidth : ' + window.innerWidth);
    //   // LOG.info('contentRect.width : ' +  Math.round(entries[0].contentRect.height));
    //   // LOG.info('window.innerHeight : ' + window.innerHeight);

    //   // TODO: see if we can grab the values from the rezise observer
    //   // this.onDocumentBodyResize(entries[0].contentRect.width, entries[0].contentRect.height);
    //   this.onDocumentBodyResize(window.innerWidth, window.innerHeight);



    // }.bind(this));

    // this.resizeObserver.observe(document.body);
  };

  setDomShadowSize(updatedWidth, updatedHeight) {

    this.shadow.host['style'].width = updatedWidth + 'px';
    this.shadow.host['style'].height = updatedHeight + 'px';
  };

  /// ANIMATE ///
  intro(fCB) { fCB(); };
  outro(fCB) { fCB();};

  /// DESTROY ///
  destroyDomElements() {
    for (const oDomElement in this.oDOMElements) {
      DOM.remove(this.oDOMElements[oDomElement]);
    };
  };

  destroyComponentInstances() {
    for (const _componentInstance in this.oComponentInstances) {
      this.oComponentInstances[_componentInstance] = null;
    };
  };
};


////////////////////////////////////
///// WEB COMPONENT DEFINITION /////
////////////////////////////////////

customElements.define('theu0001-components-container', Container);


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default Container;


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
