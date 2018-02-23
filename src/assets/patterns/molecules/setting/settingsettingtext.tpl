<form class="js-o-settings__setting m-setting" data-id="{{= it.id }}" data-type="text" {{? it.api }}data-api="{{= it.api }}"{{?}}{{? it.group }} data-group="{{= it.group }}"{{?}}{{? it.method }} data-method="{{= it.method }}"{{?}} novalidate>
    <div class="m-setting__preview m-setting__preview--action m-setting__bar js-m-setting__bar">
        <label for="{{= it.id }}"
               class="m-setting__label">{{= it.label }}</label>
        <div class="m-setting__group">
            {{? it.prefix }}<span class="m-setting__group-prefix">{{= it.prefix}}</span>{{?}}
            <div class="m-setting__group-wrap">
                <input spellcheck="false" tabindex="-1" autocomplete="off" class="m-setting__input js-m-setting__input{{? it.classes }} {{= it.classes}}{{?}}{{? it.type && it.type === 'unit'}} m-setting__input--right{{?}}"
                        {{? it.placeholder }} placeholder="{{= it.placeholder }}"{{?}}
                        {{? it.type === 'number' || it.type === 'unit'}}
                            value="{{=it.value || 0}}"
                        {{??}}
                            value="{{=it.value || ''}}"
                        {{?}}
                       id="{{= it.id }}"
                        {{? it.type }} type="{{= it.type}}"{{?}}
                        {{? it.mask }} data-mask="{{=it.mask}}"{{?}}
                        {{? it.type}} type="{{= it.type }}"{{?}}
                       name="{{= it.id }}"
                        {{? it.required }} required{{?}}
                        {{? it.disabled }} disabled{{?}}
                        {{? it.readonly }} readonly {{?}}
                        {{? it.msg }} data-msg="{{= it.msg }}"{{?}}
                />
            </div>
            {{? it.suffix }}<span class="m-setting__group-suffix">{{= it.suffix}}</span>{{?}}
        </div>
    </div>
</form>
