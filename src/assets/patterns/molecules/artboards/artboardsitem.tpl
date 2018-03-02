<li class="m-artboards__item js-m-artboards__item clearfix state-{{= it.state }}" data-id-external="{{= it.id_external }}" {{? it.id }}data-url="/screens/{{= it.id }}"{{?}}>
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
    <div class="m-artboards__content">
        <h3 class="m-artboards__title">{{= window.utils.tpl.truncate(it.name, 10, 45, 35)}} {{? it.id }}<i class="m-artboards__link-external fi-link-external"></i>{{?}}</h3>
        <span class="m-artboards__modified">
            {{? it.state === 'uploading'}}
                Uploading…
            {{?? it.nochanges}}
                Nothing changed
            {{?? it.state === 'new'}}
                Not yet uploaded
            {{??}}
                {{? it.modified_localized_ago }}
                    {{= it.modified_localized_ago }}
                    {{? it.modifier_name }} by {{= it.modifier_name }}{{?}}
                {{?}}
            {{?}}
        </span>
    </div>
</li>