<div class="js-o-settings__elem m-setting__elem m-setting-dropdown{{? it.modifier }} m-setting-dropdown--{{= it.modifier }}{{?}}" {{? it.expand }}data-expand="{{= it.expand }}"{{?}} data-id="{{= it.id }}" data-type="dropdown">
    <div class="m-setting__preview m-setting__bar js-m-setting__bar">
        <label for="{{= it.id }}" class="m-setting__label">{{= it.label }}</label>
        <select id="{{= it.id }}" name="{{= it.id }}" {{? it.readonly }}readonly{{?}} data-template="{{? it.template }}{{= it.template }}{{??}}dropdown{{?}}">
            {{~ it.options :option:index}}
            <option {{? option.value == it.value}}selected {{?}} value="{{= option.value}}"
                {{? option.data }}
                    {{ for(let key in option.data) { }}
                        data-{{= key }}="{{= option.data[key] }}"
                    {{ } }}
                {{?}}>{{= option.name}}</option>
            {{~}}
        </select>
    </div>
</div>
