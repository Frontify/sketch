Tc.Module.ProjectChooser = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.settings = null;

        callback();
    },

    render: function (brands, current) {
        let $ctx = this.$ctx;
        let projects = [];
        let currentBrand = null;

        if (current.brand) {
            currentBrand = brands.find(function (brand) {
                return current.brand.id == brand.id;
            }.bind(this));
        }
        else if(brands.length > 0) {
            currentBrand = brands[0];
        }
        else {
            currentBrand = { projects: [] }
        }

        if (currentBrand) {
            projects = currentBrand.projects;
        }

        current = {
            brand: currentBrand,
            project: current ? current.project : projects.length > 0 ? projects[0] : null
        };

        // preprocess brands and projects for dropdown use
        brands = brands.map(function (brand) {
          brand.value = brand.id;
          return brand;
        }.bind(this));

        if (projects) {
          projects = projects.map(function (project) {
              project.value = project.id;
              return project;
          }.bind(this));
        }

        let $content = $(window.tpl.projectchooser({brands: brands, projects: projects, current: current }));

        $content.on('click', '.js-m-projectchooser__create', function(e) {
            let $this = $(e.currentTarget);
            let $refresh = $content.find('.js-m-projectchooser__refresh');

            $this.addClass('state-hidden');
            $refresh.removeClass('state-hidden');

            window.postMessage('openUrl', $this.data('url'));
            e.preventDefault();
        }.bind(this));

        $content.on('click', '.js-m-projectchooser__logout', function(e) {
            window.postMessage('logout');
        }.bind(this));

        $content.on('click', '.js-m-projectchooser__refresh', function(e) {
            window.postMessage('changeProject');
        }.bind(this));

        this.fire('openModal', { modifier: 'default', $content: $content, closeable: false });

        this.settings = new Tc.Module.Settings($content, this.sandbox);
        this.settings.validation(function () {
            this.save();
        }.bind(this), function () {
            this.fire('closeModal', ['events']);
        }.bind(this));

        let brand = this.settings.getElem('brand');
        brand.changed = function (data) {
            current.brand = { id : data.brand };
            current.set = { id : 0, path: '/' };
            this.render(brands, current);
        }.bind(this);

        let project = this.settings.getElem('project');
        project.changed = function (data) {
            current.project = { id: data.project };
            current.set = { id : 0, path: '/' };
            this.render(brands, current);
        }.bind(this);
    },

    save: function () {
        let data = this.settings.serialize();
        this.fire('closeModal', ['events']);
        window.postMessage('projectSelected', data);
    }
});
