import Ember from 'ember';

let rootContext = null;
let contextStack = [];

function currentContext() {
    return contextStack[contextStack.length - 1];
}
function pushContext(ctx) {
    contextStack.push(ctx);
}
function popContext() {
    contextStack.pop();
}

class Context {
    constructor() {
        this.children = [];
        this.routes = [];
    }
    
    push(route) {
        this.routes.push(route);
    }
}

export function route(...args) {
        let [fn, ...options] = args.reverse();
        options = options.reverse();
        
        if (isFunction(fn)) {
            console.log("não");
            let ctx = new Context();
     console.log("ctx", currentContext());       
            currentContext().children.push(ctx);
            currentContext().routes.push(options);
            pushContext(ctx);
            fn();
            popContext();
        } else {
            currentContext().routes.push([...options, fn]);
        }
}

const { Router } = Ember;

function isFunction(fn) {
    return fn.constructor.name === "Function";
}

class DSLRouter {
    constructor() {
        this.router = Router.extend(...arguments);
        
        console.log(this.router);
    }
    
    map() {
        rootContext = new Context();
        contextStack.push(rootContext);
        
        let dsl = new DSL(this.router);
        dsl.map(...arguments);
        
        return this.router;
    }
}

class DSL {
    constructor(router) {
        this.router = router;
        this.routes = [];
    }
    
    push(route) {
        this.routes.push(route);
    }
    
    route(...args) {
        let [ fn, ...options ] = args.reverse();
        options = options.reverse();

        if (isFunction(fn)) {
            let dsl = new DSL();
            
            this.push({ dsl, options });
            fn(dsl);    
        } else {
            this.push([...options, fn]);
        }
    }
    
    map(fn) {
        let dsl = this;
        fn(dsl);

        this.router.map(function() {
            dsl.generate.bind(this)(dsl);
            
            dsl.generateGlobal.bind(this)(dsl, rootContext);
        });
        
        return this.router;
    }
    
    generate(dsl) {
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
    
    generateGlobal(dsl, ctx) {
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

export { DSLRouter as Router };
