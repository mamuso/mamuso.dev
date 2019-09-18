FROM node:10.15-jessie

WORKDIR /workspace

COPY entrypoint.sh .

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
