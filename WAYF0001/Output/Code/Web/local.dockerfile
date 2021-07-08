# pull in our base image
FROM ubuntu:20.10

# set docker metadata
LABEL maintainer="theun@theundebruijn.com"

# install node
# https://nodejs.org/en/
ENV NODE_VERSION 16.4.2
# https://github.com/npm/cli/releases
ENV NPM_VERSION 7.19.1

# install dependencies
RUN apt-get update && \
    apt-get install -y wget && \
    rm -rf /var/lib/apt/lists/* && \
    # grab the nodejs tarball
    wget https://nodejs.org/download/release/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.gz -O /opt/node-$NODE_VERSION.tar.gz -q && \
    tar -xzf /opt/node-$NODE_VERSION.tar.gz -C /opt/ && \
    # point binaries
    ln -s "/opt/node-v$NODE_VERSION-linux-x64/bin/node" /usr/local/bin/ && \
    ln -s "/opt/node-v$NODE_VERSION-linux-x64/bin/npm" /usr/local/bin/npm && \
    # force npm to update to the specified verstion (not the one bundled with node)
    npm install npm@$NPM_VERSION -g >/dev/null 2>/dev/null && \
    # cleanup
    apt-get autoremove wget --purge -y && \
    rm /opt/node-$NODE_VERSION.tar.gz && \
    # add local user so we don't run as root
    useradd -m -U -s /bin/bash thisisalocaluser

# run a tail to keep the container running
# all commands are executed from shell scripts using `docker exec`
CMD ["tail" ,"-f", "/dev/null"]

#///////////////////////////////////////////////////////////
#///////////////////////////////////////////////////////////
#/////////////////////////.        /////////////////////////
#////////////////////     .      ..  ...////////////////////
#//////////////////    ..  .   ....    .  ./////////////////
#/////////////////        . .  . ...  . ... ////////////////
#////////////////     ...................   ////////////////
#////////////////  .(,(/.%,.*%#&&&.//....   ////////////////
#////////////////  .***/..*,*/%,%%#%*/(/(. ,* //////////////
#///////////////( ******  #%#((&%%*&///%%*..(.//////////////
#////////////////(/,((//**&.*,%%(*//.**##, .#(//////////////
#//////////////( .(,**....* ...,*,,,%&,((*.* .//////////////
#//////////////( . **..(*#/ %%%%#,*##,..*%,,.///////////////
#///////////////(.,#/%#%%,#(%#(/&&(%,(.//#,..///////////////
#/////////////////(,,/*#(.#/ /(&..%/&/(*(.//////////////////
#//////////////////( ***#     .,.,/&%%%*.///////////////////
#///////////////////(./,/*,,.,&*(((%%(/ ////////////////////
#//////////////////////**.*.*//##.*,,,//////////////////////
#//////////////////////  ,*%%/@//(*   ./////////////////////
#/////////////////////                 /////////////////////
#///////////////////                     ///////////////////
#/////////////// . ... .. ..    ...    .. .. ///////////////
#///....................................................////
