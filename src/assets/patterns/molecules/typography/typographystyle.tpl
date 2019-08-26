{{ let color = null; }}
{{? it.style.colors && !$.isEmptyObject(it.style.colors.foreground) }}
  {{ for(let id in it.style.colors.foreground) { }}
      {{? it.style.colors.foreground.hasOwnProperty(id) }}
          {{ color = it.colors[id]; }}
      {{?}}
  {{ } }}
{{?}}
<div class="m-typography__style js-m-typography__style {{? color && color.light }}state-light{{?}}" {{? color }}data-color="{{= color.id }}"{{?}} data-group="{{= it.group }}" data-id="{{= it.style.id }}">
    <h4 class="m-typography__style-name"><i class="m-typography__info icon-align-{{= it.style.align ? it.style.align.toLowerCase() : 'left' }}"></i> {{= it.style.name || 'Untitled Style' }}</h4>
    <div class="m-typography__example-wrap">
        {{? it.style.colors && !$.isEmptyObject(it.style.colors.foreground) }}
           <ul class="m-typography__colors">
               {{ for(let id in it.style.colors.foreground) { }}
                   {{? it.style.colors.foreground.hasOwnProperty(id) }}
                       {{ let current = it.colors[id]; }}
                       <li class="m-typography__color js-m-typography__color {{? current.id == color.id }}state-active{{?}}" data-id="{{= id }}" style="background: {{= current.hex }}"></li>
                   {{?}}
               {{ } }}
           </ul>
       {{?}}
        <p class="m-typography__example js-m-typography__example" style="
            {{? it.style.family }}font-family: '{{= it.style.family }}';{{?}}
            {{? it.style.size }}font-size: {{= it.style.size }}{{= it.style.size_unit || 'px'}};{{?}}
            {{? it.style.weight }}font-weight: {{= it.style.weight }};{{?}}
            {{? it.style.line_height }}line-height: {{= it.style.line_height }}{{= it.style.line_height_unit || 'em'}};{{?}}
            {{? it.style.transform }}text-transform: {{= it.style.transform }};{{?}}
            {{? it.style.style }}font-style: {{= it.style.style }};{{?}}
            {{? it.style.decoration }}text-decoration: {{= it.style.decoration }};{{?}}
            {{? it.style.spacing }}letter-spacing: {{= it.style.spacing }}{{= it.style.spacing_unit || '%'}};{{?}}
            {{? color }}color: {{= color.css_value }};{{?}}
                ">
            {{= it.style.example || 'Untitled Style' }}
        </p>


    </div>
    {{? it.style.description }}
        <p class="m-typography__style-desc">{{= it.style.description }}</p>
    {{?}}
</div>
