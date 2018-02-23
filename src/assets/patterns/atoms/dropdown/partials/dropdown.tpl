<div class="a-dropdown" tabindex="0">
    <div class="selected">
        <span>{{=it.selected.label}}<i class="a-dropdown__arrow icon-angle-down"></i></span>
    </div>
    <ul class="js-a-dropdown__list">
        {{~it.items :item:index}}
        <li data-index="{{=index}}">
            <span>{{=item.label}}</span>
        </li>
        {{~}}
    </ul>
</div>
