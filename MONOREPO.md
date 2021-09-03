```
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
```
#### MONOREPO
<sup>inspired by the perforce workspace workflow — https://www.perforce.com/video-tutorials/vcs/setting-workspaces-p4v  
we get close by utilising git's sparse checkouts, combined with gcp cloud storage for our lfs needs</sup>\
<br/>
<sup><b>_prerequisites:_</b>\
\
a wsl2 vm configured using the [devops readme](DEVOPS.md)
</sup>

##### monorepo setup
<sup>1/ install Cloud SDK — https://cloud.google.com/sdk/docs/install#deb</sup>  
```powershell
# powershell (regular user)
wsl -d wsl-wayfolk -u wayfolk
``` 
```zsh
# zsh (wayfolk)
echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
sudo apt-get install apt-transport-https ca-certificates gnupg
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
sudo apt update
sudo apt install google-cloud-sdk

# authenticate Cloud SDK and set default project
gcloud auth login # handle flow via an authenticated browser session
gcloud config set project wayfolk

# authenticate and store Application Default Credentials (ADC)  
gcloud auth application-default login # handle flow via an authenticated browser session
```
<sup>2/ install gcsfuse — https://github.com/GoogleCloudPlatform/gcsfuse/blob/master/docs/installing.md</sup>  
```zsh
# zsh (wayfolk)
# todo : update this to ubuntu 20.10 (groovy) when available
# for now we downgrade the lsb_release to ubuntu 18.04 (bionic)
# as the 20.04 (focal) release doesn't offer the latest build — https://github.com/GoogleCloudPlatform/gcsfuse/issues/477
export GCSFUSE_REPO=gcsfuse-bionic
echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | sudo tee /etc/apt/sources.list.d/gcsfuse.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt update
sudo apt install gcsfuse
gcsfuse --version
```
<sup>3/ install lfs-folderstore — https://github.com/sinbad/lfs-folderstore</sup>  
```zsh
# zsh (theundebruijn)
wget https://github.com/sinbad/lfs-folderstore/releases/download/v1.0.1/lfs-folderstore-linux-amd64-v1.0.1.zip -P ~
cd ~
7z x lfs-folderstore-linux-amd64-v1.0.1.zip
sudo mv ./lfs-folderstore-linux-amd64/lfs-folderstore /usr/local/bin/ && sudo chmod +x /usr/local/bin/lfs-folderstore
rm -rf ~/lfs-folderstore-linux-amd64 && rm ~/lfs-folderstore-linux-amd64-v1.0.1.zip
lfs-folderstore --version
```
##### monorepo workflow
<sup>based on — https://github.blog/2020-01-17-bring-your-monorepo-down-to-size-with-sparse-checkout/</sup>  
<sup>howto / perform a sparse checkout of an existing repo</sup>  
```zsh
# zsh (wayfolk)
# setup automounting of the gcp storage bucket — https://cloud.google.com/storage

mkdir ~/.gcsfuse_mountpoint
exit
```
```zsh
# zsh (wayfolk)
# make sure the fuse mount is available
ls ~/.gcsfuse_mountpoint

# make sure lfs-folderstore is available on the PATH
lfs-folderstore --version

# make a sparse checkout</sup>  
mkdir -p "/mnt/c/Work/Wayfolk"
git clone --no-checkout --depth 1 git@github.com-wayfolk:wayfolk/Everything.git "/mnt/c/Work/Wayfolk/Everything"
cd "/mnt/c/Work/Wayfolk/Everything"
git config user.name "Theun de Bruijn" && git config user.email "theun@theundebruijn.com"
git lfs install
git config --add lfs.customtransfer.lfs-folder.path lfs-folderstore
git config --add lfs.customtransfer.lfs-folder.args "/home/wayfolk/.gcsfuse_mountpoint"
git config --add lfs.standalonetransferagent lfs-folder
git sparse-checkout init --cone
git sparse-checkout set WAYF0000 WAYF0001 WAYF0002
git reset --hard main
```
<sup>howto / update the sparse-checkout mapping (post checkout)</sup>  
```zsh
# zsh (wayfolk)
# update a sparse checkout</sup>  
cd "/mnt/c/Work/Wayfolk/Everything"
git sparse-checkout set THEU0000/Input/Resources
```
<sup>howto / sparse-checkout in wsl2</sup>  
```zsh
# zsh (wayfolk)
# make a sparse checkout</sup>  
mkdir -p "/home/wayfolk/Work/Wayfolk"
git clone --no-checkout --depth 1 git@github.com-wayfolk:wayfolk/Everything.git "/home/wayfolk/Work/Wayfolk/Everything"
cd "/home/wayfolk/Work/Wayfolk/Everything"
git config user.name "Theun de Bruijn" && git config user.email "theun@theundebruijn.com"
git lfs install
git config --add lfs.customtransfer.lfs-folder.path lfs-folderstore
git config --add lfs.customtransfer.lfs-folder.args "/home/wayfolk/.gcsfuse_mountpoint"
git config --add lfs.standalonetransferagent lfs-folder
git sparse-checkout init --cone
git sparse-checkout set _meta/Workspaces WAYF0001/Output/Code WAYF0002/Output/Code
git reset --hard main
```
<br/>
<sub><sup>copyright © 2021-present, Wayfolk. all rights reserved.</sup></sub>
