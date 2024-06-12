import { Signal } from './libs/signals.module.js';

const signals = {
    showForkButton: new Signal(),
    transformModeChanged: new Signal(),
    spaceChanged: new Signal(),
    forkAction: new Signal()
};

export { signals };