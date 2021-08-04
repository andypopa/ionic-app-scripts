"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ionic_global_1 = require("./ionic-global");
describe('Ionic Global', () => {
    describe('buildIonicGlobal', () => {
        it('should cache windowIonic', () => {
            const ctx = {
                rootDir: '/Users/elliemae/myapp',
                wwwDir: '/Users/elliemae/myapp/www',
                buildDir: '/Users/elliemae/myapp/www/build'
            };
            const r = ionic_global_1.buildIonicGlobal(ctx);
            expect(r).toBeDefined();
        });
    });
});
