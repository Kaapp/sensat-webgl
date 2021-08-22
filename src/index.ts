import { Viewer } from "./app/Viewer";
import * as ReactDOM from 'react-dom';
import React from "react";
import { Root } from "./ui/Root";

const SMALL_CLOUD_GLB = 'assets/small_cloud.glb';
const BIG_CLOUD_GLB = 'assets/big_cloud.glb';

const viewer = new Viewer(
  document.getElementById('viewer') as HTMLCanvasElement
);

viewer.loadModelAndDisplay(SMALL_CLOUD_GLB);
viewer.render();

ReactDOM.render(
  React.createElement(Root, { viewer }),
  document.getElementById('ui-root')
);