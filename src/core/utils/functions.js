/* Some utility functions */
import * as Path from "path";
import * as Os from "os";

// Returns true if path is descendent of any directory in dirList
export function isChild(path, dirList) {
    return dirList.some(dir => {
        let relative = Path.relative(dir, path);

        return (
            !!relative &&
            !relative.startsWith("..") &&
            !Path.isAbsolute(relative)
        );
    });
}

// Returns true if IP address belongs to the same machine
export function isLocalIP(ipaddr) {
    return Object.values(Os.networkInterfaces()).some(iface =>
        iface.some(naddr => naddr.address === ipaddr)
    );
}

// Returns the first non external IPv4 address
export function guessIp() {
    // Get network interfaces
    let ifaces = Os.networkInterfaces();

    // Loop through all interface names like 'en0', 'lo0' etc,.
    for (let ifname of Object.keys(ifaces)) {
        // Loop through the IP address of the ifname interface
        for (let iface of ifaces[ifname]) {
            // If iface is internal or is IPv6 continue to next address
            if (iface.internal || iface.family !== "IPv4") continue;

            // We have found an external IPv4 address
            return iface.address;
        }
    }

    // Default is loopback
    return "127.0.0.1";
}
