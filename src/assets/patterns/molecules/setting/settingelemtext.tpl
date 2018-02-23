<div class="js-o-settings__elem m-setting__elem{{? it.modifier }} m-setting-text--{{= it.modifier }}{{?}}" data-id="{{= it.id }}" data-type="text"{{? it.group }} data-group="{{= it.group }}"{{?}}>
    <div class="m-setting__preview m-setting__bar js-m-setting__bar">
        <label for="{{= it.id }}"
               class="m-setting__label">{{= it.label }}</label>
        <div class="m-setting__group">
            {{? it.prefix }}<span class="m-setting__group-prefix">{{= it.prefix}}</span>{{?}}
            <div class="m-setting__group-wrap">
                <input spellcheck="false"  autocomplete="off" class="m-setting__input js-m-setting__input{{? it.classes }} {{= it.classes}}{{?}}{{? it.type && it.type === 'unit'}} m-setting__input--right{{?}}"
                        {{? it.placeholder }} placeholder="{{= it.placeholder }}"{{?}}
                        {{? it.type === 'number' || it.type === 'unit' }}
                            value="{{=it.value || 0}}"
                        {{??}}
                            value="{{=it.value || ''}}"
                        {{?}}
                       id="{{= it.id }}"
                        {{? it.mask }} data-mask="{{=it.mask}}"{{?}}
                        {{? it.type }} type="{{= it.type }}"{{?}}
                       name="{{= it.id }}"
                        {{? it.required }} required {{?}}
                        {{? it.disabled }} disabled {{?}}
                        {{? it.readonly }} readonly {{?}}
                        {{? it.maxlength }} maxlength="{{= it.maxlength }}" {{?}}
                        {{? it.msg }} data-msg="{{= it.msg }}"{{?}}
                />
            </div>
            {{? it.suffix }}<span class="m-setting__group-suffix">{{= it.suffix}}</span>{{?}}
        </div>
    </div>
    {{? it.info }}
        <p class="m-setting__info">{{= it.info }}</p>
    {{?}}
</div>
