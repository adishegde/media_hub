# Media Hub

Lan based file sharing application.

## Introduction

Media Hub allows users to share directories on their devices through LAN. Users
can search for files shared by all devices running Media Hub on the LAN and
then download the file they want. Media Hub also maintains some meta data like
description, tags and number of downloads of a file.

## Installation

Download the latest release for your operating system from the release. Once
installed the app will notify all future updates.

To build from source:
- Clone the repository.
- Run `yarn install` to install all dependencies.
- Run `yarn bundle` to bundle the Javascript code.
- Run `yarn package` to create an application that will be placed in the `dist`
directory.

## Working

Media Hub basically has 2 parts: client and server.

The client is responsible for making search requests and downloading data. Search
requests are UDP messsages currently made through multicast but the core
library supports both broadcast and multicast. Files and their meta data are
requested via HTTP.

The server handles all incoming requests. It has a UDP service that handles the
incoming search requests and a HTTP server that serves files and meta data.

The core library supports a lot of flexibility with respect to configuration
however minimal support has been added to GUI as of v0.1.0.
