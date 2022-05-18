import { getSelectedArtboards } from './actions/getSelectedArtboards';
import { Settings } from 'sketch';

// Message helper
import { frontend } from '../helpers/ipc';

class State {
    constructor() {
        this.state = {
            artboards: [],
            selectedArtboards: [],
            transfers: {},
        };
    }

    getState() {
        return Settings.sessionVariable('state');
    }

    progressEvent({ artboard, data }) {
        let { artboards } = this.getState();
        let newState = artboards.map((entry) => {
            if (entry.id == artboard.id) {
                // update progress
                entry.name = Math.random();
            }
            return entry;
        });
        this.setState({ artboards: newState });
    }

    /**
     * selectionChangedCommand
     */
    selectionChangedCommand(newSelection) {
        let { artboards } = getSelectedArtboards();
        this.setState({ artboards });
    }
    /**
     * We can use this function to update the state and automatically notify React about the new state.
     * The state is persisted between plugin runs, by using a Session Variable.
     */

    setState(newState) {
        let oldState = Settings.sessionVariable('state');
        let state = { ...oldState, ...newState };
        Settings.setSessionVariable('state', state);
        frontend.send('tick', { value: state });
    }
}

export default new State();
