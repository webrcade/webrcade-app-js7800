import { WebrcadeApp, FetchAppData, Unzip } from '@webrcade/app-common'
import { Emulator } from './emulator'

import './App.scss';
import '@webrcade/app-common/dist/index.css'

class App extends WebrcadeApp {
  emulator = new Emulator(this);

  componentDidMount() {
    super.componentDidMount();

    const { appProps, emulator, ModeEnum } = this;

    // Get the ROM location that was specified
    const rom = appProps.rom;
    if (!rom) throw new Error("A ROM file was not specified.");

    emulator.loadJs7800()
      .then(() => new FetchAppData(rom).fetch())    
      .then(response => response.blob())
      .then(blob => Unzip.unzip(blob, [".a78", ".bin"], [".a78"]))
      .then(blob => emulator.setRomBlob(blob))
      .then(() => this.setState({ mode: ModeEnum.LOADED }))
      .catch(msg => {
        this.exit("Error fetching ROM: " + msg);
      })
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
        { mode === ModeEnum.LOADING ? this.renderLoading() : null}
        { mode === ModeEnum.LOADED ? this.renderCanvas() : null}
      </>
    );
  }
}

export default App;
