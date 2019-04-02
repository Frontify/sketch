{{? it.sources.length > 1 }}
    {{= window.tpl.settingelemdropdown({
        id: 'source',
        label: '',
        modifier: 'limit-3',
        value: it.selected.id,
        options: it.sources.map(function(source) {
            return { value: source.id, name: source.name }
        }) })
    }}
{{?}}


