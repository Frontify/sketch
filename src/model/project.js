import fetch from '../helpers/fetch';
import target from './target';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';

class Project {
    constructor() {}

    getProjectsForBrand(brand) {
        return fetch('/v1/brand/list/?project_limit=999').then((data) => {
            let match = data.brands.find((entry) => entry.name == brand.name);

            return match.projects;
        });
    }
    getFilesAndFoldersForProjectAndFolder(legacyProjectID, legacyFolderID) {
        return new Promise((resolve, reject) => {
            // browse project
            let url = '/v1/project/browse/' + legacyProjectID;
            if (legacyFolderID) {
                url += '/' + legacyFolderID;
            }

            fetch(url)
                .then((result) => {
                    resolve({
                        folder: result.folder,
                        folders: result.folders,
                        files: result.files,
                    });
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    getProjectFolders(project, folder) {
        return new Promise((resolve, reject) => {
            // browse project
            let url = '/v1/project/browse/' + project.id;
            if (folder) {
                url += '/' + folder;
            }

            fetch(url)
                .then((result) => {
                    resolve({
                        folder: result.folder,
                        folders: result.folders,
                    });
                })
                .catch((error) => reject(error));
        });
    }

    showProjectChooser() {
        this.getProjects().then(
            function (brands) {
                target.getTarget().then(
                    function (target) {
                        target = target || {};
                        if (isWebviewPresent('frontifymain')) {
                            sendToWebview(
                                'frontifymain',
                                'showProjectChooser(' + JSON.stringify(brands) + ', ' + JSON.stringify(target) + ')'
                            );
                        }
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    showFolderChooser(folder, view) {
        target.getTarget(view).then(
            function (target) {
                this.getFolders(folder >= 0 ? folder : target.set.id).then(
                    function (folders) {
                        if (isWebviewPresent('frontifymain')) {
                            sendToWebview(
                                'frontifymain',
                                'showFolderChooser(' + JSON.stringify(folders) + ', ' + JSON.stringify(target) + ')'
                            );
                        }
                    }.bind(this)
                );
            }.bind(this)
        );
    }

    addFolder({ name, project, folder }) {
        return fetch('/v1/set/create/' + project, {
            method: 'POST',
            body: JSON.stringify({ name: name, parent: folder, color: '#EEEEEE' }),
        }).then(
            function (data) {
                return data.folder;
            }.bind(this)
        );
    }
}

export default new Project();
