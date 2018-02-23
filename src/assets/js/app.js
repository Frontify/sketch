/* Patterns */
var scripts = require.context('../patterns', true, /\.js$/);
scripts.keys().forEach(scripts);

window.tpl = {};
var templates = require.context('../patterns', true, /\.tpl$/);
templates.keys().forEach(function(template) {
    var name = template.split('/').pop().split('.')[0];
    window.tpl[name] = templates(template);
});
