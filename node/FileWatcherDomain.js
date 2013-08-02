/*
 * Copyright (c) 2012 Bernhard Sirlinger. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global */

(function () {
    "use strict";
    
    var Gaze = require("gaze");
    
    var _domainManager;
    
    function emitEvents(file, event) {
        _domainManager.emitEvent("fileWatcher", "fileSystemChange", [event, file]);
    }
    
    function startWatching(dir) {
        process.chdir(dir);
        var g = new Gaze("**/*", {interval: 5000});
        
        g.on('changed', function (filepath) {
            //console.log(filepath + ' was changed');
        });

        // On file added
        g.on('added', function (filepath) {
            emitEvents(filepath, null);
        });

        // On file deleted
        g.on('deleted', function (filepath) {
            emitEvents(filepath, null);
        });
    }
    
    /**
     * Initializes the StaticServer domain with its commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        _domainManager = domainManager;
        if (!domainManager.hasDomain("fileWatcher")) {
            domainManager.registerDomain("fileWatcher", {major: 0, minor: 1});
        }
        
        _domainManager.registerCommand(
            "fileWatcher",
            "startWatching",
            startWatching,
            false,
            "",
            [{
                name: "dir",
                type: "string",
                description: "absolute filesystem path for the watcher entry node"
            }]
        );
        
        _domainManager.registerEvent(
            "fileWatcher",
            "fileSystemChange",
            [{
                name: "event",
                type: "{type: string, path: string, dir: boolean}",
                description: ""
            }]
        );
    }
    
    exports.init = init;
    
}());
