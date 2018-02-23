<div class="m-artboards__header">
    <div class="m-artboards__export-label">Upload to folder</div>
    <div class="m-artboards__export-action">
        <a class="a-btn a-btn--xs a-btn--link-primary js-m-artboards__change-target">change folder</a>
    </div>
    <div class="m-artboards__export-target js-m-artboards__export-target">{{= it.path }}</div>
</div>
{{? it.artboards.length > 0 }}
<ul class="m-artboards__list">
    {{~ it.artboards :artboard }}
        {{= window.tpl.artboardsitem(artboard) }}
    {{~}}
</ul>
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