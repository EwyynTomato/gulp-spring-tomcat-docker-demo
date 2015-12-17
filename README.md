### What is this

A demo web application on OSX/Linux using:

- Spring boot

- Tomcat

- Docker (tomcat and spring-boot application container)

- Gulp (build)


### Setup

- Install Java 1.8

- Install node.js

- Install npm

- Install docker (docker-tools for non-linux platform)

- Install gulp

```
$ npm install -g gulp
```

- Install npm dependencies

```
$ npm install
```

- Build containers

```
$ gulp init
```

- Open the web application
    - If you're using docker-tools on non-linux platform, you need to find your container host ip, e.g.

    ```bash
    $ docker-machine ip default
    192.168.99.100
    # Open your browser, and go to: http://192.168.99.100:8088/gdtdemo/
    ```

    - If you're on linux, you can simply open http://127.0.0.1:8088/gdtdemo/


### Gulp

#### Arguments

- -e / --env

	Set task environment

	Available Value: dev | prod

	Default Value: dev

#### Tasks

- init

    Fresh build:
    - Create docker files for given environment (default is dev)
    - Clean previous docker app process/image (excluding BASE image)
    - Build app containers

- setup

	Setup environment templates and files (such as creating Dockerfile for 'dev' environment)

- build

	Build all of our docker containers for given environment

- rebuild-app

	Remove app container and image, leaving media container intact, and rebuild a new app container for given environment

- clean

	 Cleanup: Remove all media, app container and image

- clean-app

	Remove app container and image, leaving media container intact, and rebuild a new app container
	
### Demo

- gulp for streamlined build

- gulp build per environment using template and argument, e.g.

    $ gulp init -e=dev

- users for tomcat manager per environment using tomcat-user.xml

- separated docker base, app, and data volume container

- Update app using gulp task:rebuild-app, while data volume is not destroyed or modified in the process


