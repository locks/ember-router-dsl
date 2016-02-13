function isFunction(fn) {
    return fn.constructor.name === "Function";
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
            let dsl = new DSL(this.router);
            dsl.route(options);
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
        });
    }
    
    generate(dsl) {
        dsl.routes.forEach(r => {
            console.log(r, "=>", this);
            
            if (r.constructor.name !== "Array") {
                this.route(...r.options, function() {
                    dsl.generate.bind(this)(r.dsl);
                });
            } else {
                this.route(...r);
            }
        });
    }
}

export { DSL };