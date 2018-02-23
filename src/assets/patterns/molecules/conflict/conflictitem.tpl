<div class="m-conflict__item js-m-conflict__item">
    <div class="m-conflict__type">
        <svg class="m-conflict__icon"><use xlink:href="#sketch"/></svg>
    </div>
    <a class="m-conflict__content js-m-conflict__target">
        <h3 class="m-conflict__title">{{= it.filename }}</h3>
        <span class="m-conflict__modified">{{? it.modified_localized_ago }}Updated {{= it.modified_localized_ago }}{{??}}Not yet uploaded{{?}}{{? it.modifier_name}} by {{= it.modifier_name }}{{?}}</span>
    </a>
</div>