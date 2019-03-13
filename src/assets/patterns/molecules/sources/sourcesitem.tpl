<li class="m-sources__item js-m-sources__item clearfix state-{{= it.state }} {{? !(it.current || it.state === 'new' || it.state === 'opening' || it.state === 'downloading' || it.state === 'uploading' || it.state === 'pushing' || it.state === 'pulling')}}js-m-sources__open{{?}}" data-id="{{= it.id || '' }}" data-jets="{{! it.filename.toLowerCase() }}">
    <div class="m-sources__type">
        <span class="m-sources__badge">
            {{? it.state === 'uploading' || it.state === 'downloading' || it.state === 'pushing' || it.state === 'pulling'}}
                {{= window.tpl.progress() }}
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
        {{? it.state !== 'downloading' && it.state !== 'uploading' && it.state !== 'pulling' && it.state !== 'pushing' && it.state !== 'same' && it.state !== 'opening' }}
            {{? it.state === 'push' || it.state === 'failedpush'}}
                <div class="m-btn-dropdown m-btn-bar__group">
                    <button class="a-btn a-btn--xs a-btn--default js-m-sources__push">Push Changes</button>
                    <button class="a-btn a-btn--xs a-btn--default js-m-btn-dropdown__toggle js-m-sources__toggle"><i class="icon-angle-down"></i></button>
                    <ul class="m-btn-dropdown__menu m-btn-dropdown__menu--right m-sources__menu-push js-m-btn-dropdown__menu ">
                       <li class="m-btn-dropdown__item m-btn-dropdown__item--danger"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-sources__pull">Discard my Changes</a></li>
                   </ul>
                </div>
            {{??}}
                <button class="a-btn a-btn--xs a-btn--default {{? it.state === 'new' || it.state === 'faileddownload' }}js-m-sources__download{{?? it.state === 'addable' || it.state === 'failedadd'}}js-m-sources__add{{?? it.state === 'conflict' }}js-m-sources__conflict{{?? it.state === 'pull' || it.state === 'failedpull'}}js-m-sources__pull{{?}}">
                    {{? it.state === 'new' || it.state === 'faileddownload' }}
                        Download
                    {{?? it.state === 'pull' || it.state === 'failedpull' }}
                        Pull Changes
                    {{?? it.state === 'addable' || it.state === 'failedadd'}}
                        Add to Frontify
                    {{?? it.state === 'conflict'}}
                        Resolve Conflict
                    {{?}}
                </button>
            {{?}}
        {{?}}
    </div>
    <div class="m-sources__content">
        <h3 class="m-sources__title">{{= window.utils.tpl.truncate(it.filename.substring(0, it.filename.length - 7), 10, 40, 30)}}<span class="m-sources__ext">.sketch</span></h3>
        <span class="m-sources__modified">
            {{? it.activity }}
                Currently working on file:
                {{~ it.activity:item:index }}
                    {{= item.name || item.email }}{{? it.activity.length - 1 > index}},{{?}}
                {{~}}
                <span class="m-sources__bubble"></span>
            {{??}}
                {{? it.state === 'new'}}
                    Not yet downloaded
                {{?? it.state === 'downloading'}}
                    Downloading…
                {{?? it.state === 'faileddownload'}}
                    Download failed
                {{?? it.state === 'addable'}}
                    Not yet added
                {{?? it.state === 'uploading'}}
                    Uploading…
                {{?? it.state === 'failedadd'}}
                    Upload failed
                {{?? it.state === 'push'}}
                    Local changes by you
                {{?? it.state === 'pushing'}}
                    Pushing local changes…
                {{?? it.state === 'failedpush'}}
                    Pushing local changes failed
                {{?? it.state === 'pull'}}
                    Remote changes {{= it.modified_localized_ago }} by {{= it.modifier_name || it.modifier_email }}
                {{?? it.state === 'pulling'}}
                    Pulling remote changes…
                {{?? it.state === 'failedpull'}}
                    Pulling remote changes failed
                {{?? it.state === 'same'}}
                    Last modified {{= it.modified_localized_ago }} by {{= it.modifier_name || it.modifier_email }}
                {{?? it.state === 'conflict'}}
                    Conflicting versions
                {{?? it.state === 'opening'}}
                    Opening file…
                {{?}}
            {{?}}
        </span>
    </div>
</li>
