///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import { getGPUTier  } from 'detect-gpu';
import { LOG } from './LOG';


///////////////
///// OBJ /////
///////////////

const ENV = Object.create(null);


///////////////////////
///// OBJ METHODS /////
///////////////////////

ENV.detectGPU = async function (fCB) {
  this.gpu = await getGPUTier({ benchmarksURL: '/static/benchmarks' });
  fCB();
};

ENV.getGPU = function() {
  return this.gpu;
};


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export { ENV };


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
