<div class="m-sources__header">
    <div class="m-sources__export-label">Upload to:</div>
    <div class="m-sources__export-action">
        <a class="a-btn a-btn--xs a-btn--link-primary js-m-sources__finder">reveal in finder</a>
        <a class="a-btn a-btn--xs a-btn--link-primary js-m-sources__change-target">change</a>
    </div>
    <a class="m-sources__export-target js-m-sources__export-target" data-url="/projects/{{= it.target.project.id }}/{{= it.target.project.slug }}/{{= it.target.set.id }}">
        <span class="m-sources__export-target-part"><i class="fi-projects"></i> {{= it.target.project.name }}</span>
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
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="sketch" viewBox="0 0 18 16">
    <path d="M9 16a.434.434 0 0 1-.34-.166L.099 5.07a.455.455 0 0 1-.005-.558L3.423.17A.435.435 0 0 1 3.767 0h10.466c.134 0 .262.063.344.171l3.33 4.34a.455.455 0 0 1-.005.558L9.34 15.834A.435.435 0 0 1 9 16zM1.5 4.975l7.502 9.432 7.5-9.432-2.795-3.644H4.294L1.5 4.975zm10.798-1.37l1.1-3.377 1.249.368L13.467 4h4.095v1.2h-4.51L9.413 15.702A.44.44 0 0 1 9 16a.438.438 0 0 1-.413-.298L4.949 5.2H.438V4h4.096L3.354.596 4.593.33 5.68 3.633 8.67.153a.434.434 0 0 1 .658 0l2.968 3.452zM11.16 4L9 1.354 6.808 4h4.353zm.616 1.2H6.195l2.806 8.523L11.777 5.2z"/>
  </symbol>
</svg>
<ul class="m-sources__list">
    {{? it.sources.length > 0 }}
        {{~ it.sources :source }}
            {{= window.tpl.sourcesitem(source) }}
        {{~}}
    {{??}}
        <div class="o-settings__blank">
            No sources found
        </div>
    {{?}}
</ul>
<div class="m-btn-bar m-btn-bar--centered m-btn-bar--footer">
   <button {{? it.already_added || !it.has_document }}disabled{{?}} class="a-btn a-btn--primary js-m-sources__add-current">Add Current Sketch File</button>
</div>