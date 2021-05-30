# https://wiki.archlinux.org/index.php/zsh#Configure_Zsh
# https://medium.com/@dpeachesdev/intro-to-zsh-without-oh-my-zsh-part-1-c039de5ee22e
# https://upload.wikimedia.org/wikipedia/commons/1/15/Xterm_256color_chart.svg

# history
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt INC_APPEND_HISTORY_TIME

# prompt
PROMPT='%F{244}[%n]%f %F{223}%~%f %F{244}>%f '

# right prompt
RPROMPT='%F{244}%*%f'

# autocomplete
autoload -Uz compinit
compinit

# vcs
autoload -Uz vcs_info

# ssh agent
{ eval $(ssh-agent) } &>/dev/null
{ ssh-add ~/.ssh/id_ed25519_github.com_theun@theundebruijn.com } &>/dev/null

# docker daemon
RUNNING=`ps aux | grep dockerd | grep -v grep`
if [ -z "$RUNNING" ]; then
  sudo dockerd > /dev/null 2>&1 &
  disown
fi

# gcp storage mount
RUNNING=`ps aux | grep gcsfuse | grep -v grep`
if [ -z "$RUNNING" ]; then
  gcsfuse wayfolk-everything-storage-bucket-uswest1-0001 ~/.gcsfuse_mountpoint > /dev/null 2>&1 &
  disown
fi
