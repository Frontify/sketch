<div class="js-o-settings__elem m-setting__elem{{? it.modifier }} m-setting-toggle--{{= it.modifier }}{{?}}" data-id="{{= it.id }}" data-type="toggle" {{? it.mapping }}data-mapping-false="{{= it.mapping[0] }}" data-mapping-true="{{= it.mapping[1] }}"{{?}} {{? it.key }}data-key="{{= it.key }}"{{?}}{{? it.group }} data-group="{{= it.group }}"{{?}}>
    <div class="m-setting__preview">
        <label class="m-btn-toggle m-setting__value--inline">
            <input tabindex="-1"
                   id="{{= it.id }}"
                   name="{{= it.id }}"
                   {{? it.checked}} checked {{?}}
                   {{? it.disabled}} disabled {{?}}
                   {{? it.readonly}} readonly {{?}}
                   class="m-btn-toggle__input js-m-setting-toggle"
                   type="checkbox"
                   {{ for(let key in it.data) { }}
                        data-{{= key }}="{{= it.data[key] }}"
                   {{ } }}
            >
            <i class="m-btn-toggle__toggle"></i>
        </label>
        <label for="{{= it.id }}" class="m-setting__label--inline">{{= it.label }}</label>
    </div>
</div>
