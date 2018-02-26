<li class="m-artboards__item js-m-artboards__item clearfix state-{{= it.state }}" data-id-external="{{= it.id_external }}">
    <div class="m-artboards__type">
        <span class="m-artboards__badge">
            {{? it.state === 'uploading'}}
                <i class="m-artboards__icon icon-spinner anim-spin"></i>
            {{?? it.state === 'success'}}
                <i class="m-artboards__icon fi-image"></i>
            {{?? it.state === 'failed'}}
                <i class="m-artboards__icon fi-emoji-unhappy"></i>
            {{??}}
                <i class="m-artboards__icon fi-image"></i>
            {{?}}
    </div>
    <div class="m-artboards__actions">
        <button {{? it.state == 'uploading' }}disabled{{?}} class="a-btn a-btn--xs a-btn--default js-m-artboards__upload">Upload</button>
    </div>
    <a class="m-artboards__content js-m-artboards__target" {{? it.id }}href="/screens/{{= it.id }}"{{?}}>
        <h3 class="m-artboards__title">{{= it.name }}</h3>
        <span class="m-artboards__modified">{{? it.state === 'uploading'}}Uploading…{{??}}{{? it.modified_localized_ago }}{{? !it.nochanges}}Updated {{?}}{{= it.modified_localized_ago }}{{??}}Not yet uploaded{{?}}{{?}}</span>
    </a>
</li>