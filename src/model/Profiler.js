import { frontend } from '../helpers/ipc';

const isDev = process.env.NODE_ENV == 'development';

export class Profiler {
    constructor() {
        this.key = '';
        this.t1 = 0;
        this.t2 = 0;
        this.log = false;
        this.broadcast = true;
    }
    start(key) {
        this.key = key;
        this.t1 = new Date().getTime();
    }
    end() {
        this.t2 = new Date().getTime();

        if (isDev) {
            if (this.log) {
                console.log(`⏱ Call to { ${this.key} } took ${this.t2 - this.t1} milliseconds.`);
            }
            if (this.broadcast) {
                frontend.send('log', {
                    title: this.key,
                    duration: this.t2 - this.t1,
                    timestamp: new Date().toLocaleTimeString(),
                });
            }
        }
    }
}
