FROM ubuntu:16.04

# Install environment
# Install environment
RUN apt-get update -y && apt-get install -y \
    git \
    wget \
    python3.5 \
    python3-pip \
    python-setuptools \
    python3-nacl \
    apt-transport-https \
    ca-certificates \
    build-essential \
    pkg-config \
    cmake \
    libssl-dev \
    libsqlite3-dev \
    libsodium-dev \
    curl

RUN pip3 install -U \
    pip \
    setuptools

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 68DB5E88
ARG indy_stream=master
RUN echo "deb https://repo.sovrin.org/deb xenial $indy_stream" >> /etc/apt/sources.list

ARG indy_plenum_ver=1.2.173
ARG indy_anoncreds_ver=1.0.32
ARG indy_node_ver=1.2.214
ARG python3_indy_crypto_ver=0.1.6
ARG indy_crypto_ver=0.1.6

RUN apt-get update -y && apt-get install -y \
        indy-plenum=${indy_plenum_ver} \
        indy-anoncreds=${indy_anoncreds_ver} \
        indy-node=${indy_node_ver} \
        python3-indy-crypto=${python3_indy_crypto_ver} \
        libindy-crypto=${indy_crypto_ver} \
        vim \
        curl

# Install rust toolchain
RUN curl -o rustup https://sh.rustup.rs
RUN chmod +x rustup
RUN ./rustup -y

# Build libindy
RUN git clone https://github.com/hyperledger/indy-sdk.git
WORKDIR $HOME/indy-sdk/libindy
RUN git checkout 50c58ee5df8d9ecb8f111be74fd1b49403f82378 
RUN $HOME/.cargo/bin/cargo build

RUN mv target/debug/libindy.so /usr/lib

ADD ./src /app
ADD ./docker-entrypoint.sh /usr/local/bin/enter
WORKDIR /app

RUN pip3 install -r requirements.txt
