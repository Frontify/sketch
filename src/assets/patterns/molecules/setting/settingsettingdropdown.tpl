<form class="js-o-settings__setting m-setting m-setting-dropdown" data-id="{{= it.id }}" {{? it.api }}data-api="{{= it.api }}"{{?}} data-type="dropdown"{{? it.method }} data-method="{{= it.method }}"{{?}}>
    <div class="m-setting__preview m-setting__preview--action m-setting__bar js-m-setting__bar">
        <label for="{{= it.id }}" class="m-setting__label">{{= it.label }}</label>
        <select tabindex="-1" {{? it.readonly }}readonly{{?}} id="{{= it.id }}" name="{{= it.id }}" data-template="{{? it.template }}{{= it.template }}{{??}}c-dropdown{{?}}">
            {{~ it.options :option:index}}
            <option value="{{= option.value}}" {{? option.value == it.value}}selected {{?}}
                {{? option.data }}
                    {{ for(var key in option.data) { }}
                        data-{{= key }}="{{= option.data[key] }}"
                    {{ } }}
                {{?}}>{{= option.name}}</option>
            {{~}}
        </select>
    </div>
</form>
