import {
  romNameScorer,
  setMessageAnchorId,
  settings,
  AppRegistry,
  FetchAppData,
  Resources,
  TouchOverlay,
  Unzip,
  WebrcadeApp,
  APP_TYPE_KEYS,
  LOG,
  TEXT_IDS,
} from '@webrcade/app-common';
import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';

import './App.scss';

class App extends WebrcadeApp {
  emulator = null;

  constructor() {
    super();
    this.state = {
      ...this.state,
      showCanvas: false,
    };
  }

  // Called once by Emulator.onFrame() (BasicAppWrapper) -- gates the
  // upper-right touch overlay (Pause icon) so it doesn't render before
  // the emulator itself exists, same as the other migrated GRP1 apps.
  showCanvas() {
    this.setState({ showCanvas: true });
  }

  componentDidMount() {
    super.componentDidMount();

    // Set anchor for messages
    setMessageAnchorId('js7800__screen');

    // Create the emulator
    if (this.emulator === null) {
      this.emulator = new Emulator(this, this.isDebug());
    }

    const { appProps, emulator, ModeEnum } = this;

    // Determine extensions
    const exts = AppRegistry.instance.getExtensions(
      APP_TYPE_KEYS.JS7800,
      true,
      false,
    );
    const extsNotUnique = AppRegistry.instance.getExtensions(
      APP_TYPE_KEYS.JS7800,
      true,
      true,
    );

    try {
      // Get the ROM location that was specified
      const rom = appProps.rom;
      if (!rom) throw new Error('A ROM file was not specified.');

      emulator
        .loadJs7800()
        .then(() => settings.load())
        // .then(() => settings.setBilinearFilterEnabled(true))
        // .then(() => settings.setVsyncEnabled(false))
        .then(() => new FetchAppData(rom).fetch())
        .then((response) => response.blob())
        .then((blob) =>
          new Unzip()
            .setDebug(this.isDebug())
            .unzip(blob, extsNotUnique, exts, romNameScorer),
        )
        .then((blob) => emulator.setRomBlob(blob))
        .then(() => this.setState({ mode: ModeEnum.LOADED }))
        .catch((msg) => {
          LOG.error(msg);
          this.exit(
            this.isDebug()
              ? msg
              : Resources.getText(TEXT_IDS.ERROR_RETRIEVING_GAME),
          );
        });
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

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => this.exit()}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }

  renderCanvas() {
    return (
      <div
        ref={(canvas) => {
          this.canvas = canvas;
        }}
        id="js7800__target"
      ></div>
    );
  }

  render() {
    const { mode, showCanvas } = this.state;
    const { ModeEnum } = this;

    return (
      <>
        {super.render()}
        {mode === ModeEnum.LOADING ? this.renderLoading() : null}
        {mode === ModeEnum.PAUSE ? this.renderPauseScreen() : null}
        {mode === ModeEnum.LOADED || mode === ModeEnum.PAUSE
          ? this.renderCanvas()
          : null}
        <TouchOverlay show={showCanvas} />
      </>
    );
  }
}

export default App;
