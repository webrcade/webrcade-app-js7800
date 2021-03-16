import {
  CIDS,
  Controller,
  Controllers,
  DefaultKeyCodeToControlMapping,
} from "@webrcade/app-common"

export class Emulator {
  constructor(app, debug = false) {
    this.controller1 = new Controller(new DefaultKeyCodeToControlMapping());
    this.controllers = new Controllers([
      this.controller1,
      new Controller()
    ]);

    this.app = app;
    this.js7800 = null;
    this.romBlob = null;
    this.debug = debug;
  }

  setRomBlob(blob) {      
    console.log(blob);  
    if (blob.size === 0) {
      throw new Error("The size is invalid (0 bytes).");
    }
    this.romBlob = blob;
  }
  
  // TODO:
  // | 15 | Console | Left Difficulty
  // | 16 | Console | Right Difficulty

  pollControls = (input, isDual, isSwap) => {
    const { app, controllers, controller1 } = this;

    controllers.poll();
    for (let i = 0; i < 2; i++) {
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
      if (controllers.isControlDown(i, CIDS.ESCAPE)) {
        app.exit();
      }
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
          this.js7800 =  js7800;
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

  async start() {
    const { js7800, romBlob, app } = this;
    const { Main, Region, Input } = js7800;

    const props = { noTitle: true };
    Main.init('js7800__target', props);
    // TODO: High scores support currently disabled
    Main.setHighScoreCallback(new Main.HighScoreCallback());
    Main.setErrorHandler((e) => { app.exit(e); });
    Input.setPollInputCallback(this.pollControls);
    Region.setPaletteIndex(0);

    try {
        const cart = await this.getCart(romBlob);
        Main.startEmulation(cart);
    } catch (e) {
      app.exit(e);
    }
  }
}
