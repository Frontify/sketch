{{? it.items.length > 0 }}
    {{~ it.items :asset:index }}
    <div
        class="m-mediachooser__asset-item js-m-mediachooser__asset-item"
        data-w="{{= asset.width}}"
        data-h="{{= asset.height}}"
        data-ext="{{= asset.ext }}"
        data-title="{{= asset.title }}"
        data-id="{{= asset.id }}"
        data-url="{{= asset.image_url_thumbnail }}"
    >
        {{? asset.is_video }}
            <div class="m-mediachooser__video-icon-wrap">
                <i class="icon-play"></i>
            </div>
        {{?}}
        <img data-src="{{= asset.image_url_thumbnail.replace('{width}', 400) }}" class="m-mediachooser__image lazyload" />
        <div class="m-mediachooser__image-overlay">
            <h4 class="m-mediachooser__image-title">{{! asset.title }}</h4>
            <p class="m-mediachooser__image-desc">{{? asset.is_video }}{{= asset.video_width }} x {{= asset.video_height }}{{??}}{{= asset.width }} x {{= asset.height }}{{?}}</p>
        </div>
    </div>
    {{~}}
{{??}}
    <div class="o-settings__blank">No results found</div>
{{?}}