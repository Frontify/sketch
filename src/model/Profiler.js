export class Profiler {
    constructor() {
        this.key = '';
        this.t1 = 0;
        this.t2 = 0;
        this.silent = true;
    }
    start(key) {
        this.key = key;
        this.t1 = new Date().getTime();
    }
    end() {
        this.t2 = new Date().getTime();
        if (!this.silent) {
            console.log(`⏱ Call to { ${this.key} } took ${this.t2 - this.t1} milliseconds.`);
        }
    }
}
