FROM node:10.15-jessie

WORKDIR /workspace

RUN apt-get -y update && \
    apt-get -y install git curl && \
    apt-get clean

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
