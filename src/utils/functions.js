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
