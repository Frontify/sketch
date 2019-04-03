/* Patterns */
let scripts = require.context('../patterns', true, /\.js$/);
scripts.keys().forEach(scripts);

window.tpl = {};
let templates = require.context('../patterns', true, /\.tpl$/);
templates.keys().forEach(function(template) {
    let name = template.split('/').pop().split('.')[0];
    window.tpl[name] = templates(template);
});
