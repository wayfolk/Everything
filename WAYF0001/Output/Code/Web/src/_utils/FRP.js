///////////////////
///// IMPORTS /////
///////////////////

/// NPM ///
import flyd from 'flyd';


///////////////
///// OBJ /////
///////////////

const FRP = Object.create(null);


//////////////////////////
///// OBJ PROPERTIES /////
//////////////////////////

FRP.oStreams = Object.create(null);


///////////////////////
///// OBJ METHODS /////
///////////////////////

FRP.createStream = function(sName, oDomEvent = null) {
  if (this.oStreams[sName]) throw new Error('stream already defined');
  this.oStreams[sName] = flyd.stream();

  if (oDomEvent !== null) {
    oDomEvent.target.addEventListener(oDomEvent.event, this.oStreams[sName]);
  };
};

// creates a _new_ stream that we can safely end without breaking other listeners
// see: https://github.com/paldepind/flyd/issues/155
FRP.createStreamListener = function(sName, fCB) {

  return flyd.on(function (data) { fCB(data); }, this.oStreams[sName]);
};

FRP.destroyStreamListener = function(fStream) {
  fStream.end(true);
};

FRP.destroyStream = function (sName) {
  this.oStreams[sName].end();
};

// returns a stream
// allows you to push new values without creating additional streams
FRP.getStream = function (sName) {
  return this.oStreams[sName];
};


// // aggregate method - can be used as an all in one
// FRP.addStreamListener = function(sName, oEventListener, fCB) {
//   // create new stream if it doesn't exist
//   if (!this.streams[sName]) this.streams[sName] = flyd.stream();

//   // attach the event listener to the stream if present

//   // TODO: test if aleady exist to prevent double calls


//   if (oEventListener !== null) {
//     oEventListener.target.addEventListener(oEventListener.event, this.streams[sName]);
//   };

//   // subscribe to the stream
//   if (fCB !== null) {
//     flyd.on(function (data) { fCB(data); }, this.streams[sName]);
//   };
// };

//////////////////////
///// ES6 EXPORT /////
//////////////////////

export { FRP };


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
