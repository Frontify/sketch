<div class="m-conflict mod mod-conflict" data-source-id="{{= it.id }}">
    <div class="a-colorbar"></div>
    <header class="m-conflict__header">
              <h2 class="a-h2">Sync Conflict</h2>
    </header>
    <div class="m-conflict__body">
        <p class="m-conflict__paragraph">A newer version of this file is available on Frontify:</p>
        {{= window.tpl.conflictitem(it) }}
        <p class="m-conflict__paragraph">You can either <strong>overwrite</strong> the remote version on Frontify with your file or <strong>discard your local changes</strong> and replace your file with the newer version.</p>
        <p class="m-conflict__paragraph m-conflict__paragraph--small">Hint: If you are unsure, you can cancel and duplicate your current file. The duplicated file needs to be added to Frontify to be under version control.</p>
    </div>
    <div class="m-btn-bar m-btn-bar--centered m-btn-bar--footer">
       <button class="a-btn a-btn--primary js-m-conflict__push">Overwrite</button>
       <button class="a-btn a-btn--warn js-m-conflict__pull">Discard my Changes</button>
       <button class="a-btn a-btn--default js-m-modal__close">Cancel</button>
    </div>
</div>
