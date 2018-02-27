import fetch from '../helpers/fetch'
import target from './target';

class Project {
    constructor() {
        this.context = null;
    }

    setContext(context) {
        this.context = context;
    }

    getProjects() {
        return fetch('/v1/brand/list/').then(function (data) {
            return data.brands;
        }.bind(this));
    }

    getFolders(folder) {
       return target.getSimpleTarget().then(function (target) {
           // browse project
           var url = '/v1/project/browse/' + target.project;
           if (folder) {
               url += '/' + folder;
           }

           return fetch(url).then(function (result) {
               return {
                   folder: result.folder,
                   folders: result.folders
               };
           }.bind(this));
       }.bind(this));
    }

    showProjectChooser(ui) {
        this.getProjects().then(function (brands) {
            target.getTarget().then(function (target) {
                target = target || {};
                ui.eval('showProjectChooser(' + JSON.stringify(brands) + ', ' + JSON.stringify(target) + ')');
            }.bind(this));
        }.bind(this));
    }

    showFolderChooser(ui, folder, view) {
        target.getTarget(view).then(function (target) {
            this.getFolders(folder >= 0 ? folder : target.set.id).then(function (folders) {
                ui.eval('showFolderChooser(' + JSON.stringify(folders) + ', ' + JSON.stringify(target) + ')');
            }.bind(this));
        }.bind(this));
    }
}

export default new Project();