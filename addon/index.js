"use strict";
const ember_1 = require('ember');
const { Router } = ember_1.default;
let rootContext = null;
let contextStack = [];
function currentContext() {
    return contextStack[contextStack.length - 1];
}
function pushContext(ctx) {
    contextStack.push(ctx);
}
function popContext() {
    return contextStack.pop();
}
class Context {
    constructor(children = [], routes = []) {
        this.children = children;
        this.routes = routes;
    }
    pushRoute(options) {
        this.routes.push(options);
    }
    pushChild(ctx) {
        this.children.push(ctx);
    }
}
function route(...args) {
    let [fn, ...options] = args.reverse();
    options = options.reverse();
    if (isFunction(fn)) {
        let ctx = new Context();
        currentContext().pushChild(ctx);
        currentContext().pushRoute(options);
        pushContext(ctx);
        fn();
        popContext();
    }
    else {
        currentContext().routes.push([...options, fn]);
    }
}
exports.route = route;
function isFunction(fn) {
    return fn.constructor.name === "Function";
}
class DSLRouter {
    constructor(...args) {
        this.router = Router.extend(...args);
    }
    map(fn) {
        rootContext = new Context();
        contextStack.push(rootContext);
        let dsl = new DSL(this.router);
        dsl.map(fn);
        return this.router;
    }
}
exports.Router = DSLRouter;
class Route {
    constructor(dsl, options) {
        this.dsl = dsl;
        this.options = options;
    }
}
class DSL {
    constructor(router, routes = []) {
        this.router = router;
        this.routes = routes;
    }
    push(route) {
        this.routes.push(route);
    }
    route(...args) {
        let [fn, ...options] = args.reverse();
        options = options.reverse();
        if (isFunction(fn)) {
            let dsl = new DSL(this.router);
            let route = new Route(dsl, options);
            this.push(route);
            fn(dsl);
        }
        else {
            this.push([...options, fn]);
        }
    }
    map(fn) {
        let dsl = this;
        fn(dsl);
        this.router.map(function () {
            dsl.generate.bind(this)(dsl);
            dsl.generateGlobal.bind(this)(dsl, rootContext);
        });
        return this.router;
    }
    generate(dsl) {
        dsl.routes.forEach(r => {
            if (r.constructor.name !== "Array") {
                this.route(...r.options, function () {
                    dsl.generate.bind(this)(r.dsl);
                });
            }
            else {
                this.route(...r);
            }
        });
    }
    generateGlobal(dsl, ctx) {
        ctx.routes.forEach(r => {
            if (ctx.children.length > 0) {
                this.route(...r, function () {
                    ctx.children.forEach(child => {
                        dsl.generateGlobal.bind(this)(dsl, child);
                    });
                });
            }
            else {
                this.route(...r);
            }
        });
    }
}
