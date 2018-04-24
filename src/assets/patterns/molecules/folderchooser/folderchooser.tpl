<form class="m-folderchooser__form">
    <div class="a-colorbar"></div>
    <div class="m-folderchooser__target js-m-folderchooser__target" {{? it.folder }}data-id="{{= it.folder.id }}"{{?}}>
        {{? it.folder }}
            <a class="m-folderchooser__action js-m-folderchooser__back" {{? it.folder }}data-parent="{{= it.folder.parent }}"{{?}}>
                <i class="icon-long-arrow-left"></i>
            </a>
            <div class="m-folderchooser__content">
                <div class="m-folderchooser__type"><i class="fi-folder"></i></div>
                <h3 class="m-folderchooser__name m-folderchooser__name--target">{{= it.folder.name }}</h3>
            </div>
        {{??}}
            <div class="m-folderchooser__content">
               <div class="m-folderchooser__type"><i class="fi-projects"></i></div>
               <h3 class="m-folderchooser__name m-folderchooser__name--target">/</h3>
            </div>
        {{?}}
    </div>
    <ul class="m-folderchooser__list">
        {{? it.folders.length > 0 }}
            {{~ it.folders :folder }}
                <li class="m-folderchooser__item js-m-folderchooser__item" data-id="{{= folder.id }}">
                    <div class="m-folderchooser__type"><i class="fi-folder"></i>{{? folder.color }}<em class="m-folderchooser__color" style="background: {{= folder.color }}"></em>{{?}}</div>
                    <h3 class="m-folderchooser__name">{{= folder.name }}</h3>
                </li>
            {{~}}
        {{?}}
        <li class="m-folderchooser__item m-folderchooser__item--create">
           <div class="m-folderchooser__type"><i class="fi-folder"></i></div>
           <input class="m-folderchooser__name js-m-folderchooser__folder-create" placeholder="Create new folder" />
        </li>
    </ul>
    <div class="m-btn-bar m-btn-bar--centered m-btn-bar--footer">
       <button type="submit" class="a-btn a-btn--primary">Select</button>
       {{? it.current.set }}
            <button type="reset" class="a-btn a-btn--default">Cancel</button>
       {{?}}
    </div>
</form>