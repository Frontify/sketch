<li class="m-sources__item js-m-sources__item clearfix state-{{= it.state }}" data-id="{{= it.id || '' }}">
    <div class="m-sources__type">
        <span class="m-sources__badge">
            {{? it.state === 'uploading' || it.state === 'downloading' || it.state === 'pushing' || it.state === 'pulling'}}
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
        {{? it.state !== 'downloading' && it.state !== 'uploading' && it.state !== 'pulling' && it.state !== 'pushing' && it.state !== 'same' && it.state !== 'opening' }}
        <button class="a-btn a-btn--xs a-btn--default {{? it.state === 'new' || it.state === 'faileddownload' }}js-m-sources__download{{?? it.state === 'addable' || it.state === 'failedadd'}}js-m-sources__add{{?? it.state === 'conflict' }}js-m-sources__conflict{{?? it.state === 'push' || it.state === 'failedpush'}}js-m-sources__push{{?? it.state === 'pull' || it.state === 'failedpull'}}js-m-sources__pull{{?}}">
            {{? it.state === 'new' || it.state === 'faileddownload' }}
                Download
            {{?? it.state === 'pull' || it.state === 'failedpull' }}
                Pull Changes
            {{?? it.state === 'push' || it.state === 'failedpush'}}
                Push Changes
            {{?? it.state === 'addable' || it.state === 'failedadd'}}
                Add to Frontify
            {{?? it.state === 'conflict'}}
                Resolve Conflict
            {{?}}
        </button>
        {{?}}
    </div>
    <a class="m-sources__content {{? !(it.current || it.state === 'new' || it.state === 'opening' || it.state === 'downloading' || it.state === 'uploading' || it.state === 'pushing' || it.state === 'pulling')}}js-m-sources__open{{?}}" {{? it.id && it.state !== 'addable'}}href="/screens/{{= it.id }}"{{?}}>
        <h3 class="m-sources__title">{{= window.utils.tpl.truncate(it.filename.substring(0, it.filename.length - 7), 10, 40, 30)}}<span class="m-sources__ext">.sketch</span></h3>
        <span class="m-sources__modified">
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
                Remote changes {{= it.modified_localized_ago }} by {{= it.modifier_name }}
            {{?? it.state === 'pulling'}}
                Pulling remote changes…
            {{?? it.state === 'failedpull'}}
                Pulling remote changes failed
            {{?? it.state === 'same'}}
                Up to date
            {{?? it.state === 'conflict'}}
                Conflicting versions
            {{?? it.state === 'opening'}}
                Opening file…
            {{?}}
        </span>
    </a>
</li>