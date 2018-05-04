{{? it.palettes.length > 0 }}
   {{~ it.palettes :palette }}
        {{? palette.colors.length > 0 }}
            <div class="m-colors__palette js-m-colors__palette" data-id="{{= palette.id }}">
                <h3 class="m-colors__title">{{= palette.name }}
                    <div class="m-btn-dropdown m-colors__dropdown">
                        <a class="a-btn a-btn--link m-colors__btn js-m-colors__toggle js-m-btn-dropdown__toggle"><i class="js-m-colors__add fi-plus"></i></a>
                        <ul class="m-btn-dropdown__menu m-colors__menu js-m-btn-dropdown__menu ">
                            <li class="m-btn-dropdown__item"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-colors__document-add">Add to document colors</a></li>
                            <li class="m-btn-dropdown__item"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-colors__document-replace">Replace document colors</a></li>
                            <li class="m-btn-dropdown__item"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-colors__global-add">Add to global colors</a></li>
                            <li class="m-btn-dropdown__item"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-colors__global-replace">Replace global colors</a></li>
                        </ul>
                    </div>
                </h3>
                {{? palette.description }}
                    <div class="m-colors__desc-wrap js-m-colors__desc-wrap state-collapsed">
                        <p class="m-colors__desc">{{= palette.description }}</p>
                        <div class="m-colors__expand-collapse">
                           <button class="m-colors__expand js-m-colors__expand">Click to expand</button>
                           <button class="m-colors__collapse js-m-colors__collapse">Collapse</button>
                        </div>
                    </div>
                {{?}}

                <ul class="m-colors__colors clearfix">
                    {{~ palette.colors : color }}
                        <li class="m-colors__color js-m-colors__color" data-color-r="{{= color.r}}" data-color-g="{{= color.g}}" data-color-b="{{= color.b}}" data-color-a="{{= color.alpha }}" style="background: {{= color.css_value }};"></li>
                    {{~}}
                </ul>
            </div>
        {{?}}
   {{~}}
{{?? !it.hub_id }}
    <div class="o-settings__blank">Your project is not linked to a Frontify Style Guide
        <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
           <button class="a-btn a-btn--link-primary js-m-color__learn" data-url="http://help.frontify.com/faq-workspace/how-to-create-a-project-and-link-it-to-your-style-guide">Learn more</button>
        </div>
    </div>
{{??}}
    <div class="o-settings__blank">No color palettes found in your Frontify Style Guide
        <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
           <button class="a-btn a-btn--link-primary js-m-color__styleguide" data-url="/hub/{{= it.hub_id }}">Add colors</button>
        </div>
    </div>
{{?}}