<li
    class="m-artboards__item lazyload js-m-artboards__item clearfix state-{{= it.state }} {{? it.selected }}state-selected{{?}}"
    data-id-external="{{= it.id_external }}"
    {{? it.id }}data-url="/screens/{{= it.id }}"{{?}}
    data-jets="{{! it.name.toLowerCase() }}">

    <!-- PREVIEW - image src will be replaced with correct preview once available -->
    <div class="m-artboards__preview">
        <img
            class="m-artboards__preview-image js-m-artboards__preview-image"
            src="https://duckduckgo.com/assets/logo_header.v108.svg"/>
    </div>

    <!-- DETAILS - the main artboard details -->
    <div class="m-artboards__details">
        <h3 class="m-artboards__title js-m-artboards__title" title="{{! it.name }}">{{! it.name }}</h3>
        <div class="m-artboards__states">

            <!-- Initial upload state -->
            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--uploaded
                state-{{? it.state !== 'new' }}visible{{??}}hidden{{?}}">
                {{? it.modified_localized_ago }}
                    {{= it.modified_localized_ago }}
                    {{? it.modifier_name }} by {{= it.modifier_name }}{{?}}
                {{?}}
            </span>

            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--new
                state-{{? it.state === 'new' }}visible{{??}}hidden{{?}}">
                Not yet uploaded
            </span>

            <!-- Upload state feedback -->
            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--uploading
                state-hidden">
                Uploading…
            </span>

            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--no-changes
                state-hidden">
                Nothing changed
            </span>

            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--success
                state-hidden">
                Success!
            </span>

            <span class="
                m-artboards__upload-state
                js-m-artboards__upload-state
                js-m-artboards__upload-state--failed
                state-hidden">
                FAIL!
            </span>

            <span class="m-artboards__feedback-state">
                {{? it.id }}
                <a class="m-artboards__annotation js-m-artboards__annotation" href="/screens/{{= it.id }}/annotation" >
                    <i class="m-artboards__meta-icon fi-annotations"></i>
                        {{? it.count_annotation_open }}
                            <span class="a-badge a-badge--xs a-badge--default m-artboards__annotation-badge">
                                {{= it.count_annotation_open }}
                            </span>
                        {{?}}
                    </a>
                {{?}}
            </span>
        </div>
    </div>

    <!-- ACTIONS - doing stuff to the artboard -->
    <div class="m-artboards__actions">
        <button {{? it.state == 'uploading' }}disabled{{?}} class="a-btn a-btn--xs a-btn--default js-m-artboards__upload">Upload</button>
    </div>

</li>
