/* Some utility functions */
import * as Path from "path";

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
