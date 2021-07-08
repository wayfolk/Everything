///////////////////
///// IMPORTS /////
///////////////////

import { FRP } from '~/_utils/FRP.js';

/////////////////
///// CLASS /////
/////////////////

class Router {

  /// CONSTRUCTOR ///
  constructor() {
    this.createStreams();
  };


  /////////////////////////
  ///// CLASS METHODS /////
  /////////////////////////

  createStreams() {
    FRP.createStream('router:onNewPage');

    FRP.createStream('router:onPopState', { target: window, event: 'popstate' });
    const streamlistener = FRP.createStreamListener('router:onPopState', function () {
      this.onNewPage();
    }.bind(this));
  };

  /**
   * Determines the pathName based on 'window.location.pathname'.
   */
  getPathName() {
    let pathName = window.location.pathname;
    if (pathName.charAt(0) === '/') { pathName = pathName.substr(1); };

    return pathName;
  };

  /**
   * Determines the page to be loaded based on the determined pathName.
   */
  onNewPage() {

    const pathName = this.getPathName();
    const stream = FRP.getStream('router:onNewPage');

    if (pathName === '') { stream('home'); }
    else if (pathName === 'the-veil/') { stream('the-veil'); }
    else if (pathName === 'the-man-in-the-wall/') { stream('the-man-in-the-wall'); }
    else if (pathName === 'another-world-awaits/') { stream('another-world-awaits'); }
    else { stream('404'); }
  };
};


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export default Router;


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
