import * as React from 'react';
import { BufferAttribute, Color, Intersection } from 'three';
import { Viewer } from '../app/Viewer';
import { isBufferAttribute, isPoints } from '../typeGuards';
import { formatVector3String, getHexValueFromColourString, getPointLocationFromIntersection, HEX_COLOUR_REGEX } from '../utils';
import './Root.css';

export interface RootProps {
  /**
   * Reference to the app's main renderer in order to obtain bi-directional communication.
   */
  viewer: Viewer;
}

export interface RootState {
  /**
   * Whether or not the user is currently measuring points
   */
  isMeasuringMode: boolean;

  /**
   * A tuple containing the start and end points of the last measurement made.
   */
  measureData: [Intersection, Intersection];

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
      isMeasuringMode: false,
      measureData: [null, null],
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

  public componentDidUpdate(prevProps: Readonly<RootProps>, prevState: Readonly<RootState>) {
    this.viewer.setMeasuringLineLocation(...this.state.measureData);
  }

  public render() {
    const [ startMeasurePoint, endMeasurePoint ] = this.state.measureData;

    return (
      <div className='ui-container'>
        <div className='selected-point-container'>
          <span>Selected point details:</span>
          <div className='selected-point-detail'>Point: {formatVector3String(getPointLocationFromIntersection(this.state.selectedPoint))}</div>
          <div className='selected-point-detail'>Point index: {this.state.selectedPoint?.index}</div>
          <div className='selected-point-detail'>Source cloud: {this.state.selectedPoint?.object.name}</div>
          <div className='selected-point-detail'>Point colour: <input onChange={this._onPointColourChange} value={this.state.selectedPointColour} /></div>
        </div>
        <div className='measuring-container'>
          <div onClick={this._toggleMeasuringMode} className={`measure-button ${this.state.isMeasuringMode ? 'selected' : ''}`}>
            <img className='measure-icon' src="assets/ruler.svg" />
            <span className='measure-text'>{this.state.isMeasuringMode ? 'Measuring' : 'Measure'}</span>
          </div>
          <div className='measuring-data-container'>
            {this.state.measureData.map((value, index) => {
              if (!value) {
                return null;
              }

              // Wouldn't normally use an index as a key, but here it's OK as we don't reorder the divs
              return (
                <div key={index} className='measuring-point'>
                  Point {index + 1}: {formatVector3String(getPointLocationFromIntersection(value))}
                </div>
              );
            })}
            {endMeasurePoint !== null && 
              <div className='measuring-result'>
                Distance between points:&nbsp;
                {getPointLocationFromIntersection(startMeasurePoint).distanceTo(getPointLocationFromIntersection(endMeasurePoint)).toFixed(3)} metres
              </div>
            }
          </div>
        </div>
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

    this.setState(prevState => {
      // Compiler automatically widens the type here, we don't want that.
      const measureData = prevState.measureData.slice() as [Intersection, Intersection];
      let isMeasuringMode = prevState.isMeasuringMode;

      if (prevState.isMeasuringMode) {
        // Is it the first or second point?
        if (measureData[0] === null) {
          measureData[0] = selectedPoint;
        }
        else {
          measureData[1] = selectedPoint;
          isMeasuringMode = false; // Finished measuring
        }
      }

      return {
        isMeasuringMode,
        measureData,
        selectedPoint,
        selectedPointColour: pointColour.getHexString()
      }
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
      colours.needsUpdate = true;

      this.viewer.setToUpdate();
    }
  }

  protected _toggleMeasuringMode = (): void => {
    if (this.state.isMeasuringMode) {
      this.setState({
        isMeasuringMode: false
      });
    }
    else {
      this.setState({
        isMeasuringMode: true,
        measureData: [null, null]
      });
    }
  }
}