{{? !$.isEmptyObject(it.palettes) }}
   {{ for(var id in it.palettes) { }}
        {{? it.palettes.hasOwnProperty(id) }}
            {{ var palette = it.palettes[id]; }}
            {{? palette.colors.length > 0 }}
                <div class="m-colors__palette">
                    <h3 class="m-colors__title">{{= palette.name }} </h3>
                    {{? palette.description }}<p class="m-colors__desc">{{= palette.description }}</p>{{?}}

                    <ul class="m-colors__colors clearfix">
                        {{~ palette.colors : color }}
                            <li class="m-colors__color js-m-colors__color" data-color-r="{{= color.r}}" data-color-g="{{= color.g}}" data-color-b="{{= color.b}}" data-color-a="{{= color.alpha }}" style="background: {{= color.css_value }};"></li>
                        {{~}}
                    </ul>
                </div>
            {{?}}
       {{?}}
   {{ } }}
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