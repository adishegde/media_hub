# Media Hub

Lan based file sharing application.

## Introduction

Media Hub allows users to share directories on their devices through LAN. Users
can search for files shared by all devices running Media Hub on the LAN and
then download the file they want. Media Hub also maintains some meta data like
description, tags and number of downloads of a file.

The app consists of 2 components:

*   **Daemon**: Responsible for responding to search requests, serving files and
metadata.
*   **Client**: Responsible for making search requests and downloading files.

## Daemon

The daemon program requires the share option (`-s`) to start (can be passed via config file also).
Defaults have been provided for all other options. The share option can be used
multiple times to share multiple directories:

    ./daemon -s /path/to/share1 -s /path/to/share2

By default the daemon is configured to not respond to search requests from
same machine since it leads to unnecessary clutter. However this behaviour might
be needed when testing the app. The `--selfRespond` option can be used to enable
responses to search requests from same machine.

The complete option list can be viewed by running

    ./daemon --help

The daemon also maintains metadata in a JSON file. By default the path is
`./meta.json` i.e. it is created in the same directory as the daemon program.

The daemon also accepts a JSON file for configuration. The JSON file can
contain the same options as those possible through the command line (it should
be the long form however). The config file can be passed to the program via
`-c` or `--config` option. Command line options override the config file
values.

Currently there is no option to run the daemon in the background. On UNIX
machines one option is:

    nohup ./daemon -c /path/to/config &

It is recommended to give a log file path in this case.

## Client

The client provides functionality to utilize the services provided by the
daemon. To get a complete list of options of the client program run

    ./client --help

The client program can be used without specifiying any of the options.

It has the following subcommands:

*   **search**: This makes a UDP broadcast search request and displays the
response provided by all daemon instances on the LAN. e.g. The following
command searches for files with name as media. Fuzzy search is used
for matching queries by the daemon. Use the `--help` option with the subcommand
to see more options.

    `./client search media name`

*   **download**: This downloads a file or directory. The directory can be
specified by the `--incoming` option or as an argument after the URL. If `path`
given as an argument then the file/directory is downloaded into `path` if it
does exist but it's parent does. If `path` exists then file/directory is
downloaded inside `path` with the same name as that in the server. The
`--incoming` option should always be a directory. Use the `--help` option to
view more details. e.g. of download command:

    `./client download http://192.168.0.2:31340/2f162dc4-ea49-50c3-b6bf-09db3f4ebd98 /path/to/download/file`

*   **info**: This displays the metadata associated with the URL. Use the `--help` to
view more details. e.g.

    `./client info http://192.168.0.2:31340/2f162dc4-ea49-50c3-b6bf-09db3f4ebd98`

*   **list**: This lists the contents of the directory at URL. URL should be a
directory URL for this to work. Use the `--help` option to view more details.
e.g.

    `./client list http://192.168.0.2:31340/2f162dc4-ea49-50c3-b6bf-09db3f4ebd98`

**Note**: Currently the client does not provide a way to change metadata info like
description and tags of a file. The only way to change it as of now is to stop
the daemon and then write the data into the meta data file.
