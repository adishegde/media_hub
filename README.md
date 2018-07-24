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

## Contributing

The entire code base is split into 3 parts: core, gui and cli.

### Core
This is where media hub actually lives. It consists of 2 parts:

- daemon: The daemon is the server that handles incoming UDP and HTTP requests.
The UDP and HTTP services are managed by instances of the `UDPService`
and `HTTPService` respectively. The code for the services can be found under
`src/core/daemon/services`.

There is also a file indexer that keeps track of shared files and maintains
related meta data. The related files can be found in `src/core/daemon/fileIndex`.
The classes exported from `fileIndex` are dependent on each other i.e. `FileIndex`
`MetaData` and `SearchHandler` are coupled and not completely independent.

Finally the entire daemon logic is abstracted away by the `Server` class exported
from `src/core/daemon/server.js`. This makes it easy to use the daemon everywhere
else.

- client: The client provides support for UDP search requests. Making HTTP
requests are left to the GUI or CLI apps. The `Client` class can be found under
`src/core/client/client.js`.

### GUI
This contains the code for electron. `src/app/main.js` is the entry point for
electron's main process. `src/app/render/index.js` is the entry point for
electron's renderer process and the React App.

The structure of the `render` directory is similar to a React-Redux web app.

`src/app/utils/client.js` exports the client logic by extending upong the `Client`
provided by core. `src/app/utils/fileDownloader.js` implements a file downloader
which is used by client to actually download files.
