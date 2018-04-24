<div class="mod mod-brand-assets m-brandassets">
    {{= window.tpl.tabsbrandassets({
           items: [
               {id: 'colors', active: true, title: 'Colors', content: window.tpl.colors() },
               {id: 'typography', active: false, title: 'Typography', content: window.tpl.typography() }
           ]
       })
    }}
</div>