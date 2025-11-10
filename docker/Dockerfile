# syntax=docker/dockerfile:1
FROM node:23.11 AS aiiinotate

# aiiinotate port
ARG PORT=4444
ENV PORT=${PORT}

# set up environment
ENV TERM=linux
SHELL ["/bin/bash", "-c"]

# root of the app in the docker container
WORKDIR $ROOT_AIIINOTATE
# copy the docker .env in the docker container
COPY ./docker/.env /aiiinotate/.env
# install the app as an NPM library
RUN npm i -g aiiinotate
# migrate-mongo also needs to be manually installed it seems
RUN npm i -g migrate-mongo@^12.1.3

# expose the used port
EXPOSE $PORT

# run the migrations and start the app.
# NOTE migrations must be done in CMD: they need the mongo service to be running.
CMD aiiinotate --env=/aiiinotate/.env -- migrate apply && \
    aiiinotate --env=/aiiinotate/.env -- serve prod;