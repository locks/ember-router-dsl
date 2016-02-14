import Ember from 'ember';
const { Router } = Ember;

interface Router {
    extend(...options: Array<{}>);
    map(fn: Function): void;
}

let rootContext = null;
let contextStack = [];

function currentContext(): Context {
    return contextStack[contextStack.length - 1];
}
function pushContext(ctx: Context): void {
    contextStack.push(ctx);
}
function popContext(): Context {
    return contextStack.pop();
}

class Context {
    constructor(public children: Array<Context> = [],
                public routes: Array<Array<any>> = []) {}
    
    pushRoute(options: Array<any>): void {
        this.routes.push(options);
    }
    
    pushChild(ctx: Context): void {
        this.children.push(ctx);
    }
}

function route(...args): void {
        let [fn, ...options] = args.reverse();
        options = options.reverse();

        if (isFunction(fn)) {
            let ctx = new Context();
            currentContext().pushChild(ctx);
            currentContext().pushRoute(options);
            pushContext(ctx);
            fn();
            popContext();
        } else {
            currentContext().routes.push([...options, fn]);
        }
}

function isFunction(fn): Boolean {
    return fn.constructor.name === "Function";
}

class DSLRouter {
    constructor(...args) {
        this.router = Router.extend(...args);
    }
    
    router: Router;

    map(fn: Function): Router {
        rootContext = new Context();
        contextStack.push(rootContext);

        let dsl = new DSL(this.router);
        dsl.map(fn);

        return this.router;
    }
}

class Route {
    constructor(public dsl: DSL, public options: Array<any>) {}
}

class DSL {
    constructor(public router: Router, public routes: Array<any> = []) {}

    private push(route: Route | Array<any>): void {
        this.routes.push(route);
    }

    route(...args): void {
        let [ fn, ...options ] = args.reverse();
        options = options.reverse();

        if (isFunction(fn)) {
            let dsl = new DSL(this.router);
            let route = new Route(dsl, options);

            this.push(route);
            fn(dsl);
        } else {
            this.push([...options, fn]);
        }
    }

    map(fn: Function) {
        let dsl = this;
        fn(dsl);

        this.router.map(function() {
            dsl.generate.bind(this)(dsl);

            dsl.generateGlobal.bind(this)(dsl, rootContext);
        });
        
        return this.router;
    }

    private generate(dsl: DSL) {
        dsl.routes.forEach(r => {
            if (r.constructor.name !== "Array") {
                this.route(...r.options, function() {
                    dsl.generate.bind(this)(r.dsl);
                });
            } else {
                this.route(...r);
            }
        });
    }

    private generateGlobal(dsl: DSL, ctx: Context) {
        ctx.routes.forEach(r => {
            if (ctx.children.length > 0) {
                this.route(...r, function() {
                    ctx.children.forEach(child => {
                        dsl.generateGlobal.bind(this)(dsl, child);
                    });
                });
            } else {
                this.route(...r);
            }
        });
    }
}

export { DSLRouter as Router, route };
