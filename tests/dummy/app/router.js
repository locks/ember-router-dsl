import Ember from 'ember';
import config from './config/environment';
import { Router, route } from 'ember-router-dsl';

const router = new Router({
    location: config.locationType
});

export default router.map(r => {
    route("zero", () => {
        route("one", () => {
            route("two");
        });
    });
    route("bulbasaur", function() {
        route("ivysaur", () => {
            route("venosaur");
        });
    })
    r.route("a");
    r.route("b", { path: 'bee' });
    r.route("c", function(r) {
        r.route('c-a', (r) => {
            r.route('c-a-a');
        });
    });
});
