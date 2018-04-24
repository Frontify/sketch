{{? it.fonts.length > 0 }}
<div class="m-typography__fonts">
    <button type="button" class="a-btn a-btn--default m-typography__fonts-download js-m-typography__fonts-download"><i class="icon-download"></i> Download Fonts</button>
    <span class="m-typography__fonts-included">
        {{~ it.fonts :font:index }}
            {{= font.install_name }}{{? index < it.fonts.length - 1 }}, {{?}}
        {{~}}
    </span>
</div>
{{?? !it.hub_id }}
    <div class="o-settings__blank">Your project is not linked to a Frontify Style Guide
        <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
           <button class="a-btn a-btn--link-primary js-m-typography__learn" data-url="http://help.frontify.com/faq-workspace/how-to-create-a-project-and-link-it-to-your-style-guide">Learn more</button>
        </div>
    </div>
{{??}}
    <div class="o-settings__blank">No fonts found in your Frontify Style Guide
       <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
          <button class="a-btn a-btn--link-primary js-m-typography__styleguide" data-url="/hub/{{= it.hub_id }}">Add fonts</button>
       </div>
   </div>
{{?}}
{{? !$.isEmptyObject(it.groups) }}
    <div class="m-typography__list">
   {{ for(var id in it.groups) { }}
        {{? it.groups.hasOwnProperty(id) }}
            {{ var group = it.groups[id]; }}
            {{? group.styles.length > 0 }}
                <div class="m-typography__group js-m-typography__group" data-id="{{= group.id }}">
                    <h3 class="m-typography__title">{{= group.title || 'Font Styles' }}
                        <div class="m-btn-dropdown m-typography__dropdown">
                            <a class="a-btn a-btn--link m-typography__btn js-m-typography__toggle js-m-btn-dropdown__toggle"><i class="js-m-typography__add fi-plus"></i></a>
                            <ul class="m-btn-dropdown__menu m-typography__menu js-m-btn-dropdown__menu ">
                                <li class="m-btn-dropdown__item"><a class="m-btn-dropdown__link m-btn-dropdown__link--small js-m-typography__styles-add">Add to text styles</a></li>
                            </ul>
                        </div>
                    </h3>
                    {{? group.description }}
                        <div class="m-typography__desc-wrap js-m-typography__desc-wrap state-collapsed">
                            <p class="m-typography__desc">{{= group.description }}</p>
                            <div class="m-typography__expand-collapse">
                               <button class="m-typography__expand js-m-typography__expand">Click to expand</button>
                               <button class="m-typography__collapse js-m-typography__collapse">Collapse</button>
                            </div>
                        </div>
                    {{?}}
                    <div class="m-typography__styles clearfix">
                        {{~ group.styles : style }}
                            {{= window.tpl.typographystyle({ style: style, colors: it.colors, group: group.id }) }}
                        {{~}}
                    </div>
                </div>
            {{?}}
       {{?}}
   {{ } }}
    </div>
{{?? it.hub_id }}
    <div class="o-settings__blank">No typo styles found in your Frontify Style Guide
        <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
           <button class="a-btn a-btn--link-primary js-m-typography__styleguide" data-url="/hub/{{= it.hub_id }}">Add typo styles</button>
        </div>
    </div>
{{?}}