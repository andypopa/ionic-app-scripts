"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIonicGlobal = void 0;
const helpers_1 = require("../util/helpers");
function buildIonicGlobal(context) {
    context.ionicGlobal = context.ionicGlobal || {};
    // gather data to add to window.Ionic
    const systemData = helpers_1.getSystemData(context.rootDir);
    if (systemData.ionicFramework) {
        context.ionicGlobal['version'] = `'${systemData.ionicFramework}'`;
    }
    if (systemData.angularCore) {
        context.ionicGlobal['angular'] = `'${systemData.angularCore}'`;
    }
    if (systemData.ionicNative) {
        context.ionicGlobal['ionicNative'] = `'${systemData.ionicNative}'`;
    }
    let staticDir = helpers_1.toUnixPath(context.buildDir.replace(context.wwwDir, ''));
    staticDir += '/';
    if (staticDir.charAt(0) === '/') {
        staticDir = staticDir.substring(1);
    }
    context.ionicGlobal['staticDir'] = `'${staticDir}'`;
    // output the JS
    let o = [
        '(function(w){',
        'var i=w.Ionic=w.Ionic||{};'
    ];
    Object.keys(context.ionicGlobal).forEach(key => {
        o.push(`i.${key}=${context.ionicGlobal[key]};`);
    });
    o.push('})(window);');
    return o.join('');
}
exports.buildIonicGlobal = buildIonicGlobal;
