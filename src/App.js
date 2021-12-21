import { 
  romNameScorer,
  AppRegistry,
  FetchAppData,
  Resources, 
  Unzip, 
  WebrcadeApp, 
  APP_TYPE_KEYS,  
  LOG,
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

    // Determine extensions              
    const exts = 
      AppRegistry.instance.getExtensions(APP_TYPE_KEYS.JS7800, true, false);
    const extsNotUnique = 
      AppRegistry.instance.getExtensions(APP_TYPE_KEYS.JS7800, true, true);    

    try {
      // Get the ROM location that was specified
      const rom = appProps.rom;
      if (!rom) throw new Error("A ROM file was not specified.");

      emulator.loadJs7800()
        .then(() => new FetchAppData(rom).fetch())
        .then(response => response.blob())
        .then(blob => new Unzip().setDebug(this.isDebug()).unzip(blob, extsNotUnique, exts, romNameScorer))
        .then(blob => emulator.setRomBlob(blob))
        .then(() => this.setState({ mode: ModeEnum.LOADED }))
        .catch(msg => {
          LOG.error(msg);
          this.exit(this.isDebug() ? msg : Resources.getText(TEXT_IDS.ERROR_RETRIEVING_GAME));
        })
    } catch (e) {
      this.exit(e);
    }
  }

  componentDidUpdate() {
    const { mode } = this.state;
    const { emulator, ModeEnum } = this;

    if (mode === ModeEnum.LOADED) {
      window.focus();
      // Start the emulator
      emulator.start(this.canvas);
    }
  }

  renderCanvas() {
    return (
      <div ref={canvas => { this.canvas = canvas; }} id="js7800__target"></div>
    );
  }

  render() {
    const { mode } = this.state;
    const { ModeEnum } = this;

    return (
      <>
        { super.render()}
        { mode === ModeEnum.LOADING ? this.renderLoading() : null}
        { mode === ModeEnum.PAUSE ? this.renderPauseScreen() : null}
        { mode === ModeEnum.LOADED || mode === ModeEnum.PAUSE ? this.renderCanvas() : null}
      </>
    );
  }
}

export default App;
