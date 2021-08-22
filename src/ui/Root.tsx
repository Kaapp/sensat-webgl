import * as React from 'react';
import { BufferAttribute, Color, Intersection } from 'three';
import { Viewer } from '../app/Viewer';
import { isBufferAttribute, isPoints } from '../typeGuards';
import { getHexValueFromColourString, HEX_COLOUR_REGEX } from '../utils';
import './Root.css';

export interface RootProps {
  /**
   * Reference to the app's main renderer in order to obtain bi-directional communication.
   */
  viewer: Viewer;
}

export interface RootState {
  /**
   * The currently selected point
   */
  selectedPoint: Intersection;

  /**
   * The currently selected point colour
   */
  selectedPointColour: string;
}

export class Root extends React.Component<RootProps, RootState> {
  constructor(props) {
    super(props);

    this.state = {
      selectedPoint: null,
      selectedPointColour: ""
    };

    this.viewer = props.viewer;
    this.viewer.setUiRoot(this);
  }

  /**
   * Reference to the app's main renderer in order to obtain bi-directional communication.
   */
  protected viewer: Viewer;

  /**
   * Updates the selected point colour based on the supplied value, if valid.
   * @param event The React change event
   */
  protected _onPointColourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const colour = event.target.value;
    
    if (colour.match(HEX_COLOUR_REGEX)) {
      this.setState({
        selectedPointColour: event.target.value
      });

      const colours = this._getColourBufferAttributeFromSelectedPoint(this.state.selectedPoint),
        newColour = new Color(getHexValueFromColourString(colour));

      // Colours are stored [0-1] by Color class but [0-255] in shader attributes
      colours.setXYZ(this.state.selectedPoint.index, 255 * newColour.r, 255 * newColour.g, 255 * newColour.b);
    }
  }

  public render() {
    return (
      <div className='ui-container'>
        {this.state.selectedPoint && 
          <div className='selected-point-container'>
            Selected point details:
            <div className='selected-point-detail'>Point: {JSON.stringify(this.state.selectedPoint.point)}</div>
            <div className='selected-point-detail'>Distance to point: {this.state.selectedPoint.distance}</div>
            <div className='selected-point-detail'>Point index: {this.state.selectedPoint.index}</div>
            <div className='selected-point-detail'>Source cloud: {this.state.selectedPoint.object.name}</div>
            <div className='selected-point-detail'>Point colour: <input onChange={this._onPointColourChange} value={this.state.selectedPointColour} /></div>
          </div>
        }
      </div>
    )
  }

  /**
   * Sets the currently selected point in the UI.
   * @param selectedPoint The newly selected point 
   */
  public setSelectedPoint(selectedPoint: Intersection): void {
    if (!selectedPoint) {
      this.setState({
        selectedPoint,
        selectedPointColour: ""
      });
      return;
    }

    const colours = this._getColourBufferAttributeFromSelectedPoint(selectedPoint),
      pointColour = new Color();

    pointColour.fromBufferAttribute(colours, selectedPoint.index);

    this.setState({
      selectedPoint,
      selectedPointColour: pointColour.getHexString()
    });
  }

  /**
   * Gets the 'color' buffer attribute from the supplied intersection.
   * @param selectedPoint A selected point intersection to retrieve colours for
   * @returns The buffer attribute containing the colours for the supplied intersection.
   */
  protected _getColourBufferAttributeFromSelectedPoint(selectedPoint: Intersection): BufferAttribute {    
    const obj = selectedPoint.object;

    if (!isPoints(obj)) {
      // We should only find points in the model
      throw new Error(`Tried to setSelectedPoint but the supplied intersection was not a 'Points' object.`)
    }

    const colours = obj.geometry.getAttribute('color');

    if (!isBufferAttribute(colours)) {
      throw new Error(`Found an interleaved buffer attribute where a non-interleaved buffer `
        + `attribute was expected when extracting colour from selected point.`);
    }

    return colours;
  }
}