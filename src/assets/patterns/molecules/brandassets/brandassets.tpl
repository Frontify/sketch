<div class="mod mod-brand-assets m-brandassets">
    {{= window.tpl.tabsbrandassets({
           items: [
               {id: 'colors', active: false, title: 'Colors', content: window.tpl.colors() },
               {id: 'typography', active: true, title: 'Typography', content: window.tpl.typography() }
           ]
       })
    }}
</div>