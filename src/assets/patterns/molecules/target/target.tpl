<div class="m-target__target">
    <div class="m-target__action">
        <div class="m-btn-dropdown">
            <a class="a-btn a-btn--link a-btn--xl js-m-btn-dropdown__toggle">
                <i class="fi-settings"></i>
            </a>
            <ul class="m-btn-dropdown__menu js-m-btn-dropdown__menu m-target__menu">
                <li class="m-btn-dropdown__item">
                    <a class="m-btn-dropdown__link js-m-target__change-project">Change Project</a>
                </li>
                <li class="m-btn-dropdown__item">
                    <a href="https://help.frontify.com/faq-workspace/how-to-use-the-frontify-sketch-plugin" class="m-btn-dropdown__link js-m-target__help">Help</a>
                </li>
                <li class="m-btn-dropdown__item m-btn-dropdown__item--danger">
                    <a class="m-btn-dropdown__link js-m-target__logout">Logout</a>
                </li>
            </ul>
        </div>
    </div>
    <div class="m-target__left js-m-target__change-project">
        <div class="m-target__logo-wrap">
            <img class="m-target__logo" style="background: {{= it.brand.color }}" src="{{= it.brand.image }}"/>
        </div>
    </div>
    <div class="m-target__content js-m-target__change-project">
        <h3 class="m-target__brand">{{= it.brand.name }}</h3>
        <h4 class="m-target__project">{{= it.project.name }}</h4>
    </div>
</div>