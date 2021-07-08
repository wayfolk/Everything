///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import async from 'async';

/// LOCAL ///
import { FRP } from '~/_utils/FRP.js';
import { DOM } from '~/_utils/DOM.js';
import { CSS } from '~/_utils/CSS.js';
import { LOG } from '~/_utils/LOG.js';

// import Text from './components/text/Text.js';
import WebGL from '~/pages/_common/components/webgl/WebGL.js';

/// ASSETS CSS ///
import sCSS from './Home.css';
import { dom } from 'dat.gui';


///////////////////////////////
///// WEB COMPONENT CLASS /////
///////////////////////////////

class Home extends HTMLElement  {

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

    DOM.append(_css, this.shadow);

    fCB();
  };


  ///////////////////////////////////
  ///// WEB COMPONENT LIFECYCLE /////
  ///////////////////////////////////

  connectedCallback() {};
  disconnectedCallback() { this.__del(); };


  ///////////////////////////
  ///// CLASS LIFECYCLE /////
  ///////////////////////////

  // triggered by the web component connectedCallback
  // we're attached to the DOM at this point
  __init(fCB) {
    LOG.info('~/pages/home/Home :: __init');

    async.series([
      function (fCB) { this.createDomElements(fCB); }.bind(this),
      function (fCB) { this.createComponentInstances(fCB); }.bind(this),
    ], function (err, results) {
      LOG.info('~/pages/home/Home :: __init : complete');

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

    // this.oDOMElements['domNavButton'] = DOM.create('div', { className: 'domNavButton' });

    // this.oDOMElements['domNavButtonCopy'] = DOM.create('div', { className: 'domNavButtonCopy' }, 'open exhibit');
    // this.oDOMElements['domNavButtonCopyLastChar'] = DOM.create('span', { className: 'lastChar' }, 's');
    // DOM.append(this.oDOMElements['domNavButtonCopyLastChar'], this.oDOMElements['domNavButtonCopy']);

    // DOM.append(this.oDOMElements['domNavButtonCopy'], this.oDOMElements['domNavButton']);
    // DOM.append(this.oDOMElements['domNavButton'], this.shadow);

    fCB();
  };

  createComponentInstances(fCB) {

    async.series([
      // function (fCB) {  this.oComponentInstances['_text'] = new Text(fCB); }.bind(this),
      function (fCB) {  this.oComponentInstances['_webgl'] = new WebGL({ sType: 'page', sContent: 'home' }, fCB); }.bind(this),
    ], function (err, results) {

      // order is important! even with z-indexes
      DOM.append(this.oComponentInstances['_webgl'], this.shadow);
      // DOM.append(this.oComponentInstances['_text'], this.shadow);

      fCB();
    }.bind(this));

  };

  /// ANIMATE ///
  intro() {
    LOG.info('~/pages/home/Home :: intro');


    const _stream = FRP.getStream('webglBackground:onchange');
    // _stream({ sColor: 0xfdfbf8, nDuration: 3.500 });
    // _stream({ sColor: 0xff0000, nDuration: 3.500 });
    _stream({ sColor: 0xfffaf0, nDuration: 2.000 });

    async.parallel([
      function (fCB) { this.oComponentInstances['_webgl'].intro(fCB, 0.00); }.bind(this),
      // function (fCB) { this.oComponentInstances['_text'].intro(fCB); }.bind(this),
    ], function (err, results) {
      LOG.info('~/pages/home/Home :: intro : complete');

    }.bind(this));
  };

  outro(fCB) {
    LOG.info('~/pages/home/Home :: outro');

    async.parallel([
      function (fCB) { this.oComponentInstances['_webgl'].outro(fCB); }.bind(this),
      // function (fCB) { this.oComponentInstances['_text'].outro(fCB); }.bind(this),
    ], function (err, results) {
      LOG.info('~/pages/home/Home :: outro : complete');

      fCB();
    }.bind(this));
  };

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

customElements.define('theu0001-pages-home', Home);


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default Home;


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
