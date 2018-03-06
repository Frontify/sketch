<div class="mod mod-tabs m-tabs" id="tabs-main">
    <ul class="m-tabs__list js-m-tabs__list" role="tablist">
        {{~ it.items :item }}
            <li role="presentation" class="m-tabs__item"><a href="#tab-{{= item.id }}" class="m-tabs__link js-m-tabs__link{{? item.active}} state-active{{?}}{{? item.classes}} {{= item.classes }}{{?}}" role="tab"">{{= item.title}}</a></li>
        {{~}}
        <li class="m-tabs__item m-tabs__item--action"><a href="#tab-{{= item.id }}" class="m-tabs__action js-m-tabs__refresh"><i class="icon-refresh"></i></a></li>
    </ul>

    <div class="m-tabs__content clearfix js-m-tabs__content">
        {{~ it.items :item }}
            <div id="tab-{{= item.id}}" class="m-tabs__pane js-m-tabs__pane{{? item.active}} state-active{{?}}" role="tabpanel">{{? item.content }}{{= item.content }}{{?}}</div>
        {{~}}
    </div>
</div>