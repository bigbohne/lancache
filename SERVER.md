# Intro

This document describes how to setup a lancache server once you have a server with at least two NICs and ubuntu installed.

# Steps

- Packages: `dnsmasq iptables-persistent`

# Container

## Lancache DNS

`docker run --name lancache-dns -p 10.13.37.2:53:53/udp -e USE_GENERIC_CACHE=true -e LANCACHE_IP=10.13.37.2 -e DISABLE_RIOT=true -d --restart always lancachenet/lancache-dns:latest`

## SNI Proxy

`docker run --name sniproxy -p 10.13.37.2:443:443 -d --restart always lancachenet/sniproxy:latest`

# Files

## /etc/netplan/50-cloud-init.yaml

Adapt mac addresses as necessary

```yaml
network:
  version: 2
  ethernets:
    eno1:
      ignore-carrier: true
      dhcp4: true
    wan:
      ignore-carrier: true
      dhcp4: true
      match:
        macaddress: 00:0f:53:07:0c:c8
      set-name: wan
    lan:
      addresses:
        - 10.13.37.1/24
        - 10.13.37.2/24
      match:
        macaddress: 00:0f:53:07:0c:c9
      set-name: lan
```

## /etc/dnsmasq.conf

```
server=/#/1.1.1.1
listen-address=10.13.37.1
no-dhcp-interface=eno0
no-dhcp-interface=wan
dhcp-range=10.13.37.100,10.13.37.200,12h
```

## /etc/iptables/rules.v4

```
*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
:POSTROUTING ACCEPT [1:168]
-A POSTROUTING -o wan -j MASQUERADE
COMMIT
```

## /etc/sysctl.conf

```
net.ipv4.ip_forward=1
```