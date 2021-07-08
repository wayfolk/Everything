///////////////////
///// IMPORTS /////
///////////////////

import metadata from '~/../_meta/assets/metadata/metadata.json';


///////////////
///// OBJ /////
///////////////

const DOM = Object.create(null);


///////////////////////
///// OBJ METHODS /////
///////////////////////

DOM.create = function(sTag, oProps, anyContent) {
  const el = document.createElement(sTag);

  for (const i in oProps) {
    el[i] = oProps[i];
  }

  if (anyContent === undefined) { return el; }

  if (typeof anyContent === 'string') {
    el.appendChild(document.createTextNode(anyContent));
  } else {
    for (const i of anyContent) {
      el.appendChild(i);
    }
  }
  return el;
};

DOM.append = function(domEl, domParent) {
  domParent.appendChild(domEl);
};

DOM.remove = function(domEl) {
  domEl.remove();
};

DOM.empty = function(domEl) {
  // more performant than setting innertHTML
  domEl.textContent = '';
};

DOM.addClass = function(sClassName, domEl) {
  domEl.classList.add(sClassName);
};

DOM.removeClass = function(sClassName, domEl) {
  domEl.classList.remove(sClassName);
};

// NOTE: this is handled separately for generating the static index.html files.
// The postbuild process uses the same JSON object as this class.
// This method handles the runtime updates when navigating the SPA website.
DOM.updateMetadata = function(pageName) {
  document.title = metadata[pageName].document['title'];
  document.querySelector('meta[name="description"]').setAttribute('content', metadata[pageName].meta['description']);
  // https://ogp.me
  document.querySelector('meta[property="og:locale"]').setAttribute('content', metadata[pageName].meta['og:locale']);
  document.querySelector('meta[property="og:locale:alternate"]').setAttribute('content', metadata[pageName].meta['og:locale:alternate']);
  document.querySelector('meta[property="og:site_name"]').setAttribute('content', metadata[pageName].meta['og:site_name']);
  document.querySelector('meta[property="og:title"]').setAttribute('content', metadata[pageName].meta['og:title']);
  document.querySelector('meta[property="og:type"]').setAttribute('content', metadata[pageName].meta['og:type']);
  document.querySelector('meta[property="og:url"]').setAttribute('content', metadata[pageName].meta['og:url']);
  document.querySelector('meta[property="og:description"]').setAttribute('content', metadata[pageName].meta['og:description']);
  document.querySelector('meta[property="og:image"]').setAttribute('content', metadata[pageName].meta['og:imag']);
  document.querySelector('meta[property="og:image:type"]').setAttribute('content', metadata[pageName].meta['og:image:type']);
  document.querySelector('meta[property="og:image:width"]').setAttribute('content', metadata[pageName].meta['og:image:width']);
  document.querySelector('meta[property="og:image:height"]').setAttribute('content', metadata[pageName].meta['og:image:height']);
  // https://developer.twitter.com/en/docs/tweets/optimize-with-cards/guides/getting-started
  document.querySelector('meta[property="twitter:card"]').setAttribute('content', metadata[pageName].meta['twitter:card']);
  document.querySelector('meta[property="twitter:site"]').setAttribute('content', metadata[pageName].meta['twitter:site']);
  document.querySelector('meta[property="twitter:creator"]').setAttribute('content', metadata[pageName].meta['twitter:creator']);
};


//////////////////////
///// ES6 EXPORT /////
//////////////////////

export { DOM };


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
