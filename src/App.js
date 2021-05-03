import { 
  WebrcadeApp, 
  FetchAppData, 
  Unzip, 
  Resources, 
  TEXT_IDS 
} from '@webrcade/app-common'
import { Emulator } from './emulator'

import './App.scss';

class App extends WebrcadeApp {
  emulator = null;

  componentDidMount() {
    super.componentDidMount();

    // Create the emulator
    if (this.emulator === null) {
      this.emulator = new Emulator(this, this.isDebug());
    }

    const { appProps, emulator, ModeEnum } = this;

    try {
      // Get the ROM location that was specified
      const rom = appProps.rom;
      if (!rom) throw new Error("A ROM file was not specified.");

      emulator.loadJs7800()
        .then(() => new FetchAppData(rom).fetch())
        .then(response => response.blob())
        .then(blob => new Unzip().unzip(blob, [".a78", ".bin"], [".a78"]))
        .then(blob => emulator.setRomBlob(blob))
        .then(() => this.setState({ mode: ModeEnum.LOADED }))
        .catch(msg => {
          console.error(msg); // TODO: Proper logging
          this.exit(Resources.getText(TEXT_IDS.ERROR_RETRIEVING_GAME));
        })
    } catch (e) {
      this.exit(e);
    }
  }

  componentDidUpdate() {
    const { mode } = this.state;
    const { ModeEnum, emulator } = this;

    if (mode === ModeEnum.LOADED) {
      window.focus();
      // Start the emulator
      emulator.start();
    }
  }

  renderCanvas() {
    return (
      <div id="js7800__target"></div>
    );
  }

  render() {
    const { mode } = this.state;
    const { ModeEnum } = this;

    return (
      <>
        { super.render()}
        { mode === ModeEnum.LOADING ? this.renderLoading() : null}
        { mode === ModeEnum.LOADED ? this.renderCanvas() : null}
      </>
    );
  }
}

export default App;
