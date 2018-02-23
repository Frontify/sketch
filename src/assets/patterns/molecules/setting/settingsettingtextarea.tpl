<form class="js-o-settings__setting m-setting{{? it.modifier }} m-setting-text--{{= it.modifier }}{{?}}" data-id="{{= it.id }}" data-type="text" {{? it.api }}data-api="{{= it.api }}"{{?}}{{? it.group }} data-group="{{= it.group }}"{{?}}{{? it.method }} data-method="{{= it.method }}"{{?}} novalidate>
    <div class="m-setting__preview m-setting__preview--action m-setting__bar js-m-setting__bar">
        <label for="{{= it.id }}"
               class="m-setting__label">{{= it.label }}</label>
        <textarea spellcheck="false" tabindex="-1" autocomplete="off" class="m-setting__input js-m-setting__input"
               {{? it.placeholder }}placeholder="{{= it.placeholder }}"{{?}}
               id="{{= it.id }}"
               name="{{= it.id }}"
               {{? it.rows }} rows="{{= it.rows}}" {{?}}
               {{? it.required }} required {{?}}
               {{? it.disabled }} disabled {{?}}
               {{? it.readonly }} readonly {{?}}
               {{? it.msg }} data-msg="{{= it.msg }}"{{?}}
        >{{? it.value }}{{= it.value }}{{?}}</textarea>
    </div>
</form>
