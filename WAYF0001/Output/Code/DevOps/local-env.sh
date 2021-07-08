#!/usr/bin/zsh
case "$1" in

  start)
    echo "docker-compose env -> start";
    docker-compose up --detach # creates / starts the docker container(s)
    exit 1;
    ;;

  stop)
    echo "docker-compose env -> stop";
    docker-compose down # stops the docker container(s)
    exit 1;
    ;;

  clean)
    echo "docker-compose env -> clean";
    docker-compose up --detach # first we need all containers up and running so we can run npm commands
    ./local-web.sh clean # remove all node_modules and lock files
    docker-compose down -v --remove-orphans --rmi all # stop & remove containers, networks, volumes, and images created by ‘up’
    exit 1;
    ;;

  *) echo "no valid argument supplied"; exit 1; ;;

esac
