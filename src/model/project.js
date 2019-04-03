import fetch from '../helpers/fetch'
import target from './target';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote'

class Project {
    constructor() {
    }

    getProjects() {
        return fetch('/v1/brand/list/?project_limit=999').then(function (data) {
            return data.brands;
        }.bind(this));
    }

    getFolders(folder) {
       return target.getSimpleTarget().then(function (target) {
           // browse project
           let url = '/v1/project/browse/' + target.project;
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

    showProjectChooser() {
        this.getProjects().then(function (brands) {
            target.getTarget().then(function (target) {
                target = target || {};
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showProjectChooser(' + JSON.stringify(brands) + ', ' + JSON.stringify(target) + ')');
                }
            }.bind(this));
        }.bind(this));
    }

    showFolderChooser(folder, view) {
        target.getTarget(view).then(function (target) {
            this.getFolders(folder >= 0 ? folder : target.set.id).then(function (folders) {
                if (isWebviewPresent('frontifymain')) {
                    sendToWebview('frontifymain', 'showFolderChooser(' + JSON.stringify(folders) + ', ' + JSON.stringify(target) + ')');
                }
            }.bind(this));
        }.bind(this));
    }

    addFolder(name, folder) {
        return target.getSimpleTarget().then(function(target) {
            return fetch('/v1/set/create/' + target.project, {
                method: 'POST',
                body: JSON.stringify({name: name, parent: folder, color: '#EEEEEE' })
            }).then(function (data) {
                return data.folder;
            }.bind(this));
        }.bind(this));
    }
}

export default new Project();
