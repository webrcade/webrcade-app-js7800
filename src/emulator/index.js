import {
  addDebugDiv,
  settings,
  AppWrapper,
  Controller,
  Controllers,
  DefaultKeyCodeToControlMapping,
  Resources,
  CIDS,
  LOG,
  TEXT_IDS,
} from "@webrcade/app-common"

export class Emulator extends AppWrapper {
  constructor(app, debug = false) {
    super(app, debug);

    this.js7800 = null;
    this.romBlob = null;
    this.debugDiv = null;

    if (this.debug) {
      this.debugDiv = addDebugDiv();
    }
  }

  createControllers() {
    this.controller1 = new Controller(new DefaultKeyCodeToControlMapping());
    return new Controllers([
      this.controller1,
      new Controller()
    ]);
  }

  createStorage() {
    // no storage
    return null;
  }

  createVisibilityMonitor() {
    // no visibility monitor necessary
    return null;
  }

  createAudioProcessor() {
    // no audio processor necessary
    return null;
  }

  onPause(p) {
    const { Main } = this.js7800;
    Main.setAllowUnpause(!p);
    Main.pause(p);
  }

  setRomBlob(blob) {
    if (blob.size === 0) {
      throw new Error("The size is invalid (0 bytes).");
    }
    this.romBlob = blob;
  }

  // TODO:
  // | 15 | Console | Left Difficulty
  // | 16 | Console | Right Difficulty

  pollControls = (input, isDual, isSwap) => {
    const { controllers, controller1 } = this;

    controllers.poll();

    for (let i = 0; i < 2; i++) {
      if (controllers.isControlDown(i, CIDS.ESCAPE)) {
        if (this.pause(true)) {
          controllers.waitUntilControlReleased(i, CIDS.ESCAPE)
            .then(() => this.showPauseMenu());
          return;
        }
      }

      const offset = i * 6;
      input[0 + offset] = controllers.isControlDown(i, CIDS.RIGHT) ||
        (isDual && i && controller1.isAxisRight(1));
      input[1 + offset] = controllers.isControlDown(i, CIDS.LEFT) ||
        (isDual && i && controller1.isAxisLeft(1));
      input[2 + offset] = controllers.isControlDown(i, CIDS.DOWN) ||
        (isDual && i && controller1.isAxisDown(1));
      input[3 + offset] = controllers.isControlDown(i, CIDS.UP) ||
        (isDual && i && controller1.isAxisUp(1));
      input[4 + offset] = controllers.isControlDown(i, isSwap ? CIDS.B : CIDS.A);
      input[5 + offset] = controllers.isControlDown(i, isSwap ? CIDS.A : CIDS.B);
    }

    // Reset
    input[12] = controllers.isControlDown(0, CIDS.START) ||
      controllers.isControlDown(1, CIDS.START);

    // Select
    input[13] = controllers.isControlDown(0, CIDS.SELECT) ||
      controllers.isControlDown(1, CIDS.SELECT);
  }

  loadJs7800() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      document.body.appendChild(script);
      script.src = 'js/js7800.min.js';
      script.async = true;
      script.onload = () => {
        const js7800 = window.js7800;
        if (js7800) {
          this.js7800 = js7800;
          resolve(js7800);
        } else {
          reject('An error occurred loading the Atari 7800 module');
        }
      };
    });
  }

  getCart = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject("Error reading cartridge: " + reader.error);
      };

      reader.onload = () => {
        const result = reader.result;
        const len = result.length;
        const cart = new Array(len);
        for (let i = 0; i < len; i++) {
          cart[i] = result.charCodeAt(i);
        }
        resolve(cart);
      };
      reader.readAsBinaryString(blob);
    });
  };

  async onStart(canvas) {
    const { app, js7800, romBlob } = this;
    const { Audio, Input, Main, Region, Video } = js7800;

    if (this.debug) {
      Main.setDebugCallback((dbg) => {
        this.debugDiv.innerHTML = dbg;
      });
    }

    Audio.setCallback((running) => {
      setTimeout(() => app.setShowOverlay(!running), 50);
    });

    const props = { noTitle: true, debug: this.debug };
    Main.init('js7800__target', props);
    // TODO: High scores support currently disabled
    Main.setHighScoreCallback(new Main.HighScoreCallback());
    Main.setErrorHandler((e) => { app.exit(e); /* TODO: What about this */ });
    Input.setPollInputCallback(this.pollControls);
    Region.setPaletteIndex(0);
    // Bilinear filter
    Video.setFilterEnabled(settings.isBilinearFilterEnabled());

    try {
      const cart = await this.getCart(romBlob);
      Main.startEmulation(cart);
    } catch (e) {
      LOG.error(e);
      app.exit(Resources.getText(TEXT_IDS.ERROR_LOADING_GAME));
    }
  }
}
