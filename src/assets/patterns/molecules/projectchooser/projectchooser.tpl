<form class="m-projectchooser__form cm-setting">
    <div class="a-colorbar"></div>
    <header class="m-projectchooser__header">
        <h2 class="a-h2">Select Brand & Project</h2>
        <p class="a-p">Choose the project you are currently working on</p>
    </header>
    <div class="m-projectchooser__content">
        {{? it.brands.length > 0 }}
            {{= window.tpl.settingelemdropdown({ id: 'brand', label: 'Brand', modifier: 'limit-3', value: it.current.brand.id , options: it.brands }) }}

            {{? it.projects.length > 0 }}
                {{= window.tpl.settingelemdropdown({ id: 'project', label: 'Project', modifier: 'limit-3', value: it.current.project ? it.current.project.id : '', options: it.projects }) }}
            {{??}}
                <div class="o-settings__blank">No projects found in this brand
                    <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
                        <button class="a-btn a-btn--link-primary js-m-projectchooser__create" data-url="/brands/{{= it.current.brand.id }}/{{= it.current.brand.slug }}/projects">Create project</button>
                        <button class="state-hidden a-btn a-btn--link-primary js-m-projectchooser__refresh"><i class="icon-refresh"></i></button>
                    </div>
                </div>
            {{?}}
        {{??}}
            <div class="o-settings__blank">No brands found
                <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
                    <button class="a-btn a-btn--link-primary js-m-projectchooser__create" data-url="/dashboard">Create brand</button>
                    <button class="state-hidden a-btn a-btn--link-primary js-m-projectchooser__refresh"><i class="icon-refresh"></i></button>
                </div>
            </div>
        {{?}}
   </div>
    <div class="m-btn-bar m-btn-bar--centered m-btn-bar--footer">
        {{? it.projects.length > 0 }}
        <button type="submit" class="a-btn a-btn--primary">Save</button>
        {{?}}
        {{? it.current.project }}
            <button type="reset" class="a-btn a-btn--default">Cancel</button>
        {{?}}
        {{? !it.current.project && (it.brands.length === 0 || it.projects.length === 0) }}
           <button type="button" class="a-btn a-btn--default js-m-projectchooser__logout">Logout</button>
        {{?}}
    </div>
</form>
