import Ember from 'ember';
import config from './config/environment';
import { DSL } from 'ember-router-dsl';

const Router = Ember.Router.extend({
  location: config.locationType
});

let dsl = new DSL(Router);

dsl.map(r => {
    r.route("a");
    r.route("b", { path: 'bee' });
    r.route("c", (r) => {
        r.route('c-a');
    });
})

export default Router;
