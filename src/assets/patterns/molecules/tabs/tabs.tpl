<div class="mod mod-tabs m-tabs">
    <div class="js-m-tabs m-tabs{{? it.modifiers }}{{~ it.modifiers :modifier }} m-tabs--{{= modifier }}{{~}}{{?}}">
        <ul class="m-tabs__list" role="tablist">
            {{~ it.items :item }}
                <li role="presentation" class="m-tabs__item"><a href="#tab-{{= item.id }}" class="m-tabs__link js-m-tabs__link{{? item.active}} state-active{{?}}{{? item.classes}} {{= item.classes }}{{?}}" role="tab"">{{= item.title}}</a></li>
            {{~}}
            <li class="m-tabs__item m-tabs__item--refresh"><a href="#tab-{{= item.id }}" class="m-tabs__refresh js-m-tabs__refresh"><i class="icon-refresh"></i></a></li>
        </ul>

        <div class="m-tabs__content">
            {{~ it.items :item }}
                <div id="tab-{{= item.id}}" class="m-tabs__pane js-m-tabs__pane{{? item.active}} state-active{{?}}" role="tabpanel">{{? item.content }}{{= item.content }}{{?}}</div>
            {{~}}
        </div>
    </div>
</div>