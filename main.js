/*
 * Copyright (c) 2013 Bernhard Sirlinger. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4,
maxerr: 50, browser: true */
/*global $, define, brackets */

define(function (require, exports, module) {
    "use strict";

    var AppInit              = brackets.getModule("utils/AppInit"),
        Commands             = brackets.getModule("command/Commands"),
        CommandManager       = brackets.getModule("command/CommandManager"),
        ExtensionUtils       = brackets.getModule("utils/ExtensionUtils"),
        FileUtils            = brackets.getModule("file/FileUtils"),
        LiveDevServerManager = brackets.getModule("LiveDevelopment/LiveDevServerManager"),
        NodeConnection       = brackets.getModule("utils/NodeConnection"),
        ProjectManager       = brackets.getModule("project/ProjectManager");

    /**
     * @const
     * Amount of time to wait before automatically rejecting the connection
     * deferred. If we hit this timeout, we'll never have a node connection
     * for the static server in this run of Brackets.
     */
    var NODE_CONNECTION_TIMEOUT = 5000; // 5 seconds
    
    /**
     * @private
     * @type{jQuery.Deferred.<NodeConnection>}
     * A deferred which is resolved with a NodeConnection or rejected if
     * we are unable to connect to Node.
     */
    var _nodeConnectionDeferred = new $.Deferred();
    
    /**
     * @private
     * @type {NodeConnection}
     */
    var _nodeConnection = new NodeConnection();
    
    function initExtension() {
        var connectionTimeout = setTimeout(function () {
            console.error("[FileWatcher] Timed out while trying to connect to node");
            _nodeConnectionDeferred.reject();
        }, NODE_CONNECTION_TIMEOUT);
        
        _nodeConnection.connect(true).then(function () {
            _nodeConnection.loadDomains(
                [ExtensionUtils.getModulePath(module, "node/FileWatcherDomain")],
                true
            ).done(
                function () {
                    $(_nodeConnection).on("fileWatcher.fileSystemChange", function (event, orgEvent, type) {
                        if (orgEvent !== "change") {
                            CommandManager.execute(Commands.FILE_REFRESH);
                        }
                    });

                    clearTimeout(connectionTimeout);

                    _nodeConnectionDeferred.resolveWith(null, [_nodeConnection]);
                }).fail(
                function () { // Failed to connect
                    console.error("[FileWatcher] Failed to connect to node", arguments);
                    _nodeConnectionDeferred.reject();
                }
            );
        });

        return _nodeConnectionDeferred.promise();
    }

    AppInit.htmlReady(function () {
        _nodeConnectionDeferred.done(function (nodeConnection) {
            //nodeConnection.fileWatcher.startWatching(ProjectManager.getProjectRoot().fullPath, 1000);
            $(ProjectManager).on("projectOpen", function () {
                _nodeConnection.domains.fileWatcher.startWatching(ProjectManager.getProjectRoot().fullPath);
            });
        });
    });
    
    exports.initExtension = initExtension;
});