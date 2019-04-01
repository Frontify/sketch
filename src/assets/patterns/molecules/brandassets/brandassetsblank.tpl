<div class="m-brandassets__blank">
    {{ console.log(it); }}
    <div class="m-brandassets__blank-image-wrap">
        <img class="m-brandassets__blank-image lazyload" src="../images/blankslate_{{= it.type }}.png" />
    </div>
    <div class="m-btn-bar m-btn-bar--centered">
        <button class="a-btn a-btn--primary js-m-brandassets_blank-cta m-brandassets_blank-cta"
            data-url="/brands/{{= it.brand.id }}/{{= it.brand.slug }}/{{? it.type === 'colors' || it.type === 'typography'}}guidelines{{??}}libraries{{?}}">
            {{? it.type === 'colors' || it.type === 'typography' }}
               Create your first guideline
            {{?? it.type === 'images'}}
                Create your first Media Library
            {{?? it.type === 'logos'}}
                Create your first Logo Library
            {{?? it.type === 'icons'}}
                Create your first Icon Library
            {{?}}
        </button>
    </div>
</div>

