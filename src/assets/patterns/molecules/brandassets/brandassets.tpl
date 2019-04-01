<div class="mod mod-brand-assets m-brandassets">
    {{= window.tpl.tabsbrandassets({
           items: [
               {id: 'colors', active: true, title: 'Colors', content: window.tpl.brandassetscolors() },
               {id: 'typography', active: false, title: 'Typography', content: window.tpl.brandassetstypography() },
               {id: 'images', active: false, title: 'Images', content: window.tpl.brandassetsimages() },
               {id: 'logos', active: false, title: 'Logos', content: window.tpl.brandassetslogos() },
               {id: 'icons', active: false, title: 'Icons', content: window.tpl.brandassetsicons() }
           ]
       })
    }}
</div>
