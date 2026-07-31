FROM golang:1.26-alpine AS build
WORKDIR /repo
COPY ssh/go.mod ssh/go.sum ./ssh/
RUN cd ssh && go mod download
COPY content/ content/
COPY ssh/ ssh/
WORKDIR /repo/ssh
RUN go generate ./... && CGO_ENABLED=0 go build -o /bin/vikrun .

FROM alpine:3.20
RUN adduser -D -u 10001 app
USER app
WORKDIR /home/app
COPY --from=build /bin/vikrun /bin/vikrun
EXPOSE 2222 8080
CMD ["/bin/vikrun"]
