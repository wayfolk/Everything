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
<sup>1/ install cifs-utils</sup>  
```zsh
sudo apt update
sudo apt install cifs-utils
```
<sup>2/ install lfs-folderstore — https://github.com/sinbad/lfs-folderstore</sup>  
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

sudo mkdir -p /home/wayfolk/.fstab_work_wayfolk_devops_gitlfs_everything
cp /mnt/c/Users/Theun\ de\ Bruijn/Downloads/.fstab_credentials ~/
sudo nano /etc/fstab
//192.168.50.216/Work/Wayfolk/DevOps/Git\040LFS/Everything /home/wayfolk/.fstab_work_wayfolk_devops_gitlfs_everything cifs vers=3.0,credentials=/home/wayfolk/.fstab_credentials,iocharset=utf8  0  0
exit
wsl --shutdown
```
```zsh
# zsh (wayfolk)
# make sure the mount is available
ls /home/wayfolk/.fstab_work_wayfolk_devops_gitlfs_everything

# make sure lfs-folderstore is available on the PATH
lfs-folderstore --version

# make a sparse checkout</sup>  
mkdir -p "/mnt/c/Work/Wayfolk"
git clone --no-checkout --depth 1 --sparse git@github.com-wayfolk:wayfolk/Everything.git "/mnt/c/Work/Wayfolk/Everything"
cd "/mnt/c/Work/Wayfolk/Everything"
git config user.name "Theun de Bruijn" && git config user.email "theun@theundebruijn.com"
git lfs install
git config --add lfs.customtransfer.lfs-folder.path lfs-folderstore
git config --add lfs.customtransfer.lfs-folder.args "/home/wayfolk/.fstab_work_wayfolk_devops_gitlfs_everything"
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
git config --add lfs.customtransfer.lfs-folder.args "/home/wayfolk/.fstab_work_wayfolk_devops_gitlfs_everything"
git config --add lfs.standalonetransferagent lfs-folder
git sparse-checkout init --cone
git sparse-checkout set _meta/Workspaces WAYF0001/Output/Code WAYF0002/Output/Code
git reset --hard main
```
<br/>
<sub><sup>copyright © 2021-present, Wayfolk. all rights reserved.</sup></sub>
