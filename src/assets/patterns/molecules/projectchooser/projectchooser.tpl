<form class="m-projectchooser__form cm-setting">
    <div class="a-colorbar"></div>
    <header class="m-projectchooser__header">
        <h2 class="a-h2">Select Brand & Project</h2>
        <p class="a-p">Choose the project you are current working on</p>
    </header>
    <div class="m-projectchooser__content">
        {{= window.tpl.settingelemdropdown({ id: 'brand', label: 'Brand', value: it.current.brand.id , options: it.brands }) }}

        {{? it.projects.length > 0 }}
            {{= window.tpl.settingelemdropdown({ id: 'project', label: 'Project', value: it.current.project ? it.current.project.id : '', options: it.projects }) }}
        {{??}}
            <div class="o-settings__blank">No projects found in this brand.
                <div class="m-btn-bar m-btn-bar--centered m-btn-bar--xs">
                    <button class="a-btn a-btn--link-primary js-m-projectchooser__create-project" data-url="/brands/{{= it.current.brand.id }}/">Create project</button>
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
    </div>
</form>
