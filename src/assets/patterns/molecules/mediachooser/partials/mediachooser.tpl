<div
    class="mod mod-media-chooser m-mediachooser m-mediachooser--{{= it.type }}"
    data-type="{{= it.type }}"
    >
    <form class="js-m-mediachooser__form m-mediachooser__form state-hidden">
        <div class="co-settings__fieldset co-settings__fieldset--notitle">
            {{= window.tpl.settingelemtext({
                id: 'q',
                nolive: true,
                label: 'Search images',
                placeholder: 'e.g. Business' })
            }}
        </div>
    </form>
    <div class="m-mediachooser__asset-list js-m-mediachooser__asset-list"></div>
</div>
