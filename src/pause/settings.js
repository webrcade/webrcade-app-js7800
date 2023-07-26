import React from 'react';
import { Component } from 'react';

import {
  AppDisplaySettingsTab,
  EditorScreen,
  FieldsTab,
  FieldRow,
  FieldLabel,
  FieldControl,
  TelevisionWhiteImage,
  GamepadWhiteImage,
  Select,
  Switch,
  WebrcadeContext,
} from '@webrcade/app-common';

export class AtariSettingsEditor extends Component {
  constructor() {
    super();
    this.state = {
      tabIndex: null,
      focusGridComps: null,
      values: {},
    };
  }

  componentDidMount() {
    const { emulator } = this.props;

    this.setState({
      values: {
        // colorSwitch: emulator.getColorSwitch(),
        leftDiffSwitch: emulator.getLeftDifficulty(),
        rightDiffSwitch: emulator.getRightDifficulty(),
        dualAnalog: emulator.isDualAnalog(),
        origBilinearMode: emulator.getPrefs().isBilinearEnabled(),
        bilinearMode: emulator.getPrefs().isBilinearEnabled(),
        origScreenSize: emulator.getPrefs().getScreenSize(),
        screenSize: emulator.getPrefs().getScreenSize(),
      },
    });
  }

  render() {
    const { emulator, onClose } = this.props;
    const { tabIndex, values, focusGridComps } = this.state;

    const setFocusGridComps = (comps) => {
      this.setState({ focusGridComps: comps });
    };

    const setValues = (values) => {
      this.setState({ values: values });
    };

    return (
      <EditorScreen
        showCancel={true}
        onOk={() => {
        //   emulator.setColorSwitch(values.colorSwitch);
          emulator.setLeftDifficulty(values.leftDiffSwitch);
          emulator.setRightDifficulty(values.rightDiffSwitch);
          emulator.setDualAnalog(values.dualAnalog);
          let updated = false;
          if (values.origBilinearMode !== values.bilinearMode) {
            emulator.getPrefs().setBilinearEnabled(values.bilinearMode);
            emulator.updateBilinearFilter();
            updated = true;
          }
          if (values.origScreenSize !== values.screenSize) {
            emulator.getPrefs().setScreenSize(values.screenSize);
            emulator.updateScreenSize();
            updated = true;
          }
          if (updated) {
            emulator.getPrefs().save();
          }
          onClose();
        }}
        onClose={onClose}
        focusGridComps={focusGridComps}
        onTabChange={(oldTab, newTab) => this.setState({ tabIndex: newTab })}
        tabs={[
          {
            image: GamepadWhiteImage,
            label: 'Atari 7800 Settings (Session only)',
            content: (
              <AtariSettingsTab
                emulator={emulator}
                isActive={tabIndex === 0}
                setFocusGridComps={setFocusGridComps}
                values={values}
                setValues={setValues}
              />
            ),
          },
          {
            image: TelevisionWhiteImage,
            label: 'Display Settings',
            content: (
              <AppDisplaySettingsTab
                emulator={emulator}
                isActive={tabIndex === 1}
                setFocusGridComps={setFocusGridComps}
                values={values}
                setValues={setValues}
              />
            ),
          }
        ]}
      />
    );
  }
}

class AtariSettingsTab extends FieldsTab {
  constructor() {
    super();
    // this.colorSwitchRef = React.createRef();
    this.leftDiffSwitchRef = React.createRef();
    this.rightDiffSwitchRef = React.createRef();
    this.dualAnalogRef = React.createRef();
    this.gridComps = [/*[this.colorSwitchRef],*/
        [this.leftDiffSwitchRef],
        [this.rightDiffSwitchRef],
        [this.dualAnalogRef]
    ];
  }

  componentDidUpdate(prevProps, prevState) {
    const { gridComps } = this;
    const { setFocusGridComps } = this.props;
    const { isActive } = this.props;

    if (isActive && isActive !== prevProps.isActive) {
      setFocusGridComps(gridComps);
    }
  }

  render() {
    const { /*colorSwitchRef,*/ leftDiffSwitchRef, rightDiffSwitchRef, dualAnalogRef } = this;
    const { focusGrid } = this.context;
    const { setValues, values } = this.props;

    return (
      <>
        {/* <FieldRow>
          <FieldLabel>Color Switch</FieldLabel>
          <FieldControl>
          <Select
              ref={colorSwitchRef}
              options={[
                { value: "color", label: "Color"},
                { value: "b&w", label: "B&W"}
              ]}
              onChange={(value) => {
                setValues({
                  ...values,
                  ...{ colorSwitch: value},
                });
              }}
              value={values.colorSwitch}
              onPad={(e) => focusGrid.moveFocus(e.type, colorSwitchRef)}
            />
          </FieldControl>
        </FieldRow> */}
        <FieldRow>
          <FieldLabel>Left Diff. Switch</FieldLabel>
          <FieldControl>
          <Select
              ref={leftDiffSwitchRef}
              options={[
                { value: "a", label: "A"},
                { value: "b", label: "B"}
              ]}
              onChange={(value) => {
                setValues({
                  ...values,
                  ...{ leftDiffSwitch: value},
                });
              }}
              value={values.leftDiffSwitch}
              onPad={(e) => focusGrid.moveFocus(e.type, leftDiffSwitchRef)}
            />
          </FieldControl>
        </FieldRow>
        <FieldRow>
          <FieldLabel>Right Diff. Switch</FieldLabel>
          <FieldControl>
          <Select
              ref={rightDiffSwitchRef}
              options={[
                { value: "a", label: "A"},
                { value: "b", label: "B"}
              ]}
              onChange={(value) => {
                setValues({
                  ...values,
                  ...{ rightDiffSwitch: value},
                });
              }}
              value={values.rightDiffSwitch}
              onPad={(e) => focusGrid.moveFocus(e.type, rightDiffSwitchRef)}
            />
          </FieldControl>
        </FieldRow>
        <FieldRow>
          <FieldLabel>Dual Analog</FieldLabel>
          <FieldControl>
          <Switch
              ref={dualAnalogRef}
              onChange={(e) => {
                setValues({
                  ...values,
                  ...{ dualAnalog: e.target.checked},
                })
              }}
              checked={values.dualAnalog}
              onPad={(e) => focusGrid.moveFocus(e.type, dualAnalogRef)}
            />
          </FieldControl>
        </FieldRow>
      </>
    );
  }
}
AtariSettingsTab.contextType = WebrcadeContext;

