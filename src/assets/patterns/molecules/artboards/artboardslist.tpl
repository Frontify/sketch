<div class="m-artboards__header">
    <div class="m-artboards__export-label">Upload to:</div>
    <div class="m-artboards__export-action">
        <a class="a-btn a-btn--xs a-btn--link-primary js-m-artboards__change-target">change</a>
    </div>
    <a class="m-artboards__export-target js-m-artboards__change-target">
        <span class="m-artboards__export-target-part"><i class="fi-projects"></i> {{= it.target.project.name }}</span>
        {{? it.target.set.folders.length > 0 }}
            {{~ it.target.set.folders : folder:index }}
                {{? it.target.set.folders.length - 1 === index }}
                   <span class="m-artboards__export-target-part"><i class="fi-folder"></i> {{= folder }}</span>
                {{??}}
                    <span class="m-sources__export-target-part"><i class="fi-folder"></i> …</span>
                {{?}}
            {{~}}
        {{?}}
    </a>
</div>
{{? it.artboards.length > 0 }}
    {{= window.tpl.search({ label: 'Search artboards', classes: 'js-m-artboards__search'}) }}
    <ul class="m-artboards__list js-m-artboards__list">
        {{~ it.artboards :artboard }}
            {{= window.tpl.artboardsitem(artboard) }}
        {{~}}
    </ul>
    <div class="o-settings__blank m-artboards__no-results js-m-artboards__no-results">
        No matching artboards found
    </div>
{{??}}
   <div class="o-settings__blank">
       No artboards found
   </div>
{{?}}
{{? it.artboards.length > 0 }}
<div class="m-btn-bar m-btn-bar--centered m-btn-bar--footer">
   <button class="a-btn a-btn--primary js-m-artboards__upload-all">Upload All Artboards</button>
</div>
{{?}}
