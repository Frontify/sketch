{{? it.fonts.length > 0 }}
<div class="m-typography__fonts">
    <button type="button" class="a-btn a-btn--default m-typography__fonts-download js-m-typography__fonts-download"><i class="icon-download"></i> Download Fonts</button>
    <span class="m-typography__fonts-included">
        {{ var includedFonts = ''; }}
        {{~ it.fonts :font:index }}
            {{ includedFonts += font.install_name; }}{{? index < it.fonts.length - 1 }}{{ includedFonts += ', '; }}{{?}}
        {{~}}
        {{= window.utils.tpl.truncate(includedFonts, 0, 100, 0) }}
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
                    <h3 class="m-typography__title">{{= group.title || 'Font Styles' }}</h3>
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
