<header class="o-login__header">
    <img src="../images/animation@2x.gif" class="o-login__icon" />
</header>

<form class="js-o-login__form cm-setting">
    {{= window.tpl.settingelemtext({ required: true, id: 'domain', label: 'Your Frontify Domain', placeholder: 'e.g. https://company-1234.frontify.com'}) }}
    <div class="m-btn-bar o-login__btn-bar m-btn-bar--centered">
        <button type="submit" class="a-btn a-btn--primary">Get Started</button>
    </div>
</form>
<footer class="o-login__footer">
   <p class="o-login__p">Not sure what to do?</p>
   <p class="o-login__p"><a class="o-login__link js-o-login__link" href="https://sketch.frontify.com/">Get help</a> or <a class="o-login__link js-o-login__link" href="https://frontify.com/signup">create an account</a></p>
</footer>