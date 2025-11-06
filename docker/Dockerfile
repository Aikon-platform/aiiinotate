# syntax=docker/dockerfile:1
FROM node:23.11 AS aiiinotate

# aiiinotate port
ARG PORT=4444

# set up environment
ENV TERM=linux
SHELL ["/bin/bash", "-c"]

# root of the app in the docker container
WORKDIR /aiiinotate
# copy the .env in the docker container
COPY ./config/.env /aiiinotate/.env
# install the app as an NPM library
RUN npm i -g aiiinotate
# expose the used port
EXPOSE $PORT
# start the app
CMD aiiinotate --env=/aiiinotate/.env -- serve prod
