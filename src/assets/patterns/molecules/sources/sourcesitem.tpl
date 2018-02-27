<li class="m-sources__item js-m-sources__item clearfix state-{{= it.state }}" data-id="{{= it.id || '' }}">
    <div class="m-sources__type">
        <span class="m-sources__badge">
            {{? it.state === 'syncing'}}
                <i class="m-sources__icon icon-spinner anim-spin"></i>
            {{?? it.state === 'push'}}
                <i class="m-sources__icon fi-arrow-up"></i>
            {{?? it.state === 'pull' || it.state === 'new' }}
                <i class="m-sources__icon fi-arrow-down"></i>
            {{?? it.state === 'same' }}
                <i class="m-sources__icon fi-checkmark"></i>
            {{??}}
                <svg class="m-sources__icon"><use xlink:href="#sketch"/></svg>
            {{?}}
        </span>
    </div>
    <div class="m-sources__actions">
        {{? it.state !== 'syncing' && it.state !== 'same' }}
        <button class="a-btn a-btn--xs a-btn--default {{? it.state === 'new' }}js-m-sources__download{{?? it.state === 'addable' || it.state === 'failed'}}js-m-sources__add{{?? it.state === 'conflict' }}js-m-sources__conflict{{?? it.state === 'push'}}js-m-sources__push{{?? it.state === 'pull'}}js-m-sources__pull{{?}}">
            {{? it.state === 'new'}}
                Download
            {{?? it.state === 'pull'}}
                Pull Changes
            {{?? it.state === 'push'}}
                Push Changes
            {{?? it.state === 'addable' || it.state === 'failed'}}
                Add to Frontify
            {{?? it.state === 'conflict'}}
                Resolve Conflict
            {{?}}
        </button>
        {{?}}
    </div>
    <a class="m-sources__content {{? !(it.current || it.state === 'new' || it.state === 'syncing')}}js-m-sources__open{{?}}" {{? it.id && it.state !== 'addable'}}href="/screens/{{= it.id }}"{{?}}>
        <h3 class="m-sources__title">{{= it.filename.substring(0, it.filename.length - 7)}}<span class="m-sources__ext">.sketch</span></h3>
        <span class="m-sources__modified">
            {{? it.state === 'new'}}
                Not yet downloaded
            {{?? it.state === 'syncing'}}
                Syncing with Frontify…
            {{?? it.state === 'addable'}}
                Not yet added
            {{?? it.state === 'failed'}}
                Upload failed
            {{?? it.state === 'push'}}
                Local changes by you
            {{?? it.state === 'pull'}}
                Remote changes {{= it.modified_localized_ago }} by {{= it.modifier_name }}
            {{?? it.state === 'same'}}
                Up to date
            {{?? it.state === 'conflict'}}
                Conflicting versions
            {{?}}
        </span>
    </a>
</li>