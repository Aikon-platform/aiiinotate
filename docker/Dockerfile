# syntax=docker/dockerfile:1
FROM node:23.11 AS aiiinotate

# aiiinotate port
ARG PORT=4444
ENV PORT=${PORT}

# set up environment
ENV TERM=linux
SHELL ["/bin/bash", "-c"]

# root of the app in the docker container
WORKDIR /aiiinotate
# copy the docker .env in the docker container
COPY ./docker/.env /aiiinotate/.env
# install the app as an NPM library
RUN npm i -g aiiinotate

RUN npm i -g migrate-mongo@^12.1.3
# migrate the database
RUN  aiiinotate --env=/aiiinotate/.env -- migrate apply
# expose the used port
EXPOSE $PORT
# start the app
CMD aiiinotate --env=/aiiinotate/.env -- serve prod
