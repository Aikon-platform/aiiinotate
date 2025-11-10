# syntax=docker/dockerfile:1
FROM node:23.11

# aiiinotate port
ARG PORT
ENV PORT=${PORT}

# set up environment
ENV TERM=linux
SHELL ["/bin/bash", "-c"]

# root of the app in the docker container
WORKDIR /aiiinotate
# copy the docker .env in the docker container
COPY ./docker/.env /aiiinotate/.env
# for debug: install `iproute2` which provides CLI `ss` to monitor active ports
RUN apt update && apt install iproute2 -y
# install the app as an NPM library. we do a global install as it saves us from issues with `$PATH`.
RUN npm i -g aiiinotate

# expose the used port
EXPOSE $PORT

# run the migrations and start the app.
# NOTE migrations must be done in CMD: they need the mongo service to be running.
CMD aiiinotate --env=/aiiinotate/.env -- migrate apply && \
    aiiinotate --env=/aiiinotate/.env -- serve prod;