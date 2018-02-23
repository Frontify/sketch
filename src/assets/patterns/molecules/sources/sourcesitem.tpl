<li class="m-sources__item js-m-sources__item state-{{= it.state }}" data-id="{{= it.id || '' }}">
    <div class="m-sources__type">
        <span class="m-sources__badge">
            {{? it.state === 'syncing'}}
                <i class="m-sources__icon icon-spinner anim-spin"></i>
            {{?? it.state === 'push'}}
                <i class="m-sources__icon icon-arrow-up"></i>
            {{?? it.state === 'pull'}}
                <i class="m-sources__icon icon-arrow-down"></i>
            {{??}}
                <svg class="m-sources__icon"><use xlink:href="#sketch"/></svg>
            {{?}}
        </span>
    </div>
    <div class="m-sources__actions">
        {{? !((it.state === 'new' || it.state === 'same') && it.current) && it.state !== 'syncing' }}
        <button class="a-btn a-btn--xs {{? it.state === 'conflict'}}a-btn--warn{{??}}a-btn--primary{{?}} {{? it.state === 'new' }}js-m-sources__download{{?? it.state === 'same' }}js-m-sources__open{{?? it.state === 'addable' }}js-m-sources__add{{?? it.state === 'conflict' }}js-m-sources__conflict{{?? it.state === 'push'}}js-m-sources__push{{?? it.state === 'pull'}}js-m-sources__pull{{?}}">
            {{? it.state === 'new' || it.state === 'same' }}
                Open
            {{?? it.state === 'pull'}}
                Pull Changes
            {{?? it.state === 'push'}}
                Push Changes
            {{?? it.state === 'addable' }}
                Add to Frontify
            {{?? it.state === 'conflict'}}
                Resolve Conflict
            {{?}}
        </button>
        {{?}}
    </div>
    <a class="m-sources__content js-m-sources__target" {{? it.id && it.state !== 'addable'}}href="/screens/{{= it.id }}"{{?}}>
        <h3 class="m-sources__title">{{= it.filename.substring(0, it.filename.length - 7)}}<span class="m-sources__ext">.sketch</span> {{? it.current }}<span class="m-sources__current a-badge a-badge--neutral a-badge--small">Current</span>{{?}}</h3>
        <span class="m-sources__modified">
            {{? it.state === 'new'}}
                Not yet downloaded
            {{?? it.state === 'syncing'}}
                Syncing with Frontify…
            {{?? it.state === 'addable'}}
                Not yet added
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